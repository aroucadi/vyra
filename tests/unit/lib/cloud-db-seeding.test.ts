import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runSeed } from '@/db/seed/run-seed';
import { appStore } from '@/lib/store';
import {
  userAlaa,
  userAlaaPro,
  linkAlaa,
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

  it('verifies Alaa canonical account is configured with verified Gmail + dual athlete/coach role', () => {
    assert.strictEqual(userAlaa.id, 'trainee_alaa');
    assert.strictEqual(userAlaa.name, 'Alaa');
    assert.strictEqual(userAlaa.email, 'alaaeddineroucadi@gmail.com');
    assert.strictEqual(userAlaa.role, 'both');
    assert.strictEqual(userAlaa.heightCm, 172);
    assert.strictEqual(userAlaa.sex, 'male');
    assert.strictEqual(userAlaa.dob, '1989-03-15');
    assert.strictEqual(userAlaa.biometrics?.baselineWeightKg, 52.05);

    const hasUnderweightGate = userAlaa.injuries.some((inj) => inj.includes('52.05') || inj.includes('Underweight'));
    const hasLeftArmRule = userAlaa.injuries.some((inj) => inj.includes('Left-Arm') || inj.includes('0178'));
    const hasFootballManagement = userAlaa.injuries.some((inj) => inj.includes('Football') || inj.includes('19:15'));
    assert.strictEqual(hasUnderweightGate && hasLeftArmRule && hasFootballManagement, true, 'Profile must include weight floor, left-arm rule, and football deconfliction');

    const hasTargetGain = userAlaa.goals.some((g) => g.includes('+0.20 to +0.40 kg/week') || g.includes('55.5 kg'));
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

  it('verifies appStore defaults to Alaa persona with active 5-Day Nov 23 Master Program', () => {
    const currentUser = appStore.getCurrentUser();
    assert.strictEqual(currentUser.id, 'trainee_alaa');
    assert.strictEqual(currentUser.name, 'Alaa');

    const activeProg = appStore.getActiveProgramForTrainee('trainee_alaa');
    assert.ok(activeProg, 'Active program must exist for Alaa');
    assert.strictEqual(
      activeProg.title,
      'The Definitive 5-Day Custom 360° Hypertrophy, Long-Length Stretch & Posture Protocol'
    );
    assert.strictEqual(activeProg.id, 'prog_master_5day_v2');
    assert.strictEqual(activeProg.launchDate, '2026-11-23');
    assert.strictEqual(activeProg.startDate, '2026-11-23');
    assert.strictEqual(activeProg.durationWeeks, 16);
    assert.strictEqual(activeProg.weeks.length, 16);
    assert.strictEqual(activeProg.status, 'published');

    const w1 = activeProg.weeks[0];
    const mon = w1.days[0];
    const tue = w1.days[1];
    const wed = w1.days[2];
    const thu = w1.days[3];
    const fri = w1.days[4];
    const sat = w1.days[5];
    const sun = w1.days[6];

    assert.strictEqual(mon.blocks.flatMap((b) => b.exercises).length, 5, 'Monday must have 5 exercises (15 sets)');
    assert.strictEqual(mon.blocks.length, 3, 'Monday must have 3 blocks');
    assert.strictEqual(tue.blocks.flatMap((b) => b.exercises).length, 6, 'Tuesday must have 6 exercises (16 sets)');
    assert.strictEqual(tue.blocks.length, 3, 'Tuesday must have 3 blocks');
    assert.strictEqual(wed.blocks.flatMap((b) => b.exercises).length, 5, 'Wednesday must have 5 exercises (15 sets)');
    assert.strictEqual(wed.blocks.length, 2, 'Wednesday must have 2 blocks');
    assert.strictEqual(thu.blocks.flatMap((b) => b.exercises).length, 6, 'Thursday must have 6 exercises (18 sets)');
    assert.strictEqual(thu.blocks.length, 2, 'Thursday must have 2 blocks');
    assert.strictEqual(fri.isRestDay, true, 'Friday must be a Rest Day');
    assert.strictEqual(sat.blocks.flatMap((b) => b.exercises).length, 6, 'Saturday must have 6 exercises (18 sets)');
    assert.strictEqual(sat.blocks.length, 2, 'Saturday must have 2 blocks');
    assert.strictEqual(sun.isRestDay, true, 'Sunday must be a Rest Day');

    // Left-Arm Leader Rule on Monday & Saturday 0178: cable one arm lateral raise
    const monLeftArmEx = mon.blocks.flatMap((b) => b.exercises).find((e) => e.exerciseId === 'ex_0178');
    assert.ok(monLeftArmEx, 'Monday must contain 0178: cable one arm lateral raise');
    assert.ok(monLeftArmEx.loadGuidance && monLeftArmEx.loadGuidance.includes('LEFT-ARM LEADER RULE'));
  });

  it('verifies seed metrics track Alaa baseline climbing from 51.75 kg to 52.05 kg morning floor', () => {
    assert.ok(seedMetricsAlaa.length >= 14, 'Must seed 14 days of bodyweight history');
    assert.strictEqual(seedMetricsAlaa[0].weightKg, 51.75);
    assert.strictEqual(seedMetricsAlaa[seedMetricsAlaa.length - 1].weightKg, 52.05);
  });
});
