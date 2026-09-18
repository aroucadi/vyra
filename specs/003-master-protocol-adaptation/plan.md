# Implementation Plan: Master Hypertrophy & Postural Architecture Protocol Adaptation

Feature Branch: `003-master-protocol-adaptation`
Created: 2026-09-15
Status: Ready for Execution

---

## 1. Architecture & Data Structures (`src/lib/types.ts`)
- Extend `ExercisePrescription`:
  - `hasDropSet?: boolean;`
  - `dropSetGuidance?: string;`
- Extend `SetLog`:
  - `isDropSet?: boolean;`
- Define `DailyMealSlot`:
  - `time: string;`
  - `label: string;`
  - `foods: string;`
  - `supplements?: string;`
  - `rationale?: string;`
  - `calories?: number;`
  - `proteinGrams?: number;`
- Extend `MealPlanPrescription`:
  - `dailyMeals?: DailyMealSlot[];`

---

## 2. Seed Data Harmonization (`src/db/seed/master-transformation-program.ts`)
- Update program title to exact protocol:
  - `"The Master Hypertrophy & Postural Architecture Protocol"`
- Align 8-milestone daily nutrition schedule (`dailyMeals`):
  - 07:00 Waking Hydration (500ml water + Creatine 6.9g Days 1-5)
  - 09:15 Café Breakfast (~600 kcal, 28g P) + D3+K2 + Omega-3 + Multi-B Complex
  - 11:45 Pre-Gym Fuel (Banana/dates ~120 kcal, 30g Carbs + 300ml water)
  - 12:15 Intra-Workout (500ml water + 0.5g Table Salt)
  - 13:35 Office Lunch (~700 kcal, 42g P)
  - 14:00 Cooler Shaker (~420 kcal, 36g P) + Creatine (6.9g loading vs 3-5g maintenance)
  - 16:00 Caloric Surge (~500 kcal, 24g P)
  - 21:30 Solid Dinner (~650 kcal, 35g P) + Creatine 6.9g (Days 1-5)
  - 22:45 Pre-Bed Sleep Stack (Magnesium Bisglycinate 400mg + Ashwagandha KSM-66 600mg)
- Align all 4 Training Days & 18 slots:
  - **Monday** (5 slots, 14 sets):
    - Slot 1: Clavicular Upper Chest Press (3 sets x 6-10 | 2, 1, 0 RIR | 90s) [M/D/C/B]
    - Slot 2: Posture Counter-Pull & External Rotation (3 sets x 12-15 | 1, 1, 0 RIR | 60s) [M/D/C/B]
    - Slot 3: Triceps Long Head (3 sets x 10-12 | 2, 1, 0 RIR | 60s) [M/D/C/B]
    - Slot 4: Triceps Lateral Head (2 sets x 12-15 | 1, 0 RIR | 60s) [M/D/C/B]
    - Slot 5: Lateral Delt Sweep 1 (3 sets x 15-20 | 1, 1, 0 RIR | 45s) [M/D/C/B]
  - **Tuesday** (4 slots, 12 sets):
    - Slot 1: 45° Leg Press (High & Wide) (3 sets x 6-10 | 2, 1, 0 RIR | 90s) [M/D/C/B]
    - Slot 2: Smith/DB Romanian Deadlift (3 sets x 8-10 | 2, 1, 0 RIR | 90s) [M/D/C/B]
    - Slot 3: Seated/Lying Leg Curl (3 sets x 10-12 | 1, 1, 0 RIR | 75s) [M/D/C/B]
    - Slot 4: Cable Pallof Press / Anti-Rotation (3 sets x 10r/side | 1 RIR | 45s) [M/D/C/B]
  - **Wednesday** (5 slots, 15 sets, Straps on Slots 1 & 2):
    - Slot 1: Neutral-Grip Lat Pulldown (3 sets x 6-10 | 2, 1, 0 RIR | 90s) [M/D/C/B]
    - Slot 2: Chest-Supported Machine Row (3 sets x 8-12 | 2, 1, 0 RIR | 75s) [M/D/C/B]
    - Slot 3: Reverse Pec Deck Rear Delts (3 sets x 12-15 | 1, 1, 0 RIR | 60s) [M/D/C/B]
    - Slot 4: Preacher Curl Machine Hammer Grip (3 sets x 10-12 | 1, 1, 0 RIR | 60s) [M/D/C/B]
    - Slot 5: Lateral Delt Sweep 2 (3 sets x 12-15 | 1, 1, 0 RIR | 60s) [M/D/C/B]
  - **Thursday** (4 slots, 13 sets including drop set):
    - Slot 1: Neutral-Grip Machine Shoulder Press (3 sets x 6-10 | 2, 1, 0 RIR | 90s) [M/D/C/B]
    - Slot 2: Lateral Deltoid Anchor & Burnout (3 sets x 12-15 @ 1 RIR + 1 Drop Set @ 0 RIR | 60s) [M/D/C/B]
      - `hasDropSet: true`
      - `dropSetGuidance: "Set 4 Drop Set: Immediate 40% weight drop taken to absolute 0 RIR failure"`
    - Slot 3: Anti-Extension Core Control (3 sets x 10r/side or 12-15 | 1 RIR | 45s) [M/D/C/B]
    - Slot 4: Controlled Farmer Carry / Shrug hold (3 sets x 40 paces / 45s hold | 1 RIR | 60s) [M/D/C/B]
  - **Friday, Saturday, Sunday**: Rest days (Tissue rebuilding, Friday morning fasted weigh-in: +0.30 to +0.35 kg/wk target).

---

## 3. Trainee Experience Updates
- `src/app/(trainee)/today/page.tsx`:
  - Add "Master Daily Schedule & Nutrient Architecture" interactive timeline card displaying daily milestones with foods, macros, and supplement indicators.
- `src/app/(trainee)/session/page.tsx`:
  - Detect when an exercise has `hasDropSet` and user is on the drop set index (Set 4).
  - Show dedicated "🔥 DROP SET" callout and auto-fill weight to ~60% of previous set (40% drop) and 0 RIR.
  - Record `isDropSet: true` in `SetLog`.
  - Display drop set badge in completed sets log list.
- `src/app/(trainee)/program/page.tsx`:
  - Enhance day preview modal to display morning alignment drills, daily nutrient milestones, drop set alerts, and equipment variations.

---

## 4. Trainer Program Builder Updates
- `src/app/(trainer)/program/new/page.tsx`:
  - Add "Load Master Protocol Template" button that instantly loads the complete 4-day split with 18 slots, 4 equipment options each, morning routines, and nutrition schedule.
  - Add Drop Set configuration UI to exercise editor (`hasDropSet` toggle, `dropSetGuidance` input).
  - Add Morning Alignment Routine and Daily Nutrition Schedule viewing/editing.

---

## 5. Automated Testing & Verification
- Create `tests/unit/lib/master-protocol.test.ts`:
  - Assert 2:1 pull-to-push ratio (6 pressing sets vs 12 pulling/retraction sets).
  - Assert 3x/week side delt matrix (10 sets total).
  - Assert pure posterior chain Tuesday (zero quad isolation).
  - Assert 4 equipment options for every single slot (18 slots = 72 options).
  - Assert drop set flags and guidance on Thursday Slot 2.
  - Assert micronutrient and hydration protocols.
- Run all unit tests and Next.js production build.
