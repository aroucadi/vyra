# Task Breakdown: 014 In-Session Automated Overload & Deload Prescriptions

- [x] **Task 1: Progression Adapter Bridge** (`src/lib/progression-adapter.ts`)
  - [x] Map Vyra `WorkoutSession` & `SetLog` to OpenGym `SessionRecord`
  - [x] Implement `computeExercisePrescription(sessions, exerciseConfig)` using `nextPrescription`
  - [x] Format human-readable rationale from `why` tokens
- [x] **Task 2: Overload Prescription Card Component** (`src/components/trainee/OverloadPrescriptionCard.tsx`)
  - [x] Eyebrow with policy name and color-coded status badge (`UP` emerald, `DELOAD` rose, `HOLD` slate)
  - [x] Primary value with next target load and reps formatted with `tabular-nums`
  - [x] Plain-English rationale explanation
  - [x] Pro entitlement check with clean upgrade prompt for Free tier
- [x] **Task 3: In-Gym Active & Summary Integration** (`src/app/(trainee)/session/page.tsx`)
  - [x] In active set logging view: Display compact target ceiling pill
  - [x] In summary view: Render Overload Prescriptions section for all completed exercises
  - [x] Save updated target weights for future sessions
- [x] **Task 4: Unit Test Suite & Build Verification** (`tests/unit/lib/auto-progression-integration.test.ts`)
  - [x] Test double progression weight advance upon hitting rep ceiling
  - [x] Test 3-session stall streak triggering Epley 10% deload
  - [x] Test Free vs Pro entitlement enforcement
  - [x] Verify test suite passes with `npm test` and build clean with `npx next build`
