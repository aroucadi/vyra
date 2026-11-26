import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  classifyApparatus,
  classifyMovementPattern,
  classifyMechanics,
  classifyPlaneOfMotion,
  classifyKineticChain,
  classifyResistanceProfile,
  classifyAxialLoading,
  inferDetailedMuscles,
  enrichExerciseWithBiomechanics,
} from '@/lib/rag/biomechanical-metadata';

describe('Biomechanical Metadata Classification Suite', () => {
  test('accurately classifies apparatus group and hardware detail', () => {
    // 1. Smith Machine
    const smith = classifyApparatus('smith machine', 'Smith Machine Incline Bench Press');
    assert.strictEqual(smith.apparatusGroup, 'smith_machine');
    assert.strictEqual(smith.hardwareDetail, 'smith_machine');

    // 2. Cable Stack
    const cable = classifyApparatus('cable', 'Cable Lat Pulldown');
    assert.strictEqual(cable.apparatusGroup, 'cable');
    assert.strictEqual(cable.hardwareDetail, 'cable_stack');

    // 3. Dumbbell
    const db = classifyApparatus('dumbbell', 'Incline Dumbbell Curl');
    assert.strictEqual(db.apparatusGroup, 'dumbbell');
    assert.strictEqual(db.hardwareDetail, 'dumbbell');

    // 4. Barbell & Specialty Bars
    const trap = classifyApparatus('trap bar', 'Trap Bar Deadlift');
    assert.strictEqual(trap.apparatusGroup, 'barbell');
    assert.strictEqual(trap.hardwareDetail, 'trap_bar');

    const ez = classifyApparatus('ez barbell', 'EZ Bar Preacher Curl');
    assert.strictEqual(ez.apparatusGroup, 'barbell');
    assert.strictEqual(ez.hardwareDetail, 'ez_barbell');

    // 5. Machines
    const selectorized = classifyApparatus('leverage machine', 'Seated Chest Press Machine');
    assert.strictEqual(selectorized.apparatusGroup, 'machine');

    // 6. Bodyweight
    const bw = classifyApparatus('body weight', 'Wide Grip Pull Up');
    assert.strictEqual(bw.apparatusGroup, 'bodyweight');
    assert.strictEqual(bw.hardwareDetail, 'calisthenic_bar');
  });

  test('accurately classifies human movement patterns', () => {
    assert.strictEqual(classifyMovementPattern('Barbell Bench Press', 'pectorals', 'chest'), 'horizontal_push');
    assert.strictEqual(classifyMovementPattern('Lat Pulldown', 'lats', 'back'), 'vertical_pull');
    assert.strictEqual(classifyMovementPattern('Seated Cable Row', 'upper back', 'back'), 'horizontal_pull');
    assert.strictEqual(classifyMovementPattern('Overhead Military Press', 'delts', 'shoulders'), 'vertical_push');
    assert.strictEqual(classifyMovementPattern('Barbell Back Squat', 'quads', 'upper legs'), 'squat');
    assert.strictEqual(classifyMovementPattern('Romanian Deadlift', 'hamstrings', 'upper legs'), 'hip_hinge');
    assert.strictEqual(classifyMovementPattern('Bulgarian Split Squat', 'quads', 'upper legs'), 'lunge');
    assert.strictEqual(classifyMovementPattern('Dumbbell Bicep Curl', 'biceps', 'upper arms'), 'isolation');
    assert.strictEqual(classifyMovementPattern('Hanging Leg Raise', 'abs', 'waist'), 'core_flexion');
    assert.strictEqual(classifyMovementPattern('Cable Woodchopper', 'obliques', 'waist'), 'core_rotation');
  });

  test('accurately classifies mechanics, planes, and kinetic chains', () => {
    // Compound vs Isolation
    assert.strictEqual(classifyMechanics('Barbell Bench Press', 'horizontal_push', 'pectorals'), 'compound');
    assert.strictEqual(classifyMechanics('Dumbbell Lateral Raise', 'isolation', 'side delts'), 'isolation');

    // Planes of motion
    assert.strictEqual(classifyPlaneOfMotion('Dumbbell Lateral Raise', 'isolation'), 'frontal');
    assert.strictEqual(classifyPlaneOfMotion('Cable Pec Fly', 'horizontal_push'), 'transverse');
    assert.strictEqual(classifyPlaneOfMotion('Barbell Back Squat', 'squat'), 'sagittal');

    // Kinetic chains
    assert.strictEqual(classifyKineticChain('Push Up', 'bodyweight', 'compound'), 'closed_chain');
    assert.strictEqual(classifyKineticChain('Barbell Bench Press', 'barbell', 'compound'), 'open_chain');
  });

  test('accurately classifies resistance profile and axial spinal loading', () => {
    // Resistance profiles
    assert.strictEqual(classifyResistanceProfile('Incline Dumbbell Bench Press', 'dumbbell'), 'lengthened');
    assert.strictEqual(classifyResistanceProfile('Cable Crossover Fly', 'cable'), 'constant');
    assert.strictEqual(classifyResistanceProfile('Leg Extension Machine', 'machine'), 'shortened');
    assert.strictEqual(classifyResistanceProfile('Barbell Squat', 'barbell'), 'ascending');

    // Axial loading
    assert.strictEqual(classifyAxialLoading('Barbell Back Squat', 'barbell', 'squat'), 'high');
    assert.strictEqual(classifyAxialLoading('Standing Military Press', 'barbell', 'vertical_push'), 'high');
    assert.strictEqual(classifyAxialLoading('Trap Bar Deadlift', 'barbell', 'hip_hinge'), 'moderate');
    assert.strictEqual(classifyAxialLoading('Leg Press Machine', 'machine', 'squat'), 'low');
    assert.strictEqual(classifyAxialLoading('Lat Pulldown', 'cable', 'vertical_pull'), 'none');
  });

  test('infers exact muscular subdivisions and prime movers', () => {
    const clav = inferDetailedMuscles('Incline Dumbbell Press', 'pectorals');
    assert.strictEqual(clav.subdivision, 'chest_clavicular');
    assert.ok(clav.primaryMuscles.some((m) => m.includes('Clavicular')));

    const lat = inferDetailedMuscles('Neutral Grip Pulldown', 'lats');
    assert.strictEqual(lat.subdivision, 'lat_iliac');

    const rear = inferDetailedMuscles('Face Pull', 'rear delts');
    assert.strictEqual(rear.subdivision, 'deltoid_posterior');

    const quad = inferDetailedMuscles('Terminal Leg Extension', 'quads');
    assert.strictEqual(quad.subdivision, 'quad_shortened');
  });

  test('enrichExerciseWithBiomechanics produces a complete verified RagExercise object', () => {
    const raw = {
      id: '0047',
      name: 'barbell incline bench press',
      bodyPart: 'chest',
      equipment: 'barbell',
      target: 'pectorals',
      secondaryMuscles: ['shoulders', 'triceps'],
    };

    const enriched = enrichExerciseWithBiomechanics(raw);

    assert.strictEqual(enriched.id, '0047');
    assert.strictEqual(enriched.apparatusGroup, 'barbell');
    assert.strictEqual(enriched.muscleSubdivision, 'chest_clavicular');
    assert.strictEqual(enriched.movementPattern, 'horizontal_push');
    assert.strictEqual(enriched.mechanics, 'compound');
    assert.strictEqual(enriched.resistanceProfile, 'lengthened');
    assert.ok(enriched.clipUrl?.includes('0047.mp4'));
    assert.ok(enriched.imageUrl?.includes('0047.webp'));
    assert.ok(Array.isArray(enriched.coachingCues) && enriched.coachingCues.length > 0);
    assert.ok(Array.isArray(enriched.commonMistakes) && enriched.commonMistakes.length > 0);
    assert.ok(Array.isArray(enriched.swapSynergyKeys) && enriched.swapSynergyKeys.length > 0);
  });
});
