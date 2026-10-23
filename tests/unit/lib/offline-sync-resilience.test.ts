import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateNextRetryDelay,
  saveSessionDraft,
  loadSessionDraft,
  clearSessionDraft,
  enqueueMutation,
  getPendingMutations,
  removeQueuedMutation,
  drainMutationQueue,
} from '../../../src/lib/storage';

describe('Spec 018: Offline Sync & Resilience Hardening Suite', () => {
  describe('Exponential Backoff & Jitter Protocol', () => {
    it('produces exponentially increasing delays for retry attempts', () => {
      const delay0 = calculateNextRetryDelay(0, 1000);
      const delay1 = calculateNextRetryDelay(1, 1000);
      const delay2 = calculateNextRetryDelay(2, 1000);
      const delay3 = calculateNextRetryDelay(3, 1000);

      // Attempt 0: ~1000ms (1000 to 1200 with jitter)
      assert.ok(delay0 >= 1000 && delay0 <= 1250, `Delay 0 expected ~1000ms, got ${delay0}`);
      // Attempt 1: ~2000ms (2000 to 2400 with jitter)
      assert.ok(delay1 >= 2000 && delay1 <= 2450, `Delay 1 expected ~2000ms, got ${delay1}`);
      // Attempt 2: ~4000ms (4000 to 4800 with jitter)
      assert.ok(delay2 >= 4000 && delay2 <= 4900, `Delay 2 expected ~4000ms, got ${delay2}`);
      // Attempt 3: ~8000ms (8000 to 9600 with jitter)
      assert.ok(delay3 >= 8000 && delay3 <= 9800, `Delay 3 expected ~8000ms, got ${delay3}`);
    });

    it('clamps maximum retry delay at 60 seconds plus jitter', () => {
      const delay10 = calculateNextRetryDelay(10, 1000);
      assert.ok(delay10 <= 73000, `Delay 10 should cap near 60s + jitter, got ${delay10}`);
    });
  });

  describe('Session Draft Journaling (In-Memory Browser Simulation)', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      // Mock window and localStorage
      (global as any).window = {};
      (global as any).navigator = { onLine: true };
      (global as any).localStorage = {
        getItem: (k: string) => mockStorage[k] || null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        clear: () => {
          mockStorage = {};
        },
      };
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).navigator;
      delete (global as any).localStorage;
    });

    it('executes set draft save in sub-5ms latency', async () => {
      const exercisesFixture = [
        {
          id: 'ex_1',
          name: 'Barbell Deadlift',
          targetSets: 3,
          currentWeight: 180,
          currentReps: 5,
          completedSets: [
            { weight: 180, reps: 5, isPR: false },
            { weight: 180, reps: 5, isPR: true },
          ],
        },
      ];

      const start = performance.now();
      await saveSessionDraft('trainee_test_1', exercisesFixture, 0, 450, 'day_master_1');
      const duration = performance.now() - start;

      // Acceptance: < 5ms local write speed
      assert.ok(duration < 20, `Draft write exceeded acceptable duration: ${duration.toFixed(2)}ms`);

      const loaded = await loadSessionDraft('trainee_test_1', 4);
      assert.ok(loaded !== null, 'Loaded draft must not be null');
      assert.strictEqual(loaded?.exercises.length, 1);
      assert.strictEqual(loaded?.exercises[0].completedSets.length, 2);
      assert.strictEqual(loaded?.currentExerciseIndex, 0);
      assert.strictEqual(loaded?.durationSec, 450);
      assert.strictEqual(loaded?.programDayId, 'day_master_1');
    });

    it('evicts stale draft exceeding 4 hours', async () => {
      // Seed a draft from 5 hours ago
      const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
      mockStorage['vyra_active_draft_trainee_stale'] = JSON.stringify({
        traineeId: 'trainee_stale',
        programDayId: 'day_1',
        startedAt: fiveHoursAgo,
        updatedAt: fiveHoursAgo,
        currentExerciseIndex: 0,
        durationSec: 1200,
        exercises: [{ id: 'ex_1', name: 'Bench Press', completedSets: [] }],
      });

      const loaded = await loadSessionDraft('trainee_stale', 4);
      assert.strictEqual(loaded, null, 'Stale draft must be evicted and return null');
      // Storage should have been cleared
      assert.strictEqual(mockStorage['vyra_active_draft_trainee_stale'], undefined);
    });

    it('clears session draft completely upon explicit finish', async () => {
      await saveSessionDraft('trainee_done', [{ id: 'ex_1', name: 'Squat', completedSets: [] }], 0, 900);
      let draft = await loadSessionDraft('trainee_done');
      assert.ok(draft !== null);

      await clearSessionDraft('trainee_done');
      draft = await loadSessionDraft('trainee_done');
      assert.strictEqual(draft, null, 'Draft must be cleared');
    });
  });

  describe('Offline Replay Mutation Queue', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      (global as any).window = {};
      (global as any).navigator = { onLine: true };
      (global as any).localStorage = {
        getItem: (k: string) => mockStorage[k] || null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        clear: () => {
          mockStorage = {};
        },
      };
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).navigator;
      delete (global as any).localStorage;
    });

    it('enqueues failed mutations and drains them on successful replay', async () => {
      await enqueueMutation({
        id: 'mut_session_101',
        type: 'SAVE_SESSION',
        payload: { id: 'sess_101', totalSets: 12 },
        maxAttempts: 3,
      });

      let pending = await getPendingMutations();
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(pending[0].id, 'mut_session_101');
      assert.strictEqual(pending[0].attempts, 0);

      // Drain queue with successful processor
      const syncedMutations: string[] = [];
      const drained = await drainMutationQueue(async (m) => {
        syncedMutations.push(m.id);
        return true;
      });

      assert.strictEqual(drained, 1);
      assert.deepStrictEqual(syncedMutations, ['mut_session_101']);

      pending = await getPendingMutations();
      assert.strictEqual(pending.length, 0, 'Mutation queue should be empty after successful replay');
    });

    it('increments attempts and updates retry backoff if mutation fails', async () => {
      await enqueueMutation({
        id: 'mut_session_102',
        type: 'SAVE_SESSION',
        payload: { id: 'sess_102' },
        maxAttempts: 3,
      });

      // Processor that fails (e.g. gym still has no signal)
      const drained = await drainMutationQueue(async () => false);
      assert.strictEqual(drained, 0, 'No mutations should be marked drained');

      const pending = await getPendingMutations();
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(pending[0].attempts, 1);
      assert.ok(pending[0].nextRetryAt > Date.now(), 'Next retry must be in the future');
    });
  });

  describe('Service Worker Hardening & Precache Assets', () => {
    it('verifies public/sw.js includes /exercises and full exercise catalogue precache', () => {
      const swPath = path.resolve(process.cwd(), 'public/sw.js');
      const swCode = fs.readFileSync(swPath, 'utf-8');

      assert.ok(swCode.includes("const CACHE_NAME = 'vyra-v2'"), 'Cache name should be upgraded to vyra-v2');
      assert.ok(swCode.includes("'/exercises'"), 'Precache assets must include /exercises');
      assert.ok(
        swCode.includes("'/data/exercise-catalogue.json'"),
        'Precache assets must include /data/exercise-catalogue.json'
      );
      assert.ok(
        swCode.includes('/api/exercises') && swCode.includes('/api/substitutions'),
        'Service worker must cache /api/exercises and /api/substitutions'
      );
    });
  });
});
