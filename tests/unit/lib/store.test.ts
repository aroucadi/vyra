import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store.ts";

describe("Vyra Domain Store & Business Logic", () => {
  it("retrieves current user and supports role switching", () => {
    const user = appStore.getCurrentUser();
    assert.ok(user);

    // Switch to Coach Marcus
    const trainer = appStore.setCurrentUser("trainer_1");
    assert.equal(trainer.id, "trainer_1");
    assert.equal(trainer.role, "trainer");

    // Switch back to Alex
    const trainee = appStore.setCurrentUser("trainee_1");
    assert.equal(trainee.id, "trainee_1");
    assert.equal(trainee.role, "trainee");
  });

  it("retrieves published program for trainee with days and blocks", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_1");
    assert.ok(program);
    assert.equal(program?.title, "Hypertrophy Block 1");
    assert.equal(program?.status, "published");
    assert.equal(program?.weeks.length, 4);

    // Push Hypertrophy A day
    const day1 = program?.weeks[0].days[0];
    assert.equal(day1?.label, "Push Hypertrophy A");
    assert.equal(day1?.isRestDay, false);
    assert.ok(day1?.blocks.length && day1.blocks.length > 0);

    // Rest day
    const day3 = program?.weeks[0].days[2];
    assert.equal(day3?.isRestDay, true);
  });

  it("publishes program and increments version", () => {
    const program = appStore.getActiveProgramForTrainee("trainee_1");
    assert.ok(program);

    const initialVersion = program.version;
    const published = appStore.publishProgram(program.id);

    assert.equal(published.status, "published");
    assert.equal(published.version, initialVersion + 1);
  });

  it("records bodyweight metrics and retrieves chronological history", () => {
    const entry = appStore.addMetric("trainee_1", 80.2);
    assert.equal(entry.weightKg, 80.2);

    const history = appStore.getMetrics("trainee_1");
    assert.ok(history.length > 0);
    const last = history[history.length - 1];
    assert.equal(last.weightKg, 80.2);
  });

  it("generates trainer roster with calculated adherence and alert flags", () => {
    const roster = appStore.getRoster();
    assert.ok(roster.length >= 3);

    // Alex Rivera: high compliance
    const alexItem = roster.find((r) => r.trainee.id === "trainee_1");
    assert.ok(alexItem);
    assert.equal(alexItem?.adherencePercentage, 94);
    assert.equal(alexItem?.alerts[0].type, "optimal");

    // Marcus Vance: 3 missed sessions alert
    const marcusItem = roster.find((r) => r.trainee.id === "trainee_3");
    assert.ok(marcusItem);
    assert.equal(marcusItem?.adherencePercentage, 50);
    assert.ok(marcusItem?.alerts.some((a) => a.type === "missed_sessions"));
  });
});
