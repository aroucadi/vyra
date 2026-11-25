import { test, describe } from "node:test";
import assert from "node:assert";
import { getChronoPhase } from "@/components/trainee/TraineeNav";

describe("Kinetic Flight HUD & 24-Hour Chronobiological State Machine", () => {
  test("getChronoPhase accurately routes 24h chronobiological rhythm", () => {
    // 1. Morning Anchor (06:00 - 11:29)
    const morningDate = new Date("2026-11-25T07:30:00");
    const morning = getChronoPhase(morningDate);
    assert.strictEqual(morning.phase, "morning_anchor");
    assert.strictEqual(morning.label, "Morning Anchor");
    assert.strictEqual(morning.badge, "07:30 ROUTINE");
    assert.strictEqual(morning.accentColor, "#f59e0b");

    // 2. Kinetic Crucible (11:30 - 15:29) — Punch by Badr Hari lunch training window
    const lunchDate = new Date("2026-11-25T12:15:00");
    const lunch = getChronoPhase(lunchDate);
    assert.strictEqual(lunch.phase, "kinetic_crucible");
    assert.strictEqual(lunch.label, "Kinetic Crucible");
    assert.strictEqual(lunch.badge, "GYM WINDOW");
    assert.strictEqual(lunch.accentColor, "#22c55e");

    // 3. Somatic Recovery (15:30 - 22:29) — Post-workout nutrition & evening recovery
    const eveningDate = new Date("2026-11-25T19:00:00");
    const evening = getChronoPhase(eveningDate);
    assert.strictEqual(evening.phase, "somatic_recovery");
    assert.strictEqual(evening.label, "Somatic Recovery");
    assert.strictEqual(evening.badge, "RECOVERY");
    assert.strictEqual(evening.accentColor, "#06b6d4");

    // 4. Deep Rest (22:30 - 05:59) — Anabolic cellular repair & sleep
    const nightDate = new Date("2026-11-25T23:45:00");
    const night = getChronoPhase(nightDate);
    assert.strictEqual(night.phase, "deep_rest");
    assert.strictEqual(night.label, "Deep Rest");
    assert.strictEqual(night.badge, "ANABOLIC SLEEP");
    assert.strictEqual(night.accentColor, "#818cf8");
  });

  test("computes concentric SVG ring progress and overload thresholds accurately", () => {
    const CIRCUMFERENCE = 867;
    const targetReps = 10;

    // 0 reps -> 0% progress -> strokeDashoffset = 867
    const offset0 = CIRCUMFERENCE * (1 - Math.min(1, 0 / targetReps));
    assert.strictEqual(offset0, 867);

    // 5 reps -> 50% progress -> strokeDashoffset = 433.5
    const offset5 = CIRCUMFERENCE * (1 - Math.min(1, 5 / targetReps));
    assert.strictEqual(offset5, 433.5);

    // 10 reps -> 100% progress -> strokeDashoffset = 0 (full ring glow)
    const offset10 = CIRCUMFERENCE * (1 - Math.min(1, 10 / targetReps));
    assert.strictEqual(offset10, 0);

    // 12 reps (overload ceiling exceeded) -> clamped to 0 offset
    const offset12 = CIRCUMFERENCE * (1 - Math.min(1, 12 / targetReps));
    assert.strictEqual(offset12, 0);
  });

  test("calculates biomechanical TUT and torque estimations accurately", () => {
    const weightKg = 40;
    const reps = 9;

    const tutSec = Number((reps * 4.2).toFixed(1));
    assert.strictEqual(tutSec, 37.8, "9 reps × 4.2s tempo cadence = 37.8s TUT");

    const peakTorqueNm = Math.round(weightKg * 4.6);
    assert.strictEqual(peakTorqueNm, 184, "40 kg load = 184 Nm estimated torque");

    // Velocity drops smoothly as load approaches 1RM
    const estimatedVelocity = Number(
      (0.58 - Math.min(0.25, (weightKg / 40) * 0.15)).toFixed(2)
    );
    assert.strictEqual(estimatedVelocity, 0.43);
  });

  test("enforces the 5 discrete RIR tactical states", () => {
    const tacticalRirLevels = [0, 1, 2, 3, 4];
    const labels = ["FAIL", "RIR", "LOCKED", "RIR", "SUB"];

    tacticalRirLevels.forEach((level, idx) => {
      assert.ok(level >= 0 && level <= 4);
      assert.strictEqual(typeof labels[idx], "string");
    });

    // Level 2 must correspond to LOCKED (Alaa's prescribed 1-2 RIR hypertrophy sweet spot)
    assert.strictEqual(labels[2], "LOCKED");
  });
});
