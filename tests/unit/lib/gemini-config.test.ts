import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getActiveGeminiModel,
  getActiveVisionReasoningModel,
  sanitizeGeminiModelId,
  getGeminiAuthContext,
  generateGeminiContent,
  generateBiomechanicalFeedback,
  VYRA_AI_CONFIG,
} from "../../../src/lib/gemini.ts";

describe("Vyra AI & Gemini Architecture Layer", () => {
  it("defaults to Gemini 4 Argon (gemini-4-argon) as the primary and vision reasoning model", () => {
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_VISION_MODEL;
    const defaultModel = getActiveGeminiModel();
    const visionModel = getActiveVisionReasoningModel();
    assert.equal(defaultModel, "gemini-4-argon");
    assert.equal(visionModel, "gemini-4-argon");
    assert.equal(VYRA_AI_CONFIG.visionMediaResolution, "high");
    assert.equal(VYRA_AI_CONFIG.projectId, "vyra-509011");
  });

  it("supports valid model configuration and automatically sanitizes deprecated or non-existent model IDs to gemini-4-argon", () => {
    // 1. Valid per-call override
    const flashOverride = getActiveGeminiModel("gemini-3.8-flash");
    assert.equal(flashOverride, "gemini-3.8-flash");

    const flashLiteOverride = getActiveGeminiModel("gemini-3.5-flash-lite");
    assert.equal(flashLiteOverride, "gemini-3.5-flash-lite");

    // 2. Deprecated (2.5/2.0/1.5) or non-existent (3.8-pro) models must be blocked and sanitized to gemini-4-argon
    assert.equal(sanitizeGeminiModelId("gemini-2.5-flash"), "gemini-4-argon");
    assert.equal(sanitizeGeminiModelId("gemini-3.8-pro"), "gemini-4-argon");
    assert.equal(getActiveGeminiModel("gemini-2.5-flash"), "gemini-4-argon");
    assert.equal(getActiveGeminiModel("gemini-3.8-pro"), "gemini-4-argon");

    // 3. Env variable override with valid model
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    assert.equal(getActiveGeminiModel(), "gemini-3.8-flash");

    delete process.env.GEMINI_MODEL;
    assert.equal(getActiveGeminiModel(), "gemini-4-argon");
  });

  it("resolves the dedicated vyra-app-sa service account context", () => {
    const auth = getGeminiAuthContext();
    assert.equal(auth.projectId, "vyra-509011");
    assert.equal(auth.serviceAccount, "vyra-app-sa@vyra-509011.iam.gserviceaccount.com");
    assert.equal(auth.model, "gemini-4-argon");
  });

  it("generates synthesis content adhering to selected model", async () => {
    const response = await generateGeminiContent("Synthesize biomechanical feedback for shoulder impingement", {
      model: "gemini-4-argon",
    });

    assert.equal(response.modelUsed, "gemini-4-argon");
    assert.ok(response.text.length > 0);
  });

  it("generates structured biomechanical struggle feedback via Gemini 4 Argon by default", async () => {
    const feedback = await generateBiomechanicalFeedback({
      exerciseName: "30° Incline Dumbbell Press",
      struggleNote: "Felt shoulder pinch at bottom of rep",
      rpe: 8.5,
      equipmentType: "dumbbell",
    });

    assert.equal(feedback.modelUsed, "gemini-4-argon");
    assert.ok(feedback.cueAdjustment.length > 0);
    assert.ok(feedback.sensationCheck.length > 0);
  });
});
