import { NextResponse } from "next/server";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import { checkDistributedRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import { isFirestoreRuntimeAvailable } from "@/lib/firebase/admin";
import {
  loadGymInventoriesFromFirestore,
  loadSensoryEntriesFromFirestore,
  saveGymInventoryToFirestore,
} from "@/lib/firebase/firestore-repository";
import { gymVisionInventoryStore } from "@/lib/ai/gym-vision-inventory";
import { sensoryMemoryStore } from "@/lib/ai/sensory-memory";
import {
  adaptDailyWorkoutSession,
  AdaptDailyWorkoutInput,
} from "@/lib/ai/daily-session-adapter";
import { getActiveGeminiModel } from "@/lib/gemini";
import { logStructuredAiEvent } from "@/lib/observability";

/**
 * POST /api/ai/adapt-day
 * 
 * Real-Time Ephemeral Daily Workout Adaptation & Gym Photo Equipment Recognition Route.
 * - Accepts a voice transcript or text check-in (e.g. poor sleep, football abdominal injury,
 *   20-minute meeting time crunch, low energy) + optional gym setup photo (`gymPhotoDataUri`).
 * - Recognizes available gym equipment at the user's current workout location (`gymId`).
 * - Adapts ONLY today's workout session (`scope: "TODAY_SESSION_ONLY"`, `longTermProgramModified: false`).
 */
export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const modelRequested = getActiveGeminiModel();
  let effectiveTenantForLog: string | null = null;
  let body: Partial<AdaptDailyWorkoutInput>;
  try {
    body = (await req.json()) as Partial<AdaptDailyWorkoutInput>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed JSON request body." },
      { status: 400 }
    );
  }

  try {
    if (!body || !body.traineeId || !Array.isArray(body.exercises)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required fields: traineeId and exercises array are required.",
        },
        { status: 400 }
      );
    }

    const tenant = await resolveRouteTenantContext(req, body.traineeId, {
      allowUnauthenticatedAnon: true,
    });
    if (!tenant.isAllowed) {
      return NextResponse.json(
        { ok: false, error: tenant.error || "Unauthorized" },
        { status: tenant.statusCode || 401 }
      );
    }
    effectiveTenantForLog = tenant.effectiveTraineeId;

    const rl = await checkDistributedRateLimit(
      resolveRateLimitKey(req, "ai-adapt-day", tenant.effectiveTraineeId),
      { maxRequests: 40, windowMs: 60_000 }
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded for daily adaptation." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    if (tenant.session && isFirestoreRuntimeAvailable()) {
      try {
        const [cloudInventories, cloudSensory] = await Promise.all([
          loadGymInventoriesFromFirestore(tenant.effectiveTraineeId),
          loadSensoryEntriesFromFirestore(tenant.effectiveTraineeId),
        ]);
        if (cloudInventories.length > 0) {
          gymVisionInventoryStore.hydrateFromFirestoreRecords(
            tenant.effectiveTraineeId,
            cloudInventories
          );
        }
        if (cloudSensory.length > 0) {
          sensoryMemoryStore.hydrateFromFirestoreRecords(
            tenant.effectiveTraineeId,
            cloudSensory
          );
        }
      } catch {
        // Non-fatal fallback
      }
    }

    const result = await adaptDailyWorkoutSession({
      traineeId: tenant.effectiveTraineeId,
      voiceOrTextMessage: body.voiceOrTextMessage || "",
      gymId: body.gymId,
      gymName: body.gymName,
      gymPhotoDataUri: body.gymPhotoDataUri,
      gymPhotoCaption: body.gymPhotoCaption,
      overrideGymEquipment: body.overrideGymEquipment,
      exercises: body.exercises,
    });

    if (tenant.session && isFirestoreRuntimeAvailable() && result.gymInventoryUsed) {
      await saveGymInventoryToFirestore(tenant.effectiveTraineeId, result.gymInventoryUsed);
    }

    const modelUsed = result.modelUsed || modelRequested;
    const isFallback =
      result.executionEngine === "deterministic_local" || modelUsed !== modelRequested;
    logStructuredAiEvent({
      route: "/api/ai/adapt-day",
      modelRequested,
      modelUsed,
      fallbackTriggered: isFallback,
      authMode:
        result.executionEngine === "gemini_4_argon_live"
          ? "gemini_live"
          : "local_fallback",
      latencyMs: Date.now() - startedAtMs,
      status: 200,
      tenantId: tenant.effectiveTraineeId,
      detail: result.executionEngine,
    });

    return NextResponse.json(
      {
        ok: true,
        adaptation: result,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to execute Real-Time Daily Workout Adaptation.";
    logStructuredAiEvent({
      route: "/api/ai/adapt-day",
      modelRequested,
      modelUsed: modelRequested,
      fallbackTriggered: true,
      authMode: "error",
      latencyMs: Date.now() - startedAtMs,
      status: 500,
      tenantId: effectiveTenantForLog,
      severity: "ERROR",
      detail: msg,
    });
    return NextResponse.json(
      {
        ok: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
