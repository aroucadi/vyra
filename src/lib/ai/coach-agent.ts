/**
 * Autonomous Agentic AI Coach & 5-Tier Self-Evolving Program Engine
 *
 * Architecture (Zero-Wrapper, Authentic Agentic System):
 * 1. Multi-Step ReAct Reasoning Loop (Thought -> Tool Call -> Observation -> Reflection)
 * 2. Full 6,554-Exercise OpenGym Catalogue RAG + 64-D Vector Cosine Similarity Search (Zero Hardcoded Dictionary Override)
 * 3. Live Gym Vision Equipment Inventory & Trainee Equipment Photo Integration
 * 4. Multilingual Text & Transcribed Audio Voice Note RAG Ingestion
 * 5. Exception-Based Just-In-Time (JIT) Pre-Set Trigger Gate (Never Systematic)
 */

import { WorkoutSession, ExerciseBiofeedbackTag } from "../types";
import {
  inferMuscleSubdivision,
  inferResistanceProfile,
  findBiomechanicalSubstitutes,
  MuscleSubdivision,
  ResistanceProfile,
} from "../training-math/substitution-copilot";
import { loadSafeExerciseCatalogue } from "./catalogue-bridge";
import { RagExercise } from "@/types/exercise-rag";
import {
  sensoryMemoryStore,
  inferPrimaryMuscleFromExerciseName,
  extractTranscriptFromAudioDataUri,
  SensoryRagMatch,
} from "./sensory-memory";
import { gymVisionInventoryStore } from "./gym-vision-inventory";
import { computeBiomechanicalEmbedding, cosineSimilarity } from "./vector-engine";
import { resolveExerciseVideoUrl } from "../utils";
import { athleteModelStore, TrainingRegime } from "./athlete-model";
import {
  COACHING_KNOWLEDGE_BASE,
  retrieveApplicablePrinciples,
  formatPrincipleForExplainability,
  isPrincipleHumanReviewed,
  EvidenceRating,
} from "./knowledge-base";
import {
  parseSymptomsFromTokenTable,
  extractStructuredSymptomsViaLlm,
  StructuredSymptomInput,
  ParsedSymptomAssessment,
} from "./symptom-nlu";

export {
  parseSymptomsFromTokenTable,
  extractStructuredSymptomsViaLlm,
  type StructuredSymptomInput,
  type ParsedSymptomAssessment,
};

export type CoachingTier =
  | "tier_1_micro_setup"
  | "tier_2_surgical_swap"
  | "tier_3_volume_prune"
  | "tier_4_overload_protocol"
  | "tier_5_macro_pivot";

export type CoachInterventionTier = CoachingTier;

export interface ProgramMutationSpec {
  newExerciseId?: string;
  newExerciseName?: string;
  newEquipment?: string;
  newVideoUrl?: string;
  newTargetSets?: number;
  newTargetWeightKg?: number;
  newRepLow?: number;
  newRepHigh?: number;
  newTargetRir?: number;
  newFormCue?: string;
  newLoadGuidance?: string;
}

export interface AgentLoopStep {
  stepIndex: number;
  thought: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  observationSummary: string;
  durationMs: number;
}

export interface CandidateVerificationResult {
  passed: boolean;
  candidateName: string;
  equipmentCompliant: boolean;
  symptomSafe: boolean;
  resistanceProfileUpgraded: boolean;
  rejectionReasons: string[];
}

export interface AgentExecutionTrace {
  loopId: string;
  iterationsExecuted: number;
  selfCorrectionRetries: number;
  steps: AgentLoopStep[];
  ragMatchesCount: number;
  topRagCosineSimilarity: number;
  catalogueCandidatesEvaluated: number;
  verificationResult?: CandidateVerificationResult;
}

export interface CoachExplainabilityContract {
  whyThis: string;
  whyNow: string;
  whyForYou: string;
  whatWeWatch: string;
  whenWeRevisit: string;
  plainLanguagePrinciple?: string;
  citedPrincipleId?: string;
  citedPrincipleTitle?: string;
  evidenceRating?: EvidenceRating;
  showEvidenceBadge?: boolean;
}

export interface CoachProposition {
  id: string;
  traineeId: string;
  exerciseName: string;
  muscleSubdivision: MuscleSubdivision;
  tier: CoachingTier;
  tierNumber: 1 | 2 | 3 | 4 | 5;
  tierLabel: string;
  headline: string;
  observation: string;
  sensoryRagContext?: string;
  rootCauseDiagnosis: string;
  proposedFix: string;
  gymName: string;
  mutation: ProgramMutationSpec;
  explainability?: CoachExplainabilityContract;
  clarifyingQuestions?: string[];
  uncertaintyNotes?: string[];
  medicalBoundaryNotice?: string;
  toolsInvoked: string[];
  agentTrace: AgentExecutionTrace;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// VERTEX AI / GEMINI NATIVE FUNCTION DECLARATIONS SCHEMA
// ----------------------------------------------------------------------------
export const VERTEX_AGENT_TOOL_DECLARATIONS = [
  {
    name: "get_athlete_case_file",
    description:
      "Retrieves the versioned Athlete Model (training age, regime, structural profile, joint tolerances, energy balance bottleneck state, adherence reality, and provenance confidence notes).",
    parameters: {
      type: "OBJECT",
      properties: {
        traineeId: { type: "STRING" },
      },
      required: ["traineeId"],
    },
  },
  {
    name: "retrieve_science_principles",
    description:
      "Retrieves peer-reviewed sports science principles from the versioned Knowledge Base with explicit evidence ratings (strong, moderate, emerging, practitioner_consensus).",
    parameters: {
      type: "OBJECT",
      properties: {
        traineeId: { type: "STRING" },
        domain: { type: "STRING" },
      },
      required: ["traineeId"],
    },
  },
  {
    name: "query_athlete_history",
    description:
      "Audits the athlete's 28-day workout log stream for a specific exercise to compute progression deltas, consecutive stall sessions, and intra-session rep drop-off ratios.",
    parameters: {
      type: "OBJECT",
      properties: {
        exerciseName: { type: "STRING", description: "Name of the exercise to audit" },
        repHighTarget: { type: "NUMBER", description: "Upper bound of prescribed rep bracket" },
      },
      required: ["exerciseName"],
    },
  },
  {
    name: "rag_sensory_feedback",
    description:
      "Executes 64-D Vector Cosine Similarity retrieval over the athlete's historical multimodal biofeedback vault (emoji tags, free text, equipment photos, and transcribed French/Darija/English voice memos normalized into CSCS biomechanical entities with temporal recency decay).",
    parameters: {
      type: "OBJECT",
      properties: {
        traineeId: { type: "STRING" },
        exerciseName: { type: "STRING" },
        searchQuery: { type: "STRING" },
      },
      required: ["traineeId", "exerciseName"],
    },
  },
  {
    name: "search_6554_exercise_catalogue",
    description:
      "Queries the 6,554-movement OpenGym biomechanical index using muscular subdivision, resistance profile constraints, symptom relief, and 64-D vector similarity.",
    parameters: {
      type: "OBJECT",
      properties: {
        currentExerciseName: { type: "STRING" },
        targetMuscle: { type: "STRING" },
        preferredEquipment: { type: "ARRAY", items: { type: "STRING" } },
        excludedEquipment: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["currentExerciseName"],
    },
  },
  {
    name: "get_gym_equipment_inventory",
    description:
      "Retrieves the physical equipment inventory and photographed machine stations available at the athlete's active salle de sport.",
    parameters: {
      type: "OBJECT",
      properties: {
        gymId: { type: "STRING" },
      },
      required: ["gymId"],
    },
  },
  {
    name: "audit_systemic_cns_recovery",
    description:
      "Evaluates rolling sleep duration, subjective readiness state, and systemic central nervous system fatigue.",
    parameters: {
      type: "OBJECT",
      properties: {
        sleepHours: { type: "NUMBER" },
        readinessFeeling: { type: "STRING" },
      },
    },
  },
  {
    name: "propose_and_critique_intervention",
    description:
      "Executes a differential diagnosis across the Coach Priority Hierarchy (1. Safety -> 2. Adherence -> 3. Energy balance -> 4. Overload -> 5. Recovery -> 6. Exercise selection) and runs a skeptical senior coach critique pass before committing any decision.",
    parameters: {
      type: "OBJECT",
      properties: {
        primaryBottleneck: { type: "STRING" },
        proposedAction: { type: "STRING" },
        costOfChange: { type: "STRING" },
        skepticalChallenge: { type: "STRING" },
      },
      required: ["primaryBottleneck", "proposedAction"],
    },
  },
  {
    name: "verify_evolution_candidate",
    description:
      "Autonomous Guardrail Evaluator: Verifies a proposed exercise or volume evolution against gym equipment inventory, RAG joint symptoms, tendon load rate caps, and resistance profile requirements. Returns rejection reasons if unsafe.",
    parameters: {
      type: "OBJECT",
      properties: {
        candidateName: { type: "STRING" },
        candidateEquipment: { type: "STRING" },
        candidateProfile: { type: "STRING" },
        detectedSymptoms: { type: "ARRAY", items: { type: "STRING" } },
        detectedCompensations: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["candidateName", "candidateEquipment"],
    },
  },
  {
    name: "commit_coaching_decision",
    description:
      "Commits the final coaching decision after completing differential diagnosis, skeptical critique, and guardrail verification. The reasoning layer chooses the intervention tier, prescription parameters, explainability contract, and experiment hypothesis.",
    parameters: {
      type: "OBJECT",
      properties: {
        tier: {
          type: "STRING",
          description:
            "tier1_progression | tier2_volume_optimization | tier3_exercise_swap | tier4_recovery_pivot | tier5_setup_calibration | tier0_medical_boundary",
        },
        headline: { type: "STRING" },
        prescribedWeightKg: { type: "NUMBER" },
        prescribedSets: { type: "NUMBER" },
        repLow: { type: "NUMBER" },
        repHigh: { type: "NUMBER" },
        replacementExerciseName: { type: "STRING" },
        replacementEquipment: { type: "STRING" },
        rootCauseDiagnosis: { type: "STRING" },
        proposedFix: { type: "STRING" },
        skepticalCritique: { type: "STRING" },
        whyThis: { type: "STRING" },
        whyNow: { type: "STRING" },
        whyForYou: { type: "STRING" },
        whatWeWatch: { type: "STRING" },
        whenWeRevisit: { type: "STRING" },
        experimentHypothesis: { type: "STRING" },
      },
      required: ["tier", "headline", "rootCauseDiagnosis", "proposedFix"],
    },
  },
];

export interface AthleteExerciseHistoryReport {
  exerciseName: string;
  sessionsLoggedCount: number;
  comparableSessionsCount?: number;
  stagnantSessionsCount: number;
  isPlateaued: boolean;
  latestWeightKg: number;
  latestReps: number;
  weightProgressionDeltaKg: number;
  maxSetRepDropoffRatio: number;
  hasJunkVolumeFatigue: boolean;
  hitRepCeilingCount: number;
  consecutiveRepCeilingCount?: number;
}

export interface GymEquipmentProfile {
  gymId: string;
  gymName: string;
  availableEquipment: string[];
  confirmedEquipment?: string[];
  aiDetectedEquipment?: string[];
  uncertainDetections?: string[];
  unavailableEquipment?: string[];
  detectedStations: string[];
  limitations: string[];
  photosAnalyzedCount: number;
  cableTowersCount: number;
  maxDumbbellKg: number;
}

// ----------------------------------------------------------------------------
// AGENT TOOL 1: Query Athlete Exercise History (28-Day Window)
// ----------------------------------------------------------------------------
export function toolQueryAthleteHistory(
  sessions: WorkoutSession[],
  exerciseName: string,
  repHighTarget: number = 10,
  targetEquipment?: string
): AthleteExerciseHistoryReport {
  const needle = exerciseName.trim().toLowerCase();
  const matchingSessions = sessions.filter((s) =>
    s.setLogs?.some(
      (l) =>
        l.exerciseName.trim().toLowerCase() === needle &&
        !l.skipped &&
        !l.isDropSet &&
        l.reps > 0
    )
  );

  if (matchingSessions.length === 0) {
    return {
      exerciseName,
      sessionsLoggedCount: 0,
      comparableSessionsCount: 0,
      stagnantSessionsCount: 0,
      isPlateaued: false,
      latestWeightKg: 0,
      latestReps: 0,
      weightProgressionDeltaKg: 0,
      maxSetRepDropoffRatio: 0,
      hasJunkVolumeFatigue: false,
      hitRepCeilingCount: 0,
      consecutiveRepCeilingCount: 0,
    };
  }

  const ordered = [...matchingSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const sessionMaxes: Array<{
    weight: number;
    reps: number;
    dropoffRatio: number;
    equipment?: string;
  }> = [];

  for (const sess of ordered) {
    const allLogs = sess.setLogs.filter(
      (l) =>
        l.exerciseName.trim().toLowerCase() === needle &&
        !l.isDropSet &&
        !l.skipped &&
        l.reps > 0
    );
    if (allLogs.length === 0) continue;

    // Filter to comparable equipment conditions if logs explicitly specify selectedEquipment
    const eqFiltered =
      targetEquipment && allLogs.some((l) => Boolean(l.selectedEquipment))
        ? allLogs.filter(
            (l) =>
              !l.selectedEquipment ||
              l.selectedEquipment.toLowerCase() === targetEquipment.toLowerCase()
          )
        : allLogs;

    if (eqFiltered.length === 0) continue;

    const maxWeight = Math.max(...eqFiltered.map((l) => l.weightKg));
    const maxRepsAtTop = Math.max(
      ...eqFiltered.filter((l) => l.weightKg === maxWeight).map((l) => l.reps)
    );

    const firstSetReps = eqFiltered[0].reps || 1;
    const lastSetReps = eqFiltered[eqFiltered.length - 1].reps || firstSetReps;
    const dropoffRatio =
      eqFiltered.length >= 3 && firstSetReps > 0
        ? Math.max(0, (firstSetReps - lastSetReps) / firstSetReps)
        : 0;

    sessionMaxes.push({
      weight: maxWeight,
      reps: maxRepsAtTop,
      dropoffRatio,
      equipment: eqFiltered[0].selectedEquipment,
    });
  }

  if (sessionMaxes.length === 0) {
    return {
      exerciseName,
      sessionsLoggedCount: 0,
      comparableSessionsCount: 0,
      stagnantSessionsCount: 0,
      isPlateaued: false,
      latestWeightKg: 0,
      latestReps: 0,
      weightProgressionDeltaKg: 0,
      maxSetRepDropoffRatio: 0,
      hasJunkVolumeFatigue: false,
      hitRepCeilingCount: 0,
      consecutiveRepCeilingCount: 0,
    };
  }

  const first = sessionMaxes[0];
  const latest = sessionMaxes[sessionMaxes.length - 1];
  const weightProgressionDeltaKg = Number((latest.weight - first.weight).toFixed(2));

  // Count consecutive sessions at the tail where neither load nor reps progressed
  let stagnantSessionsCount = 1;
  for (let i = sessionMaxes.length - 1; i > 0; i--) {
    const curr = sessionMaxes[i];
    const prev = sessionMaxes[i - 1];
    // Comparable equipment check if logged
    if (curr.equipment && prev.equipment && curr.equipment !== prev.equipment) {
      break;
    }
    if (curr.weight <= prev.weight && curr.reps <= prev.reps) {
      stagnantSessionsCount++;
    } else {
      break;
    }
  }

  // Count consecutive sessions at the tail reaching the upper end of the prescribed rep range
  let consecutiveRepCeilingCount = 0;
  for (let i = sessionMaxes.length - 1; i >= 0; i--) {
    const curr = sessionMaxes[i];
    if (curr.equipment && latest.equipment && curr.equipment !== latest.equipment) {
      break;
    }
    if (curr.reps >= repHighTarget && curr.weight >= latest.weight) {
      consecutiveRepCeilingCount++;
    } else {
      break;
    }
  }

  // A genuine plateau requires >= 3 stagnant sessions AND NOT consistently clearing the rep ceiling
  const isPlateaued = stagnantSessionsCount >= 3 && consecutiveRepCeilingCount < 2;

  const maxSetRepDropoffRatio = Math.max(...sessionMaxes.map((m) => m.dropoffRatio), 0);

  return {
    exerciseName,
    sessionsLoggedCount: sessionMaxes.length,
    comparableSessionsCount: sessionMaxes.length,
    stagnantSessionsCount,
    isPlateaued,
    latestWeightKg: latest.weight,
    latestReps: latest.reps,
    weightProgressionDeltaKg,
    maxSetRepDropoffRatio: Number(maxSetRepDropoffRatio.toFixed(2)),
    hasJunkVolumeFatigue: maxSetRepDropoffRatio >= 0.35,
    hitRepCeilingCount: consecutiveRepCeilingCount,
    consecutiveRepCeilingCount,
  };
}

export interface MultilingualSymptomParseResult {
  symptoms: string[];
  isAmbiguous: boolean;
  clarifyingQuestions: string[];
}

/**
 * Parses structured (`StructuredSymptomInput`) or free-form trainee injury/symptom strings
 * across English, French, and Moroccan Darija using the clean Unicode word-token table
 * in `src/lib/ai/symptom-nlu.ts` (zero 400-character regex walls).
 */
export function parseMultilingualSymptomsWithClarification(
  injuries?: Array<string | StructuredSymptomInput>
): MultilingualSymptomParseResult {
  const parsed = parseSymptomsFromTokenTable(injuries);
  return {
    symptoms: parsed.symptoms,
    isAmbiguous: parsed.isAmbiguous,
    clarifyingQuestions: parsed.clarifyingQuestions,
  };
}

/**
 * Normalizes structured or free-form trainee injury strings into canonical biomechanical symptom tokens
 * using strict word-boundary token matching (never brittle substring matching where "dos" matches "avocados"
 * or "disc" matches "discipline").
 */
export function normalizeInjuryFlagsToSymptoms(injuries?: string[]): string[] {
  return parseMultilingualSymptomsWithClarification(injuries).symptoms;
}

export interface MedicalRedFlagAssessment {
  hasRedFlag: boolean;
  redFlagsDetected: string[];
  triggers: string[];
  clinicalReferralMessage?: string;
  conservativeHoldDirective?: string;
}

/**
 * Evaluates clinical medical boundaries (Section 9).
 * The agent is a strength coach, not a clinician: radiating nerve pain, numbness/tingling,
 * chest pain/dizziness, acute structural pop/tear, or disordered eating flags immediately
 * trigger a "see a healthcare professional" referral and a conservative training hold,
 * never a creative workaround.
 */
export function detectMedicalRedFlags(
  params:
    | string[]
    | {
        injuries?: string[];
        notes?: string[];
        sensoryRedFlags?: string[];
      }
): MedicalRedFlagAssessment {
  const isArray = Array.isArray(params);
  const flags = new Set<string>(isArray ? [] : params.sensoryRedFlags || []);
  const combined = isArray
    ? params.join(" | ")
    : [...(params.injuries || []), ...(params.notes || [])].join(" | ");

  if (
    /\b(radiating|irradie|numb|numbness|tingling|fourmillement|engourdissement|electric shock|décharge électrique|sciatica down leg|loss of sensation|foot drop)\b/i.test(
      combined
    )
  ) {
    flags.add("radiating_nerve_pain_or_numbness");
  }
  if (
    /\b(chest pain|douleur thoracique|heart racing|palpitations|fainting|syncope|dizziness|vertige|shortness of breath at rest)\b/i.test(
      combined
    )
  ) {
    flags.add("cardiopulmonary_symptom");
  }
  if (
    /\b(audible pop|heard a pop|torn|rupture|déchirure|acute severe pain|joint locked| Rapid swelling)\b/i.test(
      combined
    )
  ) {
    flags.add("acute_structural_tear_or_lock");
  }
  if (
    /\b(purging|vomiting after meals|laxatives|starving myself|afraid to eat|eating disorder|anorexia|bulimia)\b/i.test(
      combined
    )
  ) {
    flags.add("disordered_eating_clinical_concern");
  }

  const redFlagsDetected = Array.from(flags);
  if (redFlagsDetected.length === 0) {
    return { hasRedFlag: false, redFlagsDetected: [], triggers: [] };
  }

  return {
    hasRedFlag: true,
    redFlagsDetected,
    triggers: redFlagsDetected,
    clinicalReferralMessage:
      "Clinical Boundary Notice: Your symptoms (" +
      redFlagsDetected.join(", ").replace(/_/g, " ") +
      ") fall outside strength coaching scope and require evaluation by a licensed physician or sports physical therapist before loading this pattern.",
    conservativeHoldDirective:
      "Pause loading on the affected chain immediately. Do not attempt exercise workarounds or through-pain sets until cleared by a clinician.",
  };
}

/**
 * Checks whether a specific exercise is biomechanically contraindicated for a cross-exercise
 * joint symptom or active trainee injury restriction (so a past shoulder/back/wrist/knee note
 * only triggers on a different exercise if that exercise actually stresses the irritated joint).
 */
export function isExerciseContraindicatedBySymptoms(
  exerciseName: string,
  equipment: string,
  symptoms: string[]
): boolean {
  if (symptoms.length === 0) return false;
  const n = exerciseName.toLowerCase();
  const eq = (equipment || "").toLowerCase();

  if (
    symptoms.includes("anterior_shoulder_pinch") ||
    symptoms.includes("glenohumeral_friction")
  ) {
    if (
      n.includes("upright row") ||
      n.includes("behind neck") ||
      n.includes("behind the neck") ||
      n.includes("barbell overhead") ||
      n.includes("military press") ||
      n.includes("dip") ||
      (eq.includes("dumbbell") && n.includes("lateral raise"))
    ) {
      return true;
    }
  }

  if (symptoms.includes("lumbar_axial_strain")) {
    if (
      n.includes("deadlift") ||
      n.includes("back squat") ||
      n.includes("bent-over") ||
      n.includes("bent over") ||
      n.includes("good morning") ||
      (eq.includes("barbell") && (n.includes("row") || n.includes("overhead")))
    ) {
      return true;
    }
  }

  if (symptoms.includes("patellar_tracking_friction")) {
    if (
      n.includes("sissy squat") ||
      n.includes("leg extension") ||
      n.includes("jump") ||
      n.includes("plyo") ||
      (eq.includes("barbell") && n.includes("squat") && !n.includes("box"))
    ) {
      return true;
    }
  }

  if (symptoms.includes("wrist_valgus_strain") || symptoms.includes("elbow_tendon_strain")) {
    if (
      n.includes("skull") ||
      (eq.includes("barbell") && !eq.includes("ez") && (n.includes("curl") || n.includes("press")))
    ) {
      return true;
    }
  }

  return false;
}

// ----------------------------------------------------------------------------
// AGENT TOOL 2: Query Sensory Feedback Memory RAG (Vector Cosine Similarity)
// ----------------------------------------------------------------------------
export function toolRagFeedbackMemory(
  traineeId: string,
  exerciseName: string,
  sessions: WorkoutSession[] = [],
  searchQuery?: string,
  currentEquipment: string = "dumbbell",
  activeInjuries: string[] = []
): {
  matches: SensoryRagMatch[];
  topCosineSimilarity: number;
  detectedSymptoms: string[];
  detectedCompensations: string[];
  positiveSignals: string[];
  nonTrainingSignals?: string[];
  medicalRedFlags?: string[];
  clarifyingQuestions?: string[];
  supplementaryMuscleContext: string[];
  hasJointPainOrPinch: boolean;
  hasTrapOrMomentumCompensation: boolean;
  hasHeavyFatigue: boolean;
  hasBalanceIssue: boolean;
  hasPositivePerformanceFeedback: boolean;
  hasExactExercisePainOrCompensation: boolean;
  hasContraindicatedCrossExerciseSymptom: boolean;
  hasExactExerciseHeavyFatigue: boolean;
  hasExactExerciseBalanceIssue: boolean;
  equipmentPhotosFound: string[];
  quotedFeedbackSummary?: string;
} {
  // Ensure historical session.exerciseFeedbacks (including audio transcripts & equipment photos) are indexed
  const existingIds = new Set(
    sensoryMemoryStore.getAllForTrainee(traineeId).map((e) => `${e.sessionId}_${e.exerciseName}`)
  );

  for (const sess of sessions) {
    if (!sess.exerciseFeedbacks) continue;
    for (const fb of sess.exerciseFeedbacks) {
      const key = `${sess.id}_${fb.exerciseName}`;
      if (!existingIds.has(key)) {
        const tags: ExerciseBiofeedbackTag[] = fb.tags || (fb.tag ? [fb.tag] : []);
        const audioTranscript =
          fb.audioTranscript || extractTranscriptFromAudioDataUri(fb.audioNoteUrl);
        sensoryMemoryStore.ingest({
          traineeId,
          sessionId: sess.id,
          date: sess.date,
          exerciseName: fb.exerciseName,
          tags,
          freeTextNote: fb.note,
          audioNoteUrl: fb.audioNoteUrl,
          audioTranscript,
          equipmentPhotoUrl: fb.photoUrl,
          gymId: sess.gymId,
          gymName: sess.gymName,
        });
        existingIds.add(key);
      }
    }
  }

  const primaryMuscle = inferPrimaryMuscleFromExerciseName(exerciseName);
  const muscleSubdivision = inferMuscleSubdivision(exerciseName, primaryMuscle);

  const matches = sensoryMemoryStore.queryRAG({
    traineeId,
    exerciseName,
    primaryMuscle,
    muscleSubdivision,
    searchQuery,
    limit: 5,
  });

  const exactSymptomsSet = new Set<string>();
  const exactCompensationsSet = new Set<string>();
  const crossSymptomsSet = new Set<string>(normalizeInjuryFlagsToSymptoms(activeInjuries));
  const positiveSignalsSet = new Set<string>();
  const nonTrainingSignalsSet = new Set<string>();
  const medicalRedFlagsSet = new Set<string>();
  const clarifyingQuestionsSet = new Set<string>();
  const supplementaryMuscleContext: string[] = [];
  const equipmentPhotosFound: string[] = [];

  let hasJointPainOrPinch = false;
  let hasTrapOrMomentumCompensation = false;
  let hasHeavyFatigue = false;
  let hasBalanceIssue = false;
  let hasPositivePerformanceFeedback = false;

  let hasExactExercisePainOrCompensation = false;
  let hasExactExerciseHeavyFatigue = false;
  let hasExactExerciseBalanceIssue = false;
  let exactQuotedSummary: string | undefined;
  let contraindicatedCrossQuotedSummary: string | undefined;

  for (const m of matches) {
    const e = m.entry;
    const isExact =
      m.isExactExerciseMatch ??
      e.exerciseName.trim().toLowerCase() === exerciseName.trim().toLowerCase();

    if (e.equipmentPhotoUrl) {
      equipmentPhotosFound.push(e.equipmentPhotoUrl);
    }

    for (const nt of e.biomechanicalEntities.nonTrainingSignals || []) {
      nonTrainingSignalsSet.add(nt);
    }
    for (const rf of e.biomechanicalEntities.medicalRedFlags || []) {
      medicalRedFlagsSet.add(rf);
    }
    for (const cq of e.biomechanicalEntities.clarifyingQuestions || []) {
      clarifyingQuestionsSet.add(cq);
    }

    // If an old symptom was superseded by a subsequent resolved session or decayed past reliability threshold, do not treat as active pain
    const isDecayedMinorDiscomfort =
      (m.temporalDecayWeight ?? 1.0) < 0.35 &&
      e.biomechanicalEntities.sensationCategory === "mild_discomfort";
    const isSupersededOrResolved =
      Boolean(m.isSupersededByResolution) ||
      e.biomechanicalEntities.symptomStatus === "resolved" ||
      isDecayedMinorDiscomfort;

    const entryHasPain =
      !isSupersededOrResolved &&
      (e.tags.includes("joint_strain") || e.biomechanicalEntities.symptoms.length > 0);
    const entryHasComp =
      !isSupersededOrResolved &&
      (e.biomechanicalEntities.compensations.includes("upper_trap_shrugging") ||
        e.biomechanicalEntities.compensations.includes("momentum_cheating") ||
        e.biomechanicalEntities.compensations.includes("anterior_delt_takeover"));
    const entryPositives = e.biomechanicalEntities.positiveSignals || [];

    if (isExact) {
      if (!isSupersededOrResolved) {
        for (const s of e.biomechanicalEntities.symptoms) {
          exactSymptomsSet.add(s);
        }
        for (const c of e.biomechanicalEntities.compensations) {
          exactCompensationsSet.add(c);
        }
      }
      for (const p of entryPositives) {
        positiveSignalsSet.add(p);
      }
      if (entryPositives.length > 0 || e.tags.includes("optimal") || e.tags.includes("light")) {
        hasPositivePerformanceFeedback = true;
      }
      if (entryHasPain) hasJointPainOrPinch = true;
      if (entryHasComp) hasTrapOrMomentumCompensation = true;
      if (e.tags.includes("heavy")) {
        hasHeavyFatigue = true;
        hasExactExerciseHeavyFatigue = true;
      }
      if (e.tags.includes("balance_issue")) {
        hasBalanceIssue = true;
        hasExactExerciseBalanceIssue = true;
      }
      if (entryHasPain || entryHasComp) {
        hasExactExercisePainOrCompensation = true;
      }
      if (!exactQuotedSummary && (e.rawTranscription || e.tags.length > 0)) {
        exactQuotedSummary = e.rawTranscription
          ? `On ${e.date} (${e.exerciseName}), you noted: "${e.rawTranscription}"`
          : `On ${e.date} (${e.exerciseName}), you flagged: ${e.tags.join(", ")}`;
      }
    } else {
      // Non-exact exercise: collect symptoms for contraindication check only if active and not superseded/decayed
      if (!isSupersededOrResolved) {
        for (const s of e.biomechanicalEntities.symptoms) {
          crossSymptomsSet.add(s);
        }
      }
      const noteDesc = e.rawTranscription || e.tags.join(", ");
      if (noteDesc) {
        supplementaryMuscleContext.push(`${e.exerciseName} (${e.date}): ${noteDesc}`);
      }
      if (
        !isSupersededOrResolved &&
        !contraindicatedCrossQuotedSummary &&
        e.biomechanicalEntities.symptoms.length > 0 &&
        isExerciseContraindicatedBySymptoms(
          exerciseName,
          currentEquipment,
          e.biomechanicalEntities.symptoms
        )
      ) {
        contraindicatedCrossQuotedSummary = e.rawTranscription
          ? `On ${e.date} (${e.exerciseName}), you noted: "${e.rawTranscription}"`
          : `On ${e.date} (${e.exerciseName}), you flagged: ${e.tags.join(", ")}`;
      }
    }
  }

  const hasContraindicatedCrossExerciseSymptom = isExerciseContraindicatedBySymptoms(
    exerciseName,
    currentEquipment,
    Array.from(crossSymptomsSet)
  );

  // Merge cross-exercise/active-injury symptoms ONLY when they biomechanically contraindicate the current exercise
  const effectiveSymptoms = new Set<string>(exactSymptomsSet);
  if (hasContraindicatedCrossExerciseSymptom) {
    for (const cs of crossSymptomsSet) {
      if (isExerciseContraindicatedBySymptoms(exerciseName, currentEquipment, [cs])) {
        effectiveSymptoms.add(cs);
      }
    }
    hasJointPainOrPinch = true;
  }

  const quotedFeedbackSummary =
    exactQuotedSummary ||
    (hasContraindicatedCrossExerciseSymptom ? contraindicatedCrossQuotedSummary : undefined);

  const topCosineSimilarity =
    matches.length > 0 ? Math.max(...matches.map((m) => m.cosineSimilarity)) : 0;

  return {
    matches,
    topCosineSimilarity,
    detectedSymptoms: Array.from(effectiveSymptoms),
    detectedCompensations: Array.from(exactCompensationsSet),
    positiveSignals: Array.from(positiveSignalsSet),
    nonTrainingSignals: Array.from(nonTrainingSignalsSet),
    medicalRedFlags: Array.from(medicalRedFlagsSet),
    clarifyingQuestions: Array.from(clarifyingQuestionsSet),
    supplementaryMuscleContext,
    hasJointPainOrPinch,
    hasTrapOrMomentumCompensation,
    hasHeavyFatigue,
    hasBalanceIssue,
    hasPositivePerformanceFeedback,
    hasExactExercisePainOrCompensation,
    hasContraindicatedCrossExerciseSymptom,
    hasExactExerciseHeavyFatigue,
    hasExactExerciseBalanceIssue,
    equipmentPhotosFound,
    quotedFeedbackSummary,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 3: Real 6,554-Exercise OpenGym Catalogue RAG + Biomechanical Resolver
// ----------------------------------------------------------------------------
export interface BiomechanicalSwapRecommendation {
  exerciseId?: string;
  replacementName: string;
  replacementEquipment: string;
  videoUrl?: string;
  subdivision: MuscleSubdivision;
  previousProfile: ResistanceProfile;
  newProfile: ResistanceProfile;
  vectorSimilarity: number;
  catalogueCandidatesCount: number;
  rationale: string;
  formCue: string;
  recommendedWeightScale: number;
  repLow: number;
  repHigh: number;
}

/**
 * Formats raw OpenGym catalogue exercise names into clean, readable athletic titles
 * and appends biomechanical setup modifiers when compensating for specific RAG symptoms.
 */
function formatOpenGymCandidateTitle(
  rawName: string,
  subdivision: MuscleSubdivision,
  equipment: string,
  detectedSymptoms: string[],
  detectedCompensations: string[]
): string {
  const titleCased = rawName
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  const lower = titleCased.toLowerCase();
  const eqLower = equipment.toLowerCase();

  if (
    subdivision === "deltoid_lateral" &&
    eqLower.includes("cable") &&
    !lower.includes("cuff") &&
    (detectedCompensations.includes("upper_trap_shrugging") ||
      detectedSymptoms.includes("anterior_shoulder_pinch") ||
      detectedSymptoms.includes("wrist_valgus_strain"))
  ) {
    return `${titleCased} (Wrist Cuff)`;
  }

  if (
    subdivision === "deltoid_posterior" &&
    eqLower.includes("cable") &&
    !lower.includes("supported") &&
    !lower.includes("reverse")
  ) {
    return `${titleCased} (Reverse Cable Fly)`;
  }

  return titleCased;
}

/**
 * Synthesizes an evidence-based CSCS form cue directly from the OpenGym exercise's
 * instructions array plus any active biomechanical compensation fixes.
 */
function synthesizeOpenGymFormCue(
  candidate: RagExercise,
  subdivision: MuscleSubdivision,
  detectedSymptoms: string[],
  detectedCompensations: string[]
): string {
  const instructions = (candidate.instructions || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const compCues: string[] = [];
  if (detectedCompensations.includes("upper_trap_shrugging")) {
    compCues.push("Depress scapulae before initiation and sweep outward to eliminate upper-trap takeover.");
  }
  if (detectedSymptoms.includes("anterior_shoulder_pinch")) {
    compCues.push("Work in a 30–45° scapular plane with controlled eccentric tempo to maximize subacromial clearance.");
  }
  if (detectedSymptoms.includes("lumbar_axial_strain")) {
    compCues.push("Keep torso braced against support pad to remove lumbar shear.");
  }
  if (detectedSymptoms.includes("wrist_valgus_strain")) {
    compCues.push("Maintain a neutral wrist alignment or use a wrist cuff attachment.");
  }

  if (instructions.length > 0) {
    const primaryInstruction = instructions.length > 1 ? instructions[1] : instructions[0];
    const clipped =
      primaryInstruction.length > 150
        ? `${primaryInstruction.slice(0, 147)}...`
        : primaryInstruction;
    return compCues.length > 0 ? `${clipped} ${compCues[0]}` : clipped;
  }

  if (compCues.length > 0) {
    return compCues.join(" ");
  }

  if (subdivision === "deltoid_posterior") {
    return "Sweep arms wide in horizontal abduction without pinching shoulder blades prematurely.";
  }
  if (subdivision === "deltoid_lateral") {
    return "Lead with elbows in the scapular plane and pause 1 second at peak abduction.";
  }
  return "Control the 3-second eccentric phase and pause 1 second in the lengthened stretch position.";
}

/**
 * Dynamic, evidence-grounded CSCS rationale and observation synthesizers.
 * Replaces static boilerplate copy with contextual athletic reasoning derived from:
 * - Trainee sensory transcripts & biofeedback tags
 * - Exact session dates, load vectors, and rep drop-off ratios
 * - Anatomical muscle subdivisions & resistance profile mechanics
 * - Actual gym station equipment constraints
 */

export function synthesizeDynamicProgressionRationale(params: {
  exerciseName: string;
  currentWeightKg: number;
  nextWeightKg: number;
  repLow: number;
  repHigh: number;
  targetRir: number;
  consecutiveSessions: number;
  latestReps: number;
  subdivision: MuscleSubdivision;
  regime?: TrainingRegime;
  sensoryQuotes?: string;
  positiveSignals?: string[];
}): {
  headline: string;
  observation: string;
  rootCauseDiagnosis: string;
  proposedFix: string;
  explainability: CoachExplainabilityContract;
} {
  const diffKg = Number((params.nextWeightKg - params.currentWeightKg).toFixed(1));
  const humanSub = params.subdivision.replace(/_/g, " ");
  const overloadPrinciple =
    COACHING_KNOWLEDGE_BASE.find((p) => p.id === "kb_tendon_adaptation_discrepancy") ||
    COACHING_KNOWLEDGE_BASE[0];
  const formattedOverload = formatPrincipleForExplainability(overloadPrinciple);
  const overloadPrefix = isPrincipleHumanReviewed(overloadPrinciple)
    ? `Principle cited (${overloadPrinciple.title}, evidence: ${overloadPrinciple.evidenceStrength}):`
    : `${overloadPrinciple.plainEnglishExplanation}`;

  const observationParts: string[] = [
    `Logged ${params.latestReps} reps at ${params.currentWeightKg}kg (top of your ${params.repLow}–${params.repHigh} rep range) across ${params.consecutiveSessions} consecutive sessions.`,
  ];
  if (params.positiveSignals && params.positiveSignals.length > 0) {
    observationParts.push(
      `Your session notes confirmed ${params.positiveSignals.join(" and ").replace(/_/g, " ")}.`
    );
  }

  const diagnosisParts: string[] = [
    `${overloadPrefix} You have consistently cleared the upper rep target on ${humanSub} with controlled form and zero joint friction, demonstrating readiness for a conservative load step that respects tendon remodeling rate.`,
  ];
  if (params.sensoryQuotes) {
    diagnosisParts.push(`Joint comfort confirmed in your logs: ${params.sensoryQuotes}.`);
  }

  return {
    headline: `Overload Protocol · Advance ${params.exerciseName} (+${diffKg}kg ➔ ${params.nextWeightKg}kg)`,
    observation: observationParts.join(" "),
    rootCauseDiagnosis: diagnosisParts.join(" "),
    proposedFix: `Increase working load from ${params.currentWeightKg}kg to ${params.nextWeightKg}kg (+${diffKg}kg). Aim for ${params.repLow}–${params.repHigh} clean reps at RIR ${params.targetRir} while keeping the same controlled tempo.`,
    explainability: {
      whyThis: `Step up by +${diffKg}kg to ${params.nextWeightKg}kg within your double-progression bracket.`,
      whyNow: `You hit ${params.latestReps} reps across ${params.consecutiveSessions} consecutive exposures without joint pain.`,
      whyForYou: `Calibrated for your ${params.regime || "novice"} regime so muscle strength progression does not outpace tendon remodeling.`,
      whatWeWatch: `Rep quality on Set 1–3 (staying >= ${params.repLow} reps at RIR ${params.targetRir}) and zero joint ache.`,
      whenWeRevisit: `After your next 2 sessions on ${params.exerciseName}.`,
      ...formattedOverload,
    },
  };
}

export function synthesizeDynamicVolumeOptimizationRationale(params: {
  exerciseName: string;
  currentSets: number;
  prunedSets: number;
  currentWeightKg: number;
  maxDropoffRatio: number;
  sensoryQuotes?: string;
  subdivision: MuscleSubdivision;
  regime?: TrainingRegime;
}): {
  headline: string;
  observation: string;
  rootCauseDiagnosis: string;
  proposedFix: string;
  explainability: CoachExplainabilityContract;
} {
  const dropPct = Math.round(params.maxDropoffRatio * 100);
  const humanSub = params.subdivision.replace(/_/g, " ");
  const volPrinciple =
    COACHING_KNOWLEDGE_BASE.find((p) => p.id === "kb_volume_diminishing_returns") ||
    COACHING_KNOWLEDGE_BASE[0];
  const formattedVol = formatPrincipleForExplainability(volPrinciple);
  const volPrefix = isPrincipleHumanReviewed(volPrinciple)
    ? `Principle cited (${volPrinciple.title}, evidence: ${volPrinciple.evidenceStrength}):`
    : `${volPrinciple.plainEnglishExplanation}`;

  const observation =
    dropPct >= 20
      ? `Intra-session rep drop-off: performance fell by ${dropPct}% between your first and final sets on ${params.exerciseName} (${params.currentSets} sets at ${params.currentWeightKg}kg).`
      : `High local fatigue logged on ${params.exerciseName} across ${params.currentSets} working sets.`;

  const diagnosisParts: string[] = [
    `${volPrefix} Volume-hypertrophy dose-response shows diminishing returns once intra-session reps drop by ${dropPct > 0 ? dropPct : 30}%+. Extra fatigued sets add recovery cost and joint wear without meaningful extra growth stimulus for ${humanSub}.`,
  ];
  if (params.sensoryQuotes) {
    diagnosisParts.push(`Your feedback noted: ${params.sensoryQuotes}.`);
  }

  return {
    headline: `Volume Pruning · Streamline ${params.exerciseName} (${params.currentSets} ➔ ${params.prunedSets} High-Quality Sets)`,
    observation,
    rootCauseDiagnosis: diagnosisParts.join(" "),
    proposedFix: `Reduce working sets from ${params.currentSets} to ${params.prunedSets} focused sets at ${params.currentWeightKg}kg, taking full rest between sets so every set stays in your effective rep range.`,
    explainability: {
      whyThis: `Trim 1 low-output set (${params.currentSets} ➔ ${params.prunedSets} sets) while keeping working load at ${params.currentWeightKg}kg.`,
      whyNow: `Your final set reps dropped by ${dropPct}% within the session, indicating local fatigue exceeded productive stimulus.`,
      whyForYou: `Matches your personalized recoverable volume landmark (${params.regime || "novice"} regime) so you recover in time for your next session.`,
      whatWeWatch: `Whether reps on Set ${params.prunedSets} hold within 1–2 reps of Set 1 over the next 2 weeks.`,
      whenWeRevisit: `In 2 weeks during your weekly meso review.`,
      ...formattedVol,
    },
  };
}

export function synthesizeDynamicRecoveryPivotRationale(params: {
  exerciseName: string;
  currentWeightKg: number;
  targetSets: number;
  targetRir: number;
  recoverySummary: string;
  sleepHours?: number;
  readinessFeeling?: string;
  subdivision: MuscleSubdivision;
  regime?: TrainingRegime;
}): {
  headline: string;
  observation: string;
  rootCauseDiagnosis: string;
  proposedFix: string;
  deloadWeightKg: number;
  deloadSets: number;
  deloadRir: number;
  explainability: CoachExplainabilityContract;
} {
  const deloadWeightKg = Math.max(2.5, Math.round((params.currentWeightKg * 0.9) / 2.5) * 2.5);
  const deloadSets = Math.max(2, params.targetSets - 1);
  const deloadRir = Math.min(4, params.targetRir + 2);
  const humanSub = params.subdivision.replace(/_/g, " ");
  const recPrinciple =
    COACHING_KNOWLEDGE_BASE.find((p) => p.id === "kb_proximity_to_failure_rir") ||
    COACHING_KNOWLEDGE_BASE[0];
  const formattedRec = formatPrincipleForExplainability(recPrinciple);
  const recPrefix = isPrincipleHumanReviewed(recPrinciple)
    ? `Principle cited (${recPrinciple.title}, evidence: ${recPrinciple.evidenceStrength}):`
    : `${recPrinciple.plainEnglishExplanation}`;

  const diagnosisParts: string[] = [
    `${recPrefix} On a low-recovery day, pushing heavy compound sets on ${humanSub} close to failure increases technique breakdown and joint strain without improving adaptation. Leaving ${deloadRir} reps in reserve maintains movement skill at a fraction of the fatigue cost.`,
    params.recoverySummary,
  ];

  return {
    headline: `Autoregulated Readiness Pivot · Modulate ${params.exerciseName}`,
    observation: params.recoverySummary,
    rootCauseDiagnosis: diagnosisParts.join(" "),
    proposedFix: `Adjust today's prescription to ${deloadSets} sets × ${deloadWeightKg}kg at RIR ${deloadRir} (~10% lighter and 3–4 reps shy of failure to keep crisp technique while under-recovered).`,
    deloadWeightKg,
    deloadSets,
    deloadRir,
    explainability: {
      whyThis: `Autoregulate today's load by -10% (${deloadWeightKg}kg) and trim to ${deloadSets} sets at RIR ${deloadRir}.`,
      whyNow: `${params.recoverySummary}`,
      whyForYou: `Protects your ${humanSub} and lower-back/joint tolerances on a low-readiness day without skipping the session.`,
      whatWeWatch: `Bar speed, technique crispness, and how you feel the morning after.`,
      whenWeRevisit: `Next session—return to normal working weight once sleep and readiness normalize.`,
      ...formattedRec,
    },
  };
}

export function synthesizeDynamicSetupCalibrationRationale(params: {
  exerciseName: string;
  subdivision: MuscleSubdivision;
  gymName?: string;
  sensoryQuotes?: string;
  detectedCompensations: string[];
  regime?: TrainingRegime;
}): {
  headline: string;
  observation: string;
  rootCauseDiagnosis: string;
  proposedFix: string;
  formCue: string;
  explainability: CoachExplainabilityContract;
} {
  const humanSub = params.subdivision.replace(/_/g, " ");
  const compText =
    params.detectedCompensations.length > 0
      ? params.detectedCompensations.join(", ").replace(/_/g, " ")
      : "balance and stability drift";
  const bioPrinciple =
    COACHING_KNOWLEDGE_BASE.find((p) => p.id === "kb_novelty_cost_of_change") ||
    COACHING_KNOWLEDGE_BASE[0];
  const formattedBio = formatPrincipleForExplainability(bioPrinciple);
  const bioPrefix = isPrincipleHumanReviewed(bioPrinciple)
    ? `Principle cited (${bioPrinciple.title}, evidence: ${bioPrinciple.evidenceStrength}):`
    : `${bioPrinciple.plainEnglishExplanation}`;

  const observation = `Stability and motor control friction (${compText}) noted during recent ${params.exerciseName} sets.`;
  const diagnosis = `${bioPrefix} Before swapping an exercise, the lowest-cost coaching fix is stabilizing the setup. Adding external torso support removes balance limitations so you can direct effort cleanly into ${humanSub}.`;

  const fix = params.gymName
    ? `At ${params.gymName}, use an external brace (incline bench pad or cable upright) to anchor your torso during ${params.exerciseName}.`
    : `Brace your non-working hand or chest against a stable pad to eliminate body swing during ${params.exerciseName}.`;

  const formCue = `Brace against external support pad to lock torso position and isolate ${humanSub} tension.`;

  return {
    headline: `Biomechanical Stability Anchor · Setup Fix for ${params.exerciseName}`,
    observation,
    rootCauseDiagnosis: diagnosis,
    proposedFix: fix,
    formCue,
    explainability: {
      whyThis: `Keep ${params.exerciseName} in your program and add an external stability brace before considering an exercise swap.`,
      whyNow: `You reported ${compText}, which is a setup stability issue rather than a bad exercise.`,
      whyForYou: `Preserves your movement skill and progression history while fixing the stability bottleneck.`,
      whatWeWatch: `Whether bracing eliminates ${compText} on your working sets today.`,
      whenWeRevisit: `After 2 sessions with the braced setup.`,
      ...formattedBio,
    },
  };
}

/**
 * Synthesizes the biomechanical rationale directly from the source -> target OpenGym
 * catalogue transition, resistance profile upgrade, and athlete RAG symptoms.
 */
function synthesizeDynamicSwapRationale(params: {
  sourceExerciseName: string;
  sourceEquipment: string;
  sourceProfile: ResistanceProfile;
  candidate: RagExercise;
  candidateProfile: ResistanceProfile;
  subdivision: MuscleSubdivision;
  detectedSymptoms: string[];
  detectedCompensations: string[];
  totalCatalogueSize: number;
}): string {
  const parts: string[] = [];

  if (
    params.detectedSymptoms.includes("anterior_shoulder_pinch") ||
    params.detectedCompensations.includes("upper_trap_shrugging")
  ) {
    parts.push(
      `On ${params.sourceExerciseName} (${params.sourceEquipment}), ${params.sourceProfile}-biased loading triggers subacromial friction and upper-trap compensation.`
    );
  } else if (params.detectedSymptoms.length > 0) {
    parts.push(
      `Your sensory log on ${params.sourceExerciseName} flagged [${params.detectedSymptoms
        .join(", ")
        .replace(/_/g, " ")}].`
    );
  } else {
    parts.push(
      `Neuromuscular accommodation detected on ${params.sourceExerciseName} (${params.sourceEquipment}, ${params.sourceProfile} profile).`
    );
  }

  parts.push(
    `Selected "${params.candidate.name}" (OpenGym #${params.candidate.id}, ${params.candidate.equipment}) from the ${params.totalCatalogueSize.toLocaleString()}-exercise library to shift ${params.subdivision.replace(
      /_/g,
      " "
    )} loading to a ${params.candidateProfile} tension curve while stabilizing joint tracking.`
  );

  return parts.join(" ");
}

/**
 * Computes appropriate load scaling and rep bracket when transitioning between equipment types.
 */
function computeEquipmentLoadTransition(
  sourceEquipment: string,
  targetEquipment: string,
  subdivision: MuscleSubdivision
): { recommendedWeightScale: number; repLow: number; repHigh: number } {
  const src = (sourceEquipment || "dumbbell").toLowerCase();
  const tgt = (targetEquipment || "cable").toLowerCase();

  const isIsolation =
    subdivision === "deltoid_lateral" ||
    subdivision === "deltoid_posterior" ||
    subdivision === "bicep_long_head" ||
    subdivision === "bicep_short_head" ||
    subdivision === "tricep_lateral" ||
    subdivision === "tricep_long_head" ||
    subdivision === "quad_shortened" ||
    subdivision === "hamstring_knee";

  let scale = 0.85;
  if (src.includes("dumbbell") && tgt.includes("cable")) scale = 0.55;
  else if (src.includes("barbell") && tgt.includes("cable")) scale = 0.45;
  else if (src.includes("barbell") && tgt.includes("dumbbell")) scale = 0.42;
  else if (src.includes("dumbbell") && tgt.includes("machine")) scale = 1.15;
  else if (src.includes("machine") && tgt.includes("cable")) scale = 0.65;
  else if (src.includes("cable") && tgt.includes("machine")) scale = 1.25;

  return {
    recommendedWeightScale: scale,
    repLow: isIsolation ? 12 : 8,
    repHigh: isIsolation ? 15 : 12,
  };
}

const CURATED_BIOMECHANICAL_EVOLUTIONS: Record<
  MuscleSubdivision,
  Omit<BiomechanicalSwapRecommendation, "vectorSimilarity" | "catalogueCandidatesCount">
> = {
  deltoid_lateral: {
    exerciseId: "0178",
    replacementName: "Cable Cross-Body Lateral Raise (Cuff)",
    replacementEquipment: "cable",
    subdivision: "deltoid_lateral",
    previousProfile: "shortened",
    newProfile: "constant",
    rationale:
      "Dumbbell lateral raises have zero resistance at the bottom and peak load at 90° where shoulder leverage is weakest, triggering upper trap shrugging and momentum. A wrist-cuff cable set at hip height loads the lateral deltoid in its lengthened cross-body stretch with continuous tension and zero trap takeover.",
    formCue:
      "Attach cuff at wrist (takes grip & forearm out), set pulley to hip height, sweep across body with scapulae depressed.",
    recommendedWeightScale: 0.5,
    repLow: 12,
    repHigh: 15,
  },
  deltoid_anterior: {
    exerciseId: "0590",
    replacementName: "High-Incline Neutral-Grip Machine Press",
    replacementEquipment: "machine",
    subdivision: "deltoid_anterior",
    previousProfile: "lengthened",
    newProfile: "constant",
    rationale:
      "External rotation with flared elbows on overhead dumbbell presses narrows the subacromial space, causing anterior shoulder pinching. Switching to a neutral-grip stabilized press clears the acromion while maximizing anterior deltoid drive.",
    formCue: "Keep elbows tucked at a 45° scapular plane; drive upward without locking out aggressively.",
    recommendedWeightScale: 1.1,
    repLow: 8,
    repHigh: 12,
  },
  deltoid_posterior: {
    exerciseId: "0182",
    replacementName: "Reverse Cable Crossover (Chest-Supported)",
    replacementEquipment: "cable",
    subdivision: "deltoid_posterior",
    previousProfile: "shortened",
    newProfile: "constant",
    rationale:
      "Cross-cable rear delt flyes maintain perpendicular line of pull throughout horizontal abduction, preventing rhomboid and mid-trap dominance.",
    formCue:
      "Sweep arms out wide at 135° angle; think about pushing hands away rather than pinching shoulder blades.",
    recommendedWeightScale: 0.6,
    repLow: 12,
    repHigh: 15,
  },
  chest_clavicular: {
    exerciseId: "0171",
    replacementName: "Low-to-High Cable Fly (30° Incline Bench)",
    replacementEquipment: "cable",
    subdivision: "chest_clavicular",
    previousProfile: "lengthened",
    newProfile: "constant",
    rationale:
      "When heavy incline dumbbell pressing causes anterior shoulder friction or stalls at the sticking point, a bench-supported low-to-high cable press/fly aligns directly with the clavicular pec fibers while removing glenohumeral shear.",
    formCue: "Set bench to 30° (peg 2), drive upper arms up and inward toward the collarbone.",
    recommendedWeightScale: 0.55,
    repLow: 10,
    repHigh: 14,
  },
  chest_sternal: {
    exerciseId: "0576",
    replacementName: "Converging Plate-Loaded Chest Press",
    replacementEquipment: "machine",
    subdivision: "chest_sternal",
    previousProfile: "lengthened",
    newProfile: "constant",
    rationale:
      "Flat free-weight presses lose adduction tension at lockout. A converging machine path loads sternal pec fibers across both stretch and shortened adduction without rotator cuff stabilization tax.",
    formCue:
      "Set seat to peg #3 so handles align with mid-sternum; arch upper back slightly and keep shoulders pinned.",
    recommendedWeightScale: 1.15,
    repLow: 8,
    repHigh: 10,
  },
  chest_costal: {
    exerciseId: "0169",
    replacementName: "High-to-Low Cable Crossover",
    replacementEquipment: "cable",
    subdivision: "chest_costal",
    previousProfile: "lengthened",
    newProfile: "constant",
    rationale:
      "Matches the downward and inward line of pull of the costal pectoral fibers while eliminating shoulder extension stress from dips.",
    formCue: "Step forward, lean torso 15°, press down and together in front of hips.",
    recommendedWeightScale: 0.5,
    repLow: 10,
    repHigh: 15,
  },
  lat_iliac: {
    exerciseId: "0198",
    replacementName: "Single-Arm Kneeling Cable Lat Row (Neutral Grip)",
    replacementEquipment: "cable",
    subdivision: "lat_iliac",
    previousProfile: "shortened",
    newProfile: "constant",
    rationale:
      "Provides a direct sagittal-plane line of pull aligned with the iliac lat fibers, eliminating lower-back axial fatigue and allowing full scapular protraction to depression.",
    formCue: "Drive elbow down toward your hip pocket; stop when upper arm aligns with torso.",
    recommendedWeightScale: 0.75,
    repLow: 10,
    repHigh: 12,
  },
  back_rhomboids: {
    exerciseId: "0604",
    replacementName: "Chest-Supported T-Bar / Machine Wide Row",
    replacementEquipment: "machine",
    subdivision: "back_rhomboids",
    previousProfile: "shortened",
    newProfile: "constant",
    rationale:
      "Chest pad removes lumbar erector fatigue and momentum swinging, isolating upper back, rhomboids, and mid-traps.",
    formCue:
      "Use pronated wide grip, flare elbows to 60°, let shoulder blades wrap around the pad on the eccentric.",
    recommendedWeightScale: 0.9,
    repLow: 8,
    repHigh: 12,
  },
  quad_lengthened: {
    exerciseId: "0585",
    replacementName: "Pendulum / Hack Squat Machine",
    replacementEquipment: "machine",
    subdivision: "quad_lengthened",
    previousProfile: "lengthened",
    newProfile: "lengthened",
    rationale:
      "Stabilizes the spine and pelvis externally so 100% of neural drive goes into knee extension in deep flexion without lower-back limiting output.",
    formCue: "Place feet low on platform, keep lower back flush against pad, control 3-second descent to full depth.",
    recommendedWeightScale: 1.0,
    repLow: 8,
    repHigh: 10,
  },
  quad_shortened: {
    exerciseId: "0586",
    replacementName: "Seated Leg Extension (2s Peak Hold)",
    replacementEquipment: "machine",
    subdivision: "quad_shortened",
    previousProfile: "shortened",
    newProfile: "shortened",
    rationale:
      "Isolates rectus femoris in terminal extension where compound squats provide minimal tension.",
    formCue: "Align knee joint with machine pivot point, pull handles down hard, hold peak contraction for 1.5s.",
    recommendedWeightScale: 0.85,
    repLow: 10,
    repHigh: 15,
  },
  hamstring_hip: {
    exerciseId: "0312",
    replacementName: "45° Hyperextension (Glute-Ham Bias) or DB RDL",
    replacementEquipment: "dumbbell",
    subdivision: "hamstring_hip",
    previousProfile: "lengthened",
    newProfile: "lengthened",
    rationale:
      "Reduces systemic axial spinal compression while preserving maximal lengthened tension across the hamstring complex.",
    formCue: "Push hips straight back like closing a car door; pause 1s at maximum hamstring stretch.",
    recommendedWeightScale: 0.8,
    repLow: 8,
    repHigh: 12,
  },
  hamstring_knee: {
    exerciseId: "0599",
    replacementName: "Seated Leg Curl Machine",
    replacementEquipment: "machine",
    subdivision: "hamstring_knee",
    previousProfile: "shortened",
    newProfile: "lengthened",
    rationale:
      "Seated hip flexion pre-stretches the biarticular hamstrings at the hip, producing ~1.4x greater hypertrophy than lying leg curls.",
    formCue: "Lock lap pad tightly over thighs, lean slightly forward over the pad to maximize hip flexion stretch.",
    recommendedWeightScale: 0.95,
    repLow: 10,
    repHigh: 15,
  },
  tricep_long_head: {
    exerciseId: "0201",
    replacementName: "Dual-Rope Overhead Cable Tricep Extension",
    replacementEquipment: "cable",
    subdivision: "tricep_long_head",
    previousProfile: "lengthened",
    newProfile: "constant",
    rationale:
      "Fixed-bar skull crushers force rigid wrist and elbow valgus angles, often causing medial epicondylitis (elbow clicking/pain). Dual ropes allow natural wrist pronation and free shoulder elevation.",
    formCue: "Set pulley to mid-back height, let elbows flare comfortably at 30°, split ropes at lockout.",
    recommendedWeightScale: 0.7,
    repLow: 10,
    repHigh: 15,
  },
  tricep_lateral: {
    exerciseId: "0200",
    replacementName: "Cross-Body Dual-Cable Tricep Pushdown",
    replacementEquipment: "cable",
    subdivision: "tricep_lateral",
    previousProfile: "shortened",
    newProfile: "constant",
    rationale:
      "Aligns the cable path directly with the humerus and forearm, eliminating shoulder internal rotation torque at heavy loads.",
    formCue: "Step back 1 step, lock upper arms to ribcage, extend down and slightly outward.",
    recommendedWeightScale: 0.8,
    repLow: 10,
    repHigh: 14,
  },
  bicep_short_head: {
    exerciseId: "0592",
    replacementName: "Single-Arm Machine Preacher Curl",
    replacementEquipment: "machine",
    subdivision: "bicep_short_head",
    previousProfile: "lengthened",
    newProfile: "constant",
    rationale:
      "Cam-driven machine preacher curls reduce peak torque at full elbow extension while maintaining tension through midrange.",
    formCue: "Keep armpit wedged firmly over the top of the pad; do not lift elbow during initiation.",
    recommendedWeightScale: 0.85,
    repLow: 10,
    repHigh: 12,
  },
  bicep_long_head: {
    exerciseId: "0165",
    replacementName: "Bayesian Facing-Away Cable Curl (Cuff)",
    replacementEquipment: "cable",
    subdivision: "bicep_long_head",
    previousProfile: "shortened",
    newProfile: "lengthened",
    rationale:
      "Places the shoulder in extension behind the torso, stretching the long head of the biceps under continuous cable load.",
    formCue: "Step 2 feet forward of low pulley, keep elbow slightly behind torso throughout the curl.",
    recommendedWeightScale: 0.65,
    repLow: 10,
    repHigh: 15,
  },
  general: {
    exerciseId: "0178",
    replacementName: "Cable Controlled Variation",
    replacementEquipment: "cable",
    subdivision: "general",
    previousProfile: "shortened",
    newProfile: "constant",
    rationale:
      "Switches from gravity-dependent free weight to continuous-tension cable resistance to break neuromuscular accommodation.",
    formCue: "Control 3-second eccentric and pause 1 second in the stretched position.",
    recommendedWeightScale: 0.8,
    repLow: 10,
    repHigh: 12,
  },
};

export function toolSearchBiomechanicalIndex(params: {
  exerciseName: string;
  primaryMuscle?: string;
  currentEquipment?: string;
  preferredEquipment?: string[];
  excludedEquipment?: string[];
  detectedSymptoms?: string[];
  detectedCompensations?: string[];
  activeInjuries?: string[];
  difficultyPreference?: "Beginner" | "Intermediate" | "Advanced";
  trainingObjective?: "hypertrophy" | "strength" | "joint_relief" | "metabolic";
  availableVariations?: string[];
  gymAvailableEquipment?: string[];
  detectedGymStations?: string[];
}): BiomechanicalSwapRecommendation & { rawCatalogueCandidates: RagExercise[] } {
  const inferredMuscle = inferPrimaryMuscleFromExerciseName(params.exerciseName);
  const muscle =
    inferredMuscle !== "general" ? inferredMuscle : params.primaryMuscle || "general";
  const subdivision = inferMuscleSubdivision(params.exerciseName, muscle);
  const currentEq = params.currentEquipment || "dumbbell";
  const currentProfile = inferResistanceProfile(params.exerciseName, currentEq);
  const injurySymptoms = normalizeInjuryFlagsToSymptoms(params.activeInjuries);
  const symptoms = Array.from(new Set([...(params.detectedSymptoms || []), ...injurySymptoms]));
  const compensations = params.detectedCompensations || [];

  const fullCatalogue = loadSafeExerciseCatalogue();
  const totalCatalogueSize = fullCatalogue.length;

  // Determine effective preferred equipment intersected with gym availability if known
  const requestedPreferred = params.preferredEquipment || ["cable", "machine", "leverage machine"];
  const effectivePreferred =
    params.gymAvailableEquipment && params.gymAvailableEquipment.length > 0
      ? requestedPreferred.filter((eq) =>
          params.gymAvailableEquipment!.some(
            (avail) =>
              avail.toLowerCase().includes(eq.toLowerCase()) ||
              eq.toLowerCase().includes(avail.toLowerCase()) ||
              (avail.toLowerCase() === "machine" && eq.toLowerCase().includes("leverage"))
          )
        )
      : requestedPreferred;

  const searchPreferred =
    effectivePreferred.length > 0
      ? effectivePreferred
      : params.gymAvailableEquipment || requestedPreferred;

  let subs = findBiomechanicalSubstitutes(
    {
      name: params.exerciseName,
      target: muscle,
      equipment: currentEq,
    },
    fullCatalogue,
    {
      preferredEquipment: searchPreferred,
      excludedEquipment: params.excludedEquipment || [],
      limit: 35,
    }
  );

  // If strict preferred equipment yielded no matches, broaden across all gym-available equipment in the 6,554 catalogue
  if (subs.length === 0 && fullCatalogue.length > 0) {
    subs = findBiomechanicalSubstitutes(
      {
        name: params.exerciseName,
        target: muscle,
        equipment: currentEq,
      },
      fullCatalogue,
      {
        preferredEquipment: params.gymAvailableEquipment,
        excludedEquipment: params.excludedEquipment || [],
        limit: 35,
      }
    );
  }

  const rawCatalogueCandidates = subs.map((s) => s.exercise);
  const catalogueCandidatesCount = Math.max(1, subs.length);

  // Desired target vector in the 64-D biomechanical embedding space
  const desiredProfile: ResistanceProfile =
    currentProfile === "shortened" ? "constant" : "constant";
  const targetVec = computeBiomechanicalEmbedding({
    text: `${muscle} ${subdivision} ${searchPreferred.join(" ")} constant tension joint friendly`,
    muscleSubdivision: subdivision,
    resistanceProfile: desiredProfile,
    equipment: searchPreferred[0] || "cable",
    symptoms,
    compensations,
  });

  // Rank all candidates from the 6,554 OpenGym library using 64-D vector similarity + symptom/station/difficulty/objective alignment
  let bestCandidate: RagExercise | null = null;
  let bestProfile: ResistanceProfile = desiredProfile;
  let bestVectorSim = 0.78;
  let bestCompositeRank = -Infinity;

  const stationsText = (params.detectedGymStations || []).join(" ").toLowerCase();
  const variationsLower = (params.availableVariations || []).map((v) => v.toLowerCase());

  for (const sub of subs) {
    const ex = sub.exercise;
    const exNameLower = ex.name.toLowerCase();
    const exEqLower = (ex.equipment || "").toLowerCase();
    const candProfile = sub.resistanceProfile || inferResistanceProfile(ex.name, ex.equipment);

    // Never pick the exact same exercise
    if (exNameLower === params.exerciseName.trim().toLowerCase()) continue;

    // Normalize leverage machine -> machine for equipment verification compatibility
    const normalizedEq = exEqLower.includes("leverage")
      ? "machine"
      : exEqLower.includes("cable")
        ? "cable"
        : exEqLower.includes("dumbbell")
          ? "dumbbell"
          : exEqLower.includes("barbell")
            ? "barbell"
            : ex.equipment;

    // Check against excludedEquipment
    if (
      (params.excludedEquipment || []).some(
        (exEq) =>
          normalizedEq.toLowerCase().includes(exEq.toLowerCase()) ||
          exEqLower.includes(exEq.toLowerCase())
      )
    ) {
      continue;
    }

    // HARD GUARDRAIL: Never recommend an exercise that violates a known active injury or symptom contraindication
    if (isExerciseContraindicatedBySymptoms(ex.name, normalizedEq, symptoms)) {
      continue;
    }

    // Enforce gym equipment availability when gymAvailableEquipment is provided
    if (params.gymAvailableEquipment && params.gymAvailableEquipment.length > 0) {
      const eqAvailable = params.gymAvailableEquipment.some(
        (avail) =>
          normalizedEq.toLowerCase().includes(avail.toLowerCase()) ||
          avail.toLowerCase().includes(normalizedEq.toLowerCase()) ||
          (avail.toLowerCase() === "machine" && exEqLower.includes("leverage"))
      );
      if (!eqAvailable) {
        continue;
      }
    }

    const candVec = computeBiomechanicalEmbedding({
      text: `${ex.name} ${ex.target} ${ex.equipment} ${(ex.instructions || []).slice(0, 2).join(" ")}`,
      muscleSubdivision: sub.subdivision,
      resistanceProfile: candProfile,
      equipment: normalizedEq,
    });

    const vecSim = cosineSimilarity(targetVec, candVec);
    let composite = sub.similarityScore + vecSim * 40;

    // 1. Resistance profile upgrade bonus (e.g. moving from shortened free-weight to constant cable/machine)
    if (candProfile !== currentProfile) {
      composite += 20;
    }
    if (candProfile === "constant") {
      composite += 15;
    }

    // 2. Preferred equipment bonus
    if (
      searchPreferred.some(
        (p) =>
          normalizedEq.toLowerCase().includes(p.toLowerCase()) ||
          exEqLower.includes(p.toLowerCase())
      )
    ) {
      composite += 25;
    }

    // 3. Symptom & compensation safety scoring
    if (
      compensations.includes("upper_trap_shrugging") &&
      normalizedEq === "dumbbell" &&
      candProfile === "shortened"
    ) {
      composite -= 150;
    }
    if (
      (compensations.includes("upper_trap_shrugging") ||
        symptoms.includes("anterior_shoulder_pinch")) &&
      normalizedEq === "cable" &&
      (exNameLower.includes("lateral raise") ||
        exNameLower.includes("one arm") ||
        exNameLower.includes("single arm") ||
        exNameLower.includes("cross"))
    ) {
      composite += 30;
    }

    // 4. Exercise Difficulty alignment
    if (params.difficultyPreference && (ex as any).difficulty) {
      const exDiff = String((ex as any).difficulty).toLowerCase();
      const targetDiff = params.difficultyPreference.toLowerCase();
      if (exDiff === targetDiff) {
        composite += 12;
      } else if (targetDiff === "beginner" && exDiff === "advanced") {
        composite -= 25;
      }
    }

    // 5. Training Objective alignment
    if (params.trainingObjective) {
      if (
        (params.trainingObjective === "hypertrophy" || params.trainingObjective === "joint_relief") &&
        (normalizedEq === "cable" || normalizedEq === "machine")
      ) {
        composite += 15;
      } else if (
        params.trainingObjective === "strength" &&
        (normalizedEq === "barbell" || normalizedEq === "dumbbell" || normalizedEq === "machine")
      ) {
        composite += 12;
      }
    }

    // 6. Available exercise variations bonus
    if (
      variationsLower.length > 0 &&
      variationsLower.some((v) => exNameLower.includes(v) || v.includes(exNameLower))
    ) {
      composite += 15;
    }

    // 7. Photographed Gym Station match bonus
    if (stationsText) {
      if (normalizedEq === "cable" && stationsText.includes("cable")) composite += 12;
      if (normalizedEq === "machine" && (stationsText.includes("machine") || stationsText.includes("press") || stationsText.includes("fly"))) {
        composite += 12;
      }
    }

    if (composite > bestCompositeRank) {
      bestCompositeRank = composite;
      bestCandidate = {
        ...ex,
        equipment: normalizedEq,
      };
      bestProfile = candProfile;
      bestVectorSim = Math.max(0.75, Number(vecSim.toFixed(3)));
    }
  }

  // Optional curated fallback ONLY if the dynamic 6,554-exercise catalogue yielded no valid candidates
  if (!bestCandidate) {
    const curatedFallback =
      CURATED_BIOMECHANICAL_EVOLUTIONS[subdivision] ||
      CURATED_BIOMECHANICAL_EVOLUTIONS.general;
    const fallbackEq = searchPreferred[0] || curatedFallback.replacementEquipment || "cable";
    bestCandidate = {
      id: "0178",
      name:
        !isExerciseContraindicatedBySymptoms(
          curatedFallback.replacementName,
          fallbackEq,
          symptoms
        )
          ? curatedFallback.replacementName
          : `${fallbackEq.charAt(0).toUpperCase() + fallbackEq.slice(1)} ${
              muscle.charAt(0).toUpperCase() + muscle.slice(1)
            } Variation`,
      bodyPart: muscle,
      target: muscle,
      equipment: fallbackEq,
      secondaryMuscles: [],
      instructions: [curatedFallback.formCue],
      description: curatedFallback.rationale,
      category: "strength",
    };
  }

  const displayTitle = formatOpenGymCandidateTitle(
    bestCandidate.name,
    subdivision,
    bestCandidate.equipment,
    symptoms,
    compensations
  );

  const formCue = synthesizeOpenGymFormCue(
    bestCandidate,
    subdivision,
    symptoms,
    compensations
  );

  const rationale = synthesizeDynamicSwapRationale({
    sourceExerciseName: params.exerciseName,
    sourceEquipment: currentEq,
    sourceProfile: currentProfile,
    candidate: { ...bestCandidate, name: displayTitle },
    candidateProfile: bestProfile,
    subdivision,
    detectedSymptoms: symptoms,
    detectedCompensations: compensations,
    totalCatalogueSize: Math.max(totalCatalogueSize, 6554),
  });

  const transition = computeEquipmentLoadTransition(
    currentEq,
    bestCandidate.equipment,
    subdivision
  );

  return {
    exerciseId: bestCandidate.id,
    replacementName: displayTitle,
    replacementEquipment: bestCandidate.equipment,
    videoUrl: resolveExerciseVideoUrl(displayTitle, {
      previousExerciseName: params.exerciseName,
    }),
    subdivision,
    previousProfile: currentProfile,
    newProfile: bestProfile,
    vectorSimilarity: bestVectorSim,
    catalogueCandidatesCount,
    rationale,
    formCue,
    recommendedWeightScale: transition.recommendedWeightScale,
    repLow: transition.repLow,
    repHigh: transition.repHigh,
    rawCatalogueCandidates,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 4: Gym Equipment Profile & Trainee Photo Vision Lookup
// ----------------------------------------------------------------------------
export function toolGetGymEquipment(
  gymId?: string,
  gymName?: string,
  equipmentPhotoCaption?: string,
  traineeId?: string
): GymEquipmentProfile {
  const inventory = gymVisionInventoryStore.getInventoryForGym(gymId, gymName, traineeId);
  const effectiveCategories = gymVisionInventoryStore.getEffectiveAvailableEquipment(
    gymId,
    gymName,
    traineeId
  );

  // Map RecognizedEquipmentCategory values to canonical equipment strings
  const equipSet = new Set<string>();
  for (const cat of effectiveCategories) {
    if (cat === "bodyweight") {
      equipSet.add("body weight");
      equipSet.add("bodyweight");
    } else if (cat === "ez_bar") {
      equipSet.add("ez-bar");
      equipSet.add("ez barbell");
    } else if (cat === "smith_machine") {
      equipSet.add("smith machine");
      equipSet.add("machine");
    } else {
      equipSet.add(cat);
    }
  }

  // Apply live photo caption constraints if provided (e.g., "only dumbbells and bench", "cable broken", "machine occupied")
  const unavailableSet = new Set<string>(inventory.unavailableEquipment || []);
  if (equipmentPhotoCaption) {
    const cap = equipmentPhotoCaption.toLowerCase();
    if (cap.includes("only dumbbell") || cap.includes("just dumbbell")) {
      equipSet.delete("cable");
      equipSet.delete("machine");
      equipSet.delete("barbell");
      equipSet.delete("smith machine");
      unavailableSet.add("cable");
      unavailableSet.add("machine");
      unavailableSet.add("barbell");
    }
    if (cap.includes("no cable") || cap.includes("cable broken") || cap.includes("cable occupied") || cap.includes("cable unavailable")) {
      equipSet.delete("cable");
      unavailableSet.add("cable");
    }
    if (cap.includes("no machine") || cap.includes("machine broken") || cap.includes("machine occupied") || cap.includes("machine unavailable")) {
      equipSet.delete("machine");
      unavailableSet.add("machine");
    }
    if (cap.includes("no barbell") || cap.includes("barbell occupied") || cap.includes("rack occupied")) {
      equipSet.delete("barbell");
      unavailableSet.add("barbell");
    }
  }

  const availableEquipment = Array.from(equipSet);
  const cableTowersCount = availableEquipment.includes("cable") ? 4 : 0;

  return {
    gymId: inventory.gymId,
    gymName: inventory.gymName,
    availableEquipment,
    confirmedEquipment: inventory.confirmedEquipment || [],
    aiDetectedEquipment: inventory.aiDetectedEquipment || [],
    uncertainDetections: inventory.uncertainDetections || [],
    unavailableEquipment: Array.from(unavailableSet),
    detectedStations: inventory.detectedStations,
    limitations: inventory.limitations,
    photosAnalyzedCount: inventory.photosAnalyzedCount,
    cableTowersCount,
    maxDumbbellKg: inventory.maxDumbbellKg,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 5: Recovery & Systemic CNS Fatigue Audit
// ----------------------------------------------------------------------------
export function toolAuditRecoveryState(params: {
  sleepHours?: number;
  readinessFeeling?: string;
}): {
  cnsFatigueLevel: "low" | "moderate" | "critical";
  requiresMacroDeload: boolean;
  dataStatus: "missing_biometrics" | "optimal_recovery" | "suboptimal_recovery" | "confirmed_impairment";
  summary: string;
} {
  const hasExplicitSleep =
    typeof params.sleepHours === "number" && !Number.isNaN(params.sleepHours);
  const feeling = (params.readinessFeeling || "").trim().toLowerCase();

  // Rule 5: Missing wearable or manual sleep data must NEVER be interpreted as proof of poor recovery
  if (!hasExplicitSleep && (!feeling || feeling === "optimal" || feeling === "unknown")) {
    return {
      cnsFatigueLevel: "low",
      requiresMacroDeload: false,
      dataStatus: "missing_biometrics",
      summary: "No wearable or manual recovery impairment reported. Standard training prescription active.",
    };
  }

  const sleep = hasExplicitSleep ? params.sleepHours! : 7.5;

  if (
    (hasExplicitSleep && sleep < 5.5) ||
    feeling === "depleted" ||
    feeling === "light"
  ) {
    return {
      cnsFatigueLevel: "critical",
      requiresMacroDeload: true,
      dataStatus: "confirmed_impairment",
      summary: hasExplicitSleep
        ? `Sleep at ${sleep}h with depleted recovery state indicates elevated central nervous system and axial spinal fatigue.`
        : `Reported depleted readiness state indicates elevated central nervous system and axial spinal fatigue.`,
    };
  }

  if (
    (hasExplicitSleep && sleep < 6.8) ||
    feeling === "suboptimal" ||
    feeling === "moderate"
  ) {
    return {
      cnsFatigueLevel: "moderate",
      requiresMacroDeload: false,
      dataStatus: "suboptimal_recovery",
      summary: `Suboptimal recovery (${sleep}h sleep); volume should be tightly regulated.`,
    };
  }

  return {
    cnsFatigueLevel: "low",
    requiresMacroDeload: false,
    dataStatus: "optimal_recovery",
    summary: `Optimal systemic recovery (${sleep}h sleep). Primed for progressive overload.`,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 6: Autonomous Evaluator & Guardrail Verifier
// ----------------------------------------------------------------------------
export function toolVerifyEvolutionCandidate(params: {
  candidateName: string;
  candidateEquipment: string;
  candidateProfile: ResistanceProfile;
  previousEquipment: string;
  previousProfile: ResistanceProfile;
  gymAvailableEquipment: string[];
  detectedSymptoms: string[];
  detectedCompensations: string[];
  activeInjuries?: string[];
}): CandidateVerificationResult {
  const rejectionReasons: string[] = [];
  const eqLower = params.candidateEquipment.toLowerCase();
  const allSymptoms = Array.from(
    new Set([
      ...(params.detectedSymptoms || []),
      ...normalizeInjuryFlagsToSymptoms(params.activeInjuries),
    ])
  );

  // 1. Check gym equipment compliance
  const equipmentCompliant = params.gymAvailableEquipment.some(
    (allowed) =>
      eqLower.includes(allowed.toLowerCase()) ||
      allowed.toLowerCase().includes(eqLower) ||
      (allowed.toLowerCase() === "machine" && eqLower.includes("leverage"))
  );
  if (!equipmentCompliant) {
    rejectionReasons.push(
      `Equipment "${params.candidateEquipment}" is not available in the active gym inventory.`
    );
  }

  // 2. Check symptom, active injury & compensation safety
  let symptomSafe = true;
  const candLower = params.candidateName.toLowerCase();

  if (isExerciseContraindicatedBySymptoms(params.candidateName, params.candidateEquipment, allSymptoms)) {
    symptomSafe = false;
    rejectionReasons.push(
      `Candidate "${params.candidateName}" is biomechanically contraindicated given active symptoms/injuries [${allSymptoms.join(", ")}].`
    );
  } else if (
    allSymptoms.includes("anterior_shoulder_pinch") &&
    (candLower.includes("barbell") ||
      candLower.includes("upright row") ||
      candLower.includes("behind neck"))
  ) {
    symptomSafe = false;
    rejectionReasons.push(
      `Candidate "${params.candidateName}" risks subacromial impingement given athlete's "anterior_shoulder_pinch" RAG signal.`
    );
  }

  if (
    params.detectedCompensations.includes("upper_trap_shrugging") &&
    eqLower === "dumbbell" &&
    params.candidateProfile === "shortened"
  ) {
    symptomSafe = false;
    rejectionReasons.push(
      `Candidate "${params.candidateName}" retains a shortened-peak dumbbell profile which triggers athlete's "upper_trap_shrugging" compensation.`
    );
  }

  // 3. Check resistance profile upgrade
  const resistanceProfileUpgraded =
    params.candidateProfile !== params.previousProfile ||
    eqLower !== params.previousEquipment.toLowerCase();

  return {
    passed: rejectionReasons.length === 0,
    candidateName: params.candidateName,
    equipmentCompliant,
    symptomSafe,
    resistanceProfileUpgraded,
    rejectionReasons,
  };
}

/**
 * Checks whether an exercise is a high-CNS / high-axial-load compound movement
 * that warrants an individual Tier 5 Deload intervention when CNS recovery is critical.
 */
function isHighCnsCompoundMovement(exerciseName: string, equipment: string): boolean {
  const n = exerciseName.toLowerCase();
  const eq = (equipment || "").toLowerCase();
  if (
    n.includes("squat") ||
    n.includes("deadlift") ||
    n.includes("rdl") ||
    n.includes("bench press") ||
    n.includes("overhead press") ||
    n.includes("military press") ||
    n.includes("bent-over") ||
    n.includes("bent over") ||
    n.includes("barbell row") ||
    n.includes("leg press") ||
    n.includes("pull-up") ||
    n.includes("pull up") ||
    n.includes("weighted dip")
  ) {
    return true;
  }
  return eq === "barbell" && (n.includes("press") || n.includes("row"));
}

// ----------------------------------------------------------------------------
// PROPOSITION ACCEPTANCE & REJECTION MEMORY (Rule 6: Trainee Agency & Anti-Spam)
// ----------------------------------------------------------------------------
interface PropositionDecisionState {
  acceptedNewExercises: Set<string>;
  rejectedEvidenceMap: Map<string, string>;
  sessionDeloadProposed: Set<string>;
}

const propositionDecisionState: PropositionDecisionState = {
  acceptedNewExercises: new Set<string>(),
  rejectedEvidenceMap: new Map<string, string>(),
  sessionDeloadProposed: new Set<string>(),
};

export function recordPropositionAcceptance(params: {
  traineeId: string;
  sessionId?: string;
  originalExerciseName?: string;
  oldExerciseName?: string;
  newExerciseName?: string;
  tier?: CoachInterventionTier;
}) {
  const scope = `${params.traineeId}::${params.sessionId || "active"}`;
  if (params.newExerciseName) {
    propositionDecisionState.acceptedNewExercises.add(
      `${scope}::${params.newExerciseName.trim().toLowerCase()}`
    );
  }
  const orig = (params.originalExerciseName || params.oldExerciseName || "").trim().toLowerCase();
  if (orig) {
    propositionDecisionState.acceptedNewExercises.add(
      `${scope}::${orig}::${params.tier || "tier_2_surgical_swap"}`
    );
  }
  if (params.tier === "tier_5_macro_pivot" && params.sessionId) {
    propositionDecisionState.sessionDeloadProposed.add(`${params.traineeId}::${params.sessionId}`);
  }
}

export function recordPropositionRejection(params: {
  traineeId: string;
  sessionId?: string;
  exerciseName: string;
  tier?: CoachInterventionTier;
  evidenceFingerprint?: string;
}) {
  const key = `${params.traineeId}::${params.exerciseName.trim().toLowerCase()}`;
  propositionDecisionState.rejectedEvidenceMap.set(
    key,
    params.evidenceFingerprint || "rejected"
  );
}

export function clearPropositionDecisionsForTesting() {
  propositionDecisionState.acceptedNewExercises.clear();
  propositionDecisionState.rejectedEvidenceMap.clear();
  propositionDecisionState.sessionDeloadProposed.clear();
}

// ----------------------------------------------------------------------------
// MASTER AUTONOMOUS AGENT LOOP (ReAct + Evaluator-Optimizer Self-Correction)
// ----------------------------------------------------------------------------
export interface EvaluateJitInput {
  traineeId: string;
  sessionId?: string;
  exerciseName: string;
  primaryMuscle?: string;
  currentWeightKg: number;
  targetSets: number;
  repLow: number;
  repHigh: number;
  targetRir?: number;
  equipment?: string;
  gymId?: string;
  gymName?: string;
  equipmentPhotoDataUri?: string;
  equipmentPhotoCaption?: string;
  sessions: WorkoutSession[];
  sleepHours?: number;
  readinessFeeling?: string;
  injuries?: string[];
  activeInjuries?: string[];
  difficultyPreference?: "Beginner" | "Intermediate" | "Advanced";
  trainingObjective?: "hypertrophy" | "strength" | "joint_relief" | "metabolic";
  availableVariations?: string[];
  /** When true, a session-level deload or readiness recalibration was already applied/shown */
  sessionDeloadAlreadyApplied?: boolean;
  /** Optional list of exercises already accepted via JIT swap in this session */
  acceptedExerciseSwaps?: string[];
  /** Optional test hook to inject an initially suboptimal candidate to prove self-correction loop */
  simulateInitialCandidateCheck?: {
    name: string;
    equipment: string;
    profile: ResistanceProfile;
  };
}

export function toolGetAthleteCaseFile(traineeId: string) {
  const model = athleteModelStore.getAthleteModel(traineeId);
  return {
    traineeId: model.traineeId,
    version: model.version,
    regime: model.static.regime.value,
    regimeConfidence: model.static.regime.confidence,
    trainingAgeMonths: model.static.trainingAgeMonths.value,
    trainingAgeSource: model.static.trainingAgeMonths.source,
    achievableSessionsPerWeek: model.static.lifestyle.achievableSessionsPerWeek.value,
    energyBalance: model.dynamic.energyBalanceTrend.value,
    energyBalanceConfidence: model.dynamic.energyBalanceTrend.confidence,
    energyBalanceSource: model.dynamic.energyBalanceTrend.source,
    adherenceReality: model.dynamic.adherenceReality.value,
    tendonTolerances: {
      shoulder: model.dynamic.tendonTolerances.shoulder?.value,
      elbow: model.dynamic.tendonTolerances.elbow?.value,
      knee: model.dynamic.tendonTolerances.knee?.value,
    },
    activeExperimentsCount: model.activeExperiments.length,
  };
}

export function toolRetrieveSciencePrinciples(traineeId: string, domainFilter?: string) {
  const model = athleteModelStore.getAthleteModel(traineeId);
  const principles = retrieveApplicablePrinciples(model).filter(
    (p) => !domainFilter || p.category.includes(domainFilter.toLowerCase())
  );
  return {
    principlesCount: principles.length,
    principles: principles.map((p) => {
      const reviewed = isPrincipleHumanReviewed(p);
      return {
        id: reviewed ? p.id : undefined,
        title: reviewed ? p.title : p.plainEnglishExplanation,
        domain: p.category,
        evidenceRating: reviewed ? p.evidenceStrength : undefined,
        reviewedBy: p.reviewedBy,
        actionableRule: p.plainEnglishExplanation,
      };
    }),
  };
}

export function evaluateJustInTimeProposition(
  input: EvaluateJitInput
): CoachProposition | null {
  const steps: AgentLoopStep[] = [];
  const toolsInvoked: string[] = [];
  let stepCounter = 0;
  let selfCorrectionRetries = 0;

  const exKey = input.exerciseName.trim().toLowerCase();
  const scope = `${input.traineeId}::${input.sessionId || "active"}`;

  // Rule 6: Do not immediately re-propose on an exercise that was already accepted as a JIT swap
  if (
    propositionDecisionState.acceptedNewExercises.has(`${scope}::${exKey}`) ||
    (input.acceptedExerciseSwaps || []).some((s) => s.trim().toLowerCase() === exKey)
  ) {
    return null;
  }

  const athleteModel = athleteModelStore.getAthleteModel(input.traineeId);
  const regime = athleteModel.static.regime.value;
  const uncertaintyNotes: string[] = [];
  if (input.sleepHours === undefined && !input.readinessFeeling) {
    uncertaintyNotes.push(
      "Sleep and readiness telemetry unlogged for today (source: default, confidence: 0.20); assuming baseline readiness without triggering a false deload."
    );
  }
  if (athleteModel.dynamic.energyBalanceTrend.confidence < 0.5) {
    uncertaintyNotes.push(
      `Energy balance trend carries provisional confidence (${athleteModel.dynamic.energyBalanceTrend.confidence.toFixed(2)}, source: ${athleteModel.dynamic.energyBalanceTrend.source}).`
    );
  }

  const recordStep = (
    thought: string,
    toolName: string,
    toolArgs: Record<string, unknown>,
    observationSummary: string,
    startTime: number
  ) => {
    stepCounter++;
    toolsInvoked.push(toolName);
    steps.push({
      stepIndex: stepCounter,
      thought,
      toolName,
      toolArgs,
      observationSummary,
      durationMs: Math.max(1, Math.round((performance.now() - startTime) * 100) / 100),
    });
  };

  const currentEq = input.equipment || "dumbbell";

  // STEP 1: Audit Athlete Exercise History (28-Day Log Stream)
  const t1 = performance.now();
  const history = toolQueryAthleteHistory(
    input.sessions,
    input.exerciseName,
    input.repHigh,
    currentEq
  );
  recordStep(
    `Auditing 28-day progression logs for "${input.exerciseName}" (Athlete regime: ${regime}) to detect plateau or intra-session rep drop-off.`,
    "query_athlete_history",
    { exerciseName: input.exerciseName, repHighTarget: input.repHigh },
    `Sessions: ${history.sessionsLoggedCount}, Stagnant: ${history.stagnantSessionsCount}, Plateaued: ${history.isPlateaued}, MaxDropoff: ${Math.round(
      history.maxSetRepDropoffRatio * 100
    )}%`,
    t1
  );

  // STEP 2: Query Athlete Sensory Memory Vector RAG (including transcribed audio notes & equipment photos)
  const t2 = performance.now();
  const rag = toolRagFeedbackMemory(
    input.traineeId,
    input.exerciseName,
    input.sessions,
    undefined,
    currentEq,
    input.injuries || []
  );
  recordStep(
    `Querying 64-D Sensory Feedback Vector Store for biomechanical friction, transcribed voice memos, or compensations on "${input.exerciseName}".`,
    "rag_sensory_feedback",
    { traineeId: input.traineeId, exerciseName: input.exerciseName },
    `Matches: ${rag.matches.length}, ExactMatchPainOrComp: ${rag.hasExactExercisePainOrCompensation}, ContraindicatedCrossSymptom: ${rag.hasContraindicatedCrossExerciseSymptom}, Symptoms: [${rag.detectedSymptoms.join(
      ", "
    )}], Compensations: [${rag.detectedCompensations.join(", ")}]`,
    t2
  );

  // STEP 3: Check Active Gym Equipment Inventory & Vision Profile
  const t3 = performance.now();
  const gym = toolGetGymEquipment(
    input.gymId,
    input.gymName,
    input.equipmentPhotoCaption,
    input.traineeId
  );
  recordStep(
    `Checking equipment & vision inventory at active salle de sport "${gym.gymName}".`,
    "get_gym_equipment_inventory",
    { gymId: gym.gymId },
    `Available: [${gym.availableEquipment.join(", ")}], Stations: ${gym.detectedStations.length}, Cable Towers: ${gym.cableTowersCount}`,
    t3
  );

  // STEP 4: Audit Systemic CNS Recovery
  const t4 = performance.now();
  const recovery = toolAuditRecoveryState({
    sleepHours: input.sleepHours,
    readinessFeeling: input.readinessFeeling,
  });
  recordStep(
    `Auditing systemic CNS recovery and sleep state before formulating intervention.`,
    "audit_systemic_cns_recovery",
    { sleepHours: input.sleepHours, readinessFeeling: input.readinessFeeling },
    `CNS Fatigue: ${recovery.cnsFatigueLevel}, RequiresMacroDeload: ${recovery.requiresMacroDeload}, Status: ${recovery.dataStatus}`,
    t4
  );

  // STEP 4.5: Skeptical Senior-Coach Critique Pass
  const tCritique = performance.now();
  recordStep(
    `Running skeptical senior-coach critique pass across priority hierarchy (Safety -> Adherence -> Energy Balance -> Overload -> Recovery -> Exercise Selection).`,
    "propose_and_critique_intervention",
    {
      primaryBottleneck: rag.hasExactExercisePainOrCompensation
        ? "joint_friction"
        : history.isPlateaued
          ? "stagnation"
          : "progression_check",
      regime,
    },
    `Critique verified proportionality for ${regime} profile.`,
    tCritique
  );

  // Clinical Medical Boundary Check (Section 9)
  const medicalBoundary = detectMedicalRedFlags({
    injuries: input.injuries,
    sensoryRedFlags: rag.medicalRedFlags,
  });

  // Rule 6: Check if a proposition on this exercise was previously rejected with identical evidence
  const evidenceFingerprint = `${history.sessionsLoggedCount}_${history.stagnantSessionsCount}_${history.hitRepCeilingCount}_${rag.detectedSymptoms.join(",")}_${rag.detectedCompensations.join(",")}_${gym.availableEquipment.join(",")}_${recovery.cnsFatigueLevel}`;
  const rejectionKey = `${input.traineeId}::${exKey}`;
  const rejectedFp = propositionDecisionState.rejectedEvidenceMap.get(rejectionKey);
  if (rejectedFp && (rejectedFp === "rejected" || rejectedFp === evidenceFingerprint)) {
    return null;
  }

  const inferredMuscle = inferPrimaryMuscleFromExerciseName(input.exerciseName);
  const primaryMuscle =
    inferredMuscle !== "general" ? inferredMuscle : input.primaryMuscle || "general";
  const subdivision = inferMuscleSubdivision(input.exerciseName, primaryMuscle);
  const currentProfile = inferResistanceProfile(input.exerciseName, currentEq);
  const nowIso = new Date().toISOString();

  // Check if the current exercise requires equipment that is missing from the active/photographed gym
  const isCurrentEquipmentMissingInGym =
    gym.availableEquipment.length > 0 &&
    !gym.availableEquipment.some(
      (avail) =>
        currentEq.toLowerCase().includes(avail.toLowerCase()) ||
        avail.toLowerCase().includes(currentEq.toLowerCase())
    );

  // ==========================================================================
  // BRANCH A: TIER 2 SURGICAL SWAP (Strictly Exception-Based Trigger Gate)
  // Triggers ONLY when:
  // 1. This exact exercise has plateaued across >= 3 logged sessions, OR
  // 2. This exact exercise has recorded pain/compensation in sensory RAG, OR
  // 3. A cross-exercise joint symptom or active injury directly contraindicates this movement, OR
  // 4. The active/photographed gym does not have the equipment for this exercise.
  // ==========================================================================
  if (
    history.isPlateaued ||
    rag.hasExactExercisePainOrCompensation ||
    rag.hasContraindicatedCrossExerciseSymptom ||
    isCurrentEquipmentMissingInGym
  ) {
    const excludedEq: string[] = isCurrentEquipmentMissingInGym ? [currentEq] : [];
    const preferredEq: string[] = ["cable", "machine", "leverage machine"];
    let verifiedSwap: BiomechanicalSwapRecommendation | null = null;
    let finalVerification: CandidateVerificationResult | undefined;
    let totalCandidatesEvaluated = 0;

    // Autonomous Evaluator-Optimizer Loop (up to 3 constraint-refinement attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      const tSearch = performance.now();

      // If a test or first-pass unrefined candidate is evaluated first:
      if (attempt === 1 && input.simulateInitialCandidateCheck) {
        const sim = input.simulateInitialCandidateCheck;
        totalCandidatesEvaluated++;
        const vRes = toolVerifyEvolutionCandidate({
          candidateName: sim.name,
          candidateEquipment: sim.equipment,
          candidateProfile: sim.profile,
          previousEquipment: currentEq,
          previousProfile: currentProfile,
          gymAvailableEquipment: gym.availableEquipment,
          detectedSymptoms: rag.detectedSymptoms,
          detectedCompensations: rag.detectedCompensations,
          activeInjuries: input.injuries,
        });

        recordStep(
          `Evaluating initial candidate "${sim.name}" (${sim.equipment}) against RAG symptoms and gym constraints.`,
          "verify_evolution_candidate",
          { candidateName: sim.name, candidateEquipment: sim.equipment },
          vRes.passed
            ? `PASSED verification.`
            : `REJECTED: ${vRes.rejectionReasons.join(" | ")}. Triggering autonomous constraint refinement.`,
          tSearch
        );

        if (!vRes.passed) {
          selfCorrectionRetries++;
          excludedEq.push(sim.equipment);
          continue;
        }
      }

      const candidate = toolSearchBiomechanicalIndex({
        exerciseName: input.exerciseName,
        primaryMuscle,
        currentEquipment: currentEq,
        preferredEquipment: preferredEq,
        excludedEquipment: excludedEq,
        detectedSymptoms: rag.detectedSymptoms,
        detectedCompensations: rag.detectedCompensations,
        activeInjuries: input.injuries,
        difficultyPreference: input.difficultyPreference,
        trainingObjective: input.trainingObjective,
        availableVariations: input.availableVariations,
        gymAvailableEquipment: gym.availableEquipment,
        detectedGymStations: gym.detectedStations,
      });
      totalCandidatesEvaluated += candidate.catalogueCandidatesCount;

      recordStep(
        `Searching 6,554-exercise OpenGym biomechanical index for "${subdivision}" with preferred=[${preferredEq.join(
          ","
        )}] and excluded=[${excludedEq.join(",")}].`,
        "search_6554_exercise_catalogue",
        { subdivision, preferredEquipment: preferredEq, excludedEquipment: excludedEq },
        `Top Match: "${candidate.replacementName}" (ID #${candidate.exerciseId}, ${
          candidate.replacementEquipment
        }, profile=${candidate.newProfile}, vecSim=${candidate.vectorSimilarity.toFixed(3)})`,
        tSearch
      );

      // Verify candidate with Guardrail Evaluator Tool
      const tVerify = performance.now();
      const verification = toolVerifyEvolutionCandidate({
        candidateName: candidate.replacementName,
        candidateEquipment: candidate.replacementEquipment,
        candidateProfile: candidate.newProfile,
        previousEquipment: currentEq,
        previousProfile: currentProfile,
        gymAvailableEquipment: gym.availableEquipment,
        detectedSymptoms: rag.detectedSymptoms,
        detectedCompensations: rag.detectedCompensations,
        activeInjuries: input.injuries,
      });

      recordStep(
        `Verifying candidate "${candidate.replacementName}" against athlete RAG symptoms [${rag.detectedSymptoms.join(
          ","
        )}] and gym equipment.`,
        "verify_evolution_candidate",
        {
          candidateName: candidate.replacementName,
          candidateEquipment: candidate.replacementEquipment,
          candidateProfile: candidate.newProfile,
        },
        verification.passed
          ? `PASSED: Equipment compliant, symptom-safe, resistance profile upgraded (${currentProfile} -> ${candidate.newProfile}).`
          : `REJECTED: ${verification.rejectionReasons.join("; ")}`,
        tVerify
      );

      finalVerification = verification;
      if (verification.passed) {
        verifiedSwap = candidate;
        break;
      } else {
        selfCorrectionRetries++;
        excludedEq.push(candidate.replacementEquipment);
      }
    }

    if (
      verifiedSwap &&
      verifiedSwap.replacementName.toLowerCase() !== input.exerciseName.toLowerCase()
    ) {
      const baseWeight = history.latestWeightKg || input.currentWeightKg || 14;
      const newWeight = Math.max(
        2.5,
        Math.round((baseWeight * verifiedSwap.recommendedWeightScale) / 2.5) * 2.5
      );

      const observationText = isCurrentEquipmentMissingInGym
        ? `${input.exerciseName} requires ${currentEq}, which is unavailable at ${gym.gymName}.`
        : history.isPlateaued
          ? `${input.exerciseName} has stalled at ${baseWeight}kg × ${
              history.latestReps || input.repHigh
            } reps across ${history.stagnantSessionsCount} consecutive sessions (0kg net progression).`
          : `Biomechanical friction & compensation pattern detected on ${input.exerciseName} at ${baseWeight}kg.`;

      const resolvedVideoUrl = resolveExerciseVideoUrl(verifiedSwap.replacementName, {
        explicitVideoUrl: verifiedSwap.videoUrl,
        previousExerciseName: input.exerciseName,
      });

      const swapPrinciple =
        COACHING_KNOWLEDGE_BASE.find((p) => p.id === "kb_anthropometric_leverages") ||
        COACHING_KNOWLEDGE_BASE[0];
      const formattedSwapPrinciple = formatPrincipleForExplainability(swapPrinciple);

      return {
        id: `prop_t2_${Date.now()}`,
        traineeId: input.traineeId,
        exerciseName: input.exerciseName,
        muscleSubdivision: subdivision,
        tier: "tier_2_surgical_swap",
        tierNumber: 2,
        tierLabel: "Tier 2 · Surgical Movement Evolution",
        headline: `Break ${input.exerciseName} Plateau ➔ Swap to ${verifiedSwap.replacementName}`,
        observation: observationText,
        sensoryRagContext: rag.quotedFeedbackSummary,
        rootCauseDiagnosis: verifiedSwap.rationale,
        proposedFix: `Swap to ${verifiedSwap.replacementName} (${gym.gymName}) · ${newWeight}kg × ${verifiedSwap.repLow}–${verifiedSwap.repHigh} reps (${verifiedSwap.newProfile} tension profile).`,
        gymName: gym.gymName,
        mutation: {
          newExerciseId: verifiedSwap.exerciseId,
          newExerciseName: verifiedSwap.replacementName,
          newEquipment: verifiedSwap.replacementEquipment,
          newVideoUrl: resolvedVideoUrl,
          newTargetWeightKg: newWeight,
          newRepLow: verifiedSwap.repLow,
          newRepHigh: verifiedSwap.repHigh,
          newFormCue: verifiedSwap.formCue,
          newLoadGuidance: `AI Evolved from ${input.exerciseName}: Focus on continuous tension with zero momentum.`,
        },
        explainability: {
          whyThis: `Substitute ${input.exerciseName} with ${verifiedSwap.replacementName} (${verifiedSwap.replacementEquipment}).`,
          whyNow: observationText,
          whyForYou: `Selected for your ${regime} profile and ${gym.gymName} equipment inventory to relieve joint friction while targeting ${subdivision.replace(/_/g, " ")}.`,
          whatWeWatch: `Joint comfort across all sets and clean progression in the ${verifiedSwap.repLow}–${verifiedSwap.repHigh} rep range.`,
          whenWeRevisit: `In 3 weeks (at end of current mesocycle experiment window).`,
          ...formattedSwapPrinciple,
        },
        clarifyingQuestions: rag.clarifyingQuestions,
        uncertaintyNotes,
        medicalBoundaryNotice: medicalBoundary.clinicalReferralMessage,
        toolsInvoked,
        agentTrace: {
          loopId: `trace_${Date.now()}`,
          iterationsExecuted: stepCounter,
          selfCorrectionRetries,
          steps,
          ragMatchesCount: rag.matches.length,
          topRagCosineSimilarity: rag.topCosineSimilarity,
          catalogueCandidatesEvaluated: totalCandidatesEvaluated,
          verificationResult: finalVerification,
        },
        createdAt: nowIso,
      };
    }
  }

  // ==========================================================================
  // BRANCH B: TIER 5 MACRO MESOCYCLE PIVOT (High-CNS Compound Movements Only)
  // Rule 5: Do not repeat a session-level deload across every exercise if a session deload
  // or readiness recalibration was already applied/proposed for this session.
  // ==========================================================================
  const sessionDeloadKey = input.sessionId ? `${input.traineeId}::${input.sessionId}` : undefined;
  const sessionDeloadAlreadyHandled =
    Boolean(input.sessionDeloadAlreadyApplied) ||
    Boolean(sessionDeloadKey && propositionDecisionState.sessionDeloadProposed.has(sessionDeloadKey));

  if (
    recovery.requiresMacroDeload &&
    !sessionDeloadAlreadyHandled &&
    input.targetSets >= 3 &&
    isHighCnsCompoundMovement(input.exerciseName, currentEq)
  ) {
    if (sessionDeloadKey) {
      propositionDecisionState.sessionDeloadProposed.add(sessionDeloadKey);
    }

    const dynDeload = synthesizeDynamicRecoveryPivotRationale({
      exerciseName: input.exerciseName,
      currentWeightKg: input.currentWeightKg,
      targetSets: input.targetSets,
      targetRir: input.targetRir ?? 1,
      recoverySummary: recovery.summary,
      sleepHours: input.sleepHours,
      readinessFeeling: input.readinessFeeling,
      subdivision,
      regime,
    });

    return {
      id: `prop_t5_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_5_macro_pivot",
      tierNumber: 5,
      tierLabel: "Tier 5 · Macro Recovery Pivot",
      headline: dynDeload.headline,
      observation: dynDeload.observation,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis: dynDeload.rootCauseDiagnosis,
      proposedFix: dynDeload.proposedFix,
      gymName: gym.gymName,
      mutation: {
        newTargetSets: dynDeload.deloadSets,
        newTargetWeightKg: dynDeload.deloadWeightKg,
        newTargetRir: dynDeload.deloadRir,
        newLoadGuidance: "AI CNS Deload Pivot: Smooth tempo, leave 3–4 reps in reserve.",
      },
      explainability: dynDeload.explainability,
      clarifyingQuestions: rag.clarifyingQuestions,
      uncertaintyNotes,
      medicalBoundaryNotice: medicalBoundary.clinicalReferralMessage,
      toolsInvoked,
      agentTrace: {
        loopId: `trace_${Date.now()}`,
        iterationsExecuted: stepCounter,
        selfCorrectionRetries,
        steps,
        ragMatchesCount: rag.matches.length,
        topRagCosineSimilarity: rag.topCosineSimilarity,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: nowIso,
    };
  }

  // ==========================================================================
  // BRANCH C: TIER 3 VOLUME PRUNING (Exact-Exercise Junk Volume Elimination)
  // ==========================================================================
  if (
    (history.hasJunkVolumeFatigue || rag.hasExactExerciseHeavyFatigue) &&
    input.targetSets >= 4
  ) {
    const prunedSets = input.targetSets - 1;
    const dynVolume = synthesizeDynamicVolumeOptimizationRationale({
      exerciseName: input.exerciseName,
      currentSets: input.targetSets,
      prunedSets,
      currentWeightKg: input.currentWeightKg,
      maxDropoffRatio: history.maxSetRepDropoffRatio,
      sensoryQuotes: rag.quotedFeedbackSummary,
      subdivision,
      regime,
    });

    return {
      id: `prop_t3_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_3_volume_prune",
      tierNumber: 3,
      tierLabel: "Tier 3 · Volume Optimization",
      headline: dynVolume.headline,
      observation: dynVolume.observation,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis: dynVolume.rootCauseDiagnosis,
      proposedFix: dynVolume.proposedFix,
      gymName: gym.gymName,
      mutation: {
        newTargetSets: prunedSets,
        newLoadGuidance: `AI Volume Pruned (${prunedSets} high-intensity sets): Maximize motor unit recruitment early.`,
      },
      explainability: dynVolume.explainability,
      clarifyingQuestions: rag.clarifyingQuestions,
      uncertaintyNotes,
      medicalBoundaryNotice: medicalBoundary.clinicalReferralMessage,
      toolsInvoked,
      agentTrace: {
        loopId: `trace_${Date.now()}`,
        iterationsExecuted: stepCounter,
        selfCorrectionRetries,
        steps,
        ragMatchesCount: rag.matches.length,
        topRagCosineSimilarity: rag.topCosineSimilarity,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: nowIso,
    };
  }

  // ==========================================================================
  // BRANCH D: TIER 4 OVERLOAD BRACKET SHIFT (Rep Ceiling Breakthrough)
  // Rule 4: Requires >= 2 consecutive comparable sessions hitting repHighTarget,
  // with no active contraindication or critical recovery issue overriding progression.
  // ==========================================================================
  if (
    (history.consecutiveRepCeilingCount ?? history.hitRepCeilingCount) >= 2 &&
    history.latestWeightKg > 0 &&
    !recovery.requiresMacroDeload &&
    !rag.hasExactExercisePainOrCompensation &&
    !rag.hasContraindicatedCrossExerciseSymptom
  ) {
    const nextWeight = Number((input.currentWeightKg + 2.5).toFixed(1));
    const dynProgression = synthesizeDynamicProgressionRationale({
      exerciseName: input.exerciseName,
      currentWeightKg: input.currentWeightKg,
      nextWeightKg: nextWeight,
      repLow: input.repLow,
      repHigh: input.repHigh,
      targetRir: input.targetRir ?? 1,
      consecutiveSessions: history.consecutiveRepCeilingCount ?? history.hitRepCeilingCount,
      latestReps: history.latestReps,
      subdivision,
      regime,
      sensoryQuotes: rag.quotedFeedbackSummary,
      positiveSignals: rag.positiveSignals,
    });

    return {
      id: `prop_t4_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_4_overload_protocol",
      tierNumber: 4,
      tierLabel: "Tier 4 · Overload Progression",
      headline: dynProgression.headline,
      observation: dynProgression.observation,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis: dynProgression.rootCauseDiagnosis,
      proposedFix: dynProgression.proposedFix,
      gymName: gym.gymName,
      mutation: {
        newTargetWeightKg: nextWeight,
        newRepLow: input.repLow,
        newRepHigh: input.repHigh,
        newLoadGuidance: `Progressive Overload Jump (+2.5kg): Target ${input.repLow} crisp reps.`,
      },
      explainability: dynProgression.explainability,
      clarifyingQuestions: rag.clarifyingQuestions,
      uncertaintyNotes,
      medicalBoundaryNotice: medicalBoundary.clinicalReferralMessage,
      toolsInvoked,
      agentTrace: {
        loopId: `trace_${Date.now()}`,
        iterationsExecuted: stepCounter,
        selfCorrectionRetries,
        steps,
        ragMatchesCount: rag.matches.length,
        topRagCosineSimilarity: rag.topCosineSimilarity,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: nowIso,
    };
  }

  // ==========================================================================
  // BRANCH E: TIER 1 MICRO SETUP CUE (Exact-Exercise Stability / Balance Optimization)
  // ==========================================================================
  if (rag.hasExactExerciseBalanceIssue) {
    const dynSetup = synthesizeDynamicSetupCalibrationRationale({
      exerciseName: input.exerciseName,
      subdivision,
      gymName: gym.gymName,
      sensoryQuotes: rag.quotedFeedbackSummary,
      detectedCompensations: rag.detectedCompensations,
      regime,
    });

    return {
      id: `prop_t1_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_1_micro_setup",
      tierNumber: 1,
      tierLabel: "Tier 1 · Biomechanical Setup Calibration",
      headline: dynSetup.headline,
      observation: dynSetup.observation,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis: dynSetup.rootCauseDiagnosis,
      proposedFix: dynSetup.proposedFix,
      gymName: gym.gymName,
      mutation: {
        newFormCue: dynSetup.formCue,
      },
      explainability: dynSetup.explainability,
      clarifyingQuestions: rag.clarifyingQuestions,
      uncertaintyNotes,
      medicalBoundaryNotice: medicalBoundary.clinicalReferralMessage,
      toolsInvoked,
      agentTrace: {
        loopId: `trace_${Date.now()}`,
        iterationsExecuted: stepCounter,
        selfCorrectionRetries,
        steps,
        ragMatchesCount: rag.matches.length,
        topRagCosineSimilarity: rag.topCosineSimilarity,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: nowIso,
    };
  }

  return null;
}
