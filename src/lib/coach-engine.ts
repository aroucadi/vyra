import { appStore } from "./store";
import { resolveProgramDay } from "./utils";
import { diagnoseNutritionAndEnergyBalance } from "./ai/nutrition-coach";
import { assembleAthleteCaseFile, executeWeeklyMesoReview } from "./ai/coaching-cycle";
import { athleteModelStore } from "./ai/athlete-model";
import { calculateSmoothedBodyweightTrend } from "./training-math/trend-analytics";
import { findBiomechanicalSubstitutes } from "./training-math/substitution-copilot";
import { inferPrimaryMuscleFromExerciseName } from "./ai/sensory-memory";
import { loadSafeExerciseCatalogue } from "./ai/catalogue-bridge";

export type CoachCardActionType = "swap" | "condense" | "autoregulate" | "nutrition" | "load_explanation" | "none";

export interface CoachSmartActionCardData {
  type: CoachCardActionType;
  eyebrow: string;
  headline: string;
  subtext: string;
  ctaLabel?: string;
  targetDayLabel?: string;
  details: {
    label: string;
    value: string;
  }[];
  actionPayload: {
    actionType: CoachCardActionType;
    currentExercise?: string;
    newExercise?: string;
    targetMinutes?: number;
    loadFactor?: number;
    rirDelta?: number;
    dayOfWeek?: number;
  };
  // Optional interactive calculator or formula metadata for Intelligent UI
  interactiveData?: {
    formula: string;
    baselineWeightKg: number;
    currentReps: number;
    targetReps: number;
    nextIncrementKg: number;
    conditionSummary: string;
  };
}

export interface CoachResponse {
  id: string;
  text: string;
  card?: CoachSmartActionCardData;
}

/**
 * Resolves coach intent with deterministic physiological rules,
 * active program awareness, and live Apple Watch biometric telemetry.
 */
export function resolveCoachQuery(traineeId: string, query: string): CoachResponse {
  const normalized = query.toLowerCase().trim();
  const program = appStore.getActiveProgramForTrainee(traineeId);
  const biometrics = appStore.getLatestWearableBiometrics(traineeId);

  const resolved = program
    ? resolveProgramDay(program.startDate)
    : { weekIndex: 1, dayOfWeek: 0, started: true };

  const currentWeek = program?.weeks
    ? program.weeks[Math.min(Math.max(0, resolved.weekIndex - 1), program.weeks.length - 1)]
    : undefined;

  const targetDay = currentWeek?.days.find((d) => d.dayOfWeek === resolved.dayOfWeek && !d.isRestDay) ||
    currentWeek?.days.find((d) => !d.isRestDay) ||
    { label: "Today's Session", dayOfWeek: 0, blocks: [] };

  const targetDayExercises = ("blocks" in targetDay && Array.isArray(targetDay.blocks))
    ? targetDay.blocks.flatMap((b) => b.exercises)
    : [];

  const isAlaaAccount = traineeId === "trainee_alaa";
  const responseId = `msg_coach_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. EXERCISE SWAP INTENT
  if (
    normalized.includes("swap") ||
    normalized.includes("alternative") ||
    normalized.includes("substitute") ||
    normalized.includes("replace") ||
    normalized.includes("shoulder") ||
    normalized.includes("impingement") ||
    normalized.includes("pain")
  ) {
    const isShoulderPain = normalized.includes("shoulder") || normalized.includes("pain") || normalized.includes("impingement");
    const matchedPress = targetDayExercises.find((e) => /press|bench|fly|dip/i.test(e.exerciseName));
    const currentEx = isAlaaAccount
      ? "Incline Machine Chest Press"
      : matchedPress?.exerciseName || targetDayExercises[0]?.exerciseName || "Incline Machine Chest Press";

    let replacementEx = "30° Incline Dumbbell Press";
    if (!isAlaaAccount && currentEx !== "Incline Machine Chest Press") {
      try {
        const catalogue = loadSafeExerciseCatalogue();
        const subs = findBiomechanicalSubstitutes(
          {
            name: currentEx,
            target:
              matchedPress?.targetMuscleGroups?.[0] ||
              inferPrimaryMuscleFromExerciseName(currentEx),
            equipment: matchedPress?.selectedEquipment || "barbell",
          },
          catalogue,
          { limit: 2 }
        );
        if (subs[0]?.exercise?.name) {
          replacementEx = subs[0].exercise.name;
        }
      } catch {
        // Fallback to clean default press variation
      }
    }
    const targetSetsLabel = matchedPress?.sets ?? 3;
    const targetWeightLabel = matchedPress?.targetWeightKg ? `${matchedPress.targetWeightKg} kg` : "Matched RIR";

    return {
      id: responseId,
      text: isShoulderPain
        ? `Shoulder impingement typically arises from rigid fixed-axis machines under high load. I've configured an alternative to ${replacementEx}, which allows natural scapular glide and free humeral rotation while matching upper-body recruitment.`
        : `I've analyzed biomechanically equivalent alternatives for ${currentEx}. ${replacementEx} matches the tension curve while allowing smoother joint mechanics.`,
      card: {
        type: "swap",
        eyebrow: `AUTOREGULATION · ${targetDay.label.toUpperCase()}`,
        headline: `${currentEx} ➔ ${replacementEx}`,
        subtext: "Preserves target muscle stimulus while reducing joint shear and fixed-axis restriction.",
        ctaLabel: `Apply Swap to ${targetDay.label}`,
        targetDayLabel: targetDay.label,
        details: [
          { label: "Target Load", value: isAlaaAccount ? "28 kg DBs" : targetWeightLabel },
          { label: "Prescription", value: `${targetSetsLabel} Sets · RIR 2` },
          { label: "Plane", value: "Converging Arc" },
        ],
        actionPayload: {
          actionType: "swap",
          currentExercise: currentEx,
          newExercise: replacementEx,
          dayOfWeek: targetDay.dayOfWeek,
        },
      },
    };
  }

  // 2. SHORT ON TIME / CONDENSED SESSION INTENT
  if (
    normalized.includes("short on time") ||
    normalized.includes("condense") ||
    normalized.includes("hurry") ||
    normalized.includes("quick") ||
    normalized.includes("busy") ||
    normalized.includes("30 min") ||
    normalized.includes("45 min") ||
    normalized.includes("time")
  ) {
    return {
      id: responseId,
      text: `When pressed for time, neuromuscular fatigue can be minimized by keeping top-end compound loading while stripping away tertiary accessories. I've designed a condensed 30-minute protocol preserving 85% of hypertrophy stimulus.`,
      card: {
        type: "condense",
        eyebrow: `TIME-CAP EFFICIENCY · ${targetDay.label.toUpperCase()}`,
        headline: "30-Minute Protocol · 8 Total Sets",
        subtext: "Caps compound movements at 2 top sets and removes secondary isolation work to eliminate gym dead-time.",
        ctaLabel: `Condense ${targetDay.label}`,
        targetDayLabel: targetDay.label,
        details: [
          { label: "Session Cap", value: "30 Minutes" },
          { label: "Total Sets", value: "8 Sets" },
          { label: "Stimulus Retention", value: "85%" },
        ],
        actionPayload: {
          actionType: "condense",
          targetMinutes: 30,
          dayOfWeek: targetDay.dayOfWeek,
        },
      },
    };
  }

  // 3. SLEEP / RECOVERY INTENT
  if (
    normalized.includes("sleep") ||
    normalized.includes("recovery") ||
    normalized.includes("tired") ||
    normalized.includes("fatigue") ||
    normalized.includes("sore") ||
    normalized.includes("readiness")
  ) {
    const sleep = biometrics ? biometrics.sleepHours : 6.0;
    const isManual = !biometrics || biometrics.source === "manual";
    const isFatigued = biometrics?.reducedRecovery || biometrics?.cnsFatigueDetected || sleep < 7.0;

    if (isFatigued) {
      const sourceCopy = isManual
        ? `You said ${sleep}h sleep.`
        : `Your wearable logged ${sleep}h sleep.`;

      return {
        id: responseId,
        text: `${sourceCopy} Heavy leg and back lifts are lighter today with an extra rep in reserve to keep good form.`,
        card: {
          type: "autoregulate",
          eyebrow: "RECOVERY ADJUSTMENT",
          headline: "Main Lifts -10% · +1 Rep in Reserve",
          subtext: `Compensates for ${sleep}h sleep. Heavy leg and back lifts are lighter today.`,
          ctaLabel: `Apply Adjustment to ${targetDay.label}`,
          targetDayLabel: targetDay.label,
          details: [
            { label: "Compound Lift Delta", value: "-10%" },
            { label: "Reserve Buffer", value: "+1 Rep" },
            { label: "Target Form", value: "Clean" },
          ],
          actionPayload: {
            actionType: "autoregulate",
            loadFactor: 0.9,
            rirDelta: 1,
            dayOfWeek: targetDay.dayOfWeek,
          },
        },
      };
    } else {
      const sourceCopy = isManual
        ? `You said ${sleep}h sleep.`
        : `Your wearable logged ${sleep}h sleep.`;

      return {
        id: responseId,
        text: `${sourceCopy} You are well rested. Planned weights and rep targets remain active.`,
      };
    }
  }

  // 4. WHY THIS WEIGHT / PROGRESSIVE OVERLOAD EXPLANATION INTENT
  if (
    normalized.includes("why") ||
    normalized.includes("weight") ||
    normalized.includes("load") ||
    normalized.includes("reps") ||
    normalized.includes("overload")
  ) {
    const asksForSquat = normalized.includes("squat");
    const primaryLift =
      isAlaaAccount || asksForSquat ? undefined : targetDayExercises[0];
    const pb = primaryLift
      ? appStore.getPersonalBestForExercise(traineeId, primaryLift.exerciseName)
      : appStore.getPersonalBestForExercise(traineeId, "Barbell Back Squat");
    const pbWeight = pb
      ? pb.weightKg
      : primaryLift?.targetWeightKg && primaryLift.targetWeightKg > 0
      ? primaryLift.targetWeightKg
      : isAlaaAccount
      ? 140
      : 0;

    if (pbWeight === 0 && !isAlaaAccount) {
      return {
        id: responseId,
        text: `You haven't logged calibrated working weights yet. Start your first session with an easy top set around RIR 2–3 — once saved, I'll apply strict Double Progression (+2.5 kg whenever you clear the upper rep ceiling across all working sets).`,
        card: {
          type: "load_explanation",
          eyebrow: "PROGRESSION RULES · CALIBRATION",
          headline: "Double Progression Ceiling Model",
          subtext: "Log your first calibrated working set to lock in personalized load targets.",
          ctaLabel: "Review in Exercise Library",
          targetDayLabel: targetDay.label,
          details: [
            { label: "Current Load", value: "Calibrating" },
            { label: "Rep Target", value: "8–10 Reps" },
            { label: "Next Step", value: "+2.5 kg (@ 10r)" },
          ],
          actionPayload: {
            actionType: "load_explanation",
            dayOfWeek: targetDay.dayOfWeek,
          },
          interactiveData: {
            formula: "Next Load = Current Load + 2.5kg (if Reps >= 10 on all working sets)",
            baselineWeightKg: 0,
            currentReps: 8,
            targetReps: 10,
            nextIncrementKg: 2.5,
            conditionSummary: "Complete your Day-1 calibration sets to establish your baseline weight.",
          },
        },
      };
    }

    const repLow = primaryLift?.repRangeLow ?? 8;
    const repHigh = primaryLift?.repRangeHigh ?? 10;

    return {
      id: responseId,
      text: `Your working load targets (${pbWeight} kg baseline) follow our strict Double Progression rule: you must hit the upper ceiling of your prescribed rep range (e.g. ${repHigh} clean reps @ 2 RIR) across all scheduled working sets before earning a +2.5 kg weight bump. This prevents ego-lifting and builds genuine tendon resilience.`,
      card: {
        type: "load_explanation",
        eyebrow: "PROGRESSION RULES · FORMULA & MATH",
        headline: "Double Progression Ceiling Model",
        subtext: "Weight remains locked until rep ceiling is achieved across 100% of working sets. Math runs deterministically in code.",
        ctaLabel: "Review in Exercise Library",
        targetDayLabel: targetDay.label,
        details: [
          { label: "Current Load", value: `${pbWeight} kg` },
          { label: "Rep Target", value: `${repLow}–${repHigh} Reps` },
          { label: "Next Step", value: `+2.5 kg (@ ${repHigh}r)` },
        ],
        actionPayload: {
          actionType: "load_explanation",
          dayOfWeek: targetDay.dayOfWeek,
        },
        interactiveData: {
          formula: `Next Load = Current Load + 2.5kg (if Reps >= ${repHigh} on all 3 sets)`,
          baselineWeightKg: pbWeight,
          currentReps: Math.max(repLow, repHigh - 1),
          targetReps: repHigh,
          nextIncrementKg: 2.5,
          conditionSummary: `1 more clean rep needed on final set to unlock ${(pbWeight + 2.5).toFixed(1)} kg next session.`,
        },
      },
    };
  }

  // 5. NUTRITION & ENERGY BALANCE INTENT
  if (
    normalized.includes("nutrition") ||
    normalized.includes("eat") ||
    normalized.includes("calorie") ||
    normalized.includes("surplus") ||
    normalized.includes("diet") ||
    normalized.includes("macro") ||
    normalized.includes("protein") ||
    normalized.includes("food") ||
    normalized.includes("meal") ||
    (normalized.includes("stall") && (normalized.includes("bench") || normalized.includes("press") || normalized.includes("lift") || normalized.includes("weight")))
  ) {
    const athlete = athleteModelStore.getAthleteModel(traineeId);
    const metrics = appStore.getMetrics(traineeId);
    const weightTrend = calculateSmoothedBodyweightTrend(metrics);
    const diag = diagnoseNutritionAndEnergyBalance(athlete, weightTrend);
    const weightKg =
      weightTrend.smoothedKg ||
      weightTrend.latestRawKg ||
      athlete.dynamic.energyBalanceTrend.value.smoothedWeightKg ||
      (isAlaaAccount ? 52.0 : 0);
    const weightProvenance = athlete.dynamic.energyBalanceTrend.source ?? "measured";
    const dietaryStaples = athlete.static.lifestyle.locationContext.value.dietaryStaples;
    const staplesCopy =
      dietaryStaples && dietaryStaples.length > 0
        ? dietaryStaples.slice(0, 4).join(", ")
        : isAlaaAccount
        ? "4–6 whole eggs daily, olive oil drizzled on lentils/harira, fresh sardines, and a whole-milk banana shake with almonds"
        : "4–6 whole eggs daily, extra-virgin olive oil over rice or legumes, fatty fish or poultry, and a calorie-dense milk/nut smoothie";

    if (diag.isCaloricBottleneck) {
      return {
        id: responseId,
        text: `Energy balance is currently your #1 bottleneck. Swapping exercises won't fix an empty fuel tank. Your bodyweight is currently ${weightKg > 0 ? `${weightKg.toFixed(1)} kg` : "uncalibrated"} (${weightProvenance}, smoothed trend ${weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}${weightTrend.weeklyDeltaKg.toFixed(2)} kg/week). To build muscle tissue and drive progressive overload, you need a deliberate surplus of +${diag.surplusDeltaKcal} kcal/day (${diag.prescribedDailyKcal} kcal total) with ${diag.prescribedDailyProteinGrams}g protein. Focus on accessible whole-food staples: ${staplesCopy}.`,
        card: {
          type: "nutrition",
          eyebrow: "NUTRITION & ENERGY BALANCE · SURPLUS PROTOCOL",
          headline: `Energy Bottleneck · +${diag.surplusDeltaKcal} kcal Surplus`,
          subtext: `Current intake matches maintenance (~${diag.currentEstimatedMaintenanceKcal} kcal)${weightKg > 0 ? ` for ${weightKg.toFixed(1)} kg` : ""}. Fuel is the primary limiter on your compound lifts.`,
          ctaLabel: "Commit Surplus Strategy",
          targetDayLabel: "Daily Target",
          details: [
            { label: "Target Calories", value: `${diag.prescribedDailyKcal} kcal` },
            { label: "Surplus", value: `+${diag.surplusDeltaKcal} kcal` },
            { label: "Protein Target", value: `${diag.prescribedDailyProteinGrams}g` },
          ],
          actionPayload: {
            actionType: "nutrition",
            dayOfWeek: targetDay.dayOfWeek,
          },
        },
      };
    } else {
      return {
        id: responseId,
        text: `Your current energy balance is supporting your training. Smoothed weight is ${weightKg > 0 ? `${weightKg.toFixed(1)} kg` : "calibrating"} (${weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}${weightTrend.weeklyDeltaKg.toFixed(2)} kg/week). Recommended target remains ${diag.prescribedDailyKcal} kcal with ${diag.prescribedDailyProteinGrams}g protein to maintain recovery capacity.`,
        card: {
          type: "nutrition",
          eyebrow: "NUTRITION TARGETS",
          headline: `${diag.prescribedDailyKcal} kcal · ${diag.prescribedDailyProteinGrams}g Protein`,
          subtext: `Weight trend is ${weightTrend.trajectory}. Maintain consistent whole-food intake with adequate hydration.`,
          ctaLabel: "Review Meal Strategies",
          targetDayLabel: "Daily Target",
          details: [
            { label: "Calories", value: `${diag.prescribedDailyKcal} kcal` },
            { label: "Protein", value: `${diag.prescribedDailyProteinGrams}g` },
            { label: "Trajectory", value: weightTrend.trajectory },
          ],
          actionPayload: {
            actionType: "nutrition",
            dayOfWeek: targetDay.dayOfWeek,
          },
        },
      };
    }
  }

  // 6. WEEKLY MESO REVIEW & BOTTLENECK DIAGNOSIS INTENT
  if (
    normalized.includes("weekly review") ||
    normalized.includes("meso review") ||
    normalized.includes("review my week") ||
    normalized.includes("bottleneck") ||
    normalized.includes("check-in") ||
    normalized.includes("check in")
  ) {
    const metrics = appStore.getMetrics(traineeId);
    const sessions = appStore.getSessions(traineeId);
    const caseFile = assembleAthleteCaseFile({
      traineeId,
      sessions,
      metricEntries: metrics,
    });
    const review = executeWeeklyMesoReview(caseFile);
    const topHypothesis = review.differentialDiagnosis[0];
    const topDomain = topHypothesis ? topHypothesis.domain : "general_maintenance";
    const experiment = review.committedExperiment;

    const bottleneckLabels: Record<string, string> = {
      tendon_tolerance: "Safety / Tendon Friction",
      adherence: "Adherence / Missed Sessions",
      energy_balance: "Nutrition & Energy Balance",
      progressive_overload: "Progressive Overload Stagnation",
      systemic_recovery: "Systemic Recovery / Sleep",
      volume_landmarks: "Volume Distribution",
    };

    const friendlyBottleneck = bottleneckLabels[topDomain] || topDomain;
    const experimentHypothesis = experiment?.hypothesis ?? topHypothesis?.hypothesis ?? "Maintain progressive overload and consistency";
    const reviewDate = experiment?.targetReviewDate ?? new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0];
    const experimentAction = experiment?.actionTaken ?? topHypothesis?.recommendedIntervention ?? "Continue current program block";
    const experimentCategory = experiment?.category ?? "setup_calibration";

    return {
      id: responseId,
      text: `Weekly Meso Review complete. Through differential diagnosis (Safety ➔ Adherence ➔ Nutrition ➔ Overload ➔ Recovery ➔ Exercise Selection), your primary rate-limiting bottleneck is **${friendlyBottleneck}**.\n\nCommitted experiment: "${experimentHypothesis}". Review scheduled for ${reviewDate}.`,
      card: {
        type: "autoregulate",
        eyebrow: "WEEKLY MESO REVIEW · DIFFERENTIAL DIAGNOSIS",
        headline: `Primary Bottleneck: ${friendlyBottleneck}`,
        subtext: `Experiment: ${experimentAction}. Review scheduled for ${reviewDate}.`,
        ctaLabel: "Acknowledge Experiment",
        targetDayLabel: "Meso Review",
        details: [
          { label: "Bottleneck", value: friendlyBottleneck.split(" / ")[0] },
          { label: "Experiment", value: experimentCategory },
          { label: "Review Date", value: reviewDate },
        ],
        actionPayload: {
          actionType: "autoregulate",
          dayOfWeek: targetDay.dayOfWeek,
        },
      },
    };
  }

  // 7. DEFAULT CONSTRUCTIVE PHYSIOLOGICAL COACHING
  const athlete = athleteModelStore.getAthleteModel(traineeId);
  const regime = athlete.static.regime.value ?? "hypertrophy";
  const trainingAgeY = (athlete.static.trainingAgeMonths.value / 12).toFixed(1);
  const activePlanSummary = program
    ? `Active plan: "${program.title}" (next focus: ${targetDay.label}).`
    : "No active split selected yet — you can generate a custom program in Plan -> New Program or start a quick Day-1 calibration session.";

  return {
    id: responseId,
    text: `Maintaining your ${regime} periodization blueprint (training age: ${trainingAgeY}y). ${activePlanSummary} Ask me to swap an exercise, adjust load, condense a session for time, run a weekly review, or audit your nutrition target.`,
  };
}
