# Implementation Plan: 012 In-Gym Execution & Rest Interval Autoregulation

**Spec Reference**: `specs/012-in-gym-execution-readiness/spec.md`  
**Status**: Ready for Execution  

---

## 1. Technical Architecture & Component Slices

```mermaid
flowchart TD
    subgraph ClientExecution["PWA In-Gym Execution Layer"]
        SetCheck[User Checks Set Row] --> AutoTimer[Trigger Rest Countdown]
        AutoTimer --> FloatingBar[Docked Floating Rest Bar (PWA Thumb Zone)]
        FloatingBar --> WakeLockService[Screen Wake Lock Controller]
        AutoTimer --> SoundSynth[Web Audio API Dual-Tone Chime]
        SetCheck --> AutoPreload[Ghost Placeholder: Last Set Load]
    end
```

---

## 2. Phase Breakdown

### Phase 1: Zero-Dependency Audio & Screen Wake Lock Service
- **File**: `src/lib/in-gym/sound.ts`
  - Synthetic Web Audio Context sound generator (two-tone beep at 880Hz -> 1760Hz).
  - Handles browser audio unlocking on first user interaction.
- **File**: `src/lib/in-gym/wakelock.ts`
  - Safe navigator.wakeLock request and auto-release listener on page visibility changes.

### Phase 2: Docked Rest Timer Component
- **File**: `src/components/trainee/RestIntervalBar.tsx`
  - Docked floating bar at bottom of mobile PWA viewport.
  - Ticking seconds, radial circular progress indicator, and "+30s / Skip" controls.
  - Triggers audio chime when reaching 00:00.

### Phase 3: Integration into Session Logging Flow
- **File**: `src/app/(trainee)/session/page.tsx`
  - Auto-trigger timer when set checkbox is checked.
  - Populate ghost placeholders for sets using `appStore.getLatestLoggedSetForExercise()`.
  - Mount `RestIntervalBar` during active workout state.

### Phase 4: Unit Testing & Verification
- **File**: `tests/in-gym-execution.test.ts`
  - Vitest test suite testing sound synthesis options, wake lock fallback safety, and timer calculations.
