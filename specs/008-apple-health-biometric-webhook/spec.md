# Feature Specification: Lightweight Apple Health Biometrics Webhook

**Feature Branch**: `008-apple-health-biometric-webhook`  
**Created**: 2026-09-27  
**Status**: IN PROGRESS (Lightweight Phase 1 Wedge)  
**Parent Roadmap**: [Customer Journey Architecture](file:///d:/rouca/DVM/workPlace/NewMe/docs/strategy/customer-journey-map.md) & [gStack Sprint Blueprint](file:///d:/rouca/DVM/workPlace/NewMe/specs/007-adaptive-hypertrophy-wedge/spec.md)

---

## 1. Executive Summary & Problem Framing

### The Problem
While Vyra's Autoregulation Engine (`src/lib/autoregulation.ts`) provides high-leverage workout down-regulation, it currently requires the lifter to manually declare their sleep duration (e.g. tapping "5h" or "6.5h"). This manual step:
1. Adds cognitive friction before a 06:30 AM lift.
2. Relies on subjective recall rather than objective physiological recovery.
3. Misses invisible nervous system degradation (e.g., sleeping 7 hours, but with zero Deep Sleep and an HRV drop of 30%).

### The Lightweight Solution (The "Do Things That Don't Scale" Wedge)
Instead of building a 4-month native Swift iOS and WatchOS companion app or committing to expensive wearable aggregators upfront, Vyra exposes a secure, lightweight **Biometrics Webhook Endpoint**:
```http
POST /api/webhooks/biometrics
```
This endpoint ingests automated morning health packets from Apple Watch / Apple Health (via standard iOS Shortcuts or the free *Health Auto Export* utility).

The agentic engine parses:
* **Sleep Duration & Sleep Architecture** (`sleepHours`, `deepSleepMinutes`)
* **Autonomic Nervous System Readiness** (`hrvMs` - Heart Rate Variability)
* **Cardiovascular Rest State** (`restingHeartRateBpm`)
* **Metabolic Output** (`activeEnergyBurnedKcal`)

When the trainee opens Vyra at the gym, the Today HUD and workout preview are **already calibrated** to their exact biometric reality with zero manual input required.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - Automated Morning Biometric Ingestion (Priority: P1)
**Given** an Apple Watch records Alaa's overnight sleep (5h 15m, 32m deep sleep, HRV 42ms vs 58ms baseline),  
**When** the automated iOS Shortcut / Health exporter POSTs the JSON payload to `/api/webhooks/biometrics`,  
**Then**:
1. The endpoint validates the payload and authentication secret.
2. The snapshot is saved to `appStore` under Alaa's biometric history.
3. The response returns HTTP 200 OK with the computed readiness score and CNS fatigue diagnosis.

### User Story 2 - Zero-Tap Adaptive Recalibration on the Gym Floor (Priority: P1)
**Given** a biometric snapshot was ingested at 07:00 AM indicating CNS fatigue,  
**When** Alaa opens Today (`/today`) or Workout Preview (`/session?mode=preview`) at 07:15 AM,  
**Then**:
1. The sleep selector automatically displays `5.2h (Apple Watch Synced)`.
2. The `AdaptiveRecalibrationCard` displays:
   - Eyebrow: `APPLE WATCH SYNCED · HRV SUPPRESSED 28%`
   - Hero Delta: `Back Squats: 140 kg → 125 kg (-10%)`
   - Clinical note: `Deep Sleep 32m (<45m baseline) · RIR +1 buffer applied`
3. Alaa taps `[ Begin Workout → ]` with zero manual logging friction.

### User Story 3 - Caloric Compensation for High-Energy Events (Priority: P2)
**Given** Alaa plays a 90-minute Monday night football match and burns 750 active kcal recorded by Apple Watch,  
**When** the sync packet arrives,  
**Then** the nutrition timeline adjusts to reflect:
- `+350 kcal / +35g carbohydrates recommended in post-match fueling window`.
