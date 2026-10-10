# Spec 010: AI Coach Smart Action Cards & Real Program Mutation Engine

## Executive Overview
Transforms the AI Coach chat (`/coach`) from a conversational text-only advisor with static `alert()` placeholders into an **autonomous physiological co-pilot** that renders **Structured Smart Action Cards** and executes **real-time program mutations** directly into the trainee's active 16-week blueprint.

---

## 1. The ICP Problem
- **Trainee Persona**: Alaa (33yo corporate lawyer/athlete).
- **Gym Floor & Recovery Friction**: When Alaa experiences shoulder tightness, low sleep, or is pressed for time before an arbitration hearing, conversational advice (*"You should swap incline press for dumbbells and do fewer sets"*) forces him to manually navigate away, calculate new weights, and remember what to do.
- **The Solution**: The Coach analyzes his inquiry against his active program and Apple Watch biometrics, generates a focused, 3-element **Smart Action Card** directly in the chat, and provides a 1-tap **"Apply to Program Blueprint"** action that mutates the live workout day in `appStore`.

---

## 2. Core Functional Requirements

### FR-1: Real-Time Program Mutation Engine (`src/lib/store.ts`)
- `swapExerciseInActiveProgram(traineeId, currentExerciseName, newExerciseName, dayOfWeek?)`:
  - Locates the active published program.
  - Substitutes the target exercise in the appropriate block while matching target rep ranges and adjusting RIR/equipment.
  - Updates program timestamp and persists state.
- `condenseActiveProgramDay(traineeId, targetDurationMinutes, dayOfWeek?)`:
  - Prunes accessory volume sets (e.g., reduces 3-4 sets to 2 sets for compounds and removes tertiary accessories) so total session duration $\le 30-40$ minutes.
  - Preserves primary stimulus while capping volume.
- `recalibrateActiveProgramLoads(traineeId, loadFactor, rirDelta, dayOfWeek?)`:
  - Down-regulates axial compound loads and increases RIR buffer directly on the active program day.

### FR-2: Structured Smart Action Card Primitive (`src/components/coach/CoachSmartActionCard.tsx`)
- Adheres to `AGENTS.md` and `pencilplaybook`:
  - **Negative Constraint**: Maximum 3 vertical elements per card:
    1. *Eyebrow*: Action Category + Target Day Badge (e.g. `AUTOREGULATION · THURSDAY BLUEPRINT`).
    2. *Hero Mutation*: Before $\rightarrow$ After comparison with delta highlight.
    3. *Single Primary CTA*: High-contrast 44px touch target (e.g. `Apply to Thursday Blueprint`).
  - **Post-Action State**: Transitions seamlessly to a verified confirmation state: `✓ Thursday Blueprint Updated · Go to Workout →`.

### FR-3: Biometric & Program-Aware Intent Resolver (`src/lib/coach-engine.ts`)
- Analyzes incoming trainee queries and contextualizes them with:
  - Trainee's current active program day (from `resolveProgramDay`).
  - Trainee's latest Apple Watch wearable snapshot (`hrvMs`, `sleepHours`).
  - Trainee's exercise personal records (`getPersonalBestForExercise`).
- Emits structured response payloads containing clinical commentary and an optional `smartCard` payload.

### FR-4: Telemetry & Retention Tracking
- Dispatches `coach_smart_action_applied` and `coach_smart_action_dismissed` to `telemetry.track`.
