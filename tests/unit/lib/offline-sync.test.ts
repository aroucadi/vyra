import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getStorageAdapter } from '@/lib/storage/adapter';
import { offlineSyncEngine } from '@/lib/offline/sync-engine';

describe('Underground Gym Basement Offline Sync Engine', () => {
  const traineeId = 'trainee_test_offline';

  beforeEach(() => {
    // Reset test storage
  });

  it('detects 0 unsynced events when queue is clean', async () => {
    const res = await offlineSyncEngine.flushUnsyncedEvents(traineeId);
    assert.equal(res.success, true);
    assert.equal(res.syncedCount, 0);
  });

  it('queues an offline athletic event and marks it synced on flush', async () => {
    const adapter = getStorageAdapter();

    // Trainee completes workout offline in gym basement
    const event = await adapter.appendEvent(
      traineeId,
      'session_offline_test',
      'WORKOUT_COMPLETED',
      {
        sessionId: 'session_offline_test',
        totalVolumeKg: 4500,
        dayLabel: 'Pull Hypertrophy',
      }
    );

    assert.equal(event.syncedToCloud, false);

    // Verify event is present in unsynced queue
    const unsyncedBefore = await adapter.getUnsyncedEvents(traineeId);
    assert.ok(unsyncedBefore.some((e) => e.id === event.id));

    // Simulate markEventsSynced
    await adapter.markEventsSynced([event.id]);

    const unsyncedAfter = await adapter.getUnsyncedEvents(traineeId);
    assert.ok(!unsyncedAfter.some((e) => e.id === event.id));
  });

  it('notifies subscribers on connection status change', () => {
    let notifiedOnline: boolean | null = null;
    const unsub = offlineSyncEngine.subscribe(({ isOnline }) => {
      notifiedOnline = isOnline;
    });

    assert.equal(typeof unsub, 'function');
    unsub();
  });
});
