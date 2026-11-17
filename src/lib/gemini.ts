/**
 * Vyra AI & Gemini Architecture Layer
 *
 * Provides unified, configurable access to Google Gemini models across:
 * - Vertex AI via Google Cloud Metadata Server OAuth2 ADC (`vyra-app-sa` / Cloud Run SA)
 * - Google AI Studio API key (`GEMINI_API_KEY`)
 * - Graceful deterministic offline mode when unconfigured
 *
 * Default Model: Gemini 4 Argon (`gemini-4-argon`) — Frontier 1M-token unified context,
 * multimodal reasoning (Text, Image, Video, Audio, PDF), structured JSON outputs, and
 * multi-turn tool calling.
 */

export const GEMINI_MODEL_PRIORITY = [
  "gemini-4-hydrogen",
  "gemini-4-argon",
  "gemini-3.8-flash",
] as const;

export type GeminiModelId =
  | "gemini-4-hydrogen"
  | "gemini-4-argon"
  | "gemini-3.8-flash"
  | string;

export type GeminiThinkingLevel = "low" | "medium" | "high";

const DEPRECATED_OR_INVALID_MODEL_PATTERNS = [
  /^gemini-3\.7/i,
  /^gemini-3\.6/i,
  /^gemini-3\.5/i,
  /^gemini-3\.1/i,
  /^gemini-3\.0/i,
  /^gemini-2\.5/i,
  /^gemini-2\.0/i,
  /^gemini-1\.5/i,
  /^gemini-1\.0/i,
  /^gemini-3\.8-pro/i,
];

/**
 * Ensures deprecated legacy models (e.g. 3.5-flash-lite, 3.1-flash-lite, 2.5, 2.0, 1.5)
 * or non-existent model IDs (e.g. gemini-3.8-pro) are never used, defaulting to `gemini-4-argon`.
 * Only Gemini 4 series (`gemini-4-hydrogen`, `gemini-4-argon`) and `gemini-3.8-flash` (sole fallback) are permitted.
 */
export function sanitizeGeminiModelId(candidate?: string): string {
  const trimmed = candidate?.trim();
  if (!trimmed) {
    return "gemini-4-argon";
  }
  for (const pattern of DEPRECATED_OR_INVALID_MODEL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return "gemini-4-argon";
    }
  }
  return trimmed;
}

/**
 * Ordered execution chain prioritizing Gemini 4 Hydrogen / Argon first,
 * downgrading solely to `gemini-3.8-flash` if Gemini 4 is unavailable on the target endpoint.
 */
export function getGeminiFallbackChain(preferredModel?: string): string[] {
  const sanitizedPreferred = sanitizeGeminiModelId(preferredModel || getActiveGeminiModel());
  const ordered = [sanitizedPreferred, "gemini-4-argon", "gemini-3.8-flash"];
  return Array.from(new Set(ordered));
}

export interface GeminiConfig {
  defaultModel: GeminiModelId;
  visionReasoningModel: GeminiModelId;
  visionMediaResolution: "high" | "medium" | "low";
  visionThinkingLevel: GeminiThinkingLevel;
  projectId: string;
  location: string;
  temperature: number;
  maxOutputTokens: number;
}

export const VYRA_AI_CONFIG: GeminiConfig = {
  defaultModel: sanitizeGeminiModelId(process.env.GEMINI_MODEL),
  visionReasoningModel: sanitizeGeminiModelId(process.env.GEMINI_VISION_MODEL),
  visionMediaResolution: "high",
  visionThinkingLevel: "high",
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "vyra-509011",
  location: process.env.VERTEX_AI_LOCATION || process.env.GOOGLE_CLOUD_LOCATION || "global",
  temperature: 0.3,
  maxOutputTokens: 16384,
};

/**
 * Resolves active Gemini model with optional per-call override.
 * Defaults to `gemini-4-argon` and blocks deprecated 2.5/2.0/1.5 or invalid 3.8-pro IDs.
 */
export function getActiveGeminiModel(overrideModel?: string): string {
  if (overrideModel) {
    return sanitizeGeminiModelId(overrideModel);
  }
  if (process.env.GEMINI_MODEL) {
    return sanitizeGeminiModelId(process.env.GEMINI_MODEL);
  }
  return sanitizeGeminiModelId(VYRA_AI_CONFIG.defaultModel);
}

/**
 * Resolves the frontier multimodal spatial reasoning model (defaults to `gemini-4-argon`)
 * for high-resolution body scans, postural angle detection, and muscle/fat partitioning analysis.
 */
export function getActiveVisionReasoningModel(overrideModel?: string): string {
  if (overrideModel) {
    return sanitizeGeminiModelId(overrideModel);
  }
  if (process.env.GEMINI_VISION_MODEL) {
    return sanitizeGeminiModelId(process.env.GEMINI_VISION_MODEL);
  }
  return sanitizeGeminiModelId(VYRA_AI_CONFIG.visionReasoningModel);
}

/**
 * Checks if running with authenticated cloud credentials or API key
 */
export function getGeminiAuthContext(): {
  mode: "vertex_ai_service_account" | "ai_studio_api_key" | "mock_evaluation";
  model: string;
  projectId: string;
  serviceAccount: string;
} {
  const apiKey = process.env.GEMINI_API_KEY;
  const isCloudRun = Boolean(
    process.env.K_SERVICE || process.env.GOOGLE_GENAI_USE_VERTEXAI === "true"
  );

  return {
    mode: apiKey
      ? "ai_studio_api_key"
      : isCloudRun
      ? "vertex_ai_service_account"
      : "mock_evaluation",
    model: getActiveGeminiModel(),
    projectId: VYRA_AI_CONFIG.projectId,
    serviceAccount: "vyra-app-sa@vyra-509011.iam.gserviceaccount.com",
  };
}

// ----------------------------------------------------------------------------
// VERTEX AI METADATA SERVER OAUTH2 ADC TOKEN CACHE
// ----------------------------------------------------------------------------
let cachedVertexToken: { token: string; expiresAtMs: number } | null = null;

export function clearVertexTokenCacheForTesting(): void {
  cachedVertexToken = null;
}

/**
 * Mints a short-lived GCP OAuth2 access token from the Cloud Run / GCE Metadata Server.
 * Never throws: returns null outside GCP runtime or if metadata server is unreachable.
 */
export async function getVertexAccessToken(
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  if (process.env.VERTEX_ACCESS_TOKEN) {
    return process.env.VERTEX_ACCESS_TOKEN;
  }

  const now = Date.now();
  if (cachedVertexToken && now < cachedVertexToken.expiresAtMs - 60_000) {
    return cachedVertexToken.token;
  }

  const isGcpRuntime = Boolean(
    process.env.K_SERVICE ||
      process.env.CLOUD_RUN_JOB ||
      process.env.GOOGLE_GENAI_USE_VERTEXAI === "true"
  );
  if (!isGcpRuntime) {
    return null;
  }

  try {
    const metadataUrl =
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
    const res = await fetchImpl(metadataUrl, {
      method: "GET",
      headers: { "Metadata-Flavor": "Google" },
      signal:
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(2500)
          : undefined,
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data?.access_token) {
      return null;
    }
    const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 3600;
    cachedVertexToken = {
      token: data.access_token,
      expiresAtMs: now + expiresInSec * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

export interface ResolvedGeminiTransport {
  url: string;
  headers: Record<string, string>;
  authMode: "ai_studio_api_key" | "vertex_ai_service_account";
}

/**
 * Resolves either Google AI Studio (`GEMINI_API_KEY`) or Cloud Run Vertex AI ADC transport.
 * Returns `null` when running offline with no live credentials.
 */
export async function resolveGeminiTransport(
  model: string,
  options?: {
    fetchImpl?: typeof fetch;
    location?: string;
    projectId?: string;
  }
): Promise<ResolvedGeminiTransport | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      authMode: "ai_studio_api_key",
    };
  }

  const token = await getVertexAccessToken(options?.fetchImpl);
  if (token) {
    const projectId = options?.projectId || VYRA_AI_CONFIG.projectId;
    const location = options?.location || VYRA_AI_CONFIG.location || "global";
    const host =
      location === "global"
        ? "aiplatform.googleapis.com"
        : `${location}-aiplatform.googleapis.com`;
    return {
      url: `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      authMode: "vertex_ai_service_account",
    };
  }

  return null;
}

/**
 * Builds model-spec-compliant `generationConfig` per Gemini 4 Argon & 3.8 guidelines:
 * - Gemini 4 Argon (`gemini-4-argon`): omits ignored sampling parameters (`temperature`, `topP`, `topK`),
 *   uses `thinkingConfig.thinkingLevel` (`"low" | "medium" | "high"`), and guarantees sufficient
 *   `maxOutputTokens` (>= 8192) so thinking + output never truncate.
 * - Gemini 3.x models: preserves `temperature` and optional `thinkingConfig.thinkingLevel`.
 */
export function buildGeminiGenerationConfig(options: {
  model: string;
  thinkingLevel?: GeminiThinkingLevel;
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}): Record<string, unknown> {
  const isArgon4 = /^gemini-4/i.test(options.model);
  const config: Record<string, unknown> = {
    maxOutputTokens: isArgon4
      ? Math.max(options.maxOutputTokens ?? 16384, 8192)
      : options.maxOutputTokens ?? 8192,
  };

  if (options.thinkingLevel) {
    config.thinkingConfig = {
      thinkingLevel: options.thinkingLevel,
    };
  } else if (isArgon4) {
    config.thinkingConfig = {
      thinkingLevel: "medium",
    };
  }

  if (!isArgon4 && options.temperature !== undefined) {
    config.temperature = options.temperature;
  }

  if (options.responseMimeType) {
    config.responseMimeType = options.responseMimeType;
  }
  if (options.responseSchema) {
    config.responseSchema = options.responseSchema;
  }

  return config;
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContentInvocationOptions {
  model?: GeminiModelId;
  systemInstruction?: string;
  temperature?: number;
  thinkingLevel?: GeminiThinkingLevel;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
  parts?: GeminiPart[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Extracts visible text parts from Gemini candidate response while skipping internal thought parts.
 */
export function extractCandidateText(data: unknown): string {
  const candidates = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> })?.candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => typeof p?.text === "string" && !p?.thought)
    .map((p) => p.text as string)
    .join("")
    .trim();
}

/**
 * Unified Multimodal & Structured Generation Call for Vyra Coaching Domains.
 * Automatically executes via Google AI Studio API Key or Cloud Run Vertex AI ADC.
 */
export async function generateGeminiContent(
  prompt: string,
  options?: GeminiContentInvocationOptions
): Promise<{
  text: string;
  modelUsed: string;
  authMode: string;
  liveExecution: boolean;
}> {
  const requestedModel = getActiveGeminiModel(options?.model);
  const auth = getGeminiAuthContext();
  const fetchFn = options?.fetchImpl || fetch;
  const candidateChain = getGeminiFallbackChain(requestedModel);

  for (const model of candidateChain) {
    const transport = await resolveGeminiTransport(model, { fetchImpl: fetchFn });
    if (!transport) break;

    const userParts: GeminiPart[] =
      options?.parts && options.parts.length > 0
        ? options.parts
        : [{ text: prompt }];

    const bodyPayload: Record<string, unknown> = {
      contents: [{ role: "user", parts: userParts }],
      generationConfig: buildGeminiGenerationConfig({
        model,
        thinkingLevel: options?.thinkingLevel,
        maxOutputTokens: options?.maxOutputTokens,
        temperature: options?.temperature ?? VYRA_AI_CONFIG.temperature,
        responseMimeType: options?.responseMimeType,
        responseSchema: options?.responseSchema,
      }),
    };

    if (options?.systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const timeoutMs = options?.timeoutMs ?? 20_000;
    const res = await fetchFn(transport.url, {
      method: "POST",
      headers: transport.headers,
      body: JSON.stringify(bodyPayload),
      signal:
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(timeoutMs)
          : undefined,
    });

    if (res.status === 404 && model !== candidateChain[candidateChain.length - 1]) {
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidateText = extractCandidateText(data);
    return {
      text: candidateText,
      modelUsed: model,
      authMode: transport.authMode,
      liveExecution: true,
    };
  }

  return {
    text: `[Vyra AI Offline Synthesis (${requestedModel})] Local deterministic coaching engine active (no live Vertex/AI Studio credentials configured).`,
    modelUsed: requestedModel,
    authMode: auth.mode,
    liveExecution: false,
  };
}

const BIOMECHANICAL_FEEDBACK_SCHEMA = {
  type: "OBJECT",
  properties: {
    cueAdjustment: {
      type: "STRING",
      description: "Immediate concrete grip, bench angle, or posture fix under 25 words.",
    },
    sensationCheck: {
      type: "STRING",
      description: "Target muscular tension vs tendon stress check under 22 words.",
    },
    suggestedSwap: {
      type: "STRING",
      description: "Optional joint-friendly alternative movement if discomfort persists.",
    },
  },
  required: ["cueAdjustment", "sensationCheck"],
};

/**
 * Biomechanical Coaching & Form Struggle Analyzer
 * Powered by Gemini 4 Argon (`gemini-4-argon`) with Structured JSON Outputs
 */
export async function generateBiomechanicalFeedback(
  params: {
    exerciseName: string;
    struggleNote: string;
    rpe?: number;
    equipmentType?: string;
    overrideModel?: GeminiModelId;
  },
  options?: {
    fetchImpl?: typeof fetch;
  }
): Promise<{
  cueAdjustment: string;
  sensationCheck: string;
  suggestedSwap?: string;
  modelUsed: string;
  rawAnalysis: string;
}> {
  const model = getActiveGeminiModel(params.overrideModel);

  const systemInstruction =
    "You are the Vyra Master Biomechanical Coach. A trainee is in the gym right now experiencing form struggle or discomfort. " +
    "Provide immediate, concise, zero-jargon tactical cues following the Rule of 3: (1) Immediate grip/posture fix, (2) Target sensation check, (3) Safe equipment alternative if discomfort persists. Return strictly valid JSON.";

  const prompt = `Exercise: ${params.exerciseName}
Equipment: ${params.equipmentType || "Standard"}
Trainee Struggle Note: "${params.struggleNote}"
RPE Logged: ${params.rpe ?? "N/A"}

Provide an immediate, authoritative form adjustment to eliminate discomfort and optimize hypertrophy.`;

  const fallbackResult = (rawText?: string) => ({
    cueAdjustment: `Tuck elbows ~45° and depress shoulder blades before initiating each rep on ${params.exerciseName}.`,
    sensationCheck: "Tension should concentrate in the target muscle belly without anterior joint pinching.",
    suggestedSwap:
      params.equipmentType === "barbell"
        ? "Neutral-grip Dumbbell or Cable variation"
        : "Cable or machine converging path variation",
    modelUsed: model,
    rawAnalysis:
      rawText || `Deterministic biomechanical heuristic applied for ${params.exerciseName}.`,
  });

  try {
    const result = await generateGeminiContent(prompt, {
      model,
      systemInstruction,
      thinkingLevel: "low",
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: BIOMECHANICAL_FEEDBACK_SCHEMA,
      fetchImpl: options?.fetchImpl,
    });

    if (result.liveExecution && result.text) {
      try {
        const cleaned = result.text
          .replace(/^```json\s*/i, "")
          .replace(/```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned) as {
          cueAdjustment?: unknown;
          sensationCheck?: unknown;
          suggestedSwap?: unknown;
        };
        if (
          typeof parsed.cueAdjustment === "string" &&
          parsed.cueAdjustment.trim().length > 0 &&
          typeof parsed.sensationCheck === "string" &&
          parsed.sensationCheck.trim().length > 0
        ) {
          return {
            cueAdjustment: parsed.cueAdjustment.trim(),
            sensationCheck: parsed.sensationCheck.trim(),
            suggestedSwap:
              typeof parsed.suggestedSwap === "string" && parsed.suggestedSwap.trim().length > 0
                ? parsed.suggestedSwap.trim()
                : undefined,
            modelUsed: result.modelUsed,
            rawAnalysis: result.text,
          };
        }
      } catch {
        // Fall through to structured safe fallback while preserving rawAnalysis
      }
    }

    return {
      ...fallbackResult(result.text),
      modelUsed: result.modelUsed,
    };
  } catch {
    return fallbackResult();
  }
}
