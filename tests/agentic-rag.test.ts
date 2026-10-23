import { describe, it, expect } from 'vitest';
import { filterAndRankExercises } from '@/lib/rag/exercise-retriever';
import { evaluateGeneratedProgram, GeneratedMesocycle } from '@/lib/rag/agentic-evaluator';
import { RagExercise } from '@/types/exercise-rag';

const mockCatalogue: RagExercise[] = [
  {
    id: '0025',
    name: 'barbell bench press',
    bodyPart: 'chest',
    equipment: 'barbell',
    target: 'pectorals',
    secondaryMuscles: ['triceps', 'shoulders'],
    category: 'strength',
    description: 'Flat barbell bench press',
    instructions: ['Lie on bench', 'Press bar'],
    muscleMap: { primaries: ['chest'], secondaries: ['triceps'], weights: { pectorals: 1.0 } },
  },
  {
    id: '0289',
    name: 'dumbbell bench press',
    bodyPart: 'chest',
    equipment: 'dumbbell',
    target: 'pectorals',
    secondaryMuscles: ['triceps', 'shoulders'],
    category: 'strength',
    description: 'Flat dumbbell bench press',
    instructions: ['Lie on bench', 'Press dumbbells'],
    muscleMap: { primaries: ['chest'], secondaries: ['triceps'], weights: { pectorals: 1.0 } },
  },
  {
    id: '0032',
    name: 'barbell behind neck press',
    bodyPart: 'shoulders',
    equipment: 'barbell',
    target: 'deltoids',
    secondaryMuscles: ['triceps'],
    category: 'strength',
    description: 'Shoulder press behind neck',
    instructions: ['Press behind neck'],
  },
  {
    id: '0150',
    name: 'dumbbell neutral overhead press',
    bodyPart: 'shoulders',
    equipment: 'dumbbell',
    target: 'deltoids',
    secondaryMuscles: ['triceps'],
    category: 'strength',
    description: 'Neutral grip shoulder press',
    instructions: ['Press with neutral grip'],
  },
  {
    id: '0040',
    name: 'dumbbell bent over row',
    bodyPart: 'back',
    equipment: 'dumbbell',
    target: 'latissimus dorsi',
    secondaryMuscles: ['biceps'],
    category: 'strength',
    description: 'Rowing movement for back',
    instructions: ['Pull dumbbells to hips'],
  },
];

describe('Agentic Biomechanical RAG Engine', () => {
  describe('Exercise Retrieval & Hard Pre-Filtering', () => {
    it('enforces 100% equipment constraint filtering', () => {
      const results = filterAndRankExercises(mockCatalogue, {
        availableEquipment: ['dumbbell'],
        targetMuscle: 'pectorals',
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe('0289'); // dumbbell bench press
      expect(results[0].equipment).toBe('dumbbell');
    });

    it('filters out dangerous movements when injury flag is present', () => {
      const results = filterAndRankExercises(mockCatalogue, {
        availableEquipment: ['dumbbell', 'barbell'],
        targetMuscle: 'deltoids',
        injuryFlags: ['shoulder_impingement'],
      });

      // 'barbell behind neck press' should be excluded
      const ids = results.map((r) => r.id);
      expect(ids).not.toContain('0032');
      expect(ids).toContain('0150'); // safe neutral dumbbell press remains
    });
  });

  describe('Agentic Evaluator & Guardrails', () => {
    const catalogueMap = new Map(mockCatalogue.map((e) => [e.id, e]));

    it('approves a fully compliant mesocycle', () => {
      const validPlan: GeneratedMesocycle = {
        title: 'Upper Hypertrophy Block',
        days: [
          {
            dayLabel: 'Upper A',
            exercises: [
              { exerciseId: '0289', name: 'dumbbell bench press', sets: 4, reps: '8-10' },
              { exerciseId: '0040', name: 'dumbbell bent over row', sets: 4, reps: '10-12' },
            ],
          },
          {
            dayLabel: 'Upper B',
            exercises: [
              { exerciseId: '0289', name: 'dumbbell bench press', sets: 4, reps: '8-10' },
              { exerciseId: '0040', name: 'dumbbell bent over row', sets: 4, reps: '10-12' },
            ],
          },
        ],
      };

      const evalResult = evaluateGeneratedProgram(validPlan, catalogueMap, ['dumbbell']);
      expect(evalResult.isCompliant).toBe(true);
      expect(evalResult.equipmentComplianceRate).toBe(1.0);
      expect(evalResult.hallucinatedIds).toEqual([]);
      expect(evalResult.structuralBalanceScore).toBe(1.0); // 8 push sets / 8 pull sets
    });

    it('detects equipment violation and hallucinated IDs', () => {
      const invalidPlan: GeneratedMesocycle = {
        title: 'Flawed Plan',
        days: [
          {
            dayLabel: 'Day 1',
            exercises: [
              { exerciseId: '0025', name: 'barbell bench press', sets: 4, reps: '8-10' }, // Requires barbell, but user only has dumbbells
              { exerciseId: '9999_fake', name: 'hallucinated exercise', sets: 3, reps: '12' },
            ],
          },
        ],
      };

      const evalResult = evaluateGeneratedProgram(invalidPlan, catalogueMap, ['dumbbell']);
      expect(evalResult.isCompliant).toBe(false);
      expect(evalResult.hallucinatedIds).toContain('9999_fake');
      expect(evalResult.equipmentComplianceRate).toBeLessThan(1.0);
      expect(evalResult.errors.length).toBeGreaterThan(0);
    });
  });
});
