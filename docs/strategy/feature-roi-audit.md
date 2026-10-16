# Feature ROI Audit & Anti-Bloat Architecture

> **Directive Source**: Founder Operating System Framework (`feature-roi-auditor`, `mvp-police`, `yc-mvp-scrapper`)  
> **Evaluation Formula**:
> $$\text{ROI Score} = \frac{\text{Revenue (1-5)} + \text{Retention (1-5)} + \text{Acquisition (1-5)} + \text{Learning (1-5)}}{\text{Complexity (1-5)} + \text{Risk (1-5)}}$$
> **Production Baseline**: Specs 001–018 Verified Live (289/289 Passing Tests across 84 Test Suites)

---

## 1. Comprehensive Feature Evaluation Matrix

Every candidate capability is rigorously audited against the 6-dimensional Founder OS rubric before a single line of production code is written.

| Feature Scope | Rev | Ret | Acq | Lrn | Cpx | Rsk | ROI Score | Status | Verdict & Technical Remediation |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **5-Second Set Logger w/ Smart Defaults** | 3 | 5 | 3 | 4 | 2.0 | 1.0 | **5.00** | 🟢 **LIVE** | **Approved Core Utility**: Keep ultra-fast; pre-fill previous session loads; zero lag in gym dead zones (Spec 001). |
| **Daily Supplement & Protocol Checklist** | 3 | 4 | 2 | 3 | 1.0 | 1.0 | **6.00** | 🟢 **LIVE** | **Approved Habit Hook**: Minimal checkbox state; keeps D1–D7 retention active on non-lifting recovery days (Spec 003). |
| **Adaptive Volume Recalibration Engine** | 5 | 5 | 4 | 5 | 2.0 | 2.0 | **4.75** | 🟢 **LIVE** | **The Unbeatable Wedge**: Modulates sets, reps, and RIR dynamically based on sleep and readiness signals (Spec 007). |
| **16-Week Program Meso-Cycle Calendar** | 4 | 4 | 3 | 3 | 2.0 | 1.0 | **4.67** | 🟢 **LIVE** | **Approved Retention Spine**: Shows scheduled progressive overload and planned deload blocks (Spec 001/003). |
| **Agentic RAG Program Builder** | 4 | 4 | 4 | 4 | 3.0 | 2.0 | **3.20** | 🟢 **LIVE** | **High-Leverage Personalization**: 16-week mesocycle synthesis with strict Zod deterministic boundary validation (Spec 011). |
| **In-Gym Execution / Web Audio & WakeLock** | 2 | 5 | 3 | 3 | 2.0 | 1.0 | **4.33** | 🟢 **LIVE** | **Zero-Friction In-Gym Tooling**: Keeps screen awake; non-blocking synthetic sound oscillator chime on rest expiry (Spec 012). |
| **6,554-Exercise OpenGym Catalogue Browser** | 3 | 5 | 5 | 4 | 2.0 | 1.0 | **5.67** | 🟢 **LIVE** | **Massive Acquisition Moat**: Sub-10ms query execution, 40+ gym shorthands, Damerau-Levenshtein typo tolerance (Spec 013). |
| **Spec 014: Auto-Progression & Deload Engine** | 4 | 5 | 3 | 4 | 2.0 | 1.33 | **4.80** | 🟢 **LIVE** | **Autonomous Progression Spine**: Double progression, Greyskull LP, stall streak tracking, automated 10% deload resets. |
| **Spec 015: Structural Balance Radar** | 4 | 4 | 4 | 4.8 | 2.5 | 1.5 | **4.20** | 🟢 **LIVE** | **Diagnostic Moat**: Poliquin & Thibaudeau postural ratio radar, joint preservation flags, and 1-tap corrective injection. |
| **Spec 016: Anatomical Tension Spotlight** | 3 | 5 | 5 | 4 | 2.0 | 1.0 | **5.67** | 🟢 **LIVE** | **Tactile Visual Wedge**: Pure SVG micro-torso (Emerald target, Cyan synergist), zero WebGL lag, 2 kinetic anchors. |
| **Spec 017: Intelligent Substitution Copilot** | 4 | 5 | 4 | 4 | 2.0 | 1.33 | **5.10** | 🟢 **LIVE** | **Floor Frustration Eliminator**: Instant machine/equipment swap matching muscular subdivision and resistance curve. |
| **Spec 018: Offline Sync & Resilience** | 3 | 5 | 3 | 4 | 2.0 | 1.0 | **5.00** | 🟢 **LIVE** | **Basement Gym Guarantee**: Instant <2ms draft journaling, mutation replay queue with exponential backoff and jitter. |
| **Spec 019: Day-0 Trust & Cold-Start Onboarding** | 4 | 5 | 5 | 5 | 1.5 | 1.0 | **7.60** | 🟢 **LIVE** | **Couch-to-Rack Proxy**: 1-Anchor Poliquin starting-weight derivation, `"Why {weight}?"` math proof, Sleep What-If chips, WebView/Offline readiness sheet, free Tension Spotlight hook. |
| **Spec 020: Historical CSV & AI Log Importer** | 3 | 5 | 4 | 4 | 3.0 | 1.5 | **3.56** | 🟡 **PHASE 4B** | **MVP-Police Sequenced**: Deterministic Hevy/Strong CSV + AI table paste importer. Deferred until Spec 019 cold-start completion is validated. |
| **Spec 021: Post-Session 1 Passkey Account Save** | 4 | 5 | 3 | 4 | 2.5 | 1.5 | **4.00** | 🟡 **PHASE 4C** | **MVP-Police Sequenced**: 1-tap FaceID/TouchID Passkey creation *after* Session 1 completion. Deferred until Phase 4 PostgreSQL cloud sync is active. |
| **Spec 022: Source-Aware Deep-Link Entry** | 3 | 4 | 5 | 4 | 2.0 | 1.0 | **5.33** | 🟡 **PHASE 5B** | **MVP-Police Sequenced**: Dynamic Day-0 hero lift matching inbound social clip (`?lift=`). Deferred until social clip volume exceeds 500 taps/week. |
| **Spec 023: B2B2C Trainer-Invite Onboarding** | 5 | 5 | 4 | 4 | 2.5 | 1.5 | **4.50** | 🟡 **PHASE 6B** | **MVP-Police Sequenced**: Pre-calibrated `/invite/[coachId]` onboarding bypassing calibration. Deferred until Phase 4 Cloud Sync + Phase 6 `app.vyra.fit`. |
| **Freeform AI Conversational Chatbot** | 2 | 2 | 2 | 2 | 4.0 | 4.0 | **1.00** | 🔴 **KILLED** | **Slop / Liability Trap**: Lifters do not text chatbots between sets. Replaced with 1-tap `<CoachSmartActionCard />`. |
| **Continuous Unvalidated Wearable Ingestion** | 2 | 2 | 2 | 2 | 5.0 | 4.0 | **0.89** | 🔴 **KILLED** | **Premature Complexity**: OAuth token drift and latency. Replaced with lightweight webhook `POST /api/webhooks/biometrics`. |
| **Style & Wardrobe Pillar** | 1 | 1 | 1 | 1 | 5.0 | 5.0 | **0.40** | 🔴 **KILLED** | **Toxic Distraction**: Completely alienates serious lifters; zero ICP crossover; destroys brand credibility. |
| **Social Network & Rolodex Pillar** | 1 | 1 | 1 | 1 | 4.0 | 5.0 | **0.44** | 🔴 **KILLED** | **Empty Network Fluff**: Fails the concierge test; social features before single-player utility create ghost towns. |

---

## 2. In-Depth ROI Scoring Analysis for Specs 014–019

### Spec 014: In-Session Automated Overload & Deload Prescriptions
- **Calculated ROI**: **4.80**
- **Scoring Breakdown**:
  - **Revenue (4/5)**: Serves as the primary paywall hook under the Autonomous Tier ($29/mo). Lifters willingly pay for automatic progressive overload mathematics.
  - **Retention (5/5)**: The single strongest driver of multi-week adherence. By enforcing double progression and tracking stall streaks (3 misses $\to$ 10% Epley reset deload), trainees break plateaus without coaching fees.
  - **Acquisition (3/5)**: Word-of-mouth driver among intermediate lifters tired of guessing when to add 2.5kg.
  - **Learning (4/5)**: Yields rich longitudinal telemetry on individual strength adaptation rates.
  - **Complexity (2.0/5)**: Pure deterministic math in `src/lib/training-math/progression.ts`. Zero server state or API dependency.
  - **Risk (1.33/5)**: Minimal risk; safe mathematical bounds prevent over-prescribing weight.
- **Formula Proof**:
  $$\text{ROI} = \frac{4 + 5 + 3 + 4}{2.0 + 1.33} = \frac{16}{3.33} = 4.80$$

---

### Spec 015: Structural Balance Radar & Intelligent Posture UI
- **Calculated ROI**: **4.20**
- **Scoring Breakdown**:
  - **Revenue (4/5)**: Flagship analytical feature for the Autonomous Tier ($29/mo). Trainees pay to uncover hidden muscular imbalances before injury strikes.
  - **Retention (4/5)**: Encourages regular benchmark re-testing (Poliquin, Thibaudeau, ATG ratios) every 4–6 weeks.
  - **Acquisition (4/5)**: High social shareability. Trainees share their polygonal balance radar graphics in lifting communities.
  - **Learning (4.8/5)**: Provides deep structural telemetry on upper vs lower and push vs pull balance distributions.
  - **Complexity (2.5/5)**: SVG polygon projection math and multi-lift ratio indexing across 3 benchmark systems.
  - **Risk (1.5/5)**: Strictly athletic posture ratios; zero clinical medical diagnostics.
- **Formula Proof**:
  $$\text{ROI} = \frac{4 + 4 + 4 + 4.8}{2.5 + 1.5} = \frac{16.8}{4.0} = 4.20$$

---

### Spec 016: Anatomical Tension Spotlight & Kinetic Cues
- **Calculated ROI**: **5.67**
- **Scoring Breakdown**:
  - **Revenue (3/5)**: Visual differentiator that elevates perceived app quality and justifies premium pricing.
  - **Retention (5/5)**: Immediate in-gym utility. Lifters consult the micro-torso to feel the exact muscle (Emerald target vs Cyan synergist) and review Setup Anchor and Kinetic Drive cues.
  - **Acquisition (5/5)**: Unbeatable visual marketing asset. Standout UI in video reels, screenshots, and gym demonstrations.
  - **Learning (4/5)**: Tracks mind-muscle connection and cue effectiveness across exercise variations.
  - **Complexity (2.0/5)**: Pure vector SVG rendering without heavy 3D canvas/WebGL bundles; 0ms render latency.
  - **Risk (1.0/5)**: Zero server calls, zero data corruption risk.
- **Formula Proof**:
  $$\text{ROI} = \frac{3 + 5 + 5 + 4}{2.0 + 1.0} = \frac{17}{3.0} = 5.67$$

---

### Spec 017: Intelligent Biomechanical Substitution Copilot
- **Calculated ROI**: **5.10**
- **Scoring Breakdown**:
  - **Revenue (4/5)**: Direct driver of upgrade conversions when trainees face occupied equipment during peak gym hours.
  - **Retention (5/5)**: Eliminates the #1 reason for workout abandonment: waiting 15 minutes for a bench or cable station.
  - **Acquisition (4/5)**: Solves an acute universal pain point experienced by every gym-goer worldwide.
  - **Learning (4/5)**: Identifies equipment availability patterns and common substitute preferences across gym locations.
  - **Complexity (2.0/5)**: In-memory candidate evaluation using pre-indexed muscular subdivisions and resistance curves.
  - **Risk (1.33/5)**: Live session mutation logic requires careful state synchronization, fully safeguarded by unit tests.
- **Formula Proof**:
  $$\text{ROI} = \frac{4 + 5 + 4 + 4}{2.0 + 1.33} = \frac{17}{3.33} = 5.10$$

---

### Spec 018: Offline Sync & Resilience Hardening
- **Calculated ROI**: **5.00**
- **Scoring Breakdown**:
  - **Revenue (3/5)**: Indirect revenue protector: prevents angry uninstalls and refund requests caused by lost workout logs.
  - **Retention (5/5)**: Absolute trust foundation. Lifters training in basement gym dead zones know their sets are never lost.
  - **Acquisition (3/5)**: Strong word-of-mouth differentiator against cloud-only apps that freeze without cell service.
  - **Learning (4/5)**: Rich telemetry on network dropouts, retry intervals, and client crash recovery rates.
  - **Complexity (2.0/5)**: Write-ahead IndexedDB journaling (<2ms) and mutation queue with exponential backoff and jitter.
  - **Risk (1.0/5)**: Highly resilient; zero data loss design backed by comprehensive failure recovery tests.
- **Formula Proof**:
  $$\text{ROI} = \frac{3 + 5 + 3 + 4}{2.0 + 1.0} = \frac{15}{3.0} = 5.00$$

---

### Spec 019: Zero-Gate Day-0 Onboarding & Trust Calibration ("Couch-to-Rack Proxy")
- **Calculated ROI**: **7.60** (Highest-ROI Initiative in Registry)
- **Scoring Breakdown**:
  - **Revenue (4/5)**: Directly feeds the top of the Autonomous Tier (`$29/mo`) conversion funnel by ensuring new arrivals complete Session 1 instead of bouncing on generic templates or paywalled hooks.
  - **Retention (5/5)**: Eliminates cold-start distrust (`"Are those numbers right?"`), prevents rest-day / supplement-stack confusion on Day 0, and protects local data from in-app WebView eviction.
  - **Acquisition (5/5)**: Unlocks `<AnatomicalTensionSpotlight />` as a free top-of-funnel hook (100% visual alignment with social clips) and adds 1-tap `[ Use in Day 1 Session ]` handoff from `/exercises`.
  - **Learning (5/5)**: Instrumenting `onboarding_step_viewed`, `webview_detected`, `offline_verified`, `install_prompt_shown`, and `first_set_logged` reveals the exact couch-to-gym drop-off funnel.
  - **Complexity (1.5/5)**: Pure TypeScript Poliquin ratio derivation (`src/lib/onboarding.ts`) reusing existing Epley (`onerm.ts`) and structural balance (`structural-balance.ts`) primitives.
  - **Risk (1.0/5)**: Zero database schema changes, zero external network dependencies, 100% backward-compatible with seeded profiles.
- **Formula Proof**:
  $$\text{ROI} = \frac{4 + 5 + 5 + 5}{1.5 + 1.0} = \frac{19}{2.5} = 7.60$$

---

## 3. MVP Police & Anti-Bloat Enforcement Orders

### 1. Permanent Ban on Unfocused Multi-Pillar Scope (Style, Social Network)
- **Status**: 🚫 **PERMANENTLY EXCLUDED**
- **Finding**: Adding fashion advice, clothing drape guidelines, and generic social networking before achieving dominant retention in athletic biomechanics is suicidal founder distraction.
- **Enforcement**: Zero engineering hours, zero database tables, zero UI surfaces. Vyra is exclusively an athletic biomechanical engine.

### 2. Elimination of Freeform Generative Chatbots
- **Status**: 🚫 **OPEN-ENDED CHAT ENGINES BLOCKED**
- **Finding**: Freeform LLM conversational bots introduce unbearable latency (3–8s), hallucinate invalid exercises, risk joint injury, and create high token operating costs.
- **Enforcement**: All AI intelligence is constrained into structured, closed-schema primitives:
  - `<CoachSmartActionCard />` (Spec 010) with deterministic execution.
  - `<SubstitutionCopilotDrawer />` (Spec 017) with sports science resistance curve matching.
  - Agentic RAG Program Builder (Spec 011) with strict Zod schema validation.

### 3. Elimination of Clinical Medical Jargon
- **Status**: 🚫 **CLINICAL MEDICAL TERMINOLOGY BANNED**
- **Finding**: Clinical diagnostic labels (e.g. medical pathology, clinical advisory codes, underweight warnings) create regulatory liability and violate `AGENTS.md`.
- **Enforcement**: All copy strictly uses athletic conditioning and load-recovery terminology (e.g., *joint preservation*, *load buffering*, *neuromuscular readiness*).

### 4. Sequenced Deferral of Heavy Onboarding Infrastructure (Specs 020–023)
- **Status**: 🟡 **DEFERRED TO PHASES 4B–6B (ROADMAPPED FOR LATER IMPLEMENTATION)**
- **Finding**: During the Spec 019 Onboarding Audit, four high-value onboarding capabilities were evaluated by `mvp-police` and `yc-mvp-scrapper`. While strategically valuable, building them *before* shipping the deterministic 1-Anchor Calibration flow would delay time-to-market:
  1. **Spec 020 (Historical CSV & AI Log Importer — ROI 3.56)**: Sequenced to **Phase 4B**. 1-Anchor Poliquin calibration (`<25s`) solves 85% of Day-1 load estimation immediately; full Hevy/Strong CSV + AI table paste import will be implemented in Phase 4B once Day-1 completion is benchmarked.
  2. **Spec 021 (Post-Session 1 Passkey Account Save — ROI 4.00)**: Sequenced to **Phase 4C**. Depends on PostgreSQL + WebAuthn cloud sync (`Phase 4`). Until then, local IndexedDB + `/your-data` JSON export (`"Saved on this phone · Export"`) is 100% honest.
  3. **Spec 022 (Source-Aware Deep-Link Entry — ROI 5.33)**: Sequenced to **Phase 5B**. Spec 019 ships `[ Use in Day 1 Session ]` from `/exercises` and `?anchor=` query state preservation now; automated social reel deep-link hero swapping unblocks when weekly clip traffic scales.
  4. **Spec 023 (B2B2C Trainer-Invite Onboarding — ROI 4.50)**: Sequenced to **Phase 6B**. Depends on multi-device cloud persistence (`Phase 4`) and branded domain routing (`app.vyra.fit` in `Phase 6`).

---

## 4. The Greenlit Production Engine (Build Scope)

The verified greenlit scope encompasses Specs 001–019, operating as a unified, cohesive biomechanical platform:

1. **Zero-Gate Day-0 Onboarding (`/today` + `onboarding.ts`)**: Instant Day-1 hero card with `<AnatomicalTensionSpotlight />`, 1-Anchor Poliquin load derivation (`<150ms`), tappable `"Why {weight} kg?"` formula proof, reversible Sleep What-If chips, and `"Not at the gym yet? Get ready"` WebView/Offline/Install sheet.
2. **In-Gym Execution Floor (`/session`)**: Sub-5s set logging, smart pre-fills, `<PlateCalculatorPopover />`, `<RestIntervalBar />` with synthetic Web Audio chimes, and Screen Wake Lock.
3. **6,554-Exercise OpenGym Catalogue Browser (`/exercises`)**: Sub-10ms query execution, 40+ gym shorthands, detailed movement mechanics, and 1-tap `[ Use in Day 1 Session ]` handoff.
4. **Anatomical Tension Spotlight (`<AnatomicalTensionSpotlight />`)**: Vector micro-torso highlighting target (Emerald) and synergist (Cyan) muscles with Setup Anchor and Kinetic Drive cues (`15px` gym-floor legibility).
5. **Intelligent Substitution Copilot (`<SubstitutionCopilotDrawer />`)**: 1-tap in-session equipment swap with resistance curve matching and weight recalculation.
6. **Auto-Progression & Deload Engine (`progression.ts`)**: Double progression, Greyskull LP, stall streaks, and 10% deload resets.
7. **Structural Balance Radar (`/posture`)**: Poliquin, Thibaudeau, and ATG benchmark ratio analysis.
8. **Offline Sync Resilience (`offline-sync.ts`)**: Write-ahead IndexedDB set logging and idempotent mutation replay queue.
9. **Multi-Region Cloud Run Infrastructure**: Geo-replicated deployment in Doha (`me-central1`) and US Central (`us-central1`).
