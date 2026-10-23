import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateEstimated1RM,
  checkIsPersonalRecord,
  resolveProgramDay,
  formatDuration,
} from "../../../src/lib/utils.ts";
import { appStore } from "../../../src/lib/store.ts";

describe("Domain Math & System Edge Cases", () => {
  it("handles edge cases in 1RM calculation gracefully", () => {
    // 0 weight or 0 reps
    assert.equal(calculateEstimated1RM(0, 10), 0);
    assert.equal(calculateEstimated1RM(100, 0), 0);
    assert.equal(calculateEstimated1RM(0, 0), 0);

    // Negative values
    assert.equal(calculateEstimated1RM(-50, 5), 0);
    assert.equal(calculateEstimated1RM(50, -5), 0);

    // Fractional / decimal weights (e.g. micro-loading 82.5kg)
    const micro = calculateEstimated1RM(82.5, 8);
    // 82.5 * (1 + 8/30) = 82.5 * 1.266666 = 104.5
    assert.equal(micro, 104.5);

    // High rep counts (e.g. 20-rep squat)
    const highRep = calculateEstimated1RM(100, 20);
    assert.equal(highRep, 166.7);
  });

  it("handles PR comparison edge cases (ties, first sets, volume tradeoffs)", () => {
    // Identical weight and reps is NOT a new PR
    assert.equal(checkIsPersonalRecord(100, 10, 100, 10), false);

    // Heavier weight with fewer reps but higher 1RM
    // Prev: 100kg x 5 (1RM = 116.7)
    // New: 110kg x 3 (1RM = 110 * 1.1 = 121.0) -> New PR!
    assert.equal(checkIsPersonalRecord(110, 3, 100, 5), true);

    // Heavier weight with fewer reps but lower 1RM
    // Prev: 100kg x 10 (1RM = 133.3)
    // New: 105kg x 2 (1RM = 105 * 1.067 = 112) -> Not a PR!
    assert.equal(checkIsPersonalRecord(105, 2, 100, 10), false);

    // Lighter weight with high reps exceeding 1RM
    // Prev: 100kg x 5 (1RM = 116.7)
    // New: 90kg x 12 (1RM = 90 * 1.4 = 126.0) -> New PR!
    assert.equal(checkIsPersonalRecord(90, 12, 100, 5), true);

    // Zero previous performance (first session ever)
    assert.equal(checkIsPersonalRecord(20, 5, 0, 0), true);
    assert.equal(checkIsPersonalRecord(0, 0, 0, 0), false);
  });

  it("handles program day calendar bounds, leap years, and future start dates", () => {
    const startDate = "2026-10-01";

    // Date before start date (future program)
    const future = resolveProgramDay(startDate, "2026-09-25");
    assert.equal(future.started, false);
    assert.equal(future.weekIndex, 1);
    assert.equal(future.dayOfWeek, 0);

    // End of 4-week block (Day 27: Week 4, Day 6)
    const lastDay = resolveProgramDay(startDate, "2026-10-28");
    assert.equal(lastDay.started, true);
    assert.equal(lastDay.weekIndex, 4);
    assert.equal(lastDay.dayOfWeek, 6);

    // Beyond 4-week block (Week 5)
    const week5 = resolveProgramDay(startDate, "2026-10-29");
    assert.equal(week5.weekIndex, 5);
    assert.equal(week5.dayOfWeek, 0);

    // Leap year date check (Feb 28 -> Mar 01)
    const leapStart = "2028-02-28";
    const nextDay = resolveProgramDay(leapStart, "2028-02-29");
    assert.equal(nextDay.weekIndex, 1);
    assert.equal(nextDay.dayOfWeek, 1);
  });

  it("formats edge durations properly (0s, >1h, >24h)", () => {
    assert.equal(formatDuration(0), "00:00");
    assert.equal(formatDuration(59), "00:59");
    assert.equal(formatDuration(60), "01:00");
    assert.equal(formatDuration(3599), "59:59");
    // Beyond 1 hour (e.g. 3665s = 61 mins 05s -> "61:05")
    assert.equal(formatDuration(3665), "61:05");
    assert.equal(formatDuration(-10), "00:00");
  });

  it("robustly handles store queries for non-existent entities and boundary conditions", () => {
    // Non-existent user
    const ghost = appStore.getUser("ghost_user_999");
    assert.equal(ghost, undefined);

    // Active program for athlete with no program assigned
    const ghostProg = appStore.getActiveProgramForTrainee("ghost_user_999");
    assert.equal(ghostProg, undefined);

    // Personal best for exercise never performed
    const noPb = appStore.getPersonalBestForExercise("trainee_1", "One Arm Handstand Press");
    assert.equal(noPb, null);

    // Metrics for athlete with zero entries
    const ghostMetrics = appStore.getMetrics("ghost_user_999");
    assert.deepEqual(ghostMetrics, []);
  });
});
