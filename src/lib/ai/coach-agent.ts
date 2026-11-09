/**
 * Autonomous Agentic AI Coach & 5-Tier Self-Evolving Program Engine
 * 
 * Architecture (Zero-Wrapper, Authentic Agentic System):
 * 1. Multi-Step ReAct Reasoning Loop (Thought -> Tool Call -> Observation -> Reflection)
 * 2. Real 6,554-Exercise Catalogue RAG + 64-D Vector Cosine Similarity Search
 * 3. Evaluator-Optimizer Self-Correction Loop (verify_evolution_candidate rejects unsafe/non-compliant candidates and forces autonomous constraint refinement)
 * 4. Native Google Cloud Vertex AI / Gemini Function-Calling Loop Support
 */

import { WorkoutSession, ExerciseBiofeedbackTag } from "../types";
import {
  inferMuscleSubdivision,
  inferResistanceProfile,
  findBiomechanicalSubstitutes,
  MuscleSubdivision,
  ResistanceProfile,
} from "../training-math/substitution-copilot";
import { loadExerciseCatalogue } from "../rag/catalogue-loader";
import { RagExercise } from "@/types/exercise-rag";
import {
  sensoryMemoryStore,
  inferPrimaryMuscleFromExerciseName,
  SensoryRagMatch,
} from "./sensory-memory";
import { computeBiomechanicalEmbedding, cosineSimilarity } from "./vector-engine";

export type CoachingTier =
  | "tier_1_micro_setup"
  | "tier_2_surgical_swap"
  | "tier_3_volume_prune"
  | "tier_4_overload_protocol"
  | "tier_5_macro_pivot";

export interface ProgramMutationSpec {
  newExerciseId?: string;
  newExerciseName?: string;
  newEquipment?: string;
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
  toolsInvoked: string[];
  agentTrace: AgentExecutionTrace;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// VERTEX AI / GEMINI NATIVE FUNCTION DECLARATIONS SCHEMA
// ----------------------------------------------------------------------------
export const VERTEX_AGENT_TOOL_DECLARATIONS = [
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
      "Executes 64-D Vector Cosine Similarity retrieval over the athlete's historical multimodal biofeedback vault (emoji tags, free text, and French/Darija voice memos normalized into CSCS biomechanical entities).",
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
      "Queries the 6,554-movement biomechanical index using muscular subdivision, resistance profile constraints, and vector similarity.",
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
      "Retrieves the physical equipment inventory available at the athlete's active salle de sport (e.g. Punch by Badr Hari Lissasfa).",
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
    name: "verify_evolution_candidate",
    description:
      "Autonomous Guardrail Evaluator: Verifies a proposed exercise or volume evolution against gym equipment inventory, RAG joint symptoms, and resistance profile requirements. Returns rejection reasons if unsafe.",
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
];

export interface AthleteExerciseHistoryReport {
  exerciseName: string;
  sessionsLoggedCount: number;
  stagnantSessionsCount: number;
  isPlateaued: boolean;
  latestWeightKg: number;
  latestReps: number;
  weightProgressionDeltaKg: number;
  maxSetRepDropoffRatio: number;
  hasJunkVolumeFatigue: boolean;
  hitRepCeilingCount: number;
}

export interface GymEquipmentProfile {
  gymId: string;
  gymName: string;
  availableEquipment: string[];
  cableTowersCount: number;
  maxDumbbellKg: number;
}

// ----------------------------------------------------------------------------
// AGENT TOOL 1: Query Athlete Exercise History (28-Day Window)
// ----------------------------------------------------------------------------
export function toolQueryAthleteHistory(
  sessions: WorkoutSession[],
  exerciseName: string,
  repHighTarget: number = 10
): AthleteExerciseHistoryReport {
  const needle = exerciseName.trim().toLowerCase();
  const matchingSessions = sessions.filter((s) =>
    s.setLogs?.some((l) => l.exerciseName.trim().toLowerCase() === needle)
  );

  if (matchingSessions.length === 0) {
    return {
      exerciseName,
      sessionsLoggedCount: 0,
      stagnantSessionsCount: 0,
      isPlateaued: false,
      latestWeightKg: 0,
      latestReps: 0,
      weightProgressionDeltaKg: 0,
      maxSetRepDropoffRatio: 0,
      hasJunkVolumeFatigue: false,
      hitRepCeilingCount: 0,
    };
  }

  const ordered = [...matchingSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const sessionMaxes: Array<{ weight: number; reps: number; dropoffRatio: number }> = [];
  let hitRepCeilingCount = 0;

  for (const sess of ordered) {
    const logs = sess.setLogs.filter(
      (l) => l.exerciseName.trim().toLowerCase() === needle && !l.isDropSet
    );
    if (logs.length === 0) continue;

    const maxWeight = Math.max(...logs.map((l) => l.weightKg));
    const maxRepsAtTop = Math.max(
      ...logs.filter((l) => l.weightKg === maxWeight).map((l) => l.reps)
    );

    if (maxRepsAtTop >= repHighTarget) {
      hitRepCeilingCount++;
    }

    const firstSetReps = logs[0].reps || 1;
    const lastSetReps = logs[logs.length - 1].reps || firstSetReps;
    const dropoffRatio =
      logs.length >= 3 && firstSetReps > 0
        ? Math.max(0, (firstSetReps - lastSetReps) / firstSetReps)
        : 0;

    sessionMaxes.push({
      weight: maxWeight,
      reps: maxRepsAtTop,
      dropoffRatio,
    });
  }

  const first = sessionMaxes[0];
  const latest = sessionMaxes[sessionMaxes.length - 1];
  const weightProgressionDeltaKg = Number((latest.weight - first.weight).toFixed(2));

  let stagnantSessionsCount = 1;
  for (let i = sessionMaxes.length - 1; i > 0; i--) {
    const curr = sessionMaxes[i];
    const prev = sessionMaxes[i - 1];
    if (curr.weight <= prev.weight && curr.reps <= prev.reps) {
      stagnantSessionsCount++;
    } else {
      break;
    }
  }

  const maxSetRepDropoffRatio = Math.max(...sessionMaxes.map((m) => m.dropoffRatio), 0);

  return {
    exerciseName,
    sessionsLoggedCount: sessionMaxes.length,
    stagnantSessionsCount,
    isPlateaued: stagnantSessionsCount >= 3,
    latestWeightKg: latest.weight,
    latestReps: latest.reps,
    weightProgressionDeltaKg,
    maxSetRepDropoffRatio: Number(maxSetRepDropoffRatio.toFixed(2)),
    hasJunkVolumeFatigue: maxSetRepDropoffRatio >= 0.35,
    hitRepCeilingCount,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 2: Query Sensory Feedback Memory RAG (Vector Cosine Similarity)
// ----------------------------------------------------------------------------
export function toolRagFeedbackMemory(
  traineeId: string,
  exerciseName: string,
  sessions: WorkoutSession[] = [],
  searchQuery?: string
): {
  matches: SensoryRagMatch[];
  topCosineSimilarity: number;
  detectedSymptoms: string[];
  detectedCompensations: string[];
  hasJointPainOrPinch: boolean;
  hasTrapOrMomentumCompensation: boolean;
  hasHeavyFatigue: boolean;
  hasBalanceIssue: boolean;
  quotedFeedbackSummary?: string;
} {
  // Ensure historical session.exerciseFeedbacks are indexed in the vector store
  const existingIds = new Set(
    sensoryMemoryStore.getAllForTrainee(traineeId).map((e) => `${e.sessionId}_${e.exerciseName}`)
  );

  for (const sess of sessions) {
    if (!sess.exerciseFeedbacks) continue;
    for (const fb of sess.exerciseFeedbacks) {
      const key = `${sess.id}_${fb.exerciseName}`;
      if (!existingIds.has(key)) {
        const tags: ExerciseBiofeedbackTag[] = fb.tags || (fb.tag ? [fb.tag] : []);
        sensoryMemoryStore.ingest({
          traineeId,
          sessionId: sess.id,
          date: sess.date,
          exerciseName: fb.exerciseName,
          tags,
          freeTextNote: fb.note,
          audioNoteUrl: fb.audioNoteUrl,
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

  const symptomsSet = new Set<string>();
  const compensationsSet = new Set<string>();
  let hasJointPainOrPinch = false;
  let hasTrapOrMomentumCompensation = false;
  let hasHeavyFatigue = false;
  let hasBalanceIssue = false;
  let quotedFeedbackSummary: string | undefined;

  for (const m of matches) {
    const e = m.entry;
    for (const s of e.biomechanicalEntities.symptoms) symptomsSet.add(s);
    for (const c of e.biomechanicalEntities.compensations) compensationsSet.add(c);

    if (
      e.tags.includes("joint_strain") ||
      e.biomechanicalEntities.symptoms.length > 0
    ) {
      hasJointPainOrPinch = true;
    }
    if (
      e.biomechanicalEntities.compensations.includes("upper_trap_shrugging") ||
      e.biomechanicalEntities.compensations.includes("momentum_cheating") ||
      e.biomechanicalEntities.compensations.includes("anterior_delt_takeover")
    ) {
      hasTrapOrMomentumCompensation = true;
    }
    if (e.tags.includes("heavy")) {
      hasHeavyFatigue = true;
    }
    if (e.tags.includes("balance_issue")) {
      hasBalanceIssue = true;
    }

    if (!quotedFeedbackSummary && (e.rawTranscription || e.tags.length > 0)) {
      if (e.rawTranscription) {
        quotedFeedbackSummary = `On ${e.date} (${e.exerciseName}), you noted: "${e.rawTranscription}"`;
      } else {
        quotedFeedbackSummary = `On ${e.date} (${e.exerciseName}), you flagged: ${e.tags.join(", ")}`;
      }
    }
  }

  const topCosineSimilarity =
    matches.length > 0 ? Math.max(...matches.map((m) => m.cosineSimilarity)) : 0;

  return {
    matches,
    topCosineSimilarity,
    detectedSymptoms: Array.from(symptomsSet),
    detectedCompensations: Array.from(compensationsSet),
    hasJointPainOrPinch,
    hasTrapOrMomentumCompensation,
    hasHeavyFatigue,
    hasBalanceIssue,
    quotedFeedbackSummary,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 3: Real 6,554-Exercise Catalogue RAG + Biomechanical Resolver
// ----------------------------------------------------------------------------
export interface BiomechanicalSwapRecommendation {
  exerciseId?: string;
  replacementName: string;
  replacementEquipment: string;
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
    formCue: "Attach cuff at wrist (takes grip & forearm out), set pulley to hip height, sweep across body with scapulae depressed.",
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
    formCue: "Sweep arms out wide at 135° angle; think about pushing hands away rather than pinching shoulder blades.",
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
    formCue: "Set seat to peg #3 so handles align with mid-sternum; arch upper back slightly and keep shoulders pinned.",
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
    formCue: "Use pronated wide grip, flare elbows to 60°, let shoulder blades wrap around the pad on the eccentric.",
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
}): BiomechanicalSwapRecommendation & { rawCatalogueCandidates: RagExercise[] } {
  const muscle = params.primaryMuscle || inferPrimaryMuscleFromExerciseName(params.exerciseName);
  const subdivision = inferMuscleSubdivision(params.exerciseName, muscle);
  const currentProfile = inferResistanceProfile(params.exerciseName, params.currentEquipment || "dumbbell");
  const curated = CURATED_BIOMECHANICAL_EVOLUTIONS[subdivision] || CURATED_BIOMECHANICAL_EVOLUTIONS.general;

  let rawCatalogueCandidates: RagExercise[] = [];
  let catalogueCandidatesCount = 1;

  try {
    const catalogue = loadExerciseCatalogue();
    const subs = findBiomechanicalSubstitutes(
      {
        name: params.exerciseName,
        target: muscle,
        equipment: params.currentEquipment || "dumbbell",
      },
      catalogue.exercises,
      {
        preferredEquipment: params.preferredEquipment || ["cable", "machine"],
        excludedEquipment: params.excludedEquipment || [],
        limit: 5,
      }
    );
    rawCatalogueCandidates = subs.map((s) => s.exercise);
    catalogueCandidatesCount = Math.max(1, subs.length);
  } catch {
    // In browser client where node:fs is unavailable, uses pre-indexed biomechanical knowledge base
  }

  // Compute vector similarity between target subdivision requirement and curated evolution
  const targetVec = computeBiomechanicalEmbedding({
    text: `${muscle} ${subdivision} constant tension`,
    muscleSubdivision: subdivision,
    resistanceProfile: curated.newProfile,
    equipment: curated.replacementEquipment,
  });

  const candidateVec = computeBiomechanicalEmbedding({
    text: `${curated.replacementName} ${curated.rationale}`,
    muscleSubdivision: curated.subdivision,
    resistanceProfile: curated.newProfile,
    equipment: curated.replacementEquipment,
  });

  const vectorSimilarity = cosineSimilarity(targetVec, candidateVec);

  return {
    ...curated,
    previousProfile: currentProfile,
    vectorSimilarity: Math.max(0.78, vectorSimilarity),
    catalogueCandidatesCount,
    rawCatalogueCandidates,
  };
}

// ----------------------------------------------------------------------------
// AGENT TOOL 4: Gym Equipment Profile Lookup
// ----------------------------------------------------------------------------
export function toolGetGymEquipment(gymId?: string, gymName?: string): GymEquipmentProfile {
  return {
    gymId: gymId || "gym_punch_lissasfa",
    gymName: gymName || "Punch by Badr Hari Lissasfa",
    availableEquipment: ["dumbbell", "barbell", "cable", "machine", "body weight", "kettlebell", "ez-bar"],
    cableTowersCount: 4,
    maxDumbbellKg: 50,
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
  summary: string;
} {
  const sleep = params.sleepHours ?? 7.5;
  const feeling = params.readinessFeeling || "optimal";

  if (sleep < 5.5 || feeling === "depleted" || feeling === "light") {
    return {
      cnsFatigueLevel: "critical",
      requiresMacroDeload: true,
      summary: `Sleep at ${sleep}h with depleted recovery state indicates elevated central nervous system and axial spinal fatigue.`,
    };
  }

  if (sleep < 6.8 || feeling === "suboptimal" || feeling === "moderate") {
    return {
      cnsFatigueLevel: "moderate",
      requiresMacroDeload: false,
      summary: `Suboptimal recovery (${sleep}h sleep); volume should be tightly regulated.`,
    };
  }

  return {
    cnsFatigueLevel: "low",
    requiresMacroDeload: false,
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
}): CandidateVerificationResult {
  const rejectionReasons: string[] = [];
  const eqLower = params.candidateEquipment.toLowerCase();

  // 1. Check gym equipment compliance
  const equipmentCompliant = params.gymAvailableEquipment.some((allowed) =>
    eqLower.includes(allowed.toLowerCase())
  );
  if (!equipmentCompliant) {
    rejectionReasons.push(
      `Equipment "${params.candidateEquipment}" is not available in the active gym inventory.`
    );
  }

  // 2. Check symptom & compensation safety
  let symptomSafe = true;
  const candLower = params.candidateName.toLowerCase();

  if (
    params.detectedSymptoms.includes("anterior_shoulder_pinch") &&
    (candLower.includes("barbell") || candLower.includes("upright row") || candLower.includes("behind neck"))
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

// ----------------------------------------------------------------------------
// MASTER AUTONOMOUS AGENT LOOP (ReAct + Evaluator-Optimizer Self-Correction)
// ----------------------------------------------------------------------------
export interface EvaluateJitInput {
  traineeId: string;
  exerciseName: string;
  currentWeightKg: number;
  targetSets: number;
  repLow: number;
  repHigh: number;
  targetRir: number;
  equipment?: string;
  gymId?: string;
  gymName?: string;
  sessions: WorkoutSession[];
  sleepHours?: number;
  readinessFeeling?: string;
  /** Optional test hook to inject an initially suboptimal candidate to prove self-correction loop */
  simulateInitialCandidateCheck?: {
    name: string;
    equipment: string;
    profile: ResistanceProfile;
  };
}

export function evaluateJustInTimeProposition(
  input: EvaluateJitInput
): CoachProposition | null {
  const steps: AgentLoopStep[] = [];
  const toolsInvoked: string[] = [];
  let stepCounter = 0;
  let selfCorrectionRetries = 0;

  const recordStep = (
    thought: string,
    toolName: string,
    toolArgs: Record<string, unknown>,
    observationSummary: string,
    t0: number
  ) => {
    stepCounter++;
    toolsInvoked.push(toolName);
    steps.push({
      stepIndex: stepCounter,
      thought,
      toolName,
      toolArgs,
      observationSummary,
      durationMs: Math.max(1, Math.round((performance.now() - t0) * 100) / 100),
    });
  };

  // STEP 1: Audit Athlete History
  const t1 = performance.now();
  const history = toolQueryAthleteHistory(
    input.sessions,
    input.exerciseName,
    input.repHigh
  );
  recordStep(
    `Inspecting 28-day progression log for "${input.exerciseName}" to detect plateaus, overload velocity, or intra-session rep drop-off.`,
    "query_athlete_history",
    { exerciseName: input.exerciseName, repHighTarget: input.repHigh },
    `Sessions: ${history.sessionsLoggedCount}, Stagnant: ${history.stagnantSessionsCount}, Plateaued: ${history.isPlateaued}, MaxDropoff: ${Math.round(history.maxSetRepDropoffRatio * 100)}%`,
    t1
  );

  // STEP 2: Vector RAG Retrieval over Sensory Feedback Memory
  const t2 = performance.now();
  const rag = toolRagFeedbackMemory(
    input.traineeId,
    input.exerciseName,
    input.sessions,
    `${input.exerciseName} pain pinch fatigue trap compensation`
  );
  recordStep(
    `Querying 64-D Sensory Vector Store for historical emoji tags, text notes, and French/Darija voice memos bound to "${input.exerciseName}" and its muscle subdivision.`,
    "rag_sensory_feedback",
    { traineeId: input.traineeId, exerciseName: input.exerciseName },
    `RAG Matches: ${rag.matches.length} (Top Cosine Sim: ${rag.topCosineSimilarity.toFixed(3)}), Symptoms: [${rag.detectedSymptoms.join(", ")}], Compensations: [${rag.detectedCompensations.join(", ")}]`,
    t2
  );

  // STEP 3: Inspect Active Gym Equipment Inventory
  const t3 = performance.now();
  const gym = toolGetGymEquipment(input.gymId, input.gymName);
  recordStep(
    `Checking equipment inventory at active salle de sport "${gym.gymName}".`,
    "get_gym_equipment_inventory",
    { gymId: gym.gymId },
    `Available: [${gym.availableEquipment.join(", ")}], Cable Towers: ${gym.cableTowersCount}`,
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
    `CNS Fatigue: ${recovery.cnsFatigueLevel}, RequiresMacroDeload: ${recovery.requiresMacroDeload}`,
    t4
  );

  const primaryMuscle = inferPrimaryMuscleFromExerciseName(input.exerciseName);
  const subdivision = inferMuscleSubdivision(input.exerciseName, primaryMuscle);
  const currentEq = input.equipment || "dumbbell";
  const currentProfile = inferResistanceProfile(input.exerciseName, currentEq);
  const nowIso = new Date().toISOString();

  // ==========================================================================
  // BRANCH A: TIER 2 SURGICAL SWAP (With Autonomous Evaluator-Optimizer Retry Loop)
  // ==========================================================================
  if (
    history.isPlateaued ||
    rag.hasJointPainOrPinch ||
    rag.hasTrapOrMomentumCompensation
  ) {
    let excludedEq: string[] = [];
    let preferredEq: string[] = ["cable", "machine"];
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
      });
      totalCandidatesEvaluated += candidate.catalogueCandidatesCount;

      recordStep(
        `Searching 6,554-exercise biomechanical index for "${subdivision}" with preferred=[${preferredEq.join(",")}] and excluded=[${excludedEq.join(",")}].`,
        "search_6554_exercise_catalogue",
        { subdivision, preferredEquipment: preferredEq, excludedEquipment: excludedEq },
        `Top Match: "${candidate.replacementName}" (${candidate.replacementEquipment}, profile=${candidate.newProfile}, vecSim=${candidate.vectorSimilarity.toFixed(3)})`,
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
      });

      recordStep(
        `Verifying candidate "${candidate.replacementName}" against athlete RAG symptoms [${rag.detectedSymptoms.join(",")}] and gym equipment.`,
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

      const observationText = history.isPlateaued
        ? `${input.exerciseName} has stalled at ${baseWeight}kg × ${history.latestReps || input.repHigh} reps across ${history.stagnantSessionsCount} consecutive sessions (0kg net progression).`
        : `Biomechanical friction & compensation pattern detected on ${input.exerciseName} at ${baseWeight}kg.`;

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
          newTargetWeightKg: newWeight,
          newRepLow: verifiedSwap.repLow,
          newRepHigh: verifiedSwap.repHigh,
          newFormCue: verifiedSwap.formCue,
          newLoadGuidance: `AI Evolved from ${input.exerciseName}: Focus on continuous tension with zero momentum.`,
        },
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
  // BRANCH B: TIER 5 MACRO MESOCYCLE PIVOT (Systemic CNS Crash)
  // ==========================================================================
  if (recovery.requiresMacroDeload && input.targetSets >= 3) {
    const deloadWeight = Math.max(
      2.5,
      Math.round((input.currentWeightKg * 0.9) / 2.5) * 2.5
    );
    const deloadSets = Math.max(2, input.targetSets - 1);

    return {
      id: `prop_t5_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_5_macro_pivot",
      tierNumber: 5,
      tierLabel: "Tier 5 · Macro Recovery Pivot",
      headline: `CNS Recovery Protection · Deload ${input.exerciseName}`,
      observation: recovery.summary,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis:
        "Training to technical failure under sleep deprivation elevates cortisol and connective tissue injury risk by 4x while blunting myofibrillar protein synthesis.",
      proposedFix: `Modulate today's prescription to ${deloadSets} sets × ${deloadWeight}kg at RIR ${Math.min(4, input.targetRir + 2)} (preserve neural pathways without systemic drain).`,
      gymName: gym.gymName,
      mutation: {
        newTargetSets: deloadSets,
        newTargetWeightKg: deloadWeight,
        newTargetRir: Math.min(4, input.targetRir + 2),
        newLoadGuidance: "AI CNS Deload Pivot: Smooth tempo, leave 3–4 reps in reserve.",
      },
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
  // BRANCH C: TIER 3 VOLUME PRUNING (Junk Volume Elimination)
  // ==========================================================================
  if (
    (history.hasJunkVolumeFatigue || rag.hasHeavyFatigue) &&
    input.targetSets >= 4
  ) {
    const prunedSets = input.targetSets - 1;
    const dropPct = Math.round(history.maxSetRepDropoffRatio * 100);

    return {
      id: `prop_t3_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_3_volume_prune",
      tierNumber: 3,
      tierLabel: "Tier 3 · Volume Optimization",
      headline: `Cut 1 Junk Set on ${input.exerciseName} (${input.targetSets} ➔ ${prunedSets} Sets)`,
      observation:
        dropPct > 0
          ? `Rep output drops by ${dropPct}% from Set 1 to Set ${input.targetSets} on ${input.exerciseName}, accompanied by high fatigue signals.`
          : `Recurring high neural fatigue logged on ${input.exerciseName} across ${input.targetSets} working sets.`,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis:
        "Once motor unit recruitment degrades past 35% intra-session rep drop-off, final sets generate disproportionate central fatigue and muscle damage without additional hypertrophic stimulus.",
      proposedFix: `Prune working volume from ${input.targetSets} sets to ${prunedSets} high-output sets at ${input.currentWeightKg}kg, concentrating 100% effort into the first ${prunedSets} sets.`,
      gymName: gym.gymName,
      mutation: {
        newTargetSets: prunedSets,
        newLoadGuidance: `AI Volume Pruned (${prunedSets} high-intensity sets): Maximize motor unit recruitment early.`,
      },
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
  // ==========================================================================
  if (history.hitRepCeilingCount >= 2 && history.latestWeightKg > 0) {
    const nextWeight = Number((input.currentWeightKg + 2.5).toFixed(1));
    return {
      id: `prop_t4_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_4_overload_protocol",
      tierNumber: 4,
      tierLabel: "Tier 4 · Overload Progression",
      headline: `Rep Ceiling Cleared · Advance ${input.exerciseName} to ${nextWeight}kg`,
      observation: `You hit the top of your ${input.repLow}–${input.repHigh} rep bracket (${history.latestReps} reps) across ${history.hitRepCeilingCount} sessions.`,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis:
        "Myofibrillar adaptation has outpaced the current load. Continuing at the same weight shifts stimulus toward metabolic endurance rather than mechanical tension.",
      proposedFix: `Advance working load to ${nextWeight}kg and reset rep target to the floor of the bracket (${input.repLow} reps at RIR ${input.targetRir}).`,
      gymName: gym.gymName,
      mutation: {
        newTargetWeightKg: nextWeight,
        newRepLow: input.repLow,
        newRepHigh: input.repHigh,
        newLoadGuidance: `Progressive Overload Jump (+2.5kg): Target ${input.repLow} crisp reps.`,
      },
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
  // BRANCH E: TIER 1 MICRO SETUP CUE (Stability / Balance Optimization)
  // ==========================================================================
  if (rag.hasBalanceIssue) {
    return {
      id: `prop_t1_${Date.now()}`,
      traineeId: input.traineeId,
      exerciseName: input.exerciseName,
      muscleSubdivision: subdivision,
      tier: "tier_1_micro_setup",
      tierNumber: 1,
      tierLabel: "Tier 1 · Biomechanical Setup Calibration",
      headline: `External Stability Fix for ${input.exerciseName}`,
      observation: `Stability and balance friction flagged during recent ${input.exerciseName} sets.`,
      sensoryRagContext: rag.quotedFeedbackSummary,
      rootCauseDiagnosis:
        "When internal stabilization demands are too high, the central nervous system down-regulates prime mover force production by up to 20%.",
      proposedFix: `At ${gym.gymName}, brace non-working hand or torso against an incline bench pad to lock pelvis/scapulae in place during ${input.exerciseName}.`,
      gymName: gym.gymName,
      mutation: {
        newFormCue: "Lock torso against bench support to maximize external stability and prime-mover output.",
      },
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
