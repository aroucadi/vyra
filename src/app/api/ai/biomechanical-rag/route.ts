/**
 * @file route.ts
 * @description API endpoint for Vyra's Agentic Multimodal Biomechanical RAG Engine.
 * Exposes multi-corpus retrieval and agentic reasoning over:
 * 1. 6,554-Exercise Library (with CDN video loops & stills)
 * 2. Athlete Workout Performance Logs
 * 3. Wearable Telemetry & Recovery
 * 4. 16-Week Periodized Mesocycle
 * 5. Equipment Station Vision (Gym Photos)
 * 6. Body & Posture Vision (Physique Photos)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  synthesizeUnifiedBiomechanicalRagContext,
  queryExerciseLibrary,
  queryWorkoutLogs,
  queryAthleteTelemetry,
  queryActiveMesocycle,
  queryGymStationVision,
  queryPhysiquePostureVision,
} from '@/lib/rag/unified-agentic-rag';
import { searchExercises } from '@/lib/rag/exercise-search';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      traineeId = 'trainee_alaa',
      movementName = 'Bench Press',
      targetMuscle,
      gymId,
      action = 'synthesize_context',
      searchTerm,
      apparatusGroup,
      muscleSubdivision,
      movementPattern,
      resistanceProfile,
      maxAxialLoading,
      limit = 10,
    } = body;

    // 1. Synthesize Unified Context across all 6 corpora
    if (action === 'synthesize_context' || action === 'agentic_swap') {
      const unifiedContext = synthesizeUnifiedBiomechanicalRagContext(
        traineeId,
        movementName,
        gymId
      );

      return NextResponse.json({
        success: true,
        action,
        traineeId,
        movementName,
        unifiedContext,
        evidenceVector: {
          corpus1_libraryMatches: unifiedContext.corpus1_exerciseLibrary.length,
          corpus2_sessionsLogged: unifiedContext.corpus2_workoutLogs.totalSessionsLogged,
          corpus2_estimated1RmKg: unifiedContext.corpus2_workoutLogs.bestEstimated1RmKg,
          corpus2_trend: unifiedContext.corpus2_workoutLogs.performanceTrend,
          corpus3_readinessScore: unifiedContext.corpus3_telemetryRecovery.readinessScore,
          corpus3_recoveryState: unifiedContext.corpus3_telemetryRecovery.readinessState,
          corpus4_mesocyclePhase: unifiedContext.corpus4_mesocycleProgram.activePhase,
          corpus4_weekNumber: unifiedContext.corpus4_mesocycleProgram.currentWeekNumber,
          corpus5_gymConfirmedApparatus: unifiedContext.corpus5_gymVisionEquipment.confirmedApparatus,
          corpus5_maxDumbbellKg: unifiedContext.corpus5_gymVisionEquipment.maxDumbbellWeightKg,
          corpus6_postureFlags: unifiedContext.corpus6_physiqueBodyVision.postureFlags,
          corpus6_priorityAreas: unifiedContext.corpus6_physiqueBodyVision.priorityDevelopmentAreas,
        },
        candidates: unifiedContext.recommendedSwapCandidates.map((c) => ({
          id: c.exercise.id,
          name: c.exercise.name,
          apparatusGroup: c.exercise.apparatusGroup,
          hardwareDetail: c.exercise.hardwareDetail,
          muscleSubdivision: c.exercise.muscleSubdivision,
          movementPattern: c.exercise.movementPattern,
          mechanics: c.exercise.mechanics,
          resistanceProfile: c.exercise.resistanceProfile,
          axialLoading: c.exercise.axialLoading,
          matchScore: c.matchScore,
          videoClipUrl: c.videoClipUrl,
          stillImageUrl: c.stillImageUrl,
          cues: c.actionableCues,
          highlights: c.biomechanicalHighlights,
        })),
        reasoningSummary: unifiedContext.synthesizedReasoningSummary,
      });
    }

    // 2. High-performance multi-token search with biomechanical filtering
    if (action === 'search') {
      const results = searchExercises(searchTerm || movementName, {
        apparatusGroup,
        muscleSubdivision,
        movementPattern,
        resistanceProfile,
        maxAxialLoading,
        limit,
      });

      return NextResponse.json({
        success: true,
        action: 'search',
        query: searchTerm || movementName,
        total: results.length,
        results: results.map((r) => ({
          id: r.id,
          name: r.name,
          apparatusGroup: r.apparatusGroup,
          hardwareDetail: r.hardwareDetail,
          muscleSubdivision: r.muscleSubdivision,
          movementPattern: r.movementPattern,
          mechanics: r.mechanics,
          resistanceProfile: r.resistanceProfile,
          axialLoading: r.axialLoading,
          clipUrl: r.clipUrl,
          imageUrl: r.imageUrl,
          videoUrl: r.videoUrl,
          cues: r.coachingCues,
        })),
      });
    }

    // 3. Fallback: return telemetry or logs separately
    if (action === 'query_logs') {
      const logs = queryWorkoutLogs(traineeId, movementName);
      return NextResponse.json({ success: true, logs });
    }

    if (action === 'query_telemetry') {
      const telemetry = queryAthleteTelemetry(traineeId, targetMuscle);
      return NextResponse.json({ success: true, telemetry });
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
