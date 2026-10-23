import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store";
import { resolveCoachQuery } from "../../../src/lib/coach-engine";

describe("Vyra AI Coach Smart Action Cards & Program Mutation Engine", () => {
  const alaaId = "trainee_alaa";

  it("resolves exercise swap query into structured Smart Action Card", () => {
    const query = "My shoulder hurts on incline machine, can I swap it?";
    const response = resolveCoachQuery(alaaId, query);

    assert.ok(response.text.length > 20);
    assert.ok(response.card, "Response must contain a smart action card");
    assert.strictEqual(response.card?.type, "swap");
    assert.ok(response.card?.headline.includes("Incline Machine Chest Press"));
    assert.ok(response.card?.headline.includes("30° Incline Dumbbell Press"));
    assert.strictEqual(response.card?.actionPayload.actionType, "swap");
    assert.strictEqual(response.card?.actionPayload.currentExercise, "Incline Machine Chest Press");
    assert.strictEqual(response.card?.actionPayload.newExercise, "30° Incline Dumbbell Press");
  });

  it("resolves short on time query into condensed session Smart Action Card", () => {
    const query = "I am in a hurry today, condense my workout to 30 min";
    const response = resolveCoachQuery(alaaId, query);

    assert.ok(response.card, "Response must contain a condensed workout card");
    assert.strictEqual(response.card?.type, "condense");
    assert.strictEqual(response.card?.actionPayload.actionType, "condense");
    assert.strictEqual(response.card?.actionPayload.targetMinutes, 30);
    assert.ok(response.card?.details.some((d) => d.label === "Session Cap" && d.value === "30 Minutes"));
  });

  it("resolves sleep recovery query with biometric awareness", () => {
    // Seed low sleep snapshot
    appStore.saveWearableBiometrics({
      traineeId: alaaId,
      date: new Date().toISOString().split("T")[0],
      source: "apple_health",
      sleepHours: 5.2,
      hrvMs: 38,
      readinessScore: 50,
      cnsFatigueDetected: true,
    });

    const response = resolveCoachQuery(alaaId, "I feel fatigued and only slept 5 hours");
    assert.ok(response.card, "Must offer autoregulation card under fatigue");
    assert.strictEqual(response.card?.type, "autoregulate");
    assert.strictEqual(response.card?.actionPayload.actionType, "autoregulate");
    assert.strictEqual(response.card?.actionPayload.loadFactor, 0.9);
    assert.strictEqual(response.card?.actionPayload.rirDelta, 1);
  });

  it("mutates active program when swapExerciseInActiveProgram is called", () => {
    const beforeProg = appStore.getActiveProgramForTrainee(alaaId);
    assert.ok(beforeProg);

    const swapRes = appStore.swapExerciseInActiveProgram(
      alaaId,
      "Incline Machine Chest Press",
      "30° Incline Dumbbell Press",
      0 // Monday or Thursday
    );

    assert.strictEqual(swapRes.success, true);
    assert.ok(swapRes.message.includes("Successfully swapped"));

    const afterProg = appStore.getActiveProgramForTrainee(alaaId);
    assert.ok(afterProg);

    // Verify presence of replacement exercise in program blocks
    const allExercises = afterProg.weeks.flatMap((w) => w.days).flatMap((d) => d.blocks).flatMap((b) => b.exercises);
    const hasReplacement = allExercises.some((e) => e.exerciseName === "30° Incline Dumbbell Press");
    assert.strictEqual(hasReplacement, true, "Program must contain swapped exercise");
  });

  it("mutates active program when condenseActiveProgramDay is called", () => {
    const res = appStore.condenseActiveProgramDay(alaaId, 30, 0);
    assert.strictEqual(res.success, true);
    assert.ok(res.totalSets > 0 && res.totalSets <= 12, "Total sets must be tightly constrained");
  });

  it("mutates active program when recalibrateActiveProgramLoads is called", () => {
    const res = appStore.recalibrateActiveProgramLoads(alaaId, 0.9, 1, 0);
    assert.strictEqual(res.success, true);
    assert.ok(res.adjustedExercises.length > 0, "Should adjust target day exercises with RIR buffer");
  });

  it("resolves why this weight query into interactive Double Progression formula card with deterministic math", () => {
    const response = resolveCoachQuery(alaaId, "Why this weight prescribed for my squats?");
    assert.ok(response.card, "Must generate a Smart Action Card for load explanation");
    assert.strictEqual(response.card?.type, "load_explanation");
    assert.ok(response.card?.interactiveData, "Card must include interactiveData with deterministic math");
    assert.ok(response.card?.interactiveData?.formula.includes("Next Load = Current Load + 2.5kg"));
    assert.strictEqual(response.card?.interactiveData?.nextIncrementKg, 2.5);
    assert.ok(response.card?.details.some((d) => d.label === "Rep Target" && d.value === "8–10 Reps"));
  });
});
