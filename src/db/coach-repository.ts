/**
 * Drizzle PostgreSQL Repository for AI Coach (`src/db/coach-repository.ts`)
 *
 * Connects the Drizzle schema (`athleteModels`, `coachingExperiments`, `coachShadowLogs`
 * in `src/db/schema/coach.ts`) to `AthleteModelStore` and `vertex-agent-loop.ts` so
 * multi-user coaching state and experiments persist across Cloud Run container restarts.
 */

import { eq } from "drizzle-orm";
import type { Pool } from "pg";
import { getDb, getDbPool } from "./index";
import { athleteModels, coachingExperiments, coachShadowLogs } from "./schema/coach";
import type { AthleteModel, CoachingExperiment } from "../lib/ai/athlete-model";
import {
  registerCoachDbPersistence,
  type CoachShadowLogRecord,
} from "../lib/ai/coach-db-bridge";

export type PersistedShadowLogRecord = CoachShadowLogRecord;

let tablesEnsuredForPool: Pool | null = null;

/**
 * Ensures the 3 coach tables (`athlete_models`, `coaching_experiments`, `coach_shadow_logs`)
 * exist in PostgreSQL when connected via `DATABASE_URL` on Cloud Run.
 */
export async function ensureCoachTablesExist(): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;
  if (tablesEnsuredForPool === pool) return true;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "athlete_models" (
        "trainee_id" text PRIMARY KEY NOT NULL,
        "version" integer DEFAULT 1 NOT NULL,
        "static_profile_json" jsonb NOT NULL,
        "dynamic_state_json" jsonb NOT NULL,
        "last_macro_review_date" text,
        "last_weekly_review_date" text,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "coaching_experiments" (
        "id" text PRIMARY KEY NOT NULL,
        "trainee_id" text NOT NULL,
        "start_date" text NOT NULL,
        "target_review_date" text NOT NULL,
        "category" text NOT NULL,
        "hypothesis" text NOT NULL,
        "action_taken" text NOT NULL,
        "success_metric" text NOT NULL,
        "status" text DEFAULT 'active' NOT NULL,
        "outcome" text,
        "review_outcome" text,
        "resolved_at" text,
        "evidence_snapshot_json" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "coach_shadow_logs" (
        "id" text PRIMARY KEY NOT NULL,
        "trainee_id" text NOT NULL,
        "exercise_name" text NOT NULL,
        "case_file_seen_json" jsonb NOT NULL,
        "recommended_proposition_json" jsonb NOT NULL,
        "reasoning_trace_json" jsonb NOT NULL,
        "safety_rail_audit_json" jsonb NOT NULL,
        "mutation_applied" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    tablesEnsuredForPool = pool;
    return true;
  } catch {
    return false;
  }
}

/**
 * Upserts an `AthleteModel` and all of its `activeExperiments` + `resolvedExperiments`
 * into PostgreSQL via Drizzle ORM (`athleteModels` and `coachingExperiments`).
 */
export async function upsertAthleteModelInDb(model: AthleteModel): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  await ensureCoachTablesExist();
  const updatedAtDate = model.lastUpdated ? new Date(model.lastUpdated) : new Date();

  await db
    .insert(athleteModels)
    .values({
      traineeId: model.traineeId,
      version: model.version,
      staticProfileJson: model.static,
      dynamicStateJson: model.dynamic,
      lastMacroReviewDate: model.lastMacroReviewDate ?? null,
      lastWeeklyReviewDate: model.lastWeeklyReviewDate ?? null,
      updatedAt: updatedAtDate,
    })
    .onConflictDoUpdate({
      target: athleteModels.traineeId,
      set: {
        version: model.version,
        staticProfileJson: model.static,
        dynamicStateJson: model.dynamic,
        lastMacroReviewDate: model.lastMacroReviewDate ?? null,
        lastWeeklyReviewDate: model.lastWeeklyReviewDate ?? null,
        updatedAt: updatedAtDate,
      },
    });

  const allExperiments: CoachingExperiment[] = [
    ...(model.activeExperiments || []),
    ...(model.resolvedExperiments || []),
  ];

  for (const exp of allExperiments) {
    await db
      .insert(coachingExperiments)
      .values({
        id: exp.id,
        traineeId: exp.traineeId,
        startDate: exp.startDate,
        targetReviewDate: exp.targetReviewDate,
        category: exp.category,
        hypothesis: exp.hypothesis,
        actionTaken: exp.actionTaken,
        successMetric: exp.successMetric,
        status: exp.status,
        outcome: exp.outcome ?? null,
        reviewOutcome: exp.reviewOutcome ?? null,
        resolvedAt: exp.resolvedAt ?? null,
        evidenceSnapshotJson: exp.evidenceSnapshot ?? null,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: coachingExperiments.id,
        set: {
          targetReviewDate: exp.targetReviewDate,
          status: exp.status,
          outcome: exp.outcome ?? null,
          reviewOutcome: exp.reviewOutcome ?? null,
          resolvedAt: exp.resolvedAt ?? null,
          evidenceSnapshotJson: exp.evidenceSnapshot ?? null,
        },
      });
  }

  return true;
}

/**
 * Loads an `AthleteModel` and its `CoachingExperiment` history from PostgreSQL via Drizzle ORM.
 */
export async function loadAthleteModelFromDb(
  traineeId: string
): Promise<AthleteModel | null> {
  const db = getDb();
  if (!db) return null;

  await ensureCoachTablesExist();

  const rows = await db
    .select()
    .from(athleteModels)
    .where(eq(athleteModels.traineeId, traineeId));

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const expRows = await db
    .select()
    .from(coachingExperiments)
    .where(eq(coachingExperiments.traineeId, traineeId));

  const mappedExperiments: CoachingExperiment[] = (expRows || []).map((r) => ({
    id: r.id,
    traineeId: r.traineeId,
    startDate: r.startDate,
    targetReviewDate: r.targetReviewDate,
    category: r.category as CoachingExperiment["category"],
    hypothesis: r.hypothesis,
    actionTaken: r.actionTaken,
    successMetric: r.successMetric,
    status: r.status as CoachingExperiment["status"],
    outcome: (r.outcome as CoachingExperiment["outcome"]) || undefined,
    reviewOutcome: r.reviewOutcome || undefined,
    resolvedAt: r.resolvedAt || undefined,
    evidenceSnapshot:
      (r.evidenceSnapshotJson as CoachingExperiment["evidenceSnapshot"]) || undefined,
  }));

  const activeExperiments = mappedExperiments.filter((e) => e.status === "active");
  const resolvedExperiments = mappedExperiments.filter((e) => e.status !== "active");

  const updatedAtIso =
    row.updatedAt instanceof Date && !Number.isNaN(row.updatedAt.getTime())
      ? row.updatedAt.toISOString()
      : typeof row.updatedAt === "string"
        ? row.updatedAt
        : new Date().toISOString();

  return {
    traineeId: row.traineeId,
    version: row.version,
    lastUpdated: updatedAtIso,
    lastMacroReviewDate: row.lastMacroReviewDate || undefined,
    lastWeeklyReviewDate: row.lastWeeklyReviewDate || undefined,
    static:
      typeof row.staticProfileJson === "string"
        ? (JSON.parse(row.staticProfileJson) as AthleteModel["static"])
        : (row.staticProfileJson as AthleteModel["static"]),
    dynamic:
      typeof row.dynamicStateJson === "string"
        ? (JSON.parse(row.dynamicStateJson) as AthleteModel["dynamic"])
        : (row.dynamicStateJson as AthleteModel["dynamic"]),
    activeExperiments,
    resolvedExperiments,
  };
}

/**
 * Persists a shadow-mode coaching log entry into `coach_shadow_logs` via Drizzle ORM.
 */
export async function insertShadowLogInDb(
  entry: PersistedShadowLogRecord
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  await ensureCoachTablesExist();

  await db
    .insert(coachShadowLogs)
    .values({
      id: entry.id,
      traineeId: entry.traineeId,
      exerciseName: entry.exerciseName,
      caseFileSeenJson: entry.caseFileSeen,
      recommendedPropositionJson: (entry.recommendedProposition ?? {}) as Record<
        string,
        unknown
      >,
      reasoningTraceJson: entry.reasoningTrace,
      safetyRailAuditJson: (entry.safetyRailAudit ?? {}) as Record<string, unknown>,
      mutationApplied: false,
      createdAt: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    })
    .onConflictDoUpdate({
      target: coachShadowLogs.id,
      set: {
        caseFileSeenJson: entry.caseFileSeen,
        recommendedPropositionJson: (entry.recommendedProposition ?? {}) as Record<
          string,
          unknown
        >,
        reasoningTraceJson: entry.reasoningTrace,
        safetyRailAuditJson: (entry.safetyRailAudit ?? {}) as Record<string, unknown>,
      },
    });

  return true;
}

/**
 * Loads persisted shadow-mode logs from `coach_shadow_logs` via Drizzle ORM.
 */
export async function loadShadowLogsFromDb(
  traineeId?: string
): Promise<PersistedShadowLogRecord[]> {
  const db = getDb();
  if (!db) return [];

  await ensureCoachTablesExist();

  const rows = traineeId
    ? await db
        .select()
        .from(coachShadowLogs)
        .where(eq(coachShadowLogs.traineeId, traineeId))
    : await db.select().from(coachShadowLogs);

  return (rows || []).map((r) => ({
    id: r.id,
    timestamp:
      r.createdAt instanceof Date && !Number.isNaN(r.createdAt.getTime())
        ? r.createdAt.toISOString()
        : String(r.createdAt),
    traineeId: r.traineeId,
    exerciseName: r.exerciseName,
    caseFileSeen:
      typeof r.caseFileSeenJson === "string"
        ? JSON.parse(r.caseFileSeenJson)
        : (r.caseFileSeenJson as Record<string, unknown>),
    recommendedProposition:
      typeof r.recommendedPropositionJson === "string"
        ? JSON.parse(r.recommendedPropositionJson)
        : r.recommendedPropositionJson,
    reasoningTrace:
      typeof r.reasoningTraceJson === "string"
        ? JSON.parse(r.reasoningTraceJson)
        : (r.reasoningTraceJson as unknown[]),
    safetyRailAudit:
      typeof r.safetyRailAuditJson === "string"
        ? JSON.parse(r.safetyRailAuditJson)
        : r.safetyRailAuditJson,
    mutationApplied: false,
  }));
}

/**
 * Deletes any row in `coach_shadow_logs` referencing a deleted snapshot ID or base64 payload.
 */
export async function deleteShadowLogsMatchingSnapshotFromDb(params: {
  snapshotId: string;
  traineeId?: string;
  base64Snippet?: string;
}): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  await ensureCoachTablesExist();
  const rows = await loadShadowLogsFromDb(params.traineeId);
  let deletedCount = 0;

  for (const row of rows) {
    const serialized = JSON.stringify(row);
    const matchesId = serialized.includes(params.snapshotId);
    const matchesBase64 = Boolean(
      params.base64Snippet &&
        params.base64Snippet.length >= 16 &&
        serialized.includes(params.base64Snippet)
    );
    if (matchesId || matchesBase64) {
      await db.delete(coachShadowLogs).where(eq(coachShadowLogs.id, row.id));
      deletedCount += 1;
    }
  }
  return deletedCount;
}

/**
 * Creates a `pg.Pool`-compatible in-memory PostgreSQL driver for testing `drizzle(pool, { schema })`
 * in CI / unit tests when an external Postgres daemon is not running.
 * Executes real Drizzle SQL queries (`insert into "athlete_models"`, `select ... from "coaching_experiments"`,
 * `insert into "coach_shadow_logs"`, `delete from "coach_shadow_logs"`) and returns array-mode or object-mode
 * rows matching `drizzle-orm/node-postgres`.
 */
export function createInMemoryPostgresPoolForTesting(): {
  pool: Pool;
  executedQueries: Array<{ sql: string; params: unknown[] }>;
  tables: {
    athleteModels: Map<string, any[]>;
    coachingExperiments: Map<string, any[]>;
    coachShadowLogs: Map<string, any[]>;
  };
} {
  const executedQueries: Array<{ sql: string; params: unknown[] }> = [];
  const athleteModelsTable = new Map<string, any[]>();
  const coachingExperimentsTable = new Map<string, any[]>();
  const coachShadowLogsTable = new Map<string, any[]>();

  const parseJsonParam = (val: unknown) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const mockPool = {
    query: async (
      queryTextOrConfig: string | { text: string; values?: unknown[]; rowMode?: string },
      valuesArg?: unknown[]
    ) => {
      const sqlText =
        typeof queryTextOrConfig === "string"
          ? queryTextOrConfig
          : queryTextOrConfig.text;
      const params =
        valuesArg ??
        (typeof queryTextOrConfig === "object" && Array.isArray(queryTextOrConfig.values)
          ? queryTextOrConfig.values
          : []);
      const normSql = sqlText.trim().replace(/\s+/g, " ");
      executedQueries.push({ sql: normSql, params });

      // 1. CREATE TABLE DDL
      if (/^CREATE TABLE IF NOT EXISTS/i.test(normSql)) {
        return { rows: [], rowCount: 0 };
      }

      // 2. INSERT / UPSERT INTO "athlete_models"
      // Columns: [trainee_id, version, static_profile_json, dynamic_state_json, last_macro_review_date, last_weekly_review_date, updated_at]
      if (/^insert into "athlete_models"/i.test(normSql)) {
        const traineeId = String(params[0]);
        const rowArray = [
          traineeId,
          Number(params[1] ?? 1),
          parseJsonParam(params[2]),
          parseJsonParam(params[3]),
          params[4] ?? null,
          params[5] ?? null,
          params[6] instanceof Date ? params[6] : new Date(String(params[6] ?? Date.now())),
        ];
        athleteModelsTable.set(traineeId, rowArray);
        return { rows: [], rowCount: 1 };
      }

      // 3. SELECT FROM "athlete_models"
      if (/^select .* from "athlete_models"/i.test(normSql)) {
        const filterTraineeId = params.length > 0 ? String(params[0]) : undefined;
        const rows: any[][] = [];
        if (filterTraineeId) {
          const found = athleteModelsTable.get(filterTraineeId);
          if (found) rows.push(found);
        } else {
          for (const r of athleteModelsTable.values()) rows.push(r);
        }
        return { rows, rowCount: rows.length };
      }

      // 4. INSERT / UPSERT INTO "coaching_experiments"
      // Columns: [id, trainee_id, start_date, target_review_date, category, hypothesis, action_taken, success_metric, status, outcome, review_outcome, resolved_at, evidence_snapshot_json, created_at]
      if (/^insert into "coaching_experiments"/i.test(normSql)) {
        const id = String(params[0]);
        const rowArray = [
          id,
          String(params[1]),
          String(params[2]),
          String(params[3]),
          String(params[4]),
          String(params[5]),
          String(params[6]),
          String(params[7]),
          String(params[8] ?? "active"),
          params[9] ?? null,
          params[10] ?? null,
          params[11] ?? null,
          parseJsonParam(params[12] ?? null),
          params[13] instanceof Date ? params[13] : new Date(String(params[13] ?? Date.now())),
        ];
        coachingExperimentsTable.set(id, rowArray);
        return { rows: [], rowCount: 1 };
      }

      // 5. SELECT FROM "coaching_experiments"
      if (/^select .* from "coaching_experiments"/i.test(normSql)) {
        const filterTraineeId = params.length > 0 ? String(params[0]) : undefined;
        const rows: any[][] = [];
        for (const r of coachingExperimentsTable.values()) {
          if (!filterTraineeId || r[1] === filterTraineeId) {
            rows.push(r);
          }
        }
        return { rows, rowCount: rows.length };
      }

      // 6. INSERT / UPSERT INTO "coach_shadow_logs"
      // Columns: [id, trainee_id, exercise_name, case_file_seen_json, recommended_proposition_json, reasoning_trace_json, safety_rail_audit_json, mutation_applied, created_at]
      if (/^insert into "coach_shadow_logs"/i.test(normSql)) {
        const id = String(params[0]);
        const rowArray = [
          id,
          String(params[1]),
          String(params[2]),
          parseJsonParam(params[3]),
          parseJsonParam(params[4]),
          parseJsonParam(params[5]),
          parseJsonParam(params[6]),
          Boolean(params[7] ?? false),
          params[8] instanceof Date ? params[8] : new Date(String(params[8] ?? Date.now())),
        ];
        coachShadowLogsTable.set(id, rowArray);
        return { rows: [], rowCount: 1 };
      }

      // 7. SELECT FROM "coach_shadow_logs"
      if (/^select .* from "coach_shadow_logs"/i.test(normSql)) {
        const filterTraineeId = params.length > 0 ? String(params[0]) : undefined;
        const rows: any[][] = [];
        for (const r of coachShadowLogsTable.values()) {
          if (!filterTraineeId || r[1] === filterTraineeId) {
            rows.push(r);
          }
        }
        return { rows, rowCount: rows.length };
      }

      // 8. DELETE FROM "coach_shadow_logs"
      if (/^delete from "coach_shadow_logs"/i.test(normSql)) {
        const targetId = params.length > 0 ? String(params[0]) : undefined;
        let deleted = 0;
        if (targetId && coachShadowLogsTable.has(targetId)) {
          coachShadowLogsTable.delete(targetId);
          deleted = 1;
        }
        return { rows: [], rowCount: deleted };
      }

      return { rows: [], rowCount: 0 };
    },
  } as unknown as Pool;

  return {
    pool: mockPool,
    executedQueries,
    tables: {
      athleteModels: athleteModelsTable,
      coachingExperiments: coachingExperimentsTable,
      coachShadowLogs: coachShadowLogsTable,
    },
  };
}

registerCoachDbPersistence({
  upsertAthleteModelInDb,
  loadAthleteModelFromDb,
  insertShadowLogInDb,
  loadShadowLogsFromDb,
  deleteShadowLogsMatchingSnapshotFromDb,
});
