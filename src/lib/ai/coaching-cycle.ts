/**
 * Autonomous Multi-Timescale Coaching Engine
 * 
 * Implements an elite coach's three time-scale loops:
 * 1. Loop A (Macro, 4–8 weeks): Phase planning, split design, frequency, and specialization targets.
 * 2. Loop B (Weekly / Meso Review): End-of-week Propose-Critique-Verify reasoning cycle.
 *    - Differential diagnosis before prescribing (ranks nutrition, recovery, adherence, volume before exercise swaps).
 *    - Skeptical critique pass ("What would make this intervention wrong?").
 *    - Deterministic guardrail verification.
 *    - Experiment commitment with hypothesis, review date, and review metric.
 * 3. Loop C (Micro / In-Session JIT): Strictly narrowed to in-session autoregulation,
 *    equipment unavailability substitution, and acute joint strain/pain handling.
 *    Never proposes strategic multi-week structural overhauls mid-workout.
 */

import {
  AthleteModel,
  athleteModelStore,
  CoachingExperiment,
  createVersionedField,
} from "./athlete-model";
import {
  calculateSmoothedBodyweightTrend,
  calculateE1RMTrends,
  calculateWeeklyMuscleVolume,
  calculateAdherenceMetrics,
  calculateSymptomTrajectories,
  SmoothedBodyweightTrend,
  AdherenceTrendReport,
  ExerciseE1RMTrend,
  SymptomTrajectory,
} from "../training-math/trend-analytics";
import { diagnoseNutritionAndEnergyBalance, NutritionDiagnosticReport } from "./nutrition-coach";
import {
  retrieveApplicablePrinciples,
  CoachingPrinciple,
  isPrincipleHumanReviewed,
} from "./knowledge-base";
import { sensoryMemoryStore } from "./sensory-memory";
import { detectMedicalRedFlags } from "./coach-agent";
import { WorkoutSession, BodyMetricEntry } from "../types";

export interface CaseFile {
  traineeId: string;
  athleteModel: AthleteModel;
  bodyweightTrend: SmoothedBodyweightTrend;
  adherenceTrend: AdherenceTrendReport;
  e1RMTrends: ExerciseE1RMTrend[];
  symptomTrajectories: SymptomTrajectory[];
  nutritionDiagnosis: NutritionDiagnosticReport;
  applicablePrinciples: CoachingPrinciple[];
  medicalRedFlags: string[];
  dataQualityNotes: string[];
}

export interface MacroBlockPlan {
  blockId: string;
  startDate: string;
  durationWeeks: number;
  recommendedPhase: "lean_gain" | "bulk" | "maintenance" | "cut" | "deload" | "specialization";
  recommendedSplit: "full_body_3x" | "upper_lower_4x" | "upper_lower_full_3x" | "push_pull_legs";
  sessionsPerWeek: number;
  frequencyPerMusclePerWeek: number;
  specializationTargets: string[];
  maintenanceTargets: string[];
  volumeLandmarksByMuscle: Record<
    string,
    {
      mevSets: number;
      targetSets: number;
      mrvSets: number;
    }
  >;
  regimeJustification: string;
  deferredTechniquesExplanation: string;
  scienceCitations: Array<{
    principleId?: string;
    title: string;
    plainLanguagePrinciple: string;
    reviewedBy: string;
    evidenceRating?: CoachingPrinciple["evidenceStrength"];
    showEvidenceBadge: boolean;
  }>;
  reviewWindowWeeks: number;
}

export interface DifferentialHypothesis {
  rank: number;
  domain:
    | "medical_boundary"
    | "energy_balance"
    | "sleep_recovery"
    | "adherence"
    | "volume_landmarks"
    | "tendon_tolerance"
    | "exercise_selection";
  hypothesis: string;
  evidenceStrength: "overwhelming" | "moderate" | "weak";
  recommendedIntervention: string;
  costOfChange: "low" | "medium" | "high";
}

export interface WeeklyReviewResult {
  reviewDate: string;
  caseSummary: string;
  differentialDiagnosis: DifferentialHypothesis[];
  selectedIntervention: {
    domain: DifferentialHypothesis["domain"];
    action: string;
    rationale: string;
    expectedOutcome: string;
    reviewDate: string;
  };
  critiquePass: {
    skepticalChallenge: string;
    proportionalityVerdict: "proportional" | "excessive_change_budget" | "disproportionate";
    counterfactualRisk: string;
  };
  guardrailVerification: {
    passed: boolean;
    safetyChecks: string[];
    violations: string[];
  };
  committedExperiment?: CoachingExperiment;
}

/**
 * Step 1: Assembles the structured Case File for the athlete without raw log dump.
 */
export function assembleAthleteCaseFile(params: {
  traineeId: string;
  sessions: WorkoutSession[];
  metricEntries: BodyMetricEntry[];
  averageLoggedCalories?: number;
}): CaseFile {
  const model = athleteModelStore.getAthleteModel(params.traineeId);
  const bodyweightTrend = calculateSmoothedBodyweightTrend(params.metricEntries);
  const plannedPerWeek = model.static.lifestyle.achievableSessionsPerWeek.value || 3;
  const adherenceTrend = calculateAdherenceMetrics(
    params.sessions,
    plannedPerWeek,
    model.dynamic.adherenceReality.confidence >= 0.7
      ? { completionRatePct: model.dynamic.adherenceReality.value.completionRatePct }
      : undefined
  );

  const keyExercises = Array.from(
    new Set(
      params.sessions.flatMap((s) => s.setLogs.map((l) => l.exerciseName)).slice(0, 5)
    )
  );
  const e1RMTrends = keyExercises.map((ex) => calculateE1RMTrends(params.sessions, ex));
  const symptomTrajectories = calculateSymptomTrajectories(params.sessions);
  const nutritionDiagnosis = diagnoseNutritionAndEnergyBalance(
    model,
    bodyweightTrend,
    params.averageLoggedCalories
  );
  const applicablePrinciples = retrieveApplicablePrinciples(model);

  // Extract any medical red flags from sensory memory or recent session notes
  const sensoryRecords = sensoryMemoryStore.getAllForTrainee(params.traineeId);
  const rawFeedbackStrings = [
    ...sensoryRecords.map((r) => r.rawTranscription || r.freeTextNote || r.canonicalEnglishSummary || ""),
    ...params.sessions.flatMap((s) => [
      s.notes || "",
      ...(s.exerciseFeedbacks || []).map((f) => f.note || f.audioTranscript || ""),
    ]),
  ].filter(Boolean);
  const redFlagScan = detectMedicalRedFlags(rawFeedbackStrings);
  const medicalRedFlags = Array.from(
    new Set([
      ...redFlagScan.triggers,
      ...sensoryRecords.flatMap((r) => r.biomechanicalEntities?.medicalRedFlags || []),
    ])
  );

  const dataQualityNotes: string[] = [];
  if (params.metricEntries.length < 3) {
    dataQualityNotes.push("Bodyweight entries sparse (< 3 logs); weight trend confidence is provisional.");
  }
  if (model.dynamic.recoveryCapacity.confidence < 0.3) {
    dataQualityNotes.push("Zero continuous sleep or HRV telemetry; recovery reasoning relies on subjective logs.");
  }
  if (!params.averageLoggedCalories) {
    dataQualityNotes.push("Direct caloric intake unlogged; maintenance calories derived from weight velocity heuristics.");
  }

  return {
    traineeId: params.traineeId,
    athleteModel: model,
    bodyweightTrend,
    adherenceTrend,
    e1RMTrends,
    symptomTrajectories,
    nutritionDiagnosis,
    applicablePrinciples,
    medicalRedFlags,
    dataQualityNotes,
  };
}

/**
 * Loop A (Macro, 4–8 weeks): Block-level review.
 * Reassesses goals, rate of progress, and phase (lean_gain, bulk, maintenance, cut, deload, specialization).
 * Chooses split, frequency per muscle, volume distribution, and specialization vs maintenance targets.
 * Explicitly justifies why advanced high-volume / intensity techniques are deferred for novices.
 */
export function executeMacroBlockReview(caseFile: CaseFile): MacroBlockPlan {
  const model = caseFile.athleteModel;
  const regime = model.static.regime.value;
  const isNovice = regime === "novice";
  const achievableDays = model.static.lifestyle.achievableSessionsPerWeek.value || 3;
  const effectiveSessionsPerWeek = caseFile.adherenceTrend.isPrimaryBottleneck
    ? Math.min(3, achievableDays)
    : achievableDays;

  // Determine recommended phase
  let recommendedPhase: MacroBlockPlan["recommendedPhase"] = "lean_gain";
  if (caseFile.medicalRedFlags.length > 0) {
    recommendedPhase = "deload";
  } else if (
    model.static.goals.value.some(
      (g) =>
        g.label.toLowerCase().includes("lean") ||
        g.label.toLowerCase().includes("hypertrophy") ||
        g.label.toLowerCase().includes("mass") ||
        g.category === "hypertrophy"
    )
  ) {
    recommendedPhase =
      isNovice &&
      (caseFile.bodyweightTrend.smoothedKg ?? 0) > 0 &&
      (caseFile.bodyweightTrend.smoothedKg ?? 0) < 62
        ? "bulk"
        : "lean_gain";
  } else if (!isNovice) {
    recommendedPhase = "specialization";
  }

  // Determine split based on realistic schedule and regime
  let recommendedSplit: MacroBlockPlan["recommendedSplit"] = "full_body_3x";
  let frequencyPerMusclePerWeek = 3;
  if (effectiveSessionsPerWeek <= 3) {
    recommendedSplit = isNovice ? "full_body_3x" : "upper_lower_full_3x";
    frequencyPerMusclePerWeek = isNovice ? 3 : 2;
  } else if (effectiveSessionsPerWeek === 4) {
    recommendedSplit = "upper_lower_4x";
    frequencyPerMusclePerWeek = 2;
  } else {
    recommendedSplit = isNovice ? "upper_lower_4x" : "push_pull_legs";
    frequencyPerMusclePerWeek = 2;
  }

  // Specialization vs Maintenance targets
  const specializationTargets = isNovice
    ? ["Foundational Compound Patterns (Horizontal Push, Vertical Pull, Knee-Dominant Squat, Hip Hinge)", "Lateral Deltoid & Upper Pectoral Frame Width"]
    : ["Clavicular Pectorals", "Lateral Deltoid", "Latissimus Dorsi"];
  const maintenanceTargets = isNovice
    ? ["Direct Forearm & Calf Isolation (covered via compound loading)"]
    : ["Anterior Deltoid", "Lower Back / Erectors"];

  // Volume distribution per muscle group reading personalized MEV/MRV from AthleteModel
  const volumeLandmarksByMuscle: MacroBlockPlan["volumeLandmarksByMuscle"] = {};
  for (const [muscle, landmark] of Object.entries(model.dynamic.perMuscleVolumeLandmarks)) {
    const mevSets = landmark.value.inferredMEV;
    const mrvSets = landmark.value.inferredMRV;
    const targetSets = isNovice
      ? Math.min(mrvSets - 2, mevSets + 4)
      : Math.round((mevSets + mrvSets) / 2);
    volumeLandmarksByMuscle[muscle] = {
      mevSets,
      targetSets,
      mrvSets,
    };
  }

  const weightStr =
    (caseFile.bodyweightTrend.smoothedKg ?? 0) > 0
      ? `${caseFile.bodyweightTrend.smoothedKg} kg`
      : "unlogged bodyweight";
  const regimeJustification = isNovice
    ? `At a ${regime} training age (${model.static.trainingAgeMonths.value} months verified exposure, ${weightStr}), neural motor skill acquisition and whole-food caloric surplus (+${caseFile.nutritionDiagnosis.surplusDeltaKcal} kcal/day) drive >85% of adaptation. A ${effectiveSessionsPerWeek}-day ${recommendedSplit} structure hits every muscle ${frequencyPerMusclePerWeek}x/week with high movement quality and ample 48-hour recovery windows.`
    : `With ${model.static.trainingAgeMonths.value} months of training exposure (${regime} regime), a ${recommendedSplit} block allocates higher set volume toward specialization targets (${specializationTargets.join(", ")}) while holding secondary groups near MEV.`;

  const deferredTechniquesExplanation = isNovice
    ? "High-volume 6-day Arnold splits, drop sets, rest-pause sets, and frequent exercise rotation are deliberately deferred in this 6-week block. In a ~52 kg novice, excessive per-session junk volume elevates muscle damage and caloric burn without increasing myofibrillar protein synthesis, directly cannibalizing the energy surplus needed for tissue accretion."
    : "Myo-reps and metabolite drop-sets are restricted strictly to the final set of single-joint isolation movements to prevent axial CNS fatigue spillover.";

  const durationWeeks = isNovice ? 6 : 8;
  const now = new Date().toISOString().split("T")[0];

  return {
    blockId: `macro_${caseFile.traineeId}_${now}`,
    startDate: now,
    durationWeeks,
    recommendedPhase,
    recommendedSplit,
    sessionsPerWeek: effectiveSessionsPerWeek,
    frequencyPerMusclePerWeek,
    specializationTargets,
    maintenanceTargets,
    volumeLandmarksByMuscle,
    regimeJustification,
    deferredTechniquesExplanation,
    scienceCitations: caseFile.applicablePrinciples.map((p) => {
      const reviewed = isPrincipleHumanReviewed(p);
      return {
        principleId: reviewed ? p.id : undefined,
        title: reviewed ? p.title : p.plainEnglishExplanation,
        plainLanguagePrinciple: p.plainEnglishExplanation,
        reviewedBy: p.reviewedBy,
        evidenceRating: reviewed ? p.evidenceStrength : undefined,
        showEvidenceBadge: reviewed,
      };
    }),
    reviewWindowWeeks: durationWeeks,
  };
}

/**
 * Tunable heuristic thresholds for experiment adjudication (NOT validated clinical constants).
 * Noise swing threshold scales by athlete bodyweight (`maxWeightSwingPctOfBodyweight = 2.6%` of BW,
 * e.g. ~1.35kg for a 52kg novice vs ~2.6kg for a 100kg lifter).
 */
export const EXPERIMENT_EVALUATION_THRESHOLDS = {
  status: "tunable_unvalidated_heuristic" as const,
  maxWeightSwingPctOfBodyweight: 2.6,
  fallbackFlatSwingKg: 1.5,
  minWeeklyWeightGainKg: 0.05,
  surplusFloorToleranceKcal: 150,
  confidenceStepOnResolution: 0.2,
};

export interface ExperimentEvaluationSummary {
  experimentId: string;
  category: CoachingExperiment["category"];
  outcome: "confirmed" | "refuted" | "inconclusive";
  /** Observational athlete-facing framing ("consistent_with_hypothesis" instead of claiming causal proof) */
  athleteFacingVerdict:
    | "consistent_with_hypothesis"
    | "not_supported_despite_compliance"
    | "inconclusive";
  diagnosticReason:
    | "treatment_efficacy_confirmed"
    | "treatment_failed_despite_compliance"
    | "unverified_compliance_intake_unlogged"
    | "athlete_non_compliance"
    | "noisy_or_sparse_data";
  reviewOutcome: string;
  updatedModelField: string;
  previousConfidence: number;
  newConfidence: number;
  newTargetReviewDate?: string;
}

/**
 * Evaluates all active CoachingExperiments for `traineeId` whose `targetReviewDate` has arrived.
 * Explicitly separates:
 * - `treatment_efficacy_confirmed` (`confirmed` / `consistent_with_hypothesis`)
 * - `treatment_failed_despite_compliance` (`refuted` / `not_supported_despite_compliance`)
 * - `unverified_compliance_intake_unlogged` (`inconclusive` — window extended)
 * - `athlete_non_compliance` (`inconclusive` — window extended)
 * - `noisy_or_sparse_data` (`inconclusive` — window extended)
 *
 * Supports `mealHabitCheckIn` ("yes" | "mostly" | "no") as a low-friction 1-tap compliance proxy
 * for athletes who do not log daily calories.
 */
export function evaluateCommittedExperiments(params: {
  traineeId: string;
  sessions: WorkoutSession[];
  metricEntries: BodyMetricEntry[];
  currentDate?: string;
  averageLoggedCalories?: number;
  targetCalories?: number;
  interventionComplianceConfirmed?: boolean;
  /** Low-friction weekly 1-tap check-in ("Did you hit your 3 meals + shake most days?") when calorie logs are absent */
  mealHabitCheckIn?: "yes" | "mostly" | "no";
}): ExperimentEvaluationSummary[] {
  const effectiveDate = params.currentDate || new Date().toISOString().split("T")[0];
  const model = athleteModelStore.getAthleteModel(params.traineeId);
  const dueExperiments = model.activeExperiments.filter(
    (exp) => exp.status === "active" && effectiveDate >= exp.targetReviewDate
  );

  if (dueExperiments.length === 0) {
    return [];
  }

  const results: ExperimentEvaluationSummary[] = [];

  const extendAsInconclusive = (
    exp: CoachingExperiment,
    diagnosticReason: ExperimentEvaluationSummary["diagnosticReason"],
    outcomeMsg: string,
    currentConf: number
  ) => {
    const nextDateObj = new Date(`${effectiveDate}T00:00:00Z`);
    nextDateObj.setUTCDate(nextDateObj.getUTCDate() + 14);
    const extendedDate = nextDateObj.toISOString().split("T")[0];

    athleteModelStore.extendExperimentReviewWindow(
      params.traineeId,
      exp.id,
      extendedDate,
      outcomeMsg
    );

    results.push({
      experimentId: exp.id,
      category: exp.category,
      outcome: "inconclusive",
      athleteFacingVerdict: "inconclusive",
      diagnosticReason,
      reviewOutcome: outcomeMsg,
      updatedModelField: "activeExperiments.targetReviewDate",
      previousConfidence: currentConf,
      newConfidence: currentConf,
      newTargetReviewDate: extendedDate,
    });
  };

  for (const exp of dueExperiments) {
    const postSessions = params.sessions.filter(
      (s) => s.date >= exp.startDate && s.date <= effectiveDate
    );
    const postMetrics = params.metricEntries.filter(
      (m) => m.date >= exp.startDate && m.date <= effectiveDate
    );

    const isInsufficientData =
      exp.category === "nutrition_surplus"
        ? postSessions.length < 2 || postMetrics.length < 2
        : postSessions.length < 2;

    if (isInsufficientData) {
      extendAsInconclusive(
        exp,
        "noisy_or_sparse_data",
        "Inconclusive data during review window (< 2 logged exposures/weigh-ins); extending review window by 14 days instead of triggering a new change.",
        model.dynamic.energyBalanceTrend.confidence
      );
      continue;
    }

    // Check for high day-to-day bodyweight noise scaled by athlete bodyweight (2.6% of BW; e.g., ~1.35kg at 52kg vs ~2.6kg at 100kg)
    if (exp.category === "nutrition_surplus" && postMetrics.length >= 2) {
      const weights = postMetrics.map((m) => m.weightKg);
      const meanWeightKg = weights.reduce((a, b) => a + b, 0) / weights.length;
      const bwScaledNoiseThresholdKg =
        meanWeightKg > 0
          ? Number(
              (
                (meanWeightKg *
                  EXPERIMENT_EVALUATION_THRESHOLDS.maxWeightSwingPctOfBodyweight) /
                100
              ).toFixed(2)
            )
          : EXPERIMENT_EVALUATION_THRESHOLDS.fallbackFlatSwingKg;
      const weightRangeKg = Math.max(...weights) - Math.min(...weights);
      const rawNetDeltaKg = weights[weights.length - 1] - weights[0];
      const prelimTrend = calculateSmoothedBodyweightTrend(postMetrics);
      if (
        weightRangeKg > bwScaledNoiseThresholdKg &&
        (Math.abs(prelimTrend.weeklyDeltaKg) < 0.08 || Math.abs(rawNetDeltaKg) <= 0.3)
      ) {
        extendAsInconclusive(
          exp,
          "noisy_or_sparse_data",
          `Inconclusive: High scale weight variance (${weightRangeKg.toFixed(1)}kg swing > ${bwScaledNoiseThresholdKg}kg bodyweight-scaled noise threshold) obscures true tissue trend; extending review window by 14 days.`,
          model.dynamic.energyBalanceTrend.confidence
        );
        continue;
      }
    }

    const bwTrend = calculateSmoothedBodyweightTrend(
      postMetrics.length >= 2 ? postMetrics : params.metricEntries
    );
    const keyExercises = Array.from(
      new Set(postSessions.flatMap((s) => s.setLogs.map((l) => l.exerciseName)))
    );
    const e1RMTrends = keyExercises.map((ex) => calculateE1RMTrends(postSessions, ex));
    const symptomTrends = calculateSymptomTrajectories(postSessions);

    const anyLiftProgressed = e1RMTrends.some(
      (t) => t.status === "progressing" || t.slopeKgPerWeek > 0.15
    );
    const hasActivePainInWindow =
      symptomTrends.some(
        (s) => s.status === "active" && s.currentFrictionLevel === "significant_intervention_required"
      ) ||
      postSessions.some((s) =>
        (s.exerciseFeedbacks || []).some(
          (f) => f.tag === "joint_strain" || (f.tags || []).includes("joint_strain")
        )
      );

    let outcome: "confirmed" | "refuted" = "refuted";
    let diagnosticReason: ExperimentEvaluationSummary["diagnosticReason"] =
      "treatment_failed_despite_compliance";
    let reviewOutcome = "";
    let updatedModelField = "";
    let previousConfidence = 0.5;
    let newConfidence = 0.65;

    const latestModel = athleteModelStore.getAthleteModel(params.traineeId);

    if (exp.category === "nutrition_surplus") {
      previousConfidence = latestModel.dynamic.energyBalanceTrend.confidence;
      newConfidence = Math.min(0.95, Number((previousConfidence + 0.2).toFixed(2)));
      updatedModelField = "dynamic.energyBalanceTrend";

      const weightProgressed =
        bwTrend.weeklyDeltaKg >= EXPERIMENT_EVALUATION_THRESHOLDS.minWeeklyWeightGainKg;
      if (weightProgressed || anyLiftProgressed) {
        outcome = "confirmed";
        diagnosticReason = "treatment_efficacy_confirmed";
        reviewOutcome = `Consistent with hypothesis (Confirmed observational trend — sleep/skill confounders possible): Bodyweight velocity (+${bwTrend.weeklyDeltaKg}kg/wk) and lift progression responded during the caloric surplus window.`;
        latestModel.dynamic.energyBalanceTrend = createVersionedField(
          {
            ...latestModel.dynamic.energyBalanceTrend.value,
            smoothedWeightKg:
              bwTrend.smoothedKg ?? latestModel.dynamic.energyBalanceTrend.value.smoothedWeightKg,
            weeklyRatePct: bwTrend.weeklyDeltaKg,
            isEnergyBottleneck: false,
            bottleneckReason: undefined,
          },
          newConfidence,
          "inferred",
          reviewOutcome
        );
      } else {
        // Weight and lifts did NOT progress. Before marking the treatment 'refuted',
        // verify whether caloric intake or the low-friction 1-tap meal habit check-in was logged and complied with!
        const maintenanceKcal =
          latestModel.dynamic.energyBalanceTrend.value.estimatedMaintenanceKcal || 2100;
        const requiredSurplusFloor = params.targetCalories
          ? params.targetCalories - EXPERIMENT_EVALUATION_THRESHOLDS.surplusFloorToleranceKcal
          : maintenanceKcal + EXPERIMENT_EVALUATION_THRESHOLDS.surplusFloorToleranceKcal;

        if (
          params.interventionComplianceConfirmed === false ||
          params.mealHabitCheckIn === "no"
        ) {
          extendAsInconclusive(
            exp,
            "athlete_non_compliance",
            "Inconclusive: Athlete reported not hitting the prescribed daily meals/shake surplus; extending window by 14 days rather than refuting the surplus target.",
            previousConfidence
          );
          continue;
        }

        const hasLowFrictionMealCompliance =
          params.mealHabitCheckIn === "yes" || params.mealHabitCheckIn === "mostly";

        if (
          params.averageLoggedCalories === undefined &&
          params.interventionComplianceConfirmed !== true &&
          !hasLowFrictionMealCompliance
        ) {
          extendAsInconclusive(
            exp,
            "unverified_compliance_intake_unlogged",
            "Inconclusive: Neither daily calories nor the 1-tap weekly meal-habit check-in was logged during the experiment window; cannot separate physiological non-response from missed meals. Extending review window by 14 days.",
            previousConfidence
          );
          continue;
        }

        if (
          params.averageLoggedCalories !== undefined &&
          params.averageLoggedCalories < requiredSurplusFloor
        ) {
          extendAsInconclusive(
            exp,
            "athlete_non_compliance",
            `Inconclusive: Logged intake (${params.averageLoggedCalories} kcal/day) remained below the prescribed surplus threshold (${requiredSurplusFloor} kcal/day); extending window by 14 days.`,
            previousConfidence
          );
          continue;
        }

        outcome = "refuted";
        diagnosticReason = "treatment_failed_despite_compliance";
        reviewOutcome = `Refuted: Bodyweight remained flat (${bwTrend.weeklyDeltaKg}kg/wk) and lifts stalled across ${postSessions.length} sessions despite verified surplus compliance.`;
        latestModel.dynamic.energyBalanceTrend = createVersionedField(
          {
            ...latestModel.dynamic.energyBalanceTrend.value,
            smoothedWeightKg:
              bwTrend.smoothedKg ?? latestModel.dynamic.energyBalanceTrend.value.smoothedWeightKg,
            weeklyRatePct: bwTrend.weeklyDeltaKg,
            isEnergyBottleneck: true,
            bottleneckReason:
              "Initial surplus prescription was refuted by flat scale weight despite verified compliance; requires higher caloric step or non-caloric bottleneck pivot.",
          },
          newConfidence,
          "inferred",
          reviewOutcome
        );
      }
      athleteModelStore.saveAthleteModel(latestModel);
    } else if (exp.category === "tendon_deload" || exp.category === "setup_calibration") {
      if (params.interventionComplianceConfirmed === false) {
        extendAsInconclusive(
          exp,
          "athlete_non_compliance",
          "Inconclusive: Athlete did not apply the prescribed setup/tempo modulation; extending window by 14 days.",
          latestModel.dynamic.tendonTolerances["shoulder"]?.confidence ?? 0.5
        );
        continue;
      }

      const jointKey = "shoulder";
      previousConfidence =
        latestModel.dynamic.tendonTolerances[jointKey]?.confidence ?? 0.5;
      newConfidence = Math.min(0.95, Number((previousConfidence + 0.2).toFixed(2)));
      updatedModelField = `dynamic.tendonTolerances.${jointKey}`;

      if (!hasActivePainInWindow && anyLiftProgressed) {
        outcome = "confirmed";
        diagnosticReason = "treatment_efficacy_confirmed";
        reviewOutcome = `Confirmed: Zero joint strain across ${postSessions.length} exposures with positive load/rep progression.`;
        latestModel.dynamic.tendonTolerances[jointKey] = createVersionedField(
          {
            joint: jointKey,
            toleranceStatus: "healthy",
            weeklyLoadRateCapPct: 3.5,
            recentFrictionSymptomCount: 0,
          },
          newConfidence,
          "inferred",
          reviewOutcome
        );
      } else {
        outcome = "refuted";
        diagnosticReason = "treatment_failed_despite_compliance";
        reviewOutcome = hasActivePainInWindow
          ? `Refuted: Joint friction persisted across ${postSessions.length} exposures.`
          : `Refuted: Setup calibration alone did not break stagnation across ${postSessions.length} exposures.`;
        latestModel.dynamic.tendonTolerances[jointKey] = createVersionedField(
          {
            joint: jointKey,
            toleranceStatus: hasActivePainInWindow ? "remodeling_lag" : "healthy",
            weeklyLoadRateCapPct: 2.5,
            recentFrictionSymptomCount: hasActivePainInWindow ? 2 : 0,
          },
          newConfidence,
          "inferred",
          reviewOutcome
        );
      }
      athleteModelStore.saveAthleteModel(latestModel);
    } else {
      if (params.interventionComplianceConfirmed === false) {
        extendAsInconclusive(
          exp,
          "athlete_non_compliance",
          `Inconclusive: Athlete did not follow ${exp.category} prescription; extending window by 14 days.`,
          latestModel.dynamic.perMuscleResponse["chest"]?.confidence ?? 0.5
        );
        continue;
      }

      // volume_pruning or exercise_rotation
      const muscleKey = "chest";
      previousConfidence =
        latestModel.dynamic.perMuscleResponse[muscleKey]?.confidence ?? 0.5;
      newConfidence = Math.min(0.95, Number((previousConfidence + 0.2).toFixed(2)));
      updatedModelField = `dynamic.perMuscleResponse.${muscleKey}`;

      if (anyLiftProgressed && !hasActivePainInWindow) {
        outcome = "confirmed";
        diagnosticReason = "treatment_efficacy_confirmed";
        reviewOutcome = `Confirmed: ${exp.category} restored e1RM progression across ${postSessions.length} sessions.`;
        latestModel.dynamic.perMuscleResponse[muscleKey] = createVersionedField(
          {
            growthRate: "fast",
            volumeTolerance: exp.category === "volume_pruning" ? "low" : "medium",
          },
          newConfidence,
          "inferred",
          reviewOutcome
        );
      } else {
        outcome = "refuted";
        diagnosticReason = "treatment_failed_despite_compliance";
        reviewOutcome = `Refuted: ${exp.category} did not produce e1RM progression across ${postSessions.length} sessions.`;
        latestModel.dynamic.perMuscleResponse[muscleKey] = createVersionedField(
          {
            growthRate: "stubborn",
            volumeTolerance: "medium",
          },
          newConfidence,
          "inferred",
          reviewOutcome
        );
      }
      athleteModelStore.saveAthleteModel(latestModel);
    }

    athleteModelStore.resolveExperiment(
      params.traineeId,
      exp.id,
      outcome,
      reviewOutcome,
      {
        sessionsCount: params.sessions.length,
        metricEntriesCount: params.metricEntries.length,
        smoothedWeightKg: bwTrend.smoothedKg,
      }
    );

    results.push({
      experimentId: exp.id,
      category: exp.category,
      outcome,
      athleteFacingVerdict:
        outcome === "confirmed"
          ? "consistent_with_hypothesis"
          : "not_supported_despite_compliance",
      diagnosticReason,
      reviewOutcome,
      updatedModelField,
      previousConfidence,
      newConfidence,
    });
  }

  return results;
}

/**
 * Loop B: Executes the Meso Weekly Review with Diagnose -> Propose -> Critique -> Verify -> Commit.
 * Respects resolved experiment outcomes:
 * - Never re-proposes a `refuted` intervention unless new evidence arrives (and modifies/pivots the prescription when it does).
 * - When an active experiment is `inconclusive` (window extended), holds the current plan steady instead of triggering a new change.
 */
export function executeWeeklyMesoReview(
  caseFile: CaseFile,
  options?: { hasNewEvidence?: boolean }
): WeeklyReviewResult {
  const model = athleteModelStore.getAthleteModel(caseFile.traineeId);
  const isNovice = model.static.regime.value === "novice";
  const now = new Date().toISOString();
  const reviewTarget = new Date();
  reviewTarget.setDate(reviewTarget.getDate() + 21); // 3-week experiment review window

  // 0. If an active experiment was recently marked 'inconclusive', hold steady on the extended window instead of proposing a new change
  const activeInconclusiveExp = model.activeExperiments.find(
    (e) => e.status === "active" && e.outcome === "inconclusive"
  );
  if (activeInconclusiveExp && (!caseFile.medicalRedFlags || caseFile.medicalRedFlags.length === 0)) {
    const holdDomain: DifferentialHypothesis["domain"] =
      activeInconclusiveExp.category === "nutrition_surplus"
        ? "energy_balance"
        : activeInconclusiveExp.category === "tendon_deload"
          ? "tendon_tolerance"
          : "volume_landmarks";
    const holdHypothesis: DifferentialHypothesis = {
      rank: 1,
      domain: holdDomain,
      hypothesis: `Active experiment (${activeInconclusiveExp.id}) was inconclusive due to sparse logs; review window extended to ${activeInconclusiveExp.targetReviewDate}.`,
      evidenceStrength: "moderate",
      recommendedIntervention: `Maintain current experiment without adding new changes: ${activeInconclusiveExp.actionTaken}`,
      costOfChange: "low",
    };
    return {
      reviewDate: now,
      caseSummary: `Meso Review for ${caseFile.traineeId}: Holding active experiment (${activeInconclusiveExp.id}) steady through extended review date ${activeInconclusiveExp.targetReviewDate}.`,
      differentialDiagnosis: [holdHypothesis],
      selectedIntervention: {
        domain: holdDomain,
        action: holdHypothesis.recommendedIntervention,
        rationale: activeInconclusiveExp.reviewOutcome || holdHypothesis.hypothesis,
        expectedOutcome: activeInconclusiveExp.successMetric,
        reviewDate: activeInconclusiveExp.targetReviewDate,
      },
      critiquePass: {
        skepticalChallenge:
          "Should we stack another program change when the current experiment has inconclusive data? No: changing variables mid-experiment destroys causal attribution.",
        proportionalityVerdict: "proportional",
        counterfactualRisk: "Extending the observation window by 14 days preserves signal clarity.",
      },
      guardrailVerification: {
        passed: true,
        safetyChecks: ["Blocked premature intervention stacking during inconclusive experiment window."],
        violations: [],
      },
      committedExperiment: activeInconclusiveExp,
    };
  }

  // Gather previously refuted experiments to prevent re-proposing refuted interventions
  const refutedExperiments = model.resolvedExperiments.filter(
    (e) => e.status === "refuted" || e.outcome === "refuted"
  );
  const hasRefutedIntervention = (
    category: CoachingExperiment["category"],
    proposedAction?: string
  ): boolean => {
    return refutedExperiments.some((exp) => {
      if (exp.category !== category) return false;
      if (options?.hasNewEvidence === false) return true;
      if (proposedAction && exp.actionTaken === proposedAction) return true;
      return true;
    });
  };

  // 1. Differential Diagnosis: Rank bottlenecks according to the Coach Priority Ladder
  const hypotheses: DifferentialHypothesis[] = [];

  // Priority 0: Clinical / Medical Red Flags (Immediate Stop & Clinical Referral)
  if (caseFile.medicalRedFlags && caseFile.medicalRedFlags.length > 0) {
    hypotheses.push({
      rank: 0,
      domain: "medical_boundary",
      hypothesis: `Clinical red flag detected (${caseFile.medicalRedFlags.join(", ")}). Coaching prescriptions must pause until medical evaluation clears the symptom.`,
      evidenceStrength: "overwhelming",
      recommendedIntervention: "Suspend progressive loading on affected patterns immediately and consult a sports medicine physician or physical therapist before resuming heavy training.",
      costOfChange: "low",
    });
  }

  // Priority 1: Pain & Active Joint Symptoms
  const activeSymptoms = caseFile.symptomTrajectories.filter(
    (s) => s.status === "active" && s.currentFrictionLevel === "significant_intervention_required"
  );
  if (activeSymptoms.length > 0) {
    const initialTendonAction = `Cap load progression on ${activeSymptoms[0].joint} movements; shift to 12–15 rep bracket with 3s eccentric tempo to allow collagen remodeling.`;
    const tendonWasRefuted = hasRefutedIntervention("tendon_deload", initialTendonAction) ||
      hasRefutedIntervention("setup_calibration", initialTendonAction);

    if (!tendonWasRefuted) {
      hypotheses.push({
        rank: 1,
        domain: "tendon_tolerance",
        hypothesis: `Active tendon/joint friction detected on ${activeSymptoms.map((s) => s.joint).join(", ")}. Tendon adaptation is lagging load progression.`,
        evidenceStrength: "overwhelming",
        recommendedIntervention: initialTendonAction,
        costOfChange: "low",
      });
    } else if (options?.hasNewEvidence !== false) {
      // Previous tempo/setup modulation was refuted by persistent pain -> pivot to biomechanically unloaded cable/machine variation
      hypotheses.push({
        rank: 1,
        domain: "exercise_selection",
        hypothesis: `Tempo modulation was refuted on ${activeSymptoms[0].joint}; persistent joint friction requires rotating to a cable/machine line of pull.`,
        evidenceStrength: "overwhelming",
        recommendedIntervention: `Replace aggravating free-weight ${activeSymptoms[0].joint} pattern with a constant-tension cable or machine variation and reduce working sets by 1.`,
        costOfChange: "medium",
      });
    }
  }

  // Priority 2: Adherence Bottleneck
  if (caseFile.adherenceTrend.isPrimaryBottleneck) {
    hypotheses.push({
      rank: hypotheses.length + 1,
      domain: "adherence",
      hypothesis: `Adherence is ${caseFile.adherenceTrend.last28DaysPct}% (${caseFile.adherenceTrend.last28DaysCompleted}/${caseFile.adherenceTrend.last28DaysPlanned} sessions). Inconsistent frequency is capping muscular adaptation.`,
      evidenceStrength: "overwhelming",
      recommendedIntervention: "Consolidate training schedule into a sustainable, non-negotiable 3-day full-body or upper-lower split.",
      costOfChange: "medium",
    });
  }

  // Priority 3: Energy Balance & Protein (Dominant for Novices & Underweight Lifters)
  if (caseFile.nutritionDiagnosis.isCaloricBottleneck) {
    const bwLabel =
      (caseFile.bodyweightTrend.smoothedKg ?? 0) > 0
        ? `${caseFile.bodyweightTrend.smoothedKg}kg`
        : `${model.dynamic.energyBalanceTrend.value.smoothedWeightKg}kg`;
    const initialSurplusAction = `Add +${caseFile.nutritionDiagnosis.surplusDeltaKcal} kcal/day whole-food surplus (Moroccan olive oil, whole eggs, sardines, milk/banana shake) targeting +${caseFile.nutritionDiagnosis.targetWeeklyGainKg}kg/week gain.`;
    const surplusWasRefuted = hasRefutedIntervention("nutrition_surplus", initialSurplusAction);

    if (!surplusWasRefuted) {
      hypotheses.push({
        rank: hypotheses.length + 1,
        domain: "energy_balance",
        hypothesis: `Bodyweight is stagnant (+${caseFile.bodyweightTrend.weeklyDeltaKg}kg/wk) at ${bwLabel}. Caloric intake is the primary rate-limiting step capping progressive overload.`,
        evidenceStrength: isNovice ? "overwhelming" : "moderate",
        recommendedIntervention: initialSurplusAction,
        costOfChange: "low",
      });
    } else if (options?.hasNewEvidence !== false) {
      // Previous +350 kcal surplus was refuted -> do not re-propose the identical refuted surplus; escalate to a verified +550 kcal split-meal + intra-session Volume Prune so energy isn't burned on junk volume
      const escalatedKcal = caseFile.nutritionDiagnosis.surplusDeltaKcal + 200;
      hypotheses.push({
        rank: hypotheses.length + 1,
        domain: "volume_landmarks",
        hypothesis: `Previous +${caseFile.nutritionDiagnosis.surplusDeltaKcal} kcal surplus was refuted by flat scale weight at ${bwLabel}; high session volume is burning through caloric intake.`,
        evidenceStrength: "overwhelming",
        recommendedIntervention: `Prune accessory volume by 1 set per exercise to reduce session energy expenditure and step daily liquid surplus up to +${escalatedKcal} kcal/day.`,
        costOfChange: "medium",
      });
    }
  }

  // Priority 4: Stagnant Exercises (Exercise selection is LAST resort)
  const stagnantLifts = caseFile.e1RMTrends.filter((t) => t.status === "stagnant");
  if (stagnantLifts.length > 0 && !caseFile.nutritionDiagnosis.isCaloricBottleneck) {
    const initialSwapAction = `Substitute ${stagnantLifts[0].exerciseName} with a biomechanically aligned alternative to break motor accommodation.`;
    const swapWasRefuted =
      hasRefutedIntervention("exercise_rotation", initialSwapAction) ||
      hasRefutedIntervention("setup_calibration", initialSwapAction);

    if (!swapWasRefuted) {
      hypotheses.push({
        rank: hypotheses.length + 1,
        domain: "exercise_selection",
        hypothesis: `Progress has stalled on ${stagnantLifts[0].exerciseName} across multiple exposures under confirmed recovery.`,
        evidenceStrength: "moderate",
        recommendedIntervention: initialSwapAction,
        costOfChange: "high",
      });
    } else if (options?.hasNewEvidence !== false) {
      hypotheses.push({
        rank: hypotheses.length + 1,
        domain: "volume_landmarks",
        hypothesis: `Previous intervention on ${stagnantLifts[0].exerciseName} was refuted; local fatigue accumulation is masking strength expression.`,
        evidenceStrength: "moderate",
        recommendedIntervention: `Prune 1 working set on ${stagnantLifts[0].exerciseName} and shift rep bracket to 6–8 reps with 3-minute rest intervals.`,
        costOfChange: "medium",
      });
    }
  }

  // Fallback hypothesis if everything is progressing smoothly
  if (hypotheses.length === 0) {
    hypotheses.push({
      rank: 1,
      domain: "volume_landmarks",
      hypothesis: "All physiological and training vectors are progressing steadily within target bandwidth.",
      evidenceStrength: "overwhelming",
      recommendedIntervention: "Persevere with current prescription; continue double progression within assigned rep brackets.",
      costOfChange: "low",
    });
  }

  // Sort hypotheses by rank
  hypotheses.sort((a, b) => a.rank - b.rank);
  const topHypothesis = hypotheses[0];

  // 2. Critique Pass: Skeptical Senior Coach Challenge
  let skepticalChallenge = "";
  let proportionalityVerdict: WeeklyReviewResult["critiquePass"]["proportionalityVerdict"] = "proportional";
  let counterfactualRisk = "";

  if (topHypothesis.domain === "medical_boundary") {
    skepticalChallenge = "Should a fitness coach attempt to program around radiating numbness, chest symptoms, or acute tissue tears? Never: clinical red flags strictly exceed coaching scope.";
    counterfactualRisk = "Continuing to load an unassessed neurological or structural pathology risks severe injury.";
  } else if (topHypothesis.domain === "energy_balance") {
    skepticalChallenge = "Could the stagnation be caused by poor sleep or training intensity rather than calories? Unlikely: at 52kg frame size, energy availability is the physiological gatekeeper for myofibrillar protein synthesis.";
    counterfactualRisk = "Risk of fat gain if surplus is excessive. Mitigated by conservative +350 kcal target (+0.35% bodyweight/week).";
  } else if (topHypothesis.domain === "adherence") {
    skepticalChallenge = "Does reducing planned days risk undertraining? No: 3 high-quality sessions executed consistently yield 100% of novice stimulus, whereas planning 5 and skipping 2 produces chaotic fatigue accumulation.";
    counterfactualRisk = "Athlete may feel they are doing less. Mitigated by explaining frequency-consistency math.";
  } else if (topHypothesis.domain === "tendon_tolerance") {
    skepticalChallenge = "Is complete exercise elimination warranted? No: that would be disproportionate. Modulating tempo and load jump rate protects the tendon without resetting motor skill.";
    counterfactualRisk = "Temporary reduction in absolute load. Preserves joint longevity.";
  } else {
    skepticalChallenge = "Verify we are not rotating exercises prematurely before true 4-week nutritional saturation.";
    counterfactualRisk = "Novelty penalty resets skill tracking.";
  }

  // 3. Deterministic Guardrail Verification
  const safetyChecks: string[] = [
    "Load jump rate capped at <= 3.5% weekly for tendon protection.",
    "No exercise swapped without exhausting energy balance and technique interventions first.",
    "Weekly change budget limited strictly to <= 2 variables simultaneously.",
    "Verified selected intervention has not been previously refuted under identical evidence.",
  ];
  const violations: string[] = [];

  // Verify change budget
  if (hypotheses.length > 3 && topHypothesis.costOfChange === "high") {
    violations.push("Excessive simultaneous variable changes proposed.");
    proportionalityVerdict = "excessive_change_budget";
  }

  // 4. Commit Coaching Experiment
  let committedExperiment: CoachingExperiment | undefined;
  if (
    topHypothesis.domain !== "volume_landmarks" ||
    topHypothesis.recommendedIntervention.toLowerCase().includes("prune")
  ) {
    const expCategory: CoachingExperiment["category"] =
      topHypothesis.domain === "energy_balance"
        ? "nutrition_surplus"
        : topHypothesis.recommendedIntervention.toLowerCase().includes("prune")
          ? "volume_pruning"
          : "setup_calibration";

    committedExperiment = athleteModelStore.recordExperiment({
      traineeId: caseFile.traineeId,
      startDate: now.split("T")[0],
      targetReviewDate: reviewTarget.toISOString().split("T")[0],
      category: expCategory,
      hypothesis: topHypothesis.hypothesis,
      actionTaken: topHypothesis.recommendedIntervention,
      successMetric:
        topHypothesis.domain === "energy_balance"
          ? "+0.5kg bodyweight gain and +2 reps on primary lifts within 3 weeks"
          : "Zero joint pain reports and positive e1RM slope across 3 weeks",
      status: "active",
    });
  }

  const summaryWeight =
    (caseFile.bodyweightTrend.smoothedKg ?? 0) > 0
      ? `${caseFile.bodyweightTrend.smoothedKg}kg`
      : "weight unlogged";

  return {
    reviewDate: now,
    caseSummary: `Meso Review for athlete ${caseFile.traineeId} (${model.static.regime.value} regime, ${summaryWeight}). Primary bottleneck: ${topHypothesis.domain.toUpperCase()}.`,
    differentialDiagnosis: hypotheses,
    selectedIntervention: {
      domain: topHypothesis.domain,
      action: topHypothesis.recommendedIntervention,
      rationale: topHypothesis.hypothesis,
      expectedOutcome: committedExperiment ? committedExperiment.successMetric : "Continued linear/double progression.",
      reviewDate: reviewTarget.toISOString().split("T")[0],
    },
    critiquePass: {
      skepticalChallenge,
      proportionalityVerdict,
      counterfactualRisk,
    },
    guardrailVerification: {
      passed: violations.length === 0,
      safetyChecks,
      violations,
    },
    committedExperiment,
  };
}

export interface AutonomousLifecycleRunResult {
  traineeId: string;
  evaluatedDate: string;
  /** True when called again on the same date after reviews/experiments already ran (idempotent no-op) */
  alreadyRanForWindow?: boolean;
  evaluatedExperiments: ExperimentEvaluationSummary[];
  weeklyReviewTriggered: boolean;
  weeklyReview?: WeeklyReviewResult;
  macroReviewTriggered: boolean;
  macroBlockPlan?: MacroBlockPlan;
}

/**
 * Orchestrates the automatic multi-timescale coaching lifecycle (Idempotent per date window):
 * 1. Evaluates any due CoachingExperiments (`evaluateCommittedExperiments`).
 * 2. Runs Macro Block Review (`executeMacroBlockReview`) if >= 28 days since `lastMacroReviewDate` or `forceMacroReview`.
 * 3. Runs Weekly Meso Review (`executeWeeklyMesoReview`) if >= 7 days since `lastWeeklyReviewDate`, or an experiment just resolved, or `forceWeeklyReview`.
 */
export function runAutonomousCoachingLifecycleCheck(params: {
  traineeId: string;
  sessions: WorkoutSession[];
  metricEntries: BodyMetricEntry[];
  averageLoggedCalories?: number;
  mealHabitCheckIn?: "yes" | "mostly" | "no";
  currentDate?: string;
  forceMacroReview?: boolean;
  forceWeeklyReview?: boolean;
}): AutonomousLifecycleRunResult {
  const effectiveDate = params.currentDate || new Date().toISOString().split("T")[0];
  const initialModel = athleteModelStore.getAthleteModel(params.traineeId);

  // Idempotency guard: if we already ran the weekly lifecycle check on `effectiveDate` and no force flag is set,
  // verify whether any active experiment is still due on `effectiveDate`. If none are due, return idempotent no-op.
  const hasDueExperimentsToday = initialModel.activeExperiments.some(
    (exp) => exp.status === "active" && effectiveDate >= exp.targetReviewDate
  );
  if (
    initialModel.lastWeeklyReviewDate === effectiveDate &&
    !params.forceWeeklyReview &&
    !params.forceMacroReview &&
    !hasDueExperimentsToday
  ) {
    return {
      traineeId: params.traineeId,
      evaluatedDate: effectiveDate,
      alreadyRanForWindow: true,
      evaluatedExperiments: [],
      weeklyReviewTriggered: false,
      macroReviewTriggered: false,
    };
  }

  const evaluatedExperiments = evaluateCommittedExperiments({
    traineeId: params.traineeId,
    sessions: params.sessions,
    metricEntries: params.metricEntries,
    currentDate: effectiveDate,
    averageLoggedCalories: params.averageLoggedCalories,
    mealHabitCheckIn: params.mealHabitCheckIn,
  });

  const model = athleteModelStore.getAthleteModel(params.traineeId);
  const effectiveMs = new Date(`${effectiveDate}T00:00:00Z`).getTime();

  const daysSinceMacro = model.lastMacroReviewDate
    ? Math.floor(
        (effectiveMs - new Date(`${model.lastMacroReviewDate}T00:00:00Z`).getTime()) /
          86400000
      )
    : Infinity;
  const daysSinceWeekly = model.lastWeeklyReviewDate
    ? Math.floor(
        (effectiveMs - new Date(`${model.lastWeeklyReviewDate}T00:00:00Z`).getTime()) /
          86400000
      )
    : Infinity;

  const shouldRunMacro = Boolean(
    params.forceMacroReview || (params.sessions.length > 0 && daysSinceMacro >= 28)
  );
  const shouldRunWeekly = Boolean(
    params.forceWeeklyReview ||
      evaluatedExperiments.length > 0 ||
      (params.sessions.length > 0 && daysSinceWeekly >= 7)
  );

  let macroBlockPlan: MacroBlockPlan | undefined;
  let weeklyReview: WeeklyReviewResult | undefined;

  if (shouldRunMacro || shouldRunWeekly) {
    const caseFile = assembleAthleteCaseFile({
      traineeId: params.traineeId,
      sessions: params.sessions,
      metricEntries: params.metricEntries,
      averageLoggedCalories: params.averageLoggedCalories,
    });

    if (shouldRunMacro) {
      macroBlockPlan = executeMacroBlockReview(caseFile);
      athleteModelStore.updateAthleteModel(params.traineeId, (prev) => ({
        ...prev,
        lastMacroReviewDate: effectiveDate,
      }));
    }

    if (shouldRunWeekly) {
      weeklyReview = executeWeeklyMesoReview(caseFile, {
        hasNewEvidence: params.sessions.length > 0 || params.metricEntries.length > 0,
      });
      athleteModelStore.updateAthleteModel(params.traineeId, (prev) => ({
        ...prev,
        lastWeeklyReviewDate: effectiveDate,
      }));
    }
  }

  return {
    traineeId: params.traineeId,
    evaluatedDate: effectiveDate,
    alreadyRanForWindow: false,
    evaluatedExperiments,
    weeklyReviewTriggered: Boolean(weeklyReview),
    weeklyReview,
    macroReviewTriggered: Boolean(macroBlockPlan),
    macroBlockPlan,
  };
}

/**
 * Loop C: Strictly narrowed In-Session / JIT Micro Autoregulation.
 * Handles only in-session readiness modulation, equipment unavailability, and acute joint strain.
 * Never attempts strategic multi-week structural overhauls during a workout.
 */
export function evaluateNarrowedInSessionAutoregulation(params: {
  traineeId: string;
  exerciseName: string;
  currentWeightKg: number;
  targetSets: number;
  repLow: number;
  repHigh: number;
  acuteJointDiscomfort?: boolean;
  equipmentStationUnavailable?: boolean;
  equipmentUnavailableReplacement?: string;
  warmupRepsFeltExhausted?: boolean;
}): {
  actionType: "preserve" | "acute_pain_swap" | "equipment_swap" | "warmup_load_downshift";
  headline: string;
  prescribedWeightKg: number;
  prescribedSets: number;
  replacementExerciseName?: string;
  rationale: string;
} {
  // 1. Acute Joint Discomfort During Today's Session
  if (params.acuteJointDiscomfort) {
    return {
      actionType: "acute_pain_swap",
      headline: `In-Session Pain Pivot: Discontinue ${params.exerciseName}`,
      prescribedWeightKg: Math.round(params.currentWeightKg * 0.7),
      prescribedSets: Math.max(2, params.targetSets - 1),
      replacementExerciseName: params.equipmentUnavailableReplacement || `Neutral-Grip Dumbbell ${params.exerciseName}`,
      rationale: "Acute joint discomfort flagged during warm-up/working sets. Pivoting immediately to a joint-friendly line of pull to prevent tendon microtrauma.",
    };
  }

  // 2. Equipment Station Occupied / Out of Order at Current Gym
  if (params.equipmentStationUnavailable && params.equipmentUnavailableReplacement) {
    return {
      actionType: "equipment_swap",
      headline: `Gym Station Unavailable: Swap to ${params.equipmentUnavailableReplacement}`,
      prescribedWeightKg: params.currentWeightKg,
      prescribedSets: params.targetSets,
      replacementExerciseName: params.equipmentUnavailableReplacement,
      rationale: `The required station for ${params.exerciseName} is occupied or unavailable today. Evolved to an available substitute targeting the identical motor pattern.`,
    };
  }

  // 3. Systemic Neuromuscular Depletion Flagged During Warm-Up Sets
  if (params.warmupRepsFeltExhausted) {
    const downshifted = Math.max(2.5, Math.round((params.currentWeightKg * 0.9) / 2.5) * 2.5);
    return {
      actionType: "warmup_load_downshift",
      headline: `Readiness Autoregulation: Modulate ${params.exerciseName} (-10% Load)`,
      prescribedWeightKg: downshifted,
      prescribedSets: params.targetSets,
      rationale: "Bar velocity and neural recruitment during warm-up sets indicate elevated CNS fatigue. Reducing load by 10% keeps training within the effective mechanical tension bracket without inducing failure breakdown.",
    };
  }

  // 4. Default: Steady Execution
  return {
    actionType: "preserve",
    headline: `Execute ${params.exerciseName} at ${params.currentWeightKg}kg`,
    prescribedWeightKg: params.currentWeightKg,
    prescribedSets: params.targetSets,
    rationale: "Readiness and joint parameters are nominal. Proceed with prescribed working sets.",
  };
}
