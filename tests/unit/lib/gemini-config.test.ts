import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getActiveGeminiModel,
  getGeminiAuthContext,
  generateGeminiContent,
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
});
