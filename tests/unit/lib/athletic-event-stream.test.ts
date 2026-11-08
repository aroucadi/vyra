import test from "node:test";
import assert from "node:assert/strict";
import {
  createEventEnvelope,
  AthleticEventType,
  WorkoutCompletedPayload,
  SetLoggedPayload,
} from "../../../src/lib/storage/events";
import {
  InMemoryStorageAdapter,
  getStorageAdapter,
} from "../../../src/lib/storage/adapter";
import { WorkoutSession } from "../../../src/lib/types";

test("Athletic Flight Recorder Event Stream", async (t) => {
  await t.test("createEventEnvelope generates deterministic envelope with wall-clock epoch", () => {
    const payload: SetLoggedPayload = {
      sessionId: "sess_101",
      exerciseName: "Incline Dumbbell Press",
      setIndex: 1,
      weightKg: 32,
      reps: 8,
      targetRir: 2,
      rirAchieved: 2,
      isPR: false,
    };

    const envelope = createEventEnvelope(
      "trainee_alaa",
      "sess_101",
      "SET_LOGGED",
      payload
    );

    assert.ok(envelope.id.startsWith("evt_"));
    assert.equal(envelope.traineeId, "trainee_alaa");
    assert.equal(envelope.streamId, "sess_101");
    assert.equal(envelope.type, "SET_LOGGED");
    assert.equal(envelope.payload.weightKg, 32);
    assert.equal(envelope.payload.reps, 8);
    assert.equal(envelope.syncedToCloud, false);
    assert.ok(envelope.epochMs > 0);
    assert.ok(typeof envelope.recordedAt === "string");
  });

  await t.test("InMemoryStorageAdapter appends events and filters by stream/trainee", async () => {
    const adapter = new InMemoryStorageAdapter();

    const evt1 = await adapter.appendEvent("trainee_alaa", "sess_A", "WORKOUT_INITIALIZED", {
      sessionId: "sess_A",
      plannedExerciseIds: ["ex_1", "ex_2"],
    });

    const evt2 = await adapter.appendEvent("trainee_alaa", "sess_A", "SET_LOGGED", {
      sessionId: "sess_A",
      exerciseName: "Incline Dumbbell Press",
      setIndex: 1,
      weightKg: 32,
      reps: 8,
      isPR: false,
    });

    const evt3 = await adapter.appendEvent("trainee_other", "sess_B", "SET_LOGGED", {
      sessionId: "sess_B",
      exerciseName: "Squat",
      setIndex: 1,
      weightKg: 100,
      reps: 5,
      isPR: true,
    });

    // Query stream sess_A
    const streamEvents = await adapter.getEvents("sess_A");
    assert.equal(streamEvents.length, 2);
    assert.equal(streamEvents[0].id, evt1.id);
    assert.equal(streamEvents[1].id, evt2.id);

    // Query trainee_alaa
    const alaaEvents = await adapter.getEvents(undefined, "trainee_alaa");
    assert.equal(alaaEvents.length, 2);

    // Query trainee_other
    const otherEvents = await adapter.getEvents(undefined, "trainee_other");
    assert.equal(otherEvents.length, 1);
    assert.equal(otherEvents[0].id, evt3.id);
  });

  await t.test("saveSession generates an immutable WORKOUT_COMPLETED event in the flight recorder", async () => {
    const adapter = new InMemoryStorageAdapter();

    const session: WorkoutSession = {
      id: "sess_punch_today",
      traineeId: "trainee_alaa",
      date: "2026-11-08",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSec: 3600,
      liftingDurationSec: 2100,
      totalRestDurationSec: 1500,
      gymId: "gym_punch_lissasfa",
      gymName: "Punch by Badr Hari Lissasfa",
      gymAddress: "Lissasfa, Casablanca",
      dayLabel: "Upper Push A",
      programTitle: "Mesocycle Hypertrophy",
      setLogs: [
        {
          id: "log_1",
          exercisePrescriptionId: "rx_1",
          exerciseName: "Incline DB Press",
          setIndex: 1,
          weightKg: 32,
          reps: 8,
          isPR: true,
          completedAt: new Date().toISOString(),
        },
        {
          id: "log_2",
          exercisePrescriptionId: "rx_1",
          exerciseName: "Incline DB Press",
          setIndex: 2,
          weightKg: 32,
          reps: 8,
          isPR: false,
          completedAt: new Date().toISOString(),
        },
      ],
    };

    await adapter.saveSession(session);

    // Verify session retrieval
    const saved = await adapter.getSessions("trainee_alaa");
    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, "sess_punch_today");

    // Verify event stream has WORKOUT_COMPLETED with calculated aggregates
    const events = await adapter.getEvents("sess_punch_today");
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "WORKOUT_COMPLETED");
    const payload = events[0].payload as WorkoutCompletedPayload;
    assert.equal(payload.sessionId, "sess_punch_today");
    assert.equal(payload.gymName, "Punch by Badr Hari Lissasfa");
    assert.equal(payload.totalVolumeKg, 32 * 8 + 32 * 8); // 512kg
    assert.equal(payload.prCount, 1);
    assert.equal(payload.durationSec, 3600);
  });

  await t.test("getUnsyncedEvents and markEventsSynced support offline replay queue", async () => {
    const adapter = new InMemoryStorageAdapter();

    const e1 = await adapter.appendEvent("trainee_alaa", "stream_1", "SET_LOGGED", {
      sessionId: "s1",
      exerciseName: "Lateral Raise",
      setIndex: 1,
      weightKg: 14,
      reps: 12,
      isPR: false,
    });

    const e2 = await adapter.appendEvent("trainee_alaa", "stream_1", "SET_LOGGED", {
      sessionId: "s1",
      exerciseName: "Lateral Raise",
      setIndex: 2,
      weightKg: 14,
      reps: 12,
      isPR: false,
    });

    const unsyncedBefore = await adapter.getUnsyncedEvents("trainee_alaa");
    assert.equal(unsyncedBefore.length, 2);

    // Sync e1
    await adapter.markEventsSynced([e1.id]);

    const unsyncedAfter = await adapter.getUnsyncedEvents("trainee_alaa");
    assert.equal(unsyncedAfter.length, 1);
    assert.equal(unsyncedAfter[0].id, e2.id);

    // Mark remaining synced
    await adapter.markEventsSynced([e2.id]);
    const unsyncedFinal = await adapter.getUnsyncedEvents("trainee_alaa");
    assert.equal(unsyncedFinal.length, 0);
  });
});
