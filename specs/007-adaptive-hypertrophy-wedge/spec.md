# Feature Specification: Vyra Adaptive Hypertrophy Wedge

**Feature Branch**: `007-adaptive-hypertrophy-wedge`  
**Created**: 2026-09-24  
**Status**: APPROVED FOR IMPLEMENTATION (gStack Plan Review Ratified)  
**Parent Strategy**: [Customer Journey Architecture](file:///d:/rouca/DVM/workPlace/NewMe/docs/strategy/customer-journey-map.md) & [Feature ROI Audit](file:///d:/rouca/DVM/workPlace/NewMe/docs/strategy/feature-roi-audit.md)

---

## 1. Executive Summary & The 10-Star Product Wedge

### The Problem (The Bleeding Neck)
Serious hypertrophy lifters (ICP: "Alaa") following structured 12–16 week periodized programs face a critical breakdown when life interferes (poor sleep, high cognitive fatigue, travel). Legacy trackers (Hevy, Strong, Excel) blindly demand pre-scheduled personal records and peak working sets regardless of nervous system readiness. The athlete either overtrains, misses reps with bad form, risks spinal injury, or has to perform mental gymnastics between warmup sets to down-regulate volume.

### The Solution (The 10-Star Experience)
Vyra's **Adaptive Hypertrophy Autoregulation Engine**:
1. **1-Tap Biometric Readiness Input**: The lifter indicates last night's sleep / readiness with a single tactile control (e.g. 5.5 hours sleep).
2. **Instant Biomechanical Volume Autoregulation**:
   - High axial-load compound lifts (Barbell Back Squat, Romanian Deadlift) are automatically down-regulated by 5–10% load to preserve spinal safety while maintaining Reps-In-Reserve (RIR) target.
   - Volume compensation shifts fatigue-heavy sets to stable machine accessories (e.g. Hack Squat, Chest-Supported Row) or prunes junk-volume sets.
3. **Sub-45s Time-to-Value (TTV)**: The lifter reviews the crisp recalibration delta card, taps **"Accept & Start"**, and begins warming up within 15 seconds.
4. **Sub-5s Set Logger**: Pre-filled previous load, $\ge 44\times 44$px touch targets, tabular numbers, and zero-latency local logging.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - Sub-optimal Sleep Recalibration (Priority: P1)
**Given** a trainee opens today's session (e.g. Leg Day: Barbell Back Squat scheduled at 315 lbs for 3 sets of 5 @ RIR 1),  
**When** they select their sleep state as 5.5 hours (sub-optimal recovery),  
**Then** an `AdaptiveRecalibrationCard` appears with:
- Eyebrow: `CNS FATIGUE DETECTED · SPINAL LOAD MITIGATION`
- Hero Delta: `Back Squats: 315 lbs → 295 lbs (Preserves RIR 2)`
- Volume note: `1 set shifted to Hack Squat machine (Axial spinal compression reduced 40%)`
- Primary CTA: `Accept & Recalibrate`  
- Secondary Action: `Keep Original (315 lbs)`

### User Story 2 - Sub-5s Set Logging with Smart Defaults (Priority: P1)
**Given** the trainee accepts the recalibrated workout and starts Set 1,  
**When** the active exercise screen loads,  
**Then**:
- The weight is pre-filled to 295 lbs and reps to 5.
- Stepper buttons (+/- 2.5 kg or 5 lbs, +/- 1 rep) meet the $\ge 44\times 44$px touch target floor.
- Tapping `Log Set 1` records the set in $< 100$ms, starts the rest timer automatically, and emits a non-blocking telemetry event.

### User Story 3 - Telemetry & Activation Instrumentation (Priority: P2)
**Given** a user navigates through the workout preview, recalibration, and logging loop,  
**When** actions occur,  
**Then** `lib/telemetry.ts` logs structured events:
- `workout_preview_viewed`
- `workout_recalibration_applied`
- `workout_set_logged`
- `workout_completed`  
with zero blocking of UI threads and zero PII.
