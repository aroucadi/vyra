import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMaster12WeekProgram,
  masterDailyMeals,
  mondayDailyMeals,
  standardDailyMeals,
  mondayNutrition,
  workoutDayNutrition,
  masterSupplementProtocols,
  masterHydrationGoal,
  userAlaa,
  workdayErgonomicsRoutines,
} from '@/db/seed/master-transformation-program';
import { EquipmentType } from '@/lib/types';

describe('The Master 12-Week Hypertrophy Transformation Protocol Test Suite', () => {
  const program = generateMaster12WeekProgram();
  const week1 = program.weeks[0];
  const week3 = program.weeks[2];
  const week7 = program.weeks[6];

  it('verifies program metadata and athlete profile', () => {
    assert.strictEqual(program.title, 'The Master 12-Week Hypertrophy Transformation Protocol');
    assert.strictEqual(program.durationWeeks, 12);
    assert.strictEqual(program.weeks.length, 12);
    assert.strictEqual(userAlaa.id, 'trainee_alaa');
    assert.strictEqual(userAlaa.heightCm, 173);
    assert.strictEqual(userAlaa.sex, 'male');
    assert.ok(userAlaa.injuries.some((i) => i.includes('BMI 17.3') || i.includes('Underweight')));
  });

  it('verifies 7-day schedule distribution (4 training days, 3 rest days)', () => {
    assert.strictEqual(week1.days.length, 7);
    const trainingDays = week1.days.filter((d) => !d.isRestDay);
    const restDays = week1.days.filter((d) => d.isRestDay);
    assert.strictEqual(trainingDays.length, 4, 'Must have exactly 4 training days');
    assert.strictEqual(restDays.length, 3, 'Must have exactly 3 rest days');

    assert.strictEqual(week1.days[0].label.includes('Monday'), true);
    assert.strictEqual(week1.days[1].label.includes('Tuesday'), true);
    assert.strictEqual(week1.days[2].label.includes('Wednesday'), true);
    assert.strictEqual(week1.days[3].label.includes('Thursday'), true);
    assert.strictEqual(week1.days[4].label.includes('Friday'), true);
    assert.strictEqual(week1.days[5].label.includes('Saturday'), true);
    assert.strictEqual(week1.days[6].label.includes('Sunday'), true);
  });

  it('verifies 24-Exercise openGym Catalogue Architecture (6 exercises/day across 4 training days)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    assert.strictEqual(mondayExercises.length, 6, 'Monday must have 6 exercises (2 straight + Superset A + Superset B)');
    assert.strictEqual(tuesdayExercises.length, 6, 'Tuesday must have 6 exercises (2 straight + Superset A + Superset B)');
    assert.strictEqual(wednesdayExercises.length, 6, 'Wednesday must have 6 exercises (2 straight + Superset A + Superset B)');
    assert.strictEqual(thursdayExercises.length, 6, 'Thursday must have 6 exercises (2 straight + Superset A + Superset B)');

    assert.strictEqual(week1.days[0].blocks.length, 3, 'Monday must have 3 blocks');
    assert.strictEqual(week1.days[1].blocks.length, 3, 'Tuesday must have 3 blocks');
    assert.strictEqual(week1.days[2].blocks.length, 3, 'Wednesday must have 3 blocks');
    assert.strictEqual(week1.days[3].blocks.length, 3, 'Thursday must have 3 blocks');

    const totalPrescriptions = mondayExercises.length + tuesdayExercises.length + wednesdayExercises.length + thursdayExercises.length;
    assert.strictEqual(totalPrescriptions, 24, 'Total exercise prescriptions across the 4-day split is exactly 24');
  });

  it('enforces 12-Week Periodization (Weeks 1-2 Ramp: 2 sets | Weeks 3-6: 3 sets | Week 7 Deload: 2 sets & 3-4 RIR)', () => {
    // Week 1 (Ramp): 2 sets per exercise
    const w1MonEx1 = week1.days[0].blocks[0].exercises[0];
    assert.strictEqual(w1MonEx1.sets, 2, 'Week 1 must prescribe 2 working sets (Acclimation Ramp)');

    // Week 3 (Accumulation): 3 sets per exercise
    const w3MonEx1 = week3.days[0].blocks[0].exercises[0];
    assert.strictEqual(w3MonEx1.sets, 3, 'Week 3 must prescribe 3 working sets (Accumulation Block 1)');

    // Week 7 (Deload): 2 sets per exercise with higher RIR buffer (3-4 RIR)
    const w7MonEx1 = week7.days[0].blocks[0].exercises[0];
    assert.strictEqual(w7MonEx1.sets, 2, 'Week 7 must drop to 2 working sets for deload');
    assert.ok(w7MonEx1.rirScheme.includes(3) || w7MonEx1.rirScheme.includes(4), 'Week 7 deload must program 3-4 RIR');
  });

  it('enforces Football Deconfliction & Zero Leg Loading on Monday and Tuesday', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);

    const lowerMuscles = ['Glutes', 'Hamstrings', 'Quadriceps', 'Quads', 'Calves'];

    mondayExercises.forEach((ex) => {
      const hasLower = ex.targetMuscleGroups.some((m) =>
        lowerMuscles.some((l) => m.toLowerCase().includes(l.toLowerCase()))
      );
      assert.strictEqual(hasLower, false, `Monday exercise ${ex.exerciseName} must not load lower body (match day)`);
    });

    tuesdayExercises.forEach((ex) => {
      const hasLower = ex.targetMuscleGroups.some((m) =>
        lowerMuscles.some((l) => m.toLowerCase().includes(l.toLowerCase()))
      );
      assert.strictEqual(hasLower, false, `Tuesday exercise ${ex.exerciseName} must not load lower body (100% rest post-match)`);
    });

    assert.strictEqual(tuesdayExercises[0].exerciseName.includes('cable pulldown'), true);
    assert.strictEqual(tuesdayExercises[1].exerciseName.includes('lever seated row'), true);
  });

  it('enforces Left-Arm Leader Rule on Thursday cable one arm lateral raise (0178)', () => {
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const latRaise = thursdayExercises.find((e) => e.exerciseId === 'ex_0178');
    assert.ok(latRaise, 'Thursday must include 0178: cable one arm lateral raise');
    assert.ok(latRaise.loadGuidance && latRaise.loadGuidance.includes('LEFT-ARM LEADER RULE'));
    assert.ok(latRaise.formCueText && latRaise.formCueText.includes('Left Arm First'));
  });

  it('verifies 4-modality equipment matrix completeness for all 24 exercise slots (96 variations total)', () => {
    const allExercises = week1.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercises.length, 24, 'Must have exactly 24 total exercise prescriptions');

    const requiredEquipments: EquipmentType[] = ['machine', 'dumbbell', 'cable', 'bodyweight'];

    allExercises.forEach((ex) => {
      assert.ok(ex.equipmentVariations, `Exercise ${ex.exerciseName} must have equipment variations`);
      assert.strictEqual(ex.equipmentVariations.length, 4, `Exercise ${ex.exerciseName} must have 4 equipment variations`);

      const availableTypes = ex.equipmentVariations.map((v) => v.equipmentType);
      requiredEquipments.forEach((reqType) => {
        assert.ok(availableTypes.includes(reqType), `Exercise ${ex.exerciseName} missing variation: ${reqType}`);
      });

      ex.equipmentVariations.forEach((v) => {
        assert.ok(v.exerciseName && v.exerciseName.length > 0, 'Variation must have exerciseName');
        assert.ok(v.formCue && v.formCue.length > 0, 'Variation must have formCue');
        assert.ok(v.videoUrl && v.videoUrl.startsWith('https://'), 'Variation must have valid videoUrl');
      });
    });
  });

  it('verifies Embedded Gym Warm-Up Routine is assigned to all training days', () => {
    week1.days.forEach((d) => {
      assert.ok(d.morningRoutine && d.morningRoutine.length >= 2, `Day ${d.label} must have warm-up or weekend anchors`);
    });
  });

  it('verifies Workday Ergonomics & Biofeedback Anchors', () => {
    assert.strictEqual(workdayErgonomicsRoutines.length, 4, 'Must have 4 workday ergonomics protocols');
    const ergoStr = workdayErgonomicsRoutines.join(' ');
    assert.ok(ergoStr.includes('Car Mirror'), 'Must include Car Mirror biofeedback anchor');
    assert.ok(ergoStr.includes('Stand & Squeeze'), 'Must include Hourly Stand & Squeeze');
    assert.ok(ergoStr.includes('Post-Lunch Walk'), 'Must include Post-Lunch Walk');
    assert.ok(ergoStr.includes('Desk-Drawer Fuel'), 'Must include Desk-Drawer Fuel Protocol');
  });

  it('verifies Monday match-day caloric compensation (3,000 kcal / 160g+ P) and standard training days (2,600 kcal / 139g P)', () => {
    // Monday (Match Day)
    const monNutrition = week1.days[0].nutrition;
    assert.strictEqual(monNutrition.targetKcal, 3000, 'Monday must target 3000 kcal for match day compensation');
    assert.strictEqual(monNutrition.targetProteinGrams, 160, 'Monday must target 160g protein');
    const monTimes = monNutrition.dailyMeals?.map((m) => m.time) || [];
    ['08:00', '10:30', '11:45', '13:35', '16:30', '19:15', '20:30', '21:30', '23:30'].forEach((time) => {
      assert.ok(monTimes.includes(time), `Monday schedule must include milestone at ${time}`);
    });

    // Tuesday (Standard Training Day)
    const tueNutrition = week1.days[1].nutrition;
    assert.strictEqual(tueNutrition.targetKcal, 2600, 'Tuesday must target 2600 kcal');
    assert.strictEqual(tueNutrition.targetProteinGrams, 139, 'Tuesday must target 139g protein');
    const tueTimes = tueNutrition.dailyMeals?.map((m) => m.time) || [];
    ['08:00', '10:30', '11:45', '13:35', '16:30', '21:30', '23:30'].forEach((time) => {
      assert.ok(tueTimes.includes(time), `Standard day schedule must include milestone at ${time}`);
    });
  });

  it('verifies Creatine Monohydrate & Dinner Stack protocols (5g daily, zero BIA water inflation)', () => {
    const creatineProtocol = masterSupplementProtocols.find((p) => p.name.includes('Creatine'));
    assert.ok(creatineProtocol, 'Creatine protocol must exist');

    const maintenancePhase = creatineProtocol.phases[0];
    assert.ok(maintenancePhase, 'Maintenance phase must exist');
    assert.strictEqual(maintenancePhase.startDay, 1);
    assert.strictEqual(maintenancePhase.endDay, 84);
    assert.strictEqual(maintenancePhase.doses[0].amount, 5.0);

    const dinnerProtocol = masterSupplementProtocols.find((p) => p.name.includes('Dinner'));
    assert.ok(dinnerProtocol, 'Unified Dinner Stack must exist');
    const doses = dinnerProtocol.phases[0].doses;
    assert.strictEqual(doses.length, 3, 'Dinner stack must contain 3 doses (D3, Omega-3, Magnesium)');
    assert.strictEqual(doses[0].amount, 2000, 'D3 must be 2,000 IU');
    assert.strictEqual(doses[1].amount, 1250, 'Omega-3 must be 1,250 mg');
    assert.strictEqual(doses[2].amount, 300, 'Magnesium Bisglycinate must be 300 mg');
  });

  it('verifies hydration architecture (3500ml base + 500ml workout bonus)', () => {
    assert.strictEqual(masterHydrationGoal.dailyTargetMl, 3500);
    assert.strictEqual(masterHydrationGoal.workoutDayBonusMl, 500);
  });
});
