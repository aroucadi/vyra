import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { users } from "./users";

export const bodyMetricEntries = pgTable("body_metric_entries", {
  id: text("id").primaryKey(),
  traineeId: text("trainee_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  weightKg: real("weight_kg").notNull(),
  source: text("source", { enum: ["manual", "synced"] }).notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
