# VYRA Life OS — The Five Pillars & Coach Architecture

Fitness is the foundational pillar shipped today. The system is engineered as an extensible shell where the remaining pillars plug in through a standardized contract.

---

## 1. Train (Movement & Strength) — BUILD NOW
- **Promise**: *"Know exactly what to lift, lift it, see yourself grow."*
- **Moments Contributed to Today**:
  - Daily workout session (Hero moment).
  - Pre-workout electrolyte timing.
  - Post-workout recovery prompt.
  - Weekly periodization check-in.
- **Room (`Life` $\rightarrow$ `Train`)**:
  - Session Preview $\longrightarrow$ Full-Screen Active Workout $\longrightarrow$ Celebration Summary.
  - Program (7-day calendar strip preview).
  - Exercise History & PR milestones.
- **Signals Emitted**: `train.load` (tonnage), `train.soreness`, `train.duration`, `train.pr_hit`.
- **Signals Consumed**: `sleep.duration`, `sleep.readiness` (modulates load), `nutrition.status` (fuel adequacy).

---

## 2. Eat (Nutrition & Supplements) — BUILD NOW: SUPPLEMENTS
- **Promise**: *"Eat for your goal without counting your life away."*
- **Moments Contributed to Today**:
  - Supplement Stacks by time of day:
    - *Morning Stack*: Merged D3/K2, Omega-3, B-Complex.
    - *Workout Stack*: Creatine monohydrate & electrolytes.
    - *Evening Stack*: Magnesium glycinate wind-down.
  - Hydration milestone check-ins.
  - Meal timing confirmations (Phase 2).
- **Room (`Life` $\rightarrow$ `Eat`)**:
  - Time-of-day supplement checklist.
  - Hydration wave target.
  - Future: Meal logging, macro guidance, grocery synthesis.
- **Signals Emitted**: `nutrition.supplements_logged`, `nutrition.hydration_ml`, `nutrition.calories_est`.
- **Signals Consumed**: `train.load` (calorie/carb adjustment), `sleep.quality`.

---

## 3. Sleep (Rest & Circadian Architecture) — DESIGN ENTRY, LOCKED
- **Promise**: *"Wake up ready."*
- **Moments Contributed to Today**:
  - Morning readiness confirmation (*"Slept 7h20. Good to go."*).
  - Evening wind-down cue & blue light filter prompt.
  - Bedtime anchor alert.
- **Room (`Life` $\rightarrow$ `Sleep`)**:
  - Calm locked preview tile: *"Circadian rest, sleep stage tracking & HRV recovery engine — Coming soon."*
- **Signals Emitted**: `sleep.duration`, `sleep.efficiency`, `sleep.hrv_score`, `sleep.readiness`.
- **Signals Consumed**: `train.tonnage` (recovery demand), `nutrition.caffeine_timing`.

---

## 4. Style (Dress & Postural Architecture) — DESIGN ENTRY, LOCKED
- **Promise**: *"Look like you meant it."*
- **Moments Contributed to Today**:
  - Morning outfit suggestion based on weather, schedule, and physique training focus.
  - Postural scapular alignment check.
- **Room (`Life` $\rightarrow$ `Style`)**:
  - Calm locked preview tile: *"Postural drape, V-taper styling & AI capsule wardrobe — Coming soon."*
- **Signals Emitted**: `style.outfit_logged`, `style.posture_symmetry`.
- **Signals Consumed**: `weather.temp`, `calendar.events`, `train.scapular_status`.

---

## 5. Network (Social, Partners & Radar) — DESIGN ENTRY, LOCKED
- **Promise**: *"Grow with the right people."*
- **Moments Contributed to Today**:
  - Training partner alignment (*"Marcus is training Chest today at 12:15"*).
  - Local gym occupancy quiet-hour radar.
  - Shared milestones.
- **Room (`Life` $\rightarrow$ `Network`)**:
  - Calm locked preview tile: *"Curated athletic circles, gym occupancy radar & partner workouts — Coming soon."*
- **Signals Emitted**: `network.partner_confirmed`, `network.run_rsvp`.
- **Signals Consumed**: `train.pr_hit`, `user.location_context`.

---

## 6. Coach (Connective Intelligence) — BUILD NOW: LIGHT LAYER
- **Promise**: *"Your quiet, world-class athletic concierge."*
- **Access**: Reachable from anywhere via a quiet "Ask Coach" link or contextual chips (*"Swap exercise"*, *"Why this weight?"*, *"Short on time"*).
- **Core Functionality**:
  - Exercise substitution (equipment variations).
  - Load and RPE explanation in 1 concise sentence.
  - Immediate adaptation to time constraints (e.g. drop from 4 sets to 2 top sets).
  - Never interrupts or blocks normal flow.
