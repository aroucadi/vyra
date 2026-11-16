import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const athleteModels = pgTable("athlete_models", {
  traineeId: text("trainee_id").primaryKey(),
  version: integer("version").notNull().default(1),
  staticProfileJson: jsonb("static_profile_json").notNull(),
  dynamicStateJson: jsonb("dynamic_state_json").notNull(),
  lastMacroReviewDate: text("last_macro_review_date"),
  lastWeeklyReviewDate: text("last_weekly_review_date"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coachingExperiments = pgTable("coaching_experiments", {
  id: text("id").primaryKey(),
  traineeId: text("trainee_id").notNull(),
  startDate: text("start_date").notNull(),
  targetReviewDate: text("target_review_date").notNull(),
  category: text("category").notNull(),
  hypothesis: text("hypothesis").notNull(),
  actionTaken: text("action_taken").notNull(),
  successMetric: text("success_metric").notNull(),
  status: text("status").notNull().default("active"),
  outcome: text("outcome"),
  reviewOutcome: text("review_outcome"),
  resolvedAt: text("resolved_at"),
  evidenceSnapshotJson: jsonb("evidence_snapshot_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coachShadowLogs = pgTable("coach_shadow_logs", {
  id: text("id").primaryKey(),
  traineeId: text("trainee_id").notNull(),
  exerciseName: text("exercise_name").notNull(),
  caseFileSeenJson: jsonb("case_file_seen_json").notNull(),
  recommendedPropositionJson: jsonb("recommended_proposition_json").notNull(),
  reasoningTraceJson: jsonb("reasoning_trace_json").notNull(),
  safetyRailAuditJson: jsonb("safety_rail_audit_json").notNull(),
  mutationApplied: boolean("mutation_applied").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
