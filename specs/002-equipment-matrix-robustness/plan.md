# Implementation Plan: 4-Option Equipment Matrix, Trainer CRUD & Complete Runtime Robustness

**Branch**: `002-equipment-matrix-robustness` | **Date**: 2026-09-14 | **Spec**: [specs/002-equipment-matrix-robustness/spec.md](specs/002-equipment-matrix-robustness/spec.md)


## Summary
Implement data model persistence for per-set equipment tracking in SetLog, isolate PR calculations by equipment modality, enable equipment matrix selection for all block types on Today, pass equipment state seamlessly to live workout sessions, provide full 4-Option Equipment Matrix authoring & editing in the trainer program builder, repair the program edit route (/program/[id]), and resolve runtime crashes on /profile.


## Technical Context
- Language/Version: TypeScript 5, Node.js 24
- Framework: Next.js 15.3 (App Router, Server Actions, React 19)
- Database / ORM: PostgreSQL via Drizzle ORM (0.43+) & In-Memory AppStore Singleton for deterministic dev/test runs
- Styling: Tailwind CSS v4, Lucide React icons
- Testing: Node.js Test Runner (node:test, node:assert/strict) via npx tsx --test tests/unit/lib/*.test.ts



## Proposed Changes

### 1. Data Model & Store Layer (Foundational)
- *src/lib/types.ts*:
  - Add selectedEquipment?: EquipmentType to SetLog interface.
  - Update ExerciseState or completed sets representations to retain selectedEquipment.
- 'src/db/schema/sessions.ts':
  - Add selectedEquipment column (text enum ['machine', 'dumbbell', 'cable', 'bodyweight']) to set_logs table.
- 'src/lib/store.ts':
  - Add getTrainers(): User[] method to Store class.
  - Update getPersonalBestForExercise(traineeId, exerciseName, equipmentType?) to support equipment-isolated record evaluation.
  - Add default equipment matrix template generator helper for common movement patterns.



### 1.1 Dynamic Trainee Adherence Calculation Engine
- Replace hardcoded switch statements in calculateWorkoutAdherence with real scheduled vs completed session ratios.
- Replace hardcoded switch statements in calculateSupplementAdherence with taken vs scheduled dose counts from SupplementLog.
- Replace hardcoded switch statements in calculateHydrationAdherence with daily achieved volume averages from HydrationLog.
- Remove static traineeId overrides inside appStore.getRoster().

### 2. Trainee Live Workout & Session Logging
- 'src/app/(trainee)/session/page.tsx':
  - Read initial equipment overrides from URL query parameters (?overrides=...) when launched from Today.
  - Ensure handleFinishWorkout maps s.emquipmentType to each SetLog rather than applying a single mutable ex.name across all sets.
  - Dynamically render currentDay?.label in the session header.
  - Ensure equipment swapping retains previous sets in completedSets with their original names and equipment.
  - Update PR evaluation call checkIsPersonalRecord to check records against the active equipment variant.
- 'src/app/(trainee)/today/page.tsx':
  - Extend equipment matrix selector to superset and circuit blocks.
  - Update Start Workout Session CTA link to pass equipmentOverrides via query string.


### 3. Trainer Program Builder & Editor
- 'src/app/(trainer)/program/new/page.tsx':
  - Add an expandable 4-Option Equipment Matrix accordion to each exercise prescription.
  - Provide tabs/inputs for machine, dumbbell, cable, and bodyweight variations (exerciseName, formCue, videoUrl, targetFocus).
  - Automatically populate standard library movements with default 4-option matrix presets.
  - Ensure buildProgramObject embeds equipmentVariations on each ExercisePrescription.
- 'src/app/(trainer)/program/[id]/page.tsx':
  - Unwrap params via React use(params) or async params.
  - Load program directly from store to initialize all days, blocks, and equipment matrices for editing.


### 4. Trainee Profile & Analytics Fixes
- 'src/app/(trainee)/profile/page.tsx':
  - Fix crash by calling appStore.getTrainers() safely.
- 'src/app/(trainee)/progress/page.tsx':
  - Dynamically display logged PRs by exercise name and equipment variant from sessions.setLogs.


### 5. Automated Verification & Test Matrix
- 'tests/unit/lib/master-program.test.ts':
  - Add tests for per-set equipment logging in sessions.
  - Add tests for PR isolation per equipment type.
  - Add tests for appStore.getTrainers().
  - Add tests for program builder equipment matrix creation and serialization.


## Verification Plan
1. Run npx tsx --test tests/unit/lib/*.test.ts to ensure all 33 existing tests + new tests pass.
2. Verify /profile loads without runtime error and allows role switching.
3. Verify /session displays exact day label and records distinct equipment per set.
4. Verify /program/[id] correctly populates existing program details for editing.
