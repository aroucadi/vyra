import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../../../src/app/api/sync/events/route";
import { NextRequest } from "next/server";
import { EventEnvelope } from "../../../src/lib/storage/events";

test("Phase 2: Cloud Sync Events Route Contract", async (t) => {
  await t.test("rejects request missing traineeId or events array", async () => {
    const req = new NextRequest("http://localhost:3000/api/sync/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traineeId: "" }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes("Invalid payload"));
  });

  await t.test("ingests batch of athletic events and returns synced IDs", async () => {
    const events: EventEnvelope[] = [
      {
        id: "evt_1001",
        streamId: "sess_punch_1",
        traineeId: "trainee_alaa",
        type: "WORKOUT_INITIALIZED",
        payload: { sessionId: "sess_punch_1", plannedExerciseIds: ["ex_1"] },
        epochMs: 1794028800000,
        recordedAt: new Date().toISOString(),
        syncedToCloud: false,
      },
      {
        id: "evt_1002",
        streamId: "sess_punch_1",
        traineeId: "trainee_alaa",
        type: "SET_LOGGED",
        payload: {
          sessionId: "sess_punch_1",
          exerciseName: "Incline DB Press",
          setIndex: 1,
          weightKg: 32,
          reps: 8,
          isPR: true,
        },
        epochMs: 1794028850000,
        recordedAt: new Date().toISOString(),
        syncedToCloud: false,
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/sync/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traineeId: "trainee_alaa",
        events,
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.traineeId, "trainee_alaa");
    assert.equal(body.syncedCount, 2);
    assert.deepEqual(body.syncedEventIds, ["evt_1001", "evt_1002"]);
    assert.equal(body.debriefDispatched, false);
  });

  await t.test("synthesizes Asymmetric Coach Debrief dispatch on WORKOUT_COMPLETED", async () => {
    const events: EventEnvelope[] = [
      {
        id: "evt_complete_99",
        streamId: "sess_punch_today",
        traineeId: "trainee_alaa",
        type: "WORKOUT_COMPLETED",
        payload: {
          sessionId: "sess_punch_today",
          gymName: "Punch by Badr Hari Lissasfa",
          totalVolumeKg: 14280,
          prCount: 2,
          durationSec: 3600,
        },
        epochMs: Date.now(),
        recordedAt: new Date().toISOString(),
        syncedToCloud: false,
      },
    ];

    const req = new NextRequest("http://localhost:3000/api/sync/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traineeId: "trainee_alaa",
        events,
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.syncedCount, 1);
    assert.equal(body.debriefDispatched, true);
    assert.equal(body.debriefSummaries.length, 1);
    assert.equal(body.debriefSummaries[0].gymName, "Punch by Badr Hari Lissasfa");
    assert.equal(body.debriefSummaries[0].totalVolumeKg, 14280);
    assert.equal(body.debriefSummaries[0].prCount, 2);
    assert.equal(body.debriefSummaries[0].durationMin, 60);
  });
});
