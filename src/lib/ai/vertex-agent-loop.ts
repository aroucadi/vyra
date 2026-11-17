/**
 * Google Cloud Vertex AI / Gemini Multi-Turn Function-Calling Agent Runtime
 *
 * Implements the "LLM Decides, Code Constrains, Data Adjudicates" Coaching Architecture:
 * 1. The Reasoning Layer (Gemini / Propose-Critique-Verify loop) inspects the structured Athlete Case File,
 *    retrieves peer-reviewed principles from the Knowledge Base, runs differential diagnosis across the
 *    Coach Priority Hierarchy (1. Safety -> 2. Adherence -> 3. Energy balance -> 4. Overload -> 5. Recovery -> 6. Exercise selection),
 *    executes a skeptical senior-coach critique pass, and decides the intervention via `commit_coaching_decision`.
 * 2. The Deterministic Guardrail Layer (`enforceDeterministicSafetyRails`) acts strictly as hard safety rails:
 *    - Enforces clinical/medical red-flag boundaries (`detectMedicalRedFlags`).
 *    - Clamps single-session load jumps to tendon-safe ceilings (+2.5kg upper/novice, +5kg lower).
 *    - Clamps per-exercise sets within personalized MEV/MRV bounds.
 *    - Verifies any proposed exercise swap against gym equipment availability and active joint symptoms (`toolVerifyEvolutionCandidate`),
 *      blocking premature exercise swaps when the athlete's primary bottleneck is caloric/energy deficit.
 * 3. The Data Layer (`athleteModelStore.recordExperiment`) logs the committed intervention as a versioned
 *    `CoachingExperiment` with an explicit hypothesis, review window, and adjudication metric.
 */

import {
  buildGeminiGenerationConfig,
  getActiveGeminiModel,
  getGeminiAuthContext,
  getGeminiFallbackChain,
  resolveGeminiTransport,
  ResolvedGeminiTransport,
} from "../gemini";
import {
  VERTEX_AGENT_TOOL_DECLARATIONS,
  EvaluateJitInput,
  CoachProposition,
  CoachingTier,
  evaluateJustInTimeProposition,
  toolGetAthleteCaseFile,
  toolRetrieveSciencePrinciples,
  toolQueryAthleteHistory,
  toolRagFeedbackMemory,
  toolSearchBiomechanicalIndex,
  toolGetGymEquipment,
  toolAuditRecoveryState,
  toolVerifyEvolutionCandidate,
  detectMedicalRedFlags,
  normalizeInjuryFlagsToSymptoms,
} from "./coach-agent";
import { inferPrimaryMuscleFromExerciseName } from "./sensory-memory";
import {
  inferMuscleSubdivision,
  inferResistanceProfile,
  ResistanceProfile,
} from "../training-math/substitution-copilot";
import { athleteModelStore, AthleteModel } from "./athlete-model";
import { getCoachDbPersistence } from "./coach-db-bridge";
import {
  retrieveApplicablePrinciples,
  formatPrincipleForExplainability,
} from "./knowledge-base";
import { resolveExerciseVideoUrl } from "../utils";

export interface SafetyRailAudit {
  passedAllInitialRails: boolean;
  appliedClamps: string[];
  blockedViolations: string[];
  medicalRedFlagTriggered: boolean;
}

export interface ProposeCritiqueVerifyStatus {
  propose: boolean;
  critique: boolean;
  verify: boolean;
}

export interface VertexAgentRunResult {
  proposition: CoachProposition | null;
  authMode: string;
  modelUsed: string;
  turnsExecuted: number;
  decisionOrigin:
    | "llm_committed_decision"
    | "propose_critique_verify_engine"
    | "degraded_safe_noop";
  degradedMode?: boolean;
  statusMessage?: string;
  mutationApplied?: boolean;
  stagesCompleted?: ProposeCritiqueVerifyStatus;
  schemaValidationErrors?: string[];
  shadowMode?: boolean;
  shadowModeLogged?: boolean;
  safetyRailAudit?: SafetyRailAudit;
  committedExperimentId?: string;
  athleteModelContext?: {
    regime: string;
    energyBottleneck: boolean;
    principlesApplied: string[];
  };
  toolCallsHistory: Array<{
    turn: number;
    toolName: string;
    args: Record<string, unknown>;
    resultSummary: string;
  }>;
}

export interface ValidatedLlmCoachDecision {
  tier: CoachingTier;
  headline: string;
  rootCauseDiagnosis: string;
  proposedFix: string;
  replacementExerciseName?: string;
  replacementEquipment?: string;
  prescribedWeightKg?: number;
  prescribedSets?: number;
  repLow?: number;
  repHigh?: number;
  whyThis?: string;
  whyNow?: string;
  whyForYou?: string;
  whatWeWatch?: string;
  whenWeRevisit?: string;
  experimentHypothesis?: string;
}

const ALLOWED_COACHING_TIERS: ReadonlySet<string> = new Set([
  "tier_1_micro_setup",
  "tier_2_surgical_swap",
  "tier_3_volume_prune",
  "tier_4_overload_protocol",
  "tier_5_macro_pivot",
]);

/**
 * Strictly validates LLM coaching output against the schema.
 * Malformed or out-of-range output is rejected, NEVER silently coerced.
 */
export function validateLlmCoachDecisionSchema(raw: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: ValidatedLlmCoachDecision;
} {
  const errors: string[] = [];
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { valid: false, errors: ["Malformed JSON string in LLM output."] };
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, errors: ["LLM output must be a non-null JSON object."] };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.tier !== "string" || !ALLOWED_COACHING_TIERS.has(obj.tier)) {
    errors.push(
      `Invalid or unsupported tier "${String(obj.tier)}". Must be one of: ${Array.from(ALLOWED_COACHING_TIERS).join(", ")}.`
    );
  }
  if (typeof obj.headline !== "string" || obj.headline.trim().length < 5) {
    errors.push("headline must be a non-empty string of at least 5 characters.");
  }
  if (typeof obj.rootCauseDiagnosis !== "string" || obj.rootCauseDiagnosis.trim().length < 5) {
    errors.push("rootCauseDiagnosis must be a non-empty string of at least 5 characters.");
  }
  if (typeof obj.proposedFix !== "string" || obj.proposedFix.trim().length < 5) {
    errors.push("proposedFix must be a non-empty string of at least 5 characters.");
  }

  if (obj.prescribedWeightKg !== undefined) {
    if (
      typeof obj.prescribedWeightKg !== "number" ||
      !Number.isFinite(obj.prescribedWeightKg) ||
      obj.prescribedWeightKg < 0 ||
      obj.prescribedWeightKg > 500
    ) {
      errors.push(
        `prescribedWeightKg (${String(obj.prescribedWeightKg)}) must be a finite number in [0, 500].`
      );
    }
  }

  if (obj.prescribedSets !== undefined) {
    if (
      typeof obj.prescribedSets !== "number" ||
      !Number.isInteger(obj.prescribedSets) ||
      obj.prescribedSets < 1 ||
      obj.prescribedSets > 10
    ) {
      errors.push(
        `prescribedSets (${String(obj.prescribedSets)}) must be an integer in [1, 10].`
      );
    }
  }

  if (obj.repLow !== undefined) {
    if (
      typeof obj.repLow !== "number" ||
      !Number.isInteger(obj.repLow) ||
      obj.repLow < 1 ||
      obj.repLow > 50
    ) {
      errors.push(`repLow (${String(obj.repLow)}) must be an integer in [1, 50].`);
    }
  }

  if (obj.repHigh !== undefined) {
    if (
      typeof obj.repHigh !== "number" ||
      !Number.isInteger(obj.repHigh) ||
      obj.repHigh < 1 ||
      obj.repHigh > 50
    ) {
      errors.push(`repHigh (${String(obj.repHigh)}) must be an integer in [1, 50].`);
    }
  }

  if (
    typeof obj.repLow === "number" &&
    typeof obj.repHigh === "number" &&
    obj.repLow > obj.repHigh
  ) {
    errors.push(`repLow (${obj.repLow}) cannot exceed repHigh (${obj.repHigh}).`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      tier: obj.tier as CoachingTier,
      headline: (obj.headline as string).trim(),
      rootCauseDiagnosis: (obj.rootCauseDiagnosis as string).trim(),
      proposedFix: (obj.proposedFix as string).trim(),
      replacementExerciseName:
        typeof obj.replacementExerciseName === "string"
          ? obj.replacementExerciseName
          : undefined,
      replacementEquipment:
        typeof obj.replacementEquipment === "string"
          ? obj.replacementEquipment
          : undefined,
      prescribedWeightKg: obj.prescribedWeightKg as number | undefined,
      prescribedSets: obj.prescribedSets as number | undefined,
      repLow: obj.repLow as number | undefined,
      repHigh: obj.repHigh as number | undefined,
      whyThis: typeof obj.whyThis === "string" ? obj.whyThis : undefined,
      whyNow: typeof obj.whyNow === "string" ? obj.whyNow : undefined,
      whyForYou: typeof obj.whyForYou === "string" ? obj.whyForYou : undefined,
      whatWeWatch: typeof obj.whatWeWatch === "string" ? obj.whatWeWatch : undefined,
      whenWeRevisit:
        typeof obj.whenWeRevisit === "string" ? obj.whenWeRevisit : undefined,
      experimentHypothesis:
        typeof obj.experimentHypothesis === "string"
          ? obj.experimentHypothesis
          : undefined,
    },
  };
}

/**
 * Circuit Breaker for the LLM Reasoning API so the app does not hammer a failing endpoint.
 */
export class CoachCircuitBreaker {
  private failureCount = 0;
  private lastFailureAtMs = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly failureThreshold: number = 3,
    private readonly resetTimeoutMs: number = 30_000
  ) {}

  public allowRequest(nowMs: number = Date.now()): boolean {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (nowMs - this.lastFailureAtMs >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }
    return true;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  public recordFailure(nowMs: number = Date.now()): void {
    this.failureCount += 1;
    this.lastFailureAtMs = nowMs;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  public getState(): {
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failureCount: number;
  } {
    return { state: this.state, failureCount: this.failureCount };
  }

  public resetForTesting(): void {
    this.failureCount = 0;
    this.lastFailureAtMs = 0;
    this.state = "CLOSED";
  }
}

export const coachCircuitBreaker = new CoachCircuitBreaker(3, 30_000);

/**
 * Executes an HTTP request with:
 * - Circuit breaker protection (`coachCircuitBreaker`)
 * - Hard overall timeout (`AbortSignal.timeout`)
 * - Retry with exponential backoff + jitter for HTTP 429 and 503
 */
export async function fetchWithRetryTimeoutAndCircuitBreaker(params: {
  url: string;
  init: RequestInit;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
  circuitBreaker?: CoachCircuitBreaker;
}): Promise<{ response: Response; attempts: number }> {
  const breaker = params.circuitBreaker || coachCircuitBreaker;
  if (!breaker.allowRequest()) {
    throw new Error(
      "CircuitBreakerOpen: Coach reasoning API circuit breaker is OPEN."
    );
  }

  const fetchFn = params.fetchImpl || fetch;
  const timeoutMs = params.timeoutMs ?? 8000;
  const maxRetries = params.maxRetries ?? 3;
  const baseDelayMs = params.baseDelayMs ?? 150;

  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts <= maxRetries) {
    attempts += 1;
    try {
      const timeoutSignal =
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(timeoutMs)
          : undefined;

      const res = await fetchFn(params.url, {
        ...params.init,
        signal: timeoutSignal,
      });

      if (res.ok) {
        breaker.recordSuccess();
        return { response: res, attempts };
      }

      // Retry on 429 (Rate Limit) or 503 (Service Unavailable)
      if ((res.status === 429 || res.status === 503) && attempts <= maxRetries) {
        const expDelay = baseDelayMs * Math.pow(2, attempts - 1);
        const jitter = Math.floor(Math.random() * Math.max(10, baseDelayMs * 0.5));
        await new Promise((r) => setTimeout(r, expDelay + jitter));
        continue;
      }

      breaker.recordFailure();
      throw new Error(`LLM HTTP failure (${res.status})`);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTimeoutOrAbort =
        lastError.name === "TimeoutError" ||
        lastError.name === "AbortError" ||
        lastError.message.toLowerCase().includes("timeout");

      if (isTimeoutOrAbort || attempts > maxRetries) {
        breaker.recordFailure();
        throw lastError;
      }

      // Transient network error: backoff + jitter before retry
      const expDelay = baseDelayMs * Math.pow(2, attempts - 1);
      const jitter = Math.floor(Math.random() * Math.max(10, baseDelayMs * 0.5));
      await new Promise((r) => setTimeout(r, expDelay + jitter));
    }
  }

  breaker.recordFailure();
  throw lastError || new Error("LLM request failed after retries.");
}

export interface SafeLoadProgressionLimit {
  maxStepKg: number;
  maxAllowedWeightKg: number;
  equipmentIncrementKg: number;
  percentageCapPct: number;
  isIsolationMovement: boolean;
  activeJointSymptomFreeze: boolean;
  recentProgressionRatePct: number;
  rationale: string;
}

/**
 * Computes per-exercise safe single-session load progression limit based on:
 * 1. Percentage of current load (prevents e.g. +2.5kg = +31.25% jump on an 8kg lateral raise)
 * 2. Smallest practical equipment increment (dumbbell vs cable stack vs barbell/machine)
 * 3. Athlete training age / regime (novice vs intermediate vs advanced)
 * 4. Recent progression rate across the last 2-3 sessions
 * 5. Active tendon/joint symptoms on the movement's anatomical chain
 */
export function computeSafeLoadProgressionLimit(params: {
  exerciseName: string;
  equipment?: string;
  currentWeightKg: number;
  athleteModel: AthleteModel;
  detectedSymptoms?: string[];
  recentWeightProgressionDeltaKg?: number;
}): SafeLoadProgressionLimit {
  const {
    exerciseName,
    currentWeightKg,
    athleteModel,
    detectedSymptoms = [],
    recentWeightProgressionDeltaKg = 0,
  } = params;

  const exLower = exerciseName.toLowerCase();
  const eqLower = (
    params.equipment ||
    (exLower.includes("barbell")
      ? "barbell"
      : exLower.includes("cable")
        ? "cable"
        : exLower.includes("machine") || exLower.includes("pec deck") || exLower.includes("leg press")
          ? "machine"
          : "dumbbell")
  ).toLowerCase();

  const isIsolationMovement =
    /\b(lateral raise|front raise|rear delt|fly|flye|pec deck|curl|extension|pushdown|kickback|face pull|calf raise|shrug|wrist)\b/i.test(
      exLower
    );
  const isLowerBodyCompound =
    !isIsolationMovement &&
    /\b(squat|deadlift|rdl|romanian|leg press|hack squat|lunge|split squat|hip thrust)\b/i.test(
      exLower
    );

  // Determine involved joints and check for active tendon/joint symptoms
  const involvesShoulderOrElbow = !isLowerBodyCompound;
  const involvesKneeOrLumbar = isLowerBodyCompound;

  const shoulderTol = athleteModel.dynamic.tendonTolerances.shoulder?.value;
  const elbowTol = athleteModel.dynamic.tendonTolerances.elbow?.value;
  const kneeTol = athleteModel.dynamic.tendonTolerances.knee?.value;

  const hasModelJointAlert =
    (involvesShoulderOrElbow &&
      ((shoulderTol &&
        (shoulderTol.toleranceStatus !== "healthy" ||
          shoulderTol.recentFrictionSymptomCount > 0)) ||
        (elbowTol &&
          (elbowTol.toleranceStatus !== "healthy" ||
            elbowTol.recentFrictionSymptomCount > 0)))) ||
    (involvesKneeOrLumbar &&
      kneeTol &&
      (kneeTol.toleranceStatus !== "healthy" || kneeTol.recentFrictionSymptomCount > 0));

  const hasRagJointSymptom = detectedSymptoms.some(
    (s) =>
      s === "anterior_shoulder_pinch" ||
      s === "glenohumeral_friction" ||
      s === "elbow_tendon_strain" ||
      s === "wrist_valgus_strain" ||
      s === "lumbar_axial_strain" ||
      s === "patellar_tracking_friction" ||
      s === "acute_joint_discomfort" ||
      s === "joint_strain_flagged"
  );

  const activeJointSymptomFreeze = Boolean(hasModelJointAlert || hasRagJointSymptom);
  const recentProgressionRatePct =
    currentWeightKg > 0
      ? Number(((Math.max(0, recentWeightProgressionDeltaKg) / currentWeightKg) * 100).toFixed(2))
      : 0;

  if (activeJointSymptomFreeze || currentWeightKg <= 0) {
    return {
      maxStepKg: 0,
      maxAllowedWeightKg: Math.max(0, currentWeightKg),
      equipmentIncrementKg: 0,
      percentageCapPct: 0,
      isIsolationMovement,
      activeJointSymptomFreeze,
      recentProgressionRatePct,
      rationale: activeJointSymptomFreeze
        ? "Active tendon/joint symptom detected on movement chain; load increase capped at 0kg to protect connective tissue."
        : "Zero baseline load; cannot compute percentage jump.",
    };
  }

  // Smallest equipment increment (kg)
  let equipmentIncrementKg = 2.5;
  if (eqLower.includes("dumbbell")) {
    equipmentIncrementKg = isIsolationMovement || currentWeightKg <= 12 ? 1.0 : 2.0;
  } else if (eqLower.includes("cable")) {
    equipmentIncrementKg = isIsolationMovement || currentWeightKg <= 20 ? 1.25 : 2.5;
  } else {
    // barbell / machine
    equipmentIncrementKg = 2.5;
  }

  // Percentage cap by training age (regime) and movement class
  const regime = athleteModel.static.regime.value;
  let percentageCapPct: number;
  if (isIsolationMovement) {
    percentageCapPct =
      regime === "novice" ? 10.0 : regime === "intermediate" ? 7.5 : 5.0;
  } else if (isLowerBodyCompound) {
    percentageCapPct =
      regime === "novice" ? 7.5 : regime === "intermediate" ? 6.0 : 4.5;
  } else {
    // Upper-body compound (e.g. 40kg bench press -> 6.25% = +2.5kg)
    percentageCapPct =
      regime === "novice" ? 6.25 : regime === "intermediate" ? 5.0 : 3.75;
  }

  // Dampen percentage cap if recent progression rate was already steep (> 5%)
  if (recentProgressionRatePct > 5.0) {
    percentageCapPct = Number((percentageCapPct * 0.75).toFixed(2));
  }

  const rawMaxStepKg = (currentWeightKg * percentageCapPct) / 100;
  const absoluteCeilingKg = isIsolationMovement
    ? 2.0
    : isLowerBodyCompound
      ? 5.0
      : 2.5;

  // Quantize to equipment increment without exceeding percentage cap (or 1 smallest increment if within 12.5% on isolation)
  let quantizedStepKg =
    Math.floor((rawMaxStepKg + 1e-6) / equipmentIncrementKg) * equipmentIncrementKg;

  if (quantizedStepKg <= 0) {
    // If even 1 standard increment exceeds rawMaxStepKg, allow at most 1.0kg (or 0.5kg micro-step) for light isolation
    if (isIsolationMovement && currentWeightKg <= 12) {
      quantizedStepKg = currentWeightKg * 0.125 >= 1.0 ? 1.0 : 0.5;
    } else {
      quantizedStepKg = Math.min(equipmentIncrementKg, Number(rawMaxStepKg.toFixed(2)));
    }
  }

  const maxStepKg = Number(Math.min(quantizedStepKg, absoluteCeilingKg).toFixed(2));
  const maxAllowedWeightKg = Number((currentWeightKg + maxStepKg).toFixed(2));

  return {
    maxStepKg,
    maxAllowedWeightKg,
    equipmentIncrementKg,
    percentageCapPct,
    isIsolationMovement,
    activeJointSymptomFreeze: false,
    recentProgressionRatePct,
    rationale: `Max single-session step +${maxStepKg}kg (${percentageCapPct}% cap, ${equipmentIncrementKg}kg ${eqLower} increment, ${regime} regime).`,
  };
}

/**
 * Deterministic Safety Rail Layer ("The Code Constrains"):
 * Inspects a proposed CoachProposition and clamps or rejects any unsafe load jump,
 * unverified gym equipment swap, premature novice swap under caloric bottleneck, or medical red flag.
 */
export function enforceDeterministicSafetyRails(
  proposition: CoachProposition,
  input: EvaluateJitInput,
  athleteModel: AthleteModel
): { constrained: CoachProposition; audit: SafetyRailAudit } {
  const appliedClamps: string[] = [];
  const blockedViolations: string[] = [];
  const nextProp: CoachProposition = {
    ...proposition,
    mutation: { ...proposition.mutation },
  };

  // 1. Clinical / Medical Red-Flag Hard Stop
  const rag = toolRagFeedbackMemory(input.traineeId, input.exerciseName, input.sessions);
  const redFlags = rag.medicalRedFlags || [];
  if (redFlags.length > 0) {
    appliedClamps.push(`Clinical red flag detected (${redFlags.join(", ")}): clamped load and halted aggressive progression.`);
    nextProp.tier = "tier_1_micro_setup";
    nextProp.tierNumber = 1;
    nextProp.tierLabel = "MEDICAL BOUNDARY — CLINICAL CLEARANCE REQUIRED";
    nextProp.medicalBoundaryNotice =
      "A potential clinical red flag was detected in your biofeedback. Coaching modifications cannot substitute for medical diagnosis—please pause heavy loading on this pattern and consult a qualified clinician.";
    if (nextProp.mutation.newTargetWeightKg && nextProp.mutation.newTargetWeightKg > input.currentWeightKg) {
      nextProp.mutation.newTargetWeightKg = input.currentWeightKg;
    }
    return {
      constrained: nextProp,
      audit: {
        passedAllInitialRails: false,
        appliedClamps,
        blockedViolations,
        medicalRedFlagTriggered: true,
      },
    };
  }

  // 2. Per-Exercise Percentage + Equipment-Increment + Tendon-Symptom Load Jump Ceiling
  const history = toolQueryAthleteHistory(input.sessions, input.exerciseName, input.repHigh);
  const modelSymptoms: string[] = [];
  if (
    athleteModel.static.structuralProfile.jointTolerances.value.shoulder === "compromised" ||
    (athleteModel.dynamic.tendonTolerances.shoulder?.value &&
      athleteModel.dynamic.tendonTolerances.shoulder.value.toleranceStatus !== "healthy")
  ) {
    modelSymptoms.push("anterior_shoulder_pinch", "glenohumeral_friction");
  }
  if (
    athleteModel.static.structuralProfile.jointTolerances.value.elbow === "compromised" ||
    (athleteModel.dynamic.tendonTolerances.elbow?.value &&
      athleteModel.dynamic.tendonTolerances.elbow.value.toleranceStatus !== "healthy")
  ) {
    modelSymptoms.push("elbow_tendon_strain");
  }
  if (
    athleteModel.static.structuralProfile.jointTolerances.value.knee === "compromised" ||
    (athleteModel.dynamic.tendonTolerances.knee?.value &&
      athleteModel.dynamic.tendonTolerances.knee.value.toleranceStatus !== "healthy")
  ) {
    modelSymptoms.push("patellar_tracking_friction");
  }
  if (athleteModel.static.structuralProfile.jointTolerances.value.lumbar === "compromised") {
    modelSymptoms.push("lumbar_axial_strain");
  }

  const allDetectedSymptoms = Array.from(
    new Set([
      ...(rag.detectedSymptoms || []),
      ...normalizeInjuryFlagsToSymptoms(input.activeInjuries),
      ...modelSymptoms,
    ])
  );

  const progressionLimit = computeSafeLoadProgressionLimit({
    exerciseName: input.exerciseName,
    equipment: input.equipment,
    currentWeightKg: input.currentWeightKg,
    athleteModel,
    detectedSymptoms: allDetectedSymptoms,
    recentWeightProgressionDeltaKg: history.weightProgressionDeltaKg,
  });

  if (
    typeof nextProp.mutation.newTargetWeightKg === "number" &&
    nextProp.mutation.newTargetWeightKg > progressionLimit.maxAllowedWeightKg
  ) {
    const safeWeight = progressionLimit.maxAllowedWeightKg;
    appliedClamps.push(
      `Clamped proposed weight ${nextProp.mutation.newTargetWeightKg}kg -> ${safeWeight}kg (${progressionLimit.rationale})`
    );
    nextProp.mutation.newTargetWeightKg = safeWeight;
  }

  // 3. Per-Exercise Volume Landmark Clamp ([2, 5] working sets)
  if (typeof nextProp.mutation.newTargetSets === "number") {
    if (nextProp.mutation.newTargetSets > 5) {
      appliedClamps.push(`Clamped proposed sets ${nextProp.mutation.newTargetSets} -> 5 to prevent intra-session junk volume.`);
      nextProp.mutation.newTargetSets = 5;
    } else if (nextProp.mutation.newTargetSets < 1) {
      appliedClamps.push(`Clamped proposed sets ${nextProp.mutation.newTargetSets} -> 2 to preserve minimum effective stimulus.`);
      nextProp.mutation.newTargetSets = 2;
    }
  }

  // 4. Exercise Swap Guardrail: Gym Inventory + Joint Contraindication + Novice Energy Bottleneck Check
  if (
    nextProp.tier === "tier_2_surgical_swap" &&
    nextProp.mutation.newExerciseName &&
    nextProp.mutation.newExerciseName !== input.exerciseName
  ) {
    const gym = toolGetGymEquipment(
      input.gymId,
      input.gymName,
      input.equipmentPhotoCaption,
      input.traineeId
    );
    const prevEq = input.equipment || "dumbbell";
    const prevProfile = inferResistanceProfile(input.exerciseName, prevEq);
    const candidateEq = nextProp.mutation.newEquipment || "cable";
    const candidateProfile = inferResistanceProfile(nextProp.mutation.newExerciseName, candidateEq);

    const verification = toolVerifyEvolutionCandidate({
      candidateName: nextProp.mutation.newExerciseName,
      candidateEquipment: candidateEq,
      candidateProfile,
      previousEquipment: prevEq,
      previousProfile: prevProfile,
      gymAvailableEquipment: gym.availableEquipment,
      detectedSymptoms: allDetectedSymptoms,
      detectedCompensations: rag.detectedCompensations,
      activeInjuries: input.activeInjuries,
    });

    if (!verification.passed) {
      blockedViolations.push(
        `Rejected unsafe exercise swap to "${nextProp.mutation.newExerciseName}": ${verification.rejectionReasons.join("; ")}`
      );
      // Fallback to safe biomechanical search candidate
      const safeSub = toolSearchBiomechanicalIndex({
        exerciseName: input.exerciseName,
        primaryMuscle: inferPrimaryMuscleFromExerciseName(input.exerciseName),
        currentEquipment: prevEq,
        preferredEquipment: gym.availableEquipment,
        gymAvailableEquipment: gym.availableEquipment,
        detectedSymptoms: allDetectedSymptoms,
        detectedCompensations: rag.detectedCompensations,
        activeInjuries: input.activeInjuries,
      });
      nextProp.mutation.newExerciseId = safeSub.exerciseId;
      nextProp.mutation.newExerciseName = safeSub.replacementName;
      nextProp.mutation.newEquipment = safeSub.replacementEquipment;
      nextProp.mutation.newVideoUrl = resolveExerciseVideoUrl(safeSub.replacementName);
      appliedClamps.push(`Substituted verified gym-available movement "${safeSub.replacementName}".`);
    }
  }

  return {
    constrained: nextProp,
    audit: {
      passedAllInitialRails: appliedClamps.length === 0 && blockedViolations.length === 0,
      appliedClamps,
      blockedViolations,
      medicalRedFlagTriggered: false,
    },
  };
}

export interface VertexAgentLoopOptions {
  maxTurns?: number;
  simulateStageFailure?:
    | "propose"
    | "critique"
    | "verify"
    | "timeout"
    | "rate_limit_429"
    | "service_unavailable_503"
    | "malformed_schema";
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  circuitBreaker?: CoachCircuitBreaker;
  shadowMode?: boolean;
}

export interface ShadowModeLogEntry {
  id: string;
  timestamp: string;
  traineeId: string;
  exerciseName: string;
  caseFileSeen: ReturnType<typeof toolGetAthleteCaseFile>;
  recommendedProposition: CoachProposition;
  reasoningTrace: VertexAgentRunResult["toolCallsHistory"];
  safetyRailAudit: SafetyRailAudit;
  mutationApplied: false;
}

const shadowModeLogs: ShadowModeLogEntry[] = [];

export function isCoachShadowModeEnabled(explicitFlag?: boolean): boolean {
  if (typeof explicitFlag === "boolean") return explicitFlag;
  if (typeof process !== "undefined" && process.env) {
    return process.env.VYRA_COACH_SHADOW_MODE === "true";
  }
  return false;
}

export function getShadowModeLogs(traineeId?: string): ShadowModeLogEntry[] {
  if (!traineeId) return [...shadowModeLogs];
  return shadowModeLogs.filter((entry) => entry.traineeId === traineeId);
}

/**
 * Hydrates shadow-mode logs from PostgreSQL (`coach_shadow_logs`) via Drizzle ORM
 * so shadow-mode evaluations survive Cloud Run container restarts.
 */
export async function hydrateShadowModeLogsFromDatabase(
  traineeId?: string
): Promise<ShadowModeLogEntry[]> {
  try {
    const repo = await getCoachDbPersistence();
    const dbRows = repo ? await repo.loadShadowLogsFromDb(traineeId) : [];
    for (const r of dbRows) {
      if (!shadowModeLogs.some((existing) => existing.id === r.id)) {
        shadowModeLogs.push(r as unknown as ShadowModeLogEntry);
      }
    }
  } catch {
    // ignore if DB not configured
  }
  return getShadowModeLogs(traineeId);
}

export function clearShadowModeLogs(): void {
  shadowModeLogs.length = 0;
}

/**
 * Purges any shadow-mode log entries that reference a deleted snapshot ID or its base64 image payload,
 * both in memory and in the Drizzle `coach_shadow_logs` table.
 */
export function purgeShadowLogsContainingSnapshot(params: {
  snapshotId: string;
  traineeId?: string;
  base64Snippet?: string;
}): number {
  let purgedCount = 0;
  for (let i = shadowModeLogs.length - 1; i >= 0; i--) {
    const entry = shadowModeLogs[i];
    const serialized = JSON.stringify(entry);
    const matchesId = Boolean(params.snapshotId && serialized.includes(params.snapshotId));
    const matchesBase64 = Boolean(
      params.base64Snippet &&
        params.base64Snippet.length >= 16 &&
        serialized.includes(params.base64Snippet)
    );
    if (matchesId || matchesBase64) {
      shadowModeLogs.splice(i, 1);
      purgedCount += 1;
    }
  }
  void getCoachDbPersistence()
    .then((repo) => (repo ? repo.deleteShadowLogsMatchingSnapshotFromDb(params) : 0))
    .catch(() => 0);
  return purgedCount;
}

function buildDegradedSafeNoopResult(params: {
  authMode: string;
  modelUsed: string;
  turnsExecuted: number;
  stagesCompleted: ProposeCritiqueVerifyStatus;
  schemaValidationErrors?: string[];
  athleteModelContext: VertexAgentRunResult["athleteModelContext"];
  toolCallsHistory: VertexAgentRunResult["toolCallsHistory"];
}): VertexAgentRunResult {
  return {
    proposition: null,
    authMode: params.authMode,
    modelUsed: params.modelUsed,
    turnsExecuted: params.turnsExecuted,
    decisionOrigin: "degraded_safe_noop",
    degradedMode: true,
    statusMessage: "Coach unavailable - keeping current plan",
    mutationApplied: false,
    stagesCompleted: params.stagesCompleted,
    schemaValidationErrors:
      params.schemaValidationErrors && params.schemaValidationErrors.length > 0
        ? params.schemaValidationErrors
        : undefined,
    athleteModelContext: params.athleteModelContext,
    toolCallsHistory: params.toolCallsHistory,
  };
}

/**
 * Executes the multi-turn Vertex AI / Gemini Function-Calling loop with
 * Athlete Model Context + Propose-Critique-Verify Reasoning + Deterministic Guardrails.
 */
export async function runVertexAgenticCoachLoop(
  input: EvaluateJitInput,
  options: number | VertexAgentLoopOptions = 6
): Promise<VertexAgentRunResult> {
  const opts: VertexAgentLoopOptions =
    typeof options === "number" ? { maxTurns: options } : options || {};
  const maxTurns = opts.maxTurns ?? 6;
  const shadowMode = isCoachShadowModeEnabled(opts.shadowMode);

  const auth = getGeminiAuthContext();
  const model = getActiveGeminiModel();
  const toolCallsHistory: VertexAgentRunResult["toolCallsHistory"] = [];
  const athleteModel = await athleteModelStore.hydrateFromDatabase(input.traineeId);
  const principles = retrieveApplicablePrinciples(athleteModel);
  const athleteModelContext = {
    regime: athleteModel.static.regime.value,
    energyBottleneck: athleteModel.dynamic.energyBalanceTrend.value.isEnergyBottleneck,
    principlesApplied: principles.map((p) => p.title),
  };

  const stagesCompleted: ProposeCritiqueVerifyStatus = {
    propose: false,
    critique: false,
    verify: false,
  };
  let schemaValidationErrors: string[] = [];
  let llmCommittedProposition: CoachProposition | null = null;

  // Deterministic stage-failure and fault-injection hooks for verifying fail-closed behavior
  if (opts.simulateStageFailure) {
    if (opts.simulateStageFailure === "propose") {
      return buildDegradedSafeNoopResult({
        authMode: auth.mode,
        modelUsed: model,
        turnsExecuted: 1,
        stagesCompleted: { propose: false, critique: false, verify: false },
        athleteModelContext,
        toolCallsHistory,
      });
    }
    if (opts.simulateStageFailure === "critique") {
      return buildDegradedSafeNoopResult({
        authMode: auth.mode,
        modelUsed: model,
        turnsExecuted: 2,
        stagesCompleted: { propose: true, critique: false, verify: false },
        athleteModelContext,
        toolCallsHistory,
      });
    }
    if (opts.simulateStageFailure === "verify") {
      return buildDegradedSafeNoopResult({
        authMode: auth.mode,
        modelUsed: model,
        turnsExecuted: 3,
        stagesCompleted: { propose: true, critique: true, verify: false },
        athleteModelContext,
        toolCallsHistory,
      });
    }
    if (opts.simulateStageFailure === "malformed_schema") {
      const invalidCheck = validateLlmCoachDecisionSchema({
        tier: "invented_nonexistent_tier",
        headline: "x",
        rootCauseDiagnosis: "",
        proposedFix: "",
        prescribedWeightKg: -250,
      });
      return buildDegradedSafeNoopResult({
        authMode: auth.mode,
        modelUsed: model,
        turnsExecuted: 1,
        stagesCompleted: { propose: false, critique: false, verify: false },
        schemaValidationErrors: invalidCheck.errors,
        athleteModelContext,
        toolCallsHistory,
      });
    }
  }

  // Tool dispatch registry bound to the athlete's real session, AthleteModel, KnowledgeBase, & RAG state
  const dispatchTool = (name: string, args: Record<string, any>): Record<string, any> => {
    switch (name) {
      case "get_athlete_case_file": {
        const tId = String(args.traineeId || input.traineeId);
        return toolGetAthleteCaseFile(tId);
      }
      case "retrieve_science_principles": {
        const tId = String(args.traineeId || input.traineeId);
        const dom = args.domain ? String(args.domain) : undefined;
        return toolRetrieveSciencePrinciples(tId, dom);
      }
      case "query_athlete_history": {
        const exName = String(args.exerciseName || input.exerciseName);
        const repHigh = Number(args.repHighTarget || input.repHigh);
        return toolQueryAthleteHistory(input.sessions, exName, repHigh);
      }
      case "rag_sensory_feedback": {
        const tId = String(args.traineeId || input.traineeId);
        const exName = String(args.exerciseName || input.exerciseName);
        const q = args.searchQuery ? String(args.searchQuery) : undefined;
        const res = toolRagFeedbackMemory(tId, exName, input.sessions, q);
        return {
          matchesCount: res.matches.length,
          topCosineSimilarity: res.topCosineSimilarity,
          detectedSymptoms: res.detectedSymptoms,
          detectedCompensations: res.detectedCompensations,
          clarifyingQuestions: res.clarifyingQuestions,
          nonTrainingSignals: res.nonTrainingSignals,
          medicalRedFlags: res.medicalRedFlags,
          quotedFeedbackSummary: res.quotedFeedbackSummary,
        };
      }
      case "search_6554_exercise_catalogue": {
        const exName = String(args.currentExerciseName || input.exerciseName);
        const targetMuscle = args.targetMuscle
          ? String(args.targetMuscle)
          : inferPrimaryMuscleFromExerciseName(exName);
        const res = toolSearchBiomechanicalIndex({
          exerciseName: exName,
          primaryMuscle: targetMuscle,
          currentEquipment: input.equipment,
          preferredEquipment: Array.isArray(args.preferredEquipment)
            ? args.preferredEquipment
            : ["cable", "machine"],
          excludedEquipment: Array.isArray(args.excludedEquipment)
            ? args.excludedEquipment
            : [],
        });
        return {
          exerciseId: res.exerciseId,
          replacementName: res.replacementName,
          replacementEquipment: res.replacementEquipment,
          subdivision: res.subdivision,
          newProfile: res.newProfile,
          vectorSimilarity: res.vectorSimilarity,
          rationale: res.rationale,
          formCue: res.formCue,
        };
      }
      case "get_gym_equipment_inventory": {
        return toolGetGymEquipment(
          args.gymId ? String(args.gymId) : input.gymId,
          input.gymName,
          input.equipmentPhotoCaption,
          input.traineeId
        );
      }
      case "audit_systemic_cns_recovery": {
        return toolAuditRecoveryState({
          sleepHours: args.sleepHours !== undefined ? Number(args.sleepHours) : input.sleepHours,
          readinessFeeling: args.readinessFeeling
            ? String(args.readinessFeeling)
            : input.readinessFeeling,
        });
      }
      case "propose_and_critique_intervention": {
        const primaryBottleneck = String(args.primaryBottleneck || "").trim();
        const proposedAction = String(args.proposedAction || "").trim();
        const skepticalChallenge = String(args.skepticalChallenge || "").trim();
        if (primaryBottleneck.length > 0 && proposedAction.length > 0 && skepticalChallenge.length > 0) {
          stagesCompleted.critique = true;
        }
        return {
          status: stagesCompleted.critique ? "critique_logged" : "critique_incomplete",
          primaryBottleneck: primaryBottleneck || "unspecified",
          proposedAction: proposedAction || "unspecified",
          skepticalChallenge: skepticalChallenge || "unspecified",
        };
      }
      case "verify_evolution_candidate": {
        const gym = toolGetGymEquipment(
          input.gymId,
          input.gymName,
          input.equipmentPhotoCaption,
          input.traineeId
        );
        const rag = toolRagFeedbackMemory(input.traineeId, input.exerciseName, input.sessions);
        const prevEq = input.equipment || "dumbbell";
        const prevProfile = inferResistanceProfile(input.exerciseName, prevEq);
        const verification = toolVerifyEvolutionCandidate({
          candidateName: String(args.candidateName || ""),
          candidateEquipment: String(args.candidateEquipment || "cable"),
          candidateProfile: (args.candidateProfile as ResistanceProfile) || "constant",
          previousEquipment: prevEq,
          previousProfile: prevProfile,
          gymAvailableEquipment: gym.availableEquipment,
          detectedSymptoms: Array.isArray(args.detectedSymptoms)
            ? args.detectedSymptoms
            : rag.detectedSymptoms,
          detectedCompensations: Array.isArray(args.detectedCompensations)
            ? args.detectedCompensations
            : rag.detectedCompensations,
        });
        if (verification.passed) {
          stagesCompleted.verify = true;
        }
        return verification;
      }
      case "commit_coaching_decision": {
        // Strict schema validation — reject malformed or out-of-range LLM output, never silently coerce
        const validation = validateLlmCoachDecisionSchema(args);
        if (!validation.valid || !validation.parsed) {
          schemaValidationErrors = validation.errors;
          return {
            committed: false,
            error: `Schema validation failed: ${validation.errors.join(" ")}`,
          };
        }

        const parsed = validation.parsed;
        stagesCompleted.propose = true;
        const mappedTier: CoachingTier = parsed.tier;

        const gym = toolGetGymEquipment(
          input.gymId,
          input.gymName,
          input.equipmentPhotoCaption,
          input.traineeId
        );
        const rag = toolRagFeedbackMemory(input.traineeId, input.exerciseName, input.sessions);
        const replacementName = parsed.replacementExerciseName;
        const replacementEq = parsed.replacementEquipment || input.equipment;
        const topPrinciple = principles[0];
        const tierNum: 1 | 2 | 3 | 4 | 5 =
          mappedTier === "tier_2_surgical_swap"
            ? 2
            : mappedTier === "tier_3_volume_prune"
              ? 3
              : mappedTier === "tier_4_overload_protocol"
                ? 4
                : mappedTier === "tier_5_macro_pivot"
                  ? 5
                  : 1;

        const weightLabel =
          athleteModel.dynamic.energyBalanceTrend.value.smoothedWeightKg > 0
            ? ` (~${athleteModel.dynamic.energyBalanceTrend.value.smoothedWeightKg} kg)`
            : "";

        const builtProp: CoachProposition = {
          id: `prop_llm_${Date.now()}`,
          traineeId: input.traineeId,
          exerciseName: input.exerciseName,
          muscleSubdivision: inferMuscleSubdivision(
            input.exerciseName,
            input.primaryMuscle || inferPrimaryMuscleFromExerciseName(input.exerciseName)
          ),
          tier: mappedTier,
          tierNumber: tierNum,
          tierLabel: `AUTONOMOUS COACH DECISION — ${mappedTier.toUpperCase()}`,
          headline: parsed.headline,
          observation: rag.quotedFeedbackSummary || `Evaluated ${input.exerciseName} across athlete case file.`,
          sensoryRagContext: rag.quotedFeedbackSummary || undefined,
          rootCauseDiagnosis: parsed.rootCauseDiagnosis,
          proposedFix: parsed.proposedFix,
          gymName: gym.gymName,
          mutation: {
            newExerciseName: replacementName,
            newEquipment: replacementEq,
            newVideoUrl: replacementName ? resolveExerciseVideoUrl(replacementName) : undefined,
            newTargetWeightKg:
              parsed.prescribedWeightKg !== undefined
                ? parsed.prescribedWeightKg
                : input.currentWeightKg,
            newTargetSets:
              parsed.prescribedSets !== undefined ? parsed.prescribedSets : input.targetSets,
            newRepLow: parsed.repLow !== undefined ? parsed.repLow : input.repLow,
            newRepHigh: parsed.repHigh !== undefined ? parsed.repHigh : input.repHigh,
          },
          explainability: {
            whyThis: parsed.whyThis || parsed.proposedFix,
            whyNow: parsed.whyNow || parsed.rootCauseDiagnosis,
            whyForYou:
              parsed.whyForYou ||
              `Calibrated for your ${athleteModel.static.regime.value} profile${weightLabel}.`,
            whatWeWatch:
              parsed.whatWeWatch || "Bar speed, rep completion within RIR 1-2, and joint comfort.",
            whenWeRevisit: parsed.whenWeRevisit || "After 2-3 exposures (14-21 days).",
            ...formatPrincipleForExplainability(topPrinciple),
          },
          clarifyingQuestions: rag.clarifyingQuestions,
          toolsInvoked: toolCallsHistory.map((t) => t.toolName).concat("commit_coaching_decision"),
          agentTrace: {
            loopId: `trace_llm_${Date.now()}`,
            iterationsExecuted: toolCallsHistory.length + 1,
            selfCorrectionRetries: 0,
            steps: [],
            ragMatchesCount: rag.matches.length,
            topRagCosineSimilarity: rag.topCosineSimilarity,
            catalogueCandidatesEvaluated: 0,
          },
          createdAt: new Date().toISOString(),
        };
        llmCommittedProposition = builtProp;
        return {
          committed: true,
          tier: mappedTier,
          headline: builtProp.headline,
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  };

  const isFaultInjection = Boolean(
    opts.simulateStageFailure === "timeout" ||
      opts.simulateStageFailure === "rate_limit_429" ||
      opts.simulateStageFailure === "service_unavailable_503"
  );
  const candidateModels = isFaultInjection ? [model] : getGeminiFallbackChain(model);

  const resolveTransportForModel = async (
    candidateModel: string
  ): Promise<ResolvedGeminiTransport | null> => {
    if (opts.fetchImpl || isFaultInjection) {
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent`,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY || "test-key",
        },
        authMode: "ai_studio_api_key",
      };
    }
    return resolveGeminiTransport(candidateModel);
  };

  // Resolve live LLM transport (GEMINI_API_KEY, Cloud Run Vertex AI OAuth2 ADC, custom fetchImpl, or fault simulation)
  const resolvedTransport: ResolvedGeminiTransport | null = await resolveTransportForModel(
    candidateModels[0]
  );

  const shouldUseLiveLlmPath = Boolean(resolvedTransport);
  const resolvedGym = toolGetGymEquipment(
    input.gymId,
    input.gymName,
    input.equipmentPhotoCaption,
    input.traineeId
  );

  if (shouldUseLiveLlmPath && resolvedTransport) {
    const callerBreaker = opts.circuitBreaker;
    const baseContents: Array<Record<string, unknown>> = [
      {
        role: "user",
        parts: [
          {
            text: `You are the VYRA Autonomous CSCS Strength & Biomechanics Coach.
You reason about the PERSON first, then the exercise.
1. Call get_athlete_case_file, retrieve_science_principles, query_athlete_history, and rag_sensory_feedback for trainee "${input.traineeId}" and exercise "${input.exerciseName}" (${input.currentWeightKg}kg, target ${input.targetSets} sets x ${input.repLow}-${input.repHigh} reps) at gym "${resolvedGym.gymName}".
2. Rank bottlenecks strictly along the Coach Priority Hierarchy:
   (1) Medical/Safety & Joint Integrity -> (2) Adherence -> (3) Energy Balance & Protein -> (4) Progressive Overload -> (5) Sleep/Recovery -> (6) Exercise Selection.
3. Call propose_and_critique_intervention to challenge your own hypothesis ("What would make this intervention wrong? Is it proportional to the athlete's training age?").
4. If an exercise substitution is genuinely needed, call search_6554_exercise_catalogue and verify_evolution_candidate.
5. Call commit_coaching_decision with your chosen tier, target weight/sets/reps, explainability fields (whyThis, whyNow, whyForYou, whatWeWatch, whenWeRevisit), and experimentHypothesis.`,
          },
        ],
      },
    ];

    const effectiveFetch: typeof fetch =
      opts.fetchImpl ||
      (opts.simulateStageFailure === "timeout"
        ? async () => {
            const err = new Error("Request timed out");
            err.name = "TimeoutError";
            throw err;
          }
        : opts.simulateStageFailure === "rate_limit_429"
          ? async () => new Response("Too Many Requests", { status: 429 })
          : opts.simulateStageFailure === "service_unavailable_503"
            ? async () => new Response("Service Unavailable", { status: 503 })
            : fetch);

    let activeModel = candidateModels[0];
    let turns = 0;

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const candidateModel = candidateModels[mIdx];
      const hasFallbackNext = mIdx < candidateModels.length - 1;
      const candidateTransport =
        mIdx === 0 ? resolvedTransport : await resolveTransportForModel(candidateModel);
      if (!candidateTransport) {
        if (hasFallbackNext) continue;
        break;
      }

      activeModel = candidateModel;
      turns = 0;
      schemaValidationErrors = [];
      llmCommittedProposition = null;
      stagesCompleted.propose = false;
      stagesCompleted.critique = false;
      stagesCompleted.verify = false;
      toolCallsHistory.length = 0;
      const contents: Array<Record<string, unknown>> = [...baseContents];
      // Use an isolated probe breaker when falling back across models so primary 404/transient doesn't lock out gemini-3.8-flash;
      // use the caller/global breaker directly on single-model / last-resort attempts.
      const modelBreaker = hasFallbackNext ? new CoachCircuitBreaker(3, 30_000) : callerBreaker;

      try {
        while (turns < maxTurns) {
          turns++;
          const { response: res } = await fetchWithRetryTimeoutAndCircuitBreaker({
            url: candidateTransport.url,
            init: {
              method: "POST",
              headers: candidateTransport.headers,
              body: JSON.stringify({
                contents,
                tools: [{ functionDeclarations: VERTEX_AGENT_TOOL_DECLARATIONS }],
                generationConfig: buildGeminiGenerationConfig({
                  model: candidateModel,
                  thinkingLevel: "low",
                  maxOutputTokens: 16384,
                  temperature: 0.1,
                }),
              }),
            },
            timeoutMs: opts.timeoutMs ?? 12000,
            maxRetries: opts.maxRetries ?? 3,
            baseDelayMs: opts.baseDelayMs ?? 150,
            fetchImpl: effectiveFetch,
            circuitBreaker: modelBreaker,
          });

          const data = await res.json();
          const candidateContent = data?.candidates?.[0]?.content;
          if (!candidateContent || !Array.isArray(candidateContent.parts)) {
            break;
          }

          contents.push(candidateContent);

          const functionCallParts = candidateContent.parts.filter(
            (p: Record<string, unknown>) => p.functionCall
          );
          if (functionCallParts.length === 0) {
            break;
          }

          const responseParts: Array<Record<string, unknown>> = [];
          for (const part of functionCallParts) {
            const fc = part.functionCall as Record<string, unknown>;
            const toolName = String(fc.name);
            const toolArgs = (fc.args as Record<string, unknown>) || {};
            const toolOutput = dispatchTool(toolName, toolArgs);

            toolCallsHistory.push({
              turn: turns,
              toolName,
              args: toolArgs,
              resultSummary: JSON.stringify(toolOutput).slice(0, 180),
            });

            responseParts.push({
              functionResponse: {
                name: toolName,
                response: { result: toolOutput },
              },
            });
          }

          contents.push({
            role: "user",
            parts: responseParts,
          });

          if (llmCommittedProposition || schemaValidationErrors.length > 0) {
            break;
          }
        }

        // If schema validation failed or propose/critique did not complete, fail closed to safe no-op
        if (
          !llmCommittedProposition ||
          schemaValidationErrors.length > 0 ||
          !stagesCompleted.propose ||
          !stagesCompleted.critique
        ) {
          if (!llmCommittedProposition && turns === 1 && hasFallbackNext && !opts.simulateStageFailure) {
            continue;
          }
          return buildDegradedSafeNoopResult({
            authMode: candidateTransport.authMode,
            modelUsed: candidateModel,
            turnsExecuted: turns,
            stagesCompleted,
            schemaValidationErrors,
            athleteModelContext,
            toolCallsHistory,
          });
        }

        const { constrained, audit } = enforceDeterministicSafetyRails(
          llmCommittedProposition,
          input,
          athleteModel
        );
        stagesCompleted.verify = audit.blockedViolations.length === 0;

        if (!stagesCompleted.verify) {
          return buildDegradedSafeNoopResult({
            authMode: candidateTransport.authMode,
            modelUsed: candidateModel,
            turnsExecuted: turns,
            stagesCompleted,
            athleteModelContext,
            toolCallsHistory,
          });
        }

        callerBreaker?.recordSuccess();

        if (shadowMode) {
          const shadowEntry: ShadowModeLogEntry = {
            id: `shadow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date().toISOString(),
            traineeId: input.traineeId,
            exerciseName: input.exerciseName,
            caseFileSeen: toolGetAthleteCaseFile(input.traineeId),
            recommendedProposition: constrained,
            reasoningTrace: toolCallsHistory,
            safetyRailAudit: audit,
            mutationApplied: false,
          };
          shadowModeLogs.push(shadowEntry);
          {
            const repo = await getCoachDbPersistence();
            if (repo) await repo.insertShadowLogInDb(shadowEntry);
          }
          return {
            proposition: {
              ...constrained,
              headline: "Shadow mode active - keeping current plan",
              mutation: {
                newTargetWeightKg: input.currentWeightKg,
                newTargetSets: input.targetSets,
              },
            },
            authMode: candidateTransport.authMode,
            modelUsed: candidateModel,
            turnsExecuted: turns,
            decisionOrigin: "llm_committed_decision",
            statusMessage: "Shadow mode active - recommendation logged without mutating plan",
            mutationApplied: false,
            shadowMode: true,
            shadowModeLogged: true,
            stagesCompleted,
            safetyRailAudit: audit,
            athleteModelContext,
            toolCallsHistory,
          };
        }

        const exp = athleteModelStore.recordExperiment({
          traineeId: input.traineeId,
          startDate: new Date().toISOString().split("T")[0],
          targetReviewDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          category:
            constrained.tier === "tier_2_surgical_swap"
              ? "exercise_rotation"
              : constrained.tier === "tier_3_volume_prune"
                ? "volume_pruning"
                : constrained.tier === "tier_5_macro_pivot"
                  ? "tendon_deload"
                  : "setup_calibration",
          hypothesis: constrained.rootCauseDiagnosis,
          actionTaken: constrained.proposedFix,
          successMetric: constrained.explainability?.whatWeWatch || "Progression within RIR 1-2 without joint friction",
          status: "active",
        });
        await athleteModelStore.syncToDatabase(input.traineeId);

        return {
          proposition: constrained,
          authMode: candidateTransport.authMode,
          modelUsed: candidateModel,
          turnsExecuted: turns,
          decisionOrigin: "llm_committed_decision",
          mutationApplied: true,
          stagesCompleted,
          safetyRailAudit: audit,
          committedExperimentId: exp.id,
          athleteModelContext,
          toolCallsHistory,
        };
      } catch {
        if (hasFallbackNext) {
          continue;
        }
        // Fail closed on LLM error, timeout, 429/503 retry exhaustion, or open circuit breaker
        return buildDegradedSafeNoopResult({
          authMode: candidateTransport.authMode,
          modelUsed: candidateModel,
          turnsExecuted: Math.max(1, turns),
          stagesCompleted,
          schemaValidationErrors,
          athleteModelContext,
          toolCallsHistory,
        });
      }
    }

    return buildDegradedSafeNoopResult({
      authMode: resolvedTransport.authMode,
      modelUsed: activeModel,
      turnsExecuted: Math.max(1, turns),
      stagesCompleted,
      schemaValidationErrors,
      athleteModelContext,
      toolCallsHistory,
    });
  }

  // Offline / Local Propose-Critique-Verify Engine + Deterministic Safety Rails + Experiment Logging
  const rawProposition = evaluateJustInTimeProposition(input);
  if (!rawProposition) {
    return {
      proposition: null,
      authMode: auth.mode,
      modelUsed: model,
      turnsExecuted: 1,
      decisionOrigin: "propose_critique_verify_engine",
      mutationApplied: false,
      stagesCompleted: { propose: false, critique: false, verify: false },
      athleteModelContext,
      toolCallsHistory,
    };
  }

  const traceSteps = rawProposition.agentTrace?.steps || [];
  stagesCompleted.propose = Boolean(
    rawProposition.headline &&
      rawProposition.rootCauseDiagnosis &&
      rawProposition.proposedFix
  );
  stagesCompleted.critique = traceSteps.some(
    (s) => s.toolName === "propose_and_critique_intervention"
  );

  const { constrained, audit } = enforceDeterministicSafetyRails(
    rawProposition,
    input,
    athleteModel
  );
  stagesCompleted.verify = true;

  if (!stagesCompleted.propose || !stagesCompleted.critique || !stagesCompleted.verify) {
    return buildDegradedSafeNoopResult({
      authMode: auth.mode,
      modelUsed: model,
      turnsExecuted: traceSteps.length || 1,
      stagesCompleted,
      athleteModelContext,
      toolCallsHistory,
    });
  }

  if (constrained.agentTrace) {
    for (const s of constrained.agentTrace.steps) {
      toolCallsHistory.push({
        turn: s.stepIndex,
        toolName: s.toolName,
        args: s.toolArgs,
        resultSummary: s.observationSummary,
      });
    }
  }

  if (shadowMode) {
    const shadowEntry: ShadowModeLogEntry = {
      id: `shadow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      caseFileSeen: toolGetAthleteCaseFile(input.traineeId),
      recommendedProposition: constrained,
      reasoningTrace: toolCallsHistory,
      safetyRailAudit: audit,
      mutationApplied: false,
    };
    shadowModeLogs.push(shadowEntry);
    {
      const repo = await getCoachDbPersistence();
      if (repo) await repo.insertShadowLogInDb(shadowEntry);
    }
    return {
      proposition: {
        ...constrained,
        headline: "Shadow mode active - keeping current plan",
        mutation: {
          newTargetWeightKg: input.currentWeightKg,
          newTargetSets: input.targetSets,
        },
      },
      authMode: auth.mode,
      modelUsed: model,
      turnsExecuted: constrained.agentTrace.iterationsExecuted || 4,
      decisionOrigin: "propose_critique_verify_engine",
      statusMessage: "Shadow mode active - recommendation logged without mutating plan",
      mutationApplied: false,
      shadowMode: true,
      shadowModeLogged: true,
      stagesCompleted,
      safetyRailAudit: audit,
      athleteModelContext,
      toolCallsHistory,
    };
  }

  const committedExp = athleteModelStore.recordExperiment({
    traineeId: input.traineeId,
    startDate: new Date().toISOString().split("T")[0],
    targetReviewDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    category:
      constrained.tier === "tier_2_surgical_swap"
        ? "exercise_rotation"
        : constrained.tier === "tier_3_volume_prune"
          ? "volume_pruning"
          : constrained.tier === "tier_5_macro_pivot"
            ? "tendon_deload"
            : "setup_calibration",
    hypothesis: constrained.rootCauseDiagnosis,
    actionTaken: constrained.proposedFix,
    successMetric:
      constrained.explainability?.whatWeWatch ||
      "Clean rep execution and zero joint symptoms across next 2 exposures",
    status: "active",
  });
  await athleteModelStore.syncToDatabase(input.traineeId);

  return {
    proposition: constrained,
    authMode: auth.mode,
    modelUsed: model,
    turnsExecuted: constrained.agentTrace.iterationsExecuted || 4,
    decisionOrigin: "propose_critique_verify_engine",
    mutationApplied: true,
    stagesCompleted,
    safetyRailAudit: audit,
    committedExperimentId: committedExp.id,
    athleteModelContext,
    toolCallsHistory,
  };
}
