import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  saveProgramAction,
  publishProgramAction,
  getActiveProgram,
  getProgramById,
} from "../../../src/lib/actions/program.ts";
import {
  saveSessionAction,
  getSessionsAction,
  getPersonalBestAction,
} from "../../../src/lib/actions/session.ts";
import {
  getCurrentUserAction,
  switchUserAction,
} from "../../../src/lib/actions/auth.ts";
import {
  logWeightAction,
  getWeightHistoryAction,
} from "../../../src/lib/actions/metrics.ts";
import {
  getRosterAction,
  getTraineeDetailAction,
} from "../../../src/lib/actions/roster.ts";
import { Program, WorkoutSession } from "../../../src/lib/types.ts";

describe("NewME Server Actions Execution Suite", () => {
  it("executes auth actions and maintains role switching state", async () => {
    const user = await getCurrentUserAction();
    assert.ok(user.id);

    const switched = await switchUserAction("trainer_1");
    assert.equal(switched.id, "trainer_1");
    assert.equal(switched.role, "trainer");

    const trainee = await switchUserAction("trainee_1");
    assert.equal(trainee.id, "trainee_1");
    assert.equal(trainee.role, "trainee");
  });

  it("handles program creation, retrieval, and publish workflows", async () => {
    const testProgId = `prog_test_${Date.now()}`;
    const newProg: Program = {
      id: testProgId,
      trainerId: "trainer_1",
      traineeId: "trainee_2", // Sarah Chen
      title: "Strength Peaking Cycle",
      startDate: "2026-11-01",
      endDate: "2026-11-28",
      durationWeeks: 4,
      status: "draft",
      version: 1,
      weeks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save Draft
    const saved = await saveProgramAction(newProg);
    assert.equal(saved.id, testProgId);
    assert.equal(saved.status, "draft");

    const fetched = await getProgramById(testProgId);
    assert.equal(fetched?.title, "Strength Peaking Cycle");

    // Publish
    const published = await publishProgramAction(testProgId);
    assert.equal(published.status, "published");
    assert.equal(published.version, 2);

    // Active program for Sarah
    const active = await getActiveProgram("trainee_2");
    assert.equal(active?.id, testProgId);
    assert.equal(active?.status, "published");
  });

  it("records workout session logs and returns updated personal records", async () => {
    const session: WorkoutSession = {
      id: `sess_test_${Date.now()}`,
      traineeId: "trainee_1",
      programDayId: "week_1_d0",
      programTitle: "Hypertrophy Block 1",
      dayLabel: "Push Hypertrophy A",
      date: "2026-10-18",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSec: 3600,
      setLogs: [
        {
          id: "sl_1",
          exercisePrescriptionId: "ep1",
          exerciseName: "Barbell Bench Press",
          setIndex: 1,
          weightKg: 100,
          reps: 5,
          rirAchieved: 1,
          isPR: true,
        },
      ],
      notes: "Bench felt explosive today.",
    };

    const saved = await saveSessionAction(session);
    assert.equal(saved.id, session.id);

    const history = await getSessionsAction("trainee_1");
    assert.ok(history.some((s) => s.id === session.id));

    const pb = await getPersonalBestAction("trainee_1", "Barbell Bench Press");
    assert.ok(pb);
    assert.equal(pb?.weightKg, 100);
    assert.equal(pb?.reps, 5);
  });

  it("persists bio-metric entries and provides chronological logs", async () => {
    const entry = await logWeightAction("trainee_1", 81.4);
    assert.equal(entry.weightKg, 81.4);
    assert.equal(entry.traineeId, "trainee_1");

    const history = await getWeightHistoryAction("trainee_1");
    assert.ok(history.length > 0);
    assert.equal(history[history.length - 1].weightKg, 81.4);
  });

  it("fetches live coach roster and deep trainee detail with all relations", async () => {
    const roster = await getRosterAction();
    assert.ok(roster.length >= 3);

    const detail = await getTraineeDetailAction("trainee_1");
    assert.ok(detail.trainee);
    assert.equal(detail.trainee?.name, "Alex Rivera");
    assert.ok(detail.activeProgram);
    assert.ok(detail.sessions.length > 0);
    assert.ok(detail.metrics.length > 0);
  });
});
