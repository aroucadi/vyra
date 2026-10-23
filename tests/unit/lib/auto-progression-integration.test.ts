import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatPrescriptionWhy,
  inferProgressionPolicy,
  mapVyraSessionsToRecords,
  computeExercisePrescription,
} from '../../../src/lib/progression-adapter';
import { hasEntitlement } from '../../../src/lib/entitlements';
import { WorkoutSession } from '../../../src/lib/types';

describe('Auto-Progression & Deload Integration Suite', () => {
  describe('formatPrescriptionWhy', () => {
    it('replaces token placeholders accurately', () => {
      const why = ['Top of the rep range in every set. {0} {1} more, back to {2} reps.', 2.5, 'kg', 8];
      const result = formatPrescriptionWhy(why);
      assert.strictEqual(result, 'Top of the rep range in every set. 2.5 kg more, back to 8 reps.');
    });

    it('returns default when why array is empty or undefined', () => {
      assert.strictEqual(
        formatPrescriptionWhy(undefined),
        'Targets maintained according to progression policy.'
      );
    });
  });

  describe('inferProgressionPolicy', () => {
    it('infers double progression for rep ranges', () => {
      assert.strictEqual(inferProgressionPolicy({ repRangeLow: 8, repRangeHigh: 10 }), 'double');
      assert.strictEqual(inferProgressionPolicy({ repRangeLow: 10, repRangeHigh: 12 }), 'double');
    });

    it('infers linear progression for fixed rep prescriptions', () => {
      assert.strictEqual(inferProgressionPolicy({ repRangeLow: 5, repRangeHigh: 5 }), 'linear');
    });

    it('honors explicit keywords in loadGuidance', () => {
      assert.strictEqual(
        inferProgressionPolicy({ loadGuidance: 'Greyskull LP: 2 straight sets plus final AMRAP' }),
        'greyskull'
      );
      assert.strictEqual(
        inferProgressionPolicy({ loadGuidance: 'Triple progression with adding sets up to 5' }),
        'triple'
      );
    });
  });

  describe('mapVyraSessionsToRecords', () => {
    it('transforms Vyra WorkoutSession array into OpenGym SessionRecord cleanly', () => {
      const mockSessions: WorkoutSession[] = [
        {
          id: 's1',
          traineeId: 't1',
          programDayId: 'd1',
          programTitle: 'P1',
          dayLabel: 'Push',
          date: '2026-10-01',
          startedAt: '2026-10-01T10:00:00Z',
          endedAt: '2026-10-01T10:45:00Z',
          durationSec: 2700,
          setLogs: [
            { id: '1', exercisePrescriptionId: 'ex1', exerciseName: 'Dumbbell Bench Press', setIndex: 1, reps: 10, weightKg: 30, rirAchieved: 2 },
            { id: '2', exercisePrescriptionId: 'ex1', exerciseName: 'Dumbbell Bench Press', setIndex: 2, reps: 10, weightKg: 30, rirAchieved: 2 },
            { id: '3', exercisePrescriptionId: 'ex1', exerciseName: 'Dumbbell Bench Press', setIndex: 3, reps: 10, weightKg: 30, rirAchieved: 1 },
          ],
        },
      ];

      const records = mapVyraSessionsToRecords(mockSessions, 'Dumbbell Bench Press', 10, 3);
      assert.strictEqual(records.length, 1);
      assert.strictEqual(records[0].weight, 30);
      assert.strictEqual(records[0].low, 10);
      assert.strictEqual(records[0].ok, true);
    });
  });

  describe('computeExercisePrescription', () => {
    it('prescribes weight jump and rep reset when hitting double progression ceiling', () => {
      const mockSessions: WorkoutSession[] = [
        {
          id: 's1',
          traineeId: 't1',
          programDayId: 'd1',
          programTitle: 'P1',
          dayLabel: 'Push',
          date: '2026-10-01',
          startedAt: '2026-10-01T10:00:00Z',
          endedAt: '2026-10-01T10:45:00Z',
          durationSec: 2700,
          setLogs: [
            { id: '1', exercisePrescriptionId: 'ex1', exerciseName: 'Incline Dumbbell Press', setIndex: 1, reps: 10, weightKg: 30, rirAchieved: 2 },
            { id: '2', exercisePrescriptionId: 'ex1', exerciseName: 'Incline Dumbbell Press', setIndex: 2, reps: 10, weightKg: 30, rirAchieved: 2 },
            { id: '3', exercisePrescriptionId: 'ex1', exerciseName: 'Incline Dumbbell Press', setIndex: 3, reps: 10, weightKg: 30, rirAchieved: 1 },
          ],
        },
      ];

      const presc = computeExercisePrescription(
        mockSessions,
        {
          id: 'ex1',
          name: 'Incline Dumbbell Press',
          sets: 3,
          repRangeLow: 8,
          repRangeHigh: 10,
          lastWeightKg: 30,
        },
        'kg'
      );

      assert.strictEqual(presc.kind, 'up');
      assert.strictEqual(presc.weight, 32.5);
      assert.strictEqual(presc.reps, 8);
      assert.ok(presc.formattedWhy.includes('2.5 kg more'));
    });

    it('triggers automated Epley 10% deload after 3 consecutive missed sessions', () => {
      const stallSessions: WorkoutSession[] = [
        {
          id: 's1',
          traineeId: 't1',
          programDayId: 'd1',
          programTitle: 'P1',
          dayLabel: 'Legs',
          date: '2026-10-01',
          startedAt: '2026-10-01T10:00:00Z',
          endedAt: '2026-10-01T10:45:00Z',
          durationSec: 2700,
          setLogs: [
            { id: '1', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 1, reps: 5, weightKg: 100, rirAchieved: 0 },
            { id: '2', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 2, reps: 4, weightKg: 100, rirAchieved: 0 },
            { id: '3', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 3, reps: 3, weightKg: 100, rirAchieved: 0 },
          ],
        },
        {
          id: 's2',
          traineeId: 't1',
          programDayId: 'd1',
          programTitle: 'P1',
          dayLabel: 'Legs',
          date: '2026-10-04',
          startedAt: '2026-10-04T10:00:00Z',
          endedAt: '2026-10-04T10:45:00Z',
          durationSec: 2700,
          setLogs: [
            { id: '4', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 1, reps: 5, weightKg: 100, rirAchieved: 0 },
            { id: '5', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 2, reps: 4, weightKg: 100, rirAchieved: 0 },
            { id: '6', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 3, reps: 4, weightKg: 100, rirAchieved: 0 },
          ],
        },
        {
          id: 's3',
          traineeId: 't1',
          programDayId: 'd1',
          programTitle: 'P1',
          dayLabel: 'Legs',
          date: '2026-10-07',
          startedAt: '2026-10-07T10:00:00Z',
          endedAt: '2026-10-07T10:45:00Z',
          durationSec: 2700,
          setLogs: [
            { id: '7', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 1, reps: 4, weightKg: 100, rirAchieved: 0 },
            { id: '8', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 2, reps: 4, weightKg: 100, rirAchieved: 0 },
            { id: '9', exercisePrescriptionId: 'sq', exerciseName: 'Barbell Squat', setIndex: 3, reps: 3, weightKg: 100, rirAchieved: 0 },
          ],
        },
      ];

      const presc = computeExercisePrescription(
        stallSessions,
        {
          id: 'sq',
          name: 'Barbell Squat',
          sets: 3,
          repRangeLow: 5,
          repRangeHigh: 5,
          lastWeightKg: 100,
          loadGuidance: 'Linear progression 3x5',
        },
        'kg'
      );

      assert.strictEqual(presc.kind, 'deload');
      assert.ok(presc.weight !== undefined && presc.weight < 100);
      assert.strictEqual(presc.weight, 90);
      assert.ok(presc.formattedWhy.includes('Epley deload to 90 kg'));
    });
  });

  describe('Entitlements Gate', () => {
    it('gates progression engine strictly to Pro and Enterprise tiers', () => {
      assert.strictEqual(hasEntitlement('FREE', 'progression_engine'), false);
      assert.strictEqual(hasEntitlement('PRO', 'progression_engine'), true);
      assert.strictEqual(hasEntitlement('ENTERPRISE', 'progression_engine'), true);
    });
  });
});
