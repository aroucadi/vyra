/**
 * Zero-dependency sliding-window rate limiter for AI and mutation API routes.
 * Keeps memory strictly bounded (LRU-style eviction above MAX_BUCKETS).
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
  retryAfterSeconds: number;
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
  };
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
