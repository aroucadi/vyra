import { describe, it } from 'node:test';
import assert from 'node:assert';

// 1. Biomechanical Substitution
import {
  findBiomechanicalSubstitutes,
} from '../../../src/lib/training-math/substitution-copilot';
import { RagExercise } from '../../../src/types/exercise-rag';

// 2. Progression Engine
import {
  stallCount,
  nextPrescription,
  snapWeight,
  addStep,
  deloadTo,
  SessionRecord,
} from '../../../src/lib/training-math/progression';

// 3. Autoregulation & Machine Disambiguation
import {
  calculateReadinessScore,
  isAxialLoadedExercise,
} from '../../../src/lib/autoregulation';

// 4. Postural Volume & Scoping
import {
  computeWeeklyVolumeFromProgram,
} from '../../../src/lib/training-math/weekly-volume';
import { Program } from '../../../src/lib/types';

// 5. AI Schema Normalization & Progression Guardrails
import {
  validateLlmCoachDecisionSchema,
  computeSafeLoadProgressionLimit,
} from '../../../src/lib/ai/vertex-agent-loop';
import { createDefaultAthleteModel } from '../../../src/lib/ai/athlete-model';

describe('Hardening & Boundary Verification Suite (Post-Audit Fixes)', () => {
  describe('Component 1: Biomechanical Substitution Cross-Subdivision Isolation', () => {
    const shoulderCatalogue: RagExercise[] = [
      {
        id: '1001',
        name: 'Dumbbell Shoulder Press',
        bodyPart: 'shoulders',
        equipment: 'dumbbell',
        target: 'delts',
        secondaryMuscles: ['triceps'],
        category: 'strength',
        description: 'Overhead pressing with dumbbells.',
        instructions: ['Press upward from ear level.'],
      },
      {
        id: '1002',
        name: 'Seated Barbell Overhead Press',
        bodyPart: 'shoulders',
        equipment: 'barbell',
        target: 'delts',
        secondaryMuscles: ['triceps'],
        category: 'strength',
        description: 'Seated vertical barbell press.',
        instructions: ['Press barbell overhead while seated.'],
      },
      {
        id: '1003',
        name: 'Cable Lateral Raise',
        bodyPart: 'shoulders',
        equipment: 'cable',
        target: 'delts',
        secondaryMuscles: [],
        category: 'strength',
        description: 'Cable abduction targeting lateral deltoid.',
        instructions: ['Raise arm laterally away from body.'],
      },
      {
        id: '1004',
        name: 'Dumbbell Rear Delt Fly',
        bodyPart: 'shoulders',
        equipment: 'dumbbell',
        target: 'delts',
        secondaryMuscles: ['rhomboids'],
        category: 'strength',
        description: 'Bent over rear delt abduction.',
        instructions: ['Fly arms outward horizontally.'],
      },
      {
        id: '1005',
        name: 'Cable Face Pull',
        bodyPart: 'shoulders',
        equipment: 'cable',
        target: 'delts',
        secondaryMuscles: ['rotator cuff', 'upper back'],
        category: 'strength',
        description: 'Cable pull to face with external rotation.',
        instructions: ['Pull rope toward nose.'],
      },
    ];

    it('prevents deltoid_anterior (Overhead Press) from substituting with deltoid_posterior (Rear Delt / Face Pull)', () => {
      const candidates = findBiomechanicalSubstitutes(
        {
          name: 'Barbell Overhead Press',
          target: 'delts',
          equipment: 'barbell',
        },
        shoulderCatalogue,
        { limit: 5 }
      );

      assert.ok(candidates.length > 0, 'Must return candidates');
      const candidateNames = candidates.map((c) => c.exercise.name);
      assert.ok(
        !candidateNames.includes('Dumbbell Rear Delt Fly'),
        'Must NOT substitute Overhead Press with Rear Delt Fly'
      );
      assert.ok(
        !candidateNames.includes('Cable Face Pull'),
        'Must NOT substitute Overhead Press with Face Pull'
      );
      for (const c of candidates) {
        assert.notStrictEqual(
          c.subdivision,
          'deltoid_posterior',
          'Candidate subdivision cannot be deltoid_posterior'
        );
      }
    });

    it('prevents deltoid_posterior (Rear Delt Fly) from substituting with deltoid_anterior (Overhead Press)', () => {
      const candidates = findBiomechanicalSubstitutes(
        {
          name: 'Dumbbell Rear Delt Fly',
          target: 'delts',
          equipment: 'dumbbell',
        },
        shoulderCatalogue,
        { limit: 5 }
      );

      assert.ok(candidates.length > 0, 'Must return candidates');
      const candidateNames = candidates.map((c) => c.exercise.name);
      assert.ok(
        !candidateNames.includes('Dumbbell Shoulder Press'),
        'Must NOT substitute Rear Delt Fly with Dumbbell Shoulder Press'
      );
      assert.ok(
        !candidateNames.includes('Seated Barbell Overhead Press'),
        'Must NOT substitute Rear Delt Fly with Overhead Press'
      );
      for (const c of candidates) {
        assert.notStrictEqual(
          c.subdivision,
          'deltoid_anterior',
          'Candidate subdivision cannot be deltoid_anterior'
        );
      }
    });
  });

  describe('Component 2: Progression Engine & Numeric Primitives (NaN Resilience)', () => {
    it('stallCount accurately accumulates consecutive stalls even when session weight is NaN or undefined', () => {
      const nanSessions: SessionRecord[] = [
        { weight: NaN, ok: false, planned: { reps: 8 } },
        { weight: NaN, ok: false, planned: { reps: 8 } },
        { weight: NaN, ok: false, planned: { reps: 8 } },
      ];
      const count = stallCount(nanSessions, 'double');
      assert.strictEqual(count, 3, 'Must accumulate to 3 stalls without breaking early on NaN');
    });

    it('nextPrescription triggers an automated deload after 3 consecutive NaN failed sessions', () => {
      const nanSessions: SessionRecord[] = [
        { weight: NaN, ok: false, low: 6, planned: { reps: 8 } },
        { weight: NaN, ok: false, low: 6, planned: { reps: 8 } },
        { weight: NaN, ok: false, low: 6, planned: { reps: 8 } },
      ];

      const rx = nextPrescription(
        undefined,
        {
          id: 'ex_bench',
          exercise: 'Barbell Bench Press',
          policy: 'double',
          reps: 10,
          repsMin: 8,
          weight: 60,
          step: 2.5,
          deloadAt: 3,
        },
        null,
        nanSessions
      );

      assert.strictEqual(rx.kind, 'deload', 'Must trigger deload after 3 consecutive failed sessions');
      assert.strictEqual(rx.why[1], 3, 'Must parameterize 3 stalls into why template');
    });

    it('snapWeight, addStep, and deloadTo handle NaN safely without producing NaN', () => {
      assert.strictEqual(snapWeight(NaN, 2.5), 0);
      assert.strictEqual(addStep(NaN, 2.5, 2.5), 2.5);
      // deloadTo bounds the lower floor to minimum step (2.5kg)
      assert.strictEqual(deloadTo(NaN, 2.5, 0.9), 2.5);
    });
  });

  describe('Component 3: Autoregulation & Machine Disambiguation', () => {
    it('calculateReadinessScore gracefully recovers from NaN biometrics to safe default', () => {
      const res = calculateReadinessScore({
        sleepHours: NaN,
        sorenessRating: NaN,
        energyRating: NaN,
      });

      assert.ok(Number.isFinite(res.score), 'Score must be a finite number');
      assert.strictEqual(res.score, 50, 'Fallback score must be 50');
      assert.strictEqual(res.state, 'depleted');
    });

    it('isAxialLoadedExercise accurately identifies free-weight compounds and excludes machine-supported variations', () => {
      // Machine-supported movements (pad/frame bears axial load)
      assert.strictEqual(isAxialLoadedExercise('Hack Squat Machine'), false);
      assert.strictEqual(isAxialLoadedExercise('45° Leg Press Machine'), false);
      assert.strictEqual(isAxialLoadedExercise('Chest Supported Incline Dumbbell Row'), false);
      assert.strictEqual(isAxialLoadedExercise('45° Back / Glute Hyperextension'), false);

      // True spinal axial-loaded free-weight compounds
      assert.strictEqual(isAxialLoadedExercise('Barbell Back Squat'), true);
      assert.strictEqual(isAxialLoadedExercise('Barbell Deadlift'), true);
      assert.strictEqual(isAxialLoadedExercise('Romanian Deadlift'), true);
      assert.strictEqual(isAxialLoadedExercise('Standing Barbell Overhead Press'), true);
    });
  });

  describe('Component 4: Postural Volume Alerts & Multi-Week Scoping', () => {
    it('flags isPosturallyDeficient when pulling:pressing ratio is below 1.5:1', () => {
      const deficientProgram: Program = {
        id: 'prog-def-1',
        name: 'Chest Heavy Routine',
        targetLevel: 'intermediate',
        durationWeeks: 1,
        frequencyPerWeek: 3,
        focusAreas: ['Chest'],
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                dayOfWeek: 0,
                isRestDay: false,
                focusArea: 'Push',
                blocks: [
                  {
                    type: 'hypertrophy',
                    exercises: [
                      {
                        exerciseId: 'ex1',
                        exerciseName: 'Flat Barbell Bench Press',
                        targetMuscleGroups: ['Chest'],
                        sets: 4,
                        reps: 8,
                        restSeconds: 90,
                      },
                      {
                        exerciseId: 'ex2',
                        exerciseName: 'Incline Dumbbell Press',
                        targetMuscleGroups: ['Chest'],
                        sets: 4,
                        reps: 10,
                        restSeconds: 90,
                      },
                      {
                        exerciseId: 'ex3',
                        exerciseName: 'Overhead Press',
                        targetMuscleGroups: ['Shoulders'],
                        sets: 4,
                        reps: 8,
                        restSeconds: 90,
                      },
                      {
                        exerciseId: 'ex4',
                        exerciseName: 'Lat Pulldown',
                        targetMuscleGroups: ['Lats'],
                        sets: 4,
                        reps: 10,
                        restSeconds: 90,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const breakdown = computeWeeklyVolumeFromProgram(deficientProgram);
      assert.strictEqual(breakdown.upperPressingSets, 12);
      assert.strictEqual(breakdown.upperDynamicPullingSets, 4);
      assert.strictEqual(breakdown.isPosturallyDeficient, true);
      assert.ok(breakdown.posturalWarningMessage?.includes('Postural Imbalance Alert'));
    });

    it('clears isPosturallyDeficient when pulling volume meets or exceeds 1.5:1 threshold', () => {
      const balancedProgram: Program = {
        id: 'prog-bal-1',
        name: 'Balanced Routine',
        targetLevel: 'intermediate',
        durationWeeks: 2,
        frequencyPerWeek: 3,
        focusAreas: ['Full Body'],
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                dayOfWeek: 0,
                isRestDay: false,
                focusArea: 'Upper',
                blocks: [
                  {
                    type: 'hypertrophy',
                    exercises: [
                      {
                        exerciseId: 'ex1',
                        exerciseName: 'Incline Dumbbell Press',
                        targetMuscleGroups: ['Chest'],
                        sets: 4,
                        reps: 10,
                        restSeconds: 90,
                      },
                      {
                        exerciseId: 'ex2',
                        exerciseName: 'Chest Supported Cable Row',
                        targetMuscleGroups: ['Upper Back'],
                        sets: 4,
                        reps: 10,
                        restSeconds: 90,
                      },
                      {
                        exerciseId: 'ex3',
                        exerciseName: 'Lat Pulldown',
                        targetMuscleGroups: ['Lats'],
                        sets: 3,
                        reps: 10,
                        restSeconds: 90,
                      },
                      {
                        exerciseId: 'ex4',
                        exerciseName: 'Face Pull',
                        targetMuscleGroups: ['Rear Delt'],
                        sets: 3,
                        reps: 15,
                        restSeconds: 60,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            weekNumber: 2,
            days: [
              {
                dayOfWeek: 0,
                isRestDay: false,
                focusArea: 'Upper',
                blocks: [
                  {
                    type: 'hypertrophy',
                    exercises: [
                      {
                        exerciseId: 'ex1',
                        exerciseName: 'Incline Dumbbell Press',
                        targetMuscleGroups: ['Chest'],
                        sets: 4,
                        reps: 10,
                        restSeconds: 90,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const breakdownW1 = computeWeeklyVolumeFromProgram(balancedProgram, 0);
      assert.strictEqual(breakdownW1.upperPressingSets, 4);
      assert.strictEqual(breakdownW1.upperDynamicPullingSets, 10);
      assert.strictEqual(breakdownW1.isPosturallyDeficient, false);
      assert.strictEqual(breakdownW1.evaluatedWeekIndex, 0);
      assert.strictEqual(breakdownW1.totalWeeksInProgram, 2);

      const breakdownW2 = computeWeeklyVolumeFromProgram(balancedProgram, 1);
      assert.strictEqual(breakdownW2.evaluatedWeekIndex, 1);
      assert.strictEqual(breakdownW2.isPosturallyDeficient, true); // Week 2 has 4 press, 0 pull
    });
  });

  describe('Component 5: AI Schema Normalization & Progression Guardrails', () => {
    it('normalizes legacy tool declaration tier keys into canonical CoachingTier values', () => {
      const decisionVolume = validateLlmCoachDecisionSchema({
        tier: 'tier2_volume_optimization',
        headline: 'Prune excess sets',
        rootCauseDiagnosis: 'Lateral delt junk volume detected',
        proposedFix: 'Reduce sets from 5 to 3',
      });
      assert.strictEqual(decisionVolume.valid, true);
      assert.strictEqual(decisionVolume.parsed?.tier, 'tier_3_volume_prune');

      const decisionProgression = validateLlmCoachDecisionSchema({
        tier: 'tier1_progression',
        headline: 'Microload progression',
        rootCauseDiagnosis: 'Trainee completed top reps across all sets',
        proposedFix: 'Add 2.5kg',
      });
      assert.strictEqual(decisionProgression.valid, true);
      assert.strictEqual(decisionProgression.parsed?.tier, 'tier_4_overload_protocol');

      const decisionCanonical = validateLlmCoachDecisionSchema({
        tier: 'tier_2_surgical_swap',
        headline: 'Surgical swap',
        rootCauseDiagnosis: 'Shoulder impingement',
        proposedFix: 'Substitute DB press with neutral incline DB press',
      });
      assert.strictEqual(decisionCanonical.valid, true);
      assert.strictEqual(decisionCanonical.parsed?.tier, 'tier_2_surgical_swap');
    });

    it('computeSafeLoadProgressionLimit allows baseline loading on bodyweight (0kg) exercises', () => {
      const athleteModel = createDefaultAthleteModel('trainee_123');

      const bwCompound = computeSafeLoadProgressionLimit({
        exerciseName: 'Weighted Neutral-Grip Pull-Up',
        equipment: 'bodyweight',
        currentWeightKg: 0,
        athleteModel,
        detectedSymptoms: [],
        recentWeightProgressionDeltaKg: 0,
      });

      assert.strictEqual(bwCompound.activeJointSymptomFreeze, false);
      assert.strictEqual(bwCompound.maxStepKg, 2.5);
      assert.strictEqual(bwCompound.maxAllowedWeightKg, 2.5);
    });

    it('computeSafeLoadProgressionLimit strictly freezes load jump at 0kg when active joint symptom is present', () => {
      const athleteModel = createDefaultAthleteModel('trainee_123');

      const injuredCompound = computeSafeLoadProgressionLimit({
        exerciseName: 'Barbell Bench Press',
        equipment: 'barbell',
        currentWeightKg: 80,
        athleteModel,
        detectedSymptoms: ['anterior_shoulder_pinch'],
        recentWeightProgressionDeltaKg: 2.5,
      });

      assert.strictEqual(injuredCompound.activeJointSymptomFreeze, true);
      assert.strictEqual(injuredCompound.maxStepKg, 0);
      assert.strictEqual(injuredCompound.maxAllowedWeightKg, 80);
      assert.ok(injuredCompound.rationale.includes('Active tendon/joint symptom detected'));
    });
  });
});
