# Spec 019: Zero-Gate Day-0 Onboarding & Trust Calibration Architecture ("The Couch-to-Rack Proxy")

> **Status**: Active Implementation (Phase 3 Production Engine)  
> **ROI Score**: **7.60** (`(4 Rev + 5 Ret + 5 Acq + 5 Lrn) / (1.5 Cpx + 1.0 Rsk)`)  
> **Related Deferred Specs**: Spec 020 (Phase 4B CSV/AI Importer), Spec 021 (Phase 4C Post-Session Passkey Save), Spec 022 (Phase 5B Source-Aware Deep-Link Entry), Spec 023 (Phase 6B Trainer-Invite Onboarding)

---

## 1. Problem Statement: The One Question & Who Is Asking It

- **The Arriving Athlete**: An intermediate lifter (2–7 years of experience) who has used Hevy, Strong, or Fitbod and has been burned by generic AI fitness wrappers. They tapped a link from a Reddit thread, Instagram Reel, or shared `<AnatomicalTensionSpotlight />` clip. They are on a phone—likely inside an in-app WebView—and **not currently standing on the gym floor**.
- **The One Question**: *"What's my first session, and can I trust its numbers?"*
- **Seven Critical Gaps Resolved by Spec 019**:
  1. **Cold-Start Numbers Are Blank or Seeded**: Pre-filling from "previous session" fails when `sessions.length === 0`. We introduce **1-Anchor Poliquin Starting Weight Calibration** (`<150ms` derivation) with a `"Not sure? Calibrate as I lift"` fallback.
  2. **Day-0 `/today` Was Alaa's Full Day, Not a Day-1 Product**: Arriving at 08:30 AM showed a D3/K2 supplement stack; arriving on a rest day showed no lifting hero. On Day 0 (`sessions.length === 0`), `/today` is strictly **Day 1 Starts Today** (`Upper Frame & Symmetry`), hiding supplements, hydration, non-workout timeline slots, and HRV claims until Session 1 is completed.
  3. **Offline Proof & WebView Escape Had No Home in the Journey**: In-app browsers (`Instagram`, `Reddit`, `TikTok`) risk storage eviction. Step 4 adds a `"Not at the gym yet? Get ready"` sheet that detects in-app WebViews (`Open in Safari/Chrome` with `?anchor=` query preservation), verifies real Service Worker precache status (`● Offline-ready`), and frames Home Screen installation around data persistence.
  4. **The Hook Was Paywalled**: `<AnatomicalTensionSpotlight />` was gated in `PRO` (`$29/mo`) while leading the launch video. Spec 019 moves `anatomical_tension_spotlight` and `substitution_copilot_preview` (1 free swap/session) to `FREE`, and removes all pricing/trial copy from Day-0 onboarding.
  5. **Honest Local Identity & Data Ownership**: Zero account wall before Session 1. Displays `"Saved on this phone · Export"` linking directly to `/your-data`.
  6. **Vocabulary & Legibility Guardrails**: Kinetic cues (`Setup Anchor` and `Kinetic Drive`) are upgraded from `12px` (`text-xs`) to `15px` (`text-[15px] leading-snug`), and `<AnatomicalTensionSpotlight />` dual-hue SVG telemetry is formally codified in `render-contract.md`.
  7. **Message Match & Catalogue Handoff**: Every exercise in `/exercises` (`<ExerciseDetailSheet />`) includes a 1-tap **`[ Use in Day 1 Session ]`** action that slots the movement directly into the active session and routes to `/today`.

---

## 2. The 5-Step Couch-to-Rack Onboarding Flow

| Step | Screen State | What the Lifter Sees | User Action | Time Budget |
| :---: | :--- | :--- | :--- | :---: |
| **0** | **Entry Check (Non-Blocking)** | Immediate Day-1 Hero Card on `/today` with `<AnatomicalTensionSpotlight />`. If inside an in-app WebView, a subtle top pill offers `"In-app browser · Open in Safari to keep workouts"`. | 0 taps required to inspect hero | `0s` |
| **1** | **See Day 1** | `Day 1 starts today · 6 lifts · ~45 min`. `<AnatomicalTensionSpotlight />` active on Lift 1 (`Incline Dumbbell Press`). Loads show `— kg` until calibrated. Trust line: `No account. No card. Saved on this phone.` | Tap **`Set my starting weights`** (or `Calibrate as I lift`) | `≤10s` |
| **2** | **1-Anchor Calibration** | Inline sheet over the card: 1 compound benchmark lift (`Barbell Bench Press` or `Dumbbell Bench Press`), `kg`/`lb` toggle, weight + reps steppers, plus `"Not sure? Calibrate as I lift"`. | Adjust weight/reps or skip; card updates in `<150ms` | `≤20s` |
| **3** | **Check One Number ("Why?")** | Every Day-1 exercise now displays its derived target load (e.g., `30 kg × 8–10`) and plate breakdown. Tapping **`Why 30 kg?`** reveals the exact Epley + Poliquin ratio formula and reversible **Sleep What-If** chips (`7.5h Full: 30 kg` vs `5h Short: 27.5 kg [-10% load]`). | Inspect formula / toggle Sleep What-If (optional) | `0s` required |
| **4** | **Start or Get Ready** | Primary Emerald CTA: **`Start Day 1 Session`**. Secondary Ghost CTA: **`Not at the gym yet? Get ready`** (opens sheet with verified `● Offline-ready` check, WebView Safari/Chrome handoff with `?anchor=` state, and `/install` guide). | Tap `Start Day 1 Session` or `Get ready` | `≤2 taps` |
| **5** | **After Session 1** | 3-metric summary in `/session` (`Total Volume`, `Sets Completed`, `PRs Hit`). Copy: `"We learned your loads. Session 2 starts pre-filled. Saved on this phone · Export."` | Tap `Done` | `1 tap` |

---

## 3. Roadmap for MVP-Police-Deferred Onboarding Features (Specs 020–023)

The following capabilities were audited during Spec 019 planning and intentionally sequenced into Phases 4B–6B so they can be implemented cleanly once their underlying infrastructure gates are met:

1. **Spec 020 (Phase 4B) — Historical Workout & Program Importer**:
   - Deterministic CSV parser for Hevy, Strong, and Fitbod exports + AI Vision/Paste structured table importer with mandatory user confirmation before saving.
2. **Spec 021 (Phase 4C) — Post-Session 1 Passkey Account Save & Cloud Sync Handoff**:
   - WebAuthn / Passkey prompt triggered strictly on Step 5 (after Session 1 is completed locally), migrating IndexedDB state to PostgreSQL (`src/db/schema.ts`).
3. **Spec 022 (Phase 5B) — Source-Aware Deep-Link Entry**:
   - URL parameter matching (`?lift=incline_db_press&source=reel_spotlight`) so the Day-0 hero card automatically leads with the exact exercise from the social video clip.
4. **Spec 023 (Phase 6B) — B2B2C Trainer-Invite Zero-Calibration Flow (`/invite/[coachId]`)**:
   - Pre-calibrated client onboarding link generated from `/roster` that pre-populates custom mesocycle weights and lands directly on Step 3 (`Check one number`).
