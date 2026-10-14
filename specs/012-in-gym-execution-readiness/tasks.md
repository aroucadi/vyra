# Task Breakdown: 012 In-Gym Execution & Rest Interval Autoregulation

**Spec**: `specs/012-in-gym-execution-readiness/spec.md`  
**Plan**: `specs/012-in-gym-execution-readiness/plan.md`  

---

## Task Checklist

- [ ] **Task 1: Core Sound Synthesizer (`src/lib/in-gym/sound.ts`)**
  - Implement Web Audio Context dual-tone alert without external audio files.
  - Safe browser audio context resume.

- [ ] **Task 2: Screen Wake Lock Controller (`src/lib/in-gym/wakelock.ts`)**
  - Request screen wake lock when session is active.
  - Listen to `visibilitychange` to re-acquire on return and release on completion.

- [ ] **Task 3: Floating Rest Interval Bar Component (`src/components/trainee/RestIntervalBar.tsx`)**
  - Sticky bottom overlay in thumb zone.
  - Countdown animation, +30s / -15s quick adjust, and mute/unmute toggle.

- [ ] **Task 4: Session Integration (`src/app/(trainee)/session/page.tsx`)**
  - Trigger rest interval on set completion checkbox.
  - Display ghost placeholder with last logged load and reps.

- [ ] **Task 5: Vitest Unit Test Suite (`tests/in-gym-execution.test.ts`)**
  - Test audio fallback, wake lock safety, and interval bounds.
  - Verify all tests pass and production build succeeds.
