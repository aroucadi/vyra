import { relations } from "drizzle-orm";
import { users } from "./users";
import {
  programs,
  programWeeks,
  programDays,
  blocks,
  exercisePrescriptions,
  supplementProtocols,
  supplementLogs,
  hydrationGoals,
  hydrationLogs,
} from "./programs";
import { workoutSessions, setLogs } from "./sessions";
import { bodyMetricEntries } from "./metrics";

export * from "./users";
export * from "./programs";
export * from "./exercises";
export * from "./sessions";
export * from "./metrics";

export const usersRelations = relations(users, ({ many }) => ({
  trainedPrograms: many(programs, { relationName: "trainerPrograms" }),
  traineePrograms: many(programs, { relationName: "traineePrograms" }),
  workoutSessions: many(workoutSessions),
  metrics: many(bodyMetricEntries),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  trainer: one(users, {
    fields: [programs.trainerId],
    references: [users.id],
    relationName: "trainerPrograms",
  }),
  trainee: one(users, {
    fields: [programs.traineeId],
    references: [users.id],
    relationName: "traineePrograms",
  }),
  weeks: many(programWeeks),
}));

export const programWeeksRelations = relations(programWeeks, ({ one, many }) => ({
  program: one(programs, {
    fields: [programWeeks.programId],
    references: [programs.id],
  }),
  days: many(programDays),
}));

export const programDaysRelations = relations(programDays, ({ one, many }) => ({
  week: one(programWeeks, {
    fields: [programDays.weekId],
    references: [programWeeks.id],
  }),
  blocks: many(blocks),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  day: one(programDays, {
    fields: [blocks.dayId],
    references: [programDays.id],
  }),
  prescriptions: many(exercisePrescriptions),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  trainee: one(users, {
    fields: [workoutSessions.traineeId],
    references: [users.id],
  }),
  setLogs: many(setLogs),
}));

export const setLogsRelations = relations(setLogs, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [setLogs.sessionId],
    references: [workoutSessions.id],
  }),
}));

export const supplementProtocolsRelations = relations(supplementProtocols, ({ one, many }) => ({
  program: one(programs, {
    fields: [supplementProtocols.programId],
    references: [programs.id],
  }),
  day: one(programDays, {
    fields: [supplementProtocols.programDayId],
    references: [programDays.id],
  }),
  logs: many(supplementLogs),
}));

export const supplementLogsRelations = relations(supplementLogs, ({ one }) => ({
  trainee: one(users, {
    fields: [supplementLogs.traineeId],
    references: [users.id],
  }),
  program: one(programs, {
    fields: [supplementLogs.programId],
    references: [programs.id],
  }),
  protocol: one(supplementProtocols, {
    fields: [supplementLogs.protocolId],
    references: [supplementProtocols.id],
  }),
}));

export const hydrationGoalsRelations = relations(hydrationGoals, ({ one }) => ({
  trainee: one(users, {
    fields: [hydrationGoals.traineeId],
    references: [users.id],
  }),
  program: one(programs, {
    fields: [hydrationGoals.programId],
    references: [programs.id],
  }),
}));

export const hydrationLogsRelations = relations(hydrationLogs, ({ one }) => ({
  trainee: one(users, {
    fields: [hydrationLogs.traineeId],
    references: [users.id],
  }),
}));

