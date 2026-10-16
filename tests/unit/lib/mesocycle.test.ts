import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MESOCYCLE_SPLITS,
  STANDARD_MESOCYCLE_PHASES,
  resolveMesocyclePlan,
  saveUserMesocyclePreference,
} from "../../../src/lib/mesocycle.ts";
import { telemetry } from "../../../src/lib/telemetry.ts";

describe("Spec 027: Post-Session 1 Adaptive 16-Week Mesocycle Architect", () => {
  it("1. Defines rigorous biomechanical split structures for 3, 4, and 5-day frequencies", () => {
    // 3 Days / Week (Full Body Kinetic Rotation for 2-3x/wk frequency)
    const split3 = MESOCYCLE_SPLITS[3];
    assert.equal(split3.frequency, 3);
    assert.equal(split3.splitName, "Full Body Kinetic Rotation (2–3×/wk Frequency)");
    assert.equal(split3.days.length, 3);
    assert.equal(split3.restDaysCount, 4);
    assert.equal(split3.weeklySetsPerMuscle, 12);
    assert.equal(split3.recommended, false);

    // 4 Days / Week (Optimal Recommended)
    const split4 = MESOCYCLE_SPLITS[4];
    assert.equal(split4.frequency, 4);
    assert.equal(split4.splitName, "Upper / Lower Antagonistic Balance");
    assert.equal(split4.days.length, 4);
    assert.equal(split4.restDaysCount, 3);
    assert.equal(split4.recommended, true, "4-day Upper/Lower must be recommended");

    // 5 Days / Week
    const split5 = MESOCYCLE_SPLITS[5];
    assert.equal(split5.frequency, 5);
    assert.equal(split5.splitName, "Upper / Lower / Push / Pull / Legs");
    assert.equal(split5.days.length, 5);
    assert.equal(split5.restDaysCount, 2);
    assert.equal(split5.recommended, false);
  });

  it("2. Validates 4-phase periodization structure (Accumulation, Deload, Intensification, Realization)", () => {
    assert.equal(STANDARD_MESOCYCLE_PHASES.length, 4);

    const [p1, p2, p3, p4] = STANDARD_MESOCYCLE_PHASES;
    assert.equal(p1.weeks, "Weeks 1–4");
    assert.ok(p1.name.includes("Accumulation"));
    assert.equal(p1.rirTarget, 2);

    assert.equal(p2.weeks, "Week 5");
    assert.ok(p2.name.includes("Deload"));
    assert.equal(p2.rirTarget, 4, "Deload must program 4 RIR to ensure CNS recovery");

    assert.equal(p3.weeks, "Weeks 6–11");
    assert.ok(p3.name.includes("Intensification"));
    assert.ok(p3.overloadStrategy.includes("+2.5kg"));

    assert.equal(p4.weeks, "Weeks 12–16");
    assert.ok(p4.name.includes("Realization"));
  });

  it("3. Resolves customized mesocycle plans with goal-aware strength and volume projections", () => {
    // 1. Strength Goal
    const planStrength = resolveMesocyclePlan(4, "strength", 100);
    assert.equal(planStrength.frequency, 4);
    assert.equal(planStrength.goal, "strength");
    assert.ok(planStrength.projectedStrengthGainRange.minKg > 0);
    assert.ok(planStrength.projectedStrengthGainRange.maxKg > planStrength.projectedStrengthGainRange.minKg);
    assert.equal(planStrength.projectedStrengthGainRange.minKg, 12.0); // 100 * 0.12 = 12.0 kg
    assert.equal(planStrength.projectedStrengthGainRange.maxKg, 22.0); // 100 * 0.22 = 22.0 kg

    // 2. Hypertrophy Goal
    const planHyp = resolveMesocyclePlan(4, "hypertrophy", 100);
    assert.equal(planHyp.projectedStrengthGainRange.minKg, 10.0); // 100 * 0.10 = 10.0 kg
    assert.equal(planHyp.projectedStrengthGainRange.maxKg, 18.0); // 100 * 0.18 = 18.0 kg
    assert.ok(planHyp.projectedVolumeIncreasePercent > planHyp.projectedStrengthGainRange.minKg);

    // 3. Frequency Scaling (5 days yields higher projected volume increase than 3 days)
    const plan3 = resolveMesocyclePlan(3, "hypertrophy", 100);
    const plan5 = resolveMesocyclePlan(5, "hypertrophy", 100);
    assert.ok(plan5.projectedVolumeIncreasePercent > plan3.projectedVolumeIncreasePercent);
    assert.ok(plan5.projectedStrengthGainRange.maxKg > plan3.projectedStrengthGainRange.maxKg);
    // 4. Boundary and Input Hardening
    const negativePlan = resolveMesocyclePlan(4, "strength", -50);
    assert.ok(negativePlan.projectedStrengthGainKg > 0, "Negative benchmark must be clamped to safe minimum");
    assert.equal(negativePlan.benchmark1RmKg, 20);

    const extremePlan = resolveMesocyclePlan(4, "strength", 9999);
    assert.equal(extremePlan.benchmark1RmKg, 500, "Extreme benchmark must be clamped to safe ceiling");

    // Invalid frequency fallback
    const fallbackPlan = resolveMesocyclePlan(7 as any, "strength", 100);
    assert.equal(fallbackPlan.frequency, 4, "Invalid frequency must fallback to 4 days");
  });

  it("4. Persists mesocycle preference safely and dispatches telemetry events", () => {
    const res = saveUserMesocyclePreference("trainee_1", 4, "hypertrophy");
    assert.equal(res.success, true);

    const invalidRes = saveUserMesocyclePreference("trainee_1", 9 as any, "strength");
    assert.equal(invalidRes.success, true);

    telemetry.clear();
    telemetry.track("mesocycle_frequency_selected", { frequency: 4, goal: "hypertrophy" }, "trainee_1");
    const events = telemetry.getEventsByName("mesocycle_frequency_selected");
    assert.equal(events.length, 1);
    assert.equal(events[0].properties.frequency, 4);
  });
});
