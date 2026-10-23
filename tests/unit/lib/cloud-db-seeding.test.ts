import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runSeed } from '@/db/seed/run-seed';
import { appStore } from '@/lib/store';
import {
  userAlaa,
  userAlaaPro,
  linkAlaa,
  generateMaster16WeekProgram,
  masterSupplementProtocols,
  masterHydrationGoal,
  seedMetricsAlaa,
} from '@/db/seed/master-transformation-program';

describe('Cloud Database Seeding & Zero-Barrier Alpha Onboarding', () => {
  it('verifies runSeed handles missing DATABASE_URL gracefully without crashing', async () => {
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const result = await runSeed('');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'DATABASE_URL_NOT_SET');

    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    }
  });

  it('verifies Alaa trainee account is fully pre-seeded for zero signup/signin friction', () => {
    assert.strictEqual(userAlaa.id, 'trainee_alaa');
    assert.strictEqual(userAlaa.name, 'Alaa');
    assert.strictEqual(userAlaa.email, 'alaa@vyra.fit');
    assert.strictEqual(userAlaa.role, 'trainee');
    assert.strictEqual(userAlaa.heightCm, 173);
    assert.strictEqual(userAlaa.sex, 'male');
    assert.strictEqual(userAlaa.dob, '1987-03-15');

    // Posture and mobility anchors
    const hasPelvicTilt = userAlaa.injuries.some((inj) => inj.includes('Anterior Pelvic Tilt'));
    const hasShoulderRotation = userAlaa.injuries.some((inj) => inj.includes('Shoulder Internal Rotation'));
    assert.strictEqual(hasPelvicTilt && hasShoulderRotation, true, 'Profile must include posture anchors');

    const hasTargetGain = userAlaa.goals.some((g) => g.includes('+0.25 to +0.40 kg/week'));
    assert.strictEqual(hasTargetGain, true, 'Goals must include +0.25 to +0.40 kg/week rate');
  });

  it('verifies Trainer Alaa Pro account is fully pre-seeded', () => {
    assert.strictEqual(userAlaaPro.id, 'trainer_alaa');
    assert.strictEqual(userAlaaPro.name, 'Alaa Pro');
    assert.strictEqual(userAlaaPro.email, 'coach.alaa@vyra.fit');
    assert.strictEqual(userAlaaPro.role, 'trainer');
  });

  it('verifies active trainer-trainee link exists between Alaa Pro and Alaa', () => {
    assert.strictEqual(linkAlaa.trainerId, 'trainer_alaa');
    assert.strictEqual(linkAlaa.traineeId, 'trainee_alaa');
    assert.strictEqual(linkAlaa.status, 'active');
  });

  it('verifies appStore defaults to Alaa persona with active 16-week Master Program', () => {
    const currentUser = appStore.getCurrentUser();
    assert.strictEqual(currentUser.id, 'trainee_alaa');
    assert.strictEqual(currentUser.name, 'Alaa');

    const activeProg = appStore.getActiveProgramForTrainee('trainee_alaa');
    assert.ok(activeProg, 'Active program must exist for Alaa');
    assert.strictEqual(activeProg.title, 'The Master Hypertrophy & Postural Architecture Protocol');
    assert.strictEqual(activeProg.durationWeeks, 16);
    assert.strictEqual(activeProg.weeks.length, 16);
    assert.strictEqual(activeProg.status, 'published');

    // Verify day 1 through 4 slots
    const w1 = activeProg.weeks[0];
    const mon = w1.days[0];
    const tue = w1.days[1];
    const wed = w1.days[2];
    const thu = w1.days[3];

    // Verify 5-exercise master split across the 4 training days
    assert.strictEqual(mon.blocks.flatMap((b) => b.exercises).length, 5, 'Monday must have 5 exercises (Upper Body A)');
    assert.strictEqual(mon.blocks.length, 2, 'Monday must have 2 blocks (straight + superset)');
    assert.strictEqual(tue.blocks.flatMap((b) => b.exercises).length, 5, 'Tuesday must have 5 exercises (Upper Body B)');
    assert.strictEqual(tue.blocks.length, 2, 'Tuesday must have 2 blocks (straight + superset)');
    assert.strictEqual(wed.blocks.flatMap((b) => b.exercises).length, 5, 'Wednesday must have 5 exercises (Lower Body A)');
    assert.strictEqual(wed.blocks.length, 2, 'Wednesday must have 2 blocks (straight + superset)');
    assert.strictEqual(thu.blocks.flatMap((b) => b.exercises).length, 6, 'Thursday must have 6 exercises (5 slots + finisher carry)');
    assert.strictEqual(thu.blocks.length, 3, 'Thursday must have 3 blocks (straight + superset + finisher)');

    // Thursday Drop Set configuration
    const thuDropSetEx = thu.blocks.flatMap((b) => b.exercises).find((e) => e.hasDropSet);
    assert.ok(thuDropSetEx, 'Thursday must contain an exercise with hasDropSet flag');
    assert.ok(thuDropSetEx.dropSetGuidance && thuDropSetEx.dropSetGuidance.includes('Burnout'));
  });

  it('verifies seed metrics track Alaa baseline starting from 49.0 kg', () => {
    assert.ok(seedMetricsAlaa.length >= 14, 'Must seed 14 days of bodyweight history');
    assert.strictEqual(seedMetricsAlaa[0].weightKg, 49.0);
    assert.ok(seedMetricsAlaa[seedMetricsAlaa.length - 1].weightKg >= 49.5);
  });
});
