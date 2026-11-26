import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  queryExerciseLibrary,
  queryWorkoutLogs,
  queryAthleteTelemetry,
  queryActiveMesocycle,
  queryGymStationVision,
  queryPhysiquePostureVision,
  synthesizeUnifiedBiomechanicalRagContext,
} from '@/lib/rag/unified-agentic-rag';
import { searchExercises } from '@/lib/rag/exercise-search';

describe('Unified Multimodal Biomechanical RAG Engine Suite', () => {
  test('Corpus 1: Exercise Library queries by biomechanical constraints and yields enriched video items', () => {
    const chestExercises = queryExerciseLibrary({
      targetMuscle: 'pectorals',
      muscleSubdivision: 'chest_clavicular',
      limit: 4,
    });

    assert.ok(chestExercises.length > 0);
    for (const item of chestExercises) {
      assert.ok(item.exercise.name);
      assert.ok(item.videoClipUrl.includes('.mp4'));
      assert.ok(item.stillImageUrl.includes('.webp'));
      assert.ok(item.biomechanicalHighlights.apparatus);
      assert.ok(item.biomechanicalHighlights.subdivision);
      assert.ok(item.matchScore > 0);
    }
  });

  test('Corpus 2: Workout Logs extracts performance benchmarks, tonnage, and progressive overload trends', () => {
    const logs = queryWorkoutLogs('trainee_test', 'Bench Press');
    assert.strictEqual(logs.exerciseName, 'Bench Press');
    assert.ok(typeof logs.totalSessionsLogged === 'number');
    assert.ok(typeof logs.bestEstimated1RmKg === 'number');
    assert.ok(typeof logs.recentLoadTonnage === 'number');
    assert.ok(['progressing', 'plateaued', 'regressing', 'new'].includes(logs.performanceTrend));
  });

  test('Corpus 3: Telemetry & Recovery extracts readiness score, sleep, and muscle soreness', () => {
    const telemetry = queryAthleteTelemetry('trainee_test', 'chest');
    assert.ok(telemetry.readinessScore >= 0 && telemetry.readinessScore <= 100);
    assert.ok(['optimal', 'moderate', 'fatigued', 'compromised'].includes(telemetry.readinessState));
    assert.ok(typeof telemetry.sleepHours === 'number');
    assert.ok(['low', 'moderate', 'high'].includes(telemetry.systemicFatigue));
  });

  test('Corpus 4: Active Mesocycle extracts periodization phase and MEV/MRV landmarks', () => {
    const meso = queryActiveMesocycle('trainee_test', 'chest');
    assert.ok(meso.programId);
    assert.ok(['hypertrophy', 'strength', 'peaking', 'deload', 'general'].includes(meso.activePhase));
    assert.ok(meso.targetMuscleMev < meso.targetMuscleMrv);
    assert.ok(meso.targetMuscleWeeklySetsPrescribed > 0);
    assert.ok(['under_mev', 'optimal_hypertrophy', 'approaching_mrv', 'exceeded_mrv'].includes(meso.volumeStatus));
  });

  test('Corpus 5: Gym Station Vision extracts recognized equipment categories and station limits', () => {
    const gymVision = queryGymStationVision('trainee_test');
    assert.ok(gymVision.gymId);
    assert.ok(Array.isArray(gymVision.confirmedApparatus));
    assert.ok(gymVision.confirmedApparatus.length > 0);
    assert.ok(gymVision.maxDumbbellWeightKg > 0);
    assert.ok(Array.isArray(gymVision.detectedSpecialtyStations));
  });

  test('Corpus 6: Body & Physique Vision extracts posture flags and lagging muscle targets', () => {
    const physique = queryPhysiquePostureVision('trainee_test');
    assert.ok(Array.isArray(physique.postureFlags));
    assert.ok(Array.isArray(physique.laggingMuscleSubdivisions));
    assert.ok(Array.isArray(physique.priorityDevelopmentAreas));
    assert.ok(physique.symmetryBalanceScore >= 0 && physique.symmetryBalanceScore <= 100);
  });

  test('Master Synthesizer: produces unified 6-corpora RAG context vector with verified rationales', () => {
    const unified = synthesizeUnifiedBiomechanicalRagContext(
      'trainee_alaa',
      'Incline Dumbbell Press'
    );

    assert.strictEqual(unified.traineeId, 'trainee_alaa');
    assert.strictEqual(unified.targetMovementOrMuscle, 'Incline Dumbbell Press');

    // All 6 corpora populated
    assert.ok(unified.corpus1_exerciseLibrary.length > 0);
    assert.ok(unified.corpus2_workoutLogs);
    assert.ok(unified.corpus3_telemetryRecovery);
    assert.ok(unified.corpus4_mesocycleProgram);
    assert.ok(unified.corpus5_gymVisionEquipment);
    assert.ok(unified.corpus6_physiqueBodyVision);

    // Multi-corpus reasoning summary
    assert.ok(unified.synthesizedReasoningSummary.includes('Biomechanical RAG Unified Evidence Vector'));
    assert.ok(unified.synthesizedReasoningSummary.includes('Target: "Incline Dumbbell Press"'));
    assert.ok(unified.synthesizedReasoningSummary.includes('Gym Vision:'));
    assert.ok(unified.synthesizedReasoningSummary.includes('Mesocycle:'));

    // Swap candidates returned with direct video URLs
    assert.ok(unified.recommendedSwapCandidates.length > 0);
    assert.ok(unified.recommendedSwapCandidates[0].videoClipUrl.includes('.mp4'));
  });

  test('Search Engine supports filtering by apparatus, subdivision, and resistance profile', () => {
    const cablePull = searchExercises('pulldown', {
      apparatusGroup: 'cable',
      limit: 5,
    });

    assert.ok(cablePull.length > 0);
    for (const ex of cablePull) {
      assert.strictEqual(ex.apparatusGroup, 'cable');
    }

    const lengthenedSquats = searchExercises('squat', {
      resistanceProfile: 'lengthened',
      limit: 5,
    });
    assert.ok(lengthenedSquats.length > 0);
    for (const ex of lengthenedSquats) {
      assert.strictEqual(ex.resistanceProfile, 'lengthened');
    }
  });
});
