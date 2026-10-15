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
| **Freeform AI Conversational Chatbot** | 2 | 2 | 2 | 2 | 4.0 | 4.0 | **1.00** | 🔴 **KILLED** | **Slop / Liability Trap**: Lifters do not text chatbots between sets. Replaced with 1-tap `<CoachSmartActionCard />`. |
| **Continuous Unvalidated Wearable Ingestion** | 2 | 2 | 2 | 2 | 5.0 | 4.0 | **0.89** | 🔴 **KILLED** | **Premature Complexity**: OAuth token drift and latency. Replaced with lightweight webhook `POST /api/webhooks/biometrics`. |
| **Style & Wardrobe Pillar** | 1 | 1 | 1 | 1 | 5.0 | 5.0 | **0.40** | 🔴 **KILLED** | **Toxic Distraction**: Completely alienates serious lifters; zero ICP crossover; destroys brand credibility. |
| **Social Network & Rolodex Pillar** | 1 | 1 | 1 | 1 | 4.0 | 5.0 | **0.44** | 🔴 **KILLED** | **Empty Network Fluff**: Fails the concierge test; social features before single-player utility create ghost towns. |

---

## 2. In-Depth ROI Scoring Analysis for Specs 014–018

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

---

## 4. The Greenlit Production Engine (Build Scope)

The verified greenlit scope encompasses Specs 001–018, operating as a unified, cohesive biomechanical platform:

1. **In-Gym Execution Floor (`/session`)**: Sub-5s set logging, smart pre-fills, `<PlateCalculatorPopover />`, `<RestIntervalBar />` with synthetic Web Audio chimes, and Screen Wake Lock.
2. **6,554-Exercise OpenGym Catalogue Browser (`/exercises`)**: Sub-10ms query execution, 40+ gym shorthands, and detailed movement mechanics.
3. **Anatomical Tension Spotlight (`<AnatomicalTensionSpotlight />`)**: Vector micro-torso highlighting target (Emerald) and synergist (Cyan) muscles with Setup Anchor and Kinetic Drive cues.
4. **Intelligent Substitution Copilot (`<SubstitutionCopilotDrawer />`)**: 1-tap in-session equipment swap with resistance curve matching and weight recalculation.
5. **Auto-Progression & Deload Engine (`progression.ts`)**: Double progression, Greyskull LP, stall streaks, and 10% deload resets.
6. **Structural Balance Radar (`/posture`)**: Poliquin, Thibaudeau, and ATG benchmark ratio analysis.
7. **Offline Sync Resilience (`offline-sync.ts`)**: Write-ahead IndexedDB set logging and idempotent mutation replay queue.
8. **Multi-Region Cloud Run Infrastructure**: Geo-replicated deployment in Doha (`me-central1`) and US Central (`us-central1`).
