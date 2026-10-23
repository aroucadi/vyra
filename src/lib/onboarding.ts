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
import { ProgramDay, ExercisePrescription, WeightUnit } from "./types";
import { calculateEstimated1RM } from "./utils";

export type { WeightUnit };
export type AnchorLiftId = "barbell_bench" | "dumbbell_bench";
export type SleepWhatIfMode = "normal" | "short";
export type CalibrationMode = "uncalibrated" | "calibrated" | "calibrate_as_i_lift";
export type TrainingGoal = "hypertrophy" | "strength" | "recomposition" | "posture";

export interface GoalDefinition {
  id: TrainingGoal;
  label: string;
  shortLabel: string;
  repRange: string;
  targetRir: number;
  loadMultiplier: number;
  description: string;
  badgeClass: string;
}

export const TRAINING_GOALS: Record<TrainingGoal, GoalDefinition> = {
  hypertrophy: {
    id: "hypertrophy",
    label: "Build Muscle (Default)",
    shortLabel: "Build Muscle",
    repRange: "8-12",
    targetRir: 2,
    loadMultiplier: 1.0,
    description: "8–12 reps · Progressive volume & clavicular tension for maximum hypertrophy.",
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  },
  strength: {
    id: "strength",
    label: "Gain Strength & Power",
    shortLabel: "Strength",
    repRange: "5-8",
    targetRir: 3,
    loadMultiplier: 1.08,
    description: "5–8 reps · Heavy mechanical loading, neural drive & conservative recovery (3 RIR).",
    badgeClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  },
  recomposition: {
    id: "recomposition",
    label: "Lose Fat & Keep Muscle",
    shortLabel: "Cut & Preserve",
    repRange: "8-10",
    targetRir: 2,
    loadMultiplier: 0.96,
    description: "8–10 reps · Anti-catabolic mechanical tension preserving lean tissue during a caloric cut.",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  },
  posture: {
    id: "posture",
    label: "Posture & Upper-Body Balance",
    shortLabel: "Posture & Balance",
    repRange: "10-15",
    targetRir: 2,
    loadMultiplier: 0.90,
    description: "10–15 reps · Kyphosis reversal, upper back emphasis, 2:1 pull-to-push structural ratio.",
    badgeClass: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  },
};

export type PreferredEquipmentMode = "dumbbell" | "barbell" | "machine" | "cable";

export interface EquipmentManifestation {
  id: PreferredEquipmentMode;
  label: string;
  shortLabel: string;
  exerciseName: string;
  equipmentType: "dumbbell" | "barbell" | "machine" | "cable";
  loadFactor: number;
  isPerHand: boolean;
  synergists: string[];
  setupCue: string;
}

export const LIFT_ONE_EQUIPMENT_MANIFESTATIONS: Record<PreferredEquipmentMode, EquipmentManifestation> = {
  dumbbell: {
    id: "dumbbell",
    label: "Dumbbells (Free Weight)",
    shortLabel: "Dumbbells",
    exerciseName: "Incline Dumbbell Press",
    equipmentType: "dumbbell",
    loadFactor: 1.0,
    isPerHand: true,
    synergists: ["Anterior Deltoid", "Triceps", "Rotator Cuff"],
    setupCue: "Set bench at 30°; kick dumbbells up to shoulders with knees.",
  },
  barbell: {
    id: "barbell",
    label: "Olympic Barbell (20kg Bar)",
    shortLabel: "Barbell",
    exerciseName: "Incline Barbell Bench Press",
    equipmentType: "barbell",
    loadFactor: 2.125,
    isPerHand: false,
    synergists: ["Anterior Deltoid", "Triceps"],
    setupCue: "Set eyes under bar; grip 1.5× shoulder width with tucked elbows.",
  },
  machine: {
    id: "machine",
    label: "Selectorized / Lever Chest Press",
    shortLabel: "Machine",
    exerciseName: "Plate-Loaded Incline Chest Press",
    equipmentType: "machine",
    loadFactor: 2.25,
    isPerHand: false,
    synergists: ["Anterior Deltoid", "Triceps (Lateral Head)"],
    setupCue: "Adjust seat so handles align with mid-chest; keep shoulder blades pinned.",
  },
  cable: {
    id: "cable",
    label: "Dual Cable Tower Press",
    shortLabel: "Cables",
    exerciseName: "Converging Incline Cable Press",
    equipmentType: "cable",
    loadFactor: 0.9,
    isPerHand: true,
    synergists: ["Clavicular Pectoralis", "Anterior Deltoid"],
    setupCue: "Set pulleys at hip height; press up and together into peak contraction.",
  },
};

export function resolveEquipmentManifestation(
  mode: PreferredEquipmentMode
): EquipmentManifestation {
  return LIFT_ONE_EQUIPMENT_MANIFESTATIONS[mode] || LIFT_ONE_EQUIPMENT_MANIFESTATIONS.dumbbell;
}

export interface AnchorCalibrationInput {
  anchorLift: AnchorLiftId;
  weight: number;
  reps: number;
  unit: WeightUnit;
  sleepMode?: SleepWhatIfMode;
  mode?: CalibrationMode;
  goal?: TrainingGoal;
  equipment?: PreferredEquipmentMode;
}

export interface GoalAwareKineticCues {
  setupAnchor: string;
  kineticDrive: string;
  tempoAdvice: string;
  focusBadge: string;
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
  kineticCues: GoalAwareKineticCues;
  brandLeverageNote?: string;
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
  goal: TrainingGoal;
  equipment: PreferredEquipmentMode;
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
 * Delegates to canonical calculateEstimated1RM in utils.ts (SSOT).
 */
export const calculateEpley1RM = calculateEstimated1RM;

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
 * Spec 025: Resolves intelligent, goal-adapted kinetic cues and tempo advice for any exercise.
 */
export function resolveGoalAwareKineticCues(
  exerciseName: string,
  goal: TrainingGoal,
  baseCues?: { setupAnchor?: string; kineticDrive?: string }
): GoalAwareKineticCues {
  const lower = exerciseName.toLowerCase();

  // 1. Pressing Movements (Incline DB, Flat Bench, Chest Press)
  if (lower.includes("press") || lower.includes("bench")) {
    switch (goal) {
      case "strength":
        return {
          setupAnchor: baseCues?.setupAnchor || "Plant feet aggressively into floor & pack lats tightly into the bench.",
          kineticDrive: "Explode through sticking point; drive with maximum intended velocity.",
          tempoAdvice: "2-0-X-0 (Explosive Concentric)",
          focusBadge: "Maximal Neural Drive",
        };
      case "recomposition":
        return {
          setupAnchor: baseCues?.setupAnchor || "Retract scapulae; lock ribcage down to maintain constant tension.",
          kineticDrive: "Continuous rhythmic drive; do not pause or rest at lockout.",
          tempoAdvice: "2-1-1-0 (Density Rhythm)",
          focusBadge: "Anti-Catabolic Density",
        };
      case "posture":
        return {
          setupAnchor: "Neutral cervical spine; depress shoulder blades away from ears.",
          kineticDrive: "Press strictly in the scapular plane (30° elbow tuck) to protect anterior capsule.",
          tempoAdvice: "3-1-1-1 (Structural Alignment)",
          focusBadge: "Capsule Protection",
        };
      case "hypertrophy":
      default:
        return {
          setupAnchor: baseCues?.setupAnchor || "Retract scapulae & set bench at 30° to target clavicular fibers.",
          kineticDrive: baseCues?.kineticDrive || "3-second controlled descent; drive elbows inward toward upper sternum.",
          tempoAdvice: "3-0-1-0 (Controlled Stretch)",
          focusBadge: "Deep Stretch & Tension",
        };
    }
  }

  // 2. Vertical & Horizontal Pulling (Lat Pulldown, Rows)
  if (lower.includes("pulldown") || lower.includes("row") || lower.includes("pull-up") || lower.includes("chin")) {
    switch (goal) {
      case "strength":
        return {
          setupAnchor: baseCues?.setupAnchor || "Brace core 360°; set a slight thoracic arch.",
          kineticDrive: "Drive elbows down aggressively, snapping bar to upper sternum with power.",
          tempoAdvice: "1-0-X-0 (Power Pull)",
          focusBadge: "Motor Unit Recruitment",
        };
      case "recomposition":
        return {
          setupAnchor: baseCues?.setupAnchor || "Maintain tall posture; breathe out smoothly during concentric pull.",
          kineticDrive: "Rhythmic pull-and-release maintaining high time under tension.",
          tempoAdvice: "2-0-1-0 (Metabolic Flow)",
          focusBadge: "Work Capacity & Flow",
        };
      case "posture":
        return {
          setupAnchor: "Depress scapulae first before initiating elbow bend (anti-shrug).",
          kineticDrive: "Drive elbows into rear pockets; squeeze rhomboids for 1s at bottom.",
          tempoAdvice: "2-1-2-1 (Scapular Retraction)",
          focusBadge: "Kyphosis Correction",
        };
      case "hypertrophy":
      default:
        return {
          setupAnchor: baseCues?.setupAnchor || "Grip slightly outside shoulder width; hang into full lat stretch.",
          kineticDrive: baseCues?.kineticDrive || "Drive elbows down and inward toward rear pockets; squeeze lats.",
          tempoAdvice: "3-0-1-1 (Peak Lat Contraction)",
          focusBadge: "Iliac Lat Stretch",
        };
    }
  }

  // 3. Deltoid Isolation & Rear Delts (Lateral Raises, Face Pulls)
  if (lower.includes("lateral") || lower.includes("raise") || lower.includes("face pull") || lower.includes("delt")) {
    switch (goal) {
      case "strength":
        return {
          setupAnchor: baseCues?.setupAnchor || "Strict torso lock; zero hip momentum or body swing.",
          kineticDrive: "Accelerate to shoulder height with crisp, authoritative lockout.",
          tempoAdvice: "1-0-1-0 (Strict Overload)",
          focusBadge: "Strict Power",
        };
      case "recomposition":
        return {
          setupAnchor: baseCues?.setupAnchor || "Constant tension; never let weights rest or touch at the bottom.",
          kineticDrive: "Paced repetitions targeting deep local metabolic burn.",
          tempoAdvice: "2-0-1-0 (Burnout Density)",
          focusBadge: "Metabolic Stress",
        };
      case "posture":
        return {
          setupAnchor: "High pulley anchor; thumbs rotated back; tall cervical spine.",
          kineticDrive: "Rotate thumbs externally; pull toward forehead with a 1-second scapular squeeze.",
          tempoAdvice: "2-2-1-2 (Rotator Activation)",
          focusBadge: "Infraspinatus & Rear Delt Lock",
        };
      case "hypertrophy":
      default:
        return {
          setupAnchor: baseCues?.setupAnchor || "Slight 15° forward torso lean; lead with elbows in scapular plane.",
          kineticDrive: baseCues?.kineticDrive || "Sweep dumbbells outward to the walls; keep constant lateral delt tension.",
          tempoAdvice: "2-1-1-0 (Continuous Tension)",
          focusBadge: "Medial Head Isolation",
        };
    }
  }

  // 4. Default / Fallback
  return {
    setupAnchor: baseCues?.setupAnchor || "Establish stable joint alignment and brace core.",
    kineticDrive: baseCues?.kineticDrive || "Control the eccentric phase and drive smoothly through full range of motion.",
    tempoAdvice: goal === "strength" ? "2-0-X-0" : "3-0-1-0",
    focusBadge: TRAINING_GOALS[goal]?.shortLabel || "Targeted Form",
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
  const goal: TrainingGoal = input.goal || "hypertrophy";
  const goalConfig = TRAINING_GOALS[goal];
  const equipment: PreferredEquipmentMode = input.equipment || "dumbbell";
  const equipmentManifestation = resolveEquipmentManifestation(equipment);
  const safeWeight = Math.min(500, Math.max(5, Number(input.weight) || 80));
  const safeReps = Math.min(25, Math.max(1, Math.round(Number(input.reps) || 8)));

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

  const targets: DerivedExerciseTarget[] = exercises.map((ex, index) => {
    let exerciseName = ex.exerciseName;
    let ratio = 0.32;
    let ratioLabel = "Poliquin Clavicular Incline DB Ratio (0.32× Bench 1RM per arm)";
    let setupCue: string | undefined = undefined;

    if (index === 0) {
      exerciseName = equipmentManifestation.exerciseName;
      setupCue = equipmentManifestation.setupCue;
      if (equipment === "barbell") {
        ratio = 0.68;
        ratioLabel = "Poliquin Incline Barbell Ratio (0.68× Bench 1RM total bar load)";
      } else if (equipment === "machine") {
        ratio = 0.72;
        ratioLabel = "Plate-Loaded Incline Chest Press Ratio (0.72× Bench 1RM)";
      } else if (equipment === "cable") {
        ratio = 0.28;
        ratioLabel = "Converging Incline Cable Ratio (0.28× Bench 1RM per side)";
      } else {
        ratio = 0.32;
        ratioLabel = "Poliquin Clavicular Incline DB Ratio (0.32× Bench 1RM per arm)";
      }
    } else {
      const resolved = resolvePoliquinWorkingRatio(ex.exerciseName);
      ratio = resolved.ratio;
      ratioLabel = resolved.ratioLabel;
    }

    const goalAdjustedRatio = ratio * goalConfig.loadMultiplier;
    const normalWeightKg = roundToGymIncrement(estimatedBench1RmKg * goalAdjustedRatio, "kg");
    // Short sleep applies a 10% load buffer and +1 RIR to protect joint/CNS recovery
    const shortSleepWeightKg = roundToGymIncrement(normalWeightKg * 0.9, "kg");
    const activeWeightKg = sleepMode === "short" ? shortSleepWeightKg : normalWeightKg;
    const displayWeight = fromKilograms(activeWeightKg, unit);
    const baseRir = goalConfig.targetRir;
    const targetRir = sleepMode === "short" ? baseRir + 1 : baseRir;

    const isSwappedMachine = index === 0 && (equipment === "machine" || equipment === "cable");
    const brandLeverageNote = isSwappedMachine
      ? "Cam & pulley leverage varies across gym brands (e.g. Hammer Strength vs. Life Fitness). Treat this starting load as a calibration probe and adjust freely on Set 1."
      : undefined;

    const whyHeadline = isSwappedMachine
      ? `Estimated Pin: ${displayWeight} ${unit} · Calibrate feel on Set 1`
      : `Why ${displayWeight} ${unit}? Tap to check.`;
    const sleepClause =
      sleepMode === "short"
        ? ` → -10% short-sleep buffer (${shortSleepWeightKg} kg @ ${targetRir} RIR)`
        : ` (${normalWeightKg} kg @ ${targetRir} RIR)`;

    const equipTag = index === 0 ? ` [${equipmentManifestation.shortLabel}]` : "";
    const whyFormulaText = `${safeWeight} ${unit} × ${safeReps} reps (${anchorLabel}) = ${estimatedBench1RmKg} kg e1RM (Epley) → × ${ratio.toFixed(2)} ${ratioLabel}${equipTag} [${goalConfig.shortLabel}]${sleepClause}.`;

    const repRange = goalConfig.repRange;
    const kineticCues = resolveGoalAwareKineticCues(exerciseName, goal, setupCue ? { setupAnchor: setupCue } : undefined);

    return {
      exerciseId: ex.exerciseId,
      exerciseName,
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
      kineticCues,
      brandLeverageNote,
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
    goal,
    equipment,
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
  // Persist chosen goal to the trainee profile
  try {
    const user = appStore.getUser(userId);
    if (user) {
      user.goals = [calibration.goal];
    }
  } catch {
    // Non-blocking in ephemeral test environments
  }

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
        ex.exerciseName = target.exerciseName;
        ex.rirScheme = Array(ex.sets).fill(target.targetRir);
        ex.loadGuidance = `Target: ${target.displayWeight} ${target.unit} (${target.activeWeightKg} kg) · [${TRAINING_GOALS[calibration.goal].shortLabel}] Derived from ${calibration.inputWeight} ${calibration.unit} × ${calibration.inputReps} (${calibration.estimatedBench1RmKg} kg e1RM)`;
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
  if (input.goal && input.goal !== "hypertrophy") {
    params.set("goal", input.goal);
  }
  if (input.equipment && input.equipment !== "dumbbell") {
    params.set("equip", input.equipment);
  }
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}${params.toString()}`;
}

/**
 * Parses a handoff URL query string (`?anchor=80x8&unit=kg&lift=barbell_bench&goal=strength&equip=barbell`) back into an AnchorCalibrationInput.
 */
export function parseHandoffQueryUrl(search: string): AnchorCalibrationInput | null {
  const clean = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(clean);
  const anchorRaw = params.get("anchor");
  if (!anchorRaw) return null;

  const match = /^(\d+(?:\.\d+)?)x(\d+)$/i.exec(anchorRaw.trim());
  if (!match) return null;

  const weight = Math.min(500, Math.max(5, Number(match[1])));
  const reps = Math.min(25, Math.max(1, Number(match[2])));
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

  const goalParam = params.get("goal");
  const goal: TrainingGoal =
    goalParam === "strength" || goalParam === "recomposition" || goalParam === "posture"
      ? goalParam
      : "hypertrophy";

  const equipParam = params.get("equip");
  const equipment: PreferredEquipmentMode =
    equipParam === "barbell" || equipParam === "machine" || equipParam === "cable"
      ? equipParam
      : "dumbbell";

  return {
    anchorLift,
    weight,
    reps,
    unit,
    sleepMode,
    mode,
    goal,
    equipment,
  };
}
