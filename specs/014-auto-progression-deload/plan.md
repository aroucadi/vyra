# Architecture & Technical Plan: 014 In-Session Automated Overload & Deload Prescriptions

## 1. Component Architecture & Data Flow

```
Completed WorkoutSession (SetLog[])
                 │
                 ▼
    `progression-adapter.ts` (Bridge)
                 │
                 ├── Transform Vyra sessions into OpenGym SessionRecord[]
                 ├── Execute `nextPrescription(S, cfg, routine, sessions)`
                 │
                 ▼
       PrescriptionResult
  (kind: 'up' | 'hold' | 'deload', weight, reps, why)
                 │
                 ▼
  `OverloadPrescriptionCard.tsx`
                 │
                 ├── UI Guardrails: Max 3 vertical elements
                 ├── 60-30-10 Obsidian slate theme + Tabular nums
                 └── Gated via `hasEntitlement(tier, 'progression_engine')`
```

## 2. File Boundaries & Modifications

1. **`src/lib/progression-adapter.ts`**:
   - Adapts Vyra's `WorkoutSession` array from `appStore.getSessions(traineeId)` to `SessionRecord[]`.
   - Computes `PrescriptionResult` for an exercise prescription using `nextPrescription`.
   - Evaluates whether an active exercise set meets the progression ceiling or triggers a stall.

2. **`src/components/trainee/OverloadPrescriptionCard.tsx`**:
   - Clean, minimalist card rendering:
     - 1. Eyebrow: Policy name (`Double progression`, `Linear LP`) + Status Badge (`OVERLOAD +2.5KG`, `DELOAD -10%`, `HOLD`)
     - 2. Primary value: Next target load & reps (`32.5 kg × 8 reps`)
     - 3. Supporting rationale: Formatted string from `why` array.
   - Shows Pro upgrade trigger if user tier lacks `'progression_engine'`.

3. **`src/app/(trainee)/session/page.tsx`**:
   - In active session view: Adds subtle target ceiling badge `Target: 10 reps to advance`.
   - In summary view (`mode === "summary"`): Renders `OverloadPrescriptionCard` for all completed exercises.
   - Persists updated exercise target loads so the next session automatically starts at the new weight.

4. **`tests/unit/lib/auto-progression-integration.test.ts`**:
   - Verification suite with 100% deterministic test coverage.
