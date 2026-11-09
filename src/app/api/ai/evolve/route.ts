import { NextResponse } from "next/server";
import { runVertexAgenticCoachLoop } from "@/lib/ai/vertex-agent-loop";
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
  try {
    const body = (await req.json()) as Partial<EvolveRouteRequestBody>;

    if (!body || !body.exerciseName || !body.traineeId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: traineeId and exerciseName are required.",
        },
        { status: 400 }
      );
    }

    let ingestedSensoryNode: SensoryFeedbackEntry | null = null;
    if (body.feedbackToIngest && body.feedbackToIngest.exerciseName) {
      ingestedSensoryNode = sensoryMemoryStore.ingest(body.feedbackToIngest);
    }

    const jitInput: EvaluateJitInput = {
      traineeId: body.traineeId,
      exerciseName: body.exerciseName,
      currentWeightKg: Number(body.currentWeightKg ?? 20),
      targetSets: Number(body.targetSets ?? 3),
      repLow: Number(body.repLow ?? 8),
      repHigh: Number(body.repHigh ?? 12),
      targetRir: Number(body.targetRir ?? 1),
      equipment: String(body.equipment ?? "dumbbell"),
      gymId: body.gymId,
      gymName: body.gymName,
      sessions: Array.isArray(body.sessions) ? body.sessions : [],
      sleepHours: body.sleepHours,
      readinessFeeling: body.readinessFeeling,
      simulateInitialCandidateCheck: body.simulateInitialCandidateCheck,
    };

    const result = await runVertexAgenticCoachLoop(
      jitInput,
      typeof body.maxTurns === "number" ? body.maxTurns : 6
    );

    return NextResponse.json(
      {
        ok: true,
        proposition: result.proposition,
        authMode: result.authMode,
        modelUsed: result.modelUsed,
        turnsExecuted: result.turnsExecuted,
        toolCallsHistory: result.toolCallsHistory,
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
