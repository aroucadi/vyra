import { NextResponse } from "next/server";
import "@/db/coach-repository";
import { resolveRouteTenantContext } from "@/lib/auth/server-session";
import { checkRateLimit, resolveRateLimitKey } from "@/lib/auth/rate-limit";
import {
  ensureFirestoreCoachBridgeRegistered,
  loadBootstrapForUser,
} from "@/lib/firebase/firestore-repository";
import { runVertexAgenticCoachLoop } from "@/lib/ai/vertex-agent-loop";
import { athleteModelStore } from "@/lib/ai/athlete-model";
import {
  sensoryMemoryStore,
  IngestFeedbackInput,
  SensoryFeedbackEntry,
} from "@/lib/ai/sensory-memory";
import { EvaluateJitInput } from "@/lib/ai/coach-agent";

export interface EvolveRouteRequestBody extends EvaluateJitInput {
  feedbackToIngest?: IngestFeedbackInput;
  maxTurns?: number;
}

/**
 * POST /api/ai/evolve
 * 
 * Executes the Self-Evolving Athletic Program Agentic Loop:
 * 1. Optionally ingests multimodal sensory feedback (Emoji, Free-Text, or French/Darija/English Audio Memo)
 *    using Dual-Representation Canonical Ingestion + 64-D L2-normalized vector embedding.
 * 2. Runs the multi-turn Vertex AI / Gemini Function-Calling ReAct Loop (`query_athlete_history`,
 *    `rag_sensory_feedback`, `search_6554_exercise_catalogue`, `get_gym_equipment_inventory`,
 *    `audit_systemic_cns_recovery`, and `verify_evolution_candidate` Evaluator-Optimizer loop).
 * 3. Returns the verified Just-In-Time (JIT) `CoachProposition` along with the full multi-step
 *    agent execution trace.
 */
export async function POST(req: Request) {
  let body: Partial<EvolveRouteRequestBody>;
  try {
    body = (await req.json()) as Partial<EvolveRouteRequestBody>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed JSON request body." },
      { status: 400 }
    );
  }

  try {
    if (!body || !body.exerciseName || !body.traineeId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: traineeId and exerciseName are required.",
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

    const rl = checkRateLimit(
      resolveRateLimitKey(req, tenant.effectiveTraineeId, "ai-evolve"),
      { maxRequests: 60, windowMs: 60_000 }
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    ensureFirestoreCoachBridgeRegistered();
    const effectiveTraineeId = tenant.effectiveTraineeId;

    let resolvedSessions = Array.isArray(body.sessions) ? body.sessions : [];
    if (tenant.session) {
      await athleteModelStore.hydrateFromDatabase(effectiveTraineeId);
      if (resolvedSessions.length === 0) {
        try {
          const boot = await loadBootstrapForUser({
            uid: tenant.session.uid,
            email: tenant.session.email,
            displayName: tenant.session.name,
          });
          resolvedSessions = boot.sessions;
        } catch {
          // Non-fatal fallback
        }
      }
    }

    let ingestedSensoryNode: SensoryFeedbackEntry | null = null;
    if (body.feedbackToIngest && body.feedbackToIngest.exerciseName) {
      ingestedSensoryNode = sensoryMemoryStore.ingest({
        ...body.feedbackToIngest,
        traineeId: effectiveTraineeId,
      });
    }

    const jitInput: EvaluateJitInput = {
      traineeId: effectiveTraineeId,
      exerciseName: body.exerciseName,
      currentWeightKg: Number(body.currentWeightKg ?? 20),
      targetSets: Number(body.targetSets ?? 3),
      repLow: Number(body.repLow ?? 8),
      repHigh: Number(body.repHigh ?? 12),
      targetRir: Number(body.targetRir ?? 1),
      equipment: String(body.equipment ?? "dumbbell"),
      gymId: body.gymId,
      gymName: body.gymName,
      sessions: resolvedSessions,
      sleepHours: body.sleepHours,
      readinessFeeling: body.readinessFeeling,
      simulateInitialCandidateCheck: body.simulateInitialCandidateCheck,
    };

    const result = await runVertexAgenticCoachLoop(
      jitInput,
      typeof body.maxTurns === "number" ? body.maxTurns : 6
    );
    if (tenant.session) {
      await athleteModelStore.syncToDatabase(effectiveTraineeId);
    }

    return NextResponse.json(
      {
        ok: true,
        proposition: result.proposition,
        degradedMode: result.degradedMode ?? false,
        statusMessage: result.statusMessage,
        mutationApplied: result.mutationApplied ?? Boolean(result.proposition),
        stagesCompleted: result.stagesCompleted,
        shadowModeLogged: result.shadowModeLogged ?? false,
        authMode: result.authMode,
        modelUsed: result.modelUsed,
        turnsExecuted: result.turnsExecuted,
        toolCallsHistory: result.toolCallsHistory,
        athleteModelContext: result.athleteModelContext,
        ingestedSensoryNode: ingestedSensoryNode
          ? {
              id: ingestedSensoryNode.id,
              detectedLanguage: ingestedSensoryNode.originalLanguage,
              rawText: ingestedSensoryNode.rawTranscription,
              canonicalEnglishSummary: ingestedSensoryNode.canonicalEnglishSummary,
              extractedSymptoms: ingestedSensoryNode.biomechanicalEntities.symptoms,
              extractedCompensations: ingestedSensoryNode.biomechanicalEntities.compensations,
              subdivision: ingestedSensoryNode.muscleSubdivision,
              embeddingDimensions: ingestedSensoryNode.embeddingVector.length,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to execute Self-Evolving Program Agent loop.",
      },
      { status: 500 }
    );
  }
}
