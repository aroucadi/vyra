import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getActiveGeminiModel,
  getActiveVisionReasoningModel,
  sanitizeGeminiModelId,
  getGeminiAuthContext,
  getGeminiFallbackChain,
  generateGeminiContent,
  generateBiomechanicalFeedback,
  buildGeminiGenerationConfig,
  extractCandidateText,
  resolveGeminiTransport,
  clearVertexTokenCacheForTesting,
  GEMINI_MODEL_PRIORITY,
  VYRA_AI_CONFIG,
} from "../../../src/lib/gemini.ts";

describe("Vyra AI & Gemini Architecture Layer", () => {
  afterEach(() => {
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_VISION_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.K_SERVICE;
    delete process.env.VERTEX_ACCESS_TOKEN;
    clearVertexTokenCacheForTesting();
  });

  it("defaults to Gemini 4 Argon (gemini-4-argon) and restricts downgrade priority strictly to Gemini 4 Hydrogen / Argon -> Gemini 3.8 Flash", () => {
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_VISION_MODEL;
    const defaultModel = getActiveGeminiModel();
    const visionModel = getActiveVisionReasoningModel();
    assert.equal(defaultModel, "gemini-4-argon");
    assert.equal(visionModel, "gemini-4-argon");
    assert.equal(VYRA_AI_CONFIG.visionMediaResolution, "high");
    assert.equal(VYRA_AI_CONFIG.projectId, "vyra-509011");

    assert.deepEqual(Array.from(GEMINI_MODEL_PRIORITY), [
      "gemini-4-hydrogen",
      "gemini-4-argon",
      "gemini-3.8-flash",
    ]);
    assert.deepEqual(getGeminiFallbackChain("gemini-4-hydrogen"), [
      "gemini-4-hydrogen",
      "gemini-4-argon",
      "gemini-3.8-flash",
    ]);
  });

  it("supports Gemini 4 Hydrogen / Argon and 3.8 Flash while rejecting older models (3.5/3.1/2.5/pro) back to Gemini 4", () => {
    assert.equal(getActiveGeminiModel("gemini-4-hydrogen"), "gemini-4-hydrogen");
    assert.equal(getActiveGeminiModel("gemini-3.8-flash"), "gemini-3.8-flash");

    // Deprecated / below-3.8 models must be blocked and upgraded to gemini-4-argon
    assert.equal(sanitizeGeminiModelId("gemini-3.5-flash-lite"), "gemini-4-argon");
    assert.equal(sanitizeGeminiModelId("gemini-3.1-flash-lite"), "gemini-4-argon");
    assert.equal(sanitizeGeminiModelId("gemini-2.5-flash"), "gemini-4-argon");
    assert.equal(sanitizeGeminiModelId("gemini-3.8-pro"), "gemini-4-argon");
    assert.equal(getActiveGeminiModel("gemini-3.5-flash-lite"), "gemini-4-argon");

    process.env.GEMINI_MODEL = "gemini-4-hydrogen";
    assert.equal(getActiveGeminiModel(), "gemini-4-hydrogen");

    delete process.env.GEMINI_MODEL;
    assert.equal(getActiveGeminiModel(), "gemini-4-argon");
  });

  it("builds Gemini 4 generationConfig per spec (omits temperature, uses thinkingLevel, sets maxOutputTokens >= 8192)", () => {
    const argonCfg = buildGeminiGenerationConfig({
      model: "gemini-4-argon",
      thinkingLevel: "low",
      maxOutputTokens: 512,
      temperature: 0.2,
      responseMimeType: "application/json",
    });

    assert.equal(argonCfg.temperature, undefined);
    assert.deepEqual(argonCfg.thinkingConfig, { thinkingLevel: "low" });
    assert.ok((argonCfg.maxOutputTokens as number) >= 8192);
    assert.equal(argonCfg.responseMimeType, "application/json");

    const flashCfg = buildGeminiGenerationConfig({
      model: "gemini-3.8-flash",
      temperature: 0.2,
      maxOutputTokens: 2048,
    });
    assert.equal(flashCfg.temperature, 0.2);
    assert.equal(flashCfg.maxOutputTokens, 2048);
  });

  it("skips internal thought parts in extractCandidateText", () => {
    const text = extractCandidateText({
      candidates: [
        {
          content: {
            parts: [
              { text: "internal reasoning step...", thought: true },
              { text: '{"cueAdjustment":"Control descent for 2 seconds"}' },
            ],
          },
        },
      ],
    });
    assert.equal(text, '{"cueAdjustment":"Control descent for 2 seconds"}');
  });

  it("resolves AI Studio API key OR Cloud Run Vertex AI Metadata Server OAuth2 transport", async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.K_SERVICE = "vyra-app";
    const mockMetadataFetch = (async () =>
      new Response(
        JSON.stringify({ access_token: "ya29.mock_vertex_adc", expires_in: 3600 }),
        { status: 200 }
      )) as unknown as typeof fetch;

    const vertexTransport = await resolveGeminiTransport("gemini-4-argon", {
      fetchImpl: mockMetadataFetch,
    });
    assert.ok(vertexTransport);
    assert.equal(vertexTransport?.authMode, "vertex_ai_service_account");
    assert.ok(
      vertexTransport?.url.includes(
        "aiplatform.googleapis.com/v1/projects/vyra-509011/locations/global/publishers/google/models/gemini-4-argon:generateContent"
      )
    );
    assert.equal(vertexTransport?.headers.Authorization, "Bearer ya29.mock_vertex_adc");

    process.env.GEMINI_API_KEY = "test-studio-key";
    const studioTransport = await resolveGeminiTransport("gemini-4-argon");
    assert.equal(studioTransport?.authMode, "ai_studio_api_key");
    assert.equal(studioTransport?.headers["x-goog-api-key"], "test-studio-key");
  });

  it("resolves the dedicated vyra-app-sa service account context", () => {
    const auth = getGeminiAuthContext();
    assert.equal(auth.projectId, "vyra-509011");
    assert.equal(auth.serviceAccount, "vyra-app-sa@vyra-509011.iam.gserviceaccount.com");
    assert.equal(auth.model, "gemini-4-argon");
  });

  it("automatically falls back from gemini-4-hydrogen (404) -> gemini-4-argon -> gemini-3.8-flash", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const calledUrls: string[] = [];
    const fallbackFetch = (async (url: string | URL | Request) => {
      const urlStr = String(url);
      calledUrls.push(urlStr);
      if (urlStr.includes("gemini-4-hydrogen")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: "Argon live response." }],
              },
            },
          ],
        }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;

    const result = await generateGeminiContent("Check readiness", {
      model: "gemini-4-hydrogen",
      fetchImpl: fallbackFetch,
    });

    assert.equal(result.modelUsed, "gemini-4-argon");
    assert.equal(result.liveExecution, true);
    assert.equal(result.text, "Argon live response.");
    assert.equal(calledUrls.length, 2);
  });

  it("parses live Gemini JSON biomechanical feedback when transport responds and falls back safely offline", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const mockFetch = (async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { thought: true, text: "thinking..." },
                  {
                    text: JSON.stringify({
                      cueAdjustment: "Tuck elbows 30 degrees and pause 1s on chest.",
                      sensationCheck: "Upper chest stretch without front-shoulder pinch.",
                      suggestedSwap: "Neutral-Grip Dumbbell Press",
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      )) as unknown as typeof fetch;

    const liveFeedback = await generateBiomechanicalFeedback(
      {
        exerciseName: "30° Incline Dumbbell Press",
        struggleNote: "Felt shoulder pinch at bottom of rep",
        rpe: 8.5,
        equipmentType: "dumbbell",
      },
      { fetchImpl: mockFetch }
    );

    assert.equal(liveFeedback.modelUsed, "gemini-4-argon");
    assert.equal(liveFeedback.cueAdjustment, "Tuck elbows 30 degrees and pause 1s on chest.");
    assert.equal(liveFeedback.suggestedSwap, "Neutral-Grip Dumbbell Press");

    delete process.env.GEMINI_API_KEY;
    const offlineFeedback = await generateBiomechanicalFeedback({
      exerciseName: "30° Incline Dumbbell Press",
      struggleNote: "Felt shoulder pinch at bottom of rep",
      rpe: 8.5,
      equipmentType: "dumbbell",
    });
    assert.equal(offlineFeedback.modelUsed, "gemini-4-argon");
    assert.ok(offlineFeedback.cueAdjustment.length > 0);
    assert.ok(offlineFeedback.sensationCheck.length > 0);
  });
});
