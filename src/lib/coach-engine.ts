import { appStore } from "./store";
import { resolveProgramDay } from "./utils";

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
    { label: "Today's Session", dayOfWeek: 0 };

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
    const currentEx = "Incline Machine Chest Press";
    const replacementEx = "30° Incline Dumbbell Press";

    return {
      id: responseId,
      text: isShoulderPain
        ? `Shoulder impingement typically arises from rigid fixed-axis machines under high load. I've configured an alternative to 30° Incline Dumbbell Press, which allows natural scapular glide and free humeral rotation while matching upper clavicular pectoral recruitment.`
        : `I've analyzed biomechanically equivalent alternatives for ${currentEx}. The 30° Incline Dumbbell Press matches the tension curve while allowing individual limb stabilization.`,
      card: {
        type: "swap",
        eyebrow: `AUTOREGULATION · ${targetDay.label.toUpperCase()}`,
        headline: `${currentEx} ➔ ${replacementEx}`,
        subtext: "Preserves upper-chest stimulus while eliminating fixed-axis Glenohumeral joint impingement.",
        ctaLabel: `Apply Swap to ${targetDay.label}`,
        targetDayLabel: targetDay.label,
        details: [
          { label: "Target Load", value: "28 kg DBs" },
          { label: "Prescription", value: "3 Sets · RIR 2" },
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
    const pb = appStore.getPersonalBestForExercise(traineeId, "Barbell Back Squat");
    const pbWeight = pb ? pb.weightKg : 140;

    return {
      id: responseId,
      text: `Your working load targets (${pbWeight} kg baseline) follow our strict Double Progression rule: you must hit the upper ceiling of your prescribed rep range (e.g. 10 clean reps @ 2 RIR) across all scheduled working sets before earning a +2.5 kg weight bump. This prevents ego-lifting and builds genuine tendon resilience.`,
      card: {
        type: "load_explanation",
        eyebrow: "PROGRESSION RULES · FORMULA & MATH",
        headline: "Double Progression Ceiling Model",
        subtext: "Weight remains locked until rep ceiling is achieved across 100% of working sets. Math runs deterministically in code.",
        ctaLabel: "Review in Exercise Library",
        targetDayLabel: targetDay.label,
        details: [
          { label: "Current Load", value: `${pbWeight} kg` },
          { label: "Rep Target", value: "8–10 Reps" },
          { label: "Next Step", value: `+2.5 kg (@ 10r)` },
        ],
        actionPayload: {
          actionType: "load_explanation",
          dayOfWeek: targetDay.dayOfWeek,
        },
        interactiveData: {
          formula: "Next Load = Current Load + 2.5kg (if Reps >= 10 on all 3 sets)",
          baselineWeightKg: pbWeight,
          currentReps: 9,
          targetReps: 10,
          nextIncrementKg: 2.5,
          conditionSummary: "1 more clean rep needed on Set 3 to unlock 142.5 kg next session.",
        },
      },
    };
  }

  // 5. DEFAULT CONSTRUCTIVE PHYSIOLOGICAL COACHING
  return {
    id: responseId,
    text: `Maintaining your 16-week periodization blueprint. Current focus is strict scapular retraction and maintaining our 2:1 pull-to-push volume balance to fix anterior shoulder tilt. Let me know if you need to swap an exercise, adjust load, or condense your session.`,
  };
}
