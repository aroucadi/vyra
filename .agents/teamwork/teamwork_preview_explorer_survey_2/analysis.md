# Comprehensive Documentation Survey & Upgrade Blueprint
**Agent**: `teamwork_preview_explorer_survey_2`  
**Milestone**: Phase 0 Documentation Survey  
**Date**: 2026-10-15  
**Working Directory**: `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_explorer_survey_2`  
**Target Files**: 11 files in `docs/experience/` and 5 files in `docs/strategy/` (16 total)

---

## 1. Executive Summary & Ground Truth Baseline

This survey audits all 16 documentation files across `docs/experience/` and `docs/strategy/` against the live production implementation of Vyra (Next.js 16.3.5 / Turbopack / React 19).

### 1.1 Live Production Ground Truth
1. **Routing Reality (24 Compiled Routes)**:
   - **Trainee Pages (12)**:
     - `/` — Entry root / dynamic redirect
     - `/today` — Primary temporal anchor (Day timeline, readiness check-in, hero card, supplement drawer)
     - `/session` — Immersive active workout execution (full-screen, rest timer, plate calculator, form cues, zero distraction)
     - `/program` — 16-week periodized blueprint, week strip, meso-cycle overview
     - `/exercises` — Canonical 6,554-exercise OpenGym catalogue browser with instant multi-filter search
     - `/library` — **Legacy route**: contains a permanent 308 redirect (`permanentRedirect('/exercises')`)
     - `/posture` — Postural balance & structural diagnosis
     - `/progress` — Longitudinal tonnage, strength curves & PR telemetry
     - `/profile` — Anthropometric data & personal records
     - `/you` — Settings, preferences, local data controls, and hidden 5-tap developer menu
     - `/your-data` — Client-side data export, privacy boundaries & local database reset
     - `/coach` — AI coach concierge & smart action cards
     - `/install` — PWA standalone installation walkthrough
   - **Trainer Pages (4)**:
     - `/roster` — Multi-client athlete management roster
     - `/program/new` — Agentic RAG program generator draft builder
     - `/program/[id]` — Custom client program editor
     - `/trainee/[id]` — Individual trainee deep-dive & telemetry inspection
   - **Authentication Page (1)**:
     - `/login` — Clean, streamlined role-based authentication
   - **API Route Handlers (6)**:
     - `/api/events` — High-efficiency telemetry event emission
     - `/api/exercises` — Query & filter engine for 6,554-exercise OpenGym database (<50ms)
     - `/api/health` — Multi-region Cloud Run health check (`status: healthy`, timestamp)
     - `/api/posture` — Postural balance calculation & analysis
     - `/api/substitutions` — Intelligent equipment & regression substitution algorithm
     - `/api/webhooks/biometrics` — Passive Apple HealthKit / Whoop webhook ingestion
2. **Live Biomechanical UI Primitives in `src/components/`**:
   - `<AnatomicalTensionSpotlight />` (`src/components/trainee/AnatomicalTensionSpotlight.tsx`):
     - Interactive SVG micro-torso with anterior/posterior micro-segmented selector
     - Dual-accent tension mapping: Target muscle in Emerald (`#10B981`), Synergist/Stabilizer in Cyan (`#06B6D4`)
     - Two kinetic anchors: **Setup Anchor** (stability cue) & **Kinetic Drive** (prime mover action)
   - `<SubstitutionCopilotDrawer />` (`src/components/trainee/SubstitutionCopilotDrawer.tsx`):
     - Equipment matrix mapping (Barbell, Dumbbell, Cable, Machine, Bodyweight)
     - Biomechanical regression alternatives for joint preservation
     - Direct in-session swap mutation with 1-tap undo
   - `<PlateCalculatorPopover />` (`src/components/trainee/PlateCalculatorPopover.tsx`):
     - Multi-bar support: Olympic (20kg), Women's (15kg), Smith machine (0–15kg)
     - Per-side visual plate breakdown (25kg down to 1.25kg)
   - Rest Timers & Audio/Haptic In-Gym Engine:
     - `<RestIntervalBar />` (`src/components/trainee/RestIntervalBar.tsx`)
     - Synthetic Web Audio API oscillator nodes (`src/lib/in-gym/sound.ts`)
     - Screen Wake Lock (`src/lib/in-gym/wakelock.ts`)
   - Autoregulation & Balance UI:
     - `<ReadinessCheckin />`, `<SessionAdjustmentSheet />`, `<AdaptiveRecalibrationCard />`
     - `<StructuralBalanceRadar />` (Poliquin & Thibaudeau ratios against benchmark lifts)
     - `<IntelligentPostureDiagnosis />`, `<ExerciseConfidenceCard />`, `<OverloadPrescriptionCard />`
     - `<CoachSmartActionCard />` (Closed schema action registry)
     - Compound primitives: `<Card />`, `<Checkin />`, `<Log />`, `<Insight />`, `<Plan />`
3. **Specs 001–018 Status**:
   - All 18 specs (`specs/001-*` through `specs/018-*`) are complete, fully implemented, and live in production.
   - Backed by **289 passing unit/integration tests** across 37 test suites.
   - Deployed on multi-region Cloud Run: Doha (`me-central1`) and US Central (`us-central1`).
4. **Entitlements Reality**:
   - Code-level feature gating in `src/lib/entitlements.ts` defines tiers (`FREE`, `PRO`, `ENTERPRISE`).
   - Strategy requirements mandate updating to:
     - **Starter Tier ($0 / Free)**: 5s set logging, 6,554-item catalogue browsing, basic plate calculator, offline gym mode.
     - **Autonomous Tier ($29/mo)**: Full OpenGym biomechanical math, auto-progression/deload, structural balance radar, adaptive autoregulation, substitution copilot.
     - **VIP Coach Concierge ($129/mo)**: Everything in Autonomous + 1-on-1 asynchronous coach review, custom mesocycle RAG generation, priority feature access.
5. **Future Horizons**:
   - **Phase 4**: Multi-Device Cloud Sync & Auth (transitioning IndexedDB to PostgreSQL/Drizzle with WebAuthn/Passkeys).
   - **Phase 5**: Automated Biometrics Webhook Ingestion (Apple HealthKit / Whoop webhook into `/api/webhooks/biometrics`).
   - **Phase 6**: DNS A-Record Activation (`app.vyra.fit` -> Anycast IP `136.81.52.191`) for branded PWA distribution.

---

## 2. Detailed Survey of 11 Experience Documents (`docs/experience/`)

### File 1: `docs/experience/information-architecture.md`
- **Current State**: Describes a speculative 4-tab mobile shell (`[ Today ] [ Coach ] [ Life ] [ You ]`) with locked "Life" rooms for Eat, Sleep, Style, Network.
- **Obsolete Elements**:
  - Claims `[ Today ] [ Coach ] [ Life ] [ You ]`. In reality, `TraineeNav.tsx` has `[ Today ] [ Program ] [ Exercises ] [ You ]`.
  - Claims rule: *"No Program Tab: The training program lives inside Life -> Train -> Program"*. In reality, `Program` is a primary top-level navigation tab (`/program`).
  - Mentions `Life` tab and speculative rooms (`Style`, `Network`, `Sleep`). `Life` does not exist in live navigation.
  - References `/library` instead of canonical `/exercises` (and fails to note the permanent 308 redirect from `/library`).
  - Missing all 23 real routes, specifically:
    - Trainee routes: `/posture`, `/progress`, `/session`, `/install`, `/your-data`, `/coach`
    - Trainer routes: `/roster`, `/program/new`, `/program/[id]`, `/trainee/[id]`
    - API routes: `/api/events`, `/api/exercises`, `/api/health`, `/api/posture`, `/api/substitutions`, `/api/webhooks/biometrics`
  - Missing the live biomechanical primitives (`AnatomicalTensionSpotlight`, `SubstitutionCopilotDrawer`, `PlateCalculatorPopover`, `RestIntervalBar`).
- **Required Upgrades**:
  - Rewrite Section 1 to document the real 4-tab shell: `[ Today (/today) ]`, `[ Program (/program) ]`, `[ Exercises (/exercises) ]`, `[ You (/you) ]`.
  - Add comprehensive route directory detailing all 24 Next.js routes (18 pages + 6 APIs).
  - Explicitly document `/library` as a permanent 308 redirect to `/exercises`.
  - Update Screen Hierarchy & Flows to document `/session` (Active Floor with plate popover, rest interval bar, kinetic anchors, and substitution drawer), `/posture`, `/progress`, and the trainer portal (`/roster`, `/trainee/[id]`).
  - Integrate live component hierarchy: `<AnatomicalTensionSpotlight />`, `<SubstitutionCopilotDrawer />`, `<PlateCalculatorPopover />`.
  - Align with `AGENTS.md` (no unsegmented monoliths, single primary CTA, 3-tier colors).

### File 2: `docs/experience/ideal-day-map.md`
- **Current State**: 24-hour chronological timeline describing speculative moments across 5 pillars (e.g., 15:00 Style/Afternoon Transition "Rain + gym commute: lightweight shell", 18:30 Network "Marcus logged the same chest split today").
- **Obsolete Elements**:
  - References speculative non-training pillars ("Style", "Network") which dilute the core biomechanical training wedge.
  - Does not reflect the live `src/app/(trainee)/today/page.tsx` architecture (Header with readiness status pill, `<ReadinessCheckin />`, `<Insight />` with SessionAdjustmentSheet trigger, Hero `<Card variant="hero">` with single primary action, and `<Plan />` timeline containing collapsed past moments and quiet upcoming moments).
  - Missing live training moments: pre-workout plate loading estimation, in-gym active workout hero, post-workout tonnage celebration, and evening magnesium recovery.
- **Required Upgrades**:
  - Anchor the day map strictly to the athletic training day: Morning Readiness Check-in $\rightarrow$ Morning Micronutrient Stack $\rightarrow$ Lunch/Evening In-Gym Hypertrophy Workout (Hero) $\rightarrow$ Post-Workout Fuel $\rightarrow$ Evening Magnesium Wind-Down.
  - Eliminate style/wardrobe advice and social network fluff.
  - Detail the live UI states from `deriveDayTimeline` (collapsed past checked moments, expanded Hero with single primary CTA, quiet upcoming rows).
  - Specify how cross-pillar insights (e.g. sleep duration modulating session RIR and volume) interact with the live `<SessionAdjustmentSheet />`.
  - Enforce `AGENTS.md` metric density caps and zero clinical medical jargon.

### File 3: `docs/experience/render-contract.md`
- **Current State**: High-quality specification of negative constraints, anti-slop rules, 60-30-10 color hierarchy, motion curves, and operational density.
- **Obsolete Elements**:
  - Does not define the render contracts for the live biomechanical UI components shipped in Specs 012–018:
    - `<AnatomicalTensionSpotlight />`: Micro-torso SVG specs, micro-segmented view selector (Anterior / Posterior), tension color tokens (Emerald `#10B981` target, Cyan `#06B6D4` synergist/stabilizer, Slate `#334155` neutral).
    - Kinetic Anchors: Strict two-anchor typographic contract (**Setup Anchor** and **Kinetic Drive**).
    - `<PlateCalculatorPopover />`: Visual plate breakdown rendering contract, barbell weight selector, side-load distribution.
    - Rest Timers: `<RestIntervalBar />`, synthetic sound oscillator nodes (frequency, duration, non-blocking audio context), Screen Wake Lock behavior.
    - `<SubstitutionCopilotDrawer />`: Equipment matrix pills, regression cards, and biomechanical confidence badges.
  - Does not cite `AGENTS.md` negative constraints explicitly.
- **Required Upgrades**:
  - Add Section 5: "Biomechanical Primitive Render Contracts" detailing exact specifications for `<AnatomicalTensionSpotlight />` (colors, SVG viewport, micro-segmented controls), Kinetic Anchors, `<PlateCalculatorPopover />`, `<RestIntervalBar />`, and `<SubstitutionCopilotDrawer />`.
  - Formalize the sound synthesis spec: Web Audio API oscillator (440Hz / 880Hz short chime, zero audio file dependencies, user gesture initiated).
  - Reinforce `AGENTS.md` mandates: Vertical element ceiling (max 3 stacked items), single primary CTA, tabular numerals (`font-variant-numeric: tabular-nums`), touch targets ($\ge 44 \times 44\text{px}$).

### File 4: `docs/experience/ai-native-spec.md`
- **Current State**: Documents model-composed interfaces, closed component registry (`CoachSmartActionCard`), deterministic fallbacks, and the intelligent UI paradigm.
- **Obsolete Elements**:
  - Section 4 line 71 includes clinical medical jargon: *"Clinical Health Warning: Prominent underweight medical guidance (BMI 16.4 advisory) is persisted on athlete profiles and never overridden by automated algorithms."* This violates the `AGENTS.md` mandate for "zero clinical medical jargon".
  - Does not document the Agentic RAG Program Builder (Spec 011: `src/lib/gemini.ts` generating full structured 16-week mesocycles with strict deterministic constraint validation).
  - Does not document the Intelligent Substitution Copilot (Spec 017: `/api/substitutions` and `substitution-engine.ts` matching OpenGym exercises by primary muscle, mechanics, and equipment).
  - Does not reflect the 6,554-exercise OpenGym RAG integration.
- **Required Upgrades**:
  - Remove all clinical medical jargon and replace with athletic load-capacity guardrails (e.g. lightweight recovery thresholds, joint preservation).
  - Expand Section 2 to include the full AI-Native component suite:
    - `CoachSmartActionCard`
    - `AgenticRagProgramBuilder` (Spec 011)
    - `SubstitutionCopilot` (Spec 017)
    - `IntelligentPostureDiagnosis` (Spec 015)
  - Detail the Gemini 3.8 Flash model composition pipeline, deterministic schema enforcement, and zero-latency offline fallbacks.

### File 5: `docs/experience/charter.md`
- **Current State**: Declares Vyra as a "life super app" in the spirit of WeChat or X with 5 pillars including "Dress well (Style, Postural Fit)" and "Network well (Social, Partner Training)".
- **Obsolete Elements**:
  - Outdated conceptual framing: Promotes style, clothing drape, and social networking, which have been abandoned in favor of the specialized Biomechanical Engine and Autonomous Training OS.
  - References the 5-pillar super app model rather than the focused core: OpenGym biomechanics, 6,554-exercise catalogue, anatomical tension mapping, auto-progression, and offline resilience.
- **Required Upgrades**:
  - Reframe the Product Vision: Vyra is the **Autonomous Biomechanical Engine & Training OS** — an elite, high-precision training companion that bridges pure sports science math with zero-friction in-gym execution.
  - Redefine the core architecture around the verified production engine: OpenGym catalogue, anatomical tension spotlight, intelligent substitution copilot, and autoregulation.
  - Preserve the three core feeling words: **Calm, Capable, Personal**.
  - Reinforce Anti-Goals: No clinical medical jargon, no unsegmented monoliths, no social feed slop, no fake AI chatbots.

### File 6: `docs/experience/laws.md`
- **Current State**: 12 core laws governing UI and interaction design.
- **Obsolete Elements**:
  - Law 1 references `Life` overview and capabilities "Train, Eat, Sleep, Style, Network".
  - Law 3 references: *"Scapular postural focus modulates clothing drape and workspace ergonomics"* (fluff from obsolete style pillar).
  - Law 9 ("Earn the Complexity") still implies unlocking style and network pillars.
  - Does not mention the 6,554-catalogue browser, micro-torso tension spotlight, plate loader, or offline sync resilience.
- **Required Upgrades**:
  - Modernize Law 1: Anchor is `Today`, with dedicated high-performance workspaces: `Program`, `Exercises`, `Progress`, `Posture`, and `You`.
  - Modernize Law 3: Cross-domain signals connect Sleep/Fatigue $\leftrightarrow$ Training Volume/RPE $\leftrightarrow$ Micronutrient Fueling $\leftrightarrow$ Structural Postural Balance. Remove clothing drape.
  - Add explicit laws or sub-clauses for:
    - **Offline Invariant**: In-gym core loops must function 100% offline via write-ahead IndexedDB queueing.
    - **Biomechanical Grounding**: All calculations (1RM, plate loading, deload thresholds, structural ratios) must use deterministic math, never generative hallucinations.
    - **Anatomical Transparency**: Every prescribed movement must expose target muscle, synergists, and kinetic anchors.

### File 7: `docs/experience/pillars.md`
- **Current State**: Lists the 5 pillars (Train, Eat, Sleep, Style, Network) and Coach, marking Style and Network as locked future rooms.
- **Obsolete Elements**:
  - Pillar 1 (Train) is positioned as a sub-room of `Life` (`Life -> Train`). In reality, Training is the central core of the application across `/today`, `/session`, `/program`, `/exercises`.
  - Contains extensive descriptions of abandoned concepts: Pillar 4 (Style: "AI capsule wardrobe", "V-taper styling") and Pillar 5 (Network: "gym occupancy radar", "partner workouts").
  - Fails to document the real architectural pillars of the live system:
    1. Pure Biomechanical Math & In-Gym Execution (Specs 001–003, 012, 014)
    2. Anatomical Tension & Movement Intelligence (Specs 013, 015, 016)
    3. Intelligent Autoregulation & Substitution Copilot (Specs 004, 010, 011, 017)
    4. Daily Rhythm, Hydration & Supplementation (Live Supplement Stack Drawer & Readiness Check-in)
    5. Offline Sync Resilience & Multi-Region Cloud Infrastructure (Spec 018)
- **Required Upgrades**:
  - Restructure the document around the 5 real operational pillars above.
  - Delete obsolete Style and Network specifications.
  - Detail how each real pillar contributes to `/today` and `/session`.
  - Document the Coach as the contextual connective intelligence powering `<CoachSmartActionCard />` and `<SubstitutionCopilotDrawer />`.

### File 8: `docs/experience/principles.md`
- **Current State**: "The 10 Core Principles" — a condensed, slightly redundant version of `laws.md`.
- **Obsolete Elements**:
  - Principle 1 references `Life` tab.
  - Principle 3 references "outfit selection".
  - Principle 10 references "sharing an outfit".
  - Omits key engineering and design guardrails established during Specs 001–018.
- **Required Upgrades**:
  - Re-align with the refined laws: eliminate outfit and style references.
  - Codify the 10 core principles for the Biomechanical Engine:
    1. One Anchor (`Today`), Specialized Workspaces (`Program`, `Exercises`, `Session`)
    2. Moments, Not Features
    3. One Shared Brain (Biometrics $\leftrightarrow$ Loading $\leftrightarrow$ Posture)
    4. Coach as Connective Tissue, Never a Blocker
    5. Three Depths Everywhere (Glance, Act, Learn in Drawers)
    6. Five Minimalist Primitives (`Card`, `Checkin`, `Log`, `Insight`, `Plan`)
    7. Calm by Default (Max 3 elements per card, single primary CTA, 60-30-10 palette)
    8. Deterministic Math Over LLM Hallucinations
    9. Strict Effort Budget ($\le$ 5s to log set, $\le$ 2 taps to start)
    10. Offline-First Resilience (Zero data loss in dead-zone gym basements)

### File 9: `docs/experience/customer-journey.md`
- **Current State**: 5 progressive stages table (Day 0 Onboarding, Week 1 Daily Habit, Week 2–3 Expansion, Month 1 Aha Moment, Month 3+ Life Mastery).
- **Obsolete Elements**:
  - Stage 3 mentions: *"Quietly tuck pillar into Life tab"*.
  - Stage 5 mentions: *"Full Timeline + Network Room"*.
  - Missing the live biomechanical progression milestones: OpenGym catalogue exploration, Anatomical Tension Spotlight mastery, intelligent exercise substitution under gym crowding, and structural balance radar checkups.
- **Required Upgrades**:
  - Remove all references to `Life` tab and `Network Room`.
  - Ground the journey in the lifter's actual progression:
    - **Day 0**: Immediate access to today's session via `/today` or catalogue browsing via `/exercises`; zero mandatory surveys.
    - **Week 1**: 5s gym set logging with pre-filled weights and rest timer chimes.
    - **Week 2–3**: First automated load progression or deload trigger (Spec 014) and exercise substitution (Spec 017) when equipment is occupied.
    - **Month 1**: Poliquin/Thibaudeau structural balance radar assessment (Spec 015) and anatomical volume distribution review.
    - **Month 3+**: 16-week mesocycle completion, PR analytics, and seamless multi-device synchronization.

### File 10: `docs/experience/concept-scouting-brief.md`
- **Current State**: Evaluates 5 concepts (Model-Composed Components, Ambient Timeline Convergence, Station-Locked Execution, Biometric HRV Interceptor, Stealth Gym Mode).
- **Obsolete Elements**:
  - Concept 4 contains clinical medical jargon: *"Alaa is clinically underweight (BMI 16.4) and plays high-intensity football..."* Violates `AGENTS.md`.
  - Missing all the breakthrough concepts conceptualized, built, and verified in Specs 011–018:
    - Concept 6: OpenGym Biomechanical Math Port & 6,554-Item Exercise Catalogue Indexing (Specs 013, 014, 015).
    - Concept 7: Anatomical Tension Spotlight with micro-torso anterior/posterior view and dual kinetic anchors (Spec 016).
    - Concept 8: Intelligent Substitution Copilot with equipment matrix and biomechanical regression (Spec 017).
    - Concept 9: Offline Sync Resilience with write-ahead IndexedDB queue and optimistic UI (Spec 018).
    - Concept 10: Multi-Region Cloud Run Architecture with Doha (`me-central1`) low-latency routing.
- **Required Upgrades**:
  - Sanitize Concept 4: Replace clinical language with athletic conditioning and recovery terminology.
  - Append Concepts 6 through 10 with full scouting briefs: What It Is, Why It Fits Vyra, Risk, Test Plan, and Status in Repo (**Adopted & Verified**).
  - Update all concept statuses to reflect live production deployment.

### File 11: `docs/experience/audit-and-decisions.md`
- **Current State**: Decision log and Web Interface Guidelines compliance matrix covering earlier versions of the UI.
- **Obsolete Elements**:
  - Section 1 table references the old 4-room shell (`Today, Coach, Life, You`) instead of the live navigation (`Today, Program, Exercises, You`).
  - Section 4 "Before vs After" table compares against Google Stitch generation from early design phase.
  - Lacks decision records for Specs 011 through 018:
    - Ingestion and sub-50ms search indexing of 6,554 OpenGym exercises.
    - Porting pure math calculation suite (1RM, plates, progression, structural balance).
    - Transitioning `/library` to `/exercises` via 308 permanent redirect.
    - Creation of `<AnatomicalTensionSpotlight />` and two kinetic anchors.
    - Implementation of `<SubstitutionCopilotDrawer />`.
    - Implementation of offline sync queue in `src/lib/store/offline-sync.ts`.
    - Multi-region Cloud Run deployment.
- **Required Upgrades**:
  - Update Section 1 to reflect current navigation and component structure.
  - Append Section 6: "Architectural Decision Records (ADRs) for Specs 011–018":
    - ADR-011: Agentic RAG Program Builder with Zod guardrails.
    - ADR-012: In-Gym Execution with synthetic Web Audio API and WakeLock.
    - ADR-013: 6,554-Exercise OpenGym catalogue ingestion & in-memory caching.
    - ADR-014: Deterministic auto-progression & stall streak deloading.
    - ADR-015: Poliquin/Thibaudeau structural balance radar.
    - ADR-016: Anatomical tension spotlight & kinetic anchor typography.
    - ADR-017: Multi-tier substitution copilot.
    - ADR-018: Offline write-ahead queue with idempotent sync.
  - Document verified test coverage: 289 passing tests across 37 test suites.

---

## 3. Detailed Survey of 5 Strategy Documents (`docs/strategy/`)

### File 12: `docs/strategy/features-wishlist.md`
- **Current State**: Backlog matrix listing features as "deprioritized & decoupled", with gates to re-open.
- **Obsolete Elements**:
  - Completely missing the "Completed / Live in Production" registry for Specs 001–018.
  - Features that are already live in production are mistakenly listed in the deprioritized backlog:
    - "Server-side Database / Offline queue": Spec 018 already delivered offline sync resilience.
    - "Conversational AI Training Copilot": Spec 010 and 017 already delivered Coach Smart Action Cards and Substitution Copilot.
    - "Telemetry / Webhooks": Spec 008 already delivered `/api/webhooks/biometrics`.
    - "Catalogue Browser & Biomechanical Math": Specs 013, 014, 015, 016 already delivered the 6,554 catalogue, 1RM math, plate calculator, and structural balance radar.
  - Missing the clear definition of remaining future horizons (Phase 4, Phase 5, Phase 6).
- **Required Upgrades**:
  - Add Section 1: **"Completed / Live in Production Registry (Specs 001–018)"**:
    - Full table listing all 18 specs, their production deliverable, test suite verification (289/289 passing tests), and multi-region deployment (Doha `me-central1` and US Central `us-central1`).
  - Restructure Section 2: **"Remaining Future Horizons"**:
    - **Phase 4: Multi-Device Cloud Sync & Server-Side Auth**: Transitioning IndexedDB offline storage to PostgreSQL/Drizzle with WebAuthn/Passkeys authentication, multi-device synchronization, and conflict resolution.
    - **Phase 5: Automated Biometrics Webhook Ingestion**: Full production pipeline from Apple HealthKit (Health Auto Export) / Whoop / Oura webhooks directly into `/api/webhooks/biometrics` for automated sleep, HRV, and resting heart rate calibration.
    - **Phase 6: DNS A-Record Activation & Branded Distribution**: Pointing `app.vyra.fit` to Anycast IP `136.81.52.191`, SSL cert termination, and PWA distribution across GCC/global markets.
  - Retain other future exploratory backlogs (e.g. Ramadan Mode, native haptics) under clear future horizons.

### File 13: `docs/strategy/feature-roi-audit.md`
- **Current State**: ROI evaluation table containing only 8 initial items evaluated using the Founder OS formula.
- **Obsolete Elements**:
  - Missing calculated ROI scores and evaluations for Specs 014 through 018.
  - Missing Specs 011–013.
  - Evaluates only basic logger, supplement checklist, recalibration card, and meso-cycle calendar.
- **Required Upgrades**:
  - Add Specs 014–018 to the Comprehensive Feature Evaluation Matrix with detailed scores:
    - **Spec 014 (Auto-Progression & Deload Engine)**: Rev: 4, Ret: 5, Acq: 3, Lrn: 4, Cpx: 2, Rsk: 1 $\rightarrow$ **ROI: 5.33** (🟢 GREEN / LIVE)
    - **Spec 015 (Structural Balance Radar)**: Rev: 4, Ret: 4, Acq: 4, Lrn: 5, Cpx: 2, Rsk: 1 $\rightarrow$ **ROI: 5.67** (🟢 GREEN / LIVE)
    - **Spec 016 (Anatomical Tension Spotlight)**: Rev: 3, Ret: 5, Acq: 5, Lrn: 4, Cpx: 2, Rsk: 1 $\rightarrow$ **ROI: 5.67** (🟢 GREEN / LIVE)
    - **Spec 017 (Intelligent Substitution Copilot)**: Rev: 4, Ret: 5, Acq: 4, Lrn: 4, Cpx: 2, Rsk: 2 $\rightarrow$ **ROI: 4.25** (🟢 GREEN / LIVE)
    - **Spec 018 (Offline Sync Resilience)**: Rev: 3, Ret: 5, Acq: 3, Lrn: 3, Cpx: 3, Rsk: 1 $\rightarrow$ **ROI: 3.50** (🟢 GREEN / LIVE)
    - Also add Specs 011–013 for completeness:
      - **Spec 011 (Agentic RAG Program Builder)**: Rev: 4, Ret: 4, Acq: 4, Lrn: 4, Cpx: 3, Rsk: 2 $\rightarrow$ **ROI: 3.20** (🟢 GREEN / LIVE)
      - **Spec 012 (In-Gym Execution Readiness / Audio & WakeLock)**: Rev: 2, Ret: 5, Acq: 3, Lrn: 3, Cpx: 2, Rsk: 1 $\rightarrow$ **ROI: 4.33** (🟢 GREEN / LIVE)
      - **Spec 013 (6,554-Exercise OpenGym Catalogue Browser)**: Rev: 3, Ret: 5, Acq: 5, Lrn: 4, Cpx: 2, Rsk: 1 $\rightarrow$ **ROI: 5.67** (🟢 GREEN / LIVE)
  - Update the "Greenlit Core Wedge" section to reflect the expanded, production-proven biomechanical suite.

### File 14: `docs/strategy/launch-positioning.md`
- **Current State**: GTM positioning specification based on Garry Tan's YC Office Hours framework, focusing on the 34-minute desk-worker wedge.
- **Obsolete Elements**:
  - Mentions generic 4-modality equipment matrix without highlighting the breakthrough 6,554-exercise OpenGym integration.
  - Section 1 Primary CTA references `[ View Today's Protocol ]` without linking to the canonical routes (`/today` or `/program`).
  - Does not highlight our competitive technical moats:
    - 6,554 OpenGym catalogue with sub-50ms search and alias indexing.
    - Anatomical Tension Spotlight micro-torso and dual kinetic anchors.
    - Multi-region Cloud Run infrastructure (Doha & US Central).
    - 100% offline gym floor resilience.
- **Required Upgrades**:
  - Update Product Proof Matrix to cite the 6,554 OpenGym catalogue, Anatomical Tension Spotlight, and Substitution Copilot.
  - Update the 30-Second Reel script to feature the Anatomical Tension Spotlight and Plate Calculator.
  - Ensure all route references point to real Next.js paths (`/today`, `/exercises`, `/session`).
  - Emphasize enterprise reliability: 289 passing tests, multi-region Cloud Run deployment.

### File 15: `docs/strategy/monetization-blueprint.md`
- **Current State**: Two-tier pricing model ($0 Free vs $14.99/mo Pro).
- **Obsolete Elements**:
  - Pricing is completely outdated: lists Pro as $14.99/mo or $99/year.
  - Does not reflect the strategic requirement from `ORIGINAL_REQUEST.md`:
    - **Starter Tier ($0 / Free)**
    - **Autonomous Tier ($29/mo)**
    - **VIP Coach Concierge ($129/mo)**
  - Does not align with `src/lib/entitlements.ts` feature capabilities:
    - Free: `basic_workout_logging`, `catalogue_browsing`, `stealth_gym_mode`, `plate_calculator`
    - Paid (Autonomous/Pro): `progression_engine`, `structural_balance_radar`, `autoregulation_advanced`, `gemini_biometric_synthesis`
    - Concierge (Enterprise/VIP): All of the above + 1-on-1 coach review, custom RAG program generation, priority support.
- **Required Upgrades**:
  - Update Section 2 Packaging Structure to the 3-tier architecture:
    - **Starter Tier ($0 / Free Forever)**: Fast 5s set logger, 6,554 OpenGym catalogue, plate calculator, offline gym mode.
    - **Autonomous Tier ($29/mo or $249/yr)**: Everything in Starter + Auto-progression/deload engine, Poliquin structural balance radar, adaptive autoregulation, substitution copilot, tension spotlight.
    - **VIP Coach Concierge ($129/mo)**: Everything in Autonomous + human-in-the-loop async coach review, custom 16-week mesocycle curation, bi-weekly form review, priority feature access.
  - Update paywall trigger copy and sequence to reference the $29/mo Autonomous Tier.
  - Align feature entitlement gating directly with `src/lib/entitlements.ts`.

### File 16: `docs/strategy/customer-journey-map.md`
- **Current State**: 5-stage customer journey architecture for the structured hypertrophy lifter ("Alaa").
- **Obsolete Elements**:
  - Stage 3 mentions a Hack Squat volume shift without connecting to the live `<SubstitutionCopilotDrawer />` or the 6,554 OpenGym catalogue.
  - Does not mention the 6,554-exercise catalogue browser at `/exercises`, which is a key discovery mechanism.
  - Does not reference the Anatomical Tension Spotlight (Spec 016) or the Structural Balance Radar (Spec 015).
  - Uses outdated route and component references.
- **Required Upgrades**:
  - Connect Stage 2 (Activation) to direct catalogue exploration at `/exercises` or immediate workout preview on `/today`.
  - Connect Stage 3 (Aha Moment) to the Anatomical Tension Spotlight and Substitution Copilot Drawer (showing live target/synergist highlights and equipment swap).
  - Connect Stage 4 (Core Habit Loop) to `<RestIntervalBar />`, synthetic audio chimes, and offline sync resilience.
  - Connect Stage 5 (Day 30 Retention) to the Poliquin/Thibaudeau Structural Balance Radar (`/posture`), longitudinal PR tracking (`/progress`), and auto-deload triggers.

---

## 4. Comprehensive Gap & Discrepancy Matrix

| Dimension | Legacy / Outdated Documentation | Live Production Implementation | Target Resolution |
| :--- | :--- | :--- | :--- |
| **Primary Route for Catalogue** | `/library` | `/exercises` (canonical) & `/library` (308 permanent redirect) | Update all docs to `/exercises`; explicitly document the 308 redirect in IA & audit docs. |
| **Total Route Footprint** | 4 tabs documented (`/today`, `/coach`, `/life`, `/you`) | 24 compiled Next.js routes (18 pages + 6 APIs) | Fully document all 24 routes across `information-architecture.md` and audit docs. |
| **Bottom Navigation Tabs** | `Today`, `Coach`, `Life`, `You` | `Today`, `Program`, `Exercises`, `You` (`TraineeNav.tsx`) | Rewrite navigation specs to match `TraineeNav.tsx`. |
| **Spec Statuses** | Specs 001–018 treated as backlog or partially complete | Specs 001–018 are **Live in Production** with 289 passing tests | Move Specs 001–018 to Completed Registry in `features-wishlist.md` and strategy docs. |
| **Future Horizons** | Vague, mixed-up backlog items | Phase 4 (Cloud Sync/Postgres/Auth), Phase 5 (Wearable Webhooks), Phase 6 (DNS `app.vyra.fit`) | Structure into Phase 4, Phase 5, Phase 6 in `features-wishlist.md`. |
| **Pricing & Entitlements** | $14.99/mo Pro | $0 Starter, $29/mo Autonomous, $129/mo VIP Coach Concierge | Update `monetization-blueprint.md` and align with `src/lib/entitlements.ts`. |
| **ROI Scores for Specs 014–018** | Completely missing from `feature-roi-audit.md` | Calculated ROI: Spec 014 (5.33), 015 (5.67), 016 (5.67), 017 (4.25), 018 (3.50) | Add all 5 specs with full Founder OS formula metrics to `feature-roi-audit.md`. |
| **Anatomical Visualization** | Generic mentions of "biomechanics" | `<AnatomicalTensionSpotlight />` micro-torso with Anterior/Posterior toggle and dual kinetic anchors | Fully document component, SVG tokens, and kinetic anchors in render and IA docs. |
| **Equipment Substitution** | "4 modality alternatives" | `<SubstitutionCopilotDrawer />` powered by 6,554 OpenGym catalogue | Document copilot drawer, RAG matching, and in-session swap mechanics. |
| **Offline Resilience** | "Client-side IndexedDB is Done" | Production write-ahead queue (`src/lib/store/offline-sync.ts`) with idempotent replay | Document offline queue and network reconnect sync in strategy and architecture docs. |
| **Medical Jargon** | Clinical terms: "BMI 16.4 underweight advisory", "pathology", "clinical EMR" | Prohibited by `AGENTS.md` | Eliminate all clinical medical jargon; use athletic conditioning and recovery terminology. |
| **Card Element Density** | Some wireframes show 4+ elements | Max 3 elements per card (`AGENTS.md`) | Enforce vertical element ceiling across all wireframe and UI specs. |

---

## 5. Structured File-by-File Upgrade Blueprint

Below is the exact execution specification for each of the 16 documentation files.

### 5.1 Experience Documentation (`docs/experience/`)

#### 1. `docs/experience/information-architecture.md`
- **Action**: Comprehensive rewrite of navigation, screen hierarchy, and route directory.
- **Sections to Update**:
  - Section 1: Replace 4-tab shell with `[ Today ] [ Program ] [ Exercises ] [ You ]`. Clarify that `/coach` is accessible contextually and via top header/chips.
  - Section 2: Replace speculative hierarchy with the real compiled route hierarchy:
    - Root & Trainee: `/`, `/today`, `/session`, `/program`, `/exercises`, `/library` (308 redirect), `/posture`, `/progress`, `/profile`, `/you`, `/your-data`, `/coach`, `/install`.
    - Trainer: `/roster`, `/program/new`, `/program/[id]`, `/trainee/[id]`.
    - API Routes: `/api/events`, `/api/exercises`, `/api/health`, `/api/posture`, `/api/substitutions`, `/api/webhooks/biometrics`.
  - Section 3: Add the live biomechanical UI primitives (`AnatomicalTensionSpotlight`, `SubstitutionCopilotDrawer`, `PlateCalculatorPopover`, `RestIntervalBar`) alongside the 5 composable primitives.
  - Section 4: Update TypeScript contracts to match live store models (`Session`, `Exercise`, `SetLog`, `ProgressionRule`).

#### 2. `docs/experience/ideal-day-map.md`
- **Action**: Overhaul timeline to reflect the focused athletic training day and live UI states.
- **Sections to Update**:
  - Section 1: Remove "Style" (15:00) and "Network" (18:30). Focus on:
    - 06:30–07:00: Wake & Readiness Checkin (`<ReadinessCheckin />`)
    - 07:00: Micronutrient Morning Stack (`<SupplementStackDrawer />`)
    - 12:15: Daily Workout Hero (Session preview $\rightarrow$ Full-Screen Gym Floor)
    - 13:30: Post-Workout Fuel & Celebration Summary
    - 21:30: Evening Wind-Down & Magnesium Stack
  - Section 2: Update visual timeline states to match `TodayPage` implementation: Header date + readiness pill $\rightarrow$ Readiness check-in card $\rightarrow$ Single cross-pillar insight card $\rightarrow$ Hero moment card $\rightarrow$ Collapsed/upcoming plan rows.
  - Remove all clinical medical jargon.

#### 3. `docs/experience/render-contract.md`
- **Action**: Add biomechanical primitive specifications and tighten `AGENTS.md` negative constraints.
- **Sections to Update**:
  - Section 2: Reaffirm 60-30-10 color hierarchy with exact tokens (`#0B0F17` Obsidian canvas, `bg-slate-900/60` cards, `#10B981` Emerald primary, `#06B6D4` Cyan synergist).
  - Add Section 5: "Biomechanical Primitive Specifications":
    - `<AnatomicalTensionSpotlight />`: Micro-torso SVG, anterior/posterior segmented toggle, Emerald `#10B981` target, Cyan `#06B6D4` synergist, Slate `#334155` neutral.
    - Two Kinetic Anchors: **Setup Anchor** (stability foundation) and **Kinetic Drive** (prime mover cue).
    - `<PlateCalculatorPopover />`: Barbell options (20kg, 15kg, Smith 0–15kg), plate breakdown chips.
    - `<RestIntervalBar />` & Audio: Web Audio API synthetic oscillator chime (440Hz / 880Hz), Screen Wake Lock persistence.
    - `<SubstitutionCopilotDrawer />`: Equipment matrix, regression cards, and 1-tap swap action.
  - Section 4: Reiterate `AGENTS.md` negative constraints: Vertical element ceiling ($\le 3$), single primary CTA, tabular numerals (`tabular-nums`), touch targets $\ge 44 \times 44\text{px}$.

#### 4. `docs/experience/ai-native-spec.md`
- **Action**: Expand intelligent UI registry and purge clinical jargon.
- **Sections to Update**:
  - Section 2: Expand closed component registry to include:
    - `CoachSmartActionCard` (exercise swap, workout condense, load autoregulate)
    - `AgenticRagProgramBuilder` (Spec 011 structured 16-week generator)
    - `SubstitutionCopilot` (Spec 017 OpenGym catalogue matcher)
    - `StructuralBalanceRadar` (Spec 015 Poliquin ratio evaluation)
  - Section 4: Remove clinical medical warning (BMI 16.4 medical advisory) and replace with non-clinical athletic training load-capacity guardrails.
  - Document zero-latency deterministic fallback and in-memory catalogue RAG search (<50ms).

#### 5. `docs/experience/charter.md`
- **Action**: Strategic pivot from "super app" to "Autonomous Biomechanical Engine & Training OS".
- **Sections to Update**:
  - Section 1: Replace WeChat/X "life super app" narrative (and style/clothing/networking pillars) with Vyra: The Autonomous Biomechanical Engine & Training OS.
  - Section 2: Re-anchor product pillars around live production systems: OpenGym biomechanics, 6,554-exercise catalogue, anatomical tension spotlight, intelligent substitution copilot, and offline resilience.
  - Reiterate the three core feeling words: **Calm, Capable, Personal**.
  - Section 2.3: Reiterate anti-goals: zero clinical medical jargon, zero unsegmented monoliths, zero social feeds.

#### 6. `docs/experience/laws.md`
- **Action**: Modernize 12 Core Laws to reflect current architecture and engineering invariants.
- **Sections to Update**:
  - Law 1: Update anchor to `Today`, with specialized workspaces (`Program`, `Exercises`, `Progress`, `Posture`, `You`). Remove `Life` tab.
  - Law 3: Update shared brain to connect Sleep/Fatigue $\leftrightarrow$ Training Volume $\leftrightarrow$ Micronutrient Fueling $\leftrightarrow$ Structural Postural Balance. Remove clothing drape.
  - Law 7: Reaffirm the 5 compound primitives (`Card`, `Checkin`, `Log`, `Insight`, `Plan`).
  - Law 9: Modernize "Earn the Complexity" to focus on progressive training intelligence (1RM $\rightarrow$ Auto-progression $\rightarrow$ Structural balance).
  - Add explicit laws/sub-clauses for Offline-First Invariant and Deterministic Math Guarantees.

#### 7. `docs/experience/pillars.md`
- **Action**: Restructure from speculative 5 life pillars to the 5 real operational engine pillars.
- **Sections to Update**:
  - Replace speculative pillars (Style, Network) with:
    1. **Biomechanical Math & In-Gym Floor Execution** (Specs 001–003, 012, 014)
    2. **Anatomical Tension & Movement Intelligence** (Specs 013, 015, 016)
    3. **Intelligent Autoregulation & Substitution Copilot** (Specs 004, 010, 011, 017)
    4. **Daily Rhythm, Hydration & Supplementation** (Live Supplement Stack Drawer & Readiness Checkin)
    5. **Offline Sync Resilience & Multi-Region Cloud Infrastructure** (Spec 018)
  - Detail how each pillar surfaces on `/today`, `/session`, `/exercises`, `/program`.
  - Detail Coach as the connective intelligence powering `<CoachSmartActionCard />`.

#### 8. `docs/experience/principles.md`
- **Action**: De-duplicate and streamline into 10 Core Principles for the Biomechanical Engine.
- **Sections to Update**:
  - Principle 1: Update navigation and workspaces (eliminate `Life` tab).
  - Principle 3: Eliminate outfit/weather cross-pillar reference.
  - Principle 8: "Earn the Complexity" — lifter starts with basic 5s logging, unlocks auto-progression, deload tracking, and structural balance radar.
  - Principle 10: Replace outfit sharing with PR celebration and verified athletic training milestones.
  - Add principle: Deterministic math guarantees over generative hallucinations.

#### 9. `docs/experience/customer-journey.md`
- **Action**: Align customer stages with live production features and verified progression path.
- **Sections to Update**:
  - Stage 1: Update trigger to CNS fatigue / sleep deprivation, with zero-friction entry to `/today`.
  - Stage 2: Day 0 activation with instant access to today's protocol or catalogue search at `/exercises`.
  - Stage 3: The "Aha!" moment powered by the Adaptive Recalibration Card, `<AnatomicalTensionSpotlight />`, and `<SubstitutionCopilotDrawer />`.
  - Stage 4: 5s set logging with pre-filled history, `<RestIntervalBar />`, and offline queueing.
  - Stage 5: Structural balance radar (`/posture`), longitudinal PR progress (`/progress`), and automatic deload streaks (Spec 014). Remove references to `Life` tab and `Network Room`.

#### 10. `docs/experience/concept-scouting-brief.md`
- **Action**: Sanitize clinical language and append Concepts 6 through 10.
- **Sections to Update**:
  - Concept 4: Replace clinical medical jargon (BMI 16.4 underweight advisory) with athletic conditioning and load-recovery buffering.
  - Append Concepts 6–10:
    - **Concept 6**: OpenGym Biomechanical Math Port & 6,554-Item Exercise Catalogue Indexing (Specs 013, 014, 015) — *Adopted & Verified*.
    - **Concept 7**: Anatomical Tension Spotlight with micro-torso anterior/posterior view and dual kinetic anchors (Spec 016) — *Adopted & Verified*.
    - **Concept 8**: Intelligent Substitution Copilot with equipment matrix and biomechanical regression (Spec 017) — *Adopted & Verified*.
    - **Concept 9**: Offline Sync Resilience with write-ahead IndexedDB queue and optimistic UI (Spec 018) — *Adopted & Verified*.
    - **Concept 10**: Multi-Region Cloud Run Architecture (Doha `me-central1` and US Central `us-central1`) — *Adopted & Verified*.

#### 11. `docs/experience/audit-and-decisions.md`
- **Action**: Update compliance matrix to live navigation and append ADRs for Specs 011–018.
- **Sections to Update**:
  - Section 1: Update navigation references from `Today, Coach, Life, You` to `Today, Program, Exercises, You`.
  - Section 4: Modernize "Before vs After" to reflect the mature biomechanical engine.
  - Append Section 6: "Architectural Decision Records (ADRs) for Specs 011–018":
    - ADR-011: Agentic RAG Program Builder with Zod guardrails.
    - ADR-012: In-Gym Execution with synthetic Web Audio API and WakeLock.
    - ADR-013: 6,554-Exercise OpenGym catalogue ingestion & in-memory caching.
    - ADR-014: Deterministic auto-progression & stall streak deloading.
    - ADR-015: Poliquin/Thibaudeau structural balance radar.
    - ADR-016: Anatomical tension spotlight & kinetic anchor typography.
    - ADR-017: Multi-tier substitution copilot.
    - ADR-018: Offline write-ahead queue with idempotent sync.
  - Document verified test coverage: 289 passing tests across 37 test suites.

---

### 5.2 Strategy Documentation (`docs/strategy/`)

#### 12. `docs/strategy/features-wishlist.md`
- **Action**: Insert "Completed / Live in Production Registry (Specs 001–018)" and structure remaining future horizons (Phases 4–6).
- **Sections to Update**:
  - Add Section 1: **"Completed / Live in Production Registry (Specs 001–018)"**:
    - Comprehensive table detailing all 18 specs: Spec Name, Production Deliverable, Test Suite Verification (289/289 passing tests), and Multi-Region Cloud Run Endpoints (Doha `me-central1` and US Central `us-central1`).
  - Restructure Section 2: **"Remaining Future Horizons"**:
    - **Phase 4: Multi-Device Cloud Sync & Server-Side Auth**: Transitioning IndexedDB offline storage to PostgreSQL/Drizzle with WebAuthn/Passkeys authentication, multi-device synchronization, and conflict resolution.
    - **Phase 5: Automated Biometrics Webhook Ingestion**: Full production pipeline from Apple HealthKit (Health Auto Export) / Whoop / Oura webhooks directly into `/api/webhooks/biometrics` for automated sleep, HRV, and resting heart rate calibration.
    - **Phase 6: DNS A-Record Activation & Branded Distribution**: Pointing `app.vyra.fit` to Anycast IP `136.81.52.191`, SSL cert termination, and PWA distribution across GCC/global markets.
  - Remove completed features from the deprioritized backlog table.

#### 13. `docs/strategy/feature-roi-audit.md`
- **Action**: Incorporate calculated ROI scores for Specs 014–018 and update build scope.
- **Sections to Update**:
  - Section 1: Add Specs 011 through 018 into the Comprehensive Feature Evaluation Matrix:
    - Spec 011 (Agentic RAG Program Builder): ROI **3.20** | 🟢 GREEN / LIVE
    - Spec 012 (In-Gym Execution Readiness): ROI **4.33** | 🟢 GREEN / LIVE
    - Spec 013 (6,554-Exercise Catalogue Browser): ROI **5.67** | 🟢 GREEN / LIVE
    - Spec 014 (Auto-Progression & Deload Engine): ROI **5.33** | 🟢 GREEN / LIVE
    - Spec 015 (Structural Balance Radar): ROI **5.67** | 🟢 GREEN / LIVE
    - Spec 016 (Anatomical Tension Spotlight): ROI **5.67** | 🟢 GREEN / LIVE
    - Spec 017 (Intelligent Substitution Copilot): ROI **4.25** | 🟢 GREEN / LIVE
    - Spec 018 (Offline Sync Resilience): ROI **3.50** | 🟢 GREEN / LIVE
  - Section 3: Update "The Greenlit Core Wedge" to reflect the full live production suite (Specs 001–018).

#### 14. `docs/strategy/launch-positioning.md`
- **Action**: Modernize proof points with 6,554 catalogue, tension spotlight, and multi-region infra.
- **Sections to Update**:
  - Section 1: Update Primary CTA to link explicitly to `/today` and `/exercises`.
  - Section 3: Update Product Proof Matrix to highlight:
    - 6,554 OpenGym catalogue with sub-50ms search.
    - Anatomical Tension Spotlight micro-torso and dual kinetic anchors.
    - Substitution Copilot for zero-delay gym equipment alternatives.
    - Multi-region Cloud Run infrastructure (Doha `me-central1` and US Central `us-central1`).
    - 289 passing unit tests with 100% mathematical integrity.
  - Section 4: Update the 30-Second Reel speedrun script to showcase the Anatomical Tension Spotlight, Plate Calculator, and Rest Timer.

#### 15. `docs/strategy/monetization-blueprint.md`
- **Action**: Update pricing tiers to $0 Starter, $29/mo Autonomous, $129/mo VIP Coach Concierge, aligned with `src/lib/entitlements.ts`.
- **Sections to Update**:
  - Section 2: Replace old $14.99/mo Pro tier with the verified 3-tier structure:
    - **Starter Tier ($0 / Free Forever)**: 5s set logger, 6,554 OpenGym catalogue, plate calculator, offline gym mode.
    - **Autonomous Tier ($29/mo or $249/yr)**: Everything in Starter + Auto-progression/deload engine, Poliquin structural balance radar, adaptive autoregulation, substitution copilot, tension spotlight.
    - **VIP Coach Concierge ($129/mo)**: Everything in Autonomous + human-in-the-loop async coach review, custom 16-week mesocycle curation, bi-weekly form review, priority feature access.
  - Section 3: Update paywall modal copy and trigger sequences to reference the $29/mo Autonomous Tier.
  - Section 4: Document code-level feature gating alignment with `src/lib/entitlements.ts` (`TIER_CAPABILITIES` and `hasEntitlement`).

#### 16. `docs/strategy/customer-journey-map.md`
- **Action**: Enrich customer stages with live biomechanical components and verified retention loops.
- **Sections to Update**:
  - Stage 2 (Activation): Add instant catalogue exploration via `/exercises` and workout preview on `/today`.
  - Stage 3 (Aha Moment): Add `<AnatomicalTensionSpotlight />` (visualizing target vs synergist tension) and `<SubstitutionCopilotDrawer />` (instant machine swap when gym is packed).
  - Stage 4 (Core Habit Loop): Add `<RestIntervalBar />`, synthetic sound chime, and offline write-ahead queueing.
  - Stage 5 (Day 30 Retention): Add Poliquin/Thibaudeau Structural Balance Radar (`/posture`), longitudinal PR tracking (`/progress`), and automatic deload streaks (Spec 014).
  - Ensure zero clinical medical jargon throughout.

---
