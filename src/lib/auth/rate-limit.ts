/**
 * Zero-dependency L1 sliding-window + L2 Cloud Firestore distributed rate limiter
 * for AI, Auth, and Upload API routes (zero extra Redis/infra cost).
 */

import { getFirestoreDb, isFirestoreRuntimeAvailable } from "@/lib/firebase/admin";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
  retryAfterSeconds: number;
  layer?: "memory_l1" | "firestore_l2";
}

const MAX_BUCKETS = 2000;
const requestBuckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 },
  nowMs: number = Date.now()
): RateLimitResult {
  const windowStart = nowMs - config.windowMs;
  const existing = requestBuckets.get(key) || [];
  const activeTimestamps = existing.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= config.maxRequests) {
    requestBuckets.set(key, activeTimestamps);
    const oldest = activeTimestamps[0] || nowMs;
    const resetAfterMs = Math.max(100, oldest + config.windowMs - nowMs);
    return {
      allowed: false,
      remaining: 0,
      resetAfterMs,
      retryAfterSeconds: Math.max(1, Math.ceil(resetAfterMs / 1000)),
      layer: "memory_l1",
    };
  }

  activeTimestamps.push(nowMs);
  requestBuckets.set(key, activeTimestamps);

  // Bounded memory eviction if map grows past cap
  if (requestBuckets.size > MAX_BUCKETS) {
    for (const [k, timestamps] of requestBuckets.entries()) {
      const fresh = timestamps.filter((ts) => ts > windowStart);
      if (fresh.length === 0) {
        requestBuckets.delete(k);
      }
      if (requestBuckets.size <= MAX_BUCKETS * 0.8) break;
    }
    if (requestBuckets.size > MAX_BUCKETS) {
      const firstKey = requestBuckets.keys().next().value;
      if (firstKey !== undefined) {
        requestBuckets.delete(firstKey);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - activeTimestamps.length),
    resetAfterMs: config.windowMs,
    retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    layer: "memory_l1",
  };
}

function sanitizeRateLimitDocId(key: string): string {
  return key.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 140) || "default_bucket";
}

/**
 * Distributed L1 (in-memory fail-fast) + L2 (Cloud Firestore atomic transaction)
 * rate limiter shared across Cloud Run instances without Redis cost.
 * Falls back cleanly to L1 if Firestore is unavailable offline or in unit tests.
 */
export async function checkDistributedRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 },
  nowMs: number = Date.now()
): Promise<RateLimitResult> {
  // L1 fail-fast prevents unnecessary Firestore writes under single-instance bursts
  const l1 = checkRateLimit(key, config, nowMs);
  if (!l1.allowed) {
    return l1;
  }

  if (!isFirestoreRuntimeAvailable()) {
    return l1;
  }

  try {
    const db = getFirestoreDb();
    if (typeof db.runTransaction !== "function") {
      return l1;
    }
    const docRef = db.collection("rateLimits").doc(sanitizeRateLimitDocId(key));

    const l2Result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = snap.exists
        ? (snap.data() as { count?: number; windowStartedAtMs?: number } | undefined)
        : undefined;

      const prevStarted = typeof data?.windowStartedAtMs === "number" ? data.windowStartedAtMs : 0;
      const prevCount = typeof data?.count === "number" ? data.count : 0;

      if (!snap.exists || nowMs - prevStarted >= config.windowMs) {
        tx.set(docRef, {
          key,
          count: 1,
          windowStartedAtMs: nowMs,
          updatedAtMs: nowMs,
          expiresAt: new Date(nowMs + config.windowMs * 2),
        });
        return {
          allowed: true,
          remaining: Math.max(0, config.maxRequests - 1),
          resetAfterMs: config.windowMs,
          retryAfterSeconds: Math.ceil(config.windowMs / 1000),
          layer: "firestore_l2" as const,
        };
      }

      if (prevCount >= config.maxRequests) {
        const resetAfterMs = Math.max(100, prevStarted + config.windowMs - nowMs);
        return {
          allowed: false,
          remaining: 0,
          resetAfterMs,
          retryAfterSeconds: Math.max(1, Math.ceil(resetAfterMs / 1000)),
          layer: "firestore_l2" as const,
        };
      }

      const nextCount = prevCount + 1;
      tx.set(
        docRef,
        {
          count: nextCount,
          updatedAtMs: nowMs,
        },
        { merge: true }
      );

      const resetAfterMs = Math.max(100, prevStarted + config.windowMs - nowMs);
      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - nextCount),
        resetAfterMs,
        retryAfterSeconds: Math.max(1, Math.ceil(resetAfterMs / 1000)),
        layer: "firestore_l2" as const,
      };
    });

    return l2Result;
  } catch {
    // Non-fatal fallback: keep APIs resilient using L1 if Firestore transaction fails transiently
    return l1;
  }
}

export function resolveRateLimitKey(req: Request, scope: string, traineeId?: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "local";
  const actor = traineeId && traineeId.trim() ? traineeId.trim() : clientIp;
  return `${scope}:${actor}:${clientIp}`;
}

export function clearRateLimitBucketsForTesting(): void {
  requestBuckets.clear();
}
