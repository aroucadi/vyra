import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMaster16WeekProgram,
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

describe('The Master Hypertrophy & Postural Architecture Protocol Test Suite', () => {
  const program = generateMaster16WeekProgram();
  const week1 = program.weeks[0];

  it('verifies program metadata and athlete profile', () => {
    assert.strictEqual(program.title, 'The Master Hypertrophy & Postural Architecture Protocol');
    assert.strictEqual(program.durationWeeks, 16);
    assert.strictEqual(program.weeks.length, 16);
    assert.strictEqual(userAlaa.id, 'trainee_alaa');
    assert.strictEqual(userAlaa.heightCm, 173);
    assert.strictEqual(userAlaa.sex, 'male');
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

  it('verifies strictly 12 workout slots across the 4 training days (3-slot ceiling per day)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    assert.strictEqual(mondayExercises.length, 3, 'Monday must have exactly 3 exercise slots');
    assert.strictEqual(tuesdayExercises.length, 3, 'Tuesday must have exactly 3 exercise slots');
    assert.strictEqual(wednesdayExercises.length, 3, 'Wednesday must have exactly 3 exercise slots');
    assert.strictEqual(thursdayExercises.length, 3, 'Thursday must have exactly 3 exercise slots');

    const totalSlots = mondayExercises.length + tuesdayExercises.length + wednesdayExercises.length + thursdayExercises.length;
    assert.strictEqual(totalSlots, 12, 'Total workout slots across the 4-day split must be strictly 12 (3-slot ceiling)');
  });

  it('enforces the Biomechanical 2:1 Pull-to-Push Volume Balance (6 pressing vs 9 dynamic pulling + 3 isometric hinge sets = 12 total posture sets)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    // Pressing volume: Mon Slot 1 (Incline Chest: 3 sets) + Thu Slot 3 (Shoulder Press: 3 sets) = 6 sets
    const mondayChestPress = mondayExercises[0];
    const thursdayShoulderPress = thursdayExercises[2];
    const totalPressingSets = mondayChestPress.sets + thursdayShoulderPress.sets;
    assert.strictEqual(totalPressingSets, 6, 'Upper pressing volume must be capped at strictly 6 sets per week');

    // Direct Upper Dynamic Pulling (9 sets):
    // Tue Slot 1 (Neutral Lat Pulldown: 3 sets)
    // Tue Slot 2 (Chest-Supported Row: 3 sets)
    // Wed Slot 2 (Posture Face Pull / Y-Raise: 3 sets)
    const tuesdayLatPulldown = tuesdayExercises[0];
    const tuesdayRow = tuesdayExercises[1];
    const wednesdayFacePull = wednesdayExercises[1];
    assert.ok(wednesdayFacePull.exerciseName.includes('Face Pull') || wednesdayFacePull.exerciseName.includes('Reverse Pec Deck'));
    const dynamicPullingSets = tuesdayLatPulldown.sets + tuesdayRow.sets + wednesdayFacePull.sets;
    assert.strictEqual(dynamicPullingSets, 9, 'Dynamic upper pulling volume must equal strictly 9 sets per week');

    // Isometric Upper Back Loading (3 sets):
    // Thu Slot 1 (Dumbbell RDL / Isometric Scapular Retraction: 3 sets)
    const thursdayRDL = thursdayExercises[0];
    const isometricUpperBackSets = thursdayRDL.sets;
    assert.strictEqual(isometricUpperBackSets, 3, 'Thursday RDL must contribute 3 sets of isometric scapular retraction');

    const totalPostureSets = dynamicPullingSets + isometricUpperBackSets;
    assert.strictEqual(totalPostureSets, 12, 'Total posture pulling volume must equal strictly 12 sets per week');

    const dynamicRatio = dynamicPullingSets / totalPressingSets;
    assert.strictEqual(dynamicRatio, 1.5, 'Dynamic pull-to-push ratio must equal exactly 1.5:1 (9 pulling vs 6 pressing sets)');

    const totalPostureToPressRatio = totalPostureSets / totalPressingSets;
    assert.strictEqual(totalPostureToPressRatio, 2.0, 'Total posture-to-press volume ratio must equal exactly 2:1 (12 posture sets vs 6 pressing sets)');
  });

  it('enforces the 3x/Week Side Delt Matrix (9 Total Sets)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    const monSideDelt = mondayExercises[2]; // Slot 3 (Hit 1)
    const wedSideDelt = wednesdayExercises[2]; // Slot 3 (Hit 2)
    const thuSideDelt = thursdayExercises[2]; // Slot 3 (Hit 3 post-press burnout drop set)

    assert.strictEqual(monSideDelt.sets, 3, 'Monday Slot 3 must have 3 sets');
    assert.strictEqual(wedSideDelt.sets, 3, 'Wednesday Slot 3 must have 3 sets');
    assert.strictEqual(thuSideDelt.sets, 3, 'Thursday Slot 3 must have 3 sets (with Set 3 drop set)');

    const totalSideDeltSets = monSideDelt.sets + wedSideDelt.sets + thuSideDelt.sets;
    assert.strictEqual(totalSideDeltSets, 9, 'Side delts must be hit for 9 total sets across 3 weekly sessions');
  });

  it('enforces Thursday Slot 3 Drop Set configuration', () => {
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const thuSideDelt = thursdayExercises[2];

    assert.strictEqual(thuSideDelt.hasDropSet, true, 'Thursday Slot 3 must have hasDropSet flag');
    assert.ok(thuSideDelt.dropSetGuidance && thuSideDelt.dropSetGuidance.includes('3–4 kg'), 'Drop set guidance must specify light dumbbells');
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

    assert.strictEqual(tuesdayExercises[0].exerciseName.includes('Lat Pulldown'), true);
    assert.strictEqual(tuesdayExercises[1].exerciseName.includes('Row'), true);
    assert.strictEqual(tuesdayExercises[2].exerciseName.includes('Hammer Curl'), true);
  });

  it('enforces Thursday Primary Overload Rule and Stall Rule on RDL', () => {
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const rdl = thursdayExercises[0]; // Slot 1: RDL
    assert.strictEqual(rdl.exerciseName.includes('Romanian Deadlift'), true);
    assert.ok(rdl.loadGuidance?.includes('Thursday Primary Overload Rule'), 'RDL must include Thursday Primary Overload Rule');
    assert.ok(rdl.loadGuidance?.includes('Stall Rule'), 'RDL must include 10% Stall Rule');
  });

  it('verifies 4-modality equipment matrix completeness for all 12 slots (48 variations total)', () => {
    const allExercises = week1.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercises.length, 12, 'Must have exactly 12 total exercise slots');

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

  it('verifies Embedded Gym Warm-Up & Alignment Routine is assigned to all training days', () => {
    week1.days.forEach((d) => {
      assert.ok(d.morningRoutine && d.morningRoutine.length >= 2, `Day ${d.label} must have mobility drills or weekend anchors`);
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

  it('verifies Monday match-day caloric compensation (~3,150 kcal / ~155g P) and standard training days (~2,750 kcal / ~125g P)', () => {
    // Monday (Match Day)
    const monNutrition = week1.days[0].nutrition;
    assert.strictEqual(monNutrition.targetKcal, 3150, 'Monday must target 3150 kcal for match day compensation');
    assert.strictEqual(monNutrition.targetProteinGrams, 155, 'Monday must target 155g protein');
    const monTimes = monNutrition.dailyMeals?.map((m) => m.time) || [];
    ['07:30', '08:00', '10:30', '11:50', '12:15', '13:30', '16:00', '18:15', '19:00', '20:15', '21:30', '23:30'].forEach((time) => {
      assert.ok(monTimes.includes(time), `Monday schedule must include milestone at ${time}`);
    });

    // Tuesday (Standard Training Day)
    const tueNutrition = week1.days[1].nutrition;
    assert.strictEqual(tueNutrition.targetKcal, 2750, 'Tuesday must target 2750 kcal');
    assert.strictEqual(tueNutrition.targetProteinGrams, 125, 'Tuesday must target 125g protein');
    const tueTimes = tueNutrition.dailyMeals?.map((m) => m.time) || [];
    ['07:30', '08:00', '10:30', '11:50', '12:15', '13:30', '16:00', '21:30', '23:30'].forEach((time) => {
      assert.ok(tueTimes.includes(time), `Standard day schedule must include milestone at ${time}`);
    });
  });

  it('verifies Creatine Saturation loading & maintenance protocols', () => {
    const creatineProtocol = masterSupplementProtocols.find((p) => p.name.includes('Creatine'));
    assert.ok(creatineProtocol, 'Creatine protocol must exist');

    const loadingPhase = creatineProtocol.phases.find((ph) => ph.name.includes('Loading'));
    const maintenancePhase = creatineProtocol.phases.find((ph) => ph.name.includes('Maintenance'));

    assert.ok(loadingPhase, 'Loading phase must exist');
    assert.strictEqual(loadingPhase.startDay, 1);
    assert.strictEqual(loadingPhase.endDay, 5);
    assert.strictEqual(loadingPhase.doses.length, 3, 'Loading phase must have 3 doses daily');
    const loadingTotalGrams = loadingPhase.doses.reduce((acc, d) => acc + d.amount, 0);
    assert.strictEqual(Math.round(loadingTotalGrams * 10) / 10, 20.7, 'Loading phase must total 20.7g/day (3 x 6.9g)');

    assert.ok(maintenancePhase, 'Maintenance phase must exist');
    assert.strictEqual(maintenancePhase.startDay, 6);
    assert.strictEqual(maintenancePhase.doses.length, 1);
    assert.ok(maintenancePhase.doses[0].amount >= 3 && maintenancePhase.doses[0].amount <= 5);
  });

  it('verifies Hydration Architecture targets', () => {
    assert.strictEqual(masterHydrationGoal.dailyTargetMl, 3500);
    assert.strictEqual(masterHydrationGoal.workoutDayBonusMl, 500);
  });

  it('verifies safe video URLs and form cues for all 12 exercise slots and 48 variations', () => {
    const trainingDays = week1.days.filter((d) => d.blocks && d.blocks.length > 0);
    assert.strictEqual(trainingDays.length, 4, 'Must have 4 active training days with blocks');

    let totalExercisesChecked = 0;
    let totalVariationsChecked = 0;

    trainingDays.forEach((day) => {
      day.blocks.forEach((block) => {
        block.exercises.forEach((ex) => {
          totalExercisesChecked++;
          assert.ok(ex.videoUrl, `Exercise ${ex.exerciseName} must have a videoUrl`);
          assert.ok(ex.videoUrl.startsWith('http'), `Exercise ${ex.exerciseName} videoUrl must be http/https`);
          assert.ok(ex.formCueText, `Exercise ${ex.exerciseName} must have formCueText`);
          assert.ok(ex.equipmentVariations && ex.equipmentVariations.length === 4, `Exercise ${ex.exerciseName} must have 4 variations`);

          ex.equipmentVariations.forEach((v) => {
            totalVariationsChecked++;
            assert.ok(v.videoUrl, `Variation ${v.exerciseName} must have videoUrl`);
            assert.ok(v.videoUrl.startsWith('http'), `Variation ${v.exerciseName} videoUrl must be http/https`);
            assert.ok(v.formCue, `Variation ${v.exerciseName} must have formCue`);
          });
        });
      });
    });

    assert.strictEqual(totalExercisesChecked, 12);
    assert.strictEqual(totalVariationsChecked, 48);
  });

  it('verifies rest day fallback seamlessly defaults to Day 0 (Monday) training routine', () => {
    const fridayRestDay = week1.days[4];
    assert.strictEqual(fridayRestDay.isRestDay, true);
    assert.strictEqual(fridayRestDay.blocks.length, 0);

    const trainingDays = week1.days.filter((d) => d.blocks && d.blocks.length > 0);
    const defaultTestDay = trainingDays[0];
    assert.ok(defaultTestDay);
    assert.strictEqual(defaultTestDay.dayOfWeek, 0);
    assert.strictEqual(defaultTestDay.blocks.length > 0, true);
  });
});
