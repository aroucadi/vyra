# Task List: 018 Offline Sync & Resilience Hardening

- [x] **Task 1: Spec & CSO Audit** (Completed)
  - [x] STRIDE Threat modeling & in-gym scenario mapping
  - [x] Authored `spec.md` and `plan.md`
  - [x] Define offline mutation schema

- [x] **Task 2: IndexedDB Multi-Store Resilience & Draft Journaling**
  - [x] Upgrade `src/lib/storage.ts` to `DB_VERSION = 2`
  - [x] Implement `saveSessionDraft`, `loadSessionDraft`, `clearSessionDraft`
  - [x] Implement `enqueueMutation`, `drainMutationQueue` with exponential backoff
  - [x] Write unit test suite `tests/unit/lib/offline-sync-resilience.test.ts`

- [x] **Task 3: Service Worker Caching for Catalogue & API**
  - [x] Update `public/sw.js` with `/exercises` and `/data/exercise-catalogue.json`
  - [x] Add offline Cache-First handling for `/api/exercises` and `/api/substitutions`

- [x] **Task 4: Session Floor Draft Restoration**
  - [x] Integrate automatic draft recovery in `src/app/(trainee)/session/page.tsx`
  - [x] Auto-save draft on every set completion (< 2ms synchronous write)
  - [x] Clear draft on workout completion

- [x] **Task 5: Verification & Multi-Region Deployment**
  - [x] Run full test suite (`npm test` - 267/267 passing)
  - [x] Build production assets (`npm run build` - successful)
  - [x] Deploy and verify live Cloud Run multi-region

