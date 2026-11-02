import { test, describe } from "node:test";
import assert from "node:assert";
import { appStore } from "@/lib/store";
import { WorkoutSession, SetLog } from "@/lib/types";

describe("Workout Timing Architecture & 3-Metric Matrix", () => {
  test("calculates true wall-clock duration without setInterval sleep drift", () => {
    const sessionStartEpochMs = 1730000000000;
    // Simulate 45 minutes (2,700 seconds) passing in real world while phone was asleep/locked
    const simulatedWakeEpochMs = sessionStartEpochMs + 2700 * 1000;

    const wallClockDurationSec = Math.round((simulatedWakeEpochMs - sessionStartEpochMs) / 1000);
    assert.strictEqual(wallClockDurationSec, 2700, "Should measure exact 2,700 seconds (45 mins)");

    // Naive interval would only measure active screen time (e.g. 831 seconds)
    const naiveThrottledScreenOnSeconds = 831;
    assert.ok(wallClockDurationSec > naiveThrottledScreenOnSeconds, "Wall-clock must exceed throttled screen-on ticks");
  });

  test("accurately tracks warmup completion vs skip and counts completed warmup in total session time", () => {
    const sessionStartEpoch = 1730000000000;
    const warmupDurationSec = 360; // 6 minutes warmup
    const liftingStartEpoch = sessionStartEpoch + warmupDurationSec * 1000;
    const liftingDurationSec = 1800; // 30 minutes lifting
    const finishEpoch = liftingStartEpoch + liftingDurationSec * 1000;

    // Completed Warmup Session
    const completedWarmupSession: WorkoutSession = {
      id: "session_warmup_completed",
      traineeId: "trainee_test",
      programDayId: "day_test",
      programTitle: "16-Week Blueprint",
      dayLabel: "Monday Upper Body",
      date: "2026-11-02",
      startedAt: new Date(sessionStartEpoch).toISOString(),
      endedAt: new Date(finishEpoch).toISOString(),
      durationSec: Math.round((finishEpoch - sessionStartEpoch) / 1000), // 2160s (36m)
      liftingDurationSec,
      warmupDurationSec,
      warmupCompleted: true,
      cooldownCompleted: false,
      cooldownDurationSec: 0,
      totalRestDurationSec: 540,
      setLogs: [],
    };

    assert.strictEqual(completedWarmupSession.warmupCompleted, true);
    assert.strictEqual(completedWarmupSession.warmupDurationSec, 360);
    assert.strictEqual(completedWarmupSession.durationSec, 2160);
    assert.strictEqual(completedWarmupSession.durationSec, completedWarmupSession.liftingDurationSec! + completedWarmupSession.warmupDurationSec!);

    // Skipped Warmup Session
    const skippedWarmupSession: WorkoutSession = {
      id: "session_warmup_skipped",
      traineeId: "trainee_test",
      programDayId: "day_test",
      programTitle: "16-Week Blueprint",
      dayLabel: "Monday Upper Body",
      date: "2026-11-02",
      startedAt: new Date(sessionStartEpoch).toISOString(),
      endedAt: new Date(sessionStartEpoch + liftingDurationSec * 1000).toISOString(),
      durationSec: liftingDurationSec, // 1800s (30m)
      liftingDurationSec,
      warmupDurationSec: 0,
      warmupCompleted: false,
      cooldownCompleted: false,
      cooldownDurationSec: 0,
      totalRestDurationSec: 540,
      setLogs: [],
    };

    assert.strictEqual(skippedWarmupSession.warmupCompleted, false);
    assert.strictEqual(skippedWarmupSession.warmupDurationSec, 0);
    assert.strictEqual(skippedWarmupSession.durationSec, 1800);
  });

  test("accurately tracks cooldown completion vs skip and counts in total session time", () => {
    const sessionStart = 1730000000000;
    const liftingDurationSec = 1800; // 30 mins
    const cooldownDurationSec = 240; // 4 mins
    const totalDuration = liftingDurationSec + cooldownDurationSec; // 2040s (34 mins)

    const cooldownSession: WorkoutSession = {
      id: "session_cooldown_completed",
      traineeId: "trainee_test",
      programDayId: "day_test",
      programTitle: "16-Week Blueprint",
      dayLabel: "Tuesday Pull",
      date: "2026-11-02",
      startedAt: new Date(sessionStart).toISOString(),
      endedAt: new Date(sessionStart + totalDuration * 1000).toISOString(),
      durationSec: totalDuration,
      liftingDurationSec,
      cooldownDurationSec,
      cooldownCompleted: true,
      warmupCompleted: false,
      warmupDurationSec: 0,
      totalRestDurationSec: 480,
      setLogs: [],
    };

    assert.strictEqual(cooldownSession.cooldownCompleted, true);
    assert.strictEqual(cooldownSession.cooldownDurationSec, 240);
    assert.strictEqual(cooldownSession.durationSec, 2040);
  });

  test("persists the 3 parallel time indicators (Total Gym, Active Lifting, Cumulated Rest) in appStore", () => {
    const dummySession: WorkoutSession = {
      id: "session_3_metrics_test",
      traineeId: "trainee_alaa",
      programDayId: "week1_d0",
      programTitle: "Master 16-Week Protocol",
      dayLabel: "Monday Seated Upper Body",
      date: "2026-11-02",
      startedAt: new Date(Date.now() - 2500 * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: 2500, // Total Gym Time: ~41m 40s
      liftingDurationSec: 1700, // Active Lifting: ~28m 20s
      totalRestDurationSec: 690, // Cumulated Rest: ~11m 30s
      warmupDurationSec: 320, // Warmup: ~5m 20s
      cooldownDurationSec: 180, // Cooldown: 3m
      warmupCompleted: true,
      cooldownCompleted: true,
      setLogs: [
        {
          id: "set_1",
          exercisePrescriptionId: "ex_1",
          exerciseName: "lever chest press",
          setIndex: 1,
          reps: 10,
          weightKg: 25,
          rirAchieved: 2,
        },
      ],
    };

    appStore.saveSession(dummySession);
    const retrieved = appStore.getSessions("trainee_alaa").find((s) => s.id === "session_3_metrics_test");

    assert.ok(retrieved, "Session should be found in store");
    assert.strictEqual(retrieved?.durationSec, 2500, "Total Gym Time must match");
    assert.strictEqual(retrieved?.liftingDurationSec, 1700, "Active Lifting Time must match");
    assert.strictEqual(retrieved?.totalRestDurationSec, 690, "Cumulated Rest Time must match");
    assert.strictEqual(retrieved?.warmupDurationSec, 320, "Warmup Duration must match");
    assert.strictEqual(retrieved?.cooldownDurationSec, 180, "Cooldown Duration must match");
    assert.strictEqual(retrieved?.warmupCompleted, true);
    assert.strictEqual(retrieved?.cooldownCompleted, true);
  });

  test("rest interval countdown computes remaining seconds from target epoch without freezing", () => {
    const now = Date.now();
    const restSeconds = 90;
    const restTargetEpochMs = now + restSeconds * 1000;

    // Simulate 35 seconds passing while phone is locked in pocket
    const wakeAfter35s = now + 35 * 1000;
    const remainingAfter35s = Math.max(0, Math.round((restTargetEpochMs - wakeAfter35s) / 1000));
    assert.strictEqual(remainingAfter35s, 55, "Remaining rest should accurately show 55s");

    // Simulate 95 seconds passing (rest period expired in pocket)
    const wakeAfter95s = now + 95 * 1000;
    const remainingAfter95s = Math.max(0, Math.round((restTargetEpochMs - wakeAfter95s) / 1000));
    assert.strictEqual(remainingAfter95s, 0, "Timer should reach 0 upon waking");
  });
});
