# VYRA Autonomous Biomechanical Engine — The Five Production Pillars & Coach Architecture

Vyra is structured around five production-verified operational pillars and an intelligent connective coaching layer. Every pillar contributes focused moments to `/today`, powers specialized workspaces, and runs on verified deterministic mathematics.

---

## 1. Pillar 1: Biomechanical Math & In-Gym Floor Execution
- **Scope**: Specs 001–003, 012, 014 (`src/lib/training-math/`, `src/app/(trainee)/session/`)
- **Promise**: *"Execute every set with sub-second logging speed and mathematically verified load progression."*
- **Core Capabilities**:
  - **Submaximal 1RM Engine (`onerm.ts`)**: 7 submaximal formulas (Epley, Brzycki, Lombardi, etc.) + RTS Weighted Ensemble with RIR attenuation.
  - **Greedy Plate Loader (`plates.ts`)**: Instant per-side barbell loading for Olympic (20kg), Women's (15kg), and Smith machines (0–15kg).
  - **Automated Overload & Deload Engine (`progression.ts`)**: Double progression, Greyskull LP, and stall streak tracking (3 consecutive misses automatically triggers 10% Epley reset deload).
  - **In-Gym Focus Engine**: Full-screen 1-exercise focus, `<RestIntervalBar />`, synthetic Web Audio countdown pips (`sound.ts`), and Screen Wake Lock API (`wakelock.ts`).
- **Surfaces On**:
  - `/today`: Hero Workout Card with estimated duration and working volume.
  - `/session`: Active gym floor with pre-filled steppers, plate calculator popover, and rest timers.
- **Signals Emitted**: `train.set_logged`, `train.tonnage_kg`, `train.stall_detected`, `train.pr_hit`.
- **Signals Consumed**: `sleep.readiness_score`, `biometrics.hrv_ms` (modulates prescribed working loads).

---

## 2. Pillar 2: Anatomical Tension & Movement Intelligence
- **Scope**: Specs 013, 015, 016 (`src/components/trainee/`, `src/lib/rag/`)
- **Promise**: *"Visualize exact muscular recruitment and eliminate postural imbalances."*
- **Core Capabilities**:
  - **6,554-Exercise OpenGym Catalogue Browser (`/exercises`)**: Inverted token index responding in <10ms, supporting 40+ gym shorthands (`db`, `bb`, `rdl`, `ohp`, `sm`).
  - **`<AnatomicalTensionSpotlight />`**: Pure SVG micro-torso highlighting target prime movers in Emerald (`#10B981`), synergists in Cyan (`#06B6D4`), and neutral anatomy in Slate (`#334155`). Features an anterior/posterior segmented toggle.
  - **Two Kinetic Anchors**: ⚡ Setup Anchor (spatial stability foundation) and 🎯 Kinetic Drive (concentric trajectory cue).
  - **`<StructuralBalanceRadar />` (`/posture`)**: Polygonal SVG radar plotting lifter strength ratios against Poliquin, Thibaudeau, and ATG benchmark lifts with automated risk detection.
- **Surfaces On**:
  - `/exercises`: Interactive exercise browser with `<ExerciseDetailSheet />`.
  - `/session`: Micro-tension spotlight and kinetic cues mounted on active set card.
  - `/posture`: Structural balance dashboard with 1-tap corrective protocol injection.
- **Signals Emitted**: `anatomy.muscle_worked`, `posture.ratio_scored`, `posture.weakness_flagged`.
- **Signals Consumed**: `train.pr_hit` (updates benchmark anchor 1RMs).

---

## 3. Pillar 3: Intelligent Autoregulation & Substitution Copilot
- **Scope**: Specs 004, 010, 011, 017 (`src/lib/autoregulation.ts`, `src/lib/coach-engine.ts`)
- **Promise**: *"Adapt instantly to sleep deficits and occupied gym equipment without breaking flow."*
- **Core Capabilities**:
  - **Autoregulation Engine**: Biometric down-regulation buffering axial compound lifts by 5–10% on low HRV or shortened sleep to preserve lumbar safety.
  - **`<SubstitutionCopilotDrawer />`**: Instant equipment matrix swap (Barbell, Dumbbell, Cable, Machine, Bodyweight) matching muscular subdivisions and resistance curves with 1-tap in-session mutation.
  - **Agentic RAG Program Builder (`/program/new`)**: Gemini 3.8 Flash generating structured 16-week mesocycles with strict Zod validation and orthopedic safety bounds.
- **Surfaces On**:
  - `/today`: `<AdaptiveRecalibrationCard />` surfacing above the workout hero.
  - `/session`: 1-tap "Swap Exercise" copilot drawer.
  - `/coach`: Contextual AI concierge chat with `<CoachSmartActionCard />`.
- **Signals Emitted**: `copilot.exercise_swapped`, `autoregulation.buffer_applied`.
- **Signals Consumed**: `biometrics.hrv_ms`, `biometrics.sleep_hours`, `feedback.joint_pain`.

---

## 4. Pillar 4: Daily Rhythm, Hydration & Supplementation
- **Scope**: Specs 003, 006, 007 (`src/app/(trainee)/today/`, `SupplementStackDrawer.tsx`)
- **Promise**: *"Fuel every session with precision micronutrient timing and circadian hydration."*
- **Core Capabilities**:
  - **Circadian Readiness Check-In**: 1-tap morning confirmation capturing sleep quality and subjective recovery.
  - **Time-of-Day Micronutrient Stacks**:
    - *Morning Stack*: Vitamin D3/K2 (5,000 IU), Omega-3 (2g), Vitamin B-Complex.
    - *Workout Stack*: Creatine Monohydrate (5g) and mineral electrolytes.
    - *Evening Wind-Down Stack*: Magnesium Glycinate (400mg) and L-Theanine (200mg).
  - **Hydration Wave Tracking**: 3,500ml daily hydration base + 500ml workout volume bonus, tracked via 1-tap increment pills.
- **Surfaces On**:
  - `/today`: `<ReadinessCheckin />`, `<SupplementStackDrawer />`, and timeline hydration milestones.
- **Signals Emitted**: `nutrition.supplements_checked`, `nutrition.hydration_logged_ml`.
- **Signals Consumed**: `train.tonnage_kg` (adds fluid and electrolyte compensation).

---

## 5. Pillar 5: Offline Sync Resilience & Multi-Region Cloud Infrastructure
- **Scope**: Spec 018 (`src/lib/store/offline-sync.ts`, `public/sw.js`, `cloudbuild.yaml`)
- **Promise**: *"Zero data loss in concrete basement gyms and sub-20ms latency worldwide."*
- **Core Capabilities**:
  - **Set-Level Draft Journaling**: Sub-2ms instant write-ahead persistence to IndexedDB and localStorage with 4-hour crash auto-restore.
  - **Replay Mutation Queue**: Queues failed network mutations with exponential backoff (`2^attempts * 1000ms`) and jitter, automatically draining upon reconnect.
  - **Service Worker Precache**: Pre-caches `/exercises` and `/data/exercise-catalogue.json` for full offline searching.
  - **Multi-Region Managed Cloud Run**: Geo-replicated container deployment across US Central (`us-central1`) and Middle East (Doha, Qatar `me-central1`) on port 8080.
- **Surfaces On**:
  - Background infrastructure across all routes; `/you` displays offline cache health and sync status.
- **Signals Emitted**: `sync.queue_drained`, `sync.draft_restored`, `network.status_change`.

---

## 6. Coach Architecture: Contextual Connective Intelligence
- **Role**: Coach is the quiet, connective tissue linking biometrics, periodization, and in-gym execution.
- **Access Points**:
  - Dedicated concierge at `/coach`.
  - Contextual action chips in `/session` (`[Swap Exercise]`, `[Why this weight?]`, `[Short on time]`).
  - Insight card "Why?" links on `/today`.
- **Operating Rule**: The coach parameterizes vetted, typed `<CoachSmartActionCard />` primitives. It never sends unformatted walls of text and never interrupts the active gym floor without user invocation.
