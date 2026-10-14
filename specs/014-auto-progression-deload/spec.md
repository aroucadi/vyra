# Feature Specification: 014 In-Session Automated Overload & Deload Prescriptions

**Feature Branch**: `014-auto-progression-deload`  
**Created**: 2026-10-14  
**Status**: Approved / In-Development  
**Audit Context**: Screened through `/founder-reality-check`, `/feature-roi-auditor` (ROI: 4.80), `/mvp-police`, `/pricing-strategy-architect`, and `/ui-styling`.

---

## 1. Executive Summary & Multi-Lens Audit Justification

### 🪞 Founder Reality Check Audit
- **Evaluated Addition**: Connecting the ported biomechanical progression engine (`src/lib/training-math/progression.ts`) directly into the active session (`/session`) and daily workout screen (`/today`).
- **Evidence Tier**: **Tier 3 (Hard Proof)**. Trainees stall, plateau, or drop out when they are left guessing whether to add weight or when to deload after repeated fatigue stalls. Automated progressive overload is the primary retention driver in resistance training.
- **Bias Avoided**: Zero open-ended LLM guessing for numbers. Every single weight jump (+2.5kg / +5kg / +10lb) and deload factor (0.90 / 10% Epley reset) is computed by deterministic biomechanical pure functions.

### 📈 Feature ROI Audit
$$\text{ROI Score} = \frac{\text{Rev}(5) + \text{Learn}(4) + \text{Ret}(5) + \text{Acq}(4)}{\text{Comp}(2) + \text{Risk}(2)} = \frac{18}{4} = \mathbf{4.50} \quad (\ge 2.5 \implies \text{\textbf{APPROVED}})$$
- **Revenue Driver**: Gated under `'progression_engine'` in `src/lib/entitlements.ts`. Core upsell wedge to Vyra Pro ($19/mo).
- **Retention Driver**: Removes workout cognitive friction. Trainees immediately see their progression verdict at the end of each session.

### 👮 MVP Police & YC Scrapper Decision
- **Verdict**: **APPROVED**.
- Does not build a heavy machine-learning recommendation engine or complex notification service. Simply pipes completed `SetLog[]` through `nextPrescription()` and renders clean, scannable prescription cards obeying Vyra's UI Guardrails (max 3 elements per card, 60-30-10 dark surface, tabular numbers).

---

## 2. User Scenarios & Prioritized User Stories

### User Story 1 - Instant Overload Prescription Upon Session Completion (Priority: P1)
**As a** Trainee completing my final set of Romanian Deadlifts or Dumbbell Bench,  
**When** I tap "Finish Workout",  
**I want** to see an immediate breakdown of my prescribed weights and reps for the next session,  
**So that** I know exactly what to load without calculating percentages or wondering if I earned a weight jump.

**Acceptance Scenarios**:
1. **Given** a trainee completed all target sets at the top rep ceiling (e.g. 3×10 at 30kg in double progression),  
   **When** viewing the workout summary,  
   **Then** the prescription card displays `+2.5 kg (32.5 kg × 8 reps)` with explanation: *"Top of the rep range in every set. 2.5 kg more, back to 8 reps."*
2. **Given** a trainee missed target reps for 3 consecutive sessions at the same weight,  
   **When** viewing the summary,  
   **Then** an Epley 10% deload prescription is surfaced (e.g., reset from 100kg to 90kg) with explanation: *"Stuck for 3 sessions. Reset to 90 kg and work back up."*

---

### User Story 2 - In-Session Next Set Guidance Pill (Priority: P2)
**As a** Trainee during an active workout session,  
**When** logging my working sets,  
**I want** subtle telemetry indicating my progression threshold (e.g., "Hit 10 reps to advance weight"),  
**So that** I have an immediate psychological target during high-effort sets.

**Acceptance Scenarios**:
1. **Given** an exercise with a double progression policy (e.g., 8–10 reps),  
   **When** looking at the active set input,  
   **Then** a compact badge indicates `Overload Target: 10 reps` without cluttering the screen.

---

### User Story 3 - Entitlement Gating for Free vs Pro Trainees (Priority: P1)
**As a** Product Architect,  
**When** a Free Tier trainee completes a workout,  
**I want** them to see that progression tracking occurred with a sample teaser, but gate the full auto-applied overload prescriptions behind Vyra Pro ($19/mo),  
**So that** monetization conversion is driven naturally at the moment of highest perceived value.

**Acceptance Scenarios**:
1. **Given** a trainee with `FREE` tier,  
   **When** viewing the progression summary,  
   **Then** an upgrade banner is rendered highlighting the automated deload & progression engine.
2. **Given** a trainee with `PRO` tier (or default athlete Alaa),  
   **When** viewing the summary,  
   **Then** full prescription values and explanations are unlocked.
