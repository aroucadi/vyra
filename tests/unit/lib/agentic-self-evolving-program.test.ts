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
  SensoryMemoryStore,
  sensoryMemoryStore,
} from "../../../src/lib/ai/sensory-memory";
import {
  VERTEX_AGENT_TOOL_DECLARATIONS,
  evaluateJustInTimeProposition,
  toolVerifyEvolutionCandidate,
} from "../../../src/lib/ai/coach-agent";
import {
  adaptDailyWorkoutSession,
  PlannedSessionExerciseInput,
} from "../../../src/lib/ai/daily-session-adapter";
import { gymVisionInventoryStore } from "../../../src/lib/ai/gym-vision-inventory";
import { POST as evolvePostRoute } from "../../../src/app/api/ai/evolve/route";
import { POST as adaptDayPostRoute } from "../../../src/app/api/ai/adapt-day/route";
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
    assert.equal(VERTEX_AGENT_TOOL_DECLARATIONS.length, 6);

    const sessions: WorkoutSession[] = [
      makeSession("s1", "2026-10-10", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
      makeSession("s2", "2026-10-17", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
      makeSession("s3", "2026-10-24", "Dumbbell Lateral Raise", [{ weightKg: 14, reps: 9 }]),
    ];

    const req = new Request("http://localhost:3000/api/ai/evolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const req = new Request("http://localhost:3000/api/ai/adapt-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  });
});
