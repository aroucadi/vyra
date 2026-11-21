import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMaster16WeekProgram,
  mondayNutrition,
  workoutDayNutrition,
  masterSupplementProtocols,
  dailyNutritionAndSupplementProtocol,
  userAlaa,
  workdayErgonomicsRoutines,
} from '@/db/seed/master-transformation-program';
import { EquipmentType } from '@/lib/types';

describe('The Definitive 5-Day Custom 360° Hypertrophy Protocol Test Suite (Launch: 2026-11-23)', () => {
  const program = generateMaster16WeekProgram();
  const week1 = program.weeks[0];
  const week3 = program.weeks[2];
  const week7 = program.weeks[6];

  it('verifies program metadata, Nov 23 launch date, and athlete profile', () => {
    assert.strictEqual(
      program.title,
      'The Definitive 5-Day Custom 360° Hypertrophy, Long-Length Stretch & Posture Protocol'
    );
    assert.strictEqual(program.id, 'prog_master_5day_v2');
    assert.strictEqual(program.launchDate, '2026-11-23');
    assert.strictEqual(program.startDate, '2026-11-23');
    assert.strictEqual(program.durationWeeks, 16);
    assert.strictEqual(program.weeks.length, 16);
    assert.strictEqual(userAlaa.id, 'trainee_alaa');
    assert.strictEqual(userAlaa.heightCm, 172);
    assert.strictEqual(userAlaa.sex, 'male');
    assert.strictEqual(userAlaa.biometrics?.baselineWeightKg, 52.05);
    assert.ok(userAlaa.injuries.some((i) => i.includes('52.05') || i.includes('Underweight')));
  });

  it('verifies 7-day schedule distribution (5 training days Mon-Thu + Sat, 2 rest days Fri + Sun)', () => {
    assert.strictEqual(week1.days.length, 7);
    const trainingDays = week1.days.filter((d) => !d.isRestDay);
    const restDays = week1.days.filter((d) => d.isRestDay);
    assert.strictEqual(trainingDays.length, 5, 'Must have exactly 5 training days');
    assert.strictEqual(restDays.length, 2, 'Must have exactly 2 rest days (Friday and Sunday)');

    assert.strictEqual(week1.days[0].label.includes('Monday'), true);
    assert.strictEqual(week1.days[1].label.includes('Tuesday'), true);
    assert.strictEqual(week1.days[2].label.includes('Wednesday'), true);
    assert.strictEqual(week1.days[3].label.includes('Thursday'), true);
    assert.strictEqual(week1.days[4].label.includes('Friday'), true);
    assert.strictEqual(week1.days[4].isRestDay, true);
    assert.strictEqual(week1.days[5].label.includes('Saturday'), true);
    assert.strictEqual(week1.days[6].label.includes('Sunday'), true);
    assert.strictEqual(week1.days[6].isRestDay, true);
  });

  it('verifies 28-Slot 5-Day Split & 82 Working Sets per Week', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const saturdayExercises = week1.days[5].blocks.flatMap((b) => b.exercises);

    assert.strictEqual(mondayExercises.length, 5, 'Monday must have 5 exercises (15 sets)');
    assert.strictEqual(tuesdayExercises.length, 6, 'Tuesday must have 6 exercises (16 sets)');
    assert.strictEqual(wednesdayExercises.length, 5, 'Wednesday must have 5 exercises (15 sets)');
    assert.strictEqual(thursdayExercises.length, 6, 'Thursday must have 6 exercises (18 sets)');
    assert.strictEqual(saturdayExercises.length, 6, 'Saturday must have 6 exercises (18 sets)');

    const allWeek1 = [
      ...mondayExercises,
      ...tuesdayExercises,
      ...wednesdayExercises,
      ...thursdayExercises,
      ...saturdayExercises,
    ];
    assert.strictEqual(allWeek1.length, 28, 'Total exercise prescriptions across the 5-day split is exactly 28');
    const totalWeeklySets = allWeek1.reduce((acc, ex) => acc + ex.sets, 0);
    assert.strictEqual(totalWeeklySets, 82, 'Total weekly working sets in standard week is 82 (15+16+15+18+18)');

    // Verify clinical/biomechanical swaps and permanent removals
    assert.ok(!allWeek1.some((e) => e.exerciseId === 'ex_0584'), 'lever lateral raise (ex_0584) must be permanently removed');
    assert.ok(!allWeek1.some((e) => e.exerciseId === 'ex_0595'), 'lever seated crunch (ex_0595) must be replaced on Saturday');
    assert.ok(wednesdayExercises.some((e) => e.exerciseId === 'ex_0597'), 'Wednesday must include Seated Hip Abduction (0597)');
    assert.ok(thursdayExercises.some((e) => e.exerciseId === 'ex_1409'), 'Thursday must include Glute Bridge Machine (1409)');
    assert.ok(thursdayExercises.some((e) => e.exerciseId === 'ex_0596'), 'Thursday must include Lever Seated Fly (0596)');
    assert.ok(thursdayExercises.some((e) => e.exerciseId === 'ex_0155'), 'Thursday must include Cable Curl (0155)');
    assert.ok(thursdayExercises.some((e) => e.exerciseId === 'ex_0194'), 'Thursday must include Cable Overhead Triceps Extension (0194)');
    assert.ok(saturdayExercises.some((e) => e.exerciseId === 'ex_0175'), 'Saturday must include Cable Kneeling Crunch (0175)');
    assert.ok(saturdayExercises.some((e) => e.exerciseId === 'ex_0605'), 'Saturday must include fresh Lever Shoulder Press (0605)');
  });

  it('enforces 3-Set Baseline Launch (82 sets/wk) and Week 7/12/16 Deload (2 sets & 3-4 RIR)', () => {
    const w1MonEx1 = week1.days[0].blocks[0].exercises[0];
    assert.strictEqual(w1MonEx1.sets, 3, 'Week 1 launches straight into 3 working sets on main lifts');
    assert.strictEqual(w1MonEx1.targetWeightKg, 40, 'Monday lever chest press targets 40 kg');

    const w1MonIncline = week1.days[0].blocks[0].exercises[1];
    assert.strictEqual(w1MonIncline.exerciseId, 'ex_0579');
    assert.strictEqual(w1MonIncline.targetWeightKg, 20, 'Monday lever incline chest press stays flat at 20 kg');

    const w3MonEx1 = week3.days[0].blocks[0].exercises[0];
    assert.strictEqual(w3MonEx1.sets, 3, 'Week 3 maintains 3 working sets');

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
      assert.strictEqual(hasLower, false, `Monday exercise ${ex.exerciseName} must not load lower body (19:15 match day)`);
    });

    tuesdayExercises.forEach((ex) => {
      const hasLower = ex.targetMuscleGroups.some((m) =>
        lowerMuscles.some((l) => m.toLowerCase().includes(l.toLowerCase()))
      );
      assert.strictEqual(hasLower, false, `Tuesday exercise ${ex.exerciseName} must not load lower body (post-match seated pulls)`);
    });

    assert.strictEqual(tuesdayExercises[0].exerciseName.includes('cable pulldown'), true);
    assert.strictEqual(tuesdayExercises[1].exerciseName.includes('lever seated row'), true);
  });

  it('enforces Left-Arm Leader Rule on Monday & Saturday cable one arm lateral raise (0178) @ 5kg', () => {
    const monLatRaise = week1.days[0].blocks.flatMap((b) => b.exercises).find((e) => e.exerciseId === 'ex_0178');
    const satLatRaise = week1.days[5].blocks.flatMap((b) => b.exercises).find((e) => e.exerciseId === 'ex_0178');

    assert.ok(monLatRaise, 'Monday must include 0178: cable one arm lateral raise');
    assert.strictEqual(monLatRaise.targetWeightKg, 5);
    assert.ok(monLatRaise.loadGuidance?.includes('LEFT-ARM LEADER RULE'));
    assert.ok(monLatRaise.formCueText?.includes('Left Arm First'));

    assert.ok(satLatRaise, 'Saturday must include 0178: cable one arm lateral raise');
    assert.strictEqual(satLatRaise.targetWeightKg, 5);
    assert.ok(satLatRaise.formCueText?.includes('Left Arm First'));
  });

  it('verifies 4-modality equipment matrix completeness for all 28 exercise slots (112 variations total)', () => {
    const allExercises = week1.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercises.length, 28, 'Must have exactly 28 total exercise prescriptions');

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

  it('verifies Morning Alignment Drills & Workday Ergonomics Anchors', () => {
    week1.days.forEach((d) => {
      assert.ok(d.morningRoutine && d.morningRoutine.length >= 2, `Day ${d.label} must have morning alignment routine`);
    });

    assert.strictEqual(workdayErgonomicsRoutines.length, 4, 'Must have 4 workday ergonomics protocols');
    const ergoStr = workdayErgonomicsRoutines.join(' ');
    assert.ok(ergoStr.includes('Car Mirror'), 'Must include Car Mirror biofeedback anchor');
    assert.ok(ergoStr.includes('Stand & Squeeze'), 'Must include Hourly Stand & Squeeze');
    assert.ok(ergoStr.includes('Post-Lunch Walk'), 'Must include Post-Lunch Walk');
    assert.ok(ergoStr.includes('Desk-Drawer Fuel'), 'Must include Desk-Drawer Fuel Protocol');
  });

  it('verifies 2,710 kcal Mass Floor & Daily Nutrition/Supplement Timing (07:30-22:30)', () => {
    assert.strictEqual(dailyNutritionAndSupplementProtocol.targetCalories, 2710);
    assert.strictEqual(dailyNutritionAndSupplementProtocol.macros.proteinG, 173.6);
    assert.strictEqual(dailyNutritionAndSupplementProtocol.macros.carbsG, 317.4);
    assert.strictEqual(dailyNutritionAndSupplementProtocol.macros.fatsG, 72.2);
    assert.strictEqual(dailyNutritionAndSupplementProtocol.creatineDailyFromGainerG, 2.82);

    assert.strictEqual(mondayNutrition.targetKcal, 2710);
    assert.strictEqual(workoutDayNutrition.targetKcal, 2710);
    assert.strictEqual(mondayNutrition.targetProteinGrams, 174);

    const glutProtocol = masterSupplementProtocols.find((p) => p.name.includes('L-Glutamine'));
    assert.ok(glutProtocol);
    assert.strictEqual(glutProtocol.phases[0].doses[0].amount, 5.0);
    assert.strictEqual(glutProtocol.phases[0].doses[0].targetTime, '07:30');

    const jumboCreatine = masterSupplementProtocols.find((p) => p.name.includes('Jumbo'));
    assert.ok(jumboCreatine);
    assert.strictEqual(jumboCreatine.phases[0].doses[1].amount, 2.82);

    const lunchStack = masterSupplementProtocols.find((p) => p.name.includes('13:00'));
    assert.ok(lunchStack);
    assert.strictEqual(lunchStack.phases[0].doses.length, 3);

    const sleepStack = masterSupplementProtocols.find((p) => p.name.includes('22:30'));
    assert.ok(sleepStack);
    assert.strictEqual(sleepStack.phases[0].doses[0].targetTime, '22:30');
  });

  it('verifies v2.1.0 baselineMetrics, corrected labRecordedAge (37), and equipmentNotes', () => {
    // 1. baselineMetrics
    assert.ok(userAlaa.baselineMetrics, 'Alaa profile must have baselineMetrics');
    assert.strictEqual(userAlaa.baselineMetrics.weightFloorKg, 52.05);
    assert.strictEqual(userAlaa.baselineMetrics.fedBaselineWeightKg, 52.45);
    assert.strictEqual(userAlaa.baselineMetrics.heightM, 1.72);
    assert.strictEqual(userAlaa.baselineMetrics.ageYears, 37);
    assert.strictEqual(userAlaa.baselineMetrics.tdeeFormulaKcal, 2006);
    assert.strictEqual(userAlaa.baselineMetrics.tdeeStairAdjustedKcal, 2180);
    assert.strictEqual(userAlaa.baselineMetrics.dailyTargetKcal, 2710);
    assert.strictEqual(userAlaa.baselineMetrics.dailyMacrosTarget.proteinG, 173.6);
    assert.strictEqual(userAlaa.baselineMetrics.dailyMacrosTarget.carbsG, 317.4);
    assert.strictEqual(userAlaa.baselineMetrics.dailyMacrosTarget.fatG, 72.2);
    assert.strictEqual(userAlaa.baselineMetrics.dailyMacrosTarget.creatineElementalG, 2.82);

    // 2. healthProfile.labRecordedAge corrected to 37
    assert.ok(userAlaa.healthProfile, 'Alaa profile must have healthProfile');
    assert.strictEqual(userAlaa.healthProfile.labRecordedAge, 37);

    // 3. Punch gymLocation equipmentNotes
    assert.ok(userAlaa.gymLocations, 'Alaa profile must have gymLocations');
    const punch = userAlaa.gymLocations.find((g) => g.id === 'gym_punch_lissasfa');
    assert.ok(punch, 'Punch gym location must exist');
    assert.ok(punch.equipmentNotes, 'Punch gym must have equipmentNotes');
    assert.strictEqual(punch.equipmentNotes.length, 3);
    assert.ok(punch.equipmentNotes[0].includes('2:1 dual-pulley stack'));
    assert.ok(punch.equipmentNotes[1].includes('Hip Thrust / Glute Bridge Machine'));
    assert.ok(punch.equipmentNotes[2].includes('No seated ab crunch machine exists at Punch'));
  });

  it('verifies 5 Canonical Universal Blind Execution Rules and updated Schedule Overview', () => {
    // 1. Blind Execution Rules
    assert.ok(program.blindExecutionRules, 'Program must have blindExecutionRules');
    assert.strictEqual(program.blindExecutionRules.length, 5);
    assert.ok(program.blindExecutionRules[0].startsWith('RULE 1 (FLAT WORKING LOADS — NO EGO PYRAMIDS)'));
    assert.ok(program.blindExecutionRules[1].startsWith('RULE 2 (LONG-LENGTH STRETCH PAUSE)'));
    assert.ok(program.blindExecutionRules[2].startsWith('RULE 3 (SHOULDER SAFETY GUARDRAIL)'));
    assert.ok(program.blindExecutionRules[3].startsWith('RULE 4 (ANTI-APT PELVIC & RIB LOCK)'));
    assert.ok(program.blindExecutionRules[4].startsWith('RULE 5 (WEEKDAY 4A/4B & 5A/5B CLOCK LOCK)'));

    // 2. Schedule Overview
    assert.ok(program.scheduleOverview, 'Program must have scheduleOverview');
    assert.strictEqual(
      program.scheduleOverview.mondayToThursdayWindow,
      '12:05–12:42 (5 min Warm-Up + 32 min Lifting = 37 min flat)'
    );
    assert.strictEqual(
      program.scheduleOverview.friday,
      'Rest / Active Recovery (Daily Office Stairs)'
    );
    assert.strictEqual(
      program.scheduleOverview.saturdayWindow,
      'Morning Unrushed (~5 min Warm-Up + 40–45 min Lifting before 15:00 Hammam)'
    );
    assert.strictEqual(
      program.scheduleOverview.sunday,
      'Full Rest & Meal Prep (2-Cup Avocado-Milk-Casein Batch)'
    );
  });

  it('verifies 28 progression rules, setup cues, long-length stretch cues, and set prescriptions across standard and deload weeks', () => {
    const allExercisesW1 = week1.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercisesW1.length, 28);

    // Every exercise has progressionRule, setupCues, executionAndStretchCues, and setPrescriptions
    allExercisesW1.forEach((ex) => {
      assert.ok(ex.progressionRule && ex.progressionRule.length > 5, `Exercise ${ex.exerciseName} missing progressionRule`);
      assert.ok(ex.setupCues && ex.setupCues.length >= 1, `Exercise ${ex.exerciseName} missing setupCues`);
      assert.ok(
        ex.executionAndStretchCues && ex.executionAndStretchCues.length >= 1,
        `Exercise ${ex.exerciseName} missing executionAndStretchCues`
      );
      assert.ok(
        ex.setPrescriptions && ex.setPrescriptions.length === ex.sets,
        `Exercise ${ex.exerciseName} in week 1 must have set prescriptions matching sets (${ex.sets})`
      );
    });

    const totalExecCues = allExercisesW1.reduce((acc, ex) => acc + (ex.executionAndStretchCues?.length || 0), 0);
    assert.strictEqual(totalExecCues, 50, 'Must have exactly 50 execution and stretch cues across all 28 exercises');

    const totalSetupCues = allExercisesW1.reduce((acc, ex) => acc + (ex.setupCues?.length || 0), 0);
    assert.strictEqual(totalSetupCues, 44, 'Must have exactly 44 setup cues across all 28 exercises');

    // Deload week (week 7) check
    const allExercisesW7 = week7.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercisesW7.length, 28);
    allExercisesW7.forEach((ex) => {
      assert.strictEqual(
        ex.setPrescriptions?.length,
        ex.sets,
        `Exercise ${ex.exerciseName} in week 7 (deload) must have set prescriptions matching sets (${ex.sets})`
      );
      assert.ok(
        ex.setPrescriptions?.every((s) => s.targetRir >= 3),
        `Exercise ${ex.exerciseName} in week 7 must prescribe >= 3 RIR for deload`
      );
    });
  });
});
