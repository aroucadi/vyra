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

  it('verifies functional workout slots per day across the 4 training days (5-Exercise Master Architecture)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    assert.strictEqual(mondayExercises.length, 5, 'Monday must have 5 exercises in Upper Body A');
    assert.strictEqual(tuesdayExercises.length, 5, 'Tuesday must have 5 exercises in Upper Body B');
    assert.strictEqual(wednesdayExercises.length, 5, 'Wednesday must have 5 exercises across 2 blocks (3 straight + 1 superset)');
    assert.strictEqual(week1.days[2].blocks.length, 2, 'Wednesday must have 2 blocks (straight + superset)');
    assert.strictEqual(thursdayExercises.length, 6, 'Thursday must have 6 exercises (3 straight + 1 superset + 1 finisher carry)');

    const totalPrescriptions = mondayExercises.length + tuesdayExercises.length + wednesdayExercises.length + thursdayExercises.length;
    assert.strictEqual(totalPrescriptions, 21, 'Total exercise prescriptions across the 4-day split is 21');
  });

  it('enforces the Biomechanical 2:1 Pull-to-Push Volume Balance (9 pressing vs 18 dynamic pulling sets = Strict 2.0 : 1 Ratio)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    // Pressing volume: Mon Slot 1 (Incline DB Press: 3 sets) + Mon Slot 2 (Chest Press: 3 sets) + Thu Slot 3 (Shoulder Press: 3 sets) = 9 sets
    const mondayInclinePress = mondayExercises[0];
    const mondayChestPress = mondayExercises[1];
    const thursdayShoulderPress = thursdayExercises[2];
    const totalPressingSets = mondayInclinePress.sets + mondayChestPress.sets + thursdayShoulderPress.sets;
    assert.strictEqual(totalPressingSets, 9, 'Upper pressing volume must be capped at strictly 9 sets per week');

    // Direct Upper Dynamic Pulling (18 sets):
    // Mon Slot 3 (Reverse Pec Deck Fly: 3 sets)
    // Tue Slot 1 (Neutral Lat Pulldown: 3 sets)
    // Tue Slot 2 (Chest-Supported Row: 3 sets)
    // Tue Slot 3 (Kneeling Cable Lat Pullover: 3 sets)
    // Wed Slot 3 (Posture Face Pull: 3 sets)
    // Thu Slot 4A (Incline DB Y-Raise: 3 sets)
    const monReverseFly = mondayExercises[2];
    const tueLatPulldown = tuesdayExercises[0];
    const tueRow = tuesdayExercises[1];
    const tuePullover = tuesdayExercises[2];
    const wedFacePull = wednesdayExercises[2];
    const thuYRaise = thursdayExercises[3];

    assert.ok(monReverseFly.exerciseName.includes('Reverse Pec Deck'));
    assert.ok(wedFacePull.exerciseName.includes('Face Pull'));
    assert.ok(thuYRaise.exerciseName.includes('Y-Raise'));

    const dynamicPullingSets =
      monReverseFly.sets +
      tueLatPulldown.sets +
      tueRow.sets +
      tuePullover.sets +
      wedFacePull.sets +
      thuYRaise.sets;
    assert.strictEqual(dynamicPullingSets, 18, 'Dynamic upper pulling volume must equal strictly 18 sets per week');

    // Isometric Upper Back Loading (6 sets):
    // Thu Slot 1 (Dumbbell RDL: 3 sets) + Thu Finisher (Farmer's Walk: 3 sets)
    const thursdayRDL = thursdayExercises[0];
    const thursdayFarmer = thursdayExercises[5];
    const isometricUpperBackSets = thursdayRDL.sets + thursdayFarmer.sets;
    assert.strictEqual(isometricUpperBackSets, 6, 'Thursday RDL + Farmer Carry must contribute 6 sets of isometric trap/scapula loading');

    const totalPostureSets = dynamicPullingSets + isometricUpperBackSets;
    assert.strictEqual(totalPostureSets, 24, 'Total posture pulling volume must equal strictly 24 sets per week');

    const dynamicRatio = dynamicPullingSets / totalPressingSets;
    assert.strictEqual(dynamicRatio, 2.0, 'Dynamic pull-to-push ratio must equal exactly 2.0:1 (18 pulling vs 9 pressing sets)');

    // Quadriceps volume check: Slot 1 (Leg Press: 3 sets) + Slot 2 (Leg Extension: 3 sets) = 6 sets
    const wedQuadSets = wednesdayExercises[0].sets + wednesdayExercises[1].sets;
    assert.strictEqual(wedQuadSets, 6, 'Wednesday must deliver 6 direct quad sets (Leg Press 3 + Leg Extension 3)');
  });

  it('enforces the 3x/Week Side Delt Matrix (9 Total Sets)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    const monSideDelt = mondayExercises.find((e) => e.exerciseName.includes('Lateral Raise'))!;
    const tueSideDelt = tuesdayExercises.find((e) => e.exerciseName.includes('Lateral Raise'))!;
    const thuSideDelt = thursdayExercises.find((e) => e.exerciseName.includes('Lateral Raise'))!;

    assert.ok(monSideDelt, 'Monday must include Lateral Raise');
    assert.ok(tueSideDelt, 'Tuesday must include Lateral Raise');
    assert.ok(thuSideDelt, 'Thursday must include Lateral Raise');

    assert.strictEqual(monSideDelt.sets, 3, 'Monday Lateral Raise must have 3 sets');
    assert.strictEqual(tueSideDelt.sets, 3, 'Tuesday Lateral Raise must have 3 sets');
    assert.strictEqual(thuSideDelt.sets, 3, 'Thursday Lateral Raise must have 3 sets (with Set 3 drop set)');

    const totalSideDeltSets = monSideDelt.sets + tueSideDelt.sets + thuSideDelt.sets;
    assert.strictEqual(totalSideDeltSets, 9, 'Side delts must be hit for 9 total sets across 3 weekly sessions');
  });

  it('enforces Thursday Drop Set configuration', () => {
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const thuDropSet = thursdayExercises.find((e) => e.hasDropSet)!;

    assert.ok(thuDropSet, 'Thursday must have an exercise with hasDropSet flag');
    assert.strictEqual(thuDropSet.hasDropSet, true, 'Thursday exercise must have hasDropSet flag');
    assert.ok(thuDropSet.dropSetGuidance && thuDropSet.dropSetGuidance.includes('3–4 kg'), 'Drop set guidance must specify light dumbbells');
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
    assert.strictEqual(tuesdayExercises[2].exerciseName.includes('Lat Pullover'), true);
  });

  it('enforces Thursday Primary Overload Rule and Stall Rule on RDL', () => {
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const rdl = thursdayExercises[0]; // Slot 1: RDL
    assert.strictEqual(rdl.exerciseName.includes('Romanian Deadlift'), true);
    assert.ok(rdl.loadGuidance?.includes('Thursday Primary Overload Rule'), 'RDL must include Thursday Primary Overload Rule');
    assert.ok(rdl.loadGuidance?.includes('Stall Rule'), 'RDL must include 10% Stall Rule');
  });

  it('verifies 4-modality equipment matrix completeness for all 21 exercise slots (84 variations total)', () => {
    const allExercises = week1.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercises.length, 21, 'Must have exactly 21 total exercise prescriptions');

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

  it('verifies safe video URLs and form cues for all 13 exercise prescriptions and 52 variations', () => {
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

    assert.strictEqual(totalExercisesChecked, 21);
    assert.strictEqual(totalVariationsChecked, 84);
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
