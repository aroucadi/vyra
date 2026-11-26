import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  VECTOR_DIMENSIONS,
  computeBiomechanicalEmbedding,
  cosineSimilarity,
} from "../../../src/lib/ai/vector-engine";
import {
  detectFeedbackLanguage,
  extractCanonicalAthleticRepresentation,
  inferPrimaryMuscleFromExerciseName,
  SensoryMemoryStore,
  sensoryMemoryStore,
  validateAudioDataUri,
  embedTranscriptInAudioDataUri,
} from "../../../src/lib/ai/sensory-memory";
import { resolveExerciseVideoUrl } from "../../../src/lib/utils";
import {
  VERTEX_AGENT_TOOL_DECLARATIONS,
  evaluateJustInTimeProposition,
  toolVerifyEvolutionCandidate,
  recordPropositionAcceptance,
  recordPropositionRejection,
  toolAuditRecoveryState,
  toolSearchBiomechanicalIndex,
  CURATED_BIOMECHANICAL_EVOLUTIONS,
} from "../../../src/lib/ai/coach-agent";
import {
  adaptDailyWorkoutSession,
  PlannedSessionExerciseInput,
} from "../../../src/lib/ai/daily-session-adapter";
import {
  gymVisionInventoryStore,
  isMalformedPhotoDataUri,
} from "../../../src/lib/ai/gym-vision-inventory";
import { POST as evolvePostRoute } from "../../../src/app/api/ai/evolve/route";
import { POST as adaptDayPostRoute } from "../../../src/app/api/ai/adapt-day/route";
import { __setMockFirebaseAdminForTesting } from "../../../src/lib/firebase/admin";
import { ALAA_CANONICAL_EMAIL } from "../../../src/lib/auth/server-session";
import { WorkoutSession, ExerciseBiofeedbackTag } from "../../../src/lib/types";

function makeSession(
  id: string,
  date: string,
  exerciseName: string,
  sets: Array<{ weightKg: number; reps: number; rir?: number }>,
  feedback?: {
    tag?: ExerciseBiofeedbackTag;
    note?: string;
    audioNoteUrl?: string;
  }
): WorkoutSession {
  return {
    id,
    traineeId: "trainee_alaa",
    programDayId: "day_push_a",
    date,
    startedAt: `${date}T18:00:00Z`,
    endedAt: `${date}T19:00:00Z`,
    durationSec: 3600,
    setLogs: sets.map((s, idx) => ({
      exerciseName,
      setIndex: idx + 1,
      weightKg: s.weightKg,
      reps: s.reps,
      rir: s.rir ?? 1,
      completed: true,
    })),
    exerciseFeedbacks: feedback
      ? [
          {
            exerciseName,
            tag: feedback.tag,
            tags: feedback.tag ? [feedback.tag] : [],
            note: feedback.note,
            audioNoteUrl: feedback.audioNoteUrl,
          },
        ]
      : [],
  };
}

const SAMPLE_PLANNED_EXERCISES: PlannedSessionExerciseInput[] = [
  {
    id: "ex_1",
    name: "Incline Dumbbell Press",
    targetSets: 4,
    repLow: 8,
    repHigh: 12,
    targetRir: 1,
    restSeconds: 90,
    currentWeight: 32,
    equipment: "dumbbell",
    target: "chest",
  },
  {
    id: "ex_2",
    name: "Standing Barbell Overhead Press",
    targetSets: 4,
    repLow: 8,
    repHigh: 10,
    targetRir: 1,
    restSeconds: 90,
    currentWeight: 50,
    equipment: "barbell",
    target: "shoulders",
  },
  {
    id: "ex_3",
    name: "Bent-Over Barbell Row",
    targetSets: 4,
    repLow: 8,
    repHigh: 12,
    targetRir: 1,
    restSeconds: 90,
    currentWeight: 70,
    equipment: "barbell",
    target: "lats",
  },
  {
    id: "ex_4",
    name: "Pec Deck Machine Fly",
    targetSets: 3,
    repLow: 10,
    repHigh: 15,
    targetRir: 1,
    restSeconds: 60,
    currentWeight: 55,
    equipment: "machine",
    target: "chest",
  },
  {
    id: "ex_5",
    name: "Cable Tricep Pushdown",
    targetSets: 3,
    repLow: 10,
    repHigh: 15,
    targetRir: 1,
    restSeconds: 60,
    currentWeight: 30,
    equipment: "cable",
    target: "triceps",
  },
];

describe("Self-Evolving Athletic Program — Vector RAG, Multilingual French Ingestion & Autonomous Agentic Loop", () => {
  let memoryStore: SensoryMemoryStore;

  beforeEach(() => {
    memoryStore = new SensoryMemoryStore();
    memoryStore.clearForTesting();
    sensoryMemoryStore.clearForTesting();
    gymVisionInventoryStore.clearForTesting();
  });

  it("1. computes 64-D L2-normalized biomechanical & semantic vectors with accurate Cosine Similarity", () => {
    const v1 = computeBiomechanicalEmbedding({
      text: "lateral raise shoulder pinch trap compensation",
      muscleSubdivision: "deltoid_lateral",
      resistanceProfile: "lengthened",
      equipment: "cable",
      symptoms: ["anterior_shoulder_pinch"],
      compensations: ["upper_trap_shrugging"],
    });

    const v2 = computeBiomechanicalEmbedding({
      text: "dumbbell lateral raise shoulder pinch",
      muscleSubdivision: "deltoid_lateral",
      resistanceProfile: "shortened",
      equipment: "dumbbell",
      symptoms: ["anterior_shoulder_pinch"],
      compensations: ["upper_trap_shrugging"],
    });

    const vOrthogonal = computeBiomechanicalEmbedding({
      text: "hack squat quad pump",
      muscleSubdivision: "quad_lengthened",
      resistanceProfile: "lengthened",
      equipment: "machine",
      symptoms: [],
      compensations: [],
    });

    assert.equal(v1.length, VECTOR_DIMENSIONS);
    const norm = Math.sqrt(v1.reduce((acc, x) => acc + x * x, 0));
    assert.ok(Math.abs(norm - 1.0) < 0.001);

    const simAligned = cosineSimilarity(v1, v2);
    const simOrthogonal = cosineSimilarity(v1, vOrthogonal);

    assert.ok(simAligned > 0.65, `Expected simAligned > 0.65, got ${simAligned}`);
    assert.ok(simOrthogonal < 0.35, `Expected simOrthogonal < 0.35, got ${simOrthogonal}`);
  });

  it("2. ingests French voice memo transcripts via Dual-Representation Canonical Ingestion and retrieves them via English movement RAG", () => {
    const frenchTranscript =
      "Petit pincement à l'avant de l'épaule droite sur la descente, j'ai triché avec les trapèzes sur les 2 dernières reps";

    assert.equal(detectFeedbackLanguage(frenchTranscript), "fr");

    const extracted = extractCanonicalAthleticRepresentation({
      exerciseName: "Dumbbell Lateral Raise",
      tags: ["joint_strain"],
      rawText: frenchTranscript,
    });
    assert.equal(extracted.originalLanguage, "fr");
    assert.ok(extracted.biomechanicalEntities.symptoms.includes("anterior_shoulder_pinch"));
    assert.ok(extracted.biomechanicalEntities.compensations.includes("upper_trap_shrugging"));
    assert.equal(extracted.biomechanicalEntities.phase, "eccentric");
    assert.equal(extracted.biomechanicalEntities.severity, "acute");

    const node = memoryStore.ingest({
      traineeId: "trainee_alaa",
      sessionId: "sess_fr_1",
      date: "2026-11-01",
      exerciseName: "Dumbbell Lateral Raise",
      tags: ["joint_strain"],
      audioTranscript: frenchTranscript,
    });

    assert.equal(node.muscleSubdivision, "deltoid_lateral");
    assert.equal(node.embeddingVector.length, VECTOR_DIMENSIONS);

    const ragResults = memoryStore.queryRAG({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Lateral Raise",
      searchQuery: "shoulder joint pinch trap takeover",
      limit: 3,
    });

    assert.equal(ragResults.length, 1);
    assert.ok(ragResults[0].cosineSimilarity > 0.5);
    assert.ok(ragResults[0].entry.rawTranscription?.includes("pincement à l'avant de l'épaule"));
    assert.ok(ragResults[0].entry.biomechanicalEntities.symptoms.includes("anterior_shoulder_pinch"));
  });

  it("3. executes Tier 2 Surgical Exercise Swap after a 1-month shoulder plateau + French sensory feedback with full ReAct tool trace", () => {
    const sessions: WorkoutSession[] = [
      makeSession("s1", "2026-10-10", "Dumbbell Lateral Raise", [
        { weightKg: 14, reps: 9 },
        { weightKg: 14, reps: 9 },
        { weightKg: 14, reps: 8 },
      ]),
      makeSession("s2", "2026-10-17", "Dumbbell Lateral Raise", [
        { weightKg: 14, reps: 9 },
        { weightKg: 14, reps: 9 },
        { weightKg: 14, reps: 8 },
      ]),
      makeSession(
        "s3",
        "2026-10-24",
        "Dumbbell Lateral Raise",
        [
          { weightKg: 14, reps: 9 },
          { weightKg: 14, reps: 8 },
          { weightKg: 14, reps: 8 },
        ],
        {
          tag: "joint_strain",
          note: "Petit pincement à l'avant de l'épaule droite, j'ai triché avec les trapèzes",
        }
      ),
      makeSession("s4", "2026-10-31", "Dumbbell Lateral Raise", [
        { weightKg: 14, reps: 9 },
        { weightKg: 14, reps: 9 },
        { weightKg: 14, reps: 8 },
      ]),
    ];

    const prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Lateral Raise",
      currentWeightKg: 14,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      gymId: "punch_lissasfa",
      sessions,
    });

    assert.ok(prop !== null);
    assert.equal(prop.tier, "tier_2_surgical_swap");
    assert.ok(prop.mutation.newExerciseName?.toLowerCase().includes("cable"));
    assert.ok(prop.sensoryRagContext?.includes("pincement"));
    assert.ok(prop.agentTrace !== undefined);
    assert.equal(prop.agentTrace.verificationResult?.passed, true);
    assert.ok(prop.agentTrace.steps.length >= 5);

    const toolNamesCalled = prop.agentTrace.steps.map((s) => s.toolName);
    assert.ok(toolNamesCalled.includes("query_athlete_history"));
    assert.ok(toolNamesCalled.includes("rag_sensory_feedback"));
    assert.ok(toolNamesCalled.includes("get_gym_equipment_inventory"));
    assert.ok(toolNamesCalled.includes("search_6554_exercise_catalogue"));
    assert.ok(toolNamesCalled.includes("verify_evolution_candidate"));
  });

  it("4. enforces Evaluator-Optimizer Self-Correction when an initial candidate violates a Sensory RAG joint symptom guardrail", () => {
    const sessions: WorkoutSession[] = [
      makeSession("s1", "2026-10-10", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
      makeSession("s2", "2026-10-17", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
      makeSession(
        "s3",
        "2026-10-24",
        "Dumbbell Lateral Raise",
        [{ weightKg: 14, reps: 9 }],
        {
          tag: "joint_strain",
          note: "Pincement à l'avant de l'épaule droite et trapèzes",
        }
      ),
    ];

    const directGuardrail = toolVerifyEvolutionCandidate({
      candidateName: "Barbell Upright Row",
      candidateEquipment: "barbell",
      candidateProfile: "shortened",
      previousEquipment: "dumbbell",
      previousProfile: "shortened",
      gymAvailableEquipment: ["barbell", "dumbbell", "cable", "machine"],
      detectedSymptoms: ["anterior_shoulder_pinch"],
      detectedCompensations: ["upper_trap_shrugging"],
    });
    assert.equal(directGuardrail.passed, false);
    assert.ok(directGuardrail.rejectionReasons.length > 0);

    const prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Lateral Raise",
      currentWeightKg: 14,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      gymId: "punch_lissasfa",
      sessions,
      simulateInitialCandidateCheck: {
        name: "Barbell Upright Row",
        equipment: "barbell",
        profile: "shortened",
      },
    });

    assert.ok(prop !== null);
    assert.ok(prop.agentTrace.selfCorrectionRetries >= 1);
    assert.equal(prop.agentTrace.verificationResult?.passed, true);
    assert.notEqual(prop.mutation.newExerciseName, "Barbell Upright Row");
  });

  it("5. executes Tier 3 Junk Volume Pruning, Tier 4 Overload Jump, Tier 5 Systemic CNS Deload Pivot, and Tier 1 Setup Cue", () => {
    const junkVolumeSessions: WorkoutSession[] = [
      makeSession(
        "jv1",
        "2026-11-01",
        "Incline Dumbbell Press",
        [
          { weightKg: 32, reps: 12 },
          { weightKg: 32, reps: 11 },
          { weightKg: 32, reps: 10 },
          { weightKg: 32, reps: 6 },
        ],
        { tag: "heavy", note: "Heavy fatigue by set 4" }
      ),
    ];

    const tier3Prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Incline Dumbbell Press",
      currentWeightKg: 32,
      targetSets: 4,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: junkVolumeSessions,
    });

    assert.ok(tier3Prop !== null);
    assert.equal(tier3Prop.tier, "tier_3_volume_prune");
    assert.equal(tier3Prop.mutation.newTargetSets, 3);

    const overloadSessions: WorkoutSession[] = [
      makeSession("ov1", "2026-10-25", "Seated Cable Row", [
        { weightKg: 70, reps: 12 },
        { weightKg: 70, reps: 12 },
      ]),
      makeSession("ov2", "2026-11-01", "Seated Cable Row", [
        { weightKg: 70, reps: 12 },
        { weightKg: 70, reps: 12 },
      ]),
    ];

    const tier4Prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Seated Cable Row",
      currentWeightKg: 70,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "cable",
      sessions: overloadSessions,
    });

    assert.ok(tier4Prop !== null);
    assert.equal(tier4Prop.tier, "tier_4_overload_protocol");
    assert.equal(tier4Prop.mutation.newTargetWeightKg, 72.5);

    const tier5Prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Barbell Back Squat",
      currentWeightKg: 100,
      targetSets: 4,
      repLow: 6,
      repHigh: 10,
      targetRir: 1,
      equipment: "barbell",
      sessions: [],
      sleepHours: 4.8,
      readinessFeeling: "depleted",
    });

    assert.ok(tier5Prop !== null);
    assert.equal(tier5Prop.tier, "tier_5_macro_pivot");
    assert.ok((tier5Prop.mutation.newTargetSets ?? 4) < 4);
    assert.ok((tier5Prop.mutation.newTargetWeightKg ?? 100) < 100);

    const balanceSessions: WorkoutSession[] = [
      makeSession(
        "bal1",
        "2026-11-01",
        "Bulgarian Split Squat",
        [{ weightKg: 24, reps: 10 }],
        { tag: "balance_issue" }
      ),
    ];

    const tier1Prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Bulgarian Split Squat",
      currentWeightKg: 24,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: balanceSessions,
    });

    assert.ok(tier1Prop !== null);
    assert.equal(tier1Prop.tier, "tier_1_micro_setup");
    assert.ok(tier1Prop.mutation.newFormCue !== undefined);
  });

  it("6. exposes POST /api/ai/evolve route with live French feedback ingestion and multi-step tool trace", async () => {
    assert.ok(VERTEX_AGENT_TOOL_DECLARATIONS.length >= 10);

    const sessions: WorkoutSession[] = [
      makeSession("s1", "2026-10-10", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
      makeSession("s2", "2026-10-17", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
      makeSession("s3", "2026-10-24", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
    ];

    __setMockFirebaseAdminForTesting({
      auth: {
        verifyIdToken: async (token: string) => {
          if (token === "tok_alaa_agentic") {
            return {
              uid: "fb_alaa_agentic",
              email: ALAA_CANONICAL_EMAIL,
              email_verified: true,
              firebase: { identities: {}, sign_in_provider: "password" },
            };
          }
          throw new Error("Invalid token");
        },
        verifySessionCookie: async () => {
          throw new Error("Invalid cookie");
        },
      },
    });

    try {
      const req = new Request("http://localhost:3000/api/ai/evolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_alaa_agentic",
        },
        body: JSON.stringify({
          traineeId: "trainee_alaa",
          exerciseName: "Dumbbell Lateral Raise",
          currentWeightKg: 14,
          targetSets: 3,
          repLow: 8,
          repHigh: 12,
          targetRir: 1,
          equipment: "dumbbell",
          gymId: "punch_lissasfa",
          sessions,
          feedbackToIngest: {
            traineeId: "trainee_alaa",
            sessionId: "s3",
            date: "2026-10-24",
            exerciseName: "Dumbbell Lateral Raise",
            tags: ["joint_strain"],
            audioTranscript:
              "Pincement à l'épaule droite sur la descente, j'ai triché avec les trapèzes",
          },
        }),
      });

      const res = await evolvePostRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.ok, true);
      assert.ok(json.ingestedSensoryNode !== null);
      assert.equal(json.ingestedSensoryNode.detectedLanguage, "fr");
      assert.ok(json.ingestedSensoryNode.extractedSymptoms.includes("anterior_shoulder_pinch"));
      assert.equal(json.ingestedSensoryNode.embeddingDimensions, 64);
      assert.ok(json.proposition !== null);
      assert.equal(json.proposition.tier, "tier_2_surgical_swap");
      assert.ok(json.turnsExecuted >= 5);
      assert.ok(json.toolCallsHistory.length >= 5);
    } finally {
      __setMockFirebaseAdminForTesting(null);
    }
  });

  it("7. adapts today's workout ephemerally for Poor Recovery & Low Energy without modifying the long-term program", async () => {
    const result = await adaptDailyWorkoutSession({
      traineeId: "trainee_alaa",
      voiceOrTextMessage:
        "I didn't sleep well last night and I'm feeling exhausted today, so let's make today's workout lighter.",
      gymId: "gym_punch_lissasfa",
      exercises: SAMPLE_PLANNED_EXERCISES,
    });

    assert.equal(result.scope, "TODAY_SESSION_ONLY");
    assert.equal(result.longTermProgramModified, false);
    assert.ok(result.detectedConstraints.includes("poor_recovery"));
    assert.ok(result.detectedConstraints.includes("low_energy"));

    const firstEx = result.adaptedExercises[0];
    assert.ok(firstEx.currentWeight < firstEx.originalWeight);
    assert.equal(firstEx.targetSets, 3); // trimmed from 4 to 3
    assert.equal(firstEx.targetRir, 3); // buffered from 1 to 3
  });

  it("8. adapts today's workout for Football Abdominal Injury by replacing high core-bracing exercises with seated/chest-supported variations", async () => {
    const result = await adaptDailyWorkoutSession({
      traineeId: "trainee_alaa",
      voiceOrTextMessage:
        "I hurt my abdominals playing football yesterday, so please take that into consideration and avoid exercises that could aggravate the pain.",
      gymId: "gym_punch_lissasfa",
      exercises: SAMPLE_PLANNED_EXERCISES,
    });

    assert.equal(result.scope, "TODAY_SESSION_ONLY");
    assert.equal(result.longTermProgramModified, false);
    assert.ok(result.detectedPainRegions.includes("abdominals"));

    // Standing Barbell Overhead Press -> Seated Back-Supported Dumbbell Shoulder Press
    const ohp = result.adaptedExercises.find(
      (e) => e.originalName === "Standing Barbell Overhead Press"
    );
    assert.ok(ohp !== undefined);
    assert.ok(ohp.name.toLowerCase().includes("seated"));

    // Bent-Over Barbell Row -> Chest-Supported Machine / Incline Bench Row
    const row = result.adaptedExercises.find(
      (e) => e.originalName === "Bent-Over Barbell Row"
    );
    assert.ok(row !== undefined);
    assert.ok(row.name.toLowerCase().includes("chest-supported"));
  });

  it("9. compresses workout into a 20-minute priority compound session when athlete has an unexpected meeting", async () => {
    const result = await adaptDailyWorkoutSession({
      traineeId: "trainee_alaa",
      voiceOrTextMessage:
        "I have an unexpected meeting, so I only have 20 minutes today. Let's focus on the most important exercises.",
      gymId: "gym_punch_lissasfa",
      exercises: SAMPLE_PLANNED_EXERCISES,
    });

    assert.equal(result.scope, "TODAY_SESSION_ONLY");
    assert.equal(result.longTermProgramModified, false);
    assert.equal(result.targetDurationMinutes, 20);
    assert.ok(result.estimatedAdaptedDurationMinutes <= 20);

    const active = result.adaptedExercises.filter((e) => !e.skippedForToday);
    const skipped = result.adaptedExercises.filter((e) => e.skippedForToday);

    assert.equal(active.length, 3); // top 3 compound priorities kept
    assert.equal(skipped.length, 2); // 2 accessories deferred for today
    assert.equal(active[0].targetSets, 2); // Minimum Effective Dose 2 sets
    assert.equal(active[0].restSeconds, 45);
  });

  it("10. recognizes gym equipment limitations from location/photo via POST /api/ai/adapt-day and substitutes missing cable/machine exercises", async () => {
    __setMockFirebaseAdminForTesting({
      auth: {
        verifyIdToken: async (token: string) => {
          if (token === "tok_alaa_agentic") {
            return {
              uid: "fb_alaa_agentic",
              email: ALAA_CANONICAL_EMAIL,
              email_verified: true,
              firebase: { identities: {}, sign_in_provider: "password" },
            };
          }
          throw new Error("Invalid token");
        },
        verifySessionCookie: async () => {
          throw new Error("Invalid cookie");
        },
      },
    });

    try {
      const req = new Request("http://localhost:3000/api/ai/adapt-day", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tok_alaa_agentic",
        },
        body: JSON.stringify({
          traineeId: "trainee_alaa",
          voiceOrTextMessage:
            "Training at hotel gym today, only dumbbells and a bench in the photo.",
          gymId: "gym_hotel_express",
          gymName: "Hotel Express Gym",
          gymPhotoCaption: "only dumbbells and adjustable bench, no cables or machines",
          exercises: SAMPLE_PLANNED_EXERCISES,
        }),
      });

      const res = await adaptDayPostRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.ok, true);
      const adaptation = json.adaptation;
      assert.equal(adaptation.scope, "TODAY_SESSION_ONLY");
      assert.equal(adaptation.longTermProgramModified, false);
      assert.ok(
        adaptation.gymInventoryUsed.availableCategories.includes("dumbbell")
      );
      assert.ok(
        !adaptation.gymInventoryUsed.availableCategories.includes("cable")
      );

      // Verify cable and machine exercises were replaced with available dumbbell equipment
      for (const ex of adaptation.adaptedExercises) {
        assert.notEqual(ex.equipment, "cable");
        assert.notEqual(ex.equipment, "machine");
        assert.notEqual(ex.equipment, "barbell");
      }
    } finally {
      __setMockFirebaseAdminForTesting(null);
    }
  });

  it("11. autonomously processes arbitrary open-ended athlete feedback (wrist tenderness + extra biceps focus + peak energy PR push) beyond preset examples", async () => {
    const result = await adaptDailyWorkoutSession({
      traineeId: "trainee_alaa",
      voiceOrTextMessage:
        "My left wrist hurts on barbell grips, and I'm feeling super strong today so let's add extra focus on biceps!",
      gymId: "gym_punch_lissasfa",
      exercises: SAMPLE_PLANNED_EXERCISES,
    });

    assert.equal(result.scope, "TODAY_SESSION_ONLY");
    assert.equal(result.longTermProgramModified, false);
    assert.ok(result.detectedPainRegions.includes("wrists"));
    assert.ok(result.detectedFocusRegions.includes("biceps"));
    assert.ok(result.detectedConstraints.includes("peak_energy_push"));

    // Verify barbell movements were adapted to cuff/neutral-grip wrist-sparing variations
    const ohp = result.adaptedExercises.find(
      (e) => e.originalName === "Standing Barbell Overhead Press"
    );
    assert.ok(ohp !== undefined);
    assert.ok(ohp.wasAdapted);
    assert.ok(ohp.name.toLowerCase().includes("cuff") || ohp.name.toLowerCase().includes("neutral"));

    // Verify a bonus biceps movement was injected from the 6,554-exercise catalogue
    const injectedBiceps = result.adaptedExercises.find((e) => e.isInjectedBonus);
    assert.ok(injectedBiceps !== undefined);
    assert.equal(injectedBiceps.target, "biceps");

    // Verify primary compound load was boosted for peak energy push
    const inclinePress = result.adaptedExercises[0];
    assert.ok(inclinePress.currentWeight > inclinePress.originalWeight);
  });

  it("12. classifies Reverse Fly as posterior deltoid (never chest), prevents cross-exercise RAG contamination, and updates videoUrl on swap", () => {
    // 1. Reverse fly & chest-supported row must never be misclassified as chest
    assert.equal(inferPrimaryMuscleFromExerciseName("lever seated reverse fly"), "shoulders");
    assert.equal(inferPrimaryMuscleFromExerciseName("Reverse Pec Deck"), "shoulders");
    assert.equal(inferPrimaryMuscleFromExerciseName("chest-supported dumbbell reverse fly"), "shoulders");
    assert.equal(inferPrimaryMuscleFromExerciseName("chest-supported dumbbell row"), "lats");

    // 2. Logging joint strain on a chest press must NOT trigger a proposition on lever seated reverse fly
    const chestStrainSessions: WorkoutSession[] = [
      makeSession(
        "s_chest_1",
        "2026-11-01",
        "lever incline chest press",
        [{ weightKg: 20, reps: 10 }],
        { tag: "joint_strain", note: "Slight pec tightness" }
      ),
    ];

    const noFalsePositiveProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "lever seated reverse fly",
      currentWeightKg: 40,
      targetSets: 3,
      repLow: 12,
      repHigh: 15,
      targetRir: 2,
      equipment: "machine",
      sessions: chestStrainSessions,
    });
    assert.equal(noFalsePositiveProp, null);

    // 3. When lever seated reverse fly legitimately plateaus, it proposes a posterior deltoid evolution (never Plate Chest Machine) with an updated videoUrl
    const reverseFlyPlateauSessions: WorkoutSession[] = [
      makeSession("rf1", "2026-10-15", "lever seated reverse fly", [{ weightKg: 40, reps: 12 }]),
      makeSession("rf2", "2026-10-22", "lever seated reverse fly", [{ weightKg: 40, reps: 12 }]),
      makeSession("rf3", "2026-10-29", "lever seated reverse fly", [{ weightKg: 40, reps: 12 }]),
    ];

    const rearDeltProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "lever seated reverse fly",
      currentWeightKg: 40,
      targetSets: 3,
      repLow: 12,
      repHigh: 15,
      targetRir: 2,
      equipment: "machine",
      sessions: reverseFlyPlateauSessions,
    });

    assert.ok(rearDeltProp !== null);
    assert.equal(rearDeltProp.muscleSubdivision, "deltoid_posterior");
    assert.ok(
      !rearDeltProp.mutation.newExerciseName?.toLowerCase().includes("chest press"),
      `Expected rear delt replacement, got ${rearDeltProp.mutation.newExerciseName}`
    );
    assert.ok(rearDeltProp.mutation.newVideoUrl);
    assert.ok(
      !rearDeltProp.mutation.newVideoUrl.toLowerCase().includes("lever%20seated%20reverse%20fly"),
      "Swapped exercise videoUrl must not retain original exercise video query"
    );

    // 4. resolveExerciseVideoUrl heals stale draft video URLs when exercise name has changed and applies Google/YouTube search magic
    const healedUrl = resolveExerciseVideoUrl("Reverse Cable Crossover (Chest-Supported)", {
      previousExerciseName: "lever seated reverse fly",
      previousVideoUrl:
        "https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form",
    });
    assert.ok(healedUrl.toLowerCase().includes("reverse%20cable%20crossover"));
    assert.ok(healedUrl.includes("sp=EgIYAQ%3D%3D"), "Must include YouTube <4 min short duration filter");
    assert.ok(decodeURIComponent(healedUrl).includes("rear delt"), "Must disambiguate rear delt target");
    assert.ok(decodeURIComponent(healedUrl).includes("-vlog"), "Must exclude vlog/podcast noise");
  });

  it("13. Objective A: dynamically selects valid non-curated exercises from 731 OpenGym catalogue and enforces injury contraindication filtering", async () => {
    // 1. Query biomechanical index directly on a movement not in the 11 curated evolutions table
    const searchRes = toolSearchBiomechanicalIndex({
      exerciseName: "Standing Dumbbell Hammer Curl",
      primaryMuscle: "biceps",
      currentEquipment: "dumbbell",
      preferredEquipment: ["cable", "machine"],
      gymAvailableEquipment: ["dumbbell", "cable", "machine", "barbell"],
    });

    assert.ok(searchRes.exerciseId, "Must return an exercise from the OpenGym catalogue");
    assert.ok(searchRes.catalogueCandidatesCount > 0, "Must evaluate dynamic catalogue candidates");
    assert.ok(
      searchRes.replacementName.toLowerCase() !== "standing dumbbell hammer curl",
      "Must recommend an alternative movement"
    );

    // 2. Active injury contraindication: shoulder impingement contraindicates overhead pressing
    const plateauOverheadSessions: WorkoutSession[] = [
      makeSession("ohp1", "2026-10-15", "Standing Barbell Overhead Press", [{ weightKg: 50, reps: 8 }]),
      makeSession("ohp2", "2026-10-22", "Standing Barbell Overhead Press", [{ weightKg: 50, reps: 8 }]),
      makeSession("ohp3", "2026-10-29", "Standing Barbell Overhead Press", [{ weightKg: 50, reps: 8 }]),
    ];

    const prop = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Standing Barbell Overhead Press",
      currentWeightKg: 50,
      targetSets: 4,
      repLow: 8,
      repHigh: 10,
      targetRir: 1,
      equipment: "barbell",
      sessions: plateauOverheadSessions,
      injuries: ["shoulder_impingement"],
      gymId: "gym_punch_lissasfa",
    });

    assert.ok(prop !== null, "Must propose an evolution for plateaued overhead press with shoulder impingement");
    // Verify replacement is NOT another aggravating overhead barbell press
    assert.ok(
      !prop.mutation.newExerciseName?.toLowerCase().includes("standing barbell overhead press"),
      "Must not swap to identical exercise"
    );
    assert.ok(
      prop.tier === "tier_2_surgical_swap",
      "Must be a Tier 2 surgical swap"
    );
    assert.ok(prop.agentTrace.verificationResult?.passed, "Must pass evaluator-optimizer verification");
  });

  it("14. Objective B: processes gym photographs via vision inventory, supports session unavailability, and gracefully handles deduplication and malformed payloads", async () => {
    // 1. Analyze setup photo with confirmed and limitation hints
    const photoResult = await gymVisionInventoryStore.analyzeGymPhotoAndUpdateInventory({
      gymId: "gym_test_vision_01",
      gymName: "Test Elite Fitness",
      traineeId: "trainee_alaa",
      photoDataUri: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      userCaptionOrHint: "Dumbbells up to 30kg, adjustable incline bench, dual cable tower. No barbells or leg press.",
    });

    assert.equal(photoResult.recognition.status, "completed");
    assert.ok(photoResult.updatedInventory.availableCategories.includes("dumbbell"));
    assert.ok(photoResult.updatedInventory.availableCategories.includes("cable"));
    assert.ok(photoResult.updatedInventory.unavailableEquipment.includes("barbell"));

    // 2. Photo deduplication: sending identical photoDataUri and caption returns deduplicated status without corrupting inventory
    const dedupResult = await gymVisionInventoryStore.analyzeGymPhotoAndUpdateInventory({
      gymId: "gym_test_vision_01",
      gymName: "Test Elite Fitness",
      traineeId: "trainee_alaa",
      photoDataUri: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      userCaptionOrHint: "Dumbbells up to 30kg, adjustable incline bench, dual cable tower. No barbells or leg press.",
    });
    assert.equal(dedupResult.recognition.status, "deduplicated");

    // 3. Malformed/corrupted photo resilience: handles corrupted payload gracefully without throwing or wiping inventory
    assert.equal(isMalformedPhotoDataUri("data:image/jpeg;base64,CORRUPTED_TRUNCATED").malformed, true);
    assert.equal(isMalformedPhotoDataUri("not_a_valid_uri").malformed, true);

    const failedPhotoResult = await gymVisionInventoryStore.analyzeGymPhotoAndUpdateInventory({
      gymId: "gym_test_vision_01",
      gymName: "Test Elite Fitness",
      traineeId: "trainee_alaa",
      photoDataUri: "data:image/jpeg;base64,CORRUPTED_IMAGE_DATA_MALFORMED",
    });
    assert.equal(failedPhotoResult.recognition.status, "failed");
    assert.ok(failedPhotoResult.updatedInventory.availableCategories.length > 0, "Preserved prior inventory");

    // 4. Mark specific equipment unavailable for current session
    gymVisionInventoryStore.markEquipmentUnavailableForSession({
      gymId: "gym_test_vision_01",
      equipment: ["cable"],
      traineeId: "trainee_alaa",
    });
    const effectiveEquip = gymVisionInventoryStore.getEffectiveAvailableEquipment("gym_test_vision_01", undefined, "trainee_alaa");
    assert.ok(!effectiveEquip.includes("cable"), "Cable must be excluded from effective available equipment");
  });

  it("15. Objective C: validates audio payloads, ingests French/English voice recordings, and extracts positive performance signals into sensory memory", async () => {
    // 1. Audio validation
    assert.equal(validateAudioDataUri("").valid, false);
    assert.equal(validateAudioDataUri("data:audio/wav;base64,").valid, false);
    assert.equal(validateAudioDataUri("data:text/plain;base64,aGVsbG8=").valid, false);

    const validVoiceUri =
      "data:audio/webm;codecs=opus;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAA1k3+Sg==";
    assert.equal(validateAudioDataUri(validVoiceUri).valid, true);

    // 2. Transcribe & ingest English note with mechanical friction
    const enAudioWithTranscript = embedTranscriptInAudioDataUri(
      validVoiceUri,
      "Elbow clicking when going heavy, felt sharp triceps tendon friction"
    );
    const enResult = await sensoryMemoryStore.transcribeAndIngestAudio({
      traineeId: "trainee_test_audio",
      exerciseName: "Skull Crusher",
      audioDataUri: enAudioWithTranscript,
    });
    assert.ok(enResult.audioTranscript?.includes("Elbow clicking"));
    assert.equal(enResult.status, "completed");

    // 3. Transcribe & ingest French note with positive performance signals
    const frAudioWithTranscript = embedTranscriptInAudioDataUri(
      validVoiceUri,
      "Excellente congestion sur le biceps, mouvement tres fluide et sensation optimale"
    );
    const frResult = await sensoryMemoryStore.transcribeAndIngestAudio({
      traineeId: "trainee_test_audio",
      exerciseName: "Incline Dumbbell Curl",
      audioDataUri: frAudioWithTranscript,
    });
    assert.equal(frResult.detectedLanguage, "fr");
    assert.ok(frResult.audioTranscript?.includes("congestion"));

    // Verify positive signals extracted
    const entrySigs = frResult.sensoryEntry?.biomechanicalEntities?.positiveSignals || [];
    assert.ok(
      entrySigs.length > 0 &&
      entrySigs.some((s) => s.includes("optimal") || s.includes("smooth") || s.includes("strong")),
      "Must extract positive performance signals"
    );

    const frMatches = sensoryMemoryStore.queryRAG({
      traineeId: "trainee_test_audio",
      exerciseName: "Incline Dumbbell Curl",
    });
    assert.ok(frMatches.length > 0);
    const matchSigs = frMatches[0].entry.biomechanicalEntities?.positiveSignals || [];
    assert.ok(
      matchSigs.length > 0 &&
      matchSigs.some((s) => s.includes("optimal") || s.includes("smooth") || s.includes("strong")),
      "RAG match must retain positive performance signals"
    );

    // 4. Job deduplication: re-submitting identical audio job returns existing completed job
    const dedupJob = await sensoryMemoryStore.transcribeAndIngestAudio({
      traineeId: "trainee_test_audio",
      exerciseName: "Incline Dumbbell Curl",
      audioDataUri: frAudioWithTranscript,
    });
    assert.equal(dedupJob.status, "deduplicated");
    assert.equal(dedupJob.audioTranscript, frResult.audioTranscript);
  });

  it("16. Phase 3 Rules 1 & 2: enforces exception-based trigger gate (~85-90% null) and strict 3-session stagnation requirement", async () => {
    // Rule 1: Normal steady-state workouts without plateau or pain return null
    const normalSessions: WorkoutSession[] = [
      makeSession("norm_1", "2026-10-20", "Barbell Back Squat", [{ weightKg: 100, reps: 6 }]),
    ];
    const normalProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Barbell Back Squat",
      currentWeightKg: 100,
      targetSets: 3,
      repLow: 6,
      repHigh: 8,
      targetRir: 2,
      equipment: "barbell",
      sessions: normalSessions,
    });
    assert.equal(normalProp, null, "Normal session without stagnation or pain must return null");

    // Rule 2: 2 sessions at same weight is NOT enough to trigger plateau (requires >= 3)
    const twoSessionStall: WorkoutSession[] = [
      makeSession("two_1", "2026-10-15", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 12 }]),
      makeSession("two_2", "2026-10-22", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 12 }]),
    ];
    const twoSessionProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Lateral Raise",
      currentWeightKg: 14,
      targetSets: 3,
      repLow: 10,
      repHigh: 15,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: twoSessionStall,
    });
    assert.equal(twoSessionProp, null, "2 stagnant sessions must not trigger a swap");

    // Rule 2: 3 sessions that progressed reps (10 -> 12 -> 14) is NOT plateaued
    const progressingSessions: WorkoutSession[] = [
      makeSession("prog_1", "2026-10-10", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 10 }]),
      makeSession("prog_2", "2026-10-17", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 12 }]),
      makeSession("prog_3", "2026-10-24", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 14 }]),
    ];
    const progProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Lateral Raise",
      currentWeightKg: 14,
      targetSets: 3,
      repLow: 10,
      repHigh: 15,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: progressingSessions,
    });
    assert.equal(progProp, null, "Progressing repetitions must never trigger plateau swap");

    // Rule 2: 3 sessions with 0kg and 0 rep progress DOES trigger Tier 2 surgical swap
    const truePlateauSessions: WorkoutSession[] = [
      makeSession("plat_1", "2026-10-10", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 12 }]),
      makeSession("plat_2", "2026-10-17", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 12 }]),
      makeSession("plat_3", "2026-10-24", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 12 }]),
    ];
    const plateauProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Lateral Raise",
      currentWeightKg: 14,
      targetSets: 3,
      repLow: 10,
      repHigh: 15,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: truePlateauSessions,
      gymId: "gym_punch_lissasfa",
    });
    assert.ok(plateauProp !== null, "Genuine 3-session plateau must trigger a proposition");
    assert.equal(plateauProp.tier, "tier_2_surgical_swap");
  });

  it("17. Phase 3 Rules 3 & 4: intervenes immediately on exact exercise pain/compensation, and requires >=2 consecutive sessions for overload progression", async () => {
    // Rule 3: Single session with exact joint strain triggers Tier 2 without waiting for 3 sessions
    const painSession: WorkoutSession[] = [
      makeSession(
        "pain_1",
        "2026-11-01",
        "Flat Barbell Bench Press",
        [{ weightKg: 80, reps: 8 }],
        { tag: "joint_strain", note: "Anterior shoulder pinch at bottom of press" }
      ),
    ];
    const painProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Flat Barbell Bench Press",
      currentWeightKg: 80,
      targetSets: 4,
      repLow: 6,
      repHigh: 8,
      targetRir: 1,
      equipment: "barbell",
      sessions: painSession,
      gymId: "gym_punch_lissasfa",
    });
    assert.ok(painProp !== null, "Exact exercise joint strain must trigger intervention");
    assert.equal(painProp.tier, "tier_2_surgical_swap");

    // Rule 4: Overload progression requires >= 2 consecutive sessions at repHigh
    // A single session at ceiling does NOT trigger overload jump
    const singleCeilingSession: WorkoutSession[] = [
      makeSession("ceil_1", "2026-11-01", "Dumbbell Bicep Curl", [{ weightKg: 16, reps: 12 }]),
    ];
    const singleCeilingProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Bicep Curl",
      currentWeightKg: 16,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: singleCeilingSession,
    });
    assert.equal(singleCeilingProp, null, "Single session hitting ceiling must not trigger overload jump");

    // >= 2 consecutive sessions at repHigh DOES trigger Tier 4 Overload Progression (+2.5kg jump)
    const twoCeilingSessions: WorkoutSession[] = [
      makeSession("ceil_1", "2026-10-25", "Dumbbell Bicep Curl", [{ weightKg: 16, reps: 12 }]),
      makeSession("ceil_2", "2026-11-01", "Dumbbell Bicep Curl", [{ weightKg: 16, reps: 12 }]),
    ];
    const overloadProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Dumbbell Bicep Curl",
      currentWeightKg: 16,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: twoCeilingSessions,
    });
    assert.ok(overloadProp !== null, "Two consecutive ceiling sessions must trigger overload jump");
    assert.equal(overloadProp.tier, "tier_4_overload_protocol");
    assert.equal(overloadProp.mutation.newTargetWeightKg, 18.5);
  });

  it("18. Phase 3 Rules 5 & 6: audits recovery truthfully without false deloads, and respects acceptance/rejection decision memory", async () => {
    // Rule 5: Truthful recovery - undefined sleep produces missing_biometrics, NOT a deload
    const unmeasuredAudit = toolAuditRecoveryState({
      sleepHours: undefined,
      readinessFeeling: undefined,
    });
    assert.equal(unmeasuredAudit.dataStatus, "missing_biometrics");
    assert.equal(unmeasuredAudit.requiresMacroDeload, false);

    // High CNS compound movement does NOT deload when biometrics are missing
    const compoundSessions: WorkoutSession[] = [
      makeSession("dl_1", "2026-11-01", "Barbell Deadlift", [{ weightKg: 140, reps: 5 }]),
    ];
    const noDeloadProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Barbell Deadlift",
      currentWeightKg: 140,
      targetSets: 4,
      repLow: 4,
      repHigh: 6,
      targetRir: 2,
      equipment: "barbell",
      sessions: compoundSessions,
      sleepHours: undefined,
    });
    assert.equal(noDeloadProp, null, "Must not trigger false deload on missing biometrics");

    // Confirmed poor recovery (sleep 4.5h, poor readiness) triggers Tier 5 CNS deload on high-CNS movement
    const poorRecoveryProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Barbell Deadlift",
      currentWeightKg: 140,
      targetSets: 4,
      repLow: 4,
      repHigh: 6,
      targetRir: 2,
      equipment: "barbell",
      sessions: compoundSessions,
      sleepHours: 4.5,
      readinessFeeling: "exhausted",
      sessionId: "session_recovery_test",
    });
    assert.ok(poorRecoveryProp !== null);
    assert.equal(poorRecoveryProp.tier, "tier_5_macro_pivot");

    // Session deload must not repeat on subsequent exercise when sessionDeloadAlreadyApplied is true
    const secondExerciseProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      exerciseName: "Barbell Back Squat",
      currentWeightKg: 120,
      targetSets: 4,
      repLow: 6,
      repHigh: 8,
      targetRir: 2,
      equipment: "barbell",
      sessions: compoundSessions,
      sleepHours: 4.5,
      readinessFeeling: "exhausted",
      sessionId: "session_recovery_test",
      sessionDeloadAlreadyApplied: true,
    });
    assert.equal(secondExerciseProp, null, "Must not repeat session deload on subsequent exercise");

    // Rule 6: Acceptance persistence - accepted exercise swaps are not immediately re-proposed
    recordPropositionAcceptance({
      traineeId: "trainee_alaa",
      sessionId: "session_mem_test",
      oldExerciseName: "Standing Barbell Overhead Press",
      newExerciseName: "Seated Dumbbell Shoulder Press",
    });

    const acceptedProp = evaluateJustInTimeProposition({
      traineeId: "trainee_alaa",
      sessionId: "session_mem_test",
      exerciseName: "Seated Dumbbell Shoulder Press",
      currentWeightKg: 24,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
      targetRir: 1,
      equipment: "dumbbell",
      sessions: compoundSessions,
    });
    assert.equal(acceptedProp, null, "Accepted swap must not be immediately re-proposed");

    // Rule 6: Rejection persistence - rejected propositions with identical evidence are suppressed
    recordPropositionRejection({
      traineeId: "trainee_rejection_test",
      exerciseName: "Triceps Pushdown",
      evidenceFingerprint: "rejected",
    });

    const rejectedProp = evaluateJustInTimeProposition({
      traineeId: "trainee_rejection_test",
      exerciseName: "Triceps Pushdown",
      currentWeightKg: 25,
      targetSets: 3,
      repLow: 10,
      repHigh: 12,
      targetRir: 1,
      equipment: "cable",
      sessions: compoundSessions,
    });
    assert.equal(rejectedProp, null, "Rejected proposition with same evidence must be suppressed");
  });

  it("19. protects tight knee joint ('left knee feels tight') without misclassifying 'quad-safe' as quad pain", async () => {
    const legExercises = [
      {
        id: "ex_squat",
        name: "Barbell Back Squat",
        equipment: "barbell",
        target: "quads",
        targetSets: 4,
        repLow: 6,
        repHigh: 8,
        currentWeight: 100,
        restSeconds: 120,
        targetRir: 2,
      },
      {
        id: "ex_rdl",
        name: "Romanian Deadlift",
        equipment: "barbell",
        target: "hamstrings",
        targetSets: 3,
        repLow: 8,
        repHigh: 10,
        currentWeight: 90,
        restSeconds: 90,
        targetRir: 2,
      },
      {
        id: "ex_lunge",
        name: "Walking Dumbbell Lunge",
        equipment: "dumbbell",
        target: "quads",
        targetSets: 3,
        repLow: 10,
        repHigh: 12,
        currentWeight: 20,
        restSeconds: 75,
        targetRir: 2,
      },
      {
        id: "ex_calf",
        name: "Standing Calf Raise",
        equipment: "machine",
        target: "calves",
        targetSets: 3,
        repLow: 12,
        repHigh: 15,
        currentWeight: 60,
        restSeconds: 60,
        targetRir: 1,
      },
    ];

    const result = await adaptDailyWorkoutSession({
      traineeId: "anon_knee_test",
      voiceOrTextMessage:
        "left knee feels tight today, give me a quad-safe lower body option and keep it under 35 minutes",
      gymId: "gym_default_commercial",
      exercises: legExercises,
    });

    assert.equal(result.scope, "TODAY_SESSION_ONLY");
    assert.equal(result.longTermProgramModified, false);
    assert.ok(result.detectedPainRegions.includes("knees"));
    assert.ok(!result.detectedPainRegions.includes("quads"));
    assert.equal(result.targetDurationMinutes, 35);
    assert.ok(result.estimatedAdaptedDurationMinutes <= 35);

    const squat = result.adaptedExercises.find((e) => e.id === "ex_squat");
    assert.ok(squat !== undefined);
    assert.equal(squat.wasAdapted, true);
    assert.notEqual(squat.name, "Barbell Back Squat");
    assert.ok(squat.adaptationNotes.some((n) => n.includes("KNEES Protection")));
  });
});
