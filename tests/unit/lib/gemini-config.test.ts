import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getActiveGeminiModel,
  getGeminiAuthContext,
  generateGeminiContent,
  generateBiomechanicalFeedback,
  VYRA_AI_CONFIG,
} from "../../../src/lib/gemini.ts";

describe("Vyra AI & Gemini Architecture Layer", () => {
  it("defaults to Gemini 3.8 Flash as the primary model", () => {
    delete process.env.GEMINI_MODEL;
    const defaultModel = getActiveGeminiModel();
    assert.equal(defaultModel, "gemini-3.8-flash");
    assert.equal(VYRA_AI_CONFIG.projectId, "vyra-509011");
  });

  it("supports model configuration via environment variable and per-call override", () => {
    // 1. Per-call override
    const callOverride = getActiveGeminiModel("gemini-3.8-pro");
    assert.equal(callOverride, "gemini-3.8-pro");

    const flash25 = getActiveGeminiModel("gemini-2.5-flash");
    assert.equal(flash25, "gemini-2.5-flash");

    // 2. Env variable override
    process.env.GEMINI_MODEL = "gemini-3.8-pro";
    assert.equal(getActiveGeminiModel(), "gemini-3.8-pro");

    delete process.env.GEMINI_MODEL;
  });

  it("resolves the dedicated vyra-app-sa service account context", () => {
    const auth = getGeminiAuthContext();
    assert.equal(auth.projectId, "vyra-509011");
    assert.equal(auth.serviceAccount, "vyra-app-sa@vyra-509011.iam.gserviceaccount.com");
    assert.ok(auth.model.includes("gemini"));
  });

  it("generates synthesis content adhering to selected model", async () => {
    const response = await generateGeminiContent("Synthesize biomechanical feedback for shoulder impingement", {
      model: "gemini-3.8-flash",
    });

    assert.equal(response.modelUsed, "gemini-3.8-flash");
    assert.ok(response.text.length > 0);
  });

  it("generates structured biomechanical struggle feedback via Gemini 3.8 Flash", async () => {
    const feedback = await generateBiomechanicalFeedback({
      exerciseName: "30° Incline Dumbbell Press",
      struggleNote: "Felt shoulder pinch at bottom of rep",
      rpe: 8.5,
      equipmentType: "dumbbell",
    });

    assert.equal(feedback.modelUsed, "gemini-3.8-flash");
    assert.ok(feedback.cueAdjustment.length > 0);
    assert.ok(feedback.sensationCheck.length > 0);
  });
});
