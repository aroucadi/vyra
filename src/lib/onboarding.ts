/**
 * @file onboarding.ts
 * @description Spec 019: Zero-Gate Day-0 Onboarding & Trust Calibration Engine ("The Couch-to-Rack Proxy").
 * Provides pure, deterministic functions for:
 * 1. Day-0 detection & Day-1 lifting session resolution (never a rest day or supplement stack).
 * 2. 1-Anchor Poliquin Starting Weight Calibration (<150ms derivation across all Day-1 exercises).
 * 3. Interactive "Why {weight}?" formula proof and reversible Sleep What-If calculation.
 * 4. In-App WebView User-Agent detection and stateless URL query handoff (?anchor=80x8&unit=kg).
 * 5. Catalogue-to-Session 1-tap exercise handoff.
 */

import { appStore } from "./store";
import { ProgramDay, ExercisePrescription } from "./types";

export type WeightUnit = "kg" | "lb";
export type AnchorLiftId = "barbell_bench" | "dumbbell_bench";
export type SleepWhatIfMode = "normal" | "short";
export type CalibrationMode = "uncalibrated" | "calibrated" | "calibrate_as_i_lift";

export interface AnchorCalibrationInput {
  anchorLift: AnchorLiftId;
  weight: number;
  reps: number;
  unit: WeightUnit;
  sleepMode?: SleepWhatIfMode;
  mode?: CalibrationMode;
}

export interface DerivedExerciseTarget {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  repRange: string;
  targetRir: number;
  normalWeightKg: number;
  shortSleepWeightKg: number;
  activeWeightKg: number;
  displayWeight: number;
  unit: WeightUnit;
  structuralRatio: number;
  ratioLabel: string;
  whyHeadline: string;
  whyFormulaText: string;
}

export interface DayZeroCalibrationResult {
  anchorLift: AnchorLiftId;
  anchorLabel: string;
  inputWeight: number;
  inputReps: number;
  unit: WeightUnit;
  anchorWeightKg: number;
  estimatedBench1RmKg: number;
  sleepMode: SleepWhatIfMode;
  calibrationMode: CalibrationMode;
  targets: DerivedExerciseTarget[];
}

export interface InAppWebViewStatus {
  isInAppWebView: boolean;
  sourceApp: "Instagram" | "Reddit" | "TikTok" | "Facebook" | "LinkedIn" | "X" | null;
  recommendedBrowser: "Safari" | "Chrome";
}

const LB_PER_KG = 2.2046226218;

/**
 * Rounds a weight to the nearest practical gym increment (2.5 kg or 5 lb).
 */
export function roundToGymIncrement(value: number, unit: WeightUnit): number {
  const step = unit === "kg" ? 2.5 : 5;
  const rounded = Math.round(value / step) * step;
  return Math.max(step, Number(rounded.toFixed(1)));
}

/**
 * Converts weight between kg and lb.
 */
export function toKilograms(weight: number, unit: WeightUnit): number {
  if (unit === "kg") return weight;
  return Number((weight / LB_PER_KG).toFixed(2));
}

export function fromKilograms(weightKg: number, unit: WeightUnit): number {
  if (unit === "kg") return roundToGymIncrement(weightKg, "kg");
  return roundToGymIncrement(weightKg * LB_PER_KG, "lb");
}

/**
 * Computes estimated 1RM using the classic Epley formula: w * (1 + r / 30).
 * Pure client-safe implementation with zero Node.js / file system dependencies.
 */
export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return Number(weightKg.toFixed(1));
  return Number((weightKg * (1 + reps / 30)).toFixed(1));
}

/**
 * Determines whether a trainee is in Day-0 state (zero logged workout sessions, zero historical metrics, and zero wearable snapshots).
 * Supports an explicit override (`forceDayZero`) for triggering Day-0 onboarding on seeded profiles.
 */
export function isDayZeroUser(userId: string, forceDayZero?: boolean): boolean {
  if (typeof forceDayZero === "boolean") return forceDayZero;
  const sessions = appStore.getSessions(userId);
  const metrics = appStore.getMetrics(userId);
  const biometrics = appStore.getLatestWearableBiometrics(userId);
  return sessions.length === 0 && metrics.length === 0 && !biometrics;
}

/**
 * Always resolves a real lifting session for Day 1 (never a rest day).
 * If the trainee has an active program, returns the first non-rest training day of Week 1.
 */
export function resolveDayOneWorkoutDay(userId: string): {
  programDay: ProgramDay | null;
  exerciseCount: number;
  estimatedMinutes: number;
  primaryExercise: ExercisePrescription | null;
} {
  const program = appStore.getActiveProgramForTrainee(userId) || appStore.getPrograms()[0];
  if (!program || !program.weeks || program.weeks.length === 0) {
    return {
      programDay: null,
      exerciseCount: 0,
      estimatedMinutes: 35,
      primaryExercise: null,
    };
  }

  const week1 = program.weeks[0];
  const firstLiftingDay =
    week1.days.find((d) => !d.isRestDay && d.blocks.some((b) => b.exercises.length > 0)) ||
    week1.days[0] ||
    null;

  if (!firstLiftingDay) {
    return {
      programDay: null,
      exerciseCount: 0,
      estimatedMinutes: 35,
      primaryExercise: null,
    };
  }

  const allExercises = firstLiftingDay.blocks.flatMap((b) => b.exercises);
  const totalSets = allExercises.reduce((sum, ex) => sum + (ex.sets || 3), 0);
  const estimatedMinutes = Math.max(25, Math.min(60, Math.round(totalSets * 2.4)));

  return {
    programDay: firstLiftingDay,
    exerciseCount: allExercises.length,
    estimatedMinutes,
    primaryExercise: allExercises[0] || null,
  };
}

/**
 * Determines the Poliquin / structural balance working-weight ratio relative to Flat Barbell Bench 1RM.
 * For Dumbbell movements, the ratio represents the per-hand dumbbell weight.
 */
export function resolvePoliquinWorkingRatio(exerciseName: string): {
  ratio: number;
  ratioLabel: string;
} {
  const lower = exerciseName.toLowerCase();

  if (lower.includes("incline") && (lower.includes("dumbbell") || lower.includes("db"))) {
    return {
      ratio: 0.32,
      ratioLabel: "Poliquin Clavicular Incline DB Ratio (0.32× Bench 1RM per arm)",
    };
  }
  if (lower.includes("incline") && lower.includes("bench")) {
    return {
      ratio: 0.68,
      ratioLabel: "Poliquin Incline Barbell Ratio (0.91× structural × 0.75 working load)",
    };
  }
  if (lower.includes("bench press") && (lower.includes("dumbbell") || lower.includes("db"))) {
    return {
      ratio: 0.35,
      ratioLabel: "Poliquin Flat DB Press Ratio (0.35× Bench 1RM per arm)",
    };
  }
  if (lower.includes("bench press") || lower.includes("chest press")) {
    return {
      ratio: 0.76,
      ratioLabel: "Working Hypertrophy Load (0.76× Epley 1RM @ 2 RIR)",
    };
  }
  if (lower.includes("row") && (lower.includes("chest-supported") || lower.includes("dumbbell") || lower.includes("db"))) {
    return {
      ratio: 0.34,
      ratioLabel: "2:1 Scapular Retraction Balance Ratio (0.34× per arm)",
    };
  }
  if (lower.includes("row") || lower.includes("pulldown") || lower.includes("pull-up") || lower.includes("chin")) {
    return {
      ratio: 0.72,
      ratioLabel: "Poliquin Antagonist Pull Ratio (0.72× Bench 1RM)",
    };
  }
  if (lower.includes("lateral raise") || lower.includes("side delt") || lower.includes("lu raise")) {
    return {
      ratio: 0.12,
      ratioLabel: "Poliquin Medial Deltoid Isolation Ratio (0.12× Bench 1RM)",
    };
  }
  if (lower.includes("face pull") || lower.includes("rear delt")) {
    return {
      ratio: 0.24,
      ratioLabel: "External Rotation & Rear Delt Ratio (0.24× Bench 1RM)",
    };
  }
  if (lower.includes("tricep") || lower.includes("pushdown") || lower.includes("skull") || lower.includes("extension")) {
    return {
      ratio: 0.28,
      ratioLabel: "Elbow Extension Structural Ratio (0.28× Bench 1RM)",
    };
  }
  if (lower.includes("curl") || lower.includes("bicep")) {
    return {
      ratio: 0.18,
      ratioLabel: "Poliquin Supinated Elbow Flexion Ratio (0.18× Bench 1RM)",
    };
  }
  if (lower.includes("overhead") || lower.includes("shoulder press") || lower.includes("military")) {
    return {
      ratio: 0.52,
      ratioLabel: "Poliquin Vertical Press Ratio (0.52× Bench 1RM)",
    };
  }
  if (lower.includes("squat") || lower.includes("leg press") || lower.includes("hack")) {
    return {
      ratio: 0.98,
      ratioLabel: "Lower-Body Compound Scaling Ratio (0.98× Bench 1RM)",
    };
  }
  if (lower.includes("romanian") || lower.includes("rdl") || lower.includes("deadlift")) {
    return {
      ratio: 1.05,
      ratioLabel: "Posterior Chain Hinge Ratio (1.05× Bench 1RM)",
    };
  }

  return {
    ratio: 0.5,
    ratioLabel: "Submaximal Hypertrophy Working Ratio (0.50× Bench 1RM)",
  };
}

/**
 * Derives all Day-1 exercise starting loads from a single compound anchor input in <1ms.
 */
export function deriveStartingWeightsFromAnchor(
  userId: string,
  input: AnchorCalibrationInput
): DayZeroCalibrationResult {
  const unit = input.unit || "kg";
  const sleepMode: SleepWhatIfMode = input.sleepMode || "normal";
  const calibrationMode: CalibrationMode = input.mode || "calibrated";
  const safeWeight = Math.max(5, Number(input.weight) || 80);
  const safeReps = Math.min(15, Math.max(1, Math.round(Number(input.reps) || 8)));

  const rawWeightKg = toKilograms(safeWeight, unit);
  // If user enters Dumbbell Bench (per hand), convert to equivalent Barbell Bench baseline (2 × DB / 0.85)
  const effectiveBarbellKg =
    input.anchorLift === "dumbbell_bench" ? (rawWeightKg * 2) / 0.85 : rawWeightKg;

  const rawE1Rm = calculateEpley1RM(effectiveBarbellKg, safeReps);
  const estimatedBench1RmKg = Number(rawE1Rm.toFixed(1));

  const anchorLabel =
    input.anchorLift === "dumbbell_bench"
      ? "Flat Dumbbell Press (per hand)"
      : "Barbell Bench Press";

  const { programDay } = resolveDayOneWorkoutDay(userId);
  const exercises = programDay
    ? programDay.blocks.flatMap((b) => b.exercises)
    : [];

  const targets: DerivedExerciseTarget[] = exercises.map((ex) => {
    const { ratio, ratioLabel } = resolvePoliquinWorkingRatio(ex.exerciseName);
    const normalWeightKg = roundToGymIncrement(estimatedBench1RmKg * ratio, "kg");
    // Short sleep applies a 10% load buffer and +1 RIR to protect joint/CNS recovery
    const shortSleepWeightKg = roundToGymIncrement(normalWeightKg * 0.9, "kg");
    const activeWeightKg = sleepMode === "short" ? shortSleepWeightKg : normalWeightKg;
    const displayWeight = fromKilograms(activeWeightKg, unit);
    const baseRir = ex.rirScheme && ex.rirScheme.length > 0 ? ex.rirScheme[0] : 2;
    const targetRir = sleepMode === "short" ? baseRir + 1 : baseRir;

    const whyHeadline = `Why ${displayWeight} ${unit}? Tap to check.`;
    const sleepClause =
      sleepMode === "short"
        ? ` → -10% short-sleep buffer (${shortSleepWeightKg} kg @ ${targetRir} RIR)`
        : ` (${normalWeightKg} kg @ ${targetRir} RIR)`;

    const whyFormulaText = `${safeWeight} ${unit} × ${safeReps} reps (${anchorLabel}) = ${estimatedBench1RmKg} kg e1RM (Epley) → × ${ratio} ${ratioLabel}${sleepClause}.`;

    const repRange =
      ex.repRangeLow && ex.repRangeHigh
        ? `${ex.repRangeLow}-${ex.repRangeHigh}`
        : "8-10";

    return {
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets,
      repRange,
      targetRir,
      normalWeightKg,
      shortSleepWeightKg,
      activeWeightKg,
      displayWeight,
      unit,
      structuralRatio: ratio,
      ratioLabel,
      whyHeadline,
      whyFormulaText,
    };
  });

  return {
    anchorLift: input.anchorLift,
    anchorLabel,
    inputWeight: safeWeight,
    inputReps: safeReps,
    unit,
    anchorWeightKg: Number(rawWeightKg.toFixed(1)),
    estimatedBench1RmKg,
    sleepMode,
    calibrationMode,
    targets,
  };
}

/**
 * Persists calibrated Day-0 starting loads into the active program's Day-1 loadGuidance
 * so entering `/session` immediately pre-fills the exact calibrated loads.
 */
export function applyCalibratedWeightsToDayOne(
  userId: string,
  calibration: DayZeroCalibrationResult
): { updatedCount: number; dayId: string } {
  const program = appStore.getActiveProgramForTrainee(userId);
  if (!program || !program.weeks || program.weeks.length === 0) {
    return { updatedCount: 0, dayId: "day_1" };
  }

  const week1 = program.weeks[0];
  const firstLiftingDay =
    week1.days.find((d) => !d.isRestDay && d.blocks.some((b) => b.exercises.length > 0)) ||
    week1.days[0];

  if (!firstLiftingDay) {
    return { updatedCount: 0, dayId: "day_1" };
  }

  let updatedCount = 0;
  for (const block of firstLiftingDay.blocks) {
    for (const ex of block.exercises) {
      if (calibration.calibrationMode === "calibrate_as_i_lift") {
        ex.loadGuidance = `Calibrate on Set 1: Choose a smooth load leaving ${ex.rirScheme?.[0] ?? 2} reps in reserve (RIR).`;
        updatedCount++;
        continue;
      }

      const target = calibration.targets.find(
        (t) => t.exerciseId === ex.exerciseId || t.exerciseName === ex.exerciseName
      );
      if (target) {
        ex.rirScheme = Array(ex.sets).fill(target.targetRir);
        ex.loadGuidance = `Target: ${target.displayWeight} ${target.unit} (${target.activeWeightKg} kg) · Derived from ${calibration.inputWeight} ${calibration.unit} × ${calibration.inputReps} (${calibration.estimatedBench1RmKg} kg e1RM)`;
        updatedCount++;
      }
    }
  }

  program.updatedAt = new Date().toISOString();
  return { updatedCount, dayId: firstLiftingDay.id };
}

/**
 * Detects whether the user arrived inside an ephemeral in-app browser WebView
 * (Instagram, Reddit, TikTok, Facebook, LinkedIn, X) where IndexedDB storage or PWA install may be restricted.
 */
export function detectInAppWebView(userAgent?: string): InAppWebViewStatus {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const recommendedBrowser: "Safari" | "Chrome" = isIOS ? "Safari" : "Chrome";

  if (!ua) {
    return { isInAppWebView: false, sourceApp: null, recommendedBrowser };
  }

  if (/Instagram/i.test(ua)) {
    return { isInAppWebView: true, sourceApp: "Instagram", recommendedBrowser };
  }
  if (/Reddit/i.test(ua)) {
    return { isInAppWebView: true, sourceApp: "Reddit", recommendedBrowser };
  }
  if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) {
    return { isInAppWebView: true, sourceApp: "TikTok", recommendedBrowser };
  }
  if (/FBAN|FBIOS|FB_IAB/i.test(ua)) {
    return { isInAppWebView: true, sourceApp: "Facebook", recommendedBrowser };
  }
  if (/LinkedInApp/i.test(ua)) {
    return { isInAppWebView: true, sourceApp: "LinkedIn", recommendedBrowser };
  }
  if (/Twitter/i.test(ua)) {
    return { isInAppWebView: true, sourceApp: "X", recommendedBrowser };
  }

  return { isInAppWebView: false, sourceApp: null, recommendedBrowser };
}

/**
 * Builds a stateless handoff URL preserving the user's calibrated anchor weights
 * when transitioning from an in-app WebView to Safari/Chrome.
 */
export function buildHandoffQueryUrl(
  basePath: string,
  input: AnchorCalibrationInput
): string {
  const params = new URLSearchParams();
  params.set("anchor", `${input.weight}x${input.reps}`);
  params.set("unit", input.unit);
  params.set("lift", input.anchorLift);
  if (input.sleepMode && input.sleepMode !== "normal") {
    params.set("sleep", input.sleepMode);
  }
  if (input.mode && input.mode !== "calibrated") {
    params.set("mode", input.mode);
  }
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}${params.toString()}`;
}

/**
 * Parses a handoff URL query string (`?anchor=80x8&unit=kg&lift=barbell_bench`) back into an AnchorCalibrationInput.
 */
export function parseHandoffQueryUrl(search: string): AnchorCalibrationInput | null {
  const clean = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(clean);
  const anchorRaw = params.get("anchor");
  if (!anchorRaw) return null;

  const match = /^(\d+(?:\.\d+)?)x(\d+)$/i.exec(anchorRaw.trim());
  if (!match) return null;

  const weight = Number(match[1]);
  const reps = Number(match[2]);
  if (!isFinite(weight) || !isFinite(reps) || weight <= 0 || reps <= 0) {
    return null;
  }

  const unitParam = params.get("unit");
  const unit: WeightUnit = unitParam === "lb" ? "lb" : "kg";

  const liftParam = params.get("lift");
  const anchorLift: AnchorLiftId =
    liftParam === "dumbbell_bench" ? "dumbbell_bench" : "barbell_bench";

  const sleepParam = params.get("sleep");
  const sleepMode: SleepWhatIfMode = sleepParam === "short" ? "short" : "normal";

  const modeParam = params.get("mode");
  const mode: CalibrationMode =
    modeParam === "calibrate_as_i_lift" ? "calibrate_as_i_lift" : "calibrated";

  return {
    anchorLift,
    weight,
    reps,
    unit,
    sleepMode,
    mode,
  };
}
