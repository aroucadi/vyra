# Task Breakdown: 015 Structural Balance Radar & Intelligent Posture UI

- [x] **Task 1: SVG Structural Balance Radar Component** (`src/components/trainee/StructuralBalanceRadar.tsx`)
  - [x] Implement SVG multi-axis polygonal chart (spokes, concentric grid, target polygon, actual polygon)
  - [x] Color-code vertices based on status (`balanced` emerald, `borderline` amber, `weak` rose, `no-data` slate)
  - [x] Obey Negative Constraints (60-30-10 palette, tabular numerals, 44x44px touch targets)
- [x] **Task 2: Intelligent Posture Diagnosis Component** (`src/components/trainee/IntelligentPostureDiagnosis.tsx`)
  - [x] Analyze balance deficits to synthesize biomechanical risks (anterior chain dominance, lumbar fatigue)
  - [x] Present actionable corrective prescription (e.g. Trap-3 raise, Powell raise, face pulls)
  - [x] Wire 1-tap "Inject Corrective into Blueprint" action
- [x] **Task 3: Postural Architecture Screen** (`src/app/(trainee)/posture/page.tsx` & `/api/posture`)
  - [x] Create `/posture` route with template selector (Poliquin, Thibaudeau, ATG)
  - [x] Create `/api/posture` server endpoint for clean Node fs calculation
  - [x] Gate via `hasEntitlement(tier, 'structural_balance_radar')`
  - [x] Add link in Trainee Program view (`/program`)
- [x] **Task 4: Unit Test Suite & Build Verification** (`tests/unit/lib/structural-balance-ui.test.ts`)
  - [x] Test radar geometry coordinates mapping
  - [x] Test status evaluation and corrective synthesis
  - [x] Verify test suite passes with `npm test` and build clean with `npx next build`
