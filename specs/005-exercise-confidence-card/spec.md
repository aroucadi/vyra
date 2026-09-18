# Feature Specification: Exercise Confidence Card (ECC) & Stealth Gym Mode

Feature Branch: `005-exercise-confidence-card`
Created: 2026-09-17
Status: Draft (Speckit Standard)
Input: Trainee gymtimidation, beginner friction, equipment confusion, micro-form nuances, and mind-muscle sensory calibration during active workout sessions.

---

## 1. Problem Statement & User Insight

Beginners in commercial gyms face high social friction ("gymtimidation") and cognitive overload:
1. **Equipment Identification:** Commercial gyms house dozens of machines across multiple brands (selectorized pin-stacks, plate-loaded ISO-lateral, dual-cable stations). Trainees don't know what machine matches the exercise name or how to adjust seat notches and pins.
2. **Micro-Form & Grip Gaps:** Standard video clips demonstrate general motion but miss critical grip mechanics (overhand vs thumbless vs neutral, wrist alignment) and setup micro-cues.
3. **Proprioceptive / Sensory Blindness:** Beginners lack mind-muscle connection. They cannot tell if an exercise is working or if they are risking injury ("Where should I feel it? Is this burning the right muscle or straining my joints?").
4. **Public Exposure & Slowness:** Staring at long video tutorials broadcasts hesitation. Trainees need a **sub-5-second glanceable "Stealth Gym Shield"** that looks like checking a quick message.
5. **Occupied Machine Anxiety:** Beginners freeze when a machine is occupied. They need an instant, zero-hesitation equipment swap with matching biomechanical stimulus.

---

## 2. User Scenarios and Acceptance Criteria

### User Story 1 - Instant Machine Identification & Ergonomic Setup (Priority: P1)
As a beginner trainee standing on the gym floor, when I see an exercise in my workout, I want to tap a glanceable card to immediately identify the machine type, look for common gym hardware aliases, and read 2–3 precise setup steps (seat height, pad alignment, pin position) so I don't look lost or set up incorrectly.

**Acceptance Criteria:**
1. Given an exercise in the active workout logger (or Today view), When the trainee clicks "Guide" or the confidence icon, Then a discreet, dark-mode Exercise Confidence Card opens in under 100ms.
2. Given the card is open, Then it clearly indicates the hardware category (`pin_selectorized`, `plate_loaded`, `cable_tower`, `free_weight`, `bodyweight_station`) and common brand/floor aliases.
3. Given the card is open, Then it presents an ergonomic setup checklist with 2–3 concise actionable steps (e.g. "Seat low so handles align with mid-chest", "Pin in warmup plate").

---

### User Story 2 - Micro-Form, Grip Schematics & The Rule of 3 (Priority: P1)
As a trainee preparing to perform a set, I need to see the exact grip type (thumbless, overhand, neutral, supinated), wrist angle guidance, and exactly 3 memorable setup cues so I can execute safely without memorizing long essays.

**Acceptance Criteria:**
1. Given the Confidence Card is displayed, Then it displays the specified `gripType` and `gripWidth` with clear visual indicators.
2. Given the card is open, Then it provides a wrist posture cue (e.g. "Keep wrists straight like punching a wall").
3. Given the card is open, Then it displays strictly 3 punchy setup cues (under 7 words each) plus one memorable mental cue/metaphor (e.g. "Drive elbows into back pockets").

---

### User Story 3 - Sensory Calibration & Proprioceptive "Feel It" Heatmap (Priority: P1)
As a trainee performing reps, I need to know where I am supposed to feel the tension, by what rep the burn should set in, what sensations are normal, and what pain sensations are red flags requiring me to stop immediately.

**Acceptance Criteria:**
1. Given the Confidence Card is open, Then it displays the **Target Burn Zone** specifying the primary target muscle and the rep threshold (e.g., "By rep 8–10: intense burn in lats").
2. Given the card is open, Then it surfaces normal secondary stabilizer sensations (e.g., "Biceps and forearms assist slightly").
3. Given the card is open, Then it features a prominent **Red Flag Stop Signal** (e.g., "Sharp lower back pinch or neck shrugging: STOP, reduce weight or adjust seat").

---

### User Story 4 - Seamless Equipment Quick-Swap Integration (Priority: P1)
As a trainee who finds their intended machine occupied, I want to switch equipment directly within the Confidence Card or exercise header (e.g., from Machine to Dumbbells or Cable) and immediately have the Confidence Card update its cues, setup steps, and grip for the new variation.

**Acceptance Criteria:**
1. Given the trainee is viewing the Confidence Card for an exercise with equipment alternatives, When they tap an alternate equipment button (e.g., Dumbbell), Then the Confidence Card instantly hot-swaps to the dumbbell variation's setup, grip, and cues.
2. Given the equipment was swapped in the card, When the card is dismissed, Then the active workout logger reflects the selected equipment, appropriate exercise name, and personal best.

---

### User Story 5 - Zero-Latency Glanceability & Stealth UX (Priority: P2)
As a shy trainee worried about social pressure, I need the Confidence Card to feel discrete, fast, high contrast, and readable with a 4-second glance, with zero auto-playing audio or intrusive animations.

**Acceptance Criteria:**
1. The card renders as an accessible modal/bottom sheet with dark slate backdrop (`#0F172A`/`#162032`) matching the stealth aesthetic of the app.
2. The card can be dismissed with a single tap on the backdrop or close button.
3. Audio is strictly opt-in or absent; no sound fires automatically upon opening the card.
