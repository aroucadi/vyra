import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAxialLoadedExercise,
  calculateReadinessScore,
  generateAutoregulationPlan,
  MinimalExerciseTarget,
} from "../../../src/lib/autoregulation";

describe("Vyra Biomechanical Autoregulation Engine", () => {
  const sampleExercises: MinimalExerciseTarget[] = [
    {
      id: "ex_squat",
      name: "Barbell Back Squat",
      targetSets: 4,
      repLow: 5,
      repHigh: 5,
      targetRir: 1,
      plannedWeightKg: 140, // ~308 lbs
    },
    {
      id: "ex_rdl",
      name: "Barbell Romanian Deadlift",
      targetSets: 3,
      repLow: 8,
      repHigh: 10,
      targetRir: 2,
      plannedWeightKg: 100,
    },
    {
      id: "ex_curl",
      name: "Seated Leg Curl Machine",
      targetSets: 3,
      repLow: 10,
      repHigh: 12,
      targetRir: 1,
      plannedWeightKg: 50,
    },
    {
      id: "ex_calves",
      name: "Standing Machine Calf Raise",
      targetSets: 3,
      repLow: 12,
      repHigh: 15,
      targetRir: 1,
      plannedWeightKg: 60,
    },
  ];

  it("accurately detects high axial spinal loading movements", () => {
    assert.strictEqual(isAxialLoadedExercise("Barbell Back Squat"), true);
    assert.strictEqual(isAxialLoadedExercise("Barbell Romanian Deadlift"), true);
    assert.strictEqual(isAxialLoadedExercise("Standing Barbell Overhead Press"), true);
    assert.strictEqual(isAxialLoadedExercise("Dumbbell Romanian Deadlift"), true);
    assert.strictEqual(isAxialLoadedExercise("Barbell Row"), true);

    // Non-axial
    assert.strictEqual(isAxialLoadedExercise("Seated Leg Curl Machine"), false);
    assert.strictEqual(isAxialLoadedExercise("Cable Lateral Raise"), false);
    assert.strictEqual(isAxialLoadedExercise("Standing Machine Calf Raise"), false);
    assert.strictEqual(isAxialLoadedExercise("Incline Dumbbell Bicep Curl"), false);
  });

  it("calculates readiness scores and states across sleep tiers", () => {
    // 8+ hours
    const optimal = calculateReadinessScore({ sleepHours: 8.5 });
    assert.strictEqual(optimal.state, "optimal");
    assert.ok(optimal.score >= 80);

    // 6.5 hours
    const suboptimal = calculateReadinessScore({ sleepHours: 6.5 });
    assert.strictEqual(suboptimal.state, "suboptimal");
    assert.ok(suboptimal.score >= 60 && suboptimal.score < 80);

    // 5.0 hours
    const depleted = calculateReadinessScore({ sleepHours: 5.0 });
    assert.strictEqual(depleted.state, "depleted");
    assert.ok(depleted.score < 60);
  });

  it("preserves planned loading and targets progressive overload when sleep is optimal", () => {
    const plan = generateAutoregulationPlan(sampleExercises, { sleepHours: 8.0 });
    assert.strictEqual(plan.readinessState, "optimal");
    assert.strictEqual(plan.cnsFatigueDetected, false);

    const squat = plan.prescriptionDeltas.find((e) => e.id === "ex_squat");
    assert.ok(squat);
    assert.strictEqual(squat.adaptedWeightKg, 140);
    assert.strictEqual(squat.adaptedRir, 1);
    assert.strictEqual(squat.adaptedSets, 4);
    assert.strictEqual(squat.isSubstituted, false);
  });

  it("modulates load by ~5% and buffers RIR by +1 when sleep is suboptimal (6.5h)", () => {
    const plan = generateAutoregulationPlan(sampleExercises, { sleepHours: 6.5 });
    assert.strictEqual(plan.readinessState, "suboptimal");
    assert.strictEqual(plan.cnsFatigueDetected, true);

    const squat = plan.prescriptionDeltas.find((e) => e.id === "ex_squat");
    assert.ok(squat);
    // 140 * 0.95 = 133 -> rounded to 132.5 or 135
    assert.ok(squat.adaptedWeightKg < 140);
    assert.strictEqual(squat.adaptedRir, 2); // RIR 1 -> 2
  });

  it("protects spinal health under depleted sleep (5h) by down-regulating axial load 10% and offering machine substitutions", () => {
    const plan = generateAutoregulationPlan(sampleExercises, { sleepHours: 5.0 });
    assert.strictEqual(plan.readinessState, "depleted");
    assert.strictEqual(plan.cnsFatigueDetected, true);

    const squat = plan.prescriptionDeltas.find((e) => e.id === "ex_squat");
    assert.ok(squat);
    assert.strictEqual(squat.isSubstituted, true);
    assert.strictEqual(squat.adaptedName, "Hack Squat Machine");
    assert.ok(squat.adaptedWeightKg <= 127.5); // 140 * 0.90 = 126 -> rounded to 125
    assert.strictEqual(squat.adaptedRir, 2);
    assert.strictEqual(squat.adaptedSets, 3); // 4 sets reduced to 3

    const rdl = plan.prescriptionDeltas.find((e) => e.id === "ex_rdl");
    assert.ok(rdl);
    assert.strictEqual(rdl.isSubstituted, true);
    assert.strictEqual(rdl.adaptedName, "45° Back / Glute Hyperextension");

    // Non-axial exercise (Seated Leg Curl) load reduced by only 5%, not substituted
    const curl = plan.prescriptionDeltas.find((e) => e.id === "ex_curl");
    assert.ok(curl);
    assert.strictEqual(curl.isSubstituted, false);
    assert.strictEqual(curl.adaptedRir, 2);
  });
});
