import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  role: text("role", { enum: ["trainer", "trainee", "both"] }).notNull().default("trainee"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  dob: text("dob"),
  sex: text("sex", { enum: ["male", "female", "other"] }),
  heightCm: integer("height_cm"),
  injuries: text("injuries").array(),
  goals: text("goals").array(),
  hideWeightFromTrainee: boolean("hide_weight_from_trainee").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainerLinks = pgTable("trainer_links", {
  id: text("id").primaryKey(),
  trainerId: text("trainer_id").references(() => users.id).notNull(),
  traineeId: text("trainee_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["active", "paused", "ended"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
