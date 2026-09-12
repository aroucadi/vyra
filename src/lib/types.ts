export type UserRole = "trainer" | "trainee" | "both";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl?: string;
  dob?: string;
  sex?: "male" | "female" | "other";
  heightCm?: number;
  injuries: string[];
  goals: string[];
  hideWeightFromTrainee?: boolean;
}

export interface TrainerLink {
  trainerId: string;
  traineeId: string;
  status: "active" | "paused" | "ended";
  createdAt: string;
}

export type BlockType = "straight" | "superset" | "circuit";
export type ProgramStatus = "draft" | "published" | "archived";

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  videoUrl?: string;
  wikiUrl?: string;
}

export interface ExercisePrescription {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  repRangeLow: number;
  repRangeHigh: number;
  rirScheme: number[]; // e.g. [2, 1, 0]
  restSeconds: number; // e.g. 90
  loadGuidance?: string; // e.g. "Double progression: add weight when hitting 10 reps on all sets"
  formCueText?: string; // e.g. "Pause on sternum, tuck elbows 45°"
  videoUrl?: string;
  wikiMuscleUrl?: string;
  targetMuscleGroups: string[];
}

export interface Block {
  id: string;
  order: number;
  type: BlockType;
  exercises: ExercisePrescription[];
}

export interface MealPlanPrescription {
  targetKcal?: number;
  targetProteinGrams: number;
  preWorkoutTiming?: string;
  preWorkoutFoods?: string;
  supplements: { name: string; dosage: string; timing: string; checked?: boolean }[];
  notes?: string;
}

export interface ProgramDay {
  id: string;
  weekId: string;
  dayOfWeek: number; // 0 = Mon, 1 = Tue, ..., 6 = Sun
  label: string; // e.g. "Push Hypertrophy A"
  isRestDay: boolean;
  morningRoutine: string[];
  blocks: Block[];
  nutrition: MealPlanPrescription;
}

export interface ProgramWeek {
  id: string;
  programId: string;
  weekIndex: number; // 1, 2, 3, 4...
  days: ProgramDay[];
}

export interface Program {
  id: string;
  trainerId: string;
  traineeId: string;
  title: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string; // ISO date string YYYY-MM-DD
  durationWeeks: number;
  status: ProgramStatus;
  version: number;
  parentVersionId?: string;
  weeks: ProgramWeek[];
  createdAt: string;
  updatedAt: string;
}

export interface SetLog {
  id: string;
  exercisePrescriptionId: string;
  exerciseName: string;
  setIndex: number; // 1-indexed
  reps: number;
  weightKg: number;
  rirAchieved: number;
  isPR?: boolean;
}

export interface WorkoutSession {
  id: string;
  traineeId: string;
  programDayId: string;
  programTitle: string;
  dayLabel: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO timestamp
  endedAt?: string; // ISO timestamp
  durationSec: number;
  setLogs: SetLog[];
  notes?: string;
}

export interface BodyMetricEntry {
  id: string;
  traineeId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  source: "manual" | "synced";
}

export interface TraineeRosterItem {
  trainee: User;
  activeProgram?: Program;
  currentWeekIndex: number;
  adherencePercentage: number;
  lastSessionDate?: string;
  alerts: {
    type: "missed_sessions" | "plateau" | "optimal";
    message: string;
  }[];
  totalVolumeKg: number;
}
