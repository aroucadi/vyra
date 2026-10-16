import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyCalibratedWeightsToDayOne,
  buildHandoffQueryUrl,
  deriveStartingWeightsFromAnchor,
  detectInAppWebView,
  isDayZeroUser,
  parseHandoffQueryUrl,
  resolveDayOneWorkoutDay,
  roundToGymIncrement,
} from "../../../src/lib/onboarding.ts";
import { deriveDayTimeline } from "../../../src/lib/timeline.ts";
import { hasEntitlement } from "../../../src/lib/entitlements.ts";
import { telemetry } from "../../../src/lib/telemetry.ts";

describe("Spec 019: Zero-Gate Day-0 Onboarding & Trust Calibration ('Couch-to-Rack Proxy')", () => {
  it("1. Isolates Day-0 /today timeline to Day 1 workout hero and suppresses supplements/hydration/rest-day defaults", () => {
    const timeline = deriveDayTimeline("trainee_1", "2026-10-18", 8, { forceDayZero: true });

    assert.equal(timeline.isDayZero, true);
    assert.equal(timeline.isRestDay, false, "Day 0 must never resolve to a rest day");
    assert.equal(timeline.moments.length, 1, "Day 0 must hide morning/evening supplement and hydration moments");
    assert.equal(timeline.heroMoment?.id, "moment_workout_day_one");
    assert.ok(timeline.heroMoment?.title.startsWith("Day 1 starts today"));
    assert.equal(timeline.heroMoment?.actionLabel, "Start Day 1 Session");
    assert.equal(timeline.insight, undefined, "Day 0 must not fabricate unverified wearable HRV insights");
  });

  it("2. Always resolves a real lifting session for Day 1 via resolveDayOneWorkoutDay", () => {
    const dayOne = resolveDayOneWorkoutDay("trainee_1");

    assert.ok(dayOne.programDay, "Must resolve Week 1 Day 1 lifting session");
    assert.equal(dayOne.programDay?.isRestDay, false);
    assert.ok(dayOne.exerciseCount > 0);
    assert.ok(dayOne.estimatedMinutes >= 25 && dayOne.estimatedMinutes <= 60);
    assert.ok(dayOne.primaryExercise);
  });

  it("3. Derives all Day-1 starting weights in <150ms from 1 compound anchor lift using Epley + Poliquin ratios", () => {
    const t0 = performance.now();
    const res = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 80,
      reps: 8,
      unit: "kg",
      sleepMode: "normal",
    });
    const elapsedMs = performance.now() - t0;

    assert.ok(elapsedMs < 150, `Expected <150ms derivation, took ${elapsedMs.toFixed(2)}ms`);
    // 80 * (1 + 8/30) = 101.333 -> 101.3 kg e1RM
    assert.equal(res.estimatedBench1RmKg, 101.3);
    assert.ok(res.targets.length > 0);

    const firstTarget = res.targets[0];
    assert.ok(firstTarget.normalWeightKg > 0);
    assert.equal(firstTarget.activeWeightKg, firstTarget.normalWeightKg);
    assert.ok(firstTarget.whyHeadline.includes(`Why ${firstTarget.displayWeight} kg?`));
    assert.ok(firstTarget.whyFormulaText.includes("101.3 kg e1RM (Epley)"));
  });

  it("4. Applies reversible Sleep What-If (-10% load buffer and +1 RIR on 5h short sleep)", () => {
    const normalRes = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 100,
      reps: 5,
      unit: "kg",
      sleepMode: "normal",
    });
    const shortRes = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 100,
      reps: 5,
      unit: "kg",
      sleepMode: "short",
    });

    const tNormal = normalRes.targets[0];
    const tShort = shortRes.targets[0];

    assert.ok(tShort.activeWeightKg < tNormal.activeWeightKg, "Short sleep must buffer working weight down");
    assert.equal(tShort.targetRir, tNormal.targetRir + 1, "Short sleep must add +1 RIR safety buffer");
    assert.ok(tShort.whyFormulaText.includes("-10% short-sleep buffer"));
  });

  it("5. Supports lb unit conversion and 'Calibrate as I lift' fallback persistence into Day 1 program", () => {
    const lbRes = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "dumbbell_bench",
      weight: 70,
      reps: 8,
      unit: "lb",
      sleepMode: "normal",
      mode: "calibrated",
    });

    assert.equal(lbRes.unit, "lb");
    assert.equal(lbRes.targets[0].displayWeight % 5, 0, "Pound weights must round to 5 lb increments");

    const appliedCalibrated = applyCalibratedWeightsToDayOne("trainee_1", lbRes);
    assert.ok(appliedCalibrated.updatedCount > 0);

    const fallbackRes = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 80,
      reps: 8,
      unit: "kg",
      mode: "calibrate_as_i_lift",
    });
    const appliedFallback = applyCalibratedWeightsToDayOne("trainee_1", fallbackRes);
    assert.ok(appliedFallback.updatedCount > 0);
  });

  it("6. Detects Instagram, Reddit, and TikTok in-app WebViews and recommends Safari on iOS / Chrome on Android", () => {
    const igIos = detectInAppWebView(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 302.0"
    );
    assert.equal(igIos.isInAppWebView, true);
    assert.equal(igIos.sourceApp, "Instagram");
    assert.equal(igIos.recommendedBrowser, "Safari");

    const redditAndroid = detectInAppWebView(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 Reddit/Version 2024.1"
    );
    assert.equal(redditAndroid.isInAppWebView, true);
    assert.equal(redditAndroid.sourceApp, "Reddit");
    assert.equal(redditAndroid.recommendedBrowser, "Chrome");

    const standardSafari = detectInAppWebView(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1"
    );
    assert.equal(standardSafari.isInAppWebView, false);
    assert.equal(standardSafari.sourceApp, null);
  });

  it("7. Serializes and parses stateless WebView handoff URLs (?anchor=80x8&unit=kg)", () => {
    const url = buildHandoffQueryUrl("https://app.vyra.fit/today", {
      anchorLift: "barbell_bench",
      weight: 82.5,
      reps: 6,
      unit: "kg",
      sleepMode: "short",
      mode: "calibrated",
    });

    assert.ok(url.includes("anchor=82.5x6"));
    assert.ok(url.includes("unit=kg"));
    assert.ok(url.includes("sleep=short"));

    const queryPart = url.split("?")[1];
    const parsed = parseHandoffQueryUrl(queryPart);
    assert.ok(parsed);
    assert.equal(parsed?.weight, 82.5);
    assert.equal(parsed?.reps, 6);
    assert.equal(parsed?.unit, "kg");
    assert.equal(parsed?.sleepMode, "short");
    assert.equal(parsed?.anchorLift, "barbell_bench");
  });

  it("8. Unlocks anatomical_tension_spotlight and substitution_copilot_preview in FREE tier and tracks non-PII onboarding telemetry", () => {
    assert.equal(hasEntitlement("FREE", "anatomical_tension_spotlight"), true);
    assert.equal(hasEntitlement("FREE", "substitution_copilot_preview"), true);
    assert.equal(hasEntitlement("FREE", "progression_engine"), false, "Longitudinal engine remains PRO gated");

    telemetry.clear();
    telemetry.track("onboarding_step_viewed", { step: "step_1_see_day_one", email: "secret@example.com" }, "u_test");
    const events = telemetry.getEventsByName("onboarding_step_viewed");
    assert.equal(events.length, 1);
    assert.equal(events[0].properties.step, "step_1_see_day_one");
    assert.equal(events[0].properties.email, undefined, "PII filter must strip email");
    assert.equal(roundToGymIncrement(31.2, "kg"), 30);
    assert.equal(isDayZeroUser("brand_new_unseeded_user_id"), true);
  });

  it("9. Spec 024: 1-Tap Goal Selector adjusts rep targets, RIR, loads, and handoff URL serialization", () => {
    // 1. Hypertrophy (Default)
    const hyp = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 80,
      reps: 8,
      unit: "kg",
      goal: "hypertrophy",
    });
    assert.equal(hyp.goal, "hypertrophy");
    assert.equal(hyp.targets[0].repRange, "8-12");
    assert.equal(hyp.targets[0].targetRir, 2);

    // 2. Strength (+8% load intensity, 5-8 reps, 3 RIR)
    const str = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 80,
      reps: 8,
      unit: "kg",
      goal: "strength",
    });
    assert.equal(str.goal, "strength");
    assert.equal(str.targets[0].repRange, "5-8");
    assert.equal(str.targets[0].targetRir, 3);
    assert.ok(str.targets[0].activeWeightKg >= hyp.targets[0].activeWeightKg);
    assert.ok(str.targets[0].whyFormulaText.includes("[Strength]"));

    // 3. Posture Balance (10-15 reps, 2 RIR)
    const pos = deriveStartingWeightsFromAnchor("trainee_1", {
      anchorLift: "barbell_bench",
      weight: 80,
      reps: 8,
      unit: "kg",
      goal: "posture",
    });
    assert.equal(pos.goal, "posture");
    assert.equal(pos.targets[0].repRange, "10-15");
    assert.ok(pos.targets[0].whyFormulaText.includes("[Posture & Balance]"));

    // 4. URL Serialization & Deserialization
    const handoffUrl = buildHandoffQueryUrl("https://app.vyra.fit/today", {
      anchorLift: "barbell_bench",
      weight: 80,
      reps: 8,
      unit: "kg",
      goal: "strength",
    });
    assert.ok(handoffUrl.includes("goal=strength"));
    const parsed = parseHandoffQueryUrl(handoffUrl.split("?")[1]);
    assert.equal(parsed?.goal, "strength");

    // 5. Telemetry event verification
    telemetry.clear();
    telemetry.track("goal_selected", { goal: "strength" }, "trainee_1");
    const goalEvents = telemetry.getEventsByName("goal_selected");
    assert.equal(goalEvents.length, 1);
    assert.equal(goalEvents[0].properties.goal, "strength");
  });
});
