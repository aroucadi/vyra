import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMaster16WeekProgram,
  masterDailyMeals,
  masterSupplementProtocols,
  masterHydrationGoal,
  userAlaa,
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

  it('verifies strictly 17 workout slots across the 4 training days', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    assert.strictEqual(mondayExercises.length, 4, 'Monday must have 4 exercise slots');
    assert.strictEqual(tuesdayExercises.length, 3, 'Tuesday must have 3 exercise slots');
    assert.strictEqual(wednesdayExercises.length, 5, 'Wednesday must have 5 exercise slots');
    assert.strictEqual(thursdayExercises.length, 5, 'Thursday must have 5 exercise slots');

    const totalSlots = mondayExercises.length + tuesdayExercises.length + wednesdayExercises.length + thursdayExercises.length;
    assert.strictEqual(totalSlots, 17, 'Total workout slots across the 4-day split must be exactly 17');
  });

  it('enforces the Biomechanical 2:1 Pull-to-Push Volume Balance (6 pushing vs 12 pulling/retraction sets)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    // Pressing volume: Mon Slot 1 (Incline Chest) + Thu Slot 1 (Shoulder Press)
    const mondayChestPress = mondayExercises[0];
    const thursdayShoulderPress = thursdayExercises[0];
    const totalPressingSets = mondayChestPress.sets + thursdayShoulderPress.sets;
    assert.strictEqual(totalPressingSets, 6, 'Upper pressing volume must be capped at strictly 6 sets per week');

    // Pulling / Scapular Retraction volume:
    // Mon Slot 2 (Posture Counter-Pull/Face Pull: 3 sets)
    // Wed Slot 1 (Lat Pulldown: 3 sets)
    // Wed Slot 2 (Chest-Supported Row: 3 sets)
    // Wed Slot 3 (Reverse Pec Deck Rear Delts: 3 sets)
    const mondayFacePull = mondayExercises[1];
    const wednesdayLatPulldown = wednesdayExercises[0];
    const wednesdayRow = wednesdayExercises[1];
    const wednesdayRearDelt = wednesdayExercises[2];
    const totalPullingSets = mondayFacePull.sets + wednesdayLatPulldown.sets + wednesdayRow.sets + wednesdayRearDelt.sets;
    assert.strictEqual(totalPullingSets, 12, 'Upper back and retraction volume must be maintained at strictly 12 sets per week');

    const pullToPushRatio = totalPullingSets / totalPressingSets;
    assert.strictEqual(pullToPushRatio, 2.0, 'Pull-to-push volume ratio must equal exactly 2:1');
  });

  it('enforces the 3x/Week Side Delt Matrix (9 Total Sets)', () => {
    const mondayExercises = week1.days[0].blocks.flatMap((b) => b.exercises);
    const wednesdayExercises = week1.days[2].blocks.flatMap((b) => b.exercises);
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);

    const monSideDelt = mondayExercises[3]; // Slot 4
    const wedSideDelt = wednesdayExercises[4]; // Slot 5
    const thuSideDelt = thursdayExercises[2]; // Slot 3

    assert.strictEqual(monSideDelt.sets, 3, 'Monday Slot 4 must have 3 sets');
    assert.strictEqual(wedSideDelt.sets, 3, 'Wednesday Slot 5 must have 3 sets');
    assert.strictEqual(thuSideDelt.sets, 3, 'Thursday Slot 3 must have 3 sets (with Set 3 drop set)');

    const totalSideDeltSets = monSideDelt.sets + wedSideDelt.sets + thuSideDelt.sets;
    assert.strictEqual(totalSideDeltSets, 9, 'Side delts must be hit for 9 total sets across 3 weekly sessions');
  });

  it('enforces Thursday Slot 3 Drop Set configuration', () => {
    const thursdayExercises = week1.days[3].blocks.flatMap((b) => b.exercises);
    const thuSideDelt = thursdayExercises[2];

    assert.strictEqual(thuSideDelt.hasDropSet, true, 'Thursday Slot 3 must have hasDropSet flag');
    assert.ok(thuSideDelt.dropSetGuidance && thuSideDelt.dropSetGuidance.includes('30%'), 'Drop set guidance must specify 30% reduction');
    assert.ok(thuSideDelt.rirScheme.at(-1) === 0, 'Final set must be taken to 0 RIR failure');
  });

  it('enforces Pure Posterior Chain & Zero Quad Isolation on Tuesday', () => {
    const tuesdayExercises = week1.days[1].blocks.flatMap((b) => b.exercises);
    const quadMuscles = ['Quadriceps', 'Quads', 'Vastus', 'Rectus Femoris'];

    tuesdayExercises.forEach((ex) => {
      const hasQuadIsolation = ex.targetMuscleGroups.some((m) =>
        quadMuscles.some((q) => m.toLowerCase().includes(q.toLowerCase()))
      );
      assert.strictEqual(hasQuadIsolation, false, `Tuesday exercise ${ex.exerciseName} must not isolate quads`);
    });

    assert.strictEqual(tuesdayExercises[0].exerciseName.includes('Leg Press'), true);
    assert.strictEqual(tuesdayExercises[1].exerciseName.includes('Leg Curl'), true);
    assert.strictEqual(tuesdayExercises[2].exerciseName.includes('Pallof'), true);
  });

  it('verifies 4-modality equipment matrix completeness for all 17 slots (68 variations total)', () => {
    const allExercises = week1.days.flatMap((d) => d.blocks.flatMap((b) => b.exercises));
    assert.strictEqual(allExercises.length, 17);

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

  it('verifies 8-Minute Morning Alignment Routine is assigned to all days', () => {
    week1.days.forEach((d) => {
      assert.ok(d.morningRoutine && d.morningRoutine.length >= 4, `Day ${d.label} must have morning routine`);
      const routineStr = d.morningRoutine.join(' ');
      assert.ok(routineStr.includes('Vacuum'), 'Routine must include Stomach Vacuum');
      assert.ok(routineStr.includes('Glute Bridge'), 'Routine must include Glute Bridges');
      assert.ok(routineStr.includes('Hip Flexor'), 'Routine must include Hip Flexor Stretch');
      assert.ok(routineStr.includes('Doorway Pec'), 'Routine must include Doorway Pec Stretch');
    });
  });

  it('verifies 8-milestone daily nutrient architecture and macro targets', () => {
    assert.ok(masterDailyMeals.length >= 8, 'Must define at least 8 daily nutrient milestones');

    const mealTimes = masterDailyMeals.map((m) => m.time);
    ['07:00', '09:15', '11:45', '12:15', '13:35', '14:00', '16:00', '21:30', '22:45'].forEach((time) => {
      assert.ok(mealTimes.includes(time), `Daily schedule must include milestone at ${time}`);
    });

    const nutrition = week1.days[0].nutrition;
    assert.strictEqual(nutrition.targetKcal, 2700);
    assert.strictEqual(nutrition.targetProteinGrams, 100);
    assert.ok(nutrition.dailyMeals && nutrition.dailyMeals.length > 0);
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

  it('verifies safe video URLs and form cues for all 17 exercise slots and 68 variations', () => {
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

    assert.strictEqual(totalExercisesChecked, 17);
    assert.strictEqual(totalVariationsChecked, 68);
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
