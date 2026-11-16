import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;
let customInjectedPool: Pool | null = null;

/**
 * Allows injecting a custom `pg.Pool` (or in-memory Postgres-compatible Pool adapter in tests)
 * so the real `drizzle-orm/node-postgres` query builder and schema can be exercised in CI
 * even when an external Postgres daemon is not running locally.
 */
export function setCustomDbPool(injectedPool: Pool | null): void {
  customInjectedPool = injectedPool;
}

export function getDbPool(): Pool | null {
  if (customInjectedPool) {
    return customInjectedPool;
  }
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> | null {
  const currentPool = getDbPool();
  if (!currentPool) {
    return null;
  }
  return drizzle(currentPool, { schema });
}

export const db = process.env.DATABASE_URL
  ? drizzle(
      new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      }),
      { schema }
    )
  : null;

export * from "./schema";

