# Tasks: NewME MVP

**Input**: Design documents from `specs/001-newme-mvp/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Included — test-first development per constitution principle VII.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and dependency installation

- [ ] T001 Install core dependencies: drizzle-orm, drizzle-kit, pg, @neondatabase/serverless, shadcn/ui CLI, recharts, firebase, vitest, @testing-library/react, playwright
- [ ] T002 [P] Configure Vitest with React Testing Library in vitest.config.ts
- [ ] T003 [P] Configure Playwright in playwright.config.ts
- [ ] T004 [P] Configure Drizzle in src/db/drizzle.config.ts
- [ ] T005 [P] Set up Tailwind CSS with Stitch design tokens in src/styles/tokens.ts and tailwind.config.ts
- [ ] T006 [P] Initialize shadcn/ui with Stitch-themed components (button, input, card, table, dialog, select, tabs, badge, separator)
- [ ] T007 Set up environment configuration (.env.local template, src/lib/env.ts with zod validation)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth, and base components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create Drizzle schema: users table in src/db/schema/users.ts
- [ ] T009 [P] Create Drizzle schema: trainer_links table in src/db/schema/users.ts
- [ ] T010 [P] Create Drizzle schema: programs, program_weeks, program_days tables in src/db/schema/programs.ts
- [ ] T011 [P] Create Drizzle schema: blocks, exercise_prescriptions tables in src/db/schema/programs.ts
- [ ] T012 [P] Create Drizzle schema: exercises table in src/db/schema/exercises.ts
- [ ] T013 [P] Create Drizzle schema: workout_sessions, set_logs tables in src/db/schema/sessions.ts
- [ ] T014 [P] Create Drizzle schema: body_metric_entries table in src/db/schema/metrics.ts
- [ ] T015 Create Drizzle schema index file with relations in src/db/schema/index.ts
- [ ] T016 Create DB connection module in src/db/index.ts
- [ ] T017 Generate initial Drizzle migration via `npx drizzle-kit generate`
- [ ] T018 [P] Create exercise library seed data (50 exercises) in src/db/seed/exercises.ts
- [ ] T019 [P] Implement Firebase Auth setup in src/lib/auth/firebase.ts (client + admin SDK)
- [ ] T020 [P] Create auth middleware for Server Actions in src/lib/auth/middleware.ts
- [ ] T021 [P] Create shared TypeScript types (domain types, API types) in src/lib/types.ts
- [ ] T022 [P] Create utility functions (date math for program day resolution, PR calculation) in src/lib/utils.ts
- [ ] T023 Create root layout with role-based redirect logic in src/app/layout.tsx
- [ ] T024 [P] Create trainee layout with bottom navigation in src/app/(trainee)/layout.tsx
- [ ] T025 [P] Create trainer layout with sidebar navigation in src/app/(trainer)/layout.tsx

**Checkpoint**: Foundation ready — all schemas defined, auth working, layouts in place. User story implementation can begin.

---

## Phase 3: User Story 1 - Trainer Creates and Publishes a Program (Priority: P1) 🎯 MVP

**Goal**: Trainer can build a multi-week periodized program with exercises, supersets, and publish it to a trainee.

**Independent Test**: Create a 4-week program with mixed workout/rest days, supersets, varied rep schemes, publish it, verify it appears on trainee's view.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T026 [P] [US1] Unit test for program CRUD server actions in tests/unit/lib/program-actions.test.ts
- [ ] T027 [P] [US1] Unit test for exercise library queries in tests/unit/db/exercises.test.ts
- [ ] T028 [P] [US1] Integration test for program create → publish → version flow in tests/integration/program-crud.test.ts

### Implementation for User Story 1

- [ ] T029 [US1] Create Server Actions for program CRUD in src/lib/actions/program.ts (createProgram, updateProgram, publishProgram, archiveProgram, getProgram, listPrograms)
- [ ] T030 [P] [US1] Create Server Actions for exercise library in src/lib/actions/exercise.ts (listExercises, searchExercises, createCustomExercise)
- [ ] T031 [US1] Create Program Builder page layout in src/app/(trainer)/program/new/page.tsx
- [ ] T032 [P] [US1] Create WeekGrid component in src/components/program/WeekGrid.tsx (Mon-Sun × N weeks grid)
- [ ] T033 [P] [US1] Create DayEditor component in src/components/program/DayEditor.tsx (blocks, exercises, rest day toggle)
- [ ] T034 [P] [US1] Create BlockEditor component in src/components/program/BlockEditor.tsx (straight/superset/circuit grouping, exercise list)
- [ ] T035 [P] [US1] Create ExercisePicker component in src/components/program/ExercisePicker.tsx (search + select from library)
- [ ] T036 [P] [US1] Create ExercisePrescriptionForm component in src/components/program/ExercisePrescriptionForm.tsx (sets, reps, RIR, rest, video, cues)
- [ ] T037 [US1] Create PublishDialog component in src/components/program/PublishDialog.tsx (draft → publish confirmation with version notes)
- [ ] T038 [US1] Create ProgramHeader component with status badge (draft/published) and version info in src/components/program/ProgramHeader.tsx
- [ ] T039 [US1] Wire up complete program builder page with all components and server actions
- [ ] T040 [US1] Add validation and error handling for all program builder forms

**Checkpoint**: Trainer can create, edit, and publish a complete periodized program. ✅

---

## Phase 4: User Story 2 - Trainee Views Today's Workout (Priority: P1) 🎯 MVP

**Goal**: Trainee opens app, immediately sees today's workout auto-resolved from program start date.

**Independent Test**: Assign published program, advance date, verify correct program day appears.

### Tests for User Story 2 ⚠️

- [ ] T041 [P] [US2] Unit test for program day resolution (date math) in tests/unit/lib/program-day-resolution.test.ts
- [ ] T042 [P] [US2] Unit test for Today page data fetching in tests/unit/lib/today-actions.test.ts

### Implementation for User Story 2

- [ ] T043 [US2] Create useProgramDay hook in src/hooks/use-program-day.ts (resolves current day from startDate + elapsed days)
- [ ] T044 [US2] Create Server Actions for Today screen in src/lib/actions/today.ts (getTodayWorkout, getProgramDay)
- [ ] T045 [US2] Create TodayPage in src/app/(trainee)/today/page.tsx
- [ ] T046 [P] [US2] Create WorkoutCard component in src/components/workout/WorkoutCard.tsx (exercise list with sets/reps/RIR/rest)
- [ ] T047 [P] [US2] Create ExerciseCard component in src/components/workout/ExerciseCard.tsx (video embed, muscle ref, form cues)
- [ ] T048 [P] [US2] Create RestDayCard component in src/components/workout/RestDayCard.tsx
- [ ] T049 [P] [US2] Create EmptyProgramState component in src/components/workout/EmptyProgramState.tsx
- [ ] T050 [US2] Create StartSessionButton CTA in src/components/workout/StartSessionButton.tsx

**Checkpoint**: Trainee can see today's workout with full exercise details. ✅

---

## Phase 5: User Story 3 - Trainee Logs a Workout Session (Priority: P1) 🎯 MVP

**Goal**: Trainee starts session, logs weight/reps per set, rest timer auto-fires, PRs detected, session visible to trainer.

**Independent Test**: Start session, log 4 exercises × 3 sets, complete session, verify data persisted with timestamps.

### Tests for User Story 3 ⚠️

- [ ] T051 [P] [US3] Unit test for rest timer hook in tests/unit/hooks/use-rest-timer.test.ts
- [ ] T052 [P] [US3] Unit test for PR detection logic in tests/unit/lib/pr-detection.test.ts
- [ ] T053 [P] [US3] Integration test for session logging flow in tests/integration/session-logging.test.ts

### Implementation for User Story 3

- [ ] T054 [US3] Create useRestTimer hook in src/hooks/use-rest-timer.ts (countdown timer, superset-aware)
- [ ] T055 [US3] Create useSession hook in src/hooks/use-session.ts (active session state, set tracking, duration)
- [ ] T056 [US3] Create Server Actions for session logging in src/lib/actions/session.ts (startSession, logSet, completeSession, detectPR)
- [ ] T057 [US3] Create SessionPage in src/app/(trainee)/session/page.tsx
- [ ] T058 [P] [US3] Create SetLogInput component in src/components/workout/SetLogInput.tsx (weight × reps input per set)
- [ ] T059 [P] [US3] Create RestTimerDisplay component in src/components/workout/RestTimerDisplay.tsx (countdown, superset indicator)
- [ ] T060 [P] [US3] Create PRBadge component in src/components/workout/PRBadge.tsx (celebration animation on PR)
- [ ] T061 [P] [US3] Create SessionSummary component in src/components/workout/SessionSummary.tsx (duration, sets, PRs)
- [ ] T062 [US3] Wire up session page with timer, logging, and PR detection

**Checkpoint**: Full workout logging flow works with timers and PR detection. ✅

---

## Phase 6: User Story 4 - Trainer Views Roster and Trainee Progress (Priority: P2)

**Goal**: Trainer sees all trainees with adherence stats, alerts, and can drill into detail.

**Independent Test**: 3 trainees with varying adherence, verify correct stats and alert indicators.

### Tests for User Story 4 ⚠️

- [ ] T063 [P] [US4] Unit test for adherence calculation in tests/unit/lib/adherence.test.ts
- [ ] T064 [P] [US4] Unit test for roster alert detection in tests/unit/lib/alerts.test.ts

### Implementation for User Story 4

- [ ] T065 [US4] Create Server Actions for roster in src/lib/actions/roster.ts (getRoster, getTraineeDetail, calculateAdherence, detectAlerts)
- [ ] T066 [US4] Create RosterPage in src/app/(trainer)/roster/page.tsx
- [ ] T067 [P] [US4] Create RosterTable component in src/components/roster/RosterTable.tsx (sortable, with adherence %, alerts)
- [ ] T068 [P] [US4] Create AlertBadge component in src/components/roster/AlertBadge.tsx (missed sessions, plateau)
- [ ] T069 [US4] Create TraineeDetailPage in src/app/(trainer)/trainee/[id]/page.tsx
- [ ] T070 [P] [US4] Create TraineeSessionHistory component in src/components/roster/TraineeSessionHistory.tsx
- [ ] T071 [P] [US4] Create TraineeProgramHistory component in src/components/roster/TraineeProgramHistory.tsx

**Checkpoint**: Trainer can oversee all clients with data-driven insights. ✅

---

## Phase 7: User Story 5 - Trainee Tracks Bodyweight (Priority: P2)

**Goal**: Trainee logs bodyweight, sees trend chart. Trainer can hide weight from trainee view.

**Independent Test**: Log 10 entries over 2 weeks, verify chart renders correctly.

### Tests for User Story 5 ⚠️

- [ ] T072 [P] [US5] Unit test for bodyweight chart data transformation in tests/unit/lib/metrics.test.ts

### Implementation for User Story 5

- [ ] T073 [US5] Create Server Actions for metrics in src/lib/actions/metrics.ts (logWeight, getWeightHistory, toggleWeightVisibility)
- [ ] T074 [US5] Create ProgressPage in src/app/(trainee)/progress/page.tsx
- [ ] T075 [P] [US5] Create WeightChart component in src/components/charts/WeightChart.tsx (Recharts line chart)
- [ ] T076 [P] [US5] Create WeightEntryForm component in src/components/charts/WeightEntryForm.tsx

**Checkpoint**: Bodyweight tracking with chart visualization working. ✅

---

## Phase 8: User Story 6 - Trainer Invites Trainee and Onboarding (Priority: P2)

**Goal**: Trainer invites by email, trainee creates account, completes profile, link activated.

**Independent Test**: Send invite, create account, complete profile, verify link in both UIs.

### Tests for User Story 6 ⚠️

- [ ] T077 [P] [US6] Integration test for invite → register → profile → link flow in tests/integration/onboarding.test.ts

### Implementation for User Story 6

- [ ] T078 [US6] Create Server Actions for invites in src/lib/actions/invite.ts (sendInvite, acceptInvite, linkTrainer)
- [ ] T079 [US6] Create LoginPage in src/app/(auth)/login/page.tsx
- [ ] T080 [P] [US6] Create RegisterPage in src/app/(auth)/register/page.tsx
- [ ] T081 [P] [US6] Create OnboardingPage (profile form) in src/app/(auth)/onboard/page.tsx
- [ ] T082 [P] [US6] Create InviteDialog component in src/components/roster/InviteDialog.tsx (trainer sends invite)
- [ ] T083 [US6] Create ProfileForm component in src/components/auth/ProfileForm.tsx (height, weight, age, sex, injuries, goals)

**Checkpoint**: Full onboarding flow from invite to active trainer-trainee link. ✅

---

## Phase 9: User Story 7 - Full Program Calendar View (Priority: P3)

**Goal**: Trainee sees full program calendar week-by-week with tap-to-preview.

**Independent Test**: Load 6-week program, verify all 42 days render with workout/rest indicators.

### Implementation for User Story 7

- [ ] T084 [US7] Create ProgramCalendarPage in src/app/(trainee)/program/page.tsx
- [ ] T085 [P] [US7] Create ProgramCalendar component in src/components/program/ProgramCalendar.tsx (week × day grid with status indicators)
- [ ] T086 [P] [US7] Create DayPreviewSheet component in src/components/program/DayPreviewSheet.tsx (bottom sheet showing day's workout on tap)
- [ ] T087 [US7] Create ProgramCountdown component in src/components/program/ProgramCountdown.tsx ("3 weeks left" indicator)

**Checkpoint**: Full program calendar with day preview working. ✅

---

## Phase 10: Stitch UI Generation

**Purpose**: Generate all screen designs via Stitch MCP, applying the NewME design system

- [ ] T088 [P] Generate Trainee Today screen via Stitch MCP generate_screen_from_text
- [ ] T089 [P] Generate Trainer Roster screen via Stitch MCP generate_screen_from_text
- [ ] T090 [P] Generate Program Builder screen via Stitch MCP generate_screen_from_text
- [ ] T091 [P] Generate Workout Logging session screen via Stitch MCP generate_screen_from_text
- [ ] T092 [P] Generate Bodyweight Progress chart screen via Stitch MCP generate_screen_from_text
- [ ] T093 [P] Generate Login/Register screens via Stitch MCP generate_screen_from_text
- [ ] T094 Apply design tokens from generated screens to Tailwind configuration
- [ ] T095 Refine all components to match Stitch-generated designs

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Quality, performance, and production readiness

- [ ] T096 [P] PWA manifest and service worker setup in public/manifest.json
- [ ] T097 [P] SEO and meta tags for all pages
- [ ] T098 Responsive layout verification (375px, 768px, 1024px, 1440px)
- [ ] T099 [P] Error boundaries and fallback UI for all routes
- [ ] T100 [P] Loading states and skeleton screens for all data-fetching pages
- [ ] T101 [P] WCAG AA accessibility audit (contrast, keyboard nav, screen reader)
- [ ] T102 Run `/speckit-converge` to verify implementation matches spec
- [ ] T103 Run `npx vitest run` to verify all tests pass
- [ ] T104 Commit all changes with structured commit messages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Phase 2 completion
  - US1 (Program Builder) and US2 (Today View) can run in parallel
  - US3 (Workout Logging) depends on US2 (needs Today view context)
  - US4 (Roster) and US5 (Bodyweight) can run in parallel, independent of US1-3
  - US6 (Onboarding) can run in parallel with any other story
  - US7 (Calendar) depends on US1 (needs programs to display)
- **Stitch UI (Phase 10)**: Can start during Phase 3-9 — parallel with implementation
- **Polish (Phase 11)**: Depends on all user stories complete

### Parallel Opportunities

Within each phase, tasks marked [P] can execute concurrently. Across phases, the following can overlap:
- Stitch UI generation (Phase 10) can start as soon as Phase 2 is done
- US4 (Roster) and US5 (Bodyweight) are independent of US1-3
- US6 (Onboarding) is independent of all other stories

## Implementation Strategy

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1: Program Builder) → Trainer can create programs
3. Phase 4 (US2: Today View) → Trainee can see workouts
4. Phase 5 (US3: Logging) → Trainee can log sessions
5. **MVP CHECKPOINT** — validate US1+US2+US3 end-to-end
6. Phase 6-8 (US4-6) → Full roster, metrics, onboarding
7. Phase 9 (US7) → Calendar view
8. Phase 10-11 → Polish and Stitch integration

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
