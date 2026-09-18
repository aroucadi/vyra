# Implementation Plan: Exercise Confidence Card (ECC) & Stealth Gym Mode

**Branch**: `005-exercise-confidence-card` | **Date**: 2026-09-17 | **Spec**: [specs/005-exercise-confidence-card/spec.md](specs/005-exercise-confidence-card/spec.md)

## Summary
Implement the Exercise Confidence Card (ECC) inside NewME to eradicate beginner gym anxiety ("gymtimidation"). Deliver instant visual hardware identification, grip and wrist mechanics with visual cues, sensory proprioceptive feedback ("where should I feel it?", "by rep 8-10..."), red-flag injury warnings, and seamless 1-tap equipment fallback directly within the active workout session and Today preview.

## Technical Context
- Language/Version: TypeScript 5, Node.js 24
- Framework: Next.js 15.3 (App Router, React 19)
- Design Tokens: Tailwind CSS v4, Lucide React icons
- Testing: Node.js Test Runner via `npx tsx --test tests/unit/lib/*.test.ts`

## Proposed Changes

### 1. Domain Types & Data Model
- `src/lib/types.ts`:
  - Introduce `ExerciseConfidenceGuide` interface detailing `hardware`, `mechanics`, `proprioception`.
  - Extend `ExercisePrescription` and `EquipmentOption` with optional `confidenceGuide?: ExerciseConfidenceGuide`.

### 2. Confidence Guide Repository & Biomechanical Engine
- `src/lib/exercise-confidence-data.ts`:
  - Comprehensive catalog of Exercise Confidence Guides covering all 17 slots of the Master Transformation Blueprint across all 4 equipment modalities (Machine, Dumbbell, Cable, Bodyweight - 68 variations) plus standard compound movements.
  - `getConfidenceGuide(exerciseName: string, equipmentType?: EquipmentType): ExerciseConfidenceGuide` lookup helper with graceful biomechanical fallbacks.

### 3. Component Architecture
- `src/components/trainee/ExerciseConfidenceCard.tsx`:
  - High-performance, stealth dark-mode modal/bottom sheet.
  - Sections:
    - Top bar: Exercise name, equipment badge, close button, quick-swap equipment pills.
    - Machine Blueprint: Hardware type icon, gym aliases, 3-step setup checklist.
    - Grip & Alignment: Grip type pill (overhand/underhand/neutral/thumbless), grip width, wrist cue, 3 micro-cues, mental cue.
    - Proprioception Burn Sensor: Target burn zone, rep threshold ("by rep 8-10..."), normal strain stabilizers, red flag stop alert.

### 4. Trainee UI Integration
- `src/app/(trainee)/session/page.tsx`:
  - Add `[⚡ Guide]` trigger button on every exercise card.
  - State management for active modal.
  - Support in-card equipment switching that synchronizes with the workout logger and retains completed sets.
- `src/app/(trainee)/today/page.tsx`:
  - Add guide preview trigger on workout exercise cards.

### 5. Automated Verification & Testing
- `tests/unit/lib/exercise-confidence.test.ts`:
  - Unit tests for lookup, equipment modalities, rule-of-3 constraints, and safety triggers.
  - Full suite execution (`npm test`).
