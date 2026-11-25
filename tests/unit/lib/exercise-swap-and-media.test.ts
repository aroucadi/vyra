import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveExerciseVideoUrl,
  isDirectVideoUrl,
  getOpenGymClipUrl,
  getOpenGymStillUrl,
} from '../../../src/lib/utils';
import { appStore } from '../../../src/lib/store';
import { loadExerciseCatalogue, getExerciseById } from '../../../src/lib/rag/catalogue-loader';

describe('Exercise Library Enrichment & Biomechanical Swap Engine', () => {
  describe('Direct Video & Media Resolution', () => {
    it('generates valid OpenGym clip and still CDN URLs', () => {
      const clip = getOpenGymClipUrl('0025');
      assert.equal(
        clip,
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0025.mp4'
      );

      const still = getOpenGymStillUrl('1465');
      assert.equal(
        still,
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/1465.webp'
      );
    });

    it('identifies direct MP4 and CDN URLs correctly', () => {
      assert.equal(
        isDirectVideoUrl('https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0001.mp4'),
        true
      );
      assert.equal(
        isDirectVideoUrl('https://media.musclewiki.com/media/uploads/videos/branded/male-machine-incline-press-front.mp4'),
        true
      );
      assert.equal(
        isDirectVideoUrl('https://www.youtube.com/results?search_query=bench+press'),
        false
      );
      assert.equal(isDirectVideoUrl(undefined), false);
    });

    it('resolves direct MP4 video when numeric ID is provided', () => {
      const videoUrl = resolveExerciseVideoUrl('barbell bench press', { id: '0025' });
      assert.equal(
        videoUrl,
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0025.mp4'
      );
    });

    it('resolves direct video from catalogue matches with clipUrl', () => {
      const catalogue = [
        {
          id: '0101',
          name: 'Pec Deck Fly',
          clipUrl: 'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0101.mp4',
        },
      ];
      const videoUrl = resolveExerciseVideoUrl('Pec Deck Fly', { catalogue });
      assert.equal(
        videoUrl,
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/clip/0101.mp4'
      );
    });
  });

  describe('Catalogue Ingestion & Enrichment Quality', () => {
    const catalogue = loadExerciseCatalogue();

    it('ensures every ingested exercise has clipUrl and imageUrl populated', () => {
      assert.equal(catalogue.totalCount, 6554);
      const sample = catalogue.exercises.slice(0, 100);
      for (const ex of sample) {
        assert.ok(ex.clipUrl, `Exercise ${ex.id} must have clipUrl`);
        assert.ok(ex.imageUrl, `Exercise ${ex.id} must have imageUrl`);
        assert.ok(ex.clipUrl.endsWith('.mp4'), `Clip for ${ex.id} must be .mp4`);
        assert.ok(ex.imageUrl.endsWith('.webp'), `Image for ${ex.id} must be .webp`);
      }
    });

    it('ensures instructions and descriptions are populated for exercises', () => {
      const ex1 = getExerciseById('0001');
      assert.ok(ex1);
      assert.ok(ex1.instructions.length > 0);
      assert.ok(ex1.description.length > 0);
    });
  });

  describe('Program Exercise Swap Persistence', () => {
    const testUserId = 'trainee_swap_test';

    beforeEach(() => {
      // Setup a clean test program in appStore
      appStore.saveProgram({
        id: 'test_prog_swap',
        traineeId: testUserId,
        title: 'Hypertrophy Testing Protocol',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        durationWeeks: 12,
        weeks: [
          {
            weekNumber: 1,
            days: [
              {
                dayOfWeek: 0,
                label: 'Day 1: Upper Kinetic Drive',
                isRestDay: false,
                blocks: [
                  {
                    id: 'b1',
                    label: 'Main Compound',
                    exercises: [
                      {
                        id: 'ep1',
                        exerciseId: '0025',
                        exerciseName: 'Barbell Bench Press',
                        sets: 4,
                        repRangeLow: 6,
                        repRangeHigh: 8,
                        rirScheme: [2, 1, 0, 0],
                        restSeconds: 120,
                        targetMuscleGroups: ['chest', 'triceps'],
                      },
                      {
                        id: 'ep2',
                        exerciseId: '0101',
                        exerciseName: 'Pec Deck Machine',
                        sets: 3,
                        repRangeLow: 10,
                        repRangeHigh: 12,
                        rirScheme: [2, 1, 0],
                        restSeconds: 90,
                        targetMuscleGroups: ['chest'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      appStore.publishProgram('test_prog_swap');
    });

    it('successfully swaps an exercise in the active program mesocycle', () => {
      const result = appStore.swapExerciseInActiveProgram(
        testUserId,
        'Barbell Bench Press',
        'Incline Dumbbell Bench Press',
        0
      );

      assert.equal(result.success, true);
      assert.ok(result.message.includes('Incline Dumbbell Bench Press'));

      const updatedProg = appStore.getActiveProgramForTrainee(testUserId);
      assert.ok(updatedProg);
      const day1 = updatedProg.weeks[0].days[0];
      const ex1 = day1.blocks[0].exercises[0];

      assert.equal(ex1.exerciseName, 'Incline Dumbbell Bench Press');
      assert.ok(ex1.videoUrl, 'Must have generated videoUrl for the replacement exercise');
      assert.ok(ex1.formCueText?.includes('Incline Dumbbell Bench Press'));
    });

    it('returns graceful failure if no matching active program is found', () => {
      const result = appStore.swapExerciseInActiveProgram(
        'non_existent_trainee',
        'Barbell Bench Press',
        'Dumbbell Press'
      );
      assert.equal(result.success, false);
      assert.ok(result.message.includes('No active program found'));
    });
  });
});
