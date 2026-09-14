import { pgTable, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { users } from "./users";
import { programDays, exercisePrescriptions } from "./programs";

export const workoutSessions = pgTable("workout_sessions", {
  id: text("id").primaryKey(),
  traineeId: text("trainee_id").references(() => users.id).notNull(),
  programDayId: text("program_day_id").references(() => programDays.id).notNull(),
  programTitle: text("program_title").notNull(),
  dayLabel: text("day_label").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationSec: integer("duration_sec").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const setLogs = pgTable("set_logs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => workoutSessions.id, { onDelete: "cascade" }).notNull(),
  exercisePrescriptionId: text("exercise_prescription_id").references(() => exercisePrescriptions.id).notNull(),
  exerciseName: text("exercise_name").notNull(),
  setIndex: integer("set_index").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull(),
  rirAchieved: integer("rir_achieved").notNull(),
  isPR: boolean("is_pr").default(false).notNull(),
  selectedEquipment: text("selected_equipment", { enum: ["machine", "dumbbell", "cable", "bodyweight"] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
