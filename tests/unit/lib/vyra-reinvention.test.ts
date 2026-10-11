import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deriveDayTimeline, formatDoseGram } from "@/lib/timeline";
import { appStore } from "@/lib/store";
import { checkIsPersonalRecord } from "@/lib/utils";
import { WorkoutSession } from "@/lib/types";

describe("VYRA Life OS Reinvention & Experience Engine", () => {
  const alaaId = "usr_trainee_alaa";

  test("deriveDayTimeline generates calm, structured chronological moments", () => {
    const timeline = deriveDayTimeline(alaaId);

    assert.ok(Array.isArray(timeline.moments), "moments should be an array");
    assert.ok(timeline.moments.length >= 4, "should have at least 4 daily moments");

    // Check chronological ordering
    for (let i = 0; i < timeline.moments.length - 1; i++) {
      assert.ok(
        timeline.moments[i].time <= timeline.moments[i + 1].time,
        `Moment ${timeline.moments[i].id} (${timeline.moments[i].time}) should be before or equal to ${timeline.moments[i + 1].id} (${timeline.moments[i + 1].time})`
      );
    }

    // When no readiness input or session exists, insight is undefined (honest data rule)
    if (timeline.insight) {
      assert.ok(timeline.insight.sentence.length > 0, "insight sentence must be non-empty");
      assert.ok(timeline.insight.sources.length >= 2, "insight must connect at least 2 pillars");
      assert.ok(timeline.insight.whyPrompt.length > 0, "insight must provide an AI coach prompt");
    } else {
      assert.strictEqual(timeline.hasReadinessInput, false, "without insight, readiness input is false");
    }
  });

  test("formatDoseGram eliminates floating point precision noise", () => {
    assert.strictEqual(formatDoseGram(20.700000000000003), "20.7 g");
    assert.strictEqual(formatDoseGram(5.0), "5 g");
    assert.strictEqual(formatDoseGram(6.900001), "6.9 g");
  });

  test("checkIsPersonalRecord accurately detects estimated 1RM progression", () => {
    // Current: 100kg x 8 reps vs Previous: 95kg x 8 reps -> PR
    assert.strictEqual(checkIsPersonalRecord(100, 8, 95, 8), true);

    // Current: 90kg x 8 reps vs Previous: 95kg x 8 reps -> Not PR
    assert.strictEqual(checkIsPersonalRecord(90, 8, 95, 8), false);

    // First time doing exercise (prev = 0) -> PR
    assert.strictEqual(checkIsPersonalRecord(60, 10, 0, 0), true);

    // Zero current weight -> Not PR
    assert.strictEqual(checkIsPersonalRecord(0, 0, 80, 10), false);
  });

  test("deriveDayTimeline dynamically responds to completed sessions with cross-pillar telemetry", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Save a mock completed session in appStore
    const testSession = {
      id: `ses_test_${Date.now()}`,
      traineeId: alaaId,
      programId: "prog_hypertrophy_1",
      programDayId: "day_1",
      programTitle: "Master Blueprint",
      dayLabel: "Upper Hypertrophy",
      date: todayStr,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: 3300,
      setLogs: [
        { exerciseId: "ex_1", exerciseName: "Bench", setNumber: 1, weightKg: 100, reps: 10, completedAt: new Date().toISOString() },
        { exerciseId: "ex_1", exerciseName: "Bench", setNumber: 2, weightKg: 100, reps: 10, completedAt: new Date().toISOString() },
      ],
    };

    appStore.saveSession(testSession as WorkoutSession);

    const timeline = deriveDayTimeline(alaaId, todayStr);
    const workoutMoment = timeline.moments.find((m) => m.pillar === "train");

    assert.ok(workoutMoment, "workout moment must exist");
    assert.strictEqual(workoutMoment.status, "past", "workout moment should be marked as past");
    assert.strictEqual(workoutMoment.badge, "Done", "completed workout should have 'Done' badge");
    assert.ok(timeline.insight, "cross-pillar insight must exist when session is completed");
    assert.ok(timeline.insight?.sources.includes("train"), "cross-pillar insight must include train pillar");
    assert.ok(timeline.insight?.sentence.includes("2,000 kg"), "insight must mention completed volume");
  });
});
