/**
 * Developer Regression Cases — AI Coach Evaluation Suite
 * 
 * Note: These are developer regression cases (not a human-coach-authored gold standard).
 * For external JSON evaluation cases and the eval runner, see `eval/cases/` and `src/lib/ai/eval-runner.ts`.
 * 
 * Verifies that the AI Coach:
 * - Operates on a persistent, versioned Athlete Model with provenance and confidence.
 * - Reasons about the person and ranks bottlenecks (Priority Ladder: Safety -> Adherence -> Nutrition -> Overload -> Recovery -> Exercise Selection).
 * - Distinguishes Novice vs Intermediate vs Advanced regimes.
 * - Executes Propose -> Critique -> Verify -> Commit with logged experiments.
 * - Maintains calibrated honesty: zero fabricated defaults, honest uncertainty under missing data.
 * - Narrows JIT to in-session autoregulation, equipment swaps, and acute pain without mid-workout program overhauls.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  athleteModelStore,
  createDefaultAthleteModel,
  createVersionedField,
  AthleteModel,
} from "../../../src/lib/ai/athlete-model";
import {
  assembleAthleteCaseFile,
  executeMacroBlockReview,
  executeWeeklyMesoReview,
  evaluateNarrowedInSessionAutoregulation,
  evaluateCommittedExperiments,
  runAutonomousCoachingLifecycleCheck,
  EXPERIMENT_EVALUATION_THRESHOLDS,
} from "../../../src/lib/ai/coaching-cycle";
import {
  calculateSmoothedBodyweightTrend,
  calculateE1RMTrends,
  calculateAdherenceMetrics,
  calculateSymptomTrajectories,
} from "../../../src/lib/training-math/trend-analytics";
import { diagnoseNutritionAndEnergyBalance } from "../../../src/lib/ai/nutrition-coach";
import {
  retrieveApplicablePrinciples,
  COACHING_KNOWLEDGE_BASE,
  formatPrincipleForExplainability,
  getEffectiveEvidenceStrength,
} from "../../../src/lib/ai/knowledge-base";
import {
  normalizeInjuryFlagsToSymptoms,
  parseMultilingualSymptomsWithClarification,
  extractStructuredSymptomsViaLlm,
  detectMedicalRedFlags,
  toolAuditRecoveryState,
  CoachProposition,
} from "../../../src/lib/ai/coach-agent";
import {
  enforceDeterministicSafetyRails,
  computeSafeLoadProgressionLimit,
  runVertexAgenticCoachLoop,
  validateLlmCoachDecisionSchema,
  CoachCircuitBreaker,
  fetchWithRetryTimeoutAndCircuitBreaker,
  getShadowModeLogs,
  clearShadowModeLogs,
  hydrateShadowModeLogsFromDatabase,
} from "../../../src/lib/ai/vertex-agent-loop";
import { setCustomDbPool } from "../../../src/db/index";
import { createInMemoryPostgresPoolForTesting } from "../../../src/db/coach-repository";
import {
  runCoachingEvalSuite,
  validateEvalCaseJson,
  EvalCaseValidationError,
  runLiveModelVarianceEval,
} from "../../../src/lib/ai/eval-runner";
import { extractCanonicalAthleticRepresentation } from "../../../src/lib/ai/sensory-memory";
import {
  analyzeVisualProgressEvolution,
  assessBodyImageWellbeingSafety,
  visualProgressStore,
} from "../../../src/lib/ai/visual-progress";
import { WorkoutSession, BodyMetricEntry } from "../../../src/lib/types";

function makeTestSession(
  id: string,
  date: string,
  exerciseName: string,
  sets: Array<{ weightKg: number; reps: number; rir?: number }>,
  feedback?: { tag?: "optimal" | "heavy" | "light" | "joint_strain" | "balance_issue"; note?: string }
): WorkoutSession {
  return {
    id,
    traineeId: "trainee_test_coach",
    programDayId: "day_push_1",
    programTitle: "Novice Foundation",
    dayLabel: "Upper Push",
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
          },
        ]
      : [],
  };
}

describe("Developer Regression Cases — AI Coaching Architecture & Case Library Suite", () => {
  beforeEach(() => {
    athleteModelStore.clearForTesting();
  });

  it("Case 1: Underweight Novice Hardgainer (50kg beginner stalled on bench, eating 2,100 kcal) -> Diagnoses energy balance as #1 bottleneck, preserves compound lift, and commits surplus experiment", () => {
    const traineeId = "trainee_youssef_novice";

    // Setup 50kg novice athlete model
    const noviceModel = createDefaultAthleteModel(traineeId, {
      static: {
        trainingAgeMonths: createVersionedField(4, 0.9, "self_reported", "Lifting for 4 months"),
        regime: createVersionedField("novice", 0.95, "inferred", "Under-muscled novice lifter (< 1 year)"),
        consistencyHistoryScore: createVersionedField(0.9, 0.8, "self_reported"),
        structuralProfile: {
          frameSize: createVersionedField("slight", 0.8, "self_reported"),
          femurRatio: createVersionedField("average", 0.5, "default"),
          torsoRatio: createVersionedField("average", 0.5, "default"),
          armSpanRatio: createVersionedField("average", 0.5, "default"),
          injuryHistory: createVersionedField([], 1.0, "self_reported"),
          jointTolerances: createVersionedField({ shoulder: "neutral", elbow: "neutral", knee: "neutral", lumbar: "neutral" }, 0.8, "self_reported"),
          exerciseSuitability: createVersionedField({}, 0.5, "default"),
        },
        goals: createVersionedField([
          { rank: 1, label: "Gain 8kg lean muscle", category: "hypertrophy", realUnderlyingConstraint: "Build frame" },
        ], 0.9, "self_reported"),
        lifestyle: {
          achievableSessionsPerWeek: createVersionedField(3, 0.9, "self_reported"),
          sessionDurationBudgetMinutes: createVersionedField(60, 0.9, "self_reported"),
          occupationPhysicalDemand: createVersionedField("sedentary", 0.8, "self_reported", "University student"),
          sleepEnvironmentQuality: createVersionedField("optimal", 0.8, "self_reported"),
          locationContext: createVersionedField({
            city: "Casablanca",
            country: "Morocco",
            dietaryStaples: ["whole eggs", "canned sardines in olive oil", "lentils", "tajine", "olive oil", "milk & bananas"],
            budgetTier: "budget_conscious",
          }, 0.9, "self_reported"),
        },
        psychology: {
          structurePreference: createVersionedField("high_structure", 0.8, "self_reported"),
          quitTriggers: createVersionedField(["Overwhelming 2-hour workouts"], 0.8, "self_reported"),
          enjoyedMovements: createVersionedField(["Flat Barbell Bench Press"], 0.8, "self_reported"),
          foodRelationshipSensitivity: createVersionedField("healthy", 0.8, "self_reported"),
        },
      },
      dynamic: {
        energyBalanceTrend: createVersionedField({
          smoothedWeightKg: 50.2,
          weeklyRatePct: 0.02, // Stagnant weight
          estimatedMaintenanceKcal: 2100,
          currentSurplusKcal: 0,
          dailyProteinGramsPerKg: 1.4,
          isEnergyBottleneck: true,
          bottleneckReason: "50kg novice with flat bodyweight: caloric surplus is the primary rate-limiting bottleneck",
        }, 0.8, "measured"),
        perMuscleResponse: {},
        perMuscleVolumeLandmarks: {},
        perExerciseStimulusFatigue: {},
        tendonTolerances: {},
        recoveryCapacity: createVersionedField({ overallScore: 80, sleepConsistency: "stable", stressState: "low", appetiteState: "normal" }, 0.7, "self_reported"),
        adherenceReality: createVersionedField({ last28DaysPlanned: 12, last28DaysCompleted: 12, completionRatePct: 100 }, 1.0, "measured"),
      },
    });

    athleteModelStore.saveAthleteModel(noviceModel);

    // Flat bodyweight metric entries over 3 weeks
    const metricEntries: BodyMetricEntry[] = [
      { id: "m1", traineeId, date: "2026-10-10", weightKg: 50.1, source: "manual" },
      { id: "m2", traineeId, date: "2026-10-17", weightKg: 50.2, source: "manual" },
      { id: "m3", traineeId, date: "2026-10-24", weightKg: 50.2, source: "manual" },
    ];

    // Bench press stalled at 45kg across 3 sessions
    const sessions: WorkoutSession[] = [
      makeTestSession("s1", "2026-10-10", "Flat Barbell Bench Press", [{ weightKg: 45, reps: 6 }]),
      makeTestSession("s2", "2026-10-17", "Flat Barbell Bench Press", [{ weightKg: 45, reps: 6 }]),
      makeTestSession("s3", "2026-10-24", "Flat Barbell Bench Press", [{ weightKg: 45, reps: 6 }]),
    ];

    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions,
      metricEntries,
      averageLoggedCalories: 2100,
    });

    const weeklyReview = executeWeeklyMesoReview(caseFile);

    // 1. Diagnosis must identify energy balance as the #1 bottleneck, NOT an exercise swap!
    assert.equal(weeklyReview.differentialDiagnosis[0].domain, "energy_balance");
    assert.equal(weeklyReview.selectedIntervention.domain, "energy_balance");

    // 2. Action must prescribe whole-food caloric surplus (eggs, sardines, olive oil, milk/banana)
    assert.ok(
      weeklyReview.selectedIntervention.action.toLowerCase().includes("surplus") ||
      weeklyReview.selectedIntervention.action.toLowerCase().includes("kcal"),
      "Must prescribe caloric surplus"
    );

    // 3. Proportionality pass must accept the intervention and commit an experiment
    assert.equal(weeklyReview.critiquePass.proportionalityVerdict, "proportional");
    assert.ok(weeklyReview.committedExperiment, "Must commit a coaching experiment with review date");
    assert.equal(weeklyReview.committedExperiment?.category, "nutrition_surplus");
    assert.equal(weeklyReview.committedExperiment?.status, "active");
  });

  it("Case 2: Intermediate with Shoulder Ache -> Ranks tendon tolerance, modulates movement line of pull, and avoids flailing", () => {
    const traineeId = "trainee_omar_intermediate";

    const intermediateModel = createDefaultAthleteModel(traineeId, {
      static: {
        trainingAgeMonths: createVersionedField(36, 1.0, "self_reported", "3 years consistent training"),
        regime: createVersionedField("intermediate", 1.0, "inferred"),
        structuralProfile: {
          frameSize: createVersionedField("medium", 0.9, "self_reported"),
          femurRatio: createVersionedField("average", 0.7, "default"),
          torsoRatio: createVersionedField("average", 0.7, "default"),
          armSpanRatio: createVersionedField("long_arms", 0.8, "self_reported"),
          injuryHistory: createVersionedField(["Mild anterior shoulder impingement on wide grip"], 0.9, "self_reported"),
          jointTolerances: createVersionedField({ shoulder: "compromised", elbow: "neutral", knee: "neutral", lumbar: "neutral" }, 0.9, "self_reported"),
          exerciseSuitability: createVersionedField({}, 0.5, "default"),
        },
        goals: createVersionedField([
          { rank: 1, label: "Add chest & delt fullness without shoulder pain", category: "hypertrophy" },
        ], 0.9, "self_reported"),
        lifestyle: {
          achievableSessionsPerWeek: createVersionedField(4, 0.9, "self_reported"),
          sessionDurationBudgetMinutes: createVersionedField(60, 0.9, "self_reported"),
          occupationPhysicalDemand: createVersionedField("light", 0.8, "self_reported"),
          sleepEnvironmentQuality: createVersionedField("optimal", 0.8, "self_reported"),
          locationContext: createVersionedField({ city: "Casablanca", country: "Morocco", dietaryStaples: ["eggs", "chicken", "rice"], budgetTier: "moderate" }, 0.9, "self_reported"),
        },
        psychology: {
          structurePreference: createVersionedField("balanced", 0.8, "self_reported"),
          quitTriggers: createVersionedField(["Joint pain"], 0.9, "self_reported"),
          enjoyedMovements: createVersionedField(["Incline Dumbbell Press"], 0.9, "self_reported"),
          foodRelationshipSensitivity: createVersionedField("healthy", 0.8, "self_reported"),
        },
      },
      dynamic: {
        energyBalanceTrend: createVersionedField({
          smoothedWeightKg: 80.5,
          weeklyRatePct: 0.25,
          estimatedMaintenanceKcal: 2700,
          currentSurplusKcal: 250,
          dailyProteinGramsPerKg: 2.0,
          isEnergyBottleneck: false,
        }, 0.9, "measured"),
        perMuscleResponse: {},
        perMuscleVolumeLandmarks: {},
        perExerciseStimulusFatigue: {},
        tendonTolerances: {
          shoulder: createVersionedField({ joint: "shoulder", toleranceStatus: "remodeling_lag", weeklyLoadRateCapPct: 2.5, recentFrictionSymptomCount: 2 }, 0.9, "measured"),
        },
        recoveryCapacity: createVersionedField({ overallScore: 85, sleepConsistency: "stable", stressState: "low", appetiteState: "robust" }, 0.8, "self_reported"),
        adherenceReality: createVersionedField({ last28DaysPlanned: 16, last28DaysCompleted: 15, completionRatePct: 94 }, 1.0, "measured"),
      },
    });

    athleteModelStore.saveAthleteModel(intermediateModel);

    // Gaining weight steadily (+0.25kg/week), but active shoulder pain logged within past 5 days (deterministic fixed dates)
    const date1 = "2026-10-20";
    const date2 = "2026-10-24";

    const metricEntries: BodyMetricEntry[] = [
      { id: "m1", traineeId, date: date1, weightKg: 80.2, source: "manual" },
      { id: "m2", traineeId, date: date2, weightKg: 80.5, source: "manual" },
    ];

    const sessions: WorkoutSession[] = [
      makeTestSession("s1", date1, "Flat Barbell Bench Press", [{ weightKg: 90, reps: 8 }], {
        tag: "joint_strain",
        note: "Sharp anterior shoulder pinch at bottom of bench press descent",
      }),
      makeTestSession("s2", date2, "Flat Barbell Bench Press", [{ weightKg: 90, reps: 8 }], {
        tag: "joint_strain",
        note: "Shoulder pain recurring on heavy barbell touch point",
      }),
    ];

    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions,
      metricEntries,
      averageLoggedCalories: 2950,
    });

    const weeklyReview = executeWeeklyMesoReview(caseFile);

    // 1. Must rank tendon tolerance as #1 priority (Safety & Health overrules everything)
    assert.equal(weeklyReview.differentialDiagnosis[0].domain, "tendon_tolerance");
    assert.equal(weeklyReview.selectedIntervention.domain, "tendon_tolerance");

    // 2. Action must address shoulder joint strain
    assert.ok(
      weeklyReview.selectedIntervention.action.toLowerCase().includes("shoulder") ||
      weeklyReview.selectedIntervention.action.toLowerCase().includes("bracket"),
      "Must intervene on shoulder tendon load"
    );

    // 3. Must verify guardrails and commit experiment
    assert.equal(weeklyReview.guardrailVerification.passed, true);
    assert.ok(weeklyReview.committedExperiment);
    assert.equal(weeklyReview.committedExperiment.category, "setup_calibration");
  });

  it("Case 3: Busy Parent Adherence Collapse -> Ranks adherence as primary bottleneck and consolidates schedule", () => {
    const traineeId = "trainee_karim_parent";

    const parentModel = createDefaultAthleteModel(traineeId, {
      static: {
        trainingAgeMonths: createVersionedField(18, 0.9, "self_reported"),
        regime: createVersionedField("intermediate", 0.9, "inferred"),
        lifestyle: {
          achievableSessionsPerWeek: createVersionedField(3, 0.9, "self_reported"),
          sessionDurationBudgetMinutes: createVersionedField(45, 0.9, "self_reported"),
          occupationPhysicalDemand: createVersionedField("active", 0.8, "self_reported", "Long 12h shifts + toddler"),
          sleepEnvironmentQuality: createVersionedField("poor", 0.8, "self_reported"),
          locationContext: createVersionedField({ city: "Casablanca", country: "Morocco", dietaryStaples: ["tajine", "eggs", "bread"], budgetTier: "moderate" }, 0.8, "self_reported"),
        },
      },
      dynamic: {
        adherenceReality: createVersionedField({
          last28DaysPlanned: 16,
          last28DaysCompleted: 8,
          completionRatePct: 50,
          primaryMissReason: "12-hour work shifts and family duties",
        }, 1.0, "measured"),
      },
    });

    athleteModelStore.saveAthleteModel(parentModel);

    // Only 4 sessions completed over past 4 weeks (50% adherence vs 8 planned)
    const sessions: WorkoutSession[] = [
      makeTestSession("s1", "2026-10-02", "Incline Dumbbell Press", [{ weightKg: 24, reps: 10 }]),
      makeTestSession("s2", "2026-10-09", "Incline Dumbbell Press", [{ weightKg: 24, reps: 10 }]),
      makeTestSession("s3", "2026-10-18", "Incline Dumbbell Press", [{ weightKg: 24, reps: 10 }]),
      makeTestSession("s4", "2026-10-26", "Incline Dumbbell Press", [{ weightKg: 24, reps: 10 }]),
    ];

    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions,
      metricEntries: [{ id: "m1", traineeId, date: "2026-10-01", weightKg: 74, source: "manual" }],
    });

    const weeklyReview = executeWeeklyMesoReview(caseFile);

    // Adherence must be identified as the primary bottleneck (#2 in priority ladder)
    assert.equal(weeklyReview.differentialDiagnosis[0].domain, "adherence");
    assert.equal(weeklyReview.selectedIntervention.domain, "adherence");
    assert.ok(weeklyReview.selectedIntervention.action.toLowerCase().includes("split") || weeklyReview.selectedIntervention.action.toLowerCase().includes("schedule"));
  });

  it("Case 4: Missing Biometrics -> Handles uncertainty honestly, refuses false CNS deloads, and asks high-value check-in question", () => {
    const traineeId = "trainee_missing_biometrics";
    const model = createDefaultAthleteModel(traineeId);
    athleteModelStore.saveAthleteModel(model);

    // Check value-of-information check-in prompt: identifies missing bodyweight/intake as critical
    const checkIn = athleteModelStore.getHighValueCheckInPrompt(model);
    assert.equal(checkIn.neededField, "bodyweight_and_intake");
    assert.equal(checkIn.priority, "critical");
    assert.ok(checkIn.question.length > 20);

    // Case file data quality notes must flag missing sleep and nutrition logs
    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions: [makeTestSession("s1", "2026-10-20", "Barbell Squat", [{ weightKg: 100, reps: 5 }])],
      metricEntries: [],
    });

    assert.ok(caseFile.dataQualityNotes.some((n) => n.includes("sparse")));
    assert.ok(caseFile.dataQualityNotes.some((n) => n.includes("sleep")));
  });

  it("Case 5: Tendon Discrepancy under Rapid Muscle Overload -> Principle KB applies tendon remodeling lag rule and suppresses evidence rating while UNREVIEWED", () => {
    const traineeId = "trainee_tendon_lag";
    const model = createDefaultAthleteModel(traineeId, {
      static: { regime: createVersionedField("novice", 0.9, "inferred") },
      dynamic: {
        tendonTolerances: {
          elbow: createVersionedField({ joint: "elbow", toleranceStatus: "remodeling_lag", weeklyLoadRateCapPct: 2.5, recentFrictionSymptomCount: 1 }, 0.9, "measured"),
        },
      },
    });

    const principles = retrieveApplicablePrinciples(model);
    const tendonPrinciple = principles.find((p) => p.id === "kb_tendon_adaptation_discrepancy");
    assert.ok(tendonPrinciple, "Must retrieve tendon adaptation lag principle");
    assert.equal(tendonPrinciple?.reviewedBy, "UNREVIEWED");
    assert.equal(
      getEffectiveEvidenceStrength(tendonPrinciple),
      "unreviewed",
      "Unreviewed knowledge-base entry must not expose an active 'strong' evidence rating"
    );
    assert.ok(tendonPrinciple?.coreRule.includes("remodels on a 6–12 month"));
  });

  it("Case 6: Narrow Micro JIT Loop -> Autoregulates in-session pain, equipment unavailability, and warm-up fatigue without mid-workout program overhauls", () => {
    // 1. Acute Joint Discomfort during today's session
    const painResult = evaluateNarrowedInSessionAutoregulation({
      traineeId: "trainee_micro_test",
      exerciseName: "Skull Crusher",
      currentWeightKg: 30,
      targetSets: 3,
      repLow: 10,
      repHigh: 12,
      acuteJointDiscomfort: true,
      equipmentUnavailableReplacement: "Neutral-Grip Dumbbell Tricep Extension",
    });
    assert.equal(painResult.actionType, "acute_pain_swap");
    assert.equal(painResult.replacementExerciseName, "Neutral-Grip Dumbbell Tricep Extension");
    assert.ok(painResult.prescribedWeightKg < 30, "Load must be scaled down for joint relief");

    // 2. Equipment Station Occupied
    const occupiedResult = evaluateNarrowedInSessionAutoregulation({
      traineeId: "trainee_micro_test",
      exerciseName: "Pec Deck Machine Fly",
      currentWeightKg: 50,
      targetSets: 3,
      repLow: 10,
      repHigh: 15,
      equipmentStationUnavailable: true,
      equipmentUnavailableReplacement: "Incline Dumbbell Fly",
    });
    assert.equal(occupiedResult.actionType, "equipment_swap");
    assert.equal(occupiedResult.replacementExerciseName, "Incline Dumbbell Fly");

    // 3. Warm-up bar speed exhausted
    const warmupResult = evaluateNarrowedInSessionAutoregulation({
      traineeId: "trainee_micro_test",
      exerciseName: "Barbell Squat",
      currentWeightKg: 100,
      targetSets: 3,
      repLow: 6,
      repHigh: 8,
      warmupRepsFeltExhausted: true,
    });
    assert.equal(warmupResult.actionType, "warmup_load_downshift");
    assert.equal(warmupResult.prescribedWeightKg, 90, "Must downshift load by ~10%");

    // 4. Nominal Execution
    const nominalResult = evaluateNarrowedInSessionAutoregulation({
      traineeId: "trainee_micro_test",
      exerciseName: "Incline Dumbbell Press",
      currentWeightKg: 32,
      targetSets: 3,
      repLow: 8,
      repHigh: 12,
    });
    assert.equal(nominalResult.actionType, "preserve");
    assert.equal(nominalResult.prescribedWeightKg, 32);
  });

  it("Case 7: Macro Loop A (4–8 Week Block Review) -> Prescribes 3-day full-body foundation for a 52kg novice and explicitly defers 6-day Arnold splits & drop sets", () => {
    const traineeId = "trainee_macro_novice";
    const model = createDefaultAthleteModel(traineeId);
    athleteModelStore.saveAthleteModel(model);

    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions: [
        makeTestSession("s1", "2026-10-10", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 8 }]),
      ],
      metricEntries: [
        { id: "m1", traineeId, date: "2026-10-10", weightKg: 51.8, source: "manual" },
      ],
    });

    const macroPlan = executeMacroBlockReview(caseFile);

    assert.equal(macroPlan.recommendedSplit, "full_body_3x");
    assert.equal(macroPlan.sessionsPerWeek, 3);
    assert.equal(macroPlan.frequencyPerMusclePerWeek, 3);
    assert.ok(
      macroPlan.deferredTechniquesExplanation.includes("Arnold") &&
        macroPlan.deferredTechniquesExplanation.includes("drop sets"),
      "Must explicitly explain why high-volume Arnold splits and drop sets are deferred for a ~52kg novice"
    );
    assert.ok(macroPlan.scienceCitations.length > 0);
  });

  it("Case 8: Medical Red-Flag Hard Boundary & Word-Boundary Anti-Brittleness -> Never triggers lumbar shear on 'avocados'/'discipline', and halts loading on clinical red flags", () => {
    // 1. Word-boundary anti-brittleness: "avocados" (contains "dos") and "discipline" (contains "disc") must NOT trigger lumbar spine shear
    const benignSymptoms = normalizeInjuryFlagsToSymptoms([
      "I ate two avocados and kept strong discipline today, zero pain.",
    ]);
    assert.equal(
      benignSymptoms.includes("lumbar_axial_strain"),
      false,
      "Substrings inside 'avocados' or 'discipline' must never falsely trigger lumbar injury"
    );

    // 2. Genuine French/English back pain still triggers accurately
    const realBackPain = normalizeInjuryFlagsToSymptoms([
      "Douleur bas du dos sur le deadlift",
    ]);
    assert.equal(realBackPain.includes("lumbar_axial_strain"), true);

    // 3. Clinical red flag detection & Priority 0 in Meso Review
    const redFlagCheck = detectMedicalRedFlags([
      "Sharp electric numbness radiating down my left arm during bench press",
    ]);
    assert.equal(redFlagCheck.hasRedFlag, true);
    assert.ok(redFlagCheck.triggers.includes("radiating_nerve_pain_or_numbness"));

    const traineeId = "trainee_medical_red_flag";
    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions: [
        {
          ...makeTestSession("s_rf", "2026-10-25", "Flat Barbell Bench Press", [{ weightKg: 60, reps: 6 }]),
          notes: "Electric numbness radiating down my arm on set 2",
        },
      ],
      metricEntries: [],
    });

    const weeklyReview = executeWeeklyMesoReview(caseFile);
    assert.equal(weeklyReview.differentialDiagnosis[0].domain, "medical_boundary");
    assert.equal(weeklyReview.selectedIntervention.domain, "medical_boundary");
    assert.ok(weeklyReview.selectedIntervention.action.toLowerCase().includes("physician") || weeklyReview.selectedIntervention.action.toLowerCase().includes("suspend"));
  });

  it("Case 9: Adversarial 'LLM Decides, Code Constrains, Data Adjudicates' -> Deterministic safety rails clamp an excessive +15kg jump on a 40kg novice bench via percentage-based safe limit (6.25% = +2.5kg -> 42.5kg)", () => {
    const traineeId = "trainee_safety_rail_clamp";
    const model = createDefaultAthleteModel(traineeId);
    athleteModelStore.saveAthleteModel(model);

    const unsafeProposal: CoachProposition = {
      id: "prop_unsafe_jump",
      traineeId,
      exerciseName: "Flat Barbell Bench Press",
      muscleSubdivision: "chest_sternal",
      tier: "tier_4_overload_protocol",
      tierNumber: 4,
      tierLabel: "AUTONOMOUS OVERLOAD",
      headline: "Jump Bench Press from 40kg to 55kg and 8 Sets",
      observation: "Athlete completed 3x10 at 40kg.",
      rootCauseDiagnosis: "Ready for load increase.",
      proposedFix: "Increase to 55kg for 8 sets.",
      gymName: "Punch by Badr Hari Lissasfa",
      mutation: {
        newTargetWeightKg: 55, // +15kg jump! Unsafe for novice tendon adaptation
        newTargetSets: 8, // 8 sets! Junk volume
      },
      toolsInvoked: ["commit_coaching_decision"],
      agentTrace: {
        loopId: "test_trace",
        iterationsExecuted: 1,
        selfCorrectionRetries: 0,
        steps: [],
        ragMatchesCount: 0,
        topRagCosineSimilarity: 0,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: "2026-10-25T10:00:00Z",
    };

    const { constrained, audit } = enforceDeterministicSafetyRails(
      unsafeProposal,
      {
        traineeId,
        exerciseName: "Flat Barbell Bench Press",
        currentWeightKg: 40,
        targetSets: 3,
        repLow: 8,
        repHigh: 10,
        targetRir: 2,
        sessions: [],
      },
      model
    );

    assert.equal(audit.passedAllInitialRails, false);
    assert.equal(
      constrained.mutation.newTargetWeightKg,
      42.5,
      "Safety rail must clamp +15kg jump down to 42.5kg via 6.25% percentage limit on 40kg barbell bench"
    );
    assert.ok(
      audit.appliedClamps[0].includes("6.25%"),
      `Expected percentage-based rationale (6.25%) in clamp audit, got: ${audit.appliedClamps[0]}`
    );
    assert.equal(
      constrained.mutation.newTargetSets,
      5,
      "Safety rail must clamp 8 working sets down to max 5 sets"
    );
    assert.ok(audit.appliedClamps.length >= 2);
  });

  it("Case 10: Calibrated Visual Progress Hypotheses, Demo-vs-Real Isolation & Wellbeing Safeguards -> Demo SVGs output 0.50 hypotheses, mixed demo+real photos return 'No photo analysis available' with 0 observations, and harsh self-talk triggers safeguard", async () => {
    visualProgressStore.resetForTesting("trainee_alaa");
    const snapshots = visualProgressStore.getSnapshots("trainee_alaa", "front_relaxed");

    const report = await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: snapshots[0],
      snapshotB: snapshots[snapshots.length - 1],
      sessions: [
        makeTestSession("s_v1", snapshots[0].date, "Incline Dumbbell Press", [{ weightKg: 24, reps: 10 }]),
      ],
    });

    // Offline contextual analysis on demo SVG silhouettes must report honest 0.50-0.55 confidence and never fabricate exact lean tissue kg claims
    for (const obs of report.visualObservations) {
      assert.ok(
        obs.confidenceScore <= 0.6,
        `Expected calibrated hypothesis confidence <= 0.60 in offline mode, got ${obs.confidenceScore}`
      );
      assert.equal(
        obs.headline.includes("Lean Tissue"),
        false,
        "Must never fabricate exact kg of lean tissue from a 2D camera photo"
      );
    }

    // Verify that mixing a demo-flagged snapshot (`isSyntheticDemo: true`) with a real snapshot (`isSyntheticDemo: false`) NEVER reaches a real user's report with synthetic observations
    const realFlaggedSnapshot = {
      ...snapshots[snapshots.length - 1],
      id: "snap_real_user_override",
      isSyntheticDemo: false,
    };
    const mixedReport = await analyzeVisualProgressEvolution({
      traineeId: "trainee_alaa",
      snapshotA: snapshots[0], // isSyntheticDemo: true
      snapshotB: realFlaggedSnapshot, // isSyntheticDemo: false
      sessions: [],
    });
    assert.equal(mixedReport.analysisEngine, "no_vision_analysis_available");
    assert.equal(mixedReport.visualObservations.length, 0);

    // Wellbeing safeguard must catch harsh self-criticism and clinical eating red flags
    const harshSafeguard = assessBodyImageWellbeingSafety({
      snapshots,
      latestNote: "I hate my body, I look disgusting in the mirror today.",
    });
    assert.equal(harshSafeguard.wellbeingAlertTriggered, true);
    assert.equal(harshSafeguard.triggerType, "harsh_self_criticism");

    const clinicalSafeguard = assessBodyImageWellbeingSafety({
      snapshots,
      latestNote: "I am starving myself and fasting for 5 days to lose belly fat.",
    });
    assert.equal(clinicalSafeguard.wellbeingAlertTriggered, true);
    assert.equal(clinicalSafeguard.triggerType, "clinical_eating_or_dysmorphia_flag");
    assert.ok(clinicalSafeguard.clinicalReferralNotice);
  });

  it("Case 11 (Task 3): Failure-Path Behavior -> Simulates LLM failure at each stage (propose, critique, verify), timeout, 429/503 retries, circuit breaker, and malformed schema; asserts zero program mutation", async () => {
    const baseJitInput = {
      traineeId: "trainee_failure_path_test",
      exerciseName: "Flat Barbell Bench Press",
      currentWeightKg: 40,
      targetSets: 3,
      repLow: 8,
      repHigh: 10,
      targetRir: 2,
      sessions: [
        makeTestSession("s_f1", "2026-10-01", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 10 }]),
        makeTestSession("s_f2", "2026-10-04", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 10 }]),
      ],
    };

    // 1. Failure at 'propose' stage -> no mutation applied
    const failPropose = await runVertexAgenticCoachLoop(baseJitInput, {
      simulateStageFailure: "propose",
    });
    assert.equal(failPropose.proposition, null);
    assert.equal(failPropose.mutationApplied, false);
    assert.equal(failPropose.degradedMode, true);
    assert.equal(failPropose.statusMessage, "Coach unavailable - keeping current plan");
    assert.deepEqual(failPropose.stagesCompleted, {
      propose: false,
      critique: false,
      verify: false,
    });

    // 2. Failure at 'critique' stage -> no mutation applied
    const failCritique = await runVertexAgenticCoachLoop(baseJitInput, {
      simulateStageFailure: "critique",
    });
    assert.equal(failCritique.proposition, null);
    assert.equal(failCritique.mutationApplied, false);
    assert.equal(failCritique.degradedMode, true);
    assert.equal(failCritique.statusMessage, "Coach unavailable - keeping current plan");
    assert.deepEqual(failCritique.stagesCompleted, {
      propose: true,
      critique: false,
      verify: false,
    });

    // 3. Failure at 'verify' stage -> no mutation applied
    const failVerify = await runVertexAgenticCoachLoop(baseJitInput, {
      simulateStageFailure: "verify",
    });
    assert.equal(failVerify.proposition, null);
    assert.equal(failVerify.mutationApplied, false);
    assert.equal(failVerify.degradedMode, true);
    assert.equal(failVerify.statusMessage, "Coach unavailable - keeping current plan");
    assert.deepEqual(failVerify.stagesCompleted, {
      propose: true,
      critique: true,
      verify: false,
    });

    // 4. Live LLM mock that calls commit_coaching_decision WITHOUT calling propose_and_critique_intervention -> rejected!
    const missingCritiqueFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                role: "model",
                parts: [
                  {
                    functionCall: {
                      name: "commit_coaching_decision",
                      args: {
                        tier: "tier_4_overload_protocol",
                        headline: "Increase Bench Press to 42.5kg",
                        rootCauseDiagnosis: "Athlete hit top of rep bracket across consecutive sessions.",
                        proposedFix: "Add 2.5kg next session.",
                        prescribedWeightKg: 42.5,
                        prescribedSets: 3,
                      },
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      );

    const uncritiquedRun = await runVertexAgenticCoachLoop(baseJitInput, {
      fetchImpl: missingCritiqueFetch,
      maxTurns: 1,
    });
    assert.equal(uncritiquedRun.proposition, null);
    assert.equal(uncritiquedRun.mutationApplied, false);
    assert.equal(uncritiquedRun.statusMessage, "Coach unavailable - keeping current plan");
    assert.equal(uncritiquedRun.stagesCompleted?.propose, true);
    assert.equal(uncritiquedRun.stagesCompleted?.critique, false);

    // 5. Strict schema validation rejects malformed / out-of-range LLM output without silent coercion
    const schemaCheck = validateLlmCoachDecisionSchema({
      tier: "unsupported_magic_tier",
      headline: "No",
      rootCauseDiagnosis: "",
      proposedFix: "",
      prescribedWeightKg: 9999,
      prescribedSets: -3,
      repLow: 15,
      repHigh: 8,
    });
    assert.equal(schemaCheck.valid, false);
    assert.ok(schemaCheck.errors.length >= 5);

    const malformedRun = await runVertexAgenticCoachLoop(baseJitInput, {
      simulateStageFailure: "malformed_schema",
    });
    assert.equal(malformedRun.proposition, null);
    assert.equal(malformedRun.mutationApplied, false);
    assert.equal(malformedRun.statusMessage, "Coach unavailable - keeping current plan");
    assert.ok((malformedRun.schemaValidationErrors?.length || 0) > 0);

    // 6. Retry with exponential backoff + jitter on 429/503 and circuit breaker trip
    const breaker = new CoachCircuitBreaker(2, 60_000);
    let callCount = 0;
    const flakyThenOkFetch: typeof fetch = async () => {
      callCount += 1;
      if (callCount < 3) {
        return new Response("Rate Limited", { status: 429 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const retryRes = await fetchWithRetryTimeoutAndCircuitBreaker({
      url: "https://example.com/llm",
      init: { method: "POST" },
      maxRetries: 3,
      baseDelayMs: 5,
      fetchImpl: flakyThenOkFetch,
      circuitBreaker: breaker,
    });
    assert.equal(retryRes.response.ok, true);
    assert.equal(retryRes.attempts, 3, "Must retry twice on 429 and succeed on 3rd attempt");

    // Exhaust retries twice to trip circuit breaker (failureThreshold = 2)
    const timeoutRun1 = await runVertexAgenticCoachLoop(baseJitInput, {
      simulateStageFailure: "rate_limit_429",
      maxRetries: 1,
      baseDelayMs: 5,
      circuitBreaker: breaker,
    });
    assert.equal(timeoutRun1.proposition, null);
    assert.equal(timeoutRun1.mutationApplied, false);
    assert.equal(timeoutRun1.statusMessage, "Coach unavailable - keeping current plan");

    const timeoutRun2 = await runVertexAgenticCoachLoop(baseJitInput, {
      simulateStageFailure: "service_unavailable_503",
      maxRetries: 1,
      baseDelayMs: 5,
      circuitBreaker: breaker,
    });
    assert.equal(timeoutRun2.proposition, null);
    assert.equal(timeoutRun2.mutationApplied, false);
    assert.equal(breaker.getState().state, "OPEN", "Circuit breaker must open after reaching failure threshold");
    assert.equal(breaker.allowRequest(), false, "Open circuit breaker must block further hammering");

    // Verify no experiments were recorded for this trainee during any failed stage
    const recordedExps = athleteModelStore.getAthleteModel("trainee_failure_path_test").activeExperiments;
    assert.equal(recordedExps.length, 0, "Zero experiments or mutations may be committed when any stage fails");
  });

  it("Case 12 (Task 4): Per-Exercise Percentage/Equipment Safety Rails & Multilingual (Darija/French/English) Symptom Parsing with Clarifying Questions", () => {
    const traineeId = "trainee_task4_rails";
    const noviceModel = createDefaultAthleteModel(traineeId);
    const advancedModel = createDefaultAthleteModel(traineeId, {
      static: {
        ...noviceModel.static,
        regime: createVersionedField("advanced", 0.9, "inferred"),
      },
    });

    // 1. +2.5kg on an 8kg Dumbbell Lateral Raise is a +31.25% jump and must be clamped to +1.0kg (9.0kg)
    const latRaiseLimit = computeSafeLoadProgressionLimit({
      exerciseName: "Dumbbell Lateral Raise",
      equipment: "dumbbell",
      currentWeightKg: 8,
      athleteModel: noviceModel,
    });
    assert.equal(latRaiseLimit.isIsolationMovement, true);
    assert.equal(latRaiseLimit.maxStepKg, 1.0, "8kg lateral raise must never allow a +2.5kg (31%) jump");
    assert.equal(latRaiseLimit.maxAllowedWeightKg, 9.0);

    // Full safety rail test for 8kg Dumbbell Lateral Raise proposing 10.5kg (+2.5kg)
    const unsafeLatRaiseProposal: CoachProposition = {
      id: "prop_lat_raise_jump",
      traineeId,
      exerciseName: "Dumbbell Lateral Raise",
      muscleSubdivision: "deltoid_lateral",
      tier: "tier_4_overload_protocol",
      tierNumber: 4,
      tierLabel: "AUTONOMOUS OVERLOAD",
      headline: "Jump Dumbbell Lateral Raise from 8kg to 10.5kg",
      observation: "Completed 3x15 at 8kg.",
      rootCauseDiagnosis: "Ready for load step.",
      proposedFix: "Increase to 10.5kg.",
      gymName: "Punch by Badr Hari Lissasfa",
      mutation: {
        newTargetWeightKg: 10.5,
        newTargetSets: 3,
      },
      toolsInvoked: [],
      agentTrace: {
        loopId: "trace_lr",
        iterationsExecuted: 1,
        selfCorrectionRetries: 0,
        steps: [],
        ragMatchesCount: 0,
        topRagCosineSimilarity: 0,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: "2026-10-20T00:00:00Z",
    };
    const { constrained: constrainedLatRaise, audit: latRaiseAudit } = enforceDeterministicSafetyRails(
      unsafeLatRaiseProposal,
      {
        traineeId,
        exerciseName: "Dumbbell Lateral Raise",
        equipment: "dumbbell",
        currentWeightKg: 8,
        targetSets: 3,
        repLow: 12,
        repHigh: 15,
        sessions: [
          makeTestSession("s_lr1", "2026-10-20", "Dumbbell Lateral Raise", [{ weightKg: 8, reps: 15 }]),
        ],
      },
      noviceModel
    );
    assert.equal(latRaiseAudit.passedAllInitialRails, false);
    assert.equal(
      constrainedLatRaise.mutation.newTargetWeightKg,
      9.0,
      "Full safety rails must clamp 8kg -> 10.5kg lateral raise proposal down to 9.0kg (+1.0kg)"
    );

    // 1b. Valid-looking LLM output proposing a contraindicated exercise ("Barbell Upright Row" under shoulder pinch)
    // and an unavailable equipment exercise ("Cable Lateral Raise" in a dumbbell-only gym) gets blocked by the rails
    const validLookingContraindicatedJson = JSON.stringify({
      tier: "tier_2_surgical_swap",
      headline: "Swap to Barbell Upright Row",
      rootCauseDiagnosis: "Rotate shoulder stimulus.",
      proposedFix: "Switch to Barbell Upright Row.",
      replacementExerciseName: "Barbell Upright Row",
      replacementEquipment: "barbell",
      prescribedWeightKg: 25,
      prescribedSets: 3,
      repLow: 10,
      repHigh: 12,
    });
    const schemaCheckContra = validateLlmCoachDecisionSchema(validLookingContraindicatedJson);
    assert.equal(schemaCheckContra.valid, true, "LLM output is syntactically valid schema");

    const contraProposal: CoachProposition = {
      id: "prop_contra_swap",
      traineeId,
      exerciseName: "Dumbbell Lateral Raise",
      muscleSubdivision: "deltoid_lateral",
      tier: "tier_2_surgical_swap",
      tierNumber: 2,
      tierLabel: "BIOMECHANICAL SURGICAL SWAP",
      headline: schemaCheckContra.parsed!.headline,
      observation: "Shoulder pinch reported.",
      rootCauseDiagnosis: schemaCheckContra.parsed!.rootCauseDiagnosis,
      proposedFix: schemaCheckContra.parsed!.proposedFix,
      gymName: "Punch by Badr Hari Lissasfa",
      mutation: {
        newExerciseName: schemaCheckContra.parsed!.replacementExerciseName,
        newEquipment: schemaCheckContra.parsed!.replacementEquipment,
        newTargetWeightKg: 25,
        newTargetSets: 3,
      },
      toolsInvoked: [],
      agentTrace: {
        loopId: "trace_contra",
        iterationsExecuted: 1,
        selfCorrectionRetries: 0,
        steps: [],
        ragMatchesCount: 0,
        topRagCosineSimilarity: 0,
        catalogueCandidatesEvaluated: 0,
      },
      createdAt: "2026-10-20T00:00:00Z",
    };

    const { constrained: constrainedContra, audit: contraAudit } = enforceDeterministicSafetyRails(
      contraProposal,
      {
        traineeId,
        exerciseName: "Dumbbell Lateral Raise",
        equipment: "dumbbell",
        currentWeightKg: 8,
        targetSets: 3,
        repLow: 12,
        repHigh: 15,
        activeInjuries: ["Sharp anterior shoulder pinch"],
        sessions: [
          makeTestSession("s_c_pinch", "2026-10-20", "Dumbbell Lateral Raise", [{ weightKg: 8, reps: 12 }], {
            tag: "joint_strain",
            note: "Sharp anterior shoulder pinch at top of raise",
          }),
        ],
      },
      noviceModel
    );
    assert.equal(contraAudit.passedAllInitialRails, false);
    assert.ok(
      contraAudit.blockedViolations.length > 0,
      "Safety rails must block contraindicated Barbell Upright Row when athlete has anterior shoulder pinch"
    );
    assert.notEqual(
      constrainedContra.mutation.newExerciseName,
      "Barbell Upright Row",
      "Contraindicated exercise must be replaced with a verified joint-safe alternative"
    );

    const unavailableEqProposal: CoachProposition = {
      ...contraProposal,
      id: "prop_unavailable_eq",
      mutation: {
        newExerciseName: "Dual-Pulley Cable Lateral Raise",
        newEquipment: "cable",
        newTargetWeightKg: 7.5,
        newTargetSets: 3,
      },
    };
    const { constrained: constrainedUnavail, audit: unavailAudit } = enforceDeterministicSafetyRails(
      unavailableEqProposal,
      {
        traineeId,
        exerciseName: "Dumbbell Lateral Raise",
        equipment: "dumbbell",
        currentWeightKg: 8,
        targetSets: 3,
        repLow: 12,
        repHigh: 15,
        equipmentPhotoCaption: "only dumbbells and bench available today, no cable",
        sessions: [],
      },
      noviceModel
    );
    assert.equal(unavailAudit.passedAllInitialRails, false);
    assert.ok(
      unavailAudit.blockedViolations.some((v) => v.toLowerCase().includes("cable")),
      "Safety rails must block cable exercise when gym only has dumbbells"
    );
    assert.notEqual(constrainedUnavail.mutation.newEquipment, "cable");

    // 2. Advanced lifter has tighter percentage cap than novice on barbell compound
    const noviceBenchLimit = computeSafeLoadProgressionLimit({
      exerciseName: "Flat Barbell Bench Press",
      equipment: "barbell",
      currentWeightKg: 80,
      athleteModel: noviceModel,
    });
    const advancedBenchLimit = computeSafeLoadProgressionLimit({
      exerciseName: "Flat Barbell Bench Press",
      equipment: "barbell",
      currentWeightKg: 80,
      athleteModel: advancedModel,
    });
    assert.ok(
      advancedBenchLimit.percentageCapPct < noviceBenchLimit.percentageCapPct,
      "Advanced lifter must have tighter percentage progression cap than novice"
    );

    // 3. Active tendon symptom freezes load progression at 0kg step
    const symptomFrozenLimit = computeSafeLoadProgressionLimit({
      exerciseName: "Incline Dumbbell Press",
      equipment: "dumbbell",
      currentWeightKg: 24,
      athleteModel: noviceModel,
      detectedSymptoms: ["anterior_shoulder_pinch"],
    });
    assert.equal(symptomFrozenLimit.activeJointSymptomFreeze, true);
    assert.equal(symptomFrozenLimit.maxStepKg, 0);
    assert.equal(symptomFrozenLimit.maxAllowedWeightKg, 24);

    // 4. False-positive test suite (substrings, positive pumps, and negations across English, French, Darija)
    const falsePositives = normalizeInjuryFlagsToSymptoms([
      "I ate two avocados and kept strong discipline and dosage control.",
      "Endoscope check and kudos to the coach, zero pain today.",
      "Great shoulder pump today, felt super strong and pain free!",
      "No shoulder pain today, bench felt very stable.",
      "Zero knee ache or lumbar discomfort on squats.",
      "Séance dos super fluide aujourd'hui, aucune douleur.",
      "Aucune douleur à l'épaule ni au coude sur le développé.",
      "Pas de douleur au bas du dos aujourd'hui.",
      "Wore knee sleeves today, felt solid.",
      "ضهري مبقاش كيضرني الحمد لله",
      "ما كيضرنيش كتفي ف البنش",
      "ma darni la ktf la dhar lyoum",
      "mab9ach kiyderni merfeq",
    ]);
    assert.deepEqual(
      falsePositives,
      [],
      `False positives and negations must produce zero symptoms, got: ${JSON.stringify(falsePositives)}`
    );

    // 4b. Missing-data-never-negative tests (missing != bad across sleep, nutrition, and bodyweight)
    const missingRecovery = toolAuditRecoveryState({});
    assert.equal(missingRecovery.dataStatus, "missing_biometrics");
    assert.equal(missingRecovery.cnsFatigueLevel, "low");
    assert.equal(
      missingRecovery.requiresMacroDeload,
      false,
      "Missing sleep/wearable data must never infer poor recovery or trigger a deload"
    );

    const missingBwTrend = calculateSmoothedBodyweightTrend([]);
    assert.equal(missingBwTrend.dataPointsCount, 0);
    assert.equal(missingBwTrend.smoothedKg, undefined);
    assert.equal(missingBwTrend.trajectory, "unmeasured");

    const missingNutrition = diagnoseNutritionAndEnergyBalance(
      createDefaultAthleteModel("trainee_missing_data_honesty"),
      missingBwTrend,
      undefined
    );
    assert.equal(
      missingNutrition.isCaloricBottleneck,
      false,
      "Missing bodyweight and nutrition logs must never infer a negative caloric bottleneck"
    );

    // 5. True-positive test suite across English, French (accented), and Moroccan Darija (Arabizi + Arabic script)
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["dahri wja3ni f deadlift"]), ["lumbar_axial_strain"]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["ضهري كيضرني بزاف"]), ["lumbar_axial_strain"]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["ktfi darni f bench"]), [
      "anterior_shoulder_pinch",
      "glenohumeral_friction",
    ]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["كتفي كيوجعني"]), [
      "anterior_shoulder_pinch",
      "glenohumeral_friction",
    ]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["rokbti katdarni f squat"]), [
      "patellar_tracking_friction",
    ]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["ركبتي كتضرني"]), [
      "patellar_tracking_friction",
    ]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["merfeq darni"]), ["elbow_tendon_strain"]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["مرفقي كيضرني"]), ["elbow_tendon_strain"]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["ma3sam wja3ni"]), ["wrist_valgus_strain"]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["معصمي كيوجعني"]), ["wrist_valgus_strain"]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["Douleur à l'épaule sur le développé"]), [
      "anterior_shoulder_pinch",
      "glenohumeral_friction",
    ]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["Épicondylite au coude"]), [
      "elbow_tendon_strain",
    ]);
    assert.deepEqual(normalizeInjuryFlagsToSymptoms(["Mal au genou"]), [
      "patellar_tracking_friction",
    ]);

    // 6. Ambiguous symptom utterances must generate a clarifying question and NOT guess a joint
    const ambiguousDarija = parseMultilingualSymptomsWithClarification([
      "wja3ni bzzaf f had l'exercice",
      "وجعني بزاف",
    ]);
    assert.equal(ambiguousDarija.symptoms.length, 0, "Must not guess a joint when Darija pain has no joint location");
    assert.equal(ambiguousDarija.isAmbiguous, true);
    assert.ok(ambiguousDarija.clarifyingQuestions.length > 0);

    const ambiguousBetweenJoints = parseMultilingualSymptomsWithClarification([
      "maybe my shoulder or elbow hurt on set 2, not sure if it was the joint",
    ]);
    assert.equal(ambiguousBetweenJoints.symptoms.length, 0, "Must not guess when athlete is unsure between joints");
    assert.equal(ambiguousBetweenJoints.isAmbiguous, true);
    assert.ok(ambiguousBetweenJoints.clarifyingQuestions.length > 0);

    const sensoryAmbiguous = extractCanonicalAthleticRepresentation({
      exerciseName: "Incline Dumbbell Press",
      tags: [],
      rawText: "darni mfasel chwiya",
    });
    assert.ok(
      (sensoryAmbiguous.biomechanicalEntities.clarifyingQuestions?.length || 0) > 0,
      "Sensory memory extractor must generate a clarifying question for ambiguous Darija joint discomfort"
    );
  });

  it("Case 13 (Task 5): End-to-End Learning Loop & Schedulers -> Commits experiment, logs 2 weeks of sessions, evaluates confirmed/refuted/inconclusive outcomes, updates AthleteModel, and prevents re-proposing refuted interventions", () => {
    // --- Subcase A: Refuted experiment updates AthleteModel and next decision pivots instead of repeating ---
    const traineeRefuted = "trainee_task5_refuted";
    const initialModel = createDefaultAthleteModel(traineeRefuted);
    athleteModelStore.saveAthleteModel(initialModel);

    const expRefuted = athleteModelStore.recordExperiment({
      traineeId: traineeRefuted,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "nutrition_surplus",
      hypothesis: "Bodyweight is stagnant at 51.8kg.",
      actionTaken:
        "Add +350 kcal/day whole-food surplus (Moroccan olive oil, whole eggs, sardines, milk/banana shake) targeting +0.25kg/week gain.",
      successMetric: "+0.5kg bodyweight gain and +2 reps on primary lifts within 3 weeks",
      status: "active",
    });

    // Log 2 weeks of sessions and flat bodyweight logs (stagnant at 51.8kg, bench stuck at 40kg x 8)
    const twoWeekStagnantSessions: WorkoutSession[] = [
      makeTestSession("s_r1", "2026-10-02", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 8 }]),
      makeTestSession("s_r2", "2026-10-06", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 8 }]),
      makeTestSession("s_r3", "2026-10-10", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 8 }]),
      makeTestSession("s_r4", "2026-10-14", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 8 }]),
    ];
    const twoWeekFlatMetrics: BodyMetricEntry[] = [
      { id: "m_r1", traineeId: traineeRefuted, date: "2026-10-02", weightKg: 51.8, source: "manual" },
      { id: "m_r2", traineeId: traineeRefuted, date: "2026-10-08", weightKg: 51.8, source: "manual" },
      { id: "m_r3", traineeId: traineeRefuted, date: "2026-10-14", weightKg: 51.8, source: "manual" },
    ];

    const evalRefuted = evaluateCommittedExperiments({
      traineeId: traineeRefuted,
      sessions: twoWeekStagnantSessions,
      metricEntries: twoWeekFlatMetrics,
      currentDate: "2026-10-15",
      averageLoggedCalories: 2450, // Verified compliance with +350 kcal surplus over 2100 maintenance
    });

    assert.equal(evalRefuted.length, 1);
    assert.equal(evalRefuted[0].experimentId, expRefuted.id);
    assert.equal(evalRefuted[0].outcome, "refuted");
    assert.equal(evalRefuted[0].diagnosticReason, "treatment_failed_despite_compliance");
    assert.ok(evalRefuted[0].newConfidence > evalRefuted[0].previousConfidence);

    const updatedRefutedModel = athleteModelStore.getAthleteModel(traineeRefuted);
    assert.equal(updatedRefutedModel.activeExperiments.length, 0);
    assert.equal(updatedRefutedModel.resolvedExperiments.length, 1);
    assert.equal(updatedRefutedModel.resolvedExperiments[0].outcome, "refuted");

    // Next coaching decision must NOT re-propose the refuted action
    const caseFileAfterRefuted = assembleAthleteCaseFile({
      traineeId: traineeRefuted,
      sessions: twoWeekStagnantSessions,
      metricEntries: twoWeekFlatMetrics,
    });
    const nextReviewNoNewEvidence = executeWeeklyMesoReview(caseFileAfterRefuted, {
      hasNewEvidence: false,
    });
    assert.notEqual(
      nextReviewNoNewEvidence.selectedIntervention.action,
      expRefuted.actionTaken,
      "A refuted intervention must never be re-proposed when no new evidence has arrived"
    );

    const nextReviewWithSessions = executeWeeklyMesoReview(caseFileAfterRefuted, {
      hasNewEvidence: true,
    });
    assert.notEqual(
      nextReviewWithSessions.selectedIntervention.action,
      expRefuted.actionTaken,
      "Next coaching decision must reflect the refuted outcome and pivot/escalate rather than repeating the refuted action"
    );

    // --- Subcase B: Confirmed experiment updates AthleteModel field + confidence ---
    const traineeConfirmed = "trainee_task5_confirmed";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(traineeConfirmed));
    athleteModelStore.recordExperiment({
      traineeId: traineeConfirmed,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "nutrition_surplus",
      hypothesis: "Energy surplus will unlock bench progression.",
      actionTaken: "Add +350 kcal/day surplus",
      successMetric: "Weight gain and lift progression",
      status: "active",
    });

    const progressingSessions: WorkoutSession[] = [
      makeTestSession("s_c1", "2026-10-02", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 8 }]),
      makeTestSession("s_c2", "2026-10-07", "Flat Barbell Bench Press", [{ weightKg: 42.5, reps: 9 }]),
      makeTestSession("s_c3", "2026-10-13", "Flat Barbell Bench Press", [{ weightKg: 45, reps: 10 }]),
    ];
    const progressingMetrics: BodyMetricEntry[] = [
      { id: "m_c1", traineeId: traineeConfirmed, date: "2026-10-02", weightKg: 52.0, source: "manual" },
      { id: "m_c2", traineeId: traineeConfirmed, date: "2026-10-08", weightKg: 52.3, source: "manual" },
      { id: "m_c3", traineeId: traineeConfirmed, date: "2026-10-14", weightKg: 52.6, source: "manual" },
    ];

    const evalConfirmed = evaluateCommittedExperiments({
      traineeId: traineeConfirmed,
      sessions: progressingSessions,
      metricEntries: progressingMetrics,
      currentDate: "2026-10-15",
    });
    assert.equal(evalConfirmed[0].outcome, "confirmed");
    const confirmedModel = athleteModelStore.getAthleteModel(traineeConfirmed);
    assert.equal(confirmedModel.dynamic.energyBalanceTrend.value.isEnergyBottleneck, false);
    assert.ok(confirmedModel.dynamic.energyBalanceTrend.confidence >= 0.2);

    // --- Subcase C: Inconclusive experiment extends review window instead of triggering a new change ---
    const traineeInconclusive = "trainee_task5_inconclusive";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(traineeInconclusive));
    const expInconclusive = athleteModelStore.recordExperiment({
      traineeId: traineeInconclusive,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "volume_pruning",
      hypothesis: "Pruning 1 set will improve recovery.",
      actionTaken: "Reduce working sets from 4 to 3",
      successMetric: "+1 rep on top set",
      status: "active",
    });

    // Only 1 session logged in the 2-week window -> inconclusive!
    const sparseSessions: WorkoutSession[] = [
      makeTestSession("s_i1", "2026-10-05", "Flat Barbell Bench Press", [{ weightKg: 60, reps: 8 }]),
    ];
    const evalInconclusive = evaluateCommittedExperiments({
      traineeId: traineeInconclusive,
      sessions: sparseSessions,
      metricEntries: [],
      currentDate: "2026-10-15",
    });
    assert.equal(evalInconclusive[0].outcome, "inconclusive");
    assert.equal(evalInconclusive[0].newTargetReviewDate, "2026-10-29");

    const inconclusiveCaseFile = assembleAthleteCaseFile({
      traineeId: traineeInconclusive,
      sessions: sparseSessions,
      metricEntries: [],
    });
    const holdReview = executeWeeklyMesoReview(inconclusiveCaseFile);
    assert.equal(
      holdReview.committedExperiment?.id,
      expInconclusive.id,
      "Inconclusive experiment must extend the review window and hold steady rather than committing a new change"
    );

    // --- Subcase D: Autonomous Lifecycle Scheduler runs Macro + Weekly + Experiment evaluation ---
    const lifecycleRes = runAutonomousCoachingLifecycleCheck({
      traineeId: traineeConfirmed,
      sessions: progressingSessions,
      metricEntries: progressingMetrics,
      currentDate: "2026-11-20",
    });
    assert.equal(lifecycleRes.macroReviewTriggered, true);
    assert.equal(lifecycleRes.weeklyReviewTriggered, true);
    assert.ok(lifecycleRes.macroBlockPlan);
    assert.ok(lifecycleRes.weeklyReview);

    // --- Subcase E: Separating 'treatment failed' from 'unlogged intake', 'non-compliance', and 'noisy data' ---
    // 1. Intake NOT logged (averageLoggedCalories: undefined) -> must NOT mark refuted! Must be inconclusive ('unverified_compliance_intake_unlogged')
    const traineeUnlogged = "trainee_task5_unlogged_intake";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(traineeUnlogged));
    athleteModelStore.recordExperiment({
      traineeId: traineeUnlogged,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "nutrition_surplus",
      hypothesis: "Surplus will drive weight gain.",
      actionTaken: "Add +350 kcal/day surplus",
      successMetric: "+0.5kg gain",
      status: "active",
    });
    const evalUnlogged = evaluateCommittedExperiments({
      traineeId: traineeUnlogged,
      sessions: twoWeekStagnantSessions,
      metricEntries: [
        { id: "m_u1", traineeId: traineeUnlogged, date: "2026-10-02", weightKg: 51.8, source: "manual" },
        { id: "m_u2", traineeId: traineeUnlogged, date: "2026-10-14", weightKg: 51.8, source: "manual" },
      ],
      currentDate: "2026-10-15",
      averageLoggedCalories: undefined, // Intake not logged!
    });
    assert.equal(evalUnlogged[0].outcome, "inconclusive");
    assert.equal(evalUnlogged[0].diagnosticReason, "unverified_compliance_intake_unlogged");
    assert.equal(evalUnlogged[0].newTargetReviewDate, "2026-10-29");

    // 2. Athlete logged intake below surplus threshold (1,950 kcal vs 2,450 kcal target) -> 'athlete_non_compliance'
    const traineeNonCompliant = "trainee_task5_non_compliant";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(traineeNonCompliant));
    athleteModelStore.recordExperiment({
      traineeId: traineeNonCompliant,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "nutrition_surplus",
      hypothesis: "Surplus will drive weight gain.",
      actionTaken: "Add +350 kcal/day surplus",
      successMetric: "+0.5kg gain",
      status: "active",
    });
    const evalNonCompliant = evaluateCommittedExperiments({
      traineeId: traineeNonCompliant,
      sessions: twoWeekStagnantSessions,
      metricEntries: [
        { id: "m_nc1", traineeId: traineeNonCompliant, date: "2026-10-02", weightKg: 51.8, source: "manual" },
        { id: "m_nc2", traineeId: traineeNonCompliant, date: "2026-10-14", weightKg: 51.8, source: "manual" },
      ],
      currentDate: "2026-10-15",
      averageLoggedCalories: 1950,
      targetCalories: 2450,
    });
    assert.equal(evalNonCompliant[0].outcome, "inconclusive");
    assert.equal(evalNonCompliant[0].diagnosticReason, "athlete_non_compliance");

    // 3. Noisy scale data (> 1.5kg water fluctuation with flat slope) -> 'noisy_or_sparse_data'
    const traineeNoisy = "trainee_task5_noisy_weight";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(traineeNoisy));
    athleteModelStore.recordExperiment({
      traineeId: traineeNoisy,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "nutrition_surplus",
      hypothesis: "Surplus will drive weight gain.",
      actionTaken: "Add +350 kcal/day surplus",
      successMetric: "+0.5kg gain",
      status: "active",
    });
    const evalNoisy = evaluateCommittedExperiments({
      traineeId: traineeNoisy,
      sessions: twoWeekStagnantSessions,
      metricEntries: [
        { id: "m_n1", traineeId: traineeNoisy, date: "2026-10-02", weightKg: 51.8, source: "manual" },
        { id: "m_n2", traineeId: traineeNoisy, date: "2026-10-08", weightKg: 53.9, source: "manual" },
        { id: "m_n3", traineeId: traineeNoisy, date: "2026-10-14", weightKg: 51.7, source: "manual" },
      ],
      currentDate: "2026-10-15",
      averageLoggedCalories: 2450,
    });
    assert.equal(evalNoisy[0].outcome, "inconclusive");
    assert.equal(evalNoisy[0].diagnosticReason, "noisy_or_sparse_data");
  });

  it("Case 14 (Task 6): Knowledge Base Honesty -> Every entry initializes reviewedBy='UNREVIEWED', sourceless entries use practitioner_consensus, and unreviewed entries suppress evidence badges and citations", () => {
    for (const entry of COACHING_KNOWLEDGE_BASE) {
      assert.ok(entry.lastReviewed && entry.lastReviewed.length >= 8);
      assert.equal(
        entry.reviewedBy,
        "UNREVIEWED",
        `Entry ${entry.id} must initialize reviewedBy to UNREVIEWED`
      );
      assert.ok(Array.isArray(entry.sources));
      if (entry.sources.length === 0) {
        assert.equal(
          entry.evidenceStrength,
          "practitioner_consensus",
          `Sourceless entry ${entry.id} must be labeled practitioner_consensus`
        );
      }

      const formatted = formatPrincipleForExplainability(entry);
      assert.equal(
        formatted.showEvidenceBadge,
        false,
        `Unreviewed entry ${entry.id} must not display an evidence badge`
      );
      assert.equal(
        formatted.evidenceRating,
        undefined,
        `Unreviewed entry ${entry.id} must not claim a formal evidence rating in UI output`
      );
      assert.equal(
        formatted.citedPrincipleId,
        undefined,
        `Unreviewed entry ${entry.id} must not claim a formal citation ID in UI output`
      );
      assert.equal(formatted.plainLanguagePrinciple, entry.plainEnglishExplanation);
    }
  });

  it("Case 15 (Task 7): External Evaluation Suite (`eval/cases/`) & Shadow Mode -> Scores all 5 external JSON cases with 0 safety violations and logs shadow-mode runs without mutating user programs", async () => {
    // 1. Run external evaluation suite from eval/cases/
    const suiteReport = runCoachingEvalSuite();
    assert.equal(suiteReport.totalCases, 5, "Must load all 5 JSON evaluation cases from eval/cases/");
    assert.equal(
      suiteReport.unreviewedCasesCount,
      5,
      "All 5 initial JSON cases must have reviewed_by_coach: false until a human coach reviews them"
    );
    assert.equal(
      suiteReport.totalSafetyViolations,
      0,
      `Eval suite must have 0 safety violations, got: ${JSON.stringify(
        suiteReport.caseReports.map((r) => ({ id: r.caseId, violations: r.safetyViolations }))
      )}`
    );
    assert.equal(
      suiteReport.passedCases,
      5,
      `All 5 eval cases must pass priority ordering and required actions, got: ${JSON.stringify(
        suiteReport.caseReports.map((r) => ({
          id: r.caseId,
          passed: r.passed,
          observedTopPriorityDomain: r.observedTopPriorityDomain,
          missed: r.requiredActionsMissed,
        }))
      )}`
    );
    assert.equal(suiteReport.averageOverallScore, 100);

    // 2. Verify Shadow Mode logs case file, recommendation, and reasoning trace without applying mutations
    clearShadowModeLogs();
    const shadowTraineeId = "trainee_shadow_mode_test";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(shadowTraineeId));

    const shadowRun = await runVertexAgenticCoachLoop(
      {
        traineeId: shadowTraineeId,
        exerciseName: "Flat Barbell Bench Press",
        currentWeightKg: 40,
        targetSets: 3,
        repLow: 8,
        repHigh: 10,
        sessions: [
          makeTestSession("s_sh1", "2026-10-18", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 10 }]),
          makeTestSession("s_sh2", "2026-10-22", "Flat Barbell Bench Press", [{ weightKg: 40, reps: 10 }]),
        ],
      },
      { shadowMode: true }
    );

    assert.equal(shadowRun.shadowMode, true);
    assert.equal(
      shadowRun.mutationApplied,
      false,
      "Shadow mode must never apply mutations to the user's active program"
    );
    assert.deepEqual(
      shadowRun.proposition.mutation,
      {
        newTargetWeightKg: 40,
        newTargetSets: 3,
      },
      "Shadow mode proposition must preserve original weight and sets as a safe no-op"
    );

    const shadowLogs = getShadowModeLogs();
    assert.equal(shadowLogs.length, 1);
    assert.equal(shadowLogs[0].traineeId, shadowTraineeId);
    assert.equal(shadowLogs[0].mutationApplied, false);
    assert.ok(shadowLogs[0].caseFileSeen, "Shadow log must record the case file seen");
    assert.ok(
      shadowLogs[0].recommendedProposition,
      "Shadow log must record the recommendation it would have made"
    );
    assert.ok(
      shadowLogs[0].reasoningTrace.length > 0,
      "Shadow log must record the reasoning trace"
    );
  });

  it("Case 16: Hardening Verification -> Structured Symptom NLU (UI chips + LLM JSON + token table), Low-Friction Meal Habit Proxy & Bodyweight-Scaled Noise, Idempotent Scheduler + 10-Day Catch-Up, Durable Disk Persistence, and Loud Eval Validation + Live Variance Runner", async () => {
    // 1. Structured Symptom Input (UI chips bypass free-text parsing cleanly)
    const structuredClean = parseMultilingualSymptomsWithClarification([
      {
        joint: "shoulder",
        polarity: "resolved_or_negated",
        note: "Shoulder felt completely stable today",
      },
    ]);
    assert.equal(structuredClean.symptoms.length, 0);
    assert.equal(structuredClean.isAmbiguous, false);

    const structuredActive = parseMultilingualSymptomsWithClarification([
      {
        joint: "wrist",
        polarity: "active_pain",
        note: "Mild wrist strain on Barbell Curl",
      },
    ]);
    assert.deepEqual(structuredActive.symptoms, ["wrist_valgus_strain"]);
    assert.equal(structuredActive.isAmbiguous, false);

    // LLM JSON extractor mock (handles past tense / resolved context via structured JSON schema)
    const llmParsed = await extractStructuredSymptomsViaLlm(
      ["My right shoulder used to hurt last month, but today I pressed with zero pain."],
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          items: [
                            {
                              rawInput:
                                "My right shoulder used to hurt last month, but today I pressed with zero pain.",
                              joint: "shoulder",
                              polarity: "resolved_or_negated",
                            },
                          ],
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 200 }
          ),
      }
    );
    assert.equal(llmParsed.symptoms.length, 0);
    assert.equal(llmParsed.isAmbiguous, false);
    assert.equal(llmParsed.structuredReports[0]?.polarity, "resolved_or_negated");
    assert.equal(llmParsed.structuredReports[0]?.extractionMethod, "llm_semantic");

    // 2. Low-Friction Meal Habit Check-In Proxy + Bodyweight-Scaled Noise + Observational Verdict
    assert.equal(EXPERIMENT_EVALUATION_THRESHOLDS.status, "tunable_unvalidated_heuristic");
    const skinnyTraineeId = "trainee_skinny_habit_proxy";
    const skinnyModel = createDefaultAthleteModel(skinnyTraineeId);
    athleteModelStore.saveAthleteModel(skinnyModel);

    const habitExp = athleteModelStore.recordExperiment({
      traineeId: skinnyTraineeId,
      startDate: "2026-10-01",
      targetReviewDate: "2026-10-15",
      category: "nutrition_surplus",
      hypothesis: "Adding a daily shake and 3 fixed meals will raise smoothed scale trend by +0.25kg/wk.",
      actionTaken: "3 meals + 1 shake daily (+350 kcal/day)",
      successMetric: "Smoothed scale weight rises >= +0.15 kg/wk",
      status: "active",
    });

    // When an active nutrition experiment exists, getHighValueCheckInPrompt asks the 1-tap meal habit question
    const updatedSkinnyModel = athleteModelStore.getAthleteModel(skinnyTraineeId);
    const promptForHabit = athleteModelStore.getHighValueCheckInPrompt(updatedSkinnyModel);
    assert.ok(promptForHabit);
    assert.equal(promptForHabit.neededField, "meal_habit_check_in");
    assert.deepEqual(promptForHabit.quickTapOptions, ["yes", "mostly", "no"]);

    // Evaluate with mealHabitCheckIn: "yes" (no calorie logs required!) -> "consistent_with_hypothesis"
    const habitSuccess = evaluateCommittedExperiments({
      traineeId: skinnyTraineeId,
      currentDate: "2026-10-20",
      sessions: [
        makeTestSession("s_h1", "2026-10-05", "Bench Press", [{ weightKg: 42.5, reps: 8 }]),
        makeTestSession("s_h2", "2026-10-10", "Bench Press", [{ weightKg: 42.5, reps: 9 }]),
        makeTestSession("s_h3", "2026-10-16", "Bench Press", [{ weightKg: 45, reps: 8 }]),
      ],
      metricEntries: [
        { id: "bm_h1", traineeId: skinnyTraineeId, date: "2026-10-02", weightKg: 51.5, source: "manual" },
        { id: "bm_h2", traineeId: skinnyTraineeId, date: "2026-10-09", weightKg: 51.8, source: "manual" },
        { id: "bm_h3", traineeId: skinnyTraineeId, date: "2026-10-18", weightKg: 52.1, source: "manual" },
      ],
      mealHabitCheckIn: "yes",
    });
    assert.equal(habitSuccess.length, 1);
    assert.equal(habitSuccess[0].experimentId, habitExp.id);
    assert.equal(habitSuccess[0].outcome, "confirmed");
    assert.equal(habitSuccess[0].athleteFacingVerdict, "consistent_with_hypothesis");
    assert.ok(
      habitSuccess[0].reviewOutcome.includes("Consistent with hypothesis"),
      `Expected observational wording 'Consistent with hypothesis', got: ${habitSuccess[0].reviewOutcome}`
    );

    // Evaluate Bodyweight-Scaled Noise: 1.55 kg swing on a 52 kg beginner (> 2.6% = 1.35kg) is flagged as noisy, while 1.55 kg swing on a 100 kg lifter (< 2.6% = 2.60kg) is NOT flagged as noisy
    athleteModelStore.recordExperiment({
      traineeId: skinnyTraineeId,
      startDate: "2026-10-21",
      targetReviewDate: "2026-11-04",
      category: "nutrition_surplus",
      hypothesis: "Test 52kg noise sensitivity.",
      actionTaken: "+300 kcal",
      successMetric: "+0.4kg gain",
      status: "active",
    });

    const eval52kgSwing = evaluateCommittedExperiments({
      traineeId: skinnyTraineeId,
      currentDate: "2026-11-08",
      sessions: [
        makeTestSession("s_n52_1", "2026-10-25", "Squat", [{ weightKg: 60, reps: 5 }]),
        makeTestSession("s_n52_2", "2026-10-30", "Squat", [{ weightKg: 60, reps: 5 }]),
        makeTestSession("s_n52_3", "2026-11-05", "Squat", [{ weightKg: 60, reps: 5 }]),
      ],
      metricEntries: [
        { id: "bm_n52_1", traineeId: skinnyTraineeId, date: "2026-10-22", weightKg: 52.0, source: "manual" },
        { id: "bm_n52_2", traineeId: skinnyTraineeId, date: "2026-10-29", weightKg: 50.45, source: "manual" }, // 1.55kg swing (> 1.35kg limit for 52kg)
        { id: "bm_n52_3", traineeId: skinnyTraineeId, date: "2026-11-06", weightKg: 52.0, source: "manual" },
      ],
      mealHabitCheckIn: "yes",
    });
    assert.equal(eval52kgSwing[0].outcome, "inconclusive");
    assert.equal(eval52kgSwing[0].diagnosticReason, "noisy_or_sparse_data");

    const heavyTraineeId = "trainee_100kg_lifter";
    athleteModelStore.saveAthleteModel(createDefaultAthleteModel(heavyTraineeId));
    athleteModelStore.recordExperiment({
      traineeId: heavyTraineeId,
      startDate: "2026-10-21",
      targetReviewDate: "2026-11-04",
      category: "nutrition_surplus",
      hypothesis: "Test 100kg noise sensitivity.",
      actionTaken: "+300 kcal",
      successMetric: "+0.4kg gain",
      status: "active",
    });

    const eval100kgSwing = evaluateCommittedExperiments({
      traineeId: heavyTraineeId,
      currentDate: "2026-11-08",
      sessions: [
        makeTestSession("s_n100_1", "2026-10-25", "Squat", [{ weightKg: 140, reps: 5 }]),
        makeTestSession("s_n100_2", "2026-10-30", "Squat", [{ weightKg: 140, reps: 5 }]),
        makeTestSession("s_n100_3", "2026-11-05", "Squat", [{ weightKg: 140, reps: 5 }]),
      ],
      metricEntries: [
        { id: "bm_n100_1", traineeId: heavyTraineeId, date: "2026-10-22", weightKg: 100.0, source: "manual" },
        { id: "bm_n100_2", traineeId: heavyTraineeId, date: "2026-10-29", weightKg: 98.45, source: "manual" }, // 1.55kg swing (< 2.60kg limit for 100kg)
        { id: "bm_n100_3", traineeId: heavyTraineeId, date: "2026-11-06", weightKg: 100.0, source: "manual" },
      ],
      mealHabitCheckIn: "yes",
    });
    assert.equal(eval100kgSwing[0].outcome, "refuted");
    assert.equal(eval100kgSwing[0].diagnosticReason, "treatment_failed_despite_compliance");
    assert.equal(eval100kgSwing[0].athleteFacingVerdict, "not_supported_despite_compliance");

    // 3. Autonomous Lifecycle Scheduler: Idempotent on same day + catches up cleanly after 10-day gap
    const schedTraineeId = "trainee_scheduler_idempotency";
    const schedModel = createDefaultAthleteModel(schedTraineeId);
    schedModel.lastWeeklyReviewDate = "2026-10-01";
    schedModel.lastMacroReviewDate = "2026-10-01";
    athleteModelStore.saveAthleteModel(schedModel);

    // 10-day gap (2026-10-01 -> 2026-10-11): Meso review triggers once and catches up
    const firstLifecycleRun = runAutonomousCoachingLifecycleCheck({
      traineeId: schedTraineeId,
      currentDate: "2026-10-11",
      sessions: [
        makeTestSession("s_sc1", "2026-10-03", "Bench Press", [{ weightKg: 50, reps: 8 }]),
        makeTestSession("s_sc2", "2026-10-07", "Bench Press", [{ weightKg: 50, reps: 8 }]),
        makeTestSession("s_sc3", "2026-10-10", "Bench Press", [{ weightKg: 50, reps: 8 }]),
      ],
      metricEntries: [
        { id: "bm_sc1", traineeId: schedTraineeId, date: "2026-10-02", weightKg: 70, source: "manual" },
        { id: "bm_sc2", traineeId: schedTraineeId, date: "2026-10-10", weightKg: 70.2, source: "manual" },
      ],
    });
    assert.equal(firstLifecycleRun.weeklyReviewTriggered, true);
    assert.equal(firstLifecycleRun.alreadyRanForWindow, false);
    const expCountAfterFirst = athleteModelStore.getAthleteModel(schedTraineeId).activeExperiments.length;

    // Second call on the same day ("2026-10-11"): idempotent! Does not re-trigger or create duplicate experiments
    const secondLifecycleRunSameDay = runAutonomousCoachingLifecycleCheck({
      traineeId: schedTraineeId,
      currentDate: "2026-10-11",
      sessions: [
        makeTestSession("s_sc1", "2026-10-03", "Bench Press", [{ weightKg: 50, reps: 8 }]),
        makeTestSession("s_sc2", "2026-10-07", "Bench Press", [{ weightKg: 50, reps: 8 }]),
        makeTestSession("s_sc3", "2026-10-10", "Bench Press", [{ weightKg: 50, reps: 8 }]),
      ],
      metricEntries: [
        { id: "bm_sc1", traineeId: schedTraineeId, date: "2026-10-02", weightKg: 70, source: "manual" },
        { id: "bm_sc2", traineeId: schedTraineeId, date: "2026-10-10", weightKg: 70.2, source: "manual" },
      ],
    });
    assert.equal(secondLifecycleRunSameDay.weeklyReviewTriggered, false);
    assert.equal(secondLifecycleRunSameDay.alreadyRanForWindow, true);
    assert.equal(
      athleteModelStore.getAthleteModel(schedTraineeId).activeExperiments.length,
      expCountAfterFirst,
      "Idempotent same-day scheduler call must not create duplicate experiments"
    );

    // 4. Durable Disk Persistence AND Connected Drizzle PostgreSQL Multi-User Persistence (Cloud Run Ready)
    const tmpFile = path.join(os.tmpdir(), `vyra-coach-durable-test-${Date.now()}.json`);
    try {
      athleteModelStore.setDurableFilePath(tmpFile);
      athleteModelStore.saveAthleteModel(athleteModelStore.getAthleteModel(schedTraineeId));
      assert.equal(fs.existsSync(tmpFile), true);

      // Clear in-memory state and reload from disk
      athleteModelStore.setDurableFilePath(null);
      athleteModelStore.clearForTesting();
      assert.equal(athleteModelStore.getAthleteModel(schedTraineeId).activeExperiments.length, 0);

      const loadedOk = athleteModelStore.loadFromDiskFile(tmpFile);
      assert.equal(loadedOk, true);
      assert.equal(athleteModelStore.getAthleteModel(schedTraineeId).activeExperiments.length, expCountAfterFirst);
    } finally {
      athleteModelStore.setDurableFilePath(null);
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }

    // 4B. Connected Drizzle PostgreSQL Persistence across multiple users & simulated Cloud Run container restarts
    const pgTestHarness = createInMemoryPostgresPoolForTesting();
    setCustomDbPool(pgTestHarness.pool);
    try {
      athleteModelStore.clearForTesting();
      clearShadowModeLogs();

      // Friend 1 (`trainee_friend_omar`) and Friend 2 (`trainee_friend_sara`) save models & experiments concurrently
      const omarModel = createDefaultAthleteModel("trainee_friend_omar");
      omarModel.static.regime = createVersionedField("intermediate", 0.9, "self_reported");
      athleteModelStore.saveAthleteModel(omarModel);
      const omarExp = athleteModelStore.recordExperiment({
        traineeId: "trainee_friend_omar",
        startDate: "2026-11-01",
        targetReviewDate: "2026-11-15",
        category: "volume_pruning",
        hypothesis: "Pruning 1 set on bench will restore bar speed.",
        actionTaken: "Reduce bench sets from 4 to 3",
        successMetric: "+1 rep on top set",
        status: "active",
      });

      const saraModel = createDefaultAthleteModel("trainee_friend_sara");
      saraModel.static.regime = createVersionedField("novice", 0.9, "self_reported");
      athleteModelStore.saveAthleteModel(saraModel);
      const saraExp = athleteModelStore.recordExperiment({
        traineeId: "trainee_friend_sara",
        startDate: "2026-11-02",
        targetReviewDate: "2026-11-16",
        category: "nutrition_surplus",
        hypothesis: "Daily shake will increase scale weight.",
        actionTaken: "+350 kcal shake",
        successMetric: "+0.25kg/wk",
        status: "active",
      });

      await athleteModelStore.syncToDatabase("trainee_friend_omar");
      await athleteModelStore.syncToDatabase("trainee_friend_sara");

      // Also run shadow mode for Omar so `coach_shadow_logs` table is written via Drizzle
      await runVertexAgenticCoachLoop(
        {
          traineeId: "trainee_friend_omar",
          exerciseName: "Flat Barbell Bench Press",
          currentWeightKg: 80,
          targetSets: 3,
          repLow: 6,
          repHigh: 8,
          sessions: [
            makeTestSession("s_om1", "2026-11-01", "Flat Barbell Bench Press", [{ weightKg: 80, reps: 8 }]),
            makeTestSession("s_om2", "2026-11-05", "Flat Barbell Bench Press", [{ weightKg: 80, reps: 8 }]),
          ],
        },
        { shadowMode: true }
      );

      // Verify Drizzle generated and executed real SQL INSERT/UPSERT queries against all 3 tables
      assert.ok(
        pgTestHarness.executedQueries.some((q) => q.sql.includes('insert into "athlete_models"')),
        "Drizzle must execute INSERT INTO athlete_models"
      );
      assert.ok(
        pgTestHarness.executedQueries.some((q) => q.sql.includes('insert into "coaching_experiments"')),
        "Drizzle must execute INSERT INTO coaching_experiments"
      );
      assert.ok(
        pgTestHarness.executedQueries.some((q) => q.sql.includes('insert into "coach_shadow_logs"')),
        "Drizzle must execute INSERT INTO coach_shadow_logs"
      );

      // Simulate Cloud Run container restart (wiping all in-memory maps)
      athleteModelStore.clearForTesting();
      clearShadowModeLogs();
      assert.equal(getShadowModeLogs("trainee_friend_omar").length, 0);

      // Hydrate both friends from Drizzle PostgreSQL in the new container instance
      const hydratedOmar = await athleteModelStore.hydrateFromDatabase("trainee_friend_omar");
      const hydratedSara = await athleteModelStore.hydrateFromDatabase("trainee_friend_sara");
      const hydratedShadowLogs = await hydrateShadowModeLogsFromDatabase("trainee_friend_omar");

      assert.equal(hydratedOmar.static.regime.value, "intermediate");
      assert.equal(hydratedOmar.activeExperiments.length, 1);
      assert.equal(hydratedOmar.activeExperiments[0].id, omarExp.id);
      assert.equal(hydratedOmar.activeExperiments[0].category, "volume_pruning");

      assert.equal(hydratedSara.static.regime.value, "novice");
      assert.equal(hydratedSara.activeExperiments.length, 1);
      assert.equal(hydratedSara.activeExperiments[0].id, saraExp.id);
      assert.equal(hydratedSara.activeExperiments[0].category, "nutrition_surplus");

      assert.equal(hydratedShadowLogs.length, 1);
      assert.equal(hydratedShadowLogs[0].traineeId, "trainee_friend_omar");
    } finally {
      setCustomDbPool(null);
    }

    // 5. Loud Eval Validation Error + Live-Model Variance Runner
    assert.throws(
      () =>
        validateEvalCaseJson(
          {
            id: "broken_eval_case",
            // Missing case_id, title, reviewed_by_coach, athlete_profile, history, expected_priority_order, etc.
          },
          "eval/cases/broken_eval_case.json"
        ),
      (err: unknown) =>
        err instanceof EvalCaseValidationError &&
        err.fileName === "eval/cases/broken_eval_case.json" &&
        err.validationErrors.length >= 4
    );

    const skippedVariance = await runLiveModelVarianceEval();
    assert.equal(skippedVariance.status, "skipped_no_api_key_in_env");

    let turnCounter = 0;
    const varianceSummary = await runLiveModelVarianceEval({
      iterationsPerCase: 2,
      fetchImpl: async () => {
        turnCounter += 1;
        // Turn 1: call propose_and_critique_intervention, Turn 2: call commit_coaching_decision
        const isCommitTurn = turnCounter % 2 === 0;
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    {
                      functionCall: isCommitTurn
                        ? {
                            name: "commit_coaching_decision",
                            args: {
                              tier: "tier_1_setup_cue",
                              headline: "Maintain Current Load & Focus on Setup",
                              rootCauseDiagnosis: "Evaluating multi-week trend before load jump.",
                              proposedFix: "Keep current working weight and sets.",
                              prescribedWeightKg: 40,
                              prescribedSets: 3,
                            },
                          }
                        : {
                            name: "propose_and_critique_intervention",
                            args: {
                              proposedTier: "tier_1_setup_cue",
                              primaryHypothesis: "Maintain current load while monitoring bottleneck.",
                              skepticalCounterargument: "Jumping load prematurely risks form breakdown.",
                              proportionalityVerdict: "proportional",
                            },
                          },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      },
    });
    assert.equal(varianceSummary.status, "executed");
    assert.equal(varianceSummary.iterationsPerCase, 2);
    assert.equal(varianceSummary.caseVarianceReports.length, 5);
    for (const cReport of varianceSummary.caseVarianceReports) {
      assert.equal(cReport.tierConsistencyRate, 1);
      assert.equal(cReport.zeroSafetyViolationsAcrossAllRuns, true);
    }
  });
});
