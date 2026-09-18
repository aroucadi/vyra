import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;

export function getDbPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export function getDb() {
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
