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
});
