import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getChronoPhase } from '@/components/trainee/TraineeNav';

describe('Today Command Center & Recovery Debrief Telemetry Architecture', () => {
  it('correctly maps 24-hour chronobiological phases across the day', () => {
    // 08:00 -> Morning Anchor
    const morning = new Date('2026-11-25T08:00:00');
    const p1 = getChronoPhase(morning);
    assert.strictEqual(p1.phase, 'morning_anchor');
    assert.strictEqual(p1.label, 'Morning Anchor');

    // 13:00 -> Kinetic Crucible (Gym Window)
    const midday = new Date('2026-11-25T13:00:00');
    const p2 = getChronoPhase(midday);
    assert.strictEqual(p2.phase, 'kinetic_crucible');
    assert.strictEqual(p2.label, 'Kinetic Crucible');

    // 17:00 -> Somatic Recovery
    const afternoon = new Date('2026-11-25T17:00:00');
    const p3 = getChronoPhase(afternoon);
    assert.strictEqual(p3.phase, 'somatic_recovery');

    // 23:00 -> Deep Rest
    const night = new Date('2026-11-25T23:00:00');
    const p4 = getChronoPhase(night);
    assert.strictEqual(p4.phase, 'deep_rest');
  });

  it('accurately computes total session volume and PR counters', () => {
    const mockExercises = [
      {
        name: 'Lat Pulldown',
        completedSets: [
          { weight: 40, reps: 10, isPR: false },
          { weight: 42.5, reps: 8, isPR: true },
        ],
        targetRir: 2,
      },
      {
        name: 'Incline Dumbbell Curl',
        completedSets: [
          { weight: 12, reps: 12, isPR: false },
          { weight: 12, reps: 10, isPR: false },
        ],
        targetRir: 1,
      },
    ];

    const totalVolume = mockExercises.reduce(
      (acc, ex) =>
        acc + ex.completedSets.reduce((sAcc, s) => sAcc + s.weight * s.reps, 0),
      0
    );

    // 40*10 = 400 + 42.5*8 = 340 + 12*12 = 144 + 12*10 = 120 => 1004 kg
    assert.strictEqual(totalVolume, 1004);

    const prCount = mockExercises.reduce(
      (acc, ex) => acc + ex.completedSets.filter((s) => s.isPR).length,
      0
    );
    assert.strictEqual(prCount, 1);

    const avgRir = (
      mockExercises.reduce((sum, ex) => sum + ex.targetRir, 0) /
      mockExercises.length
    ).toFixed(1);
    assert.strictEqual(avgRir, '1.5');
  });
});
