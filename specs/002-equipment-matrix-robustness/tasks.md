# Tasks: 4-Option Equipment Matrix, Trainer CRUD & Complete Runtime Robustness

**Input**: Design documents from `/specs/002-equipment-matrix-robustness/`
Sequence: Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (Polish & Verify)

---

## Phase 1: Foundational & Data Model (Supporting USLIS4)

- [x] T001 Update `SetLog` interface in `src/lib/types.ts` to include `optional selectedEquipment?: EquipmentType`
- [x] T002 Update `set_logs` table schema in `src/db/schema/sessions.ts` to include `selectedEquipment` column
- [x] T003 Add `getTrainers(): User[]` method to `Store` in `src/lib/store.ts` (prevents profile crash)
- [x] T004 Update `getPersonalBestForExercise` in `src/lib/store.ts` to support optional `equipmentType?: EquipmentType` filtering for isolated PR detection

---

## Phase 2: User Story 1 - Per-Set Equipment Logging & PR Isolation (P1) 1�MVP

- [x] T005 Update `ExerciseState` and `completedSets` state in `src/app/(trainee)/session/page.tsx` to record `selectedEquipment` and exact `exerciseName` per-set
- [x] T006 Update `logSet` handler in `src/app/(trainee)/session/page.tsx` to evaluate PRs using active equipment variant personal bests
- [x] T007 Update `handleFinishWorkout` in `src/lib/actions/session.ts` and `session/page.tsx` to persist `attributed equipmentType, exerciseName, reps, weight, and PR flags
- [x] T008 Add unit test in `tests/unit/lib/master-program.test.ts` verifying per-set equipment swapping name and PR isolation

---


## Phase 2.5: User Story 5 - Real Dynamic Trainee Adherence Calculations (Priority: P1)
- [x] T008a Replace hardcoded calculateWorkoutAdherence in src/lib/store.ts with dynamic formula based on program scheduled days and completed sessions
- [x] T008b Replace hardcoded calculateSupplementAdherence in src/lib/store.ts with dynamic formula based on taken vs scheduled doses
- [x] T008c Replace hardcoded calculateHydrationAdherence in src/lib/store.ts with dynamic formula based on daily intake vs targetMl
- [x] T008d Remove hardcoded traineeId overrides in getRoster() in src/lib/store.ts
- [x] T008e Add unit tests in tests/unit/lib/master-program.test.ts verifying dynamic adherence calculations

## Phase 3: User Story 2 - Seamless Equipment Handoff from Today to Session (P1)

- [x] T009 Extend 4-option equipment matrix pill bar in `src/app/(trainee)/today/page.tsx` to superset and circuit exercises
- [x] T010 Update "Start Workout Session" CTA in `today/page.tsx` to pass `equipmentOverrides` query string or store assignment to `src/app/(trainee)/session/page.tsx`
- [x] T011 Initialize `session/page.tsx` using passed overrides so trainee pre-selections are preserved
- [x] T012 Dynamically populate session header using `currentDay.label` instead of hardcoded "Push Hypertrophy A"
---

## Phase 4: User Story 3 - Trainer Program Builder 4-Option Matrix CRUD & Editor (P1)

- [x] T013 Build an expandable "Equipment Matrix (4 Options)" component/section for each exercise prescription card in `src/app/(trainer)/program/new/page.tsx`
- [x] T014 Provide tabs or grid for Machine, Dumbbell, Cable, Bodyweight with fields for exerciseName, formCue, videoUrl, and targetFocus
- [x] T015 Auto-populate default matrices for known exercises when added from library
- [x] T016 Repair `src/app/(trainer)/program/[id]/page.tsx` to use `params.id`, fetch the existing program, and initialize the builder state
- [x] T017 Add unit tests for program save/publish with equipment matrices

---

## Phase 5: User Story 4 - Crash Fixes & Display Cleanup (P2)

- [x] T018 Fix `profile/page.tsx` crash by using `appStore.getTrainers()` with safe fallbacks
- [x] T019 Update `progress/page.tsx` to display real logged PRs with equipment badges rather than hardcoded cards
- [x] T020 Update session finish celebration dialog to reflect actual coach name rather than hardcoded "Coach Marcus"

---

## Phase 6: Polish & Verification

- [x] T021 Run full test suite `npx tsx --test tests/unit/lib/*.test.ts` and verify all tests pass
- [x] T022 Perform gwtack-review verification on the final specification and artifacts
