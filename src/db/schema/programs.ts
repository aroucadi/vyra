import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { exercises } from "./exercises";

export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  trainerId: text("trainer_id").references(() => users.id).notNull(),
  traineeId: text("trainee_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  durationWeeks: integer("duration_weeks").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  version: integer("version").notNull().default(1),
  parentVersionId: text("parent_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const programWeeks = pgTable("program_weeks", {
  id: text("id").primaryKey(),
  programId: text("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  weekIndex: integer("week_index").notNull(), // 1, 2, 3...
});

export const programDays = pgTable("program_days", {
  id: text("id").primaryKey(),
  weekId: text("week_id").references(() => programWeeks.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Mon ... 6 = Sun
  label: text("label").notNull(),
  isRestDay: boolean("is_rest_day").default(false).notNull(),
  morningRoutine: text("morning_routine").array(),
  nutrition: jsonb("nutrition"), // MealPlanPrescription JSON
});

export const blocks = pgTable("blocks", {
  id: text("id").primaryKey(),
  dayId: text("day_id").references(() => programDays.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
  type: text("type", { enum: ["straight", "superset", "circuit"] }).notNull().default("straight"),
});

export const exercisePrescriptions = pgTable("exercise_prescriptions", {
  id: text("id").primaryKey(),
  blockId: text("block_id").references(() => blocks.id, { onDelete: "cascade" }).notNull(),
  exerciseId: text("exercise_id").references(() => exercises.id).notNull(),
  exerciseName: text("exercise_name").notNull(),
  sets: integer("sets").notNull().default(3),
  repRangeLow: integer("rep_range_low").notNull().default(8),
  repRangeHigh: integer("rep_range_high").notNull().default(12),
  rirScheme: integer("rir_scheme").array(), // [2, 1, 0]
  restSeconds: integer("rest_seconds").notNull().default(90),
  loadGuidance: text("load_guidance"),
  formCueText: text("form_cue_text"),
  videoUrl: text("video_url"),
  wikiMuscleUrl: text("wiki_muscle_url"),
  targetMuscleGroups: text("target_muscle_groups").array(),
  equipmentVariations: jsonb("equipment_variations"), // EquipmentOption[]
  selectedEquipment: text("selected_equipment", { enum: ["machine", "dumbbell", "cable", "bodyweight"] }).default("machine"),
  hasDropSet: boolean("has_drop_set").default(false),
  dropSetGuidance: text("drop_set_guidance"),
});

export const supplementProtocols = pgTable("supplement_protocols", {
  id: text("id").primaryKey(),
  programId: text("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  programDayId: text("program_day_id").references(() => programDays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category", { enum: ["performance", "health", "recovery", "sleep"] }).notNull().default("performance"),
  phases: jsonb("phases").notNull(), // SupplementPhase[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplementLogs = pgTable("supplement_logs", {
  id: text("id").primaryKey(),
  traineeId: text("trainee_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  programId: text("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  protocolId: text("protocol_id").references(() => supplementProtocols.id, { onDelete: "cascade" }).notNull(),
  supplementName: text("supplement_name").notNull(),
  doseId: text("dose_id").notNull(),
  scheduledDate: text("scheduled_date").notNull(), // YYYY-MM-DD
  status: text("status", { enum: ["taken", "skipped", "pending"] }).notNull().default("pending"),
  takenAt: timestamp("taken_at"),
  notes: text("notes"),
});

export const hydrationGoals = pgTable("hydration_goals", {
  id: text("id").primaryKey(),
  programId: text("program_id").references(() => programs.id, { onDelete: "cascade" }).notNull(),
  traineeId: text("trainee_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  dailyTargetMl: integer("daily_target_ml").notNull().default(3500),
  workoutDayBonusMl: integer("workout_day_bonus_ml").default(500),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hydrationLogs = pgTable("hydration_logs", {
  id: text("id").primaryKey(),
  traineeId: text("trainee_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  amountMl: integer("amount_ml").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

