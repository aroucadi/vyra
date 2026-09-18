# Task Matrix: Master Hypertrophy & Postural Architecture Protocol Adaptation

Feature Branch: `003-master-protocol-adaptation`
Status: Ready for Execution

- [x] Task 1: Type Definitions (`src/lib/types.ts`)
  - [x] Add `hasDropSet?: boolean` and `dropSetGuidance?: string` to `ExercisePrescription`
  - [x] Add `isDropSet?: boolean` to `SetLog`
  - [x] Add `DailyMealSlot` interface and `dailyMeals?: DailyMealSlot[]` to `MealPlanPrescription`

- [x] Task 2: Master Protocol Seeding (`src/db/seed/master-transformation-program.ts`)
  - [x] Update program title to "The Master Hypertrophy & Postural Architecture Protocol"
  - [x] Update `workoutDayNutrition` with complete `dailyMeals` (07:00 to 22:45)
  - [x] Update Monday: Set Slot 4 to 2 sets, add Slot 5 (Lateral Delt Sweep 1, 3 sets x 15-20) with 4 equipment variants
  - [x] Update Wednesday: Set Slot 5 to Lateral Delt Sweep 2 (3 sets x 12-15) with 4 equipment variants
  - [x] Update Thursday: Slot 2 Set 4 marked with `hasDropSet: true` and `dropSetGuidance`
  - [x] Verify all 18 slots across Mon/Tue/Wed/Thu have exact cues, rep ranges, RIR schemes, rest timers, and 4 equipment options

- [x] Task 3: Live Session Drop Set Support (`src/app/(trainee)/session/page.tsx`)
  - [x] Handle drop set on Set 4 for exercises with `hasDropSet`
  - [x] Auto-suggest ~40% weight drop and 0 RIR
  - [x] Record `isDropSet: true` in `SetLog`
  - [x] Badge drop set in completed sets display

- [x] Task 4: Trainee Today & Program Calendar Enhancements
  - [x] In `src/app/(trainee)/today/page.tsx`, render Daily Schedule & Nutrient Architecture milestones
  - [x] In `src/app/(trainee)/program/page.tsx`, enhance day preview modal with morning drills, daily meals, drop set indicators, and equipment options

- [x] Task 5: Trainer Program Builder Enhancements (`src/app/(trainer)/program/new/page.tsx`)
  - [x] Add "Load Master Protocol Template" button
  - [x] Add Drop Set configuration UI to exercise cards
  - [x] Add Morning Routine & Daily Meals display/editor

- [x] Task 6: Comprehensive Automated Tests & Verification
  - [x] Create `tests/unit/lib/master-protocol.test.ts`
  - [x] Run full test suite (`npx tsx --test tests/unit/lib/*.test.ts`)
  - [x] Run Next.js build (`npx next build`)
