# Task Breakdown: 014 In-Session Automated Overload & Deload Prescriptions

- [ ] **Task 1: Progression Adapter Bridge** (`src/lib/progression-adapter.ts`)
  - [ ] Map Vyra `WorkoutSession` & `SetLog` to OpenGym `SessionRecord`
  - [ ] Implement `computeExercisePrescription(sessions, exerciseConfig)` using `nextPrescription`
  - [ ] Format human-readable rationale from `why` tokens
- [ ] **Task 2: Overload Prescription Card Component** (`src/components/trainee/OverloadPrescriptionCard.tsx`)
  - [ ] Eyebrow with policy name and color-coded status badge (`UP` emerald, `DELOAD` rose, `HOLD` slate)
  - [ ] Primary value with next target load and reps formatted with `tabular-nums`
  - [ ] Plain-English rationale explanation
  - [ ] Pro entitlement check with clean upgrade prompt for Free tier
- [ ] **Task 3: In-Gym Active & Summary Integration** (`src/app/(trainee)/session/page.tsx`)
  - [ ] In active set logging view: Display compact target ceiling pill
  - [ ] In summary view: Render Overload Prescriptions section for all completed exercises
  - [ ] Save updated target weights for future sessions
- [ ] **Task 4: Unit Test Suite & Build Verification** (`tests/unit/lib/auto-progression-integration.test.ts`)
  - [ ] Test double progression weight advance upon hitting rep ceiling
  - [ ] Test 3-session stall streak triggering Epley 10% deload
  - [ ] Test Free vs Pro entitlement enforcement
  - [ ] Verify test suite passes with `npm test` and build clean with `npx next build`
