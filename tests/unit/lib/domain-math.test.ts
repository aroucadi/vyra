import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveProgramDay,
  calculateEstimated1RM,
  checkIsPersonalRecord,
  formatDuration,
  isSafeUrl,
} from "../../../src/lib/utils.ts";

describe("Domain Math & Utility Functions", () => {
  it("resolves correct program week and day given start date", () => {
    const startDate = "2026-10-01";
    // Same day (Day 0)
    const day0 = resolveProgramDay(startDate, "2026-10-01");
    assert.equal(day0.started, true);
    assert.equal(day0.weekIndex, 1);
    assert.equal(day0.dayOfWeek, 0);

    // Day 2 (Wednesday)
    const day2 = resolveProgramDay(startDate, "2026-10-03");
    assert.equal(day2.weekIndex, 1);
    assert.equal(day2.dayOfWeek, 2);

    // Week 2 Day 3
    const day9 = resolveProgramDay(startDate, "2026-10-10");
    assert.equal(day9.weekIndex, 2);
    assert.equal(day9.dayOfWeek, 2);
  });

  it("calculates estimated 1RM using Epley formula", () => {
    // 100kg x 10 reps: 100 * (1 + 10/30) = 133.3kg
    const oneRepMax = calculateEstimated1RM(100, 10);
    assert.equal(oneRepMax, 133.3);

    // 1 rep returns exact weight
    assert.equal(calculateEstimated1RM(120, 1), 120);
  });

  it("accurately detects personal records", () => {
    // Previous best: 80kg x 10 reps (1RM = 106.7)
    // New set: 82.5kg x 9 reps (1RM = 82.5 * 1.3 = 107.25) -> PR!
    const isPR1 = checkIsPersonalRecord(82.5, 9, 80, 10);
    assert.equal(isPR1, true);

    // Worse set: 80kg x 8 reps -> Not PR
    const isPR2 = checkIsPersonalRecord(80, 8, 80, 10);
    assert.equal(isPR2, false);

    // First time performing exercise (prev = 0) -> PR!
    const isPRFirst = checkIsPersonalRecord(60, 5, 0, 0);
    assert.equal(isPRFirst, true);
  });

  it("formats duration in seconds to mm:ss format", () => {
    assert.equal(formatDuration(0), "00:00");
    assert.equal(formatDuration(48), "00:48");
    assert.equal(formatDuration(90), "01:30");
    assert.equal(formatDuration(3240), "54:00");
  });

  it("validates safe URLs and blocks XSS pseudo-protocols", () => {
    assert.equal(isSafeUrl("https://youtube.com/watch?v=123"), true);
    assert.equal(isSafeUrl("http://localhost:3000/demo"), true);
    assert.equal(isSafeUrl("javascript:alert(1)"), false);
    assert.equal(isSafeUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isSafeUrl("vbscript:msgbox(1)"), false);
    assert.equal(isSafeUrl(""), false);
    assert.equal(isSafeUrl(undefined), false);
  });
});
