# Task List: 016 Anatomical Tension Spotlight & Kinetic Cues

- [x] **Task 1: Spec & Architecture Validation** (Completed)
  - [x] Founder reality check & ROI scoring (4.50)
  - [x] Define `spec.md` and `plan.md`
  - [x] Verify compliance with `AGENTS.md` negative constraints

- [x] **Task 2: Build `<AnatomicalTensionSpotlight />` Component** (Completed)
  - [x] Implement SVG micro-torso silhouette with normalized muscle path IDs
  - [x] Apply Emerald (`#10B981`) primary glow and Cyan (`#06B6D4`) synergist fills
  - [x] Add unit test suite in `tests/unit/lib/anatomical-tension-spotlight.test.ts`

- [x] **Task 3: Refactor `ExerciseDetailSheet.tsx` Hero Layout** (Completed)
  - [x] Integrate split hero: Micro-Spotlight alongside Setup/Drive kinetic cues
  - [x] Enforce 3-element vertical limit per view
  - [x] Wire 3 segmented tabs: `Coach Cues`, `Full Steps`, `Swaps`

- [x] **Task 4: Quality & Regression Audit** (Completed)
  - [x] Run full unit test suite (`npm test`) -> 250 / 250 passing across 70 suites
  - [x] Compile with Turbopack (`npx next build`) -> 21/21 static & dynamic routes compiled
  - [x] Audit against Vercel Web Interface Guidelines & AGENTS.md negative constraints
