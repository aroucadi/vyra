# Feature Specification: NewME MVP — Trainer↔Trainee Coaching Platform

**Feature Branch**: `001-newme-mvp`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Build the MVP of NewME — an AI-assisted strength coaching platform where a certified trainer builds, publishes, and adapts periodized workout programs for each trainee. Trainees log every session, see their progress, and get coached. MVP scope: manual program builder (no AI), trainee views/logs workouts, bodyweight chart, basic trainer roster."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trainer Creates and Publishes a Program (Priority: P1)

A certified trainer opens the program builder, creates a new multi-week periodized workout program for a specific trainee. They set the program name, start date, and end date. For each day of each week, they add exercises from a library, set rep ranges, per-set RIR (Reps In Reserve) targets, rest periods, and group exercises into supersets or circuits. They mark rest days. Once satisfied, they publish the program, which immediately appears on the trainee's app.

**Why this priority**: Without a program, the trainee has nothing to follow. This is the core value creation step — everything else depends on it.

**Independent Test**: Can be fully tested by creating a 4-week program with mixed workout and rest days, supersets, and varied rep schemes, then verifying it appears correctly on a trainee's view.

**Acceptance Scenarios**:

1. **Given** a trainer is logged in and has a linked trainee, **When** they create a new program with title "Hypertrophy Block 1", start date 2026-10-01, end date 2026-10-28, **Then** a 4-week program structure is generated with Mon-Sun slots for each week.
2. **Given** a trainer is editing a program day, **When** they add 3 exercises and group 2 into a superset, **Then** the superset is visually grouped and the rest timer configuration applies per superset round, not per individual exercise.
3. **Given** a trainer has completed a draft program, **When** they click "Publish", **Then** the program status changes to "published", the previous version (if any) is archived, and the trainee immediately sees the new program.
4. **Given** a trainer publishes a new version of a program, **When** the trainee has in-flight logs from the previous version, **Then** those logs remain attached to the version they were logged against — they are not orphaned or reassigned.

---

### User Story 2 - Trainee Views Today's Workout (Priority: P1)

A trainee opens the app and immediately sees "Today" — the single most important screen. It automatically resolves which program day they're on based on the start date and elapsed days. They see their morning routine, workout card with exercises (sets/reps/RIR/rest), nutrition plan, and a clear "Start Session" CTA. Each exercise shows an embedded video link and a muscle-anatomy reference.

**Why this priority**: The trainee experience lives or dies on this screen. If they can't instantly know "what do I do right now?", the app fails its core promise.

**Independent Test**: Can be tested by assigning a published program to a trainee, advancing the date to various days, and verifying the correct program day appears with all prescribed exercises.

**Acceptance Scenarios**:

1. **Given** a trainee has an active published program starting 2026-10-01, **When** they open the app on 2026-10-03 (a Wednesday), **Then** they see the Wednesday workout from Week 1 with all prescribed exercises, sets, reps, and RIR targets.
2. **Given** today is a rest day in the program, **When** the trainee opens the app, **Then** they see a rest day indicator with any prescribed active recovery or nutrition guidance.
3. **Given** a trainee has no active program, **When** they open the app, **Then** they see an empty state directing them to contact their trainer.

---

### User Story 3 - Trainee Logs a Workout Session (Priority: P1)

A trainee starts a workout session from the Today screen. For each exercise, they input the weight used and reps completed for each set. A rest timer auto-starts between sets (respecting the prescribed rest seconds, and running once per superset round if exercises are grouped). When they complete the session, their total duration is captured. Any personal records (best weight×reps for that exercise) are auto-detected and flagged. The completed session log is immediately visible to the trainer.

**Why this priority**: Logging is the data-generation step that makes everything else (progress tracking, trainer oversight, future AI) possible. Without logs, there's nothing to analyze.

**Independent Test**: Can be tested by starting a session, logging weight/reps for 4 exercises across 3 sets each, completing the session, and verifying all data is persisted with correct timestamps.

**Acceptance Scenarios**:

1. **Given** a trainee has started a workout session, **When** they complete a set of Bench Press at 80kg × 10 reps, **Then** the set is recorded and the rest timer automatically starts counting down from the prescribed rest period.
2. **Given** a trainee is performing a superset of Lat Pulldowns and Face Pulls, **When** they complete both exercises in the round, **Then** a single rest timer starts for the superset rest period.
3. **Given** a trainee's previous best for Squat was 100kg × 8 reps, **When** they log 100kg × 9 reps, **Then** the app flags this as a Personal Record (PR).
4. **Given** a trainee finishes all exercises, **When** they end the session, **Then** the total session duration (start to finish) is recorded and the session is immediately visible in the trainer's console.

---

### User Story 4 - Trainer Views Roster and Trainee Progress (Priority: P2)

A trainer opens their roster dashboard to see all linked trainees at a glance. For each trainee, they see adherence percentage, last logged session date, current program week, and alert indicators (e.g., 3+ missed sessions, flat progress for 2+ weeks). They can tap into any trainee to see full workout history, bodyweight chart, and the currently assigned program with version history.

**Why this priority**: The trainer needs oversight to do their job effectively. Without a roster, they're flying blind across multiple clients.

**Independent Test**: Can be tested by having 3 trainees with varying adherence levels and verifying the roster displays correct stats and alert indicators.

**Acceptance Scenarios**:

1. **Given** a trainer has 3 linked trainees, **When** they open the roster, **Then** they see each trainee's name, adherence %, last session date, and current program week in a sortable table.
2. **Given** a trainee has missed 3+ consecutive scheduled workout days, **When** the trainer views the roster, **Then** an alert indicator appears next to that trainee.
3. **Given** a trainer taps on a specific trainee, **When** the detail view opens, **Then** they see the trainee's full session log history, bodyweight chart, and current program with all versions.

---

### User Story 5 - Trainee Tracks Bodyweight Over Time (Priority: P2)

A trainee manually logs their bodyweight. Over time, a line chart shows their weight trend. The weigh-in cadence can be configured by the trainer (e.g., daily, weekly). Weight tracking is optional per trainee and can be hidden from their own view if the trainer flags a concern.

**Why this priority**: Bodyweight is the simplest objective progress metric and informs trainer decisions about nutrition and programming adjustments.

**Independent Test**: Can be tested by logging 10 bodyweight entries over a simulated 2-week period and verifying the chart renders correctly with proper date axis.

**Acceptance Scenarios**:

1. **Given** a trainee logs bodyweight daily for 7 days, **When** they view the progress chart, **Then** they see a line chart with 7 data points, properly labeled axes, and a trend line.
2. **Given** a trainer has flagged "hide weight from trainee" for a specific client, **When** that trainee views their profile, **Then** the bodyweight section is not visible — but the trainer can still see the data.

---

### User Story 6 - Trainer Invites Trainee and Onboarding (Priority: P2)

A trainer invites a new trainee by email. The trainee receives an invitation, creates an account (or logs in), and completes their profile (height, weight, age, sex, injuries, goals). Once complete, the trainer-trainee link is established and the trainer can assign a program.

**Why this priority**: This is the entry point for all users into the system. Without onboarding, there are no trainees to serve.

**Independent Test**: Can be tested by a trainer sending an invite email, a new user creating an account, completing profile, and verifying the link appears in both the trainer's roster and trainee's profile.

**Acceptance Scenarios**:

1. **Given** a trainer enters a trainee's email and sends an invite, **When** the trainee clicks the link and creates an account, **Then** they are prompted to complete their profile before the link is activated.
2. **Given** a trainee completes all required profile fields (height, weight, age, sex, goals), **When** they submit, **Then** the trainer-trainee link status changes to "active" and the trainee appears in the trainer's roster.
3. **Given** an existing user receives a trainer invite, **When** they log in, **Then** they are linked to the new trainer without re-creating their account.

---

### User Story 7 - Full Program Calendar View (Priority: P3)

A trainee can view their entire program as a week-by-week calendar showing start date through end date, with the ability to tap any day to preview that day's workout. They can see how many weeks remain in the program.

**Why this priority**: Gives trainees context and motivation — seeing the full arc of their training block.

**Independent Test**: Can be tested by loading a 6-week program and verifying all 42 days render correctly with workout/rest indicators.

**Acceptance Scenarios**:

1. **Given** a trainee has a 4-week program, **When** they view the program calendar, **Then** they see all 4 weeks laid out with each day showing workout type or rest day indicator, and a "2 weeks left" counter if they're in week 2.

---

### Edge Cases

- What happens when a trainee opens the app before any program is assigned? → Empty state with guidance.
- What happens when a program's end date has passed? → Show "program completed" state with option to view past sessions.
- What happens when the trainer deletes a published program while trainee has active logs? → Logs are preserved; program is archived, not deleted.
- What happens when a trainee logs weight but the trainer hasn't configured weigh-in cadence? → Default to any-time entry with no cadence enforcement.
- What happens when a superset has 3+ exercises? → Supported — the rest timer fires once after all exercises in the block are completed for that round.
- What happens when the trainee's timezone differs from the trainer's? → "Today" resolves based on the trainee's local timezone.
- What happens when a trainer invites an email that's already a trainee of another trainer? → The user can have multiple trainers; they switch context via role-scoped UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support two distinct user roles: Trainer and Trainee, with a single account capable of holding both roles simultaneously.
- **FR-002**: System MUST provide role-scoped UI — users land on the correct home screen (Roster for trainers, Today for trainees) based on active context.
- **FR-003**: Trainers MUST be able to create multi-week periodized programs with day-by-day structure (Mon-Sun × N weeks).
- **FR-004**: Programs MUST support three block types: straight sets, supersets, and circuits, with exercises grouped visually and timer behavior adjusted per type.
- **FR-005**: Each exercise prescription MUST include: exercise reference, set count, rep range (low-high), per-set RIR targets, rest period, and optional video/muscle-anatomy links.
- **FR-006**: Programs MUST follow a Draft → Publish workflow with version history; publishing archives the previous version and makes the new one immediately available to the trainee.
- **FR-007**: The trainee "Today" screen MUST auto-resolve the current program day from the program's start date and elapsed days, accounting for the trainee's local timezone.
- **FR-008**: Workout logging MUST capture weight, reps, and achieved RIR per set, with automatic rest timer management (per-set for straight sets, per-round for supersets/circuits).
- **FR-009**: System MUST auto-detect Personal Records (best weight × reps per exercise per trainee) and flag them immediately upon logging.
- **FR-010**: Session duration MUST be captured automatically (start timestamp to end timestamp).
- **FR-011**: All logged sessions MUST be immediately visible to the linked trainer.
- **FR-012**: System MUST provide a bodyweight tracking feature with manual entry and line chart visualization.
- **FR-013**: Bodyweight tracking MUST be optional per trainee; trainers MUST be able to hide the weight section from a trainee's view while retaining access themselves.
- **FR-014**: Trainers MUST be able to invite trainees by email; invited trainees complete a profile (height, weight, age, sex, injuries, goals) before the link is activated.
- **FR-015**: Trainer roster MUST display: trainee name, adherence %, last session date, current program week, and alert indicators (3+ missed sessions, flat progress ≥2 weeks).
- **FR-016**: System MUST maintain a seeded exercise library with name, primary/secondary muscles, equipment, and optional video/wiki URLs.
- **FR-017**: Program version history MUST preserve in-flight logs — logs stay attached to the version they were logged against.

### Key Entities

- **User**: Represents any person in the system. Has a role (trainer, trainee, or both), profile information (name, date of birth, sex, height, injuries, goals), and authentication credentials.
- **TrainerLink**: Represents the coaching relationship between a trainer and trainee, with a status lifecycle (active, paused, ended).
- **Program**: A periodized training plan created by a trainer for a specific trainee. Has a lifecycle (draft → published → archived) and version lineage.
- **ProgramWeek**: A single week within a program, ordered by week index.
- **ProgramDay**: A single day within a week, identified by day of week. Contains workout blocks, morning routine, and nutrition plan. May be a rest day.
- **Block**: A grouping of exercises within a workout day, typed as straight, superset, or circuit. Determines timer behavior and visual grouping.
- **ExercisePrescription**: The specific prescription for an exercise within a block — sets, rep range, per-set RIR targets, rest period, load guidance, form cues, and muscle group targets.
- **Exercise**: A library entry representing a specific movement (e.g., Bench Press), with muscle targeting information and instructional references.
- **WorkoutSession**: A record of a trainee completing a workout on a specific date, with start/end timestamps and per-set logs.
- **SetLog**: Individual set data within a session — weight, reps, achieved RIR, and PR flag.
- **BodyMetricEntry**: A timestamped bodyweight measurement for a trainee.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trainees can identify their workout for today within 3 seconds of opening the app.
- **SC-002**: Trainees can log a complete 4-exercise, 3-sets-each workout in under 5 minutes of active input time (excluding rest periods).
- **SC-003**: Trainers can create a complete 4-week program from scratch in under 30 minutes.
- **SC-004**: Trainer roster loads and displays all trainee stats (adherence, alerts) within 2 seconds for up to 50 trainees.
- **SC-005**: 100% of logged sessions are visible to the trainer within 5 seconds of completion.
- **SC-006**: Personal Records are detected and displayed to the trainee within 1 second of logging a qualifying set.
- **SC-007**: Bodyweight chart renders correctly for up to 365 daily entries with smooth scrolling/zooming.
- **SC-008**: Onboarding flow (from invite click to profile completion) takes under 5 minutes for a new trainee.
- **SC-009**: Program publishing (draft → published) takes under 3 seconds and is immediately reflected on the trainee's device.

## Assumptions

- Users have stable internet connectivity during workout logging (offline support is out of scope for MVP).
- Firebase Auth / Identity Platform will be used for authentication (email/passkey).
- The exercise library will be seeded with a curated set of common exercises (50-100); trainers can add custom exercises.
- Nutrition plan features (meal plans, food entries) will have the data model in place but minimal UI in MVP — full nutrition UI is V1 scope.
- Progress photos and AI features are explicitly out of MVP scope (V1 and V2 respectively).
- The application is a mobile-first PWA; native iOS/Android apps are not in scope.
- A single trainer can have up to 50 trainees in MVP; scaling beyond that is a V1 concern.
- Video content for exercises will be linked externally (YouTube/Vimeo URLs) in MVP, not self-hosted.
