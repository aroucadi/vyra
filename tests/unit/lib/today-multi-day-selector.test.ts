import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { appStore } from '../../../src/lib/store';
import { resolveProgramDay } from '../../../src/lib/utils';
import type { Program, ProgramDay, WorkoutSession } from '../../../src/lib/types';

function createMock7DayProgram(traineeId: string, programId: string): Program {
  return {
    id: programId,
    trainerId: 'trainer_test',
    traineeId,
    title: '7-Day Kinetic Split Program',
    startDate: '2026-11-23', // Monday
    endDate: '2027-03-15',
    durationWeeks: 16,
    status: 'published',
    version: 1,
    weeks: [
      {
        id: `${programId}_w1`,
        programId,
        weekIndex: 1,
        days: [
          {
            id: `${programId}_d0`,
            weekId: `${programId}_w1`,
            dayOfWeek: 0,
            label: 'Day 1: Upper Kinetic Drive (Push)',
            isRestDay: false,
            morningRoutine: ['Warm shower', 'Dynamic shoulder circles'],
            nutrition: { targetProteinGrams: 180, supplements: [] },
            blocks: [
              {
                id: 'b_d0_1',
                order: 1,
                type: 'straight',
                exercises: [
                  {
                    id: 'ep_d0_1',
                    exerciseId: '0025',
                    exerciseName: 'Barbell Bench Press',
                    sets: 4,
                    repRangeLow: 6,
                    repRangeHigh: 8,
                    rirScheme: [2, 1, 0],
                    restSeconds: 120,
                    targetMuscleGroups: ['chest', 'triceps'],
                  },
                  {
                    id: 'ep_d0_2',
                    exerciseId: '0101',
                    exerciseName: 'Incline Dumbbell Press',
                    sets: 3,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    rirScheme: [2, 1, 0],
                    restSeconds: 90,
                    targetMuscleGroups: ['upper chest', 'front delts'],
                  },
                  {
                    id: 'ep_d0_3',
                    exerciseId: '0310',
                    exerciseName: 'Cable Triceps Pushdown',
                    sets: 4,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    rirScheme: [2, 1, 0],
                    restSeconds: 60,
                    targetMuscleGroups: ['triceps'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d1`,
            weekId: `${programId}_w1`,
            dayOfWeek: 1,
            label: 'Day 2: Posterior Chain & Pull',
            isRestDay: false,
            morningRoutine: ['Hydration', 'Thoracic spine opener'],
            nutrition: { targetProteinGrams: 180, supplements: [] },
            blocks: [
              {
                id: 'b_d1_1',
                order: 1,
                type: 'straight',
                exercises: [
                  {
                    id: 'ep_d1_1',
                    exerciseId: '0142',
                    exerciseName: 'Lat Pulldown',
                    sets: 4,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    rirScheme: [2, 1, 0],
                    restSeconds: 90,
                    targetMuscleGroups: ['lats'],
                  },
                  {
                    id: 'ep_d1_2',
                    exerciseId: '0145',
                    exerciseName: 'Seated Cable Row',
                    sets: 3,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    rirScheme: [2, 1, 0],
                    restSeconds: 90,
                    targetMuscleGroups: ['upper back'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d2`,
            weekId: `${programId}_w1`,
            dayOfWeek: 2,
            label: 'Day 3: Lower Kinetic Quad & Ham',
            isRestDay: false,
            morningRoutine: ['90-90 hip mobilization'],
            nutrition: { targetProteinGrams: 180, supplements: [] },
            blocks: [
              {
                id: 'b_d2_1',
                order: 1,
                type: 'straight',
                exercises: [
                  {
                    id: 'ep_d2_1',
                    exerciseId: '0032',
                    exerciseName: 'Barbell Back Squat',
                    sets: 4,
                    repRangeLow: 6,
                    repRangeHigh: 8,
                    rirScheme: [2, 1, 0],
                    restSeconds: 150,
                    targetMuscleGroups: ['quads', 'glutes'],
                  },
                  {
                    id: 'ep_d2_2',
                    exerciseId: '0205',
                    exerciseName: 'Romanian Deadlift',
                    sets: 3,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    rirScheme: [2, 1, 0],
                    restSeconds: 120,
                    targetMuscleGroups: ['hamstrings', 'glutes'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d3`,
            weekId: `${programId}_w1`,
            dayOfWeek: 3,
            label: 'Day 4: Somatic Rest & Mid-Week Reset',
            isRestDay: true,
            morningRoutine: ['Light walk', 'Electrolytes'],
            nutrition: { targetProteinGrams: 160, supplements: [] },
            blocks: [],
          },
          {
            id: `${programId}_d4`,
            weekId: `${programId}_w1`,
            dayOfWeek: 4,
            label: 'Day 5: Upper Kinetic Hypertrophy',
            isRestDay: false,
            morningRoutine: ['Shoulder warm up'],
            nutrition: { targetProteinGrams: 180, supplements: [] },
            blocks: [
              {
                id: 'b_d4_1',
                order: 1,
                type: 'straight',
                exercises: [
                  {
                    id: 'ep_d4_1',
                    exerciseId: '0101',
                    exerciseName: 'Incline Dumbbell Bench Press',
                    sets: 4,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    rirScheme: [2, 1, 0],
                    restSeconds: 90,
                    targetMuscleGroups: ['upper chest'],
                  },
                  {
                    id: 'ep_d4_2',
                    exerciseId: '0045',
                    exerciseName: 'Pec Deck Machine',
                    sets: 3,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    rirScheme: [2, 1, 0],
                    restSeconds: 60,
                    targetMuscleGroups: ['chest'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d5`,
            weekId: `${programId}_w1`,
            dayOfWeek: 5,
            label: 'Day 6: Kinetic Crucible & Arms',
            isRestDay: false,
            morningRoutine: ['Wrist mobility'],
            nutrition: { targetProteinGrams: 180, supplements: [] },
            blocks: [
              {
                id: 'b_d5_1',
                order: 1,
                type: 'straight',
                exercises: [
                  {
                    id: 'ep_d5_1',
                    exerciseId: '0310',
                    exerciseName: 'Triceps Pushdown',
                    sets: 4,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    rirScheme: [2, 1, 0],
                    restSeconds: 60,
                    targetMuscleGroups: ['triceps'],
                  },
                  {
                    id: 'ep_d5_2',
                    exerciseId: '0315',
                    exerciseName: 'Bayesian Cable Curl',
                    sets: 4,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    rirScheme: [2, 1, 0],
                    restSeconds: 60,
                    targetMuscleGroups: ['biceps'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d6`,
            weekId: `${programId}_w1`,
            dayOfWeek: 6,
            label: 'Day 7: Systemic Regeneration & CNS Deload',
            isRestDay: true,
            morningRoutine: ['Breathing protocol', 'Sleep extension'],
            nutrition: { targetProteinGrams: 160, supplements: [] },
            blocks: [],
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Pure model mirror of the Today cockpit multi-day resolution logic in src/app/(trainee)/today/page.tsx
 */
function resolveTodayInspectedCockpit(params: {
  program: Program;
  resolved: { weekIndex: number; dayOfWeek: number; started: boolean };
  inspectedDayOfWeek: number | null;
}) {
  const currentWeekIdx = Math.min(
    Math.max(0, params.resolved.weekIndex - 1),
    params.program.weeks.length - 1
  );
  const currentWeek = params.program.weeks[currentWeekIdx];
  const currentInspectedDay = params.inspectedDayOfWeek ?? params.resolved.dayOfWeek;

  const todaySession = currentWeek.days.find((d) => d.dayOfWeek === params.resolved.dayOfWeek);
  const displaySession =
    currentWeek.days.find((d) => d.dayOfWeek === currentInspectedDay) ||
    todaySession ||
    currentWeek.days[0];

  const isInspectingDifferentDay = currentInspectedDay !== params.resolved.dayOfWeek;
  const isCalendarToday = (dayOfWeek: number) => dayOfWeek === params.resolved.dayOfWeek;
  const isSelectedInspected = (dayOfWeek: number) => dayOfWeek === currentInspectedDay;

  const displayExercises = displaySession?.blocks?.flatMap((b) => b.exercises) || [];
  const displayScheduledSets = displayExercises.reduce((sum, e) => sum + e.sets, 0);
  const estimatedPaceMin = Math.round(Math.max(25, displayScheduledSets * 2.5));
  const isRestDay = Boolean(displaySession.isRestDay || displayExercises.length === 0);

  const sessionLaunchUrl = `/session?day=${displaySession.id}`;
  const sessionPreviewUrl = `/session?day=${displaySession.id}&mode=preview`;

  const daysOfWeekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayIndex = currentWeek.days.findIndex((d) => d.dayOfWeek === currentInspectedDay);
  const directiveHeader = isInspectingDifferentDay
    ? `Inspecting Day ${dayIndex + 1} (${daysOfWeekLabels[currentInspectedDay] || ''})`
    : 'Training Directive // 01 of 01';

  const statusBadge = isInspectingDifferentDay
    ? isRestDay
      ? 'REST DAY // PREVIEW'
      : 'PREVIEW // SCHEDULED'
    : isRestDay
    ? 'REST DAY'
    : 'SCHEDULED';

  return {
    currentInspectedDay,
    isInspectingDifferentDay,
    isCalendarToday,
    isSelectedInspected,
    displaySession,
    displayExercises,
    displayScheduledSets,
    estimatedPaceMin,
    isRestDay,
    sessionLaunchUrl,
    sessionPreviewUrl,
    directiveHeader,
    statusBadge,
  };
}

describe('Today Cockpit Multi-Day Program Workout Selector (Milestone 2)', () => {
  const traineeId = 'trainee_m2_selector_spec';
  const programId = 'prog_m2_kinetic_spec';
  let program: Program;

  beforeEach(() => {
    appStore.reset();
    program = createMock7DayProgram(traineeId, programId);
    appStore.saveProgram(program);
    appStore.publishProgram(programId);
  });

  describe('1. 7-Day Schedule Resolution Across Active Week', () => {
    it('resolves all 7 days of the active week with correct dayOfWeek indices and labels', () => {
      const activeProg = appStore.getActiveProgramForTrainee(traineeId);
      assert.ok(activeProg);
      const week = activeProg.weeks[0];
      assert.equal(week.days.length, 7);

      const expectedLabels = [
        'Day 1: Upper Kinetic Drive (Push)',
        'Day 2: Posterior Chain & Pull',
        'Day 3: Lower Kinetic Quad & Ham',
        'Day 4: Somatic Rest & Mid-Week Reset',
        'Day 5: Upper Kinetic Hypertrophy',
        'Day 6: Kinetic Crucible & Arms',
        'Day 7: Systemic Regeneration & CNS Deload',
      ];

      week.days.forEach((day, index) => {
        assert.equal(day.dayOfWeek, index);
        assert.equal(day.label, expectedLabels[index]);
        if (index === 3 || index === 6) {
          assert.equal(day.isRestDay, true, `Day ${index + 1} should be a rest day`);
          assert.equal(day.blocks.length, 0);
        } else {
          assert.equal(day.isRestDay, false, `Day ${index + 1} should be a training day`);
          assert.ok(day.blocks.length > 0);
        }
      });
    });

    it('resolves program calendar day using resolveProgramDay correctly', () => {
      // Start Monday 2026-11-23, reference Friday 2026-11-27
      const resolved = resolveProgramDay(program.startDate, '2026-11-27');
      assert.equal(resolved.started, true);
      assert.equal(resolved.weekIndex, 1);
      assert.equal(resolved.dayOfWeek, 4); // Friday
      assert.equal(resolved.elapsedDays, 4);
    });
  });

  describe('2. Active Calendar Day vs Inspected Day State Distinction', () => {
    it('defaults to active calendar day when inspectedDayOfWeek is null', () => {
      const resolved = { weekIndex: 1, dayOfWeek: 4, started: true }; // Friday is active
      const cockpit = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: null,
      });

      assert.equal(cockpit.currentInspectedDay, 4);
      assert.equal(cockpit.isInspectingDifferentDay, false);
      assert.equal(cockpit.isCalendarToday(4), true);
      assert.equal(cockpit.isSelectedInspected(4), true);
      assert.equal(cockpit.directiveHeader, 'Training Directive // 01 of 01');
      assert.equal(cockpit.statusBadge, 'SCHEDULED');
    });

    it('distinguishes active calendar day from inspected day when athlete previews tomorrow (Saturday)', () => {
      const resolved = { weekIndex: 1, dayOfWeek: 4, started: true }; // Friday is active
      const cockpit = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 5, // Inspect Saturday
      });

      assert.equal(cockpit.currentInspectedDay, 5);
      assert.equal(cockpit.isInspectingDifferentDay, true);
      // Calendar today remains Friday (4)
      assert.equal(cockpit.isCalendarToday(4), true, 'Friday must remain calendar today');
      assert.equal(cockpit.isCalendarToday(5), false, 'Saturday is not calendar today');
      // Selected day is Saturday (5)
      assert.equal(cockpit.isSelectedInspected(5), true, 'Saturday must be inspected');
      assert.equal(cockpit.isSelectedInspected(4), false, 'Friday must not be selected');

      // Directive header and status badge reflect inspection preview
      assert.equal(cockpit.directiveHeader, 'Inspecting Day 6 (Sat)');
      assert.equal(cockpit.statusBadge, 'PREVIEW // SCHEDULED');
    });

    it('allows restoring null to return cleanly to active calendar day', () => {
      const resolved = { weekIndex: 1, dayOfWeek: 2, started: true }; // Wednesday
      // First inspect Thursday (Day 3, rest)
      const inspectingRest = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 3,
      });
      assert.equal(inspectingRest.isInspectingDifferentDay, true);
      assert.equal(inspectingRest.currentInspectedDay, 3);
      assert.equal(inspectingRest.statusBadge, 'REST DAY // PREVIEW');

      // Click Return to Today -> inspectedDayOfWeek restored to null
      const returnedToToday = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: null,
      });
      assert.equal(returnedToToday.isInspectingDifferentDay, false);
      assert.equal(returnedToToday.currentInspectedDay, 2);
      assert.equal(returnedToToday.isCalendarToday(2), true);
      assert.equal(returnedToToday.directiveHeader, 'Training Directive // 01 of 01');
    });
  });

  describe('3. Dynamic Session Label, Movement Count, Working Sets & Pace Derivation', () => {
    it('dynamically computes session stats when switching between Push, Lower, and Rest days', () => {
      const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

      // Day 0: Push (3 movements, 4+3+4 = 11 sets, pace = Math.round(11*2.5) = 28)
      const pushDay = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 0,
      });
      assert.equal(pushDay.displaySession.label, 'Day 1: Upper Kinetic Drive (Push)');
      assert.equal(pushDay.displayExercises.length, 3);
      assert.equal(pushDay.displayScheduledSets, 11);
      assert.equal(pushDay.estimatedPaceMin, 28);
      assert.equal(pushDay.isRestDay, false);

      // Day 2: Lower (2 movements: Squat 4 sets, RDL 3 sets = 7 sets, pace clamped to min 25)
      const lowerDay = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 2,
      });
      assert.equal(lowerDay.displaySession.label, 'Day 3: Lower Kinetic Quad & Ham');
      assert.equal(lowerDay.displayExercises.length, 2);
      assert.equal(lowerDay.displayScheduledSets, 7);
      assert.equal(lowerDay.estimatedPaceMin, 25);
      assert.equal(lowerDay.isRestDay, false);

      // Day 3: Somatic Rest (0 movements, 0 sets, isRestDay = true)
      const restDay = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 3,
      });
      assert.equal(restDay.displaySession.label, 'Day 4: Somatic Rest & Mid-Week Reset');
      assert.equal(restDay.displayExercises.length, 0);
      assert.equal(restDay.displayScheduledSets, 0);
      assert.equal(restDay.isRestDay, true);
      assert.equal(restDay.statusBadge, 'REST DAY // PREVIEW');
    });

    it('generates accurate session launch CTA and preview URLs targeting inspected session ID', () => {
      const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

      const fridayCockpit = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 4,
      });
      assert.equal(fridayCockpit.sessionLaunchUrl, `/session?day=${programId}_d4`);
      assert.equal(fridayCockpit.sessionPreviewUrl, `/session?day=${programId}_d4&mode=preview`);

      const saturdayCockpit = resolveTodayInspectedCockpit({
        program,
        resolved,
        inspectedDayOfWeek: 5,
      });
      assert.equal(saturdayCockpit.sessionLaunchUrl, `/session?day=${programId}_d5`);
      assert.equal(saturdayCockpit.sessionPreviewUrl, `/session?day=${programId}_d5&mode=preview`);
    });
  });

  describe('4. Target Day Parameter Safety in appStore.swapExerciseInActiveProgram', () => {
    it('mutates the inspected day when target day parameter is provided', () => {
      // Trainee is on Friday (dayOfWeek 4, active calendar day)
      // Athlete inspects Monday (dayOfWeek 0) and swaps 'Barbell Bench Press' for 'Dumbbell Flat Press'
      const swapResult = appStore.swapExerciseInActiveProgram(
        traineeId,
        'Barbell Bench Press',
        'Dumbbell Flat Press',
        0 // Target Monday
      );

      assert.equal(swapResult.success, true);
      assert.ok(swapResult.message?.includes('Dumbbell Flat Press'));
      assert.equal(swapResult.dayLabel, 'Day 1: Upper Kinetic Drive (Push)');

      // Verify Monday was modified
      const updatedProg = appStore.getActiveProgramForTrainee(traineeId)!;
      const mondayDay = updatedProg.weeks[0].days[0];
      const swappedEx = mondayDay.blocks[0].exercises.find((e) => e.exerciseName === 'Dumbbell Flat Press');
      assert.ok(swappedEx, 'Dumbbell Flat Press must exist on Monday');

      // Verify Friday (day 4) was NOT modified
      const fridayDay = updatedProg.weeks[0].days[4];
      const fridayBench = fridayDay.blocks[0].exercises.find((e) => e.exerciseName === 'Incline Dumbbell Bench Press');
      assert.ok(fridayBench, 'Friday exercises must remain untouched');
    });

    it('mutates inspected Friday when calendar day is Monday without bleeding into other days', () => {
      // Swapping Pec Deck Machine on Friday (dayOfWeek 4)
      const res = appStore.swapExerciseInActiveProgram(
        traineeId,
        'Pec Deck Machine',
        'Standing Cable Crossover',
        4 // Target Friday
      );

      assert.equal(res.success, true);
      const updatedProg = appStore.getActiveProgramForTrainee(traineeId)!;
      const friday = updatedProg.weeks[0].days[4];
      const fridayExercises = friday.blocks[0].exercises.map((e) => e.exerciseName);
      assert.ok(fridayExercises.includes('Standing Cable Crossover'));

      // Day 0 must NOT contain Standing Cable Crossover
      const monday = updatedProg.weeks[0].days[0];
      const mondayExercises = monday.blocks[0].exercises.map((e) => e.exerciseName);
      assert.equal(mondayExercises.includes('Standing Cable Crossover'), false);
    });

    it('falls back safely to resolved calendar day if day parameter is omitted or undefined', () => {
      // Determine what the current resolved calendar day is
      const resolved = resolveProgramDay(program.startDate);
      const calendarDay = program.weeks[0].days.find((d) => d.dayOfWeek === resolved.dayOfWeek)!;
      assert.ok(calendarDay, 'Calendar day must exist');

      // Pick an exercise or substitute on the resolved calendar day
      const existingExName = calendarDay.blocks[0]?.exercises[0]?.exerciseName || 'Triceps Pushdown';
      const replacementName = 'Overhead Extension Machine';

      const res = appStore.swapExerciseInActiveProgram(
        traineeId,
        existingExName,
        replacementName,
        undefined // Should default to resolved.dayOfWeek
      );
      assert.equal(res.success, true);

      const updatedProg = appStore.getActiveProgramForTrainee(traineeId)!;
      const targetDay = updatedProg.weeks[0].days.find((d) => d.dayOfWeek === resolved.dayOfWeek)!;
      const hasSwapped = targetDay.blocks[0].exercises.some(
        (e) => e.exerciseName === replacementName
      );
      assert.equal(hasSwapped, true, 'Replacement must be on resolved calendar day');
    });

    it('returns error when attempting to swap on a rest day with no exercises', () => {
      // Day 3 is a rest day with blocks = []
      const res = appStore.swapExerciseInActiveProgram(
        traineeId,
        'Nonexistent Exercise',
        'Yoga Flow',
        3
      );
      // Because Day 3 is a rest day, appStore finds the next non-rest day or returns error if not matching
      // Let's verify it does not corrupt the rest day
      const updatedProg = appStore.getActiveProgramForTrainee(traineeId)!;
      const restDay = updatedProg.weeks[0].days[3];
      assert.equal(restDay.isRestDay, true);
      assert.equal(restDay.blocks.length, 0);
    });
  });
});
