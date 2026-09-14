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

export type EquipmentType = "machine" | "dumbbell" | "cable" | "bodyweight";

export interface EquipmentOption {
  equipmentType: EquipmentType;
  exerciseName: string;
  formCue: string;
  videoUrl?: string;
  targetFocus?: string;
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
  equipmentVariations?: EquipmentOption[];
  selectedEquipment?: EquipmentType;
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

export type SupplementTimingType = "standalone" | "meal_linked";
export type StandaloneTiming =
  | "on_waking"
  | "morning"
  | "pre_workout"
  | "intra_workout"
  | "post_workout"
  | "afternoon"
  | "with_dinner"
  | "pre_bed";

export interface SupplementDosePrescription {
  id: string;
  doseOrder: number;
  amount: number;
  unit: "g" | "mg" | "IU" | "capsules" | "scoop" | "ml";
  timingType: SupplementTimingType;
  mealLabel?: string; // e.g. "Meal 1: Breakfast", "Post-Workout Shake"
  standaloneTiming?: StandaloneTiming;
  targetTime?: string; // e.g. "07:30"
  notes?: string;
}

export interface SupplementPhase {
  phaseIndex: number;
  name: string; // e.g. "Loading Phase", "Maintenance"
  startDay: number; // 1-indexed relative to program start
  endDay?: number; // inclusive, undefined/null = end of program
  doses: SupplementDosePrescription[];
}

export interface SupplementProtocol {
  id: string;
  programId: string;
  programDayId?: string; // optional day override
  name: string; // e.g. "Creatine Monohydrate"
  category: "performance" | "health" | "recovery" | "sleep";
  phases: SupplementPhase[];
}

export interface SupplementLog {
  id: string;
  traineeId: string;
  programId: string;
  protocolId: string;
  supplementName: string;
  doseId: string;
  scheduledDate: string; // YYYY-MM-DD
  status: "taken" | "skipped" | "pending";
  takenAt?: string; // ISO timestamp
  notes?: string;
}

export interface HydrationGoal {
  id: string;
  programId: string;
  traineeId: string;
  dailyTargetMl: number; // e.g. 3500
  workoutDayBonusMl?: number; // e.g. 500
}

export interface HydrationLog {
  id: string;
  traineeId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  loggedAt: string;
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
  supplementOverrides?: SupplementProtocol[];
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
  supplementProtocols?: SupplementProtocol[];
  hydrationGoal?: HydrationGoal;
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
  supplementAdherencePercentage?: number;
  hydrationAdherencePercentage?: number;
  lastSessionDate?: string;
  alerts: {
    type: "missed_sessions" | "plateau" | "optimal";
    message: string;
  }[];
  totalVolumeKg: number;
}
