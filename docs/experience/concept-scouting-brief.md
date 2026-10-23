# VYRA Autonomous Biomechanical Engine — Concept Scouting Brief

> **Research Focus**: AI-Native Interfaces, Biomechanical Precision, Spatial Telemetry & In-Gym Execution  
> **Evaluation Rubric**: 3 Feeling Words (*Calm, Capable, Personal*) & The 12 Core Laws  
> **Repository Ground Truth**: All 10 concepts evaluated below are **Adopted, Shipped & Verified** in production.

---

## 1. Concept 1: Model-Composed Component Streaming (AI-Native Generative UI)
- **What It Is**: Rather than streaming unformatted markdown tokens into a chat bubble, the model emits parameter blocks conforming to vetted client-side component schemas (`CoachSmartActionCard`). The client renders progressive visuals into reserved space without layout shift.
- **Why It Fits Vyra**: Athletes on a gym floor or during quick breaks cannot parse long paragraphs. They require an immediate, interactive action card: "Swap to Incline Dumbbells", "Condense to 30 Min", or "Buffer Load 10%".
- **Risk**: Hallucinated parameters, broken rendering, or high API latency.
- **Cheapest Test Plan**: Strict TypeScript/Zod schema validation with deterministic rule-based fallback implemented in `coach-engine.ts`.
- **Status in Repo**: **Adopted & Verified** in `src/components/coach/CoachSmartActionCard.tsx` and `src/lib/coach-engine.ts`.

---

## 2. Concept 2: Ambient Timeline Convergence (The Single Anchor)
- **What It Is**: Eliminates traditional multi-tab navigational silos by projecting all daily events (training hero, hydration milestones, micronutrient stacks, evening wind-down) onto a single chronological time vector.
- **Why It Fits Vyra**: An athlete's day flows sequentially: waking readiness $\to$ pre-workout hydration $\to$ gym floor execution $\to$ post-workout shake $\to$ evening sleep. Past moments collapse; the active moment is expanded as the hero.
- **Risk**: Timeline clutter if too many micro-moments are dumped simultaneously.
- **Cheapest Test Plan**: Enforce strict moment density caps in `deriveDayTimeline`: collapse completed past moments to 1-line checkmarks; show at most 1 expanded hero; keep upcoming moments quiet.
- **Status in Repo**: **Adopted & Verified** in `src/app/(trainee)/today/page.tsx` via `Plan.Timeline`.

---

## 3. Concept 3: Station-Locked Gym Floor Execution
- **What It Is**: Physical gym environment architecture where exercise blocks are grouped by floor station (e.g. Wednesday Slot 3 Station-Locked Superset at a single cable column).
- **Why It Fits Vyra**: Busy professionals training during 45-minute lunch breaks waste up to 10 minutes walking between busy gym equipment. Station-locking preserves the 34-minute lifting budget and eliminates equipment hogging.
- **Risk**: A gym might not have the exact machine free.
- **Cheapest Test Plan**: Curate 4 modality alternatives (Machine, Dumbbell, Cable, Bodyweight) for every prescription with a 1-tap in-session switcher.
- **Status in Repo**: **Adopted & Verified** in `src/lib/training-math/master-transformation-program.ts` and `/session`.

---

## 4. Concept 4: Biometric HRV Autoregulation Interceptor
- **What It Is**: Passive wearable telemetry (Apple Watch / Whoop) ingesting resting heart rate and HRV. When physiological strain, low sleep, or elevated CNS fatigue is detected, the system proactively generates a load adjustment proposal without requiring user prompt engineering.
- **Why It Fits Vyra**: High-performance desk athletes balancing intense weekly training with recreational sports require load calibration to prevent overtraining syndrome, joint impingement, and systemic CNS exhaustion.
- **Risk**: False-positive adjustments frustrating the trainee on days they feel motivated.
- **Cheapest Test Plan**: Proactivity budget: never silently reduce weight; show the transparent "Why?" card with a 1-tap "Apply Buffer" button and 1-tap Undo.
- **Status in Repo**: **Adopted & Verified** in `src/app/api/webhooks/biometrics/route.ts` and `src/lib/autoregulation.ts`.

---

## 5. Concept 5: Stealth Gym Floor Mode & Zero-Transit Timers
- **What It Is**: When entering an active workout, the interface unmounts all global navigation and unneeded chrome. Sets feature auto-starting countdown timers, 0s superset transitions, and 1-tap confirmations.
- **Why It Fits Vyra**: Logging sets with sweaty hands on a phone must take $\le$ 5 seconds. Cognitive friction on the gym floor destroys workout momentum.
- **Risk**: Trainee getting lost or feeling trapped in full-screen mode.
- **Cheapest Test Plan**: Persistent, clear "Exit Session" in header; non-blocking exercise form cue drawers that preserve timer state.
- **Status in Repo**: **Adopted & Verified** in `src/app/(trainee)/session/page.tsx`.

---

## 6. Concept 6: OpenGym Biomechanical Math Port & 6,554-Item Exercise Catalogue Indexing
- **What It Is**: High-performance ingestion of 6,554 JSON exercise definitions into memory, sub-10ms inverted token search, 40+ gym shorthands, and pure TypeScript math algorithms (submaximal 1RM formulas, plate loading, auto-progression, structural balance).
- **Why It Fits Vyra**: Eliminates dependence on external databases and establishes mathematical ground truth for all training prescriptions.
- **Risk**: Large bundle size or slow search latency on mobile.
- **Cheapest Test Plan**: Inverted token indexing in-memory, memory caching, Vitest test suites.
- **Status in Repo**: **Adopted & Verified** in `src/lib/rag/`, `src/lib/training-math/`, and `src/app/(trainee)/exercises/page.tsx`.

---

## 7. Concept 7: Anatomical Tension Spotlight with Micro-Torso Anterior/Posterior View & Dual Kinetic Anchors
- **What It Is**: Pure vector SVG micro-silhouette highlighting primary tension in Emerald (`#10B981`) and synergists in Cyan (`#06B6D4`), paired with Setup Anchor and Kinetic Drive typographic cues.
- **Why It Fits Vyra**: Eliminates cognitive overhead on the gym floor; lifters immediately grasp muscle recruitment without watching 3-minute video tutorials.
- **Risk**: SVG rendering overhead or complex canvas state.
- **Cheapest Test Plan**: Clean SVG markup with 0ms render latency and segmented toggle.
- **Status in Repo**: **Adopted & Verified** in `src/components/trainee/AnatomicalTensionSpotlight.tsx`.

---

## 8. Concept 8: Intelligent Substitution Copilot with Equipment Matrix & Biomechanical Regression
- **What It Is**: In-gym equipment conflict resolver matching exercises by muscular subdivision and resistance profile (lengthened/shortened) with 1-tap in-session mutation.
- **Why It Fits Vyra**: Commercial gyms during peak hours have occupied stations; lifters need instant, biomechanically equivalent swaps without recalculating weights or losing logged sets.
- **Risk**: Incompatible load scaling or loss of previously logged sets.
- **Cheapest Test Plan**: Biomechanical matching algorithm with 1RM equivalence and active session state preservation.
- **Status in Repo**: **Adopted & Verified** in `src/components/trainee/SubstitutionCopilotDrawer.tsx` and `src/app/api/substitutions/route.ts`.

---

## 9. Concept 9: Offline Sync Resilience with Write-Ahead IndexedDB Queue & Optimistic Replay
- **What It Is**: Write-ahead set-level draft journaling (<2ms to IndexedDB/localStorage, 4-hour crash auto-restore) and replay mutation queue with exponential backoff and jitter.
- **Why It Fits Vyra**: Concrete basement gym floors routinely drop cellular connections; lifters must never lose a logged set or have their screen freeze waiting for network.
- **Risk**: Stale draft conflicts or duplicate database writes upon reconnection.
- **Cheapest Test Plan**: Idempotent client-generated UUIDs, 4-hour TTL eviction, and offline integration unit tests.
- **Status in Repo**: **Adopted & Verified** in `src/lib/store/offline-sync.ts` and `tests/unit/lib/offline-sync-resilience.test.ts`.

---

## 10. Concept 10: Multi-Region Cloud Run Architecture with Doha (`me-central1`) Low-Latency Routing
- **What It Is**: Geo-replicated container deployment running Next.js standalone on Cloud Run across US Central (`us-central1`) and Middle East (Doha, Qatar `me-central1`) on port 8080.
- **Why It Fits Vyra**: Delivers sub-20ms edge latency for GCC executive athlete cohorts while maintaining global high-availability and automated health probes.
- **Risk**: Regional database replication latency or deployment divergence.
- **Cheapest Test Plan**: Automated `cloudbuild.yaml` multi-region deployment pipeline with commit SHA tracking and `/api/health` probes.
- **Status in Repo**: **Adopted & Verified** in `cloudbuild.yaml` and `src/app/api/health/route.ts`.
