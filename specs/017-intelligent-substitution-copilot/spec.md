# Feature Specification: 017 Intelligent Biomechanical Substitution Copilot

**Feature Branch**: `017-intelligent-substitution-copilot`  
**Created**: 2026-10-14  
**Status**: Specified / Awaiting Approval ("Go")  
**Co-dependency**: Integrates cleanly alongside `016-anatomical-tension-spotlight` without collision.  
**Audit Context**: Screened via `/gstack`, `/founder-reality-check`, `/feature-roi-auditor` (ROI: 5.67), `/mvp-police`, and `AGENTS.md`.

---

## 1. Executive Summary & Problem Framing (YC & Founder Reality Check)

### 🪞 The Problem
In commercial gyms between 5:30 PM and 8:00 PM, the #1 friction that breaks workout momentum is:
> **"The machine or rack my program prescribes is occupied."**

Traditional workout apps fail trainees here:
- They either leave the trainee stranded, forcing them to wait 15 minutes for a squat rack or pec deck.
- Or they display an uncurated, alphabetical list of 600 exercises with zero biomechanical guidance.
- Lifters end up picking suboptimal movements that misalign with their program's muscular targets or cause joint irritation.

### 🎯 The Solution: The Biomechanical Substitution Copilot
An intelligent, deterministic substitution copilot accessible via 1 tap directly inside `/session` (active workout) and `/exercises` (catalogue):
1. **Biomechanical Vector & Resistance Profile Matching**:
   - Matches **muscular subdivision** (e.g., Clavicular Pecs vs Sternal Pecs; Iliocostalis lower back vs Latissimus Dorsi).
   - Matches **resistance curve bias**:
     - *Lengthened overloaded* (e.g., Romanian Deadlift, Incline Dumbbell Curl).
     - *Shortened overloaded* (e.g., Pec Deck, Cable Cross, Leg Extension).
     - *Constant profile* (e.g., Cable or Cam-driven machine).
2. **Coach Biomechanical Rationale Card**:
   - Generates an instant, concise 1-sentence rationale:
     > *"Pec Deck occupied? 15° Low-Incline Dumbbell Flye with tucked elbows replicates identical sternal fiber tension at peak stretch."*
3. **1-Tap Zero-Friction Active Session Mutation**:
   - Tapping "Swap Exercise" replaces the occupied movement in `/session` immediately, recalculates working weight/plate targets, and preserves all previously logged sets without data loss.

---

## 2. ROI & Alignment Audit

$$\text{ROI Score} = \frac{\text{Revenue}(4) + \text{Learning}(4) + \text{Retention}(5) + \text{Acquisition}(4)}{\text{Complexity}(2) + \text{Risk}(1)} = \frac{17}{3} = \mathbf{5.67} \quad (\ge 2.5 \implies \text{\textbf{HIGH YIELD / APPROVED}})$$

- **Retention Multiplier**: Solves real-world gym frustration. Trainees never abandon their workout because equipment is busy.
- **Brand Moat**: Demonstrates genuine sports science intelligence rather than generic database search.
- **Offline Capable**: Uses pre-computed vector indices in `catalogue-loader.ts` for sub-5ms instant matching with zero cloud latency.

---

## 3. Architecture & Negative Constraints Compliance

Per `AGENTS.md`:
- **Vertical Element Ceiling**: Maximum 3 alternatives per drawer view.
- **Single Dominant CTA**: 1-tap "Swap into Workout" button.
- **60-30-10 Obsidian Surface**: `#0B0F17` backdrop, `bg-slate-900/60` cards, emerald accents.
- **Touch Target**: All swap buttons $\ge 44\times 44\text{px}$.

---

## 4. Acceptance Criteria

- [ ] Accessible via 1 tap ("Swap Equipment") from any exercise block in `/session` and `/exercises`.
- [ ] Returns top 3 ranked substitutes filtered by identical primary muscle group and equipment availability.
- [ ] Displays 1-sentence deterministic coach rationale for each substitute.
- [ ] Mutating an exercise during an active workout updates `appStore.updateSessionExercise` without resetting logged sets.
- [ ] 100% offline-ready with zero external API calls.
