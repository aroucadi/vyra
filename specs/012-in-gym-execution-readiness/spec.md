# Feature Specification: 012 In-Gym Execution & Rest Interval Autoregulation

**Feature Branch**: `012-in-gym-execution-readiness`  
**Created**: 2026-10-13  
**Status**: Approved / Draft  
**Audit Context**: Screened through `/founder-reality-check`, `/feature-roi-auditor` (ROI: 3.5), `/mvp-police`, and `/yc-mvp-scrapper`.  

---

## 1. Executive Summary & Audit Justification

### 🪞 Founder Reality Check Audit
- **Evaluated Addition**: Rest Countdown Timer, Sound Alerts & WakeLock screen preservation (Adapted from OpenGym `sound.js`, `rest-alert.js`, `wakelock.js`).
- **Evidence Tier**: **Tier 3 (Hard In-Gym Proof)**. Trainee #1 (Alaa) logging workouts on iPhone Safari experiences screen sleep between heavy 3-minute rest periods, missing target rest timing and causing app re-render delays.
- **Bias Avoided**: Zero native wrapper (Capacitor/Swift) required. Standard PWA Screen Wake Lock API and HTML5 Web Audio fulfill 100% of the in-gym need with zero App Store friction.

### 📈 Feature ROI Audit
$$\text{ROI Score} = \frac{\text{Rev}(3) + \text{Learn}(3) + \text{Ret}(5) + \text{Acq}(3)}{\text{Comp}(2) + \text{Risk}(2)} = \frac{14}{4} = \mathbf{3.5} \quad (\ge 2.5 \implies \text{\textbf{APPROVED}})$$
- **Retention Driver**: Lifters spend 80% of workout time resting between sets; an interactive rest timer directly anchors the core logging loop.

### 👮 MVP Police & YC Scrapper Decision
- **Verdict**: **APPROVED FOR ZERO-DEPENDENCY CLIENT CODE**.
- Pure client-side Web Audio synthesis + Navigator Wake Lock API. No background push servers, no third-party audio asset CDNs, zero cloud storage costs.

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 - Automatic In-Gym Rest Timer & Audio Cues (Priority: P1)
**As a** Trainee logging a heavy compound set on mobile PWA,  
**When** I check off a completed set (e.g., 100 kg x 8 reps),  
**I want** an automatic rest countdown timer (e.g. 90s or 180s) with clean audio completion beeps,  
**So that** I don't need a separate stopwatch or phone timer app while resting in the gym.

**Acceptance Scenarios**:
1. **Given** an active workout set is completed, **When** the trainee taps "Complete Set", **Then** the rest timer triggers automatically with the exercise's prescribed rest interval (default: 90s).
2. **Given** the timer reaches 0, **When** countdown completes, **Then** a synthesized dual-tone audio chime sounds even if the gym is noisy, and a visual pulse alerts the lifter.

---

### User Story 2 - Screen Wake Lock During Active Workout (Priority: P2)
**As a** Lifter between heavy working sets,  
**When** my phone sits on the gym bench for 2-3 minutes,  
**I want** the display to stay awake without dimming or locking,  
**So that** my active timer and next prescribed load remain visible without touching the screen with chalky/sweaty hands.

**Acceptance Scenarios**:
1. **Given** a workout session is active, **When** the page is in the foreground, **Then** `navigator.wakeLock.request('screen')` is acquired.
2. **Given** the session is ended or app minimized, **When** visibility changes, **Then** the wake lock is cleanly released to preserve battery.

---

### User Story 3 - Instant Set History & Last Weight Fill (Priority: P3)
**As a** Trainee starting an exercise today,  
**When** I view the first set row,  
**I want** my previous session's weight and reps automatically pre-filled as placeholder ghost text,  
**So that** I know my exact overload target without navigating away to history charts.

**Acceptance Scenarios**:
1. **Given** an exercise previously logged on 2026-10-09 at 85 kg x 10 reps, **When** the exercise opens today, **Then** the set inputs show `85 kg x 10` as ghost placeholder text.

---

## 3. Technical Requirements

- **FR-012-1**: System MUST provide a zero-dependency Web Audio chime generator (`sound.ts`) producing clean synthetic frequencies (880Hz / 1760Hz) without downloading external mp3 files.
- **FR-012-2**: System MUST integrate the `Screen Wake Lock API` with automatic release upon session completion or window blur.
- **FR-012-3**: System MUST auto-start the rest interval timer upon set completion and support quick adjustment (+30s / -30s).
- **FR-012-4**: System MUST store and surface last-session working weight/reps as ghost placeholders on each set row.
