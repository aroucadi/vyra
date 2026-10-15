# VYRA Autonomous Biomechanical Engine — The Ideal Athletic Day Map

The `Today` experience (`/today`) is anchored by a single chronological timeline of athletic moments. The active moment is highlighted as the **Expanded Hero**, past completed events collapse into minimal checked rows, and upcoming moments rest as quiet single-line schedules.

---

## 1. Chronological Timeline of Athletic Moments

| Time Window | Moment | Domain | Primary Action ($\le$ 5s) | Cross-Domain Signal & Dynamic Adaptation |
|:---|:---|:---|:---|:---|
| **06:30 – 07:00** | Wake & Readiness Check | Rest & ANS | 1-tap confirm readiness score (`<ReadinessCheckin />`) | *"HRV 58ms, 7h 20m sleep. Full prescribed loading authorized."* |
| **07:00** | Mineral Hydration & Creatine Base | Micronutrients | 1-tap check 500ml water + 5g creatine | Emits `nutrition.hydration_ml` to daily balance vector. |
| **08:00** | Morning Micronutrient Stack | Micronutrients | 1-tap "Morning Stack" (`<SupplementStackDrawer />`) | Logs D3/K2 (5000 IU), Omega-3 (2g), B-Complex. |
| **09:30** | Pre-Training Anabolic Fueling | Nutrition | Confirm planned meal schedule | High-protein foundation to support afternoon hypertrophy volume. |
| **12:15** | Daily Hypertrophy Workout | Training Floor | Tap **[ START WORKOUT ]** $\to$ `/session` | Sleep or HRV deficit auto-triggers `<SessionAdjustmentSheet />` (5-10% buffer on axial loads). |
| **13:30** | Post-Workout Fuel & Celebration | Recovery | 1-tap confirm shake & review tonnage | *"14,250 kg tonnage moved. +30g post-workout carbs allocated."* |
| **17:00** | Postural & Scapular Reset | Biomechanics | 2-min thoracic extension drill | Corrects desk-bound spinal flexion before evening recovery. |
| **21:30** | Evening Wind-Down & Magnesium | Sleep Prep | 1-tap check "Evening Stack" | Logs Magnesium Glycinate (400mg) + L-Theanine (200mg). |
| **23:00** | Circadian Sleep Restoration Anchor | Rest & Recovery | Passive wearable sleep capture | Sets baseline HRV and recovery score for tomorrow's mesocycle load. |

---

## 2. Timeline Interaction States & UI Anatomy

The visual state of `/today` directly mirrors the logic of `deriveDayTimeline` and respects `AGENTS.md` negative constraints:

```
[ 07:00 ]  ✓  Mineral Hydration · 500 ml                       (Collapsed Past Moment)
[ 08:00 ]  ✓  Morning Stack · 3 micronutrients                 (Collapsed Past Moment)
--------------------------------------------------------------------------------------
[ NOW   ]  ⚡  Upper Hypertrophy: Chest & Postural Retraction   (EXPANDED HERO MOMENT)
               6 exercises · ~52 min · 18 total working sets
               [ START WORKOUT ] (Single Dominant Primary CTA)
               "HRV 58ms · Full volume authorized." (Contextual Insight)
--------------------------------------------------------------------------------------
[ 13:30 ]  ○  Post-Workout Fuel · 40g Protein + Electrolytes   (Quiet Upcoming Row)
[ 17:00 ]  ○  Scapular Retraction & Thoracic Extension Drill    (Quiet Upcoming Row)
[ 21:30 ]  ○  Evening Magnesium Glycinate                      (Quiet Upcoming Row)
```

### Visual Rules for Timeline Moments:
1. **Collapsed Past Moments**:
   - Rendered as subtle, single-line slate items with a muted green checkmark (`text-emerald-500`).
   - Tapping opens the respective slide-up drawer (e.g. `<SupplementStackDrawer />`) if log review is requested.
2. **Expanded Hero Moment**:
   - Anchors the visual center of the viewport with obsidian/slate card background (`bg-slate-900/60`, `border-slate-800`).
   - Enforces the **Vertical Element Ceiling** ($\le 3$ elements):
     1. Eyebrow Category & Scheduled Time (`text-xs text-slate-400 font-medium`).
     2. Hero Title & Volume Summary (`text-lg text-slate-100 font-semibold`).
     3. Single Dominant CTA: High-contrast Emerald button (`[ START WORKOUT ]` or `[ RESUME SESSION ]`).
   - Secondary actions (e.g. "Preview Blueprint") are styled strictly as ghost text links.
3. **Cross-Pillar Insight Card**:
   - At most **one** insight card is visible per viewport.
   - When wearable biometrics detect elevated CNS fatigue or shortened sleep, an `<AdaptiveRecalibrationCard />` surfaces directly above the Hero with a 1-tap `[ Adjust Session ]` trigger.
4. **Quiet Upcoming Rows**:
   - Formatted as clean, unobtrusive single lines indicating scheduled time, title, and key metric (`tabular-nums`).
   - Zero aggressive visual weight or competing primary buttons.

---

## 3. In-Gym Session Flow & Transition Mechanics

When the athlete taps **[ START WORKOUT ]**, the application immediately transitions to `/session` and activates full-screen gym mode:

```
[ Start Workout ] (Today Page)
        │
        ▼
Full-Screen Gym Mode (/session)
  ├── 1-Exercise Focus (Zero multi-exercise scroll clutter)
  ├── <AnatomicalTensionSpotlight /> (Micro-torso SVG: Emerald target, Cyan synergists)
  ├── Kinetic Cues (⚡ Setup Anchor & 🎯 Kinetic Drive)
  ├── <PlateCalculatorPopover /> (Olympic 20kg, Women's 15kg, Smith 0–15kg)
  ├── Rapid Set Stepper (Weight, Reps, RIR pre-filled from prior session)
  ├── 1-Tap [ Log Set & Rest ] (Duration: <2s)
  │     └── Initiates <RestIntervalBar /> (Countdown + Web Audio pip)
  │     └── Holds Screen Wake Lock (wakelock.ts prevents phone dimming)
  ├── <SubstitutionCopilotDrawer /> (1-tap swap if equipment is occupied)
  │
  ▼
[ Finish Workout ]
        │
        ▼
Session Celebration Summary
  ├── Metric Density Cap (Strictly 3 metrics: Tonnage moved, Duration, PRs hit)
  └── 1-Tap [ Done ] ──> Returns to /today with Workout Moment marked collapsed ✓
```
