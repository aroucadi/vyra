import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runSeed } from '@/db/seed/run-seed';
import { appStore } from '@/lib/store';
import {
  userAlaa,
  userAlaaPro,
  linkAlaa,
  generateMaster12WeekProgram,
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
    assert.strictEqual(userAlaa.dob, '1989-03-15');

    // Posture, underweight medical gate and left-arm coordination anchors
    const hasUnderweightGate = userAlaa.injuries.some((inj) => inj.includes('BMI 17.3') || inj.includes('Underweight'));
    const hasLeftArmRule = userAlaa.injuries.some((inj) => inj.includes('Left-Arm') || inj.includes('0178'));
    const hasFootballManagement = userAlaa.injuries.some((inj) => inj.includes('Football') || inj.includes('19:15'));
    assert.strictEqual(hasUnderweightGate && hasLeftArmRule && hasFootballManagement, true, 'Profile must include medical gate and left-arm rule');

    const hasTargetGain = userAlaa.goals.some((g) => g.includes('+0.20 to +0.40 kg/week') || g.includes('55.0 kg'));
    assert.strictEqual(hasTargetGain, true, 'Goals must include +0.20 to +0.40 kg/week target');
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

  it('verifies appStore defaults to Alaa persona with active 12-week Master Program', () => {
    const currentUser = appStore.getCurrentUser();
    assert.strictEqual(currentUser.id, 'trainee_alaa');
    assert.strictEqual(currentUser.name, 'Alaa');

    const activeProg = appStore.getActiveProgramForTrainee('trainee_alaa');
    assert.ok(activeProg, 'Active program must exist for Alaa');
    assert.strictEqual(activeProg.title, 'The Master 16-Week Protocol (Shoulder-Priority, Posture & 480 Daily Stairs Compensated)');
    assert.strictEqual(activeProg.durationWeeks, 16);
    assert.strictEqual(activeProg.weeks.length, 16);
    assert.strictEqual(activeProg.status, 'published');

    // Verify day 1 through 4 slots
    const w1 = activeProg.weeks[0];
    const mon = w1.days[0];
    const tue = w1.days[1];
    const wed = w1.days[2];
    const thu = w1.days[3];

    // Verify 6-exercise master architecture across each of the 4 training days (24 catalogue movements total)
    assert.strictEqual(mon.blocks.flatMap((b) => b.exercises).length, 7, 'Monday must have 7 exercises');
    assert.strictEqual(mon.blocks.length, 4, 'Monday must have 4 blocks');
    assert.strictEqual(tue.blocks.flatMap((b) => b.exercises).length, 7, 'Tuesday must have 7 exercises');
    assert.strictEqual(tue.blocks.length, 3, 'Tuesday must have 3 blocks');
    assert.strictEqual(wed.blocks.flatMap((b) => b.exercises).length, 7, 'Wednesday must have 7 exercises');
    assert.strictEqual(wed.blocks.length, 3, 'Wednesday must have 3 blocks');
    assert.strictEqual(thu.blocks.flatMap((b) => b.exercises).length, 7, 'Thursday must have 7 exercises');
    assert.strictEqual(thu.blocks.length, 3, 'Thursday must have 3 blocks');

    // Thursday Left-Arm Leader Rule on 0178: cable one arm lateral raise
    const thuLeftArmEx = thu.blocks.flatMap((b) => b.exercises).find((e) => e.exerciseId === 'ex_0178');
    assert.ok(thuLeftArmEx, 'Thursday must contain 0178: cable one arm lateral raise');
    assert.ok(thuLeftArmEx.loadGuidance && thuLeftArmEx.loadGuidance.includes('LEFT-ARM LEADER RULE'));
  });

  it('verifies seed metrics track Alaa baseline starting from 51.5 kg to 51.8 kg', () => {
    assert.ok(seedMetricsAlaa.length >= 14, 'Must seed 14 days of bodyweight history');
    assert.strictEqual(seedMetricsAlaa[0].weightKg, 51.5);
    assert.strictEqual(seedMetricsAlaa[seedMetricsAlaa.length - 1].weightKg, 51.8);
  });
});
