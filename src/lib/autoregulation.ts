/**
 * Vyra Biomechanical Autoregulation Engine
 * 
 * Provides deterministic, real-time volume, load, and RIR autoregulation
 * based on biometric readiness signals (sleep duration, CNS fatigue, and axial spinal load).
 */

export type ReadinessState = "optimal" | "suboptimal" | "depleted";

export interface TraineeReadinessInput {
  sleepHours: number;
  sorenessRating?: number; // 1-5 (1=fresh, 5=severe)
  energyRating?: number;   // 1-5 (1=exhausted, 5=peaked)
  hrvMs?: number;          // Overnight HRV (rMSSD in milliseconds)
  hrvBaselineMs?: number;  // Rolling 14-day baseline (default 55ms)
  deepSleepMinutes?: number; // NREM 3 deep sleep duration
  restingHeartRateBpm?: number; // Overnight resting HR
}

export interface ExerciseAutoregulation {
  id: string;
  originalName: string;
  adaptedName: string;
  isSubstituted: boolean;
  substitutionReason?: string;
  originalWeightKg: number;
  adaptedWeightKg: number;
  loadDeltaPct: number;
  originalRir: number;
  adaptedRir: number;
  originalSets: number;
  adaptedSets: number;
  isAxialLoaded: boolean;
  rationale: string;
}

export interface AutoregulationPlan {
  readinessState: ReadinessState;
  readinessScore: number; // 0 - 100
  sleepHours: number;
  reducedRecovery: boolean;
  cnsFatigueDetected: boolean; // Preserved as alias for backward compatibility
  headline: string;
  clinicalRationale: string;
  prescriptionDeltas: ExerciseAutoregulation[];
}

// Classification of heavy compound lifts
const AXIAL_LOADED_PATTERNS = [
  /squat/i,
  /deadlift/i,
  /rdl/i,
  /romanian/i,
  /good morning/i,
  /overhead press/i,
  /standing.*press/i,
  /barbell row/i,
];

// Exercise substitutions when fatigue warrants machine support
const AXIAL_SUBSTITUTIONS: Record<string, { replacement: string; reason: string }> = {
  "barbell back squat": {
    replacement: "Hack Squat Machine",
    reason: "Machine support reduces back strain on low recovery",
  },
  "barbell squat": {
    replacement: "Leg Press Machine",
    reason: "Provides stable back support while maintaining leg work",
  },
  "barbell romanian deadlift": {
    replacement: "45° Back / Glute Hyperextension",
    reason: "Less lower-back fatigue on low sleep while targeting hamstrings",
  },
  "standing barbell overhead press": {
    replacement: "Seated Dumbbell Shoulder Press",
    reason: "Seated support keeps lifts stable when tired",
  },
};

/**
 * Checks if an exercise imparts significant axial loading on the spine.
 */
export function isAxialLoadedExercise(exerciseName: string): boolean {
  return AXIAL_LOADED_PATTERNS.some((pattern) => pattern.test(exerciseName));
}

/**
 * Computes a normalized readiness score (0-100) from sleep, subjective feedback,
 * and biometric wearable telemetry (overnight HRV, deep sleep, resting HR).
 */
export function calculateReadinessScore(input: TraineeReadinessInput): {
  score: number;
  state: ReadinessState;
} {
  const {
    sleepHours,
    sorenessRating = 2,
    energyRating = 3,
    hrvMs,
    hrvBaselineMs = 55,
    deepSleepMinutes,
    restingHeartRateBpm,
  } = input;

  // Base score from sleep duration
  let baseScore = 50;
  if (sleepHours >= 8.0) {
    baseScore = 95;
  } else if (sleepHours >= 7.0) {
    baseScore = 85;
  } else if (sleepHours >= 6.0) {
    baseScore = 70;
  } else if (sleepHours >= 5.0) {
    baseScore = 55;
  } else {
    baseScore = 35;
  }

  // Modulate with soreness (higher soreness reduces score)
  const sorenessPenalty = (sorenessRating - 2) * 5;

  // Modulate with energy (higher energy increases score)
  const energyBonus = (energyRating - 3) * 5;

  // Modulate with HRV (sympathetic vs parasympathetic tone)
  let hrvDelta = 0;
  if (typeof hrvMs === "number" && !isNaN(hrvMs)) {
    const baseline = hrvBaselineMs && hrvBaselineMs > 0 ? hrvBaselineMs : 55;
    const ratio = hrvMs / baseline;
    if (ratio <= 0.8 || hrvMs < 40) {
      hrvDelta = -15; // Severe sympathetic suppression
    } else if (ratio <= 0.9) {
      hrvDelta = -8; // Mild HRV suppression
    } else if (ratio >= 1.15) {
      hrvDelta = 5; // Parasympathetic supercompensation
    }
  }

  // Modulate with Deep Sleep (NREM 3 restorative sleep)
  let deepSleepDelta = 0;
  if (typeof deepSleepMinutes === "number" && !isNaN(deepSleepMinutes)) {
    if (deepSleepMinutes < 35) {
      deepSleepDelta = -10;
    } else if (deepSleepMinutes < 50) {
      deepSleepDelta = -5;
    } else if (deepSleepMinutes >= 75) {
      deepSleepDelta = 5;
    }
  }

  // Modulate with Resting Heart Rate
  let rhrDelta = 0;
  if (typeof restingHeartRateBpm === "number" && !isNaN(restingHeartRateBpm)) {
    if (restingHeartRateBpm >= 68) {
      rhrDelta = -5;
    }
  }

  const finalScore = Math.max(
    15,
    Math.min(100, Math.round(baseScore - sorenessPenalty + energyBonus + hrvDelta + deepSleepDelta + rhrDelta))
  );

  let state: ReadinessState = "optimal";
  if (finalScore < 60) {
    state = "depleted";
  } else if (finalScore < 80) {
    state = "suboptimal";
  } else {
    state = "optimal";
  }

  return { score: finalScore, state };
}

/**
 * Rounds weight to nearest 2.5 kg or 0.5 kg gym plate standard.
 */
function roundWeightStandard(weightKg: number): number {
  if (weightKg <= 10) {
    return Math.round(weightKg * 2) / 2; // 0.5 kg increments
  }
  return Math.round(weightKg / 2.5) * 2.5; // 2.5 kg increments
}

export interface MinimalExerciseTarget {
  id: string;
  name: string;
  targetSets: number;
  repLow: number;
  repHigh: number;
  targetRir: number;
  plannedWeightKg: number;
}

/**
 * Generates an autoregulation plan for a target workout routine.
 */
export function generateAutoregulationPlan(
  exercises: MinimalExerciseTarget[],
  readinessInput: TraineeReadinessInput
): AutoregulationPlan {
  const { score, state } = calculateReadinessScore(readinessInput);
  const sleep = readinessInput.sleepHours;
  const reducedRecovery = state !== "optimal";
  const cnsFatigueDetected = reducedRecovery;

  const biometricNotes: string[] = [];
  if (typeof readinessInput.hrvMs === "number" && !isNaN(readinessInput.hrvMs)) {
    const baseline = readinessInput.hrvBaselineMs && readinessInput.hrvBaselineMs > 0 ? readinessInput.hrvBaselineMs : 55;
    const diffPct = Math.round(((readinessInput.hrvMs - baseline) / baseline) * 100);
    if (diffPct <= -15) {
      biometricNotes.push(`Lower recovery (${readinessInput.hrvMs}ms)`);
    } else if (diffPct >= 15) {
      biometricNotes.push(`Higher recovery (${readinessInput.hrvMs}ms)`);
    } else {
      biometricNotes.push(`Baseline recovery (${readinessInput.hrvMs}ms)`);
    }
  }
  if (typeof readinessInput.deepSleepMinutes === "number" && !isNaN(readinessInput.deepSleepMinutes)) {
    biometricNotes.push(`Deep sleep ${readinessInput.deepSleepMinutes}m`);
  }
  const bioSummary = biometricNotes.length > 0 ? ` [${biometricNotes.join(" · ")}]` : "";

  let headline = "Full Recovery · Progressive Overload";
  let clinicalRationale = `Good recovery reported${bioSummary}. Proceed with planned weights and rep targets.`;

  if (state === "depleted") {
    headline = "Lower Recovery Today · Suggested Adjustments";
    clinicalRationale = `You said ${sleep}h sleep${bioSummary}. Heavy leg and back lifts are lighter today with an extra rep in reserve to keep good form.`;
  } else if (state === "suboptimal") {
    headline = "Moderate Recovery · Conservative Load Modulation";
    clinicalRationale = `You said ${sleep}h sleep${bioSummary}. Main lifts are slightly lighter today with an extra rep in reserve.`;
  }

  const prescriptionDeltas: ExerciseAutoregulation[] = exercises.map((ex) => {
    const isAxial = isAxialLoadedExercise(ex.name);
    let loadFactor = 1.0;
    let rirDelta = 0;
    let setDelta = 0;
    let adaptedName = ex.name;
    let isSubstituted = false;
    let substitutionReason: string | undefined = undefined;
    let rationale = "Plan matched to standard progression.";

    if (state === "depleted") {
      rirDelta = 1; // +1 RIR buffer
      if (isAxial) {
        loadFactor = 0.90; // -10% load on heavy compounds
        setDelta = ex.targetSets > 3 ? -1 : 0;
        rationale = "Heavy lift load reduced 10% with +1 RIR buffer to keep form clean.";

        // Check if substitution is beneficial
        const normalizedKey = ex.name.toLowerCase().trim();
        const sub = AXIAL_SUBSTITUTIONS[normalizedKey];
        if (sub) {
          adaptedName = sub.replacement;
          isSubstituted = true;
          substitutionReason = sub.reason;
          rationale = `${sub.reason}. ${rationale}`;
        }
      } else {
        loadFactor = 0.95; // -5%
        rationale = "Accessory weight slightly reduced to match energy level.";
      }
    } else if (state === "suboptimal") {
      rirDelta = 1;
      if (isAxial) {
        loadFactor = 0.95; // -5% load
        rationale = "Main lift dialed back 5% to maintain form.";
      } else {
        loadFactor = 0.98;
        rationale = "Standard volume with +1 RIR buffer.";
      }
    } else {
      // Full recovery
      rationale = "Full recovery. Target top-end rep targets as planned.";
    }

    const adaptedWeightKg = roundWeightStandard(ex.plannedWeightKg * loadFactor);
    const loadDeltaPct = Math.round(((adaptedWeightKg - ex.plannedWeightKg) / (ex.plannedWeightKg || 1)) * 100);

    return {
      id: ex.id,
      originalName: ex.name,
      adaptedName,
      isSubstituted,
      substitutionReason,
      originalWeightKg: ex.plannedWeightKg,
      adaptedWeightKg,
      loadDeltaPct,
      originalRir: ex.targetRir,
      adaptedRir: ex.targetRir + rirDelta,
      originalSets: ex.targetSets,
      adaptedSets: Math.max(1, ex.targetSets + setDelta),
      isAxialLoaded: isAxial,
      rationale,
    };
  });

  return {
    readinessState: state,
    readinessScore: score,
    sleepHours: sleep,
    reducedRecovery,
    cnsFatigueDetected,
    headline,
    clinicalRationale,
    prescriptionDeltas,
  };
}
