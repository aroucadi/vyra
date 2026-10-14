# Task Breakdown: 013 Exercise Catalogue Browser

- [x] **Task 1: Exercise Detail Drawer Component** (`src/components/trainee/ExerciseDetailSheet.tsx`)
  - [x] Render exercise name, category, equipment, target muscle, and secondary muscles
  - [x] Render step-by-step numbered execution cues
  - [x] Embed PlateCalculatorPopover for barbell and smith exercises
- [x] **Task 2: Exercise Catalogue Main Page** (`src/app/(trainee)/library/page.tsx`)
  - [x] Search input with instant gym shorthand evaluation (`db`, `bb`, `rdl`, `ohp`)
  - [x] Horizontal scrollable filter chips (Muscles: Chest, Back, Shoulders, Arms, Legs, Core; Equipment: Barbell, Dumbbell, Cable, Machine, Bodyweight)
  - [x] Exercise cards obeying 3-element vertical ceiling
  - [x] Wire slide-up sheet on card click
- [x] **Task 3: Navigation & Integration** (`src/components/trainee/TraineeNav.tsx`)
  - [x] Add direct link to `/library` in Trainee Navigation bar
- [x] **Task 4: Verification & Test Suite** (`tests/unit/lib/exercise-catalogue-browser.test.ts`)
  - [x] Verify search filtering across categories, equipment, and shorthands
  - [x] Verify test suite passing with `npm test` and build clean with `npm run build`
