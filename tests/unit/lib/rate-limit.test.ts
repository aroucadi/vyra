import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  resolveRateLimitKey,
  clearRateLimitBucketsForTesting,
} from "../../../src/lib/auth/rate-limit.ts";

describe("API Sliding-Window Rate Limiter", () => {
  beforeEach(() => {
    clearRateLimitBucketsForTesting();
  });

  it("allows requests within the configured window and blocks excess requests with Retry-After", () => {
    const key = "test:user_1";
    const r1 = checkRateLimit(key, { maxRequests: 3, windowMs: 60_000 }, 1000);
    const r2 = checkRateLimit(key, { maxRequests: 3, windowMs: 60_000 }, 1100);
    const r3 = checkRateLimit(key, { maxRequests: 3, windowMs: 60_000 }, 1200);
    const r4 = checkRateLimit(key, { maxRequests: 3, windowMs: 60_000 }, 1300);

    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);
    assert.equal(r2.allowed, true);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.retryAfterSeconds >= 1);
  });

  it("resets window allowance after timestamps expire", () => {
    const key = "test:user_window";
    checkRateLimit(key, { maxRequests: 2, windowMs: 10_000 }, 1000);
    checkRateLimit(key, { maxRequests: 2, windowMs: 10_000 }, 2000);
    const blocked = checkRateLimit(key, { maxRequests: 2, windowMs: 10_000 }, 3000);
    assert.equal(blocked.allowed, false);

    // After 10,000ms elapses from first request (nowMs = 11500), first token expires
    const recovered = checkRateLimit(key, { maxRequests: 2, windowMs: 10_000 }, 11500);
    assert.equal(recovered.allowed, true);
  });

  it("scopes rate limit keys cleanly by route, tenant, and forwarded IP", () => {
    const req = new Request("https://example.com/api/ai/coach", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    const k1 = resolveRateLimitKey(req, "ai-coach", "trainee_custom_a");
    const k2 = resolveRateLimitKey(req, "ai-coach", "trainee_custom_b");
    assert.notEqual(k1, k2);
    assert.ok(k1.includes("203.0.113.10"));
    assert.ok(k1.includes("trainee_custom_a"));
  });
});
