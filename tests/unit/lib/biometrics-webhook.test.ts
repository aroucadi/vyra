import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { appStore } from "../../../src/lib/store";
import { calculateReadinessScore, generateAutoregulationPlan } from "../../../src/lib/autoregulation";
import { POST, GET } from "../../../src/app/api/webhooks/biometrics/route";
import { deriveDayTimeline } from "../../../src/lib/timeline";

describe("Vyra Apple Health & Wearables Biometric Ingestion Engine", () => {
  const alaaId = "usr_trainee_alaa";
  const validSecret = "vyra_biometrics_key_2026";

  beforeEach(() => {
    // Reset test trainee biometrics in memory
    const existing = appStore.getWearableBiometricsHistory(alaaId);
    while (existing.length > 0) {
      existing.pop();
    }
  });

  it("modulates readiness score when autonomic HRV and deep sleep indicate CNS depression", () => {
    // 7.5 hours of sleep (typically optimal ~85 base)
    const nominalScore = calculateReadinessScore({ sleepHours: 7.5 });
    assert.strictEqual(nominalScore.state, "optimal");
    assert.ok(nominalScore.score >= 80);

    // Same 7.5 hours of sleep, but HRV is severely depressed (35ms vs 55ms baseline) and deep sleep is only 28m
    const suppressedScore = calculateReadinessScore({
      sleepHours: 7.5,
      hrvMs: 35,
      hrvBaselineMs: 55,
      deepSleepMinutes: 28,
    });

    assert.ok(
      suppressedScore.score < nominalScore.score,
      `Suppressed score (${suppressedScore.score}) must be lower than nominal score (${nominalScore.score})`
    );
    assert.strictEqual(suppressedScore.state, "suboptimal");
  });

  it("reflects autonomic biometric telemetry in generated clinical rationale", () => {
    const exercises = [
      {
        id: "ex_squat",
        name: "Barbell Back Squat",
        targetSets: 3,
        repLow: 5,
        repHigh: 5,
        targetRir: 1,
        plannedWeightKg: 140,
      },
    ];

    const plan = generateAutoregulationPlan(exercises, {
      sleepHours: 5.2,
      hrvMs: 38,
      hrvBaselineMs: 55,
      deepSleepMinutes: 30,
    });

    assert.strictEqual(plan.readinessState, "depleted");
    assert.strictEqual(plan.cnsFatigueDetected, true);
    assert.ok(
      plan.clinicalRationale.includes("HRV suppressed") || plan.clinicalRationale.includes("Deep Sleep"),
      "Clinical rationale must cite autonomic biomarker indicators"
    );
  });

  it("handles GET probe on /api/webhooks/biometrics with ready status and documentation link", async () => {
    const response = await GET();
    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.strictEqual(data.status, "ready");
    assert.ok(Array.isArray(data.supportedSources));
    assert.ok(data.supportedSources.includes("apple_health"));
    assert.ok(data.docs.includes("008-apple-health-biometric-webhook"));
  });

  it("rejects unauthorized webhook ingestion requests with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/biometrics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        traineeId: alaaId,
        sleepHours: 7.2,
        secretKey: "wrong_secret_key",
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.includes("Unauthorized"));
  });

  it("rejects malformed payloads with 400 when missing required traineeId or sleepHours", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/biometrics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${validSecret}`,
      },
      body: JSON.stringify({
        // Missing sleepHours and invalid traineeId
        traineeId: "",
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes("Invalid payload"));
  });

  it("successfully ingests Apple Health shortcut payload, computes autoregulation, and persists snapshot", async () => {
    const today = new Date().toISOString().split("T")[0];
    const payload = {
      traineeId: alaaId,
      source: "apple_health",
      secretKey: validSecret,
      date: today,
      sleepHours: 5.5,
      deepSleepMinutes: 32,
      remSleepMinutes: 65,
      hrvMs: 41,
      restingHeartRateBpm: 64,
      activeEnergyBurnedKcal: 480,
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/biometrics", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.snapshot);
    assert.strictEqual(body.snapshot.traineeId, alaaId);
    assert.strictEqual(body.snapshot.source, "apple_health");
    assert.strictEqual(body.snapshot.hrvMs, 41);
    assert.ok(body.autoregulation.score < 60, "Depleted HRV and low sleep should yield depleted readiness score");

    // Verify retrieval from appStore
    const saved = appStore.getLatestWearableBiometrics(alaaId);
    assert.ok(saved);
    assert.strictEqual(saved.hrvMs, 41);
    assert.strictEqual(saved.sleepHours, 5.5);

    // Verify deriveDayTimeline responds with dynamic sync status
    const timeline = deriveDayTimeline(alaaId, today);
    assert.ok(
      timeline.readinessStatus.includes("Fatigued") || timeline.readinessStatus.includes("Suboptimal"),
      `Readiness status must reflect CNS fatigue (got: ${timeline.readinessStatus})`
    );
  });
});
