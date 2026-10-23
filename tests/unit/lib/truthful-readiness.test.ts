import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { appStore } from "../../../src/lib/store";
import { generateAutoregulationPlan, MinimalExerciseTarget } from "../../../src/lib/autoregulation";
import { deriveDayTimeline } from "../../../src/lib/timeline";
import { resolveCoachQuery } from "../../../src/lib/coach-engine";

describe("Truthful Readiness Data & Copy Jargon Guardrails", () => {
  const alaaId = "trainee_alaa";
  const forbiddenRegex = /Apple Watch|HRV|autonomic|nervous system|CNS|biometric|detected/i;

  const sampleExercises: MinimalExerciseTarget[] = [
    {
      id: "ex_press",
      name: "30° Incline Dumbbell Press",
      targetSets: 3,
      repLow: 8,
      repHigh: 10,
      targetRir: 2,
      plannedWeightKg: 28,
    },
    {
      id: "ex_rdl",
      name: "Barbell Romanian Deadlift",
      targetSets: 3,
      repLow: 8,
      repHigh: 10,
      targetRir: 2,
      plannedWeightKg: 90,
    },
  ];

  it("stores only truthful manual fields and deletes invented hrvMs / readinessScore", () => {
    const today = new Date().toISOString().split("T")[0];
    const snapshot = appStore.saveDailyReadinessCheckin(alaaId, 6.0, "moderate", today);

    assert.strictEqual(snapshot.source, "manual");
    assert.strictEqual(snapshot.sleepHours, 6.0);
    assert.strictEqual(snapshot.answer, "moderate");
    assert.strictEqual(snapshot.reducedRecovery, true);
    assert.strictEqual(snapshot.hrvMs, undefined, "Manual check-in must never store invented hrvMs");
    assert.strictEqual(snapshot.readinessScore, undefined, "Manual check-in must never store invented readinessScore");
  });

  it("verifies manual readiness states never produce forbidden jargon in card text or insights", () => {
    const states: ("light" | "moderate" | "good" | "full")[] = ["light", "moderate", "good", "full"];
    const hoursMap = { light: 4.5, moderate: 6.0, good: 7.2, full: 8.5 };

    for (const st of states) {
      const hours = hoursMap[st];
      const testDate = `2026-10-1${states.indexOf(st)}`;
      const manualSnapshot = appStore.saveDailyReadinessCheckin(alaaId, hours, st, testDate);

      // 1. Check Autoregulation Plan generated from manual input
      const plan = generateAutoregulationPlan(sampleExercises, { sleepHours: hours });
      assert.strictEqual(
        forbiddenRegex.test(plan.headline),
        false,
        `plan.headline for ${st} must not contain forbidden copy: ${plan.headline}`
      );
      assert.strictEqual(
        forbiddenRegex.test(plan.clinicalRationale),
        false,
        `plan.clinicalRationale for ${st} must not contain forbidden copy: ${plan.clinicalRationale}`
      );

      for (const delta of plan.prescriptionDeltas) {
        assert.strictEqual(
          forbiddenRegex.test(delta.rationale),
          false,
          `prescription delta rationale must not contain forbidden copy: ${delta.rationale}`
        );
      }

      // 2. Check Day Timeline insight sentence & prompt
      const timeline = deriveDayTimeline(alaaId, testDate);
      if (timeline.insight) {
        assert.strictEqual(
          forbiddenRegex.test(timeline.insight.sentence),
          false,
          `timeline insight sentence for ${st} must not contain forbidden copy: ${timeline.insight.sentence}`
        );
        assert.strictEqual(
          forbiddenRegex.test(timeline.insight.whyPrompt),
          false,
          `timeline whyPrompt for ${st} must not contain forbidden copy: ${timeline.insight.whyPrompt}`
        );
        // Manual copy must say "You said X h"
        assert.ok(
          timeline.insight.sentence.includes(`You said ${hours} h sleep`),
          `Timeline insight must state 'You said ${hours} h sleep' (got: ${timeline.insight.sentence})`
        );
      }

      // 3. Check Coach Query response
      const coachResp = resolveCoachQuery(alaaId, `I slept ${hours} hours last night`);
      assert.strictEqual(
        forbiddenRegex.test(coachResp.text),
        false,
        `coach response text for ${st} must not contain forbidden copy: ${coachResp.text}`
      );
      if (coachResp.card) {
        assert.strictEqual(
          forbiddenRegex.test(coachResp.card.headline),
          false,
          `coach card headline for ${st} must not contain forbidden copy: ${coachResp.card.headline}`
        );
        assert.strictEqual(
          forbiddenRegex.test(coachResp.card.subtext),
          false,
          `coach card subtext for ${st} must not contain forbidden copy: ${coachResp.card.subtext}`
        );
      }
    }
  });
});
