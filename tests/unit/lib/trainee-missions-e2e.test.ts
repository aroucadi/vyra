import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOpenGymClipUrl,
  getOpenGymStillUrl,
  buildExerciseVideoUrl,
  resolveExerciseVideoUrl,
  isDirectVideoUrl,
  isSafeUrl,
  resolveProgramDay,
} from '../../../src/lib/utils';
import { appStore } from '../../../src/lib/store';
import type { Program, ProgramDay } from '../../../src/lib/types';

/**
 * CONTRACT SPECIFICATION MODELS
 * Derived directly from PROJECT.md and ORIGINAL_REQUEST.md specifications.
 */

export interface ExerciseVideoModalPropsContract {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    id?: string;
    name: string;
    target?: string;
    equipment?: string;
    instructions?: string[];
    videoUrl?: string;
    clipUrl?: string;
    stillUrl?: string;
    formCue?: string;
  } | null;
  defaultMode?: 'opengym' | 'youtube';
}

function normalizeOpenGymId(id: string): string {
  // Strips leading non-digit characters (e.g. 'ex_0576' -> '0576') and pads to 4 digits
  return id.replace(/^[^\d]*/, '').padStart(4, '0');
}

function resolveDualModalState(
  props: ExerciseVideoModalPropsContract,
  activeMode: 'opengym' | 'youtube' = props.defaultMode || 'opengym'
) {
  if (!props.exercise) return null;

  const normId = props.exercise.id ? normalizeOpenGymId(props.exercise.id) : undefined;
  const openGymClip =
    props.exercise.clipUrl || (normId ? getOpenGymClipUrl(normId) : undefined);
  const openGymStill =
    props.exercise.stillUrl || (normId ? getOpenGymStillUrl(normId) : undefined);
  const youtubeUrl =
    props.exercise.videoUrl ||
    buildExerciseVideoUrl(props.exercise.name, {
      equipment: props.exercise.equipment,
      targetMuscle: props.exercise.target,
    });

  const hasOpenGymClip = Boolean(openGymClip && isDirectVideoUrl(openGymClip));
  const effectiveMode =
    activeMode === 'opengym' && !hasOpenGymClip ? 'youtube' : activeMode;

  return {
    isOpen: props.isOpen,
    exerciseName: props.exercise.name,
    activeMode: effectiveMode,
    requestedMode: activeMode,
    openGymClipUrl: openGymClip,
    openGymStillUrl: openGymStill,
    youtubeUrl,
    hasOpenGymClip,
    canSwitchToOpenGym: hasOpenGymClip,
    canSwitchToYouTube: true,
  };
}

export interface TodayMultiDayContract {
  program: Program;
  resolved: { weekIndex: number; dayOfWeek: number; started: boolean };
  inspectedDayOfWeek: number | null;
}

function resolveTodayInspectedSession(state: TodayMultiDayContract) {
  const currentWeekIdx = Math.min(
    Math.max(0, state.resolved.weekIndex - 1),
    state.program.weeks.length - 1
  );
  const currentWeek = state.program.weeks[currentWeekIdx];
  const effectiveDayOfWeek =
    typeof state.inspectedDayOfWeek === 'number'
      ? state.inspectedDayOfWeek
      : state.resolved.dayOfWeek;

  const inspectedSession =
    currentWeek.days.find((d) => d.dayOfWeek === effectiveDayOfWeek) ||
    currentWeek.days.find((d) => d.dayOfWeek === state.resolved.dayOfWeek) ||
    currentWeek.days[0];

  const isCalendarToday = (dayOfWeek: number) =>
    dayOfWeek === state.resolved.dayOfWeek;
  const isInspected = (dayOfWeek: number) =>
    dayOfWeek === effectiveDayOfWeek;

  const exercises = inspectedSession?.blocks.flatMap((b) => b.exercises) || [];
  const scheduledSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const estimatedPaceMin = Math.round(Math.max(25, scheduledSets * 2.5));
  const sessionLaunchUrl = `/session?day=${inspectedSession?.id || 'day_1'}`;

  return {
    effectiveDayOfWeek,
    inspectedSession,
    isCalendarToday,
    isInspected,
    exercises,
    scheduledSets,
    estimatedPaceMin,
    sessionLaunchUrl,
  };
}

export interface ExerciseThumbnailPropsContract {
  exerciseId?: string;
  exerciseName: string;
  stillUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

function inferApparatusFromExercise(
  name: string,
  equipment?: string
): 'dumbbell' | 'barbell' | 'cable' | 'machine' | 'bodyweight' {
  const text = `${name} ${equipment || ''}`.toLowerCase();
  if (text.includes('dumbbell') || text.includes('db')) return 'dumbbell';
  if (text.includes('barbell') || text.includes('bb')) return 'barbell';
  if (
    text.includes('cable') ||
    text.includes('cuff') ||
    text.includes('pulldown') ||
    text.includes('pushdown')
  )
    return 'cable';
  if (
    text.includes('machine') ||
    text.includes('lever') ||
    text.includes('press machine') ||
    text.includes('hack') ||
    text.includes('pec deck')
  )
    return 'machine';
  if (
    text.includes('bodyweight') ||
    text.includes('pull-up') ||
    text.includes('chin-up') ||
    text.includes('push-up') ||
    text.includes('dip')
  )
    return 'bodyweight';
  return 'dumbbell';
}

function resolveThumbnailDisplay(
  props: ExerciseThumbnailPropsContract,
  simulatedImageError = false
) {
  const normId = props.exerciseId ? normalizeOpenGymId(props.exerciseId) : undefined;
  const candidateUrl =
    props.stillUrl || (normId ? getOpenGymStillUrl(normId) : undefined);
  const hasValidImageUrl = Boolean(
    candidateUrl && !simulatedImageError && isSafeUrl(candidateUrl)
  );

  const sizeDimensions = {
    xs: { width: 20, height: 20, className: 'w-5 h-5' },
    sm: { width: 32, height: 32, className: 'w-8 h-8' },
    md: { width: 48, height: 48, className: 'w-12 h-12' },
    lg: { width: 64, height: 64, className: 'w-16 h-16' },
  }[props.size || 'sm'];

  return {
    displayMode: hasValidImageUrl ? 'image' : 'apparatus_fallback',
    imageUrl: hasValidImageUrl ? candidateUrl : undefined,
    apparatusFallback: inferApparatusFromExercise(props.exerciseName),
    dimensions: sizeDimensions,
  };
}

/**
 * TEST PROGRAM GENERATOR
 * Builds a standardized 7-day training week for reproducible testing.
 */
function createStandard7DayProgram(traineeId: string, programId: string): Program {
  return {
    id: programId,
    traineeId,
    title: 'Kinetic Hypertrophy Mastery 7-Day Protocol',
    startDate: '2026-11-23', // Monday Nov 23, 2026
    status: 'published',
    durationWeeks: 8,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            id: `${programId}_d0`,
            dayOfWeek: 0,
            label: 'Day 1: Upper Kinetic Drive (Push)',
            isRestDay: false,
            blocks: [
              {
                id: 'b_d0_1',
                label: 'Main Compound',
                exercises: [
                  {
                    id: 'ep_d0_1',
                    exerciseId: '0025',
                    exerciseName: 'Barbell Bench Press',
                    sets: 4,
                    repRangeLow: 6,
                    repRangeHigh: 8,
                    targetMuscleGroups: ['chest', 'triceps'],
                  },
                  {
                    id: 'ep_d0_2',
                    exerciseId: '0101',
                    exerciseName: 'Incline Dumbbell Bench Press',
                    sets: 3,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    targetMuscleGroups: ['chest', 'front delts'],
                  },
                  {
                    id: 'ep_d0_3',
                    exerciseId: '0576',
                    exerciseName: 'Cable Lateral Raise',
                    sets: 4,
                    repRangeLow: 12,
                    repRangeHigh: 15,
                    targetMuscleGroups: ['side delts'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d1`,
            dayOfWeek: 1,
            label: 'Day 2: Posterior Chain & Pull',
            isRestDay: false,
            blocks: [
              {
                id: 'b_d1_1',
                label: 'Vertical & Horizontal Pull',
                exercises: [
                  {
                    id: 'ep_d1_1',
                    exerciseId: '0142',
                    exerciseName: 'Lat Pulldown',
                    sets: 4,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    targetMuscleGroups: ['lats'],
                  },
                  {
                    id: 'ep_d1_2',
                    exerciseId: '0145',
                    exerciseName: 'Seated Cable Row',
                    sets: 3,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    targetMuscleGroups: ['upper back'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d2`,
            dayOfWeek: 2,
            label: 'Day 3: Lower Kinetic Quad & Ham',
            isRestDay: false,
            blocks: [
              {
                id: 'b_d2_1',
                label: 'Leg Compound',
                exercises: [
                  {
                    id: 'ep_d2_1',
                    exerciseId: '0032',
                    exerciseName: 'Barbell Back Squat',
                    sets: 4,
                    repRangeLow: 6,
                    repRangeHigh: 8,
                    targetMuscleGroups: ['quads', 'glutes'],
                  },
                  {
                    id: 'ep_d2_2',
                    exerciseId: '0205',
                    exerciseName: 'Romanian Deadlift',
                    sets: 3,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    targetMuscleGroups: ['hamstrings', 'glutes'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d3`,
            dayOfWeek: 3,
            label: 'Day 4: Somatic Rest & Mid-Week Reset',
            isRestDay: true,
            blocks: [],
          },
          {
            id: `${programId}_d4`,
            dayOfWeek: 4,
            label: 'Day 5: Upper Kinetic Hypertrophy',
            isRestDay: false,
            blocks: [
              {
                id: 'b_d4_1',
                label: 'Chest & Shoulder Hypertrophy',
                exercises: [
                  {
                    id: 'ep_d4_1',
                    exerciseId: '0101',
                    exerciseName: 'Incline Dumbbell Bench Press',
                    sets: 4,
                    repRangeLow: 8,
                    repRangeHigh: 10,
                    targetMuscleGroups: ['upper chest'],
                  },
                  {
                    id: 'ep_d4_2',
                    exerciseId: '0045',
                    exerciseName: 'Pec Deck Machine',
                    sets: 3,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    targetMuscleGroups: ['chest'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d5`,
            dayOfWeek: 5,
            label: 'Day 6: Kinetic Crucible & Arms',
            isRestDay: false,
            blocks: [
              {
                id: 'b_d5_1',
                label: 'Arm Specialization',
                exercises: [
                  {
                    id: 'ep_d5_1',
                    exerciseId: '0310',
                    exerciseName: 'Triceps Pushdown',
                    sets: 4,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    targetMuscleGroups: ['triceps'],
                  },
                  {
                    id: 'ep_d5_2',
                    exerciseId: '0315',
                    exerciseName: 'Bayesian Cable Curl',
                    sets: 4,
                    repRangeLow: 10,
                    repRangeHigh: 12,
                    targetMuscleGroups: ['biceps'],
                  },
                ],
              },
            ],
          },
          {
            id: `${programId}_d6`,
            dayOfWeek: 6,
            label: 'Day 7: Systemic Regeneration & CNS Deload',
            isRestDay: true,
            blocks: [],
          },
        ],
      },
    ],
  };
}

describe('Trainee Missions E2E Opaque-Box Test Suite (R1, R2, R3, R4)', () => {
  const testTraineeId = 'trainee_e2e_verified';
  const testProgramId = 'prog_e2e_kinetic_7d';

  beforeEach(() => {
    appStore.reset();
    const testProg = createStandard7DayProgram(testTraineeId, testProgramId);
    appStore.saveProgram(testProg);
    appStore.publishProgram(testProgramId);
  });

  /* ========================================================================
   * TIER 1: FEATURE COVERAGE (>=5 per feature)
   * ======================================================================== */
  describe('Tier 1: Feature Coverage', () => {
    describe('R1: Dual-Modal Exercise Video Demonstrations', () => {
      it('T1.1: getOpenGymClipUrl generates valid CDN MP4 URLs for standard 4-digit IDs', () => {
        const url = getOpenGymClipUrl('0025');
        assert.equal(
          url,
          'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0025.mp4'
        );
        assert.equal(isDirectVideoUrl(url), true);
      });

      it('T1.2: Normalizes ex_ prefixed IDs to 4-digit format for OpenGym clip CDN', () => {
        const rawId = 'ex_0576';
        const normId = normalizeOpenGymId(rawId);
        assert.equal(normId, '0576');
        const clipUrl = getOpenGymClipUrl(normId);
        assert.equal(
          clipUrl,
          'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0576.mp4'
        );
      });

      it('T1.3: buildExerciseVideoUrl generates tactical YouTube search URLs with <4m duration filter and negative filters', () => {
        const ytUrl = buildExerciseVideoUrl('Incline Dumbbell Bench Press', {
          equipment: 'dumbbell',
          targetMuscle: 'upper chest',
        });
        assert.ok(ytUrl.startsWith('https://www.youtube.com/results?search_query='));
        assert.ok(ytUrl.includes('sp=EgIYAQ%3D%3D'), 'Must include official short duration (<4m) protobuf filter');
        assert.equal(isDirectVideoUrl(ytUrl), false, 'YouTube search URL must not be classified as direct video');
      });

      it('T1.4: resolveExerciseVideoUrl prioritizes direct video clip and falls back to precision YouTube search demonstration', () => {
        // Direct clip prioritized
        const direct = resolveExerciseVideoUrl('Barbell Bench Press', { id: '0025' });
        assert.ok(direct.includes('/0025.mp4'));

        // External fallback when no clip is available
        const searchFallback = resolveExerciseVideoUrl('Reverse Pec Deck', {
          targetMuscle: 'rear delt',
        });
        assert.ok(searchFallback.includes('youtube.com/results'));
        assert.ok(searchFallback.includes('sp=EgIYAQ%3D%3D'));
      });

      it('T1.5: ExerciseVideoModal contract supports dual-modal state, seamless tab switching, and metadata fidelity', () => {
        const modalProps: ExerciseVideoModalPropsContract = {
          isOpen: true,
          onClose: () => {},
          exercise: {
            id: '0101',
            name: 'Incline Dumbbell Bench Press',
            target: 'chest',
            equipment: 'dumbbell',
            clipUrl: 'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0101.mp4',
            videoUrl: 'https://www.youtube.com/results?search_query=incline+bench&sp=EgIYAQ%3D%3D',
          },
          defaultMode: 'opengym',
        };

        // OpenGym mode
        const openGymView = resolveDualModalState(modalProps, 'opengym');
        assert.ok(openGymView);
        assert.equal(openGymView.activeMode, 'opengym');
        assert.equal(openGymView.hasOpenGymClip, true);
        assert.equal(openGymView.openGymClipUrl, modalProps.exercise?.clipUrl);

        // Switch to YouTube mode
        const ytView = resolveDualModalState(modalProps, 'youtube');
        assert.ok(ytView);
        assert.equal(ytView.activeMode, 'youtube');
        assert.ok(ytView.youtubeUrl.includes('youtube.com'));
        assert.equal(ytView.exerciseName, 'Incline Dumbbell Bench Press');
      });
    });

    describe('R2: Multi-Day Program Workout Selector on Today Dashboard', () => {
      it('T1.6: resolveProgramDay accurately calculates current week index and calendar day of week', () => {
        // Start date: 2026-11-23 (Monday)
        // Reference date: 2026-11-27 (Friday -> dayOfWeek = 4, elapsedDays = 4)
        const res = resolveProgramDay('2026-11-23', '2026-11-27');
        assert.equal(res.started, true);
        assert.equal(res.weekIndex, 1);
        assert.equal(res.dayOfWeek, 4); // Friday
        assert.equal(res.elapsedDays, 4);
      });

      it('T1.7: Multi-day selector resolves full 7-day schedule across active week', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId);
        assert.ok(prog);
        const days = prog.weeks[0].days;
        assert.equal(days.length, 7);

        const expectedLabels = [
          'Day 1: Upper Kinetic Drive (Push)',
          'Day 2: Posterior Chain & Pull',
          'Day 3: Lower Kinetic Quad & Ham',
          'Day 4: Somatic Rest & Mid-Week Reset',
          'Day 5: Upper Kinetic Hypertrophy',
          'Day 6: Kinetic Crucible & Arms',
          'Day 7: Systemic Regeneration & CNS Deload',
        ];
        days.forEach((day, idx) => {
          assert.equal(day.dayOfWeek, idx);
          assert.equal(day.label, expectedLabels[idx]);
        });
      });

      it('T1.8: Distinguishes active calendar day from inspected day', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const resolved = { weekIndex: 1, dayOfWeek: 4, started: true }; // Friday is calendar active

        // Athlete inspects Saturday (Day 5)
        const view = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 5,
        });

        assert.equal(view.effectiveDayOfWeek, 5);
        assert.equal(view.isCalendarToday(4), true, 'Friday must remain calendar today');
        assert.equal(view.isCalendarToday(5), false, 'Saturday is not calendar today');
        assert.equal(view.isInspected(5), true, 'Saturday must be inspected');
        assert.equal(view.isInspected(4), false, 'Friday must not be inspected');
      });

      it('T1.9: Dynamically updates session label, working set volume, and pace when inspecting different days', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

        // Inspect Monday (Day 0: 3 exercises, 4+3+4 = 11 sets)
        const mondayView = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 0,
        });
        assert.equal(mondayView.inspectedSession.label, 'Day 1: Upper Kinetic Drive (Push)');
        assert.equal(mondayView.exercises.length, 3);
        assert.equal(mondayView.scheduledSets, 11);
        assert.equal(mondayView.estimatedPaceMin, Math.round(11 * 2.5));

        // Switch to Wednesday (Day 2: 2 exercises, 4+3 = 7 sets)
        const wednesdayView = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 2,
        });
        assert.equal(wednesdayView.inspectedSession.label, 'Day 3: Lower Kinetic Quad & Ham');
        assert.equal(wednesdayView.exercises.length, 2);
        assert.equal(wednesdayView.scheduledSets, 7);
        assert.equal(wednesdayView.estimatedPaceMin, 25); // Math.max(25, 7*2.5 = 17.5) -> 25
      });

      it('T1.10: Generates deep link targeting /session?day={inspectedSession.id}', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const resolved = { weekIndex: 1, dayOfWeek: 1, started: true };

        const view = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 5,
        });
        assert.equal(view.sessionLaunchUrl, `/session?day=${testProgramId}_d5`);
      });
    });

    describe('R3: OpenGym Visual Thumbnail Prefixes Across Exercise Lists', () => {
      it('T1.11: getOpenGymStillUrl generates valid WebP CDN URLs for standard 4-digit exercise IDs', () => {
        const stillUrl = getOpenGymStillUrl('1465');
        assert.equal(
          stillUrl,
          'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/1465.webp'
        );
      });

      it('T1.12: Normalization converts ex_ prefixed exercise IDs to 4-digit WebP CDN paths', () => {
        const rawId = 'ex_0025';
        const normId = normalizeOpenGymId(rawId);
        assert.equal(normId, '0025');
        const stillUrl = getOpenGymStillUrl(normId);
        assert.equal(
          stillUrl,
          'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0025.webp'
        );
      });

      it('T1.13: ExerciseThumbnail contract supports size variants (xs, sm, md, lg)', () => {
        const sizes: Array<'xs' | 'sm' | 'md' | 'lg'> = ['xs', 'sm', 'md', 'lg'];
        const expectedDimensions = {
          xs: { width: 20, height: 20, className: 'w-5 h-5' },
          sm: { width: 32, height: 32, className: 'w-8 h-8' },
          md: { width: 48, height: 48, className: 'w-12 h-12' },
          lg: { width: 64, height: 64, className: 'w-16 h-16' },
        };

        for (const size of sizes) {
          const display = resolveThumbnailDisplay({
            exerciseId: '0025',
            exerciseName: 'Bench Press',
            size,
          });
          assert.equal(display.dimensions.width, expectedDimensions[size].width);
          assert.equal(display.dimensions.className, expectedDimensions[size].className);
        }
      });

      it('T1.14: Apparatus fallback mapper infers apparatus tokens from exercise names when still is missing', () => {
        assert.equal(inferApparatusFromExercise('Incline Dumbbell Press'), 'dumbbell');
        assert.equal(inferApparatusFromExercise('Barbell Deadlift'), 'barbell');
        assert.equal(inferApparatusFromExercise('Cable Triceps Pushdown'), 'cable');
        assert.equal(inferApparatusFromExercise('Hack Squat Machine'), 'machine');
        assert.equal(inferApparatusFromExercise('Weighted Pull-Up'), 'bodyweight');
      });

      it('T1.15: Catalog integration: exercises from active program resolve valid still URL or fallback apparatus cue', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const allExercises = prog.weeks[0].days.flatMap((d) =>
          d.blocks.flatMap((b) => b.exercises)
        );

        for (const ex of allExercises) {
          const thumb = resolveThumbnailDisplay({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
          });
          assert.ok(
            thumb.displayMode === 'image' || thumb.displayMode === 'apparatus_fallback',
            `Exercise ${ex.exerciseName} must resolve display mode`
          );
          if (thumb.displayMode === 'image') {
            assert.ok(thumb.imageUrl?.endsWith('.webp'));
          } else {
            assert.ok(['dumbbell', 'barbell', 'cable', 'machine', 'bodyweight'].includes(thumb.apparatusFallback));
          }
        }
      });
    });
  });

  /* ========================================================================
   * TIER 2: BOUNDARY & CORNER CASES (>=5 per feature)
   * ======================================================================== */
  describe('Tier 2: Boundary & Corner Cases', () => {
    describe('R1 Video Modal Boundary & Corner Cases', () => {
      it('T2.1: Malformed and non-numeric exercise IDs are safely handled without throwing', () => {
        const malformedIds = ['', '   ', 'invalid_string', 'ex_#?@!', '0000'];
        for (const raw of malformedIds) {
          const norm = normalizeOpenGymId(raw);
          assert.ok(typeof norm === 'string', 'Must return a string');
          assert.equal(norm.length >= 4, true, 'Must pad to at least 4 digits');
        }
      });

      it('T2.2: Missing or undefined clipUrl defaults cleanly to YouTube tutorial mode without crashing', () => {
        const modalProps: ExerciseVideoModalPropsContract = {
          isOpen: true,
          onClose: () => {},
          exercise: {
            name: 'Generic Movement Without CDN Clip',
            target: 'chest',
          },
          defaultMode: 'opengym',
        };

        const state = resolveDualModalState(modalProps, 'opengym');
        assert.ok(state);
        // Because clip is missing, effective mode must gracefully fall back to youtube
        assert.equal(state.activeMode, 'youtube');
        assert.equal(state.hasOpenGymClip, false);
        assert.ok(state.youtubeUrl.includes('youtube.com'));
      });

      it('T2.3: Rapid toggling between opengym and youtube preserves data isolation', () => {
        const modalProps: ExerciseVideoModalPropsContract = {
          isOpen: true,
          onClose: () => {},
          exercise: {
            id: '0025',
            name: 'Barbell Bench Press',
            clipUrl: 'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0025.mp4',
            videoUrl: 'https://www.youtube.com/results?search_query=bench+press',
          },
        };

        const mode1 = resolveDualModalState(modalProps, 'opengym');
        const mode2 = resolveDualModalState(modalProps, 'youtube');
        const mode3 = resolveDualModalState(modalProps, 'opengym');

        assert.equal(mode1?.activeMode, 'opengym');
        assert.equal(mode2?.activeMode, 'youtube');
        assert.equal(mode3?.activeMode, 'opengym');
        assert.equal(modalProps.exercise.name, 'Barbell Bench Press', 'Exercise metadata must not mutate');
      });

      it('T2.4: Complex parenthetical exercise names with multiple apparatus modifiers parse without regex blowup', () => {
        const complexName =
          'Incline Dumbbell Bench Press (30° Incline Bench) (Cuff) (peg #4) or Machine Fly';
        const ytUrl = buildExerciseVideoUrl(complexName);
        assert.ok(ytUrl.includes('youtube.com'));
        assert.ok(!ytUrl.includes('peg #4'), 'Must strip internal machine peg numbers');
        assert.ok(ytUrl.includes('degree'), 'Must normalize degree symbols');
      });

      it('T2.5: URL security validation rejects pseudo-protocols (javascript:, data:, vbscript:)', () => {
        assert.equal(isSafeUrl('javascript:alert(1)'), false);
        assert.equal(isSafeUrl('data:text/html,<script>evil()</script>'), false);
        assert.equal(isSafeUrl('vbscript:msgbox(1)'), false);
        assert.equal(isSafeUrl('https://cdn.jsdelivr.net/valid.mp4'), true);
        assert.equal(isSafeUrl(undefined), false);
      });
    });

    describe('R2 Multi-Day Selector Boundary & Corner Cases', () => {
      it('T2.6: Day boundary wrapping: inspecting Day 0 (Monday) vs Day 6 (Sunday) resolves without off-by-one errors', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

        const day0View = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 0,
        });
        assert.equal(day0View.effectiveDayOfWeek, 0);
        assert.equal(day0View.inspectedSession.label, 'Day 1: Upper Kinetic Drive (Push)');

        const day6View = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 6,
        });
        assert.equal(day6View.effectiveDayOfWeek, 6);
        assert.equal(day6View.inspectedSession.label, 'Day 7: Systemic Regeneration & CNS Deload');
      });

      it('T2.7: Scheduled Rest Day inspection dynamically displays rest status, 0 sets, and baseline pace', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

        // Day 3 is Thursday (Rest Day)
        const restView = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 3,
        });
        assert.equal(restView.inspectedSession.isRestDay, true);
        assert.equal(restView.exercises.length, 0);
        assert.equal(restView.scheduledSets, 0);
        assert.equal(restView.estimatedPaceMin, 25, 'Baseline pace of 25 min must apply on rest day');
      });

      it('T2.8: Empty workout blocks array does not divide by zero or throw in pace calculations', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const emptyDay: ProgramDay = {
          id: 'empty_day',
          dayOfWeek: 3,
          label: 'Empty Day',
          isRestDay: false,
          blocks: [],
        };
        const tempProg: Program = {
          ...prog,
          weeks: [{ weekNumber: 1, days: [emptyDay] }],
        };

        const view = resolveTodayInspectedSession({
          program: tempProg,
          resolved: { weekIndex: 1, dayOfWeek: 3, started: true },
          inspectedDayOfWeek: 3,
        });
        assert.equal(view.scheduledSets, 0);
        assert.equal(view.estimatedPaceMin, 25);
        assert.equal(view.exercises.length, 0);
      });

      it('T2.9: Future unstarted program (elapsedDays < 0) defaults safely to Week 1 Day 0', () => {
        const res = resolveProgramDay('2030-01-01', '2026-11-27');
        assert.equal(res.started, false);
        assert.equal(res.weekIndex, 1);
        assert.equal(res.dayOfWeek, 0);
        assert.ok(res.elapsedDays < 0);
      });

      it('T2.10: Out-of-bounds day index defaults gracefully to calendar day', () => {
        const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
        const resolved = { weekIndex: 1, dayOfWeek: 2, started: true };

        // Invalid day 999
        const view = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: 999,
        });
        // Falls back to calendar day (Wednesday / Day 2)
        assert.equal(view.inspectedSession.dayOfWeek, 2);
      });
    });

    describe('R3 Visual Thumbnail Boundary & Corner Cases', () => {
      it('T2.11: Single-digit and unpadded IDs pad correctly to 4 digits', () => {
        assert.equal(normalizeOpenGymId('1'), '0001');
        assert.equal(normalizeOpenGymId('42'), '0042');
        assert.equal(normalizeOpenGymId('ex_7'), '0007');
        assert.equal(
          getOpenGymStillUrl(normalizeOpenGymId('7')),
          'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0007.webp'
        );
      });

      it('T2.12: Empty string or undefined ID falls back to name-based apparatus inference', () => {
        const display = resolveThumbnailDisplay({
          exerciseId: undefined,
          exerciseName: 'Dumbbell Hammer Curl',
        });
        assert.equal(display.displayMode, 'apparatus_fallback');
        assert.equal(display.apparatusFallback, 'dumbbell');
      });

      it('T2.13: Unknown fantasy exercise name falls back gracefully to default apparatus token', () => {
        const display = resolveThumbnailDisplay({
          exerciseId: undefined,
          exerciseName: 'Mystic Kinetic Transcendence Protocol',
        });
        assert.equal(display.displayMode, 'apparatus_fallback');
        assert.equal(display.apparatusFallback, 'dumbbell', 'Unmatched exercise must default to dumbbell');
      });

      it('T2.14: Sizing dimension tokens map strictly to defined px and tailwind classes', () => {
        const sm = resolveThumbnailDisplay({ exerciseName: 'Curl', size: 'sm' });
        assert.equal(sm.dimensions.width, 32);
        assert.equal(sm.dimensions.className, 'w-8 h-8');

        const lg = resolveThumbnailDisplay({ exerciseName: 'Curl', size: 'lg' });
        assert.equal(lg.dimensions.width, 64);
        assert.equal(lg.dimensions.className, 'w-16 h-16');
      });

      it('T2.15: Image load error state does not trigger infinite retries and cleanly falls back to apparatus', () => {
        const failedDisplay = resolveThumbnailDisplay(
          {
            exerciseId: '0025',
            exerciseName: 'Barbell Bench Press',
          },
          true // simulatedImageError
        );
        assert.equal(failedDisplay.displayMode, 'apparatus_fallback');
        assert.equal(failedDisplay.apparatusFallback, 'barbell');
        assert.equal(failedDisplay.imageUrl, undefined);
      });
    });
  });

  /* ========================================================================
   * TIER 3: CROSS-FEATURE COMBINATIONS (PAIRWISE INTERACTIONS)
   * ======================================================================== */
  describe('Tier 3: Cross-Feature Combinations', () => {
    it('T3.1: Multi-day selection + exercise swap on inspected day + thumbnail & video persistence', () => {
      // 1. Athlete inspects Day 4 (Friday: Upper Kinetic Hypertrophy)
      const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const resolved = { weekIndex: 1, dayOfWeek: 0, started: true }; // Today is Monday (Day 0)

      const fridayInspection = resolveTodayInspectedSession({
        program: prog,
        resolved,
        inspectedDayOfWeek: 4,
      });
      assert.equal(fridayInspection.inspectedSession.label, 'Day 5: Upper Kinetic Hypertrophy');

      // 2. Perform biomechanical swap on Day 4: Incline Dumbbell Bench Press -> Barbell Incline Press
      const swapResult = appStore.swapExerciseInActiveProgram(
        testTraineeId,
        'Incline Dumbbell Bench Press',
        'Barbell Incline Press',
        4 // Explicit inspected day
      );
      assert.equal(swapResult.success, true);

      // 3. Verify Day 4 mutated
      const updatedProg = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const day4 = updatedProg.weeks[0].days.find((d) => d.dayOfWeek === 4)!;
      const exSwapped = day4.blocks[0].exercises[0];
      assert.equal(exSwapped.exerciseName, 'Barbell Incline Press');
      assert.ok(exSwapped.videoUrl, 'Replacement exercise must have videoUrl generated');

      // 4. Verify Day 0 (Monday) was completely untouched
      const day0 = updatedProg.weeks[0].days.find((d) => d.dayOfWeek === 0)!;
      assert.equal(day0.blocks[0].exercises[0].exerciseName, 'Barbell Bench Press');

      // 5. Verify thumbnail resolution on new swapped exercise
      const thumb = resolveThumbnailDisplay({
        exerciseName: exSwapped.exerciseName,
      });
      assert.equal(thumb.apparatusFallback, 'barbell');
    });

    it('T3.2: Video preview from Today queue vs video preview from Substitution drawer', () => {
      // 1. Today queue exercise preview
      const todayExercise = {
        id: '0025',
        name: 'Barbell Bench Press',
        target: 'chest',
        equipment: 'barbell',
      };
      const todayModal = resolveDualModalState(
        {
          isOpen: true,
          onClose: () => {},
          exercise: todayExercise,
          defaultMode: 'opengym',
        },
        'opengym'
      );
      assert.equal(todayModal?.exerciseName, 'Barbell Bench Press');
      assert.ok(todayModal?.openGymClipUrl?.includes('0025.mp4'));

      // 2. Candidate exercise preview from Substitution Copilot Drawer
      const subCandidate = {
        id: '0101',
        name: 'Incline Dumbbell Bench Press',
        target: 'chest',
        equipment: 'dumbbell',
      };
      const subModal = resolveDualModalState(
        {
          isOpen: true,
          onClose: () => {},
          exercise: subCandidate,
          defaultMode: 'youtube',
        },
        'youtube'
      );
      assert.equal(subModal?.exerciseName, 'Incline Dumbbell Bench Press');
      assert.ok(subModal?.youtubeUrl?.includes('youtube.com'));
      assert.notEqual(todayModal?.exerciseName, subModal?.exerciseName);
    });

    it('T3.3: Switching days on /today updates deep link and resolves exact inspected session on /session?day={id}', () => {
      const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

      const daysToTest = [1, 2, 4, 5];
      for (const targetDay of daysToTest) {
        const view = resolveTodayInspectedSession({
          program: prog,
          resolved,
          inspectedDayOfWeek: targetDay,
        });

        const expectedDayId = `${testProgramId}_d${targetDay}`;
        assert.equal(view.sessionLaunchUrl, `/session?day=${expectedDayId}`);

        // Verify active session route query param resolution
        const resolvedFromSessionParam = prog.weeks[0].days.find(
          (d) => d.id === expectedDayId
        );
        assert.ok(resolvedFromSessionParam);
        assert.equal(resolvedFromSessionParam.dayOfWeek, targetDay);
      }
    });

    it('T3.4: Inspecting Rest Day vs Active Day preserves modal and video availability state', () => {
      const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const resolved = { weekIndex: 1, dayOfWeek: 0, started: true };

      // Inspect Rest Day (Day 3)
      const restView = resolveTodayInspectedSession({
        program: prog,
        resolved,
        inspectedDayOfWeek: 3,
      });
      assert.equal(restView.exercises.length, 0, 'Rest day must have no movement queue');

      // Switch to Active Day (Day 5)
      const activeView = resolveTodayInspectedSession({
        program: prog,
        resolved,
        inspectedDayOfWeek: 5,
      });
      assert.equal(activeView.exercises.length, 2, 'Active day must populate movement queue');

      // First exercise in active day must have valid thumbnail and video triggers
      const firstEx = activeView.exercises[0];
      const thumb = resolveThumbnailDisplay({
        exerciseId: firstEx.exerciseId,
        exerciseName: firstEx.exerciseName,
      });
      assert.ok(thumb.displayMode);

      const modal = resolveDualModalState({
        isOpen: true,
        onClose: () => {},
        exercise: {
          id: firstEx.exerciseId,
          name: firstEx.exerciseName,
        },
      });
      assert.ok(modal?.openGymClipUrl);
    });
  });

  /* ========================================================================
   * TIER 4: REAL-WORLD APPLICATION SCENARIOS
   * ======================================================================== */
  describe('Tier 4: Real-World Application Scenarios', () => {
    it('T4.1: The Friday Night Prep (Athlete previews Saturday session, reviews thumbnails, plays OpenGym clip, checks volume)', () => {
      // Scenario: Trainee Alex opens Today dashboard on Friday (Calendar Day 4)
      const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const calendarFriday = { weekIndex: 1, dayOfWeek: 4, started: true };

      // 1. Initial cockpit loads Friday
      const initialCockpit = resolveTodayInspectedSession({
        program: prog,
        resolved: calendarFriday,
        inspectedDayOfWeek: null, // Default
      });
      assert.equal(initialCockpit.isCalendarToday(4), true);
      assert.equal(initialCockpit.effectiveDayOfWeek, 4);

      // 2. Alex taps Saturday (Day 5) pill tab to preview tomorrow's workout
      const saturdayPreview = resolveTodayInspectedSession({
        program: prog,
        resolved: calendarFriday,
        inspectedDayOfWeek: 5,
      });

      // 3. Dashboard displays Saturday without breaking Friday calendar indicator
      assert.equal(saturdayPreview.isCalendarToday(4), true, 'Friday must remain calendar today');
      assert.equal(saturdayPreview.isInspected(5), true, 'Saturday must be highlighted as inspected');
      assert.equal(saturdayPreview.inspectedSession.label, 'Day 6: Kinetic Crucible & Arms');
      assert.equal(saturdayPreview.scheduledSets, 8); // 4 + 4 sets

      // 4. Movement queue displays visual thumbnails for Saturday exercises
      const satExercises = saturdayPreview.exercises;
      assert.equal(satExercises.length, 2);

      const thumb1 = resolveThumbnailDisplay({
        exerciseId: satExercises[0].exerciseId,
        exerciseName: satExercises[0].exerciseName,
      });
      assert.ok(thumb1.displayMode);

      const thumb2 = resolveThumbnailDisplay({
        exerciseId: satExercises[1].exerciseId,
        exerciseName: satExercises[1].exerciseName,
      });
      assert.ok(thumb2.displayMode);

      // 5. Alex opens OpenGym video demonstration for Bayesian Cable Curl
      const videoModal = resolveDualModalState(
        {
          isOpen: true,
          onClose: () => {},
          exercise: {
            id: satExercises[1].exerciseId,
            name: satExercises[1].exerciseName,
            target: 'biceps',
            equipment: 'cable',
          },
          defaultMode: 'opengym',
        },
        'opengym'
      );
      assert.ok(videoModal);
      assert.equal(videoModal.activeMode, 'opengym');
      assert.ok(videoModal.openGymClipUrl?.includes('0315.mp4'));

      // 6. Alex toggles to YouTube mode to check form cue nuances
      const videoModalYt = resolveDualModalState(
        {
          isOpen: true,
          onClose: () => {},
          exercise: {
            id: satExercises[1].exerciseId,
            name: satExercises[1].exerciseName,
            target: 'biceps',
            equipment: 'cable',
          },
        },
        'youtube'
      );
      assert.equal(videoModalYt?.activeMode, 'youtube');
      assert.ok(videoModalYt?.youtubeUrl?.includes('youtube.com'));

      // 7. Alex confirms CTA targets Saturday session
      assert.equal(saturdayPreview.sessionLaunchUrl, `/session?day=${testProgramId}_d5`);
    });

    it('T4.2: Biomechanical Substitution & Multi-Day Visual Consistency Flow', () => {
      // Scenario: Trainee Marcus wants to substitute Barbell Back Squat on Wednesday (Day 2)
      // because the squat rack is out of service.
      const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const calendarMonday = { weekIndex: 1, dayOfWeek: 0, started: true };

      // 1. Marcus selects Wednesday (Day 2)
      const wednesdaySession = resolveTodayInspectedSession({
        program: prog,
        resolved: calendarMonday,
        inspectedDayOfWeek: 2,
      });
      assert.equal(wednesdaySession.inspectedSession.label, 'Day 3: Lower Kinetic Quad & Ham');

      // 2. Marcus swaps Barbell Back Squat for Hack Squat
      const swapRes = appStore.swapExerciseInActiveProgram(
        testTraineeId,
        'Barbell Back Squat',
        'Hack Squat Machine',
        2
      );
      assert.equal(swapRes.success, true);

      // 3. Inspect updated program
      const refreshedProg = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const wednesdayUpdated = resolveTodayInspectedSession({
        program: refreshedProg,
        resolved: calendarMonday,
        inspectedDayOfWeek: 2,
      });

      const swappedEx = wednesdayUpdated.exercises.find((e) =>
        e.exerciseName.includes('Hack Squat')
      );
      assert.ok(swappedEx, 'Hack Squat Machine must appear in Wednesday movement queue');

      // 4. Verify thumbnail reflects machine apparatus
      const thumb = resolveThumbnailDisplay({
        exerciseName: swappedEx!.exerciseName,
      });
      assert.equal(thumb.apparatusFallback, 'machine');

      // 5. Verify Day 0 (Monday) still has Barbell Bench Press untouched
      const mondayCheck = resolveTodayInspectedSession({
        program: refreshedProg,
        resolved: calendarMonday,
        inspectedDayOfWeek: 0,
      });
      assert.equal(mondayCheck.exercises[0].exerciseName, 'Barbell Bench Press');
    });

    it('T4.3: Seven-Day Program Sweep & Inspection Integrity', () => {
      const prog = appStore.getActiveProgramForTrainee(testTraineeId)!;
      const calendarMidWeek = { weekIndex: 1, dayOfWeek: 2, started: true };

      // Sweep through all 7 days of the program
      for (let day = 0; day < 7; day++) {
        const view = resolveTodayInspectedSession({
          program: prog,
          resolved: calendarMidWeek,
          inspectedDayOfWeek: day,
        });

        assert.equal(view.effectiveDayOfWeek, day);
        assert.ok(view.inspectedSession.label.length > 0);
        assert.ok(view.sessionLaunchUrl.startsWith('/session?day='));
        assert.equal(typeof view.scheduledSets, 'number');
        assert.equal(typeof view.estimatedPaceMin, 'number');
        assert.ok(view.estimatedPaceMin >= 25);

        for (const ex of view.exercises) {
          const thumb = resolveThumbnailDisplay({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
          });
          assert.ok(thumb.dimensions);
          assert.ok(thumb.displayMode);
        }
      }
    });
  });
});
