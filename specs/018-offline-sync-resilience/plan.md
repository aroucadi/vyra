# Implementation Plan: 018 Offline Sync & Resilience Hardening

## 1. Files & Component Modifications

1. `src/lib/storage.ts`:
   - Bump `DB_VERSION = 2`.
   - Add IndexedDB stores: `session_drafts` and `mutation_queue`.
   - Add draft management: `saveSessionDraft(draft)`, `loadSessionDraft(traineeId)`, `clearSessionDraft(traineeId)`.
   - Add queue management: `enqueueMutation(mutation)`, `getPendingMutations()`, `removeQueuedMutation(id)`, `drainMutationQueue()`.
2. `public/sw.js`:
   - Add `/exercises` and `/data/exercise-catalogue.json` to `PRECACHE_ASSETS`.
   - Add Cache-First fallback for `/api/exercises` and `/api/substitutions`.
3. `src/app/(trainee)/session/page.tsx`:
   - On set log: automatically trigger `saveSessionDraft`.
   - On component mount: check `loadSessionDraft` and seamlessly restore completed sets if draft exists.
   - On session completion or cancellation: `clearSessionDraft`.
4. `src/components/primitives/OfflineSyncBadge.tsx`:
   - Subtle status indicator showing `"Offline Mode · Changes Saved Locally"` when offline or `"Syncing..."` when online.
5. Unit & Stress Tests:
   - `tests/unit/lib/offline-sync-resilience.test.ts`:
     - Test draft save and restore latency (< 5ms).
     - Test mutation queue retry backoff calculation.
     - Test offline workout completion without network errors.

## 2. Verification Steps

- `npm test`
- `npx tsx --test tests/unit/lib/offline-sync-resilience.test.ts`
- `npm run build`
- Multi-region Cloud Run deployment.
