# Tasks: Exercise Confidence Card (ECC) & Stealth Gym Mode

Feature Branch: `005-exercise-confidence-card`
Spec: [specs/005-exercise-confidence-card/spec.md](specs/005-exercise-confidence-card/spec.md)
Plan: [specs/005-exercise-confidence-card/plan.md](specs/005-exercise-confidence-card/plan.md)

---

## Task Checklist

### Phase 1: Data Modeling & Schema
- [x] T001: Define `ExerciseConfidenceGuide` interface in `src/lib/types.ts`
- [x] T002: Add `confidenceGuide?: ExerciseConfidenceGuide` to `ExercisePrescription` and `EquipmentOption` in `src/lib/types.ts`

### Phase 2: Confidence Engine & Curated Seed Data
- [x] T003: Create `src/lib/exercise-confidence-data.ts` with hardware specs, grip mechanics, and proprioceptive profiles for all Master Blueprint exercises (17 slots × 4 modalities = 68 variations)
- [x] T004: Implement `getConfidenceGuide(exerciseName: string, equipmentType?: EquipmentType): ExerciseConfidenceGuide` with robust movement-family fallbacks

### Phase 3: UI Component Development
- [x] T005: Create `src/components/trainee/ExerciseConfidenceCard.tsx` with stealth dark mode, hardware identification, grip badges, "feel it" burn sensor, and 1-tap equipment switching

### Phase 4: Trainee View Integration
- [x] T006: Integrate Confidence Card trigger (`[⚡ Guide]`) in `src/app/(trainee)/session/page.tsx`
- [x] T007: Wire in-card equipment switching to sync state with active workout logger
- [x] T008: Add guide preview trigger on `src/app/(trainee)/today/page.tsx`

### Phase 5: Automated Testing & Verification
- [x] T009: Create `tests/unit/lib/exercise-confidence.test.ts` covering lookup accuracy, safety alerts, and fallback handling
- [x] T010: Run full test suite (`npm test`) and verify 0 failures
- [x] T011: Build project (`npm run build`) to ensure type safety and production readiness
