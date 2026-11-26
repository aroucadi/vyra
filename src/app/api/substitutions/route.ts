import { NextRequest, NextResponse } from 'next/server';
import { loadExerciseCatalogue } from '@/lib/rag/catalogue-loader';
import { findBiomechanicalSubstitutes } from '@/lib/training-math/substitution-copilot';
import { synthesizeUnifiedBiomechanicalRagContext } from '@/lib/rag/unified-agentic-rag';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get('name') || '').trim();
    const target = (searchParams.get('target') || '').trim();
    const equipment = (searchParams.get('equipment') || '').trim();
    const category = searchParams.get('category') || undefined;
    const traineeId = searchParams.get('traineeId') || 'trainee_alaa';
    const gymId = searchParams.get('gymId') || undefined;
    const excludedParam = searchParams.get('excluded') || '';
    const preferredParam = searchParams.get('preferred') || '';
    const rawLimit = parseInt(searchParams.get('limit') || '3', 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 10) : 3;

    if (!target && !name) {
      return NextResponse.json(
        { error: 'Missing required query parameters: "target" or "name"' },
        { status: 400 }
      );
    }

    const excludedEquipment = excludedParam
      ? excludedParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const preferredEquipment = preferredParam
      ? preferredParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const catalogueResult = loadExerciseCatalogue();
    const substitutes = findBiomechanicalSubstitutes(
      { name, target, equipment, category },
      catalogueResult.exercises,
      { excludedEquipment, preferredEquipment, limit }
    );

    // Compute unified agentic RAG evidence context across the 6 corpora
    let ragEvidence = null;
    try {
      const ragContext = synthesizeUnifiedBiomechanicalRagContext(
        traineeId,
        name || target,
        gymId
      );
      ragEvidence = {
        gymVision: {
          gymName: ragContext.corpus5_gymVisionEquipment.gymName,
          confirmedApparatus: ragContext.corpus5_gymVisionEquipment.confirmedApparatus,
          maxDumbbellWeightKg: ragContext.corpus5_gymVisionEquipment.maxDumbbellWeightKg,
          hasCableTower: ragContext.corpus5_gymVisionEquipment.hasCableTower,
          detectedStations: ragContext.corpus5_gymVisionEquipment.detectedSpecialtyStations,
        },
        workoutLogs: {
          totalSessionsLogged: ragContext.corpus2_workoutLogs.totalSessionsLogged,
          bestEstimated1RmKg: ragContext.corpus2_workoutLogs.bestEstimated1RmKg,
          performanceTrend: ragContext.corpus2_workoutLogs.performanceTrend,
        },
        telemetry: {
          readinessScore: ragContext.corpus3_telemetryRecovery.readinessScore,
          readinessState: ragContext.corpus3_telemetryRecovery.readinessState,
          sleepHours: ragContext.corpus3_telemetryRecovery.sleepHours,
          systemicFatigue: ragContext.corpus3_telemetryRecovery.systemicFatigue,
        },
        mesocycle: {
          activePhase: ragContext.corpus4_mesocycleProgram.activePhase,
          currentWeekNumber: ragContext.corpus4_mesocycleProgram.currentWeekNumber,
          weeklyPrescribedSets: ragContext.corpus4_mesocycleProgram.targetMuscleWeeklySetsPrescribed,
          volumeStatus: ragContext.corpus4_mesocycleProgram.volumeStatus,
        },
        physiqueVision: {
          postureFlags: ragContext.corpus6_physiqueBodyVision.postureFlags,
          priorityDevelopmentAreas: ragContext.corpus6_physiqueBodyVision.priorityDevelopmentAreas,
        },
        reasoningSummary: ragContext.synthesizedReasoningSummary,
      };
    } catch {
      // Graceful fallback if in lightweight environment
    }

    return NextResponse.json({
      success: true,
      source: { name, target, equipment },
      count: substitutes.length,
      substitutes,
      ragEvidence,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal substitution copilot error',
      },
      { status: 500 }
    );
  }
}
