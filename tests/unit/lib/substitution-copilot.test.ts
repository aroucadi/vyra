import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  inferMuscleSubdivision,
  inferResistanceProfile,
  findBiomechanicalSubstitutes,
} from '../../../src/lib/training-math/substitution-copilot';
import { RagExercise } from '../../../src/types/exercise-rag';

describe('Spec 017: Intelligent Biomechanical Substitution Copilot Suite', () => {
  describe('inferMuscleSubdivision', () => {
    it('accurately identifies clavicular vs sternal vs costal pec divisions', () => {
      assert.strictEqual(inferMuscleSubdivision('Incline Dumbbell Bench Press', 'chest'), 'chest_clavicular');
      assert.strictEqual(inferMuscleSubdivision('Flat Barbell Bench Press', 'chest'), 'chest_sternal');
      assert.strictEqual(inferMuscleSubdivision('High to Low Cable Fly', 'chest'), 'chest_costal');
      assert.strictEqual(inferMuscleSubdivision('Dips (chest version)', 'chest'), 'chest_costal');
    });

    it('accurately identifies iliac lat vs rhomboids/upper back', () => {
      assert.strictEqual(inferMuscleSubdivision('Neutral-Grip Lat Pulldown', 'lats'), 'lat_iliac');
      assert.strictEqual(inferMuscleSubdivision('Single-Arm DB Row (Tucked)', 'lats'), 'lat_iliac');
      assert.strictEqual(inferMuscleSubdivision('Wide-Grip Cable Row', 'upper back'), 'back_rhomboids');
    });

    it('accurately identifies quad lengthened vs terminal extension', () => {
      assert.strictEqual(inferMuscleSubdivision('Heel-Elevated Goblet Squat', 'quads'), 'quad_lengthened');
      assert.strictEqual(inferMuscleSubdivision('Leg Extension Machine', 'quads'), 'quad_shortened');
    });

    it('accurately identifies hamstring knee flexion vs hip hinge', () => {
      assert.strictEqual(inferMuscleSubdivision('Seated Leg Curl', 'hamstrings'), 'hamstring_knee');
      assert.strictEqual(inferMuscleSubdivision('Barbell Romanian Deadlift', 'hamstrings'), 'hamstring_hip');
    });
  });

  describe('inferResistanceProfile', () => {
    it('identifies constant tension for cables and bands', () => {
      assert.strictEqual(inferResistanceProfile('Cable Lateral Raise', 'cable'), 'constant');
      assert.strictEqual(inferResistanceProfile('Band Pull-Apart', 'resistance band'), 'constant');
    });

    it('identifies shortened peak tension for machines and flyes', () => {
      assert.strictEqual(inferResistanceProfile('Pec Deck Fly', 'lever'), 'shortened');
      assert.strictEqual(inferResistanceProfile('Leg Extension', 'lever'), 'shortened');
    });

    it('identifies lengthened stretch tension for squats and hinges', () => {
      assert.strictEqual(inferResistanceProfile('Barbell Squat', 'barbell'), 'lengthened');
      assert.strictEqual(inferResistanceProfile('Dumbbell RDL', 'dumbbell'), 'lengthened');
    });
  });

  describe('findBiomechanicalSubstitutes', () => {
    const mockCatalogue: RagExercise[] = [
      {
        id: '0101',
        name: 'Pec Deck Machine',
        target: 'chest',
        bodyPart: 'chest',
        equipment: 'lever',
        secondaryMuscles: ['triceps', 'anterior deltoid'],
        category: 'strength',
        description: 'Machine fly focusing on peak contraction.',
        instructions: ['Sit with back flat', 'Bring handles together', 'Squeeze chest'],
      },
      {
        id: '0102',
        name: 'Flat Dumbbell Fly',
        target: 'chest',
        bodyPart: 'chest',
        equipment: 'dumbbell',
        secondaryMuscles: ['anterior deltoid'],
        category: 'strength',
        description: 'Dumbbell fly on flat bench.',
        instructions: ['Lie flat on bench', 'Lower dumbbells wide', 'Bring together over chest'],
      },
      {
        id: '0103',
        name: 'Standing Cable Fly',
        target: 'chest',
        bodyPart: 'chest',
        equipment: 'cable',
        secondaryMuscles: ['anterior deltoid'],
        category: 'strength',
        description: 'Continuous cable tension fly.',
        instructions: ['Set pulleys at chest height', 'Press forward and together', 'Controlled eccentric'],
      },
      {
        id: '0104',
        name: 'Incline Dumbbell Press',
        target: 'chest',
        bodyPart: 'chest',
        equipment: 'dumbbell',
        secondaryMuscles: ['triceps', 'anterior deltoid'],
        category: 'strength',
        description: 'Incline press for upper chest.',
        instructions: ['Set bench 30 deg', 'Press dumbbells up', 'Lower under control'],
      },
      {
        id: '0201',
        name: 'Barbell Romanian Deadlift',
        target: 'hamstrings',
        bodyPart: 'upper legs',
        equipment: 'barbell',
        secondaryMuscles: ['glutes', 'lower back'],
        category: 'strength',
        description: 'Hinge pattern for posterior chain.',
        instructions: ['Hinge hips back', 'Lower bar past knees', 'Drive hips forward'],
      },
    ];

    it('ranks substitutes matching sternal division when Pec Deck is occupied', () => {
      const source = {
        id: '0101',
        name: 'Pec Deck Machine',
        target: 'chest',
        equipment: 'lever',
      };

      const substitutes = findBiomechanicalSubstitutes(source, mockCatalogue, { limit: 3 });

      assert.strictEqual(substitutes.length, 3);
      // Top candidate must be another chest exercise with different equipment (dumbbell or cable)
      const top = substitutes[0];
      assert.notStrictEqual(top.exercise.equipment, 'lever', 'Prioritizes non-lever alternatives when lever is busy');
      assert.strictEqual(top.subdivision, 'chest_sternal');
      assert.ok(top.similarityScore >= 0.75, 'High similarity score for subdivision match');
      assert.ok(top.biomechanicalRationale.includes('sternal fiber'), 'Generates coach rationale referencing sternal line of action');
      assert.ok(top.setupAdjustmentCue.length > 0, 'Provides concrete setup adjustment cue');
    });

    it('honors equipment exclusion and preferred equipment options', () => {
      const source = {
        name: 'Pec Deck Machine',
        target: 'chest',
        equipment: 'lever',
      };

      // Trainee specifies cables are also occupied; only dumbbells available
      const substitutes = findBiomechanicalSubstitutes(source, mockCatalogue, {
        excludedEquipment: ['cable', 'lever'],
        preferredEquipment: ['dumbbell'],
      });

      assert.ok(substitutes.length > 0);
      assert.ok(substitutes.every((s) => s.exercise.equipment === 'dumbbell'), 'All returned substitutes are dumbbells');
    });
  });
});
