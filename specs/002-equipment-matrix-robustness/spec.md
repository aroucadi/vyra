# Feature Specification: 4-Option Equipment Matrix, Trainer CRUD and Complete Runtime Robustness

Feature Branch: 002-equipment-matrix-robustness
Created: 2026-09-14
Status: Draft (Ready for Review)
Input: Comprehensive audit findings from gstack review regarding 4-Option Equipment Matrix support, runtime crashes, and trainer-trainee data flow gaps.

---

## User Scenarios and Testing (mandatory)

### User Story 1 - Per-Set Equipment Logging and Accurate PR Isolation (Priority: P1) MVP
As a trainee working out in a gym, when an intended piece of equipment is occupied (e.g. Incline Machine Chest Press), I need to swap to an alternative (e.g. 30 deg Incline DB Press or Cable Incline Press) and have that exact tool and movement recorded for my sets, so that my workout history is accurate and I do not trigger false PR comparisons between different pieces of equipment.

Acceptance Scenarios:
1. Given a trainee is on an exercise with 4 equipment variants, When they log Set 1 using Machine, Then SetLog records selectedEquipment as machine and exerciseName as Incline Machine Chest Press.
2. Given Set 1 was logged on Machine, When the trainee clicks Dumbbell and logs Set 2, Then Set 1 remains recorded as Machine, and Set 2 is recorded with selectedEquipment as dumbbell and exerciseName as 30 deg Incline Dumbbell Press.
3. Given a trainee has a personal best of 90kg x 10 on Incline Machine Press, When they log 32kg x 8 on 30 deg Incline Dumbbell Press, Then the system does not compare the 32kg against the 90kg machine record and evaluates PR status strictly against prior dumbbell records.

---

### User Story 2 - Seamless Equipment State Handoff from Today to Live Session (Priority: P1)
As a trainee planning my workout on the Today dashboard, when I pre-select an equipment variant based on gym floor availability, that selection must persist when I launch Start Workout Session.

Acceptance Scenarios:
1. Given an exercise on Today defaults to Machine, When the trainee taps Dumbbell, Then the UI reflects the dumbbell variation.
2. Given an override was selected on Today, When the trainee clicks Start Workout Session, Then session receives the equipment overrides (via query params or store) and initializes that exercise with Dumbbell active.
3. Given an exercise is part of a Superset or Circuit on Today, When viewed on Today, Then the 4-option equipment matrix buttons are rendered and functional just as they are for straight-set blocks.

---

### User Story 3 - Trainer Program Builder: 4-Option Matrix CRUD and Program Editor (Priority: P1)
As a strength coach / trainer, I need to view, configure, and edit the 4-option equipment matrix (Machine, Dumbbell, Cable, Bodyweight) for each prescribed exercise in the program builder, and edit existing programs via /program/[id].

Acceptance Scenarios:
1. Given a trainer is building or editing a program in /program/new or /program/[id], When they add or configure an exercise prescription, Then they see an Equipment Matrix section with tabs/fields for Machine, Dumbbell, Cable, and Bodyweight.
2. Given a trainer adds a standard library exercise, When default matrix templates are available, Then all 4 options auto-populate with biomechanically equivalent defaults (exercise name, form cue, video search URL, target focus).
3. Given a trainer opens /program/prog_master_transformation_16w, When the page loads, Then the existing program schedule, weeks, days, blocks, and equipment matrices are loaded from the store/database into the builder rather than rendering a blank template.

---

### User Story 4 - Elimination of Critical Crashes and Display Inconsistencies (Priority: P2)
As a user or coach, I should never experience uncaught runtime crashes or misleading hardcoded text on profile, session, or analytics screens.

Acceptance Scenarios:
1. Given a trainee visits /profile, When the component evaluates coach details or switches user, Then it uses valid store methods (appStore.getTrainers()) and does not throw TypeError.
2. Given a trainee starts Thursday workout, When the session page loads, Then the header reads the exact day label, not Push Hypertrophy A.
3. Given a trainee has completed workout sessions, When they view /progress, Then the PR cabinet and muscle volume indicators reflect real data aggregated from their logged sessions.

---

### User Story 5 - Real Dynamic Trainee Adherence Calculations (Priority: P1) Data Integrity
As a strength coach monitoring the athlete roster and individual client dashboards, I need workout, supplement, and hydration adherence scores to be computed dynamically from actual logged sessions, supplement logs, and hydration entries relative to the athlete scheduled program days, rather than returning hardcoded static numbers keyed by trainee ID.

Why this priority: Eliminates fake/hardcoded numbers in core coaching business logic. Hardcoded switch statements like if (traineeId === trainee_1) return 94 destroy trainer trust and make the software non-functional for new trainees.

Independent Test:
Log 2 workouts for an athlete scheduled for 4 workouts up to today; verify workout adherence calculates to exactly 50%. Log 3 of 4 scheduled supplements; verify supplement adherence calculates to 75%. Log 2500ml on a 3500ml target; verify hydration adherence calculates to 71%.

Acceptance Scenarios:
1. Given a trainee has an active program starting N days ago, When calculateWorkoutAdherence is called, Then the system calculates (completedSessions / scheduledWorkoutsUpToToday) * 100 dynamically, returning 100% if no workouts were scheduled yet.
2. Given a trainee has scheduled supplement doses, When calculateSupplementAdherence is called, Then it counts taken doses divided by total scheduled doses in recorded supplement logs.
3. Given a trainee has a daily hydration target, When calculateHydrationAdherence is called, Then it averages the daily intake percentages achieved across logged dates.

---

## Edge Cases
- Trainee swaps equipment mid-set: The UI logs the primary tool used for that set; notes can be recorded in session notes.
- Exercise has no variations defined: In legacy or simple programs with no matrix, the UI falls back gracefully to standard single-tool logging without rendering empty grid buttons.
- Custom trainer exercise not in matrix library: Trainer can define custom variation names and form cues directly within the matrix accordion.
- Trainee has 0 logged sessions or just started program today: Adherence functions return 100% baseline with zero division-by-zero or NaN errors.

---

## Functional Requirements
- FR-001: SetLog entity in src/lib/types.ts and set_logs in src/db/schema/sessions.ts MUST include selectedEquipment of type EquipmentType (enum: machine, dumbbell, cable, bodyweight).
- FR-002: handleFinishWorkout in session/page.tsx MUST attach the exact selectedEquipment used during each specific set to that set SetLog.
- FR-003: appStore.getPersonalBestForExercise MUST accept an optional equipmentType parameter to isolate PR comparisons per equipment type.
- FR-004: today/page.tsx MUST support equipment variant selection for all block types, including superset and circuit.
- FR-005: today/page.tsx MUST pass selected equipment overrides to session/page.tsx via URL search params (?overrides=...).
- FR-006: session/page.tsx MUST dynamically initialize the header title from currentDay.label instead of hardcoded strings.
- FR-007: session/page.tsx MUST preserve distinct set names and equipment in completedSets state so swapping equipment does not retroactively rewrite past sets.
- FR-008: profile/page.tsx MUST NOT call non-existent methods on appStore. appStore MUST provide getTrainers method.
- FR-009: Trainer program builder (program/new/page.tsx) MUST provide an expandable UI accordion on each exercise card to view and edit all 4 equipment variations (EquipmentOption[]).
- FR-010: Trainer program editor (program/[id]/page.tsx) MUST resolve params.id, load the existing program into builder state, and allow editing and re-publishing.
- FR-011: progress/page.tsx PR Showcase MUST display real personal records extracted from sessions.setLogs, displaying the equipment variant used.
- FR-012: calculateWorkoutAdherence, calculateSupplementAdherence, and calculateHydrationAdherence in src/lib/store.ts MUST compute real dynamic percentage scores from actual logged entities instead of hardcoded ID lookups.
- FR-013: Comprehensive unit and integration tests MUST be added in tests/unit/lib/ to verify equipment logging, PR isolation, store methods, dynamic adherence math, and program builder equipment persistence.

---

## Success Criteria
- SC-001: 100% of sets logged with equipment swaps retain their distinct tool type and name in SetLog.
- SC-002: Zero false PR alerts generated when switching between different equipment modalities.
- SC-003: Zero runtime exceptions on /profile, /session, /today, or /program/[id].
- SC-004: Zero hardcoded adherence percentages in store.ts and trainee detail views.
- SC-005: Trainers can author and save a complete 4-option matrix for any exercise in under 60 seconds.
- SC-006: All test suites pass with 100% success rate (npx tsx --test tests/unit/lib/*.test.ts).