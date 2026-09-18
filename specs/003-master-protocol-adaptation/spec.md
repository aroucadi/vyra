# Feature Specification: Master Hypertrophy & Postural Architecture Protocol Adaptation

Feature Branch: `003-master-protocol-adaptation`
Created: 2026-09-15
Status: Ready for Implementation
Input: User prompt specifying "The Master Hypertrophy & Postural Architecture Protocol (Customized for High-Frequency Frame Widening, Desk Constraints & Muscle Memory Acceleration)" and /gstack execution standard.

---

## User Scenarios and Acceptance Criteria

### User Story 1 - Flawless 16-Week Blueprint Seeding & Biomechanical Architecture (Priority: P1)
As athlete Alaa (37yo male, 173cm, 49kg) and Coach Alaa Pro, I need the database seed to exactly reflect "The Master Hypertrophy & Postural Architecture Protocol" across all 16 weeks.

Acceptance Scenarios:
1. **Biomechanical 2:1 Pull-to-Push Balance**: Upper pressing is strictly capped at 6 sets/week (3 Incline Press on Mon + 3 Shoulder Press on Thu); upper back/retraction is strictly 12 sets/week (3 Lat Pulldown + 3 Chest-Supported Rows + 3 Face Pulls + 3 Rear Delt Flyes).
2. **3x/Week Side Delt Matrix (10 Total Sets)**: Monday Slot 5 (3 sets x 15-20), Wednesday Slot 5 (3 sets x 12-15), Thursday Slot 2 (3 sets x 12-15 + 1 Drop Set to 0 RIR).
3. **Zero Quad Isolation**: Tuesday pure posterior chain & anti-rotation (High & Wide 45° Leg Press, RDL, Leg Curl, Pallof Press).
4. **All 18 Slots with 4-Modality Matrix**: Every slot across Monday (5 slots), Tuesday (4 slots), Wednesday (5 slots), and Thursday (4 slots) has Machine, Dumbbell, Cable, and Bodyweight variations with trainer form cues and valid YouTube video URLs.
5. **Thursday Slot 2 Drop Set**: Set 4 configured as an immediate 40% drop to 0 RIR failure (`hasDropSet: true`, `dropSetGuidance`).
6. **Morning Alignment Routine**: 4 core drills (Supine Stomach Vacuum 3x20s, Floor Glute Bridges 2x12, Half-Kneeling Hip Flexor Stretch 2x45s/side, Doorway Pec Stretch 2x30s/side) seeded into every training day.
7. **Nutrient & Micronutrient Architecture**: 
   - Creatine loading (Days 1–5: 20.7g across 3 doses: 07:00 6.9g, 14:00 6.9g, 21:45 6.9g) and maintenance (Day 6+: 3–5g in 14:00 shaker).
   - 09:15 Breakfast Micronutrients: Vit D3+K2 (3000 IU / 100mcg), Omega-3 (2000mg fish oil / 1000mg EPA/DHA), Multi-B Complex (1 cap).
   - 12:15 Intra-Workout: 500ml water + 0.5g table salt.
   - 22:45 Pre-bed Stack: Magnesium Bisglycinate (400mg) + Ashwagandha KSM-66 (600mg).
   - 8-Milestone Daily Schedule (07:00, 09:15, 11:45, 12:15, 13:35, 14:00, 16:00, 21:30, 22:45) stored in `dailyMeals`.
   - Hydration: 3,500ml base + 500ml workout bonus.
   - Friday morning fasted weigh-in target (+0.30 to +0.35 kg/week).

---

### User Story 2 - Trainee Experience: Daily Timeline & Drop Set Live Logging (Priority: P1)
As a trainee following this high-frequency protocol, I need to view my complete daily timeline (schedule, fuel, and supplements) on the Today dashboard, and seamlessly log the Thursday Slot 2 Set 4 Drop Set during my live workout session.

Acceptance Scenarios:
1. **Today Timeline & Fuel Display**: The Today dashboard renders a Daily Schedule & Nutrient Architecture section detailing the daily milestones and food/supplement instructions.
2. **Live Session Drop Set Handling**: When the trainee reaches Set 4 of Thursday Slot 2 (Lateral Deltoid Anchor & Burnout), the session UI highlights "DROP SET", automatically suggests a ~40% weight reduction, locks target RIR to 0, and records `isDropSet: true` in `SetLog`.
3. **Session Equipment Isolation**: Swapping between Machine, Dumbbell, Cable, and Bodyweight during the session continues to isolate PRs cleanly and log the exact selected equipment variant.

---

### User Story 3 - Trainer Program Builder: Master Protocol Template & Drop Set Authoring (Priority: P1)
As a coach, I need to be able to load the Master Protocol Template into the Program Builder with 1 click, configure drop sets, and edit equipment variations.

Acceptance Scenarios:
1. In `/program/new`, a "Load Master Protocol Template" button enables instant prefill of the 4-day split, 18 slots, 4-option equipment matrices, morning routines, and nutrition architecture.
2. In exercise configuration, coaches can toggle "Include Drop Set" and specify drop set guidance.
3. Editing `/program/[id]` preserves and exposes all master protocol attributes.

---

### User Story 4 - Dynamic Calculations & Verification (Priority: P1)
All adherence scores, PR evaluations, and test suites must operate dynamically without any hardcoded athlete IDs or placeholder fallback branches.

Acceptance Scenarios:
1. All unit tests pass with 100% test pass rate.
2. New test suite `tests/unit/lib/master-protocol.test.ts` validates the 2:1 volume ratio, 3x/week side delt volume, 4-option matrix completeness, drop set configuration, and micronutrient dosing.
