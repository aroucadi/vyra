# Implementation Plan: 017 Intelligent Biomechanical Substitution Copilot

## 1. Technical Architecture & Data Flow

```text
Active Exercise Block (/session or /exercises)
        │
        ▼ (Tap "Swap Occupied Equipment")
IntelligentSubstitutionDrawer (<SubstitutionCopilotDrawer />)
        │
        ├── 1. Query /api/exercises or local catalogue index:
        │      Filter: target === activeExercise.target, category === activeExercise.category
        │      Sort: resistance curve match & mechanical similarity
        │
        ├── 2. Biomechanical Rationale Generation:
        │      computeSwapRationale(source, candidate)
        │      -> "Preserves sternal line of action with free dumbbell path."
        │
        └── 3. Action:
               onSelectSubstitute(candidate)
               -> Mutates active workout block in appStore
               -> Recalculates plate math for candidate equipment
```

## 2. Key Files & Components

1. `src/lib/training-math/substitution-copilot.ts`:
   - Pure, deterministic scoring function: `findBiomechanicalSubstitutes(currentExercise, catalogue, options)`.
   - Generates contextual coach rationale based on equipment and resistance profiles.
2. `src/components/trainee/SubstitutionCopilotDrawer.tsx`:
   - High-performance, clean bottom drawer with 3 ranked alternatives.
   - Shows equipment badge, resistance match, and 1-sentence rationale.
3. Integration in `/session` and `/exercises`:
   - Connects to `onSelectAsSubstitute`.

## 3. Verification Strategy

- Unit tests in `tests/unit/lib/substitution-copilot.test.ts`:
  - Verifies resistance profile matching (e.g. Pec Deck ➔ DB Flye, Barbell Squat ➔ Hack Squat / Leg Press).
  - Verifies coach rationale string formatting.
- Integration test in `tests/qa-in-gym-mobile-walkthrough.test.ts`.
