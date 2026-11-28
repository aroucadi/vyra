import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOpenGymId,
  getOpenGymClipUrl,
  getOpenGymStillUrl,
  buildExerciseVideoUrl,
  resolveExerciseVideoUrl,
  isDirectVideoUrl,
  isSafeUrl,
  inferApparatusFromExercise,
  resolveProgramDay,
} from '../../../src/lib/utils';
import { appStore } from '../../../src/lib/store';
import type { Program, ProgramDay, WorkoutSession } from '../../../src/lib/types';

/**
 * PURE STATE SIMULATORS FOR TIER-5 ADVERSARIAL VERIFICATION
 * Mirrors the exact component logic in:
 * - src/components/trainee/ExerciseVideoModal.tsx
 * - src/app/(trainee)/today/page.tsx
 * - src/components/trainee/ExerciseThumbnail.tsx
 */

interface ModalStateSimulator {
  activeMode: 'opengym' | 'youtube';
  isPlaying: boolean;
  isMuted: boolean;
  hasVideoError: boolean;
}

function simulateExerciseVideoModal(params: {
  exercise: {
    id?: string;
    name: string;
    target?: string;
    equipment?: string;
    instructions?: string[];
    videoUrl?: string;
    clipUrl?: string;
    stillUrl?: string;
    imageUrl?: string;
    formCue?: string;
  } | null;
  defaultMode?: 'opengym' | 'youtube';
  actions?: Array<
    | { type: 'switchMode'; mode: 'opengym' | 'youtube' }
    | { type: 'togglePlay' }
    | { type: 'toggleMute' }
    | { type: 'videoError' }
    | { type: 'videoSuccess' }
  >;
}) {
  if (!params.exercise) return null;

  const ex = params.exercise;
  const opengymClipUrl =
    ex.clipUrl ||
    (ex.id ? getOpenGymClipUrl(ex.id) : undefined) ||
    (isDirectVideoUrl(ex.videoUrl) ? ex.videoUrl : undefined);

  const opengymStillUrl =
    ex.stillUrl ||
    ex.imageUrl ||
    (ex.id ? getOpenGymStillUrl(ex.id) : undefined);

  const youtubeUrl =
    ex.videoUrl && !isDirectVideoUrl(ex.videoUrl)
      ? ex.videoUrl
      : buildExerciseVideoUrl(ex.name, {
          equipment: ex.equipment,
          targetMuscle: ex.target,
        });

  let state: ModalStateSimulator = {
    activeMode: params.defaultMode || 'opengym',
    isPlaying: true,
    isMuted: true,
    hasVideoError: false,
  };

  if (params.actions) {
    for (const action of params.actions) {
      if (action.type === 'switchMode') {
        state.activeMode = action.mode;
        if (action.mode === 'youtube') {
          state.isPlaying = false;
        } else if (action.mode === 'opengym') {
          state.isPlaying = true;
        }
      } else if (action.type === 'togglePlay') {
        state.isPlaying = !state.isPlaying;
      } else if (action.type === 'toggleMute') {
        state.isMuted = !state.isMuted;
      } else if (action.type === 'videoError') {
        state.hasVideoError = true;
      } else if (action.type === 'videoSuccess') {
        state.hasVideoError = false;
      }
    }
  }

  const effectiveMode =
    state.activeMode === 'opengym' && (!opengymClipUrl || state.hasVideoError)
      ? 'youtube'
      : state.activeMode;

  return {
    state,
    effectiveMode,
    opengymClipUrl,
    opengymStillUrl,
    youtubeUrl,
    hasUsableClip: Boolean(opengymClipUrl && !state.hasVideoError),
  };
}

function simulateTodayCockpit(params: {
  program?: Program;
  resolved: { weekIndex: number; dayOfWeek: number; started: boolean };
  inspectedDayOfWeek: number | null;
}) {
  const prog = params.program;
  const currentWeekIdx = prog?.weeks
    ? Math.min(Math.max(0, params.resolved.weekIndex - 1), prog.weeks.length - 1)
    : 0;
  const currentWeek = prog?.weeks?.[currentWeekIdx];

  const currentInspectedDay =
    typeof params.inspectedDayOfWeek === 'number'
      ? params.inspectedDayOfWeek
      : params.resolved.dayOfWeek;

  const todaySession = currentWeek?.days?.find((d) => d.dayOfWeek === params.resolved.dayOfWeek);
  const displaySession = currentWeek?.days
    ? currentWeek.days.find((d) => d.dayOfWeek === currentInspectedDay) ||
      todaySession ||
      currentWeek.days[0]
    : undefined;

  const isInspectingDifferentDay = Boolean(
    currentWeek?.days && currentInspectedDay !== params.resolved.dayOfWeek
  );

  const displayExercises = displaySession?.blocks
    ? displaySession.blocks.flatMap((b) => b.exercises)
    : [];

  const displayScheduledSets = displayExercises.reduce((sum, e) => sum + (e.sets || 0), 0);
  const estimatedPaceMin = Math.round(Math.max(25, displayScheduledSets * 2.5));
  const isRestDay = displaySession
    ? Boolean(displaySession.isRestDay || displayExercises.length === 0)
    : false;

  const sessionLaunchUrl = `/session?day=${displaySession?.id || 'day_1'}`;

  return {
    currentInspectedDay,
    isInspectingDifferentDay,
    displaySession,
    displayExercises,
    displayScheduledSets,
    estimatedPaceMin,
    isRestDay,
    sessionLaunchUrl,
  };
}

function simulateThumbnail(params: {
  exerciseId?: string;
  exerciseName: string;
  stillUrl?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  equipment?: string;
  simulatedErrorUrl?: string;
}) {
  let candidateUrl: string | undefined = undefined;
  if (params.stillUrl && params.stillUrl.trim()) {
    candidateUrl = params.stillUrl.trim();
  } else if (params.imageUrl && params.imageUrl.trim()) {
    candidateUrl = params.imageUrl.trim();
  } else if (params.exerciseId && /\d/.test(params.exerciseId)) {
    candidateUrl = getOpenGymStillUrl(params.exerciseId);
  }

  const resolvedUrl = candidateUrl && isSafeUrl(candidateUrl) ? candidateUrl : undefined;
  const hasError = Boolean(resolvedUrl && params.simulatedErrorUrl === resolvedUrl);
  const apparatus = inferApparatusFromExercise(params.exerciseName, params.equipment);

  const sizeStyles = {
    xs: { container: 'w-5 h-5 rounded-md', icon: 'w-3 h-3' },
    sm: { container: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
    md: { container: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6' },
    lg: { container: 'w-16 h-16 rounded-xl', icon: 'w-8 h-8' },
  }[params.size || 'sm'] || { container: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' };

  return {
    resolvedUrl,
    hasError,
    rendersImage: Boolean(resolvedUrl && !hasError),
    rendersApparatusFallback: !resolvedUrl || hasError,
    apparatus,
    sizeStyles,
  };
}

function createMultiDayProgram(traineeId: string, programId: string): Program {
  return {
    id: programId,
    traineeId,
    title: 'Kinetic Hypertrophy Mastery 7-Day Program',
    startDate: '2026-11-23', // Monday
    status: 'published',
    durationWeeks: 12,
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
                label: 'Main Pull',
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
                label: 'Squat Compound',
                exercises: [
                  {
                    id: 'ep_d2_1',
                    exerciseId: '0032',
                    exerciseName: 'Barbell Back Squat',
                    sets: 4,
                    repRangeLow: 6,
                    repRangeHigh: 8,
                    targetMuscleGroups: ['quads'],
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
                label: 'Incline Focus',
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
                    exerciseId: '0576',
                    exerciseName: 'Cable Lateral Raise', // Duplicate exercise across week
                    sets: 3,
                    repRangeLow: 12,
                    repRangeHigh: 15,
                    targetMuscleGroups: ['side delts'],
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
                label: 'Arm Work',
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

describe('Trainee Adversarial Coverage Hardening Suite (Tier 5)', () => {
  const traineeAlpha = 'trainee_tier5_alpha';
  const traineeBeta = 'trainee_tier5_beta';
  const progIdAlpha = 'prog_tier5_alpha_7d';
  const progIdBeta = 'prog_tier5_beta_7d';

  beforeEach(() => {
    appStore.reset();
    const p1 = createMultiDayProgram(traineeAlpha, progIdAlpha);
    const p2 = createMultiDayProgram(traineeBeta, progIdBeta);
    appStore.saveProgram(p1);
    appStore.saveProgram(p2);
    appStore.publishProgram(progIdAlpha);
    appStore.publishProgram(progIdBeta);
  });

  /* ========================================================================
   * SUITE 1: MALFORMED MEDIA, PROTOCOL SECURITY & NORMALIZATION HARDENING
   * ======================================================================== */
  describe('1. Malformed Media, Protocol Security & Normalization Hardening', () => {
    it('handles extreme and adversarial inputs to normalizeOpenGymId without throwing', () => {
      const inputs = [
        '',
        '   ',
        '\t\n',
        'no_numbers_at_all',
        'ex_#$@%^&*()',
        'ex_99999999',
        '--123',
        '0',
        '000',
        'ex_0',
        'ex_00000042',
      ];

      for (const input of inputs) {
        const result = normalizeOpenGymId(input);
        assert.ok(typeof result === 'string', `Expected string for input: "${input}"`);
        assert.ok(result.length >= 4, `Expected at least 4 chars padding for: "${input}", got: "${result}"`);
      }

      // Exact normalization checks
      assert.equal(normalizeOpenGymId('0'), '0000');
      assert.equal(normalizeOpenGymId('ex_7'), '0007');
      assert.equal(normalizeOpenGymId('ex_42'), '0042');
      assert.equal(normalizeOpenGymId('ex_576'), '0576');
      assert.equal(normalizeOpenGymId('ex_1465'), '1465');
      assert.equal(normalizeOpenGymId('1465'), '1465');
    });

    it('validates protocol security against pseudo-protocols, malformed URIs, and XSS vectors', () => {
      const hostileUrls = [
        'javascript:alert("pwned")',
        'JAVASCRIPT:alert(1)',
        'Javascript:void(0)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("hello")',
        'file:///etc/passwd',
        'blob:https://example.com/uuid',
        'ftp://malicious.host/file.mp4',
        '//cdn.jsdelivr.net/rel.mp4', // Protocol relative without http/https
        '',
        '   ',
        'not a url at all',
      ];

      for (const url of hostileUrls) {
        assert.equal(isSafeUrl(url), false, `Hostile URL should be rejected: ${url}`);
      }

      const safeUrls = [
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0025.mp4',
        'https://www.youtube.com/results?search_query=bench+press',
        'http://localhost:3000/media/sample.webp',
      ];

      for (const url of safeUrls) {
        assert.equal(isSafeUrl(url), true, `Safe URL should be accepted: ${url}`);
      }
    });

    it('buildExerciseVideoUrl handles complex parentheticals, unmatched brackets, emojis, and SQL strings', () => {
      const adversarialNames = [
        'Incline Dumbbell Press ((Chest-Supported)) ((30° Incline))',
        'Reverse Fly (Cuff (Peg #3) [Extra Tension])',
        'Press (Unclosed parenthetical',
        'Closed parenthetical) without open',
        'Bicep Curl 🔥 100% Extreme (3-Sec Eccentric)',
        'Bench Press; DROP TABLE exercises; --',
        '<script>alert("xss")</script>',
        '   \t\n   ',
      ];

      for (const name of adversarialNames) {
        const url = buildExerciseVideoUrl(name);
        assert.ok(url.startsWith('https://www.youtube.com/results?search_query='));
        assert.ok(url.includes('sp=EgIYAQ%3D%3D'), 'Must retain short duration filter');
        // Check URL is parseable
        const parsed = new URL(url);
        const query = parsed.searchParams.get('search_query');
        assert.ok(query && query.length > 0, `Search query must not be empty for name: "${name}"`);
        assert.equal(parsed.protocol, 'https:');
        assert.equal(parsed.hostname, 'www.youtube.com');
        // Ensure raw URL does not contain unescaped HTML tag characters
        assert.ok(!url.includes('<script>'), 'Raw URL must properly percent-encode HTML tags');
      }
    });

    it('resolveExerciseVideoUrl adheres strictly to security checks on passed clipUrl and explicitVideoUrl', () => {
      // Unsafe clipUrl rejected -> falls back to YouTube search
      const resUnsafeClip = resolveExerciseVideoUrl('Bench Press', {
        clipUrl: 'javascript:stealCredentials()',
      });
      assert.ok(resUnsafeClip.startsWith('https://www.youtube.com/results'));
      assert.ok(!resUnsafeClip.includes('javascript:'));

      // Unsafe explicitVideoUrl rejected
      const resUnsafeVideo = resolveExerciseVideoUrl('Bench Press', {
        explicitVideoUrl: 'data:text/html,<script>alert(1)</script>',
      });
      assert.ok(resUnsafeVideo.startsWith('https://www.youtube.com/results'));

      // Valid clip prioritized
      const resValidClip = resolveExerciseVideoUrl('Bench Press', {
        clipUrl: 'https://cdn.jsdelivr.net/valid.mp4',
      });
      assert.equal(resValidClip, 'https://cdn.jsdelivr.net/valid.mp4');
    });
  });

  /* ========================================================================
   * SUITE 2: DUAL-MODAL VIDEO MODAL CONTRACT & MODALITY STATE STRESS
   * ======================================================================== */
  describe('2. Dual-Modal Video Modal Contract & Modality State Stress', () => {
    it('simulates rapid switching between OpenGym 3D clip and YouTube tutorial preserving state isolation', () => {
      const exercise = {
        id: '0025',
        name: 'Barbell Bench Press',
        target: 'chest',
        equipment: 'barbell',
        clipUrl: 'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0025.mp4',
        videoUrl: 'https://www.youtube.com/results?search_query=bench+press',
      };

      // 1. Initial opengym mode -> playing=true, muted=true
      const sim1 = simulateExerciseVideoModal({
        exercise,
        defaultMode: 'opengym',
      });
      assert.ok(sim1);
      assert.equal(sim1.effectiveMode, 'opengym');
      assert.equal(sim1.state.isPlaying, true);
      assert.equal(sim1.state.isMuted, true);

      // 2. Switch to YouTube mode -> pauses video player
      const sim2 = simulateExerciseVideoModal({
        exercise,
        defaultMode: 'opengym',
        actions: [{ type: 'switchMode', mode: 'youtube' }],
      });
      assert.ok(sim2);
      assert.equal(sim2.effectiveMode, 'youtube');
      assert.equal(sim2.state.isPlaying, false);

      // 3. Switch back to OpenGym mode -> resumes playing
      const sim3 = simulateExerciseVideoModal({
        exercise,
        defaultMode: 'opengym',
        actions: [
          { type: 'switchMode', mode: 'youtube' },
          { type: 'switchMode', mode: 'opengym' },
        ],
      });
      assert.ok(sim3);
      assert.equal(sim3.effectiveMode, 'opengym');
      assert.equal(sim3.state.isPlaying, true);
    });

    it('falls back seamlessly to YouTube tutorial if OpenGym clip encounters an error or is missing', () => {
      // Case A: Missing clipUrl and no numeric ID
      const exWithoutClip = {
        name: 'Custom Uncatalogued Movement',
        target: 'delts',
      };
      const simA = simulateExerciseVideoModal({
        exercise: exWithoutClip,
        defaultMode: 'opengym',
      });
      assert.ok(simA);
      // Because clip is missing, effectiveMode pivots to youtube
      assert.equal(simA.effectiveMode, 'youtube');
      assert.equal(simA.hasUsableClip, false);
      assert.ok(simA.youtubeUrl.includes('youtube.com'));

      // Case B: ClipUrl present, but simulated video error occurs during playback
      const exWithClip = {
        id: '0025',
        name: 'Barbell Bench Press',
        clipUrl: 'https://cdn.jsdelivr.net/invalid_path.mp4',
      };
      const simB = simulateExerciseVideoModal({
        exercise: exWithClip,
        defaultMode: 'opengym',
        actions: [{ type: 'videoError' }],
      });
      assert.ok(simB);
      assert.equal(simB.state.hasVideoError, true);
      assert.equal(simB.effectiveMode, 'youtube', 'Error must trigger fallback to YouTube');
      assert.equal(simB.hasUsableClip, false);

      // Case C: Error recovers when new valid video succeeds
      const simC = simulateExerciseVideoModal({
        exercise: exWithClip,
        defaultMode: 'opengym',
        actions: [{ type: 'videoError' }, { type: 'videoSuccess' }],
      });
      assert.ok(simC);
      assert.equal(simC.state.hasVideoError, false);
      assert.equal(simC.effectiveMode, 'opengym');
    });

    it('toggles audio mute and playback controls safely', () => {
      const exercise = {
        id: '0025',
        name: 'Bench Press',
      };
      const sim = simulateExerciseVideoModal({
        exercise,
        defaultMode: 'opengym',
        actions: [
          { type: 'togglePlay' }, // pause
          { type: 'toggleMute' }, // unmute
          { type: 'toggleMute' }, // mute again
          { type: 'togglePlay' }, // resume
        ],
      });
      assert.ok(sim);
      assert.equal(sim.state.isPlaying, true);
      assert.equal(sim.state.isMuted, true);
    });
  });

  /* ========================================================================
   * SUITE 3: EXERCISE THUMBNAIL APPARATUS INFERENCE & ERROR RESILIENCE
   * ======================================================================== */
  describe('3. Exercise Thumbnail Apparatus Inference & Error Resilience', () => {
    it('exhaustively infers apparatus tokens across diverse naming patterns and equipment cues', () => {
      const testCases: Array<{
        name: string;
        equipment?: string;
        expected: 'dumbbell' | 'barbell' | 'cable' | 'machine' | 'bodyweight';
      }> = [
        // Dumbbell
        { name: 'Incline Dumbbell Bench Press', expected: 'dumbbell' },
        { name: 'DB Spider Curl', expected: 'dumbbell' },
        { name: 'Single-Arm DB Lateral Raise', equipment: 'dumbbell', expected: 'dumbbell' },
        // Barbell
        { name: 'Barbell Back Squat', expected: 'barbell' },
        { name: 'BB Romanian Deadlift', expected: 'barbell' },
        { name: 'Olympic Snatch', equipment: 'barbell', expected: 'barbell' },
        // Cable
        { name: 'Cable Triceps Pushdown', expected: 'cable' },
        { name: 'Dual Cable Lat Pulldown', expected: 'cable' },
        { name: 'Cuff Lateral Raise', expected: 'cable' },
        { name: 'Straight Arm Pulldown', expected: 'cable' },
        // Machine
        { name: 'Hack Squat Machine', expected: 'machine' },
        { name: 'Pec Deck Fly', expected: 'machine' },
        { name: 'Lever Incline Chest Press', expected: 'machine' },
        { name: 'Press Machine (Plate Loaded)', expected: 'machine' },
        // Bodyweight
        { name: 'Neutral Grip Pull-up', expected: 'bodyweight' },
        { name: 'Wide Grip Chin Up', expected: 'bodyweight' },
        { name: 'Parallel Bar Dip', expected: 'bodyweight' },
        { name: 'Push-up (Deficit)', expected: 'bodyweight' },
        { name: 'Somatic Floor Mobility', equipment: 'body weight', expected: 'bodyweight' },
        // Fallback default
        { name: 'Mystic Kinetic Transcendence', expected: 'dumbbell' },
        { name: '', expected: 'dumbbell' },
      ];

      for (const tc of testCases) {
        const inferred = inferApparatusFromExercise(tc.name, tc.equipment);
        assert.equal(
          inferred,
          tc.expected,
          `Failed apparatus inference for "${tc.name}" (${tc.equipment})`
        );
      }
    });

    it('enforces URL precedence: explicit stillUrl -> explicit imageUrl -> OpenGym still CDN', () => {
      // 1. Explicit stillUrl takes top precedence
      const thumb1 = simulateThumbnail({
        exerciseId: '0025',
        exerciseName: 'Bench Press',
        stillUrl: 'https://custom.cdn/still1.webp',
        imageUrl: 'https://custom.cdn/image1.webp',
      });
      assert.equal(thumb1.resolvedUrl, 'https://custom.cdn/still1.webp');

      // 2. Explicit imageUrl takes second precedence
      const thumb2 = simulateThumbnail({
        exerciseId: '0025',
        exerciseName: 'Bench Press',
        stillUrl: undefined,
        imageUrl: 'https://custom.cdn/image2.webp',
      });
      assert.equal(thumb2.resolvedUrl, 'https://custom.cdn/image2.webp');

      // 3. Fallback to OpenGym still CDN with numeric ID
      const thumb3 = simulateThumbnail({
        exerciseId: '0576',
        exerciseName: 'Cable Lateral Raise',
      });
      assert.equal(
        thumb3.resolvedUrl,
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0576.webp'
      );

      // 4. If exerciseId has no digits, skip OpenGym still and render apparatus
      const thumb4 = simulateThumbnail({
        exerciseId: 'non_numeric_id',
        exerciseName: 'Cable Fly',
      });
      assert.equal(thumb4.resolvedUrl, undefined);
      assert.equal(thumb4.rendersApparatusFallback, true);
      assert.equal(thumb4.apparatus, 'cable');
    });

    it('handles image error state gracefully without crash and transitions cleanly to apparatus fallback', () => {
      const validUrl = 'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0032.webp';

      // Normal load
      const thumbLoaded = simulateThumbnail({
        exerciseId: '0032',
        exerciseName: 'Barbell Squat',
      });
      assert.equal(thumbLoaded.rendersImage, true);
      assert.equal(thumbLoaded.rendersApparatusFallback, false);

      // Simulated image network failure
      const thumbFailed = simulateThumbnail({
        exerciseId: '0032',
        exerciseName: 'Barbell Squat',
        simulatedErrorUrl: validUrl,
      });
      assert.equal(thumbFailed.hasError, true);
      assert.equal(thumbFailed.rendersImage, false);
      assert.equal(thumbFailed.rendersApparatusFallback, true);
      assert.equal(thumbFailed.apparatus, 'barbell');
    });

    it('maps sizing styles consistently across xs, sm, md, lg variants', () => {
      const sizes: Array<'xs' | 'sm' | 'md' | 'lg'> = ['xs', 'sm', 'md', 'lg'];
      const expectedTokens = {
        xs: { container: 'w-5 h-5 rounded-md', icon: 'w-3 h-3' },
        sm: { container: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
        md: { container: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6' },
        lg: { container: 'w-16 h-16 rounded-xl', icon: 'w-8 h-8' },
      };

      for (const size of sizes) {
        const thumb = simulateThumbnail({
          exerciseName: 'Dumbbell Curl',
          size,
        });
        assert.equal(thumb.sizeStyles.container, expectedTokens[size].container);
        assert.equal(thumb.sizeStyles.icon, expectedTokens[size].icon);
      }
    });
  });

  /* ========================================================================
   * SUITE 4: TODAY COCKPIT MULTI-DAY SELECTOR BOUNDARY WRAPPING & STATE DRIFT
   * ======================================================================== */
  describe('4. Today Cockpit Multi-Day Selector Boundary Wrapping & State Drift', () => {
    it('verifies boundary wrapping and 7-day schedule consistency across Mon (Day 0) to Sun (Day 6)', () => {
      const prog = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const resolvedCalendar = { weekIndex: 1, dayOfWeek: 0, started: true }; // Today is Monday

      // Sweep through Days 0..6
      for (let day = 0; day <= 6; day++) {
        const cockpit = simulateTodayCockpit({
          program: prog,
          resolved: resolvedCalendar,
          inspectedDayOfWeek: day,
        });

        assert.equal(cockpit.currentInspectedDay, day);
        assert.ok(cockpit.sessionLaunchUrl.startsWith('/session?day='));
        assert.equal(typeof cockpit.displayScheduledSets, 'number');
        assert.ok(cockpit.estimatedPaceMin >= 25, 'Pace must always be >= 25 minutes');

        if (day === 3 || day === 6) {
          assert.equal(cockpit.isRestDay, true, `Day ${day} must be a rest day`);
          assert.equal(cockpit.displayScheduledSets, 0);
          assert.equal(cockpit.displayExercises.length, 0);
        } else {
          assert.equal(cockpit.isRestDay, false, `Day ${day} must be a training day`);
          assert.ok(cockpit.displayExercises.length > 0);
          assert.ok(cockpit.displayScheduledSets > 0);
        }
      }
    });

    it('simulates rapid sequential inspection switching without cumulative state drift', () => {
      const prog = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const calendar = { weekIndex: 1, dayOfWeek: 4, started: true }; // Calendar Friday (Day 4)

      // Trainee rapidly inspects: Sat -> Sun -> Mon -> Wed -> Thu -> Return to Today (null)
      const sequence: Array<number | null> = [5, 6, 0, 2, 3, null];

      for (const targetDay of sequence) {
        const cockpit = simulateTodayCockpit({
          program: prog,
          resolved: calendar,
          inspectedDayOfWeek: targetDay,
        });

        if (targetDay === null) {
          assert.equal(cockpit.currentInspectedDay, 4, 'Null must restore calendar Friday');
          assert.equal(cockpit.isInspectingDifferentDay, false);
          assert.equal(cockpit.displaySession?.id, `${progIdAlpha}_d4`);
        } else {
          assert.equal(cockpit.currentInspectedDay, targetDay);
          assert.equal(cockpit.isInspectingDifferentDay, targetDay !== 4);
          assert.equal(cockpit.displaySession?.id, `${progIdAlpha}_d${targetDay}`);
        }
      }
    });

    it('handles programs with missing blocks, empty exercises, or distant future dates safely', () => {
      // Future program resolution
      const futureResolved = resolveProgramDay('2035-01-01', '2026-11-27');
      assert.equal(futureResolved.started, false);
      assert.equal(futureResolved.weekIndex, 1);
      assert.equal(futureResolved.dayOfWeek, 0);

      // Program with empty blocks
      const emptyProg: Program = {
        id: 'prog_empty',
        traineeId: 'trainee_empty',
        title: 'Empty Program',
        startDate: '2026-11-23',
        status: 'published',
        durationWeeks: 4,
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                id: 'd0_empty',
                dayOfWeek: 0,
                label: 'Empty Day',
                isRestDay: false,
                blocks: [],
              },
            ],
          },
        ],
      };

      const emptyCockpit = simulateTodayCockpit({
        program: emptyProg,
        resolved: { weekIndex: 1, dayOfWeek: 0, started: true },
        inspectedDayOfWeek: 0,
      });

      assert.equal(emptyCockpit.displayExercises.length, 0);
      assert.equal(emptyCockpit.displayScheduledSets, 0);
      assert.equal(emptyCockpit.estimatedPaceMin, 25);
      assert.equal(emptyCockpit.isRestDay, true, 'Empty exercises must be flagged as rest day');
    });
  });

  /* ========================================================================
   * SUITE 5: CROSS-FEATURE CONCURRENCY, SWAPPING ISOLATION & MULTI-TENANT INTEGRITY
   * ======================================================================== */
  describe('5. Cross-Feature Concurrency, Swapping Isolation & Multi-Tenant Integrity', () => {
    it('disambiguates identical exercises across multiple days during day-specific swap', () => {
      // In createMultiDayProgram:
      // - Day 0 (Monday) contains 'Cable Lateral Raise'
      // - Day 4 (Friday) ALSO contains 'Cable Lateral Raise'
      // Athlete inspects Friday (Day 4) and swaps 'Cable Lateral Raise' -> 'Dumbbell Lateral Raise'

      const swapRes = appStore.swapExerciseInActiveProgram(
        traineeAlpha,
        'Cable Lateral Raise',
        'Dumbbell Lateral Raise',
        4 // Explicit target day: Friday
      );

      assert.equal(swapRes.success, true);
      assert.equal(swapRes.dayLabel, 'Day 5: Upper Kinetic Hypertrophy');

      // Verify Friday (Day 4) has Dumbbell Lateral Raise
      const progAfter = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const day4 = progAfter.weeks[0].days.find((d) => d.dayOfWeek === 4)!;
      const day4Names = day4.blocks[0].exercises.map((e) => e.exerciseName);
      assert.ok(day4Names.includes('Dumbbell Lateral Raise'));
      assert.ok(!day4Names.includes('Cable Lateral Raise'));

      // CRUCIAL ISOLATION CHECK: Monday (Day 0) MUST STILL HAVE 'Cable Lateral Raise' UNTOUCHED!
      const day0 = progAfter.weeks[0].days.find((d) => d.dayOfWeek === 0)!;
      const day0Names = day0.blocks[0].exercises.map((e) => e.exerciseName);
      assert.ok(day0Names.includes('Cable Lateral Raise'), 'Monday must keep Cable Lateral Raise');
      assert.ok(!day0Names.includes('Dumbbell Lateral Raise'), 'Monday must not contain Dumbbell Lateral Raise');
    });

    it('supports consecutive multiple exercise swaps on the same inspected day', () => {
      // Day 0 has: 'Barbell Bench Press' and 'Cable Lateral Raise'
      // 1. Swap 'Barbell Bench Press' -> 'Incline Dumbbell Bench Press' on Day 0
      const swap1 = appStore.swapExerciseInActiveProgram(
        traineeAlpha,
        'Barbell Bench Press',
        'Incline Dumbbell Bench Press',
        0
      );
      assert.equal(swap1.success, true);

      // 2. Swap 'Cable Lateral Raise' -> 'Machine Pec Deck' on Day 0
      const swap2 = appStore.swapExerciseInActiveProgram(
        traineeAlpha,
        'Cable Lateral Raise',
        'Machine Pec Deck',
        0
      );
      assert.equal(swap2.success, true);

      // Verify both took effect on Day 0
      const prog = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const day0 = prog.weeks[0].days.find((d) => d.dayOfWeek === 0)!;
      const exNames = day0.blocks[0].exercises.map((e) => e.exerciseName);
      assert.ok(exNames.includes('Incline Dumbbell Bench Press'));
      assert.ok(exNames.includes('Machine Pec Deck'));
      assert.equal(day0.blocks[0].exercises.length, 2);
    });

    it('enforces strict multi-tenant program isolation under multi-day mutations', () => {
      // Trainee Alpha and Trainee Beta both have identical initial programs.
      // Trainee Alpha performs a swap on Day 2 (Squat -> Hack Squat).
      const swapAlpha = appStore.swapExerciseInActiveProgram(
        traineeAlpha,
        'Barbell Back Squat',
        'Hack Squat Machine',
        2
      );
      assert.equal(swapAlpha.success, true);

      // Verify Trainee Alpha has Hack Squat
      const alphaProg = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const alphaDay2 = alphaProg.weeks[0].days.find((d) => d.dayOfWeek === 2)!;
      assert.equal(alphaDay2.blocks[0].exercises[0].exerciseName, 'Hack Squat Machine');

      // Verify Trainee Beta was COMPLETELY UNTOUCHED
      const betaProg = appStore.getActiveProgramForTrainee(traineeBeta)!;
      const betaDay2 = betaProg.weeks[0].days.find((d) => d.dayOfWeek === 2)!;
      assert.equal(betaDay2.blocks[0].exercises[0].exerciseName, 'Barbell Back Squat');
    });

    it('executes full cross-subsystem pipeline: multi-day inspection -> swap -> thumbnail update -> video modal resolution', () => {
      // Scenario: Trainee Alpha on Monday inspects Saturday (Day 5: Kinetic Crucible & Arms)
      const prog = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const calendar = { weekIndex: 1, dayOfWeek: 0, started: true };

      // 1. Initial inspection of Saturday
      const satCockpit = simulateTodayCockpit({
        program: prog,
        resolved: calendar,
        inspectedDayOfWeek: 5,
      });
      assert.equal(satCockpit.isInspectingDifferentDay, true);
      assert.equal(satCockpit.displaySession?.label, 'Day 6: Kinetic Crucible & Arms');
      const originalEx = satCockpit.displayExercises[0];
      assert.equal(originalEx.exerciseName, 'Triceps Pushdown');

      // 2. Trainee swaps Triceps Pushdown -> Dumbbell Overhead Triceps Extension on Saturday
      const swapRes = appStore.swapExerciseInActiveProgram(
        traineeAlpha,
        'Triceps Pushdown',
        'Dumbbell Overhead Triceps Extension',
        5
      );
      assert.equal(swapRes.success, true);

      // 3. Inspect updated Saturday session
      const updatedProg = appStore.getActiveProgramForTrainee(traineeAlpha)!;
      const updatedCockpit = simulateTodayCockpit({
        program: updatedProg,
        resolved: calendar,
        inspectedDayOfWeek: 5,
      });
      const swappedEx = updatedCockpit.displayExercises[0];
      assert.equal(swappedEx.exerciseName, 'Dumbbell Overhead Triceps Extension');

      // 4. Verify Thumbnail automatically infers dumbbell apparatus
      const thumb = simulateThumbnail({
        exerciseName: swappedEx.exerciseName,
      });
      assert.equal(thumb.apparatus, 'dumbbell');

      // 5. Verify Video Demonstration URL reflects new exercise
      const videoModal = simulateExerciseVideoModal({
        exercise: {
          name: swappedEx.exerciseName,
          videoUrl: swappedEx.videoUrl,
        },
      });
      assert.ok(videoModal);
      assert.ok(videoModal.youtubeUrl.includes('youtube.com'));
      const parsed = new URL(videoModal.youtubeUrl);
      const query = parsed.searchParams.get('search_query') || '';
      assert.ok(query.includes('"Dumbbell Overhead Triceps Extension"'));
      assert.ok(query.includes('triceps'));
      assert.ok(videoModal.youtubeUrl.includes('sp=EgIYAQ%3D%3D'));

      // 6. Verify Launch CTA points to Saturday
      assert.equal(updatedCockpit.sessionLaunchUrl, `/session?day=${progIdAlpha}_d5`);
    });
  });
});
