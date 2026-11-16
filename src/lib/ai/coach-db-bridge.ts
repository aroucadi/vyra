/**
 * Browser-Safe Coach Persistence Bridge (`src/lib/ai/coach-db-bridge.ts`)
 *
 * Decouples shared AI coaching logic (`athlete-model.ts`, `vertex-agent-loop.ts`) from
 * `src/db/coach-repository.ts` (`pg` / `drizzle-orm/node-postgres`) so Next.js Client Components
 * can share types and in-memory/localStorage stores without pulling Node.js built-ins
 * (`dns`, `fs`, `net`, `tls`) into browser bundles.
 */

import type { AthleteModel } from "./athlete-model";

export interface CoachShadowLogRecord {
  id: string;
  timestamp: string;
  traineeId: string;
  exerciseName: string;
  caseFileSeen: Record<string, unknown>;
  recommendedProposition: unknown;
  reasoningTrace: unknown[];
  safetyRailAudit: unknown;
  mutationApplied: false;
}

export interface CoachDbPersistenceAdapter {
  upsertAthleteModelInDb: (model: AthleteModel) => Promise<boolean>;
  loadAthleteModelFromDb: (traineeId: string) => Promise<AthleteModel | null>;
  insertShadowLogInDb: (entry: CoachShadowLogRecord) => Promise<boolean>;
  loadShadowLogsFromDb: (traineeId?: string) => Promise<CoachShadowLogRecord[]>;
  deleteShadowLogsMatchingSnapshotFromDb: (params: {
    snapshotId: string;
    traineeId?: string;
    base64Snippet?: string;
  }) => Promise<number>;
}

const BRIDGE_GLOBAL_KEY = "__vyraCoachDbPersistenceAdapter";

export function registerCoachDbPersistence(adapter: CoachDbPersistenceAdapter | null): void {
  (globalThis as Record<string, unknown>)[BRIDGE_GLOBAL_KEY] = adapter;
}

export async function getCoachDbPersistence(): Promise<CoachDbPersistenceAdapter | null> {
  if (typeof window !== "undefined") {
    return null;
  }

  const g = globalThis as Record<string, unknown>;
  const existing = g[BRIDGE_GLOBAL_KEY] as CoachDbPersistenceAdapter | null | undefined;
  if (existing) {
    return existing;
  }

  // Fallback lazy load for Node.js scripts & unit tests that invoke store DB sync
  // directly without first importing an API route. Computed path prevents bundler tracing
  // into browser chunks.
  try {
    const segs = ["..", "..", "db", "coach-repository"];
    const mod = (await import(segs.join("/"))) as Partial<CoachDbPersistenceAdapter>;
    if (typeof mod.upsertAthleteModelInDb === "function") {
      const adapter: CoachDbPersistenceAdapter = {
        upsertAthleteModelInDb: mod.upsertAthleteModelInDb,
        loadAthleteModelFromDb: mod.loadAthleteModelFromDb!,
        insertShadowLogInDb: mod.insertShadowLogInDb!,
        loadShadowLogsFromDb: mod.loadShadowLogsFromDb!,
        deleteShadowLogsMatchingSnapshotFromDb: mod.deleteShadowLogsMatchingSnapshotFromDb!,
      };
      g[BRIDGE_GLOBAL_KEY] = adapter;
      return adapter;
    }
  } catch {
    // No server DB driver available in edge/client runtime
  }

  return null;
}
