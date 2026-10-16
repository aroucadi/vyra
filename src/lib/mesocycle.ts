/**
 * Spec 027: Post-Session 1 Adaptive 16-Week Mesocycle Architect
 * 
 * Translates logged Day 1 performance data into an autoregulated,
 * goal-aware 16-week periodization split (3, 4, or 5 days/week).
 * Built with Open UI instant client reactivity and zero cognitive overload.
 */

import { TrainingGoal, TRAINING_GOALS } from "./onboarding";
import { appStore } from "./store";

export type TrainingFrequency = 3 | 4 | 5;

export interface MesocycleDay {
  dayNumber: number;
  name: string;
  focus: string;
  targetMuscles: string[];
}

export interface MesocyclePhase {
  phaseNumber: number;
  weeks: string;
  name: string;
  focus: string;
  overloadStrategy: string;
  rirTarget: number;
}

export interface MesocycleSplitDefinition {
  frequency: TrainingFrequency;
  label: string;
  shortLabel: string;
  splitName: string;
  description: string;
  days: MesocycleDay[];
  weeklySetsPerMuscle: number;
  restDaysCount: number;
  recommended: boolean;
}

export interface StrengthGainRange {
  minKg: number;
  maxKg: number;
}

export interface MesocyclePlan {
  frequency: TrainingFrequency;
  goal: TrainingGoal;
  split: MesocycleSplitDefinition;
  phases: MesocyclePhase[];
  projectedStrengthGainKg: number;
  projectedStrengthGainRange: StrengthGainRange;
  projectedVolumeIncreasePercent: number;
  summaryHeadline: string;
  benchmark1RmKg: number;
}

export const MESOCYCLE_SPLITS: Record<TrainingFrequency, MesocycleSplitDefinition> = {
  3: {
    frequency: 3,
    label: "3 Days / Week · Full Body Frequency",
    shortLabel: "3 Days / wk",
    splitName: "Full Body Kinetic Rotation (2–3×/wk Frequency)",
    description: "High-stimulus frequency. Hits each major muscle group 2–3× per week with 48h recovery windows between full-body bouts.",
    recommended: false,
    restDaysCount: 4,
    weeklySetsPerMuscle: 12,
    days: [
      {
        dayNumber: 1,
        name: "Full Body A (Quad & Incline Press Bias)",
        focus: "Incline Press, Hack Squat / Leg Press & Chest-Supported Rows",
        targetMuscles: ["Chest", "Quads", "Upper Back"],
      },
      {
        dayNumber: 2,
        name: "Full Body B (Posterior Chain & Vertical Pull)",
        focus: "Romanian Deadlift (RDL), Neutral Lat Pulldown & Seated Overhead Press",
        targetMuscles: ["Hamstrings", "Lats", "Shoulders"],
      },
      {
        dayNumber: 3,
        name: "Full Body C (Knee Flexion & Symmetry)",
        focus: "Walking Lunges / Split Squats, Dips / Cable Press & Weighted Pull-ups",
        targetMuscles: ["Quads/Glutes", "Triceps/Chest", "Lats/Biceps"],
      },
    ],
  },
  4: {
    frequency: 4,
    label: "4 Days / Week · Optimal Frequency (Recommended)",
    shortLabel: "4 Days / wk (Optimal)",
    splitName: "Upper / Lower Antagonistic Balance",
    description: "The gold standard for progressive overload. Hits each major muscle group 2× per week with 72h recovery windows.",
    recommended: true,
    restDaysCount: 3,
    weeklySetsPerMuscle: 16,
    days: [
      {
        dayNumber: 1,
        name: "Upper Frame A (Chest & Back)",
        focus: "Incline Press + Lat Width Focus",
        targetMuscles: ["Upper Chest", "Lats", "Shoulders"],
      },
      {
        dayNumber: 2,
        name: "Lower Kinetic A (Quad Bias)",
        focus: "Knee Flexion, Squat Depth & Core",
        targetMuscles: ["Quads", "Glutes", "Abdominals"],
      },
      {
        dayNumber: 3,
        name: "Upper Frame B (Shoulders & Arms)",
        focus: "Overhead Overhead Press + Scapular Retraction",
        targetMuscles: ["Shoulders", "Upper Back", "Arms"],
      },
      {
        dayNumber: 4,
        name: "Lower Kinetic B (Hinge Bias)",
        focus: "Posterior Chain, RDL & Hamstring Curl",
        targetMuscles: ["Hamstrings", "Glutes", "Lower Back"],
      },
    ],
  },
  5: {
    frequency: 5,
    label: "5 Days / Week · High-Volume Specialization",
    shortLabel: "5 Days / wk",
    splitName: "Upper / Lower / Push / Pull / Legs",
    description: "Maximum weekly volume distribution. Ideal for advanced trainees and aggressive hypertrophy acceleration.",
    recommended: false,
    restDaysCount: 2,
    weeklySetsPerMuscle: 20,
    days: [
      {
        dayNumber: 1,
        name: "Upper Frame Power",
        focus: "Heavy Compound Incline & Horizontal Row",
        targetMuscles: ["Chest", "Upper Back"],
      },
      {
        dayNumber: 2,
        name: "Lower Kinetic Quad Bias",
        focus: "Squat Mechanics & Unilateral Split Squats",
        targetMuscles: ["Quadriceps", "Calves"],
      },
      {
        dayNumber: 3,
        name: "Push Hypertrophy",
        focus: "Incline DB Press, Dips & Lateral Raises",
        targetMuscles: ["Chest", "Shoulders", "Triceps"],
      },
      {
        dayNumber: 4,
        name: "Pull & Rear Delts",
        focus: "Neutral Lat Pulldowns, Face Pulls & Biceps",
        targetMuscles: ["Lats", "Rear Deltoids", "Biceps"],
      },
      {
        dayNumber: 5,
        name: "Lower Kinetic Hinge Bias",
        focus: "RDLs, Hamstring Curls & Hip Thrusts",
        targetMuscles: ["Hamstrings", "Glutes"],
      },
    ],
  },
};

export const STANDARD_MESOCYCLE_PHASES: MesocyclePhase[] = [
  {
    phaseNumber: 1,
    weeks: "Weeks 1–4",
    name: "Accumulation & Structural Balance",
    focus: "Establish baseline volume, refine motor control, and fix clavicular/scapular imbalances.",
    overloadStrategy: "+1 rep per session until reaching the upper bound of the rep range.",
    rirTarget: 2,
  },
  {
    phaseNumber: 2,
    weeks: "Week 5",
    name: "Autoregulated Reactive Deload",
    focus: "50% volume drop, dissipate accumulated connective-tissue fatigue, resensitize satellite cells.",
    overloadStrategy: "Maintain working weight; drop sets from 4 to 2.",
    rirTarget: 4,
  },
  {
    phaseNumber: 3,
    weeks: "Weeks 6–11",
    name: "Intensification & Micro-Overload",
    focus: "Increase absolute load via 2.5kg micro-plates while sustaining mechanical tension.",
    overloadStrategy: "+2.5kg when all sets hit target rep ceiling at designated RIR.",
    rirTarget: 1,
  },
  {
    phaseNumber: 4,
    weeks: "Weeks 12–16",
    name: "Realization & Peak Symmetry",
    focus: "Maximal strength realization, benchmark re-test, and structural symmetry validation.",
    overloadStrategy: "Peak neural recruitment with top set testing at 0–1 RIR.",
    rirTarget: 1,
  },
];

/**
 * Resolves a customized 16-week mesocycle plan based on selected frequency,
 * training goal, and estimated starting strength baseline.
 */
export function resolveMesocyclePlan(
  frequency: TrainingFrequency = 4,
  goal: TrainingGoal = "hypertrophy",
  benchmark1RmKg: number = 80
): MesocyclePlan {
  const validFreq: TrainingFrequency = frequency === 3 || frequency === 5 ? frequency : 4;
  const validGoal: TrainingGoal = TRAINING_GOALS[goal] ? goal : "hypertrophy";
  const safeBenchmark = Math.min(500, Math.max(20, Number(benchmark1RmKg) || 80));

  const split = MESOCYCLE_SPLITS[validFreq] || MESOCYCLE_SPLITS[4];
  const goalConfig = TRAINING_GOALS[validGoal] || TRAINING_GOALS.hypertrophy;

  // Scientific projection models with empirical uncertainty bounds:
  // Novice/Early Intermediate periodized strength gains typically average 10-18% over a 16-week structured mesocycle.
  const freqFactor = validFreq === 5 ? 1.08 : validFreq === 3 ? 0.92 : 1.0;
  const minPercentage =
    validGoal === "strength" ? 0.12 : validGoal === "hypertrophy" ? 0.10 : 0.08;
  const maxPercentage =
    validGoal === "strength" ? 0.22 : validGoal === "hypertrophy" ? 0.18 : 0.14;

  const minKg = Number((safeBenchmark * minPercentage * freqFactor).toFixed(1));
  const maxKg = Number((safeBenchmark * maxPercentage * freqFactor).toFixed(1));
  const projectedStrengthGainKg = Number(((minKg + maxKg) / 2).toFixed(1));
  const projectedStrengthGainRange: StrengthGainRange = { minKg, maxKg };

  const projectedVolumeIncreasePercent = Math.round(
    (validFreq === 5 ? 26 : validFreq === 4 ? 20 : 14) * (validGoal === "hypertrophy" ? 1.15 : 1.0)
  );

  const summaryHeadline = `+${minKg} to +${maxKg} kg Projected Target Band · ${split.splitName}`;

  return {
    frequency: validFreq,
    goal: validGoal,
    split,
    phases: STANDARD_MESOCYCLE_PHASES,
    projectedStrengthGainKg,
    projectedStrengthGainRange,
    projectedVolumeIncreasePercent,
    summaryHeadline,
    benchmark1RmKg: safeBenchmark,
  };
}

/**
 * Persists user's selected mesocycle frequency and goal to user profile and store.
 */
export function saveUserMesocyclePreference(
  userId: string,
  frequency: TrainingFrequency,
  goal: TrainingGoal
): { success: boolean; programId?: string } {
  try {
    const validFreq: TrainingFrequency = frequency === 3 || frequency === 5 ? frequency : 4;
    const validGoal: TrainingGoal = TRAINING_GOALS[goal] ? goal : "hypertrophy";

    const user = appStore.getUser(userId);
    if (user) {
      user.goals = [validGoal];
    }

    const activeProgram = appStore.getActiveProgramForTrainee(userId);
    if (activeProgram) {
      activeProgram.title = `16-Week ${MESOCYCLE_SPLITS[validFreq].splitName} (${TRAINING_GOALS[validGoal].shortLabel})`;
      activeProgram.updatedAt = new Date().toISOString();
      return { success: true, programId: activeProgram.id };
    }

    return { success: true };
  } catch {
    return { success: false };
  }
}
