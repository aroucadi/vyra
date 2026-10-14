# Architecture & Technical Plan: 015 Structural Balance Radar & Intelligent Posture UI

## 1. Component Architecture & Data Flow

```
WorkoutSession[] + Athlete Weigh-in (kg)
                   │
                   ▼
     `computeBalance(S, template)`
       (Poliquin / Thibaudeau / ATG)
                   │
                   ▼
     `RoleEvaluationResult[]`
  (actualPct, targetPct, status, current)
                   │
                   ├──► `StructuralBalanceRadar.tsx` (SVG Multi-Axis Radar)
                   │
                   └──► `IntelligentPostureDiagnosis.tsx` (Intelligent UI)
                            │
                            ├── Biomechanical Risk Synthesis
                            └── 1-Tap Corrective Injection (`appStore.swapExerciseInActiveProgram`)
```

## 2. File Boundaries & Modifications

1. **`src/components/trainee/StructuralBalanceRadar.tsx`**:
   - Pure SVG multi-axis polygonal radar chart.
   - Compares target polygon (100% standard envelope) against actual lifter polygon.
   - Interactive role selection with detailed current 1RM load, target weight, and status badge.

2. **`src/components/trainee/IntelligentPostureDiagnosis.tsx`**:
   - Intelligent UI diagnostic card:
     - Summarizes structural balance across anterior vs posterior chain.
     - Outlines specific biomechanical risk flags (e.g. Anterior Shoulder Impingement, Lumbar Overload).
     - Provides tailored accessory corrective prescription with 1-tap "Add to Blueprint" action.

3. **`src/app/(trainee)/posture/page.tsx`**:
   - Dedicated Postural Architecture page at `/posture`.
   - Allows switching between templates (`Poliquin Standard`, `Thibaudeau Power`, `ATG Functional`).
   - Gated via `hasEntitlement(tier, 'structural_balance_radar')`.

4. **`src/components/trainee/TraineeNav.tsx` or `/you`**:
   - Add direct entry point to `/posture` from the profile or program overview.

5. **`tests/unit/lib/structural-balance-ui.test.ts`**:
   - Verification suite ensuring radar geometry calculation, balance status rendering, and template switching.
