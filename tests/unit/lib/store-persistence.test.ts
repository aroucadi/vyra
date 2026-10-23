import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { migrateLegacyStoredData } from "../../../src/lib/storage.ts";

describe("Data Compatibility & Legacy Storage Migration", () => {
  it("migrates fixture of current/legacy stored format without data loss", () => {
    // Current/legacy stored payload fixture from Alaa's phone/localStorage
    const legacyFixture = {
      user: {
        id: "trainee_alaa",
        name: "Alaa",
        role: "trainee",
      },
      sessions: [
        {
          id: "sess_legacy_1",
          traineeId: "trainee_alaa",
          programDayId: "prog_master_w1_d0",
          programTitle: "The Master Hypertrophy & Postural Architecture Protocol",
          dayLabel: "Monday: Upper Body A",
          date: "2026-10-12",
          startedAt: "2026-10-12T12:15:00.000Z",
          durationSec: 1980,
          setLogs: [
            {
              id: "sl_1",
              exercisePrescriptionId: "ep1",
              exerciseName: "30° Incline Dumbbell Press",
              setIndex: 1,
              weightKg: 28,
              reps: 10,
              rirAchieved: 2,
              isPR: true,
              selectedEquipment: "dumbbell",
            },
            {
              id: "sl_2",
              exercisePrescriptionId: "ep1",
              exerciseName: "30° Incline Dumbbell Press",
              setIndex: 2,
              weightKg: 28,
              reps: 9,
              rirAchieved: 2,
              isPR: false,
              selectedEquipment: "dumbbell",
            },
            {
              id: "sl_3",
              exercisePrescriptionId: "ep1",
              exerciseName: "30° Incline Dumbbell Press",
              setIndex: 3,
              weightKg: 28,
              reps: 8,
              rirAchieved: 1,
              isPR: false,
              selectedEquipment: "dumbbell",
            },
          ],
        },
      ],
      wearableBiometrics: [
        {
          id: "wb_legacy_manual",
          traineeId: "trainee_alaa",
          date: "2026-10-12",
          source: "manual",
          sleepHours: 6.0,
          feeling: "suboptimal",
          cnsFatigueDetected: true,
          readinessScore: 68,
          hrvMs: 64,
          receivedAt: "2026-10-12T07:15:00.000Z",
        },
        {
          id: "wb_real_watch",
          traineeId: "trainee_alaa",
          date: "2026-10-11",
          source: "apple_health",
          sleepHours: 7.5,
          cnsFatigueDetected: false,
          readinessScore: 88,
          hrvMs: 72,
          deepSleepMinutes: 65,
          restingHeartRateBpm: 54,
          receivedAt: "2026-10-11T07:00:00.000Z",
        },
      ],
      supplementLogs: [
        {
          id: "supp_log_1",
          traineeId: "trainee_alaa",
          scheduledDate: "2026-10-12",
          doseId: "m1",
          status: "taken",
        },
      ],
      metrics: [
        {
          id: "m_1",
          traineeId: "trainee_alaa",
          date: "2026-10-12",
          weightKg: 49.5,
          source: "manual",
        },
      ],
      exportedAt: "2026-10-12T08:00:00.000Z",
    };

    const migrated = migrateLegacyStoredData(legacyFixture);

    // 1. Sessions preserved completely
    assert.strictEqual(migrated.sessions.length, 1);
    assert.strictEqual(migrated.sessions[0].id, "sess_legacy_1");
    assert.strictEqual(migrated.sessions[0].setLogs.length, 3);
    assert.strictEqual(migrated.sessions[0].setLogs[0].weightKg, 28);

    // 2. Readiness entries migrated safely
    assert.strictEqual(migrated.readinessLogs.length, 2);

    // Manual entry: feeling migrated from "suboptimal" to "moderate", cnsFatigueDetected to reducedRecovery
    const manualEntry = migrated.readinessLogs.find((r) => r.source === "manual");
    assert.ok(manualEntry);
    assert.strictEqual(manualEntry.answer, "moderate");
    assert.strictEqual(manualEntry.reducedRecovery, true);
    // Invented HRV and readiness score for manual entry removed
    assert.strictEqual(manualEntry.hrvMs, undefined);
    assert.strictEqual(manualEntry.readinessScore, undefined);

    // Real wearable entry: retains real telemetry
    const watchEntry = migrated.readinessLogs.find((r) => r.source === "apple_health");
    assert.ok(watchEntry);
    assert.strictEqual(watchEntry.hrvMs, 72);
    assert.strictEqual(watchEntry.deepSleepMinutes, 65);
    assert.strictEqual(watchEntry.restingHeartRateBpm, 54);
    assert.strictEqual(watchEntry.reducedRecovery, false);

    // 3. Supplement logs and metrics preserved
    assert.strictEqual(migrated.supplementLogs.length, 1);
    assert.strictEqual(migrated.metrics.length, 1);
    assert.strictEqual(migrated.lastBackupAt, "2026-10-12T08:00:00.000Z");
  });

  it("proves offline persistence: logging 3 sets preserves sets in local payload without loss", () => {
    // Simulate initial empty or existing client cache
    const initialClientState = migrateLegacyStoredData({
      sessions: [],
      readinessLogs: [],
      supplementLogs: [],
      metrics: [],
    });
    assert.strictEqual(initialClientState.sessions.length, 0);

    // Simulate logging 3 sets in offline session (airplane mode)
    const offlineSession = {
      id: "sess_offline_airplane_test",
      traineeId: "trainee_alaa",
      programDayId: "prog_master_w1_d0",
      programTitle: "The Master Hypertrophy & Postural Architecture Protocol",
      dayLabel: "Monday: Upper Body A",
      date: "2026-10-12",
      startedAt: "2026-10-12T13:00:00.000Z",
      durationSec: 1200,
      setLogs: [
        {
          id: "set_offline_1",
          exercisePrescriptionId: "ep1",
          exerciseName: "30° Incline Dumbbell Press",
          setIndex: 1,
          weightKg: 28,
          reps: 10,
          rirAchieved: 2,
          isPR: true,
        },
        {
          id: "set_offline_2",
          exercisePrescriptionId: "ep1",
          exerciseName: "30° Incline Dumbbell Press",
          setIndex: 2,
          weightKg: 28,
          reps: 9,
          rirAchieved: 2,
          isPR: false,
        },
        {
          id: "set_offline_3",
          exercisePrescriptionId: "ep1",
          exerciseName: "30° Incline Dumbbell Press",
          setIndex: 3,
          weightKg: 28,
          reps: 8,
          rirAchieved: 1,
          isPR: false,
        },
      ],
    };

    // Save session to payload
    initialClientState.sessions.push(offlineSession);

    // Simulate page reload: serialize and parse through migrateLegacyStoredData
    const serialized = JSON.stringify(initialClientState);
    const reloaded = migrateLegacyStoredData(JSON.parse(serialized));

    // Assert the 3 sets remain intact after reload
    assert.strictEqual(reloaded.sessions.length, 1);
    assert.strictEqual(reloaded.sessions[0].id, "sess_offline_airplane_test");
    assert.strictEqual(reloaded.sessions[0].setLogs.length, 3);
    assert.strictEqual(reloaded.sessions[0].setLogs[0].reps, 10);
    assert.strictEqual(reloaded.sessions[0].setLogs[1].reps, 9);
    assert.strictEqual(reloaded.sessions[0].setLogs[2].reps, 8);
    assert.strictEqual(reloaded.sessions[0].setLogs[0].isPR, true);
  });
});
