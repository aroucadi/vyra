# VYRA Strategic Roadmap & Specification Registry

> **Document Status**: Production Master Registry & Forward Horizons  
> **Verification Baseline**: Specs 001–019 Verified Live in Production  
> **Test Coverage**: 297/297 Passing Tests Across 85 Test Suites (100% Pass Rate)  
> **Infrastructure**: Multi-Region Cloud Run — Doha (`me-central1`) & US Central (`us-central1`) on Port 8080  

---

## 1. Completed / Live in Production Registry (Specs 001–019)

All 19 core foundational specifications have been designed, implemented, tested, and shipped to live production environments.

| Spec | Exact Title | Core Production Deliverable & Capabilities | Verified Test Coverage | Multi-Region Endpoints |
| :---: | :--- | :--- | :---: | :--- |
| **001** | `001-vyra-mvp` | Trainer↔Trainee periodized program builder (`/program/new`, `/program/[id]`), auto-resolving daily workout schedule (`resolveProgramDay`), active in-gym session logger (`/session`), automated PR detector (`checkIsPersonalRecord`), trainer roster view (`/roster`), role switcher. | 14 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **002** | `002-equipment-matrix-robustness` | 4-Option Equipment Matrix per exercise slot (Machine, Dumbbell, Cable, Bodyweight), per-set modality toggling in `/session`, equipment-isolated PR tracking preventing cross-modality data corruption, dynamic adherence scoring. | 18 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **003** | `003-master-protocol-adaptation` | 16-Week periodized desk-worker transformation protocol, 2:1 pull-to-push postural balance (12 pulling/retraction sets vs 6 pressing sets/week), 3x/week side delt matrix (10 sets total), Thursday Slot 2 Set 4 drop set (~40% weight drop to 0 RIR), 8-milestone nutrient architecture (creatine loading/maintenance, 3,500ml hydration base). | 12 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **004** | `004-ai-feedback-rag-adaptation` | Bi-directional trainee in-session tagging (`Weight/Rep Stall`, `Joint Pain/Impingement`, `Form Breakdown`, `Low Energy`), voice memo transcription, end-of-session debrief (RPE 1–10, Mind-Muscle 1–5, joint flags), 4-layer RAG context assembly, Gemini 3.8 Flash diagnostic dossier, 1-click coach program diff mutation. | 16 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **005** | `005-exercise-confidence-card` | `<ExerciseConfidenceCard />` stealth modal (<100ms render), hardware category classification (`pin_selectorized`, `plate_loaded`, `cable_tower`, `free_weight`, `bodyweight_station`), 2-3 step setup checklist, grip schematics, Rule of 3 setup cues (<7 words + mental metaphor), proprioceptive "Feel It" burn zone, instant equipment quick-swap. | 15 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **006** | `006-vyra-super-app-design` | Unified Daily State Vector linking athletic training, circadian fueling, sleep readiness, and active recovery; Obsidian dark design tokens (`#0B0F17`, `#0F172A`), high-contrast Executive Mobile HUD, live telemetry state display. | 12 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **007** | `007-adaptive-hypertrophy-wedge` | 1-Tap biometric readiness declaration, instant biomechanical volume down-regulation (5–10% load reduction on axial compound lifts to preserve spinal integrity, shifting volume to stable machines), `<AdaptiveRecalibrationCard />`, sub-45s Time-to-Value, sub-5s set logger, non-blocking telemetry event pipeline. | 19 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **008** | `008-apple-health-biometric-webhook` | Secure webhook endpoint `POST /api/webhooks/biometrics`, JSON payload ingestion from iOS Shortcuts / Health Auto Export, sleep architecture parsing (`sleepHours`, `deepSleepMinutes`), ANS tracking (`hrvMs`), cardiovascular rest (`restingHeartRateBpm`), active energy (`activeEnergyBurnedKcal`), zero-tap workout recalibration. | 11 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **009** | `009-apple-watch-native-ecosystem` | Multi-wearable aggregator mesh schema (Apple Watch, Whoop 4.0, Oura Ring Gen 3, Garmin Connect) via normalized data layer; live intra-workout recovery tracking (heart rate > 135 bpm extending rest timers by 30s; systemic fatigue cut-off pruning accessory sets). | 10 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **010** | `010-coach-smart-action-cards` | Interactive Coach interface (`/coach`), `<CoachSmartActionCard />` adhering to 3-element card ceiling; live store mutations: `swapExerciseInActiveProgram()`, `condenseActiveProgramDay()` (30–40 min cap), `recalibrateActiveProgramLoads()`; biometric & program-aware intent resolver (`coach-engine.ts`). | 14 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **011** | `011-agentic-rag-program-builder` | Agentic RAG program generator (`/program/new`), deterministic pre-retrieval filtering (equipment mask, joint impingement safety bounds), hybrid vector + BM25 keyword matching, agentic evaluation loop with self-correction (RP Hypertrophy landmarks MEV–MRV 10–20 sets, Poliquin/ATG balance), deterministic local fallback. | 18 Unit Tests + 4 Vitest Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **012** | `012-in-gym-execution-readiness` | In-gym active execution floor (`/session`), automatic rest interval countdown timer (`<RestIntervalBar />`), dual-tone synthesized Web Audio chimes (`sound.ts`, `rest-alert.ts`), Screen Wake Lock API integration (`wakelock.ts`) to prevent screen dimming during 2–3 min rest intervals with safe blur/unmount cleanup, ghost text pre-fill of previous session logs. | 16 Unit Tests + 4 Vitest Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **013** | `013-exercise-catalogue-browser` | Full visual browsing UI at `/exercises` (with 308 permanent redirect from `/library`), 6,554-exercise OpenGym database ingested into memory-cached index (`public/data/exercise-catalogue.json`), sub-10ms query execution, 40+ gym shorthands (`db`, `bb`, `rdl`, `ohp`, `sm`, `abs`), Damerau-Levenshtein typo tolerance, slide-up `<ExerciseDetailSheet />`. | 20 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **014** | `014-auto-progression-deload` | Mathematical progression engine (`src/lib/training-math/progression.ts`): double progression, triple progression, Greyskull LP, linear progression; stall streak counter (3 consecutive misses triggers 10% Epley reset deload), workout summary prescription cards (`<OverloadPrescriptionCard />`), in-session overload target badge, entitlement gating (`'progression_engine'`). | 22 Unit Tests + 8 Vitest Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **015** | `015-structural-balance-radar` | Postural architecture dashboard at `/posture`, Poliquin (Close-grip bench anchor, Incline 91%, Dips 117%, Squat anchor, Front Squat 85%, Deadlift 125%), Thibaudeau Powerlifting, and ATG benchmark ratio templates, polygonal SVG radar (`<StructuralBalanceRadar />`) with Balanced/Borderline/Weak bands, `<IntelligentPostureDiagnosis />`, 1-tap corrective protocol injection, entitlement gating (`'structural_balance_radar'`). | 21 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **016** | `016-anatomical-tension-spotlight` | Interactive SVG micro-silhouette `<AnatomicalTensionSpotlight />` (Emerald `#10B981` target tension, Cyan `#06B6D4` synergist tension, 0ms render latency, zero WebGL/canvas dependency), Anterior/Posterior micro-segmented selector, two kinetic anchors (⚡ **Setup Anchor** and 🎯 **Kinetic Drive**), 3 segmented tabs (Coach Focus, Full Protocol, Direct Swaps), `<PlateCalculatorPopover />` integration. | 18 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **017** | `017-intelligent-substitution-copilot` | 1-Tap substitution drawer (`<SubstitutionCopilotDrawer />`) in `/session` and `/exercises`, muscular subdivision matching (clavicular vs sternal vs costal pec, iliac lat vs rhomboids, lengthened vs shortened quads, hip hinge vs knee flexion hamstrings), resistance curve alignment (lengthened, shortened, constant, ascending), instant coach biomechanical rationale card, 1-tap active workout session mutation with weight/plate target recalculation. | 19 Unit Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **018** | `018-offline-sync-resilience` | Protocol A: Instant set-level draft journaling (`<2ms`, IndexedDB / `localStorage`, 4-hour window auto-restore on reload), Protocol B: Replay mutation sync queue (`mutation_queue`) with exponential backoff (`2^attempts * 1000ms`) and jitter, online/focus trigger drain, Protocol C: Full offline catalogue index & Service Worker precache (`public/sw.js` precaching `/exercises` and `/data/exercise-catalogue.json`), CSO / STRIDE threat model hardening. | 16 Unit Tests + 5 Mobile QA Walkthrough Tests | `us-central1:8080`<br/>`me-central1:8080` |
| **019** | `019-day-zero-trust-onboarding` | **Couch-to-Rack Day-0 Onboarding Architecture**: Zero-gate Day-1 workout hero on `/today` (suppressing supplements, hydration, and rest-day templates until Session 1 is logged), 1-Anchor Poliquin Starting Weight Calibrator (`<150ms` derivation across all Day-1 exercises + `"Calibrate as I lift"` fallback), interactive `"Why {weight} kg?"` formula breakdown with reversible Sleep What-If chips (`7.5h Full` vs `5h Short [-10% load]`), `"Not at the gym yet? Get ready"` sheet with In-App WebView handoff (`?anchor=80x8&unit=kg`), verified `● Offline-ready` precache check, free `<AnatomicalTensionSpotlight />` entitlement, and `[ Use in Day 1 Session ]` catalogue handoff. | 8 Unit Tests (24 Assertions) | `us-central1:8080`<br/>`me-central1:8080` |

### Production Test Verification Summary
- **Node:Test Standard Unit Test Suites**: 276 / 276 tests passing across 81 test suites.
- **Mobile Walkthrough Integration Suite**: 5 / 5 tests passing (`tests/qa-in-gym-mobile-walkthrough.test.ts`).
- **Vitest Specialized Engine Suites**: 16 / 16 tests passing across 3 test suites (`tests/training-math.test.ts`, `tests/agentic-rag.test.ts`, `tests/in-gym-execution.test.ts`).
- **Grand Total**: **297 / 297 passing tests across 85 test suites (100% pass rate, 0 failures, 0 skipped)**.

---

## 2. Onboarding & Cold-Start Trust Roadmap (Spec 019 Live + MVP-Police-Deferred Specs 020–023)

To ensure zero onboarding or growth capabilities flagged by the `mvp-police` and `founder-operating-system` audits are lost, all deferred onboarding features are formally sequenced into dedicated sub-horizons tied to their prerequisite infrastructure phases:

```
+-------------------------------------------------------------------------------------------------------------+
| ONBOARDING & TRUST EVOLUTION ROADMAP (SPECS 019 -> 023)                                                     |
+------------------------+------------------------+------------------------+----------------------------------+
| NOW: SPEC 019 (LIVE)   | PHASE 4B/4C: SPECS     | PHASE 5B: SPEC 022     | PHASE 6B: SPEC 023               |
| Couch-to-Rack Proxy    | 020 & 021              | Source-Aware Deep Link | B2B2C Trainer-Invite Flow        |
| 1-Anchor Poliquin Math | CSV/AI Log Importer +  | Reel Clip Matching &   | /invite/[coachId] Pre-Calibrated |
| "Why {weight}?" Proof  | Post-Session 1 Passkey | Inbound Lift Hero Swap | Mesocycle & Load Handoff         |
+------------------------+------------------------+------------------------+----------------------------------+
```

| Spec | Target Horizon | Feature Title | Scope & Technical Architecture | Why Deferred by MVP Police (Unblocking Gate) |
| :---: | :---: | :--- | :--- | :--- |
| **019** | **Phase 3 (Active / Live)** | `019-day-zero-trust-onboarding` | **Zero-Gate Day-0 Onboarding & Trust Calibration**:<br/>1. **Day-0 Isolation (`isDayZero`)**: Hides supplements, hydration, and rest-day defaults on `/today`; always surfaces Day 1 Workout Hero with `<AnatomicalTensionSpotlight />`.<br/>2. **1-Anchor Poliquin Calibration**: 1 compound lift input (`Weight × Reps` + `kg/lb` toggle) derives all Day-1 loads in `<150ms` via Epley + Poliquin ratios, with `"Not sure? Calibrate as I lift"` fallback.<br/>3. **Interactive Trust Proof**: Tappable `"Why {weight} kg?"` formula breakdown + reversible Sleep What-If toggle (`7.5h Full` vs `5h Short [-10% load]`).<br/>4. **Gym-Ready Sheet & WebView Escape**: Detects Instagram/Reddit/TikTok WebViews (`Open in Safari/Chrome` preserving `?anchor=` state) and verifies Service Worker precache (`● Offline-ready`). | **Approved Immediately (ROI 7.60)**: Solves cold-start trust, Day-0 cognitive overload, and in-app browser eviction with zero backend dependencies. |
| **020** | **Phase 4B** | `020-historical-log-importer` | **Historical Workout & Program Importer (Hevy / Strong / Fitbod CSV + AI Table Paste)**:<br/>1. **Deterministic CSV Parser**: Drag-and-drop or file-pick `.csv` exports from Hevy, Strong, or Fitbod to automatically seed historical `WorkoutSession` logs, PRs, and 1RM baselines.<br/>2. **AI Vision / Paste Table Importer**: Paste raw text or screenshot of an existing spreadsheet program; model proposes a structured lift table and user confirms every number before saving. | **Deferred by MVP Police until Phase 4B**: Building a multi-format CSV/AI parser before validating cold-start Day-1 session completion via 1-Anchor Calibration (Spec 019) is premature engineering. Unblocks once Day-1 completion exceeds 35%. |
| **021** | **Phase 4C** | `021-post-session-passkey-handoff` | **Post-Session 1 Passkey Account Save & Cloud Sync Handoff**:<br/>1. **Zero Pre-Session Auth Gate**: Never ask for email or Passkey before Session 1.<br/>2. **Value-Earned Account Prompt**: On the Session 1 Summary Card (after first PR/loads are learned), present a 1-tap `"Back up my workouts with Passkey (FaceID/TouchID)"` sheet that binds the local IndexedDB `userId` to PostgreSQL (`src/db/schema.ts`). | **Deferred by MVP Police until Phase 4C**: Requires server-side PostgreSQL + Drizzle ORM + WebAuthn relying party setup (`Phase 4`). Until Phase 4 ships, `/your-data` JSON export + `"Saved on this phone"` provides honest local persistence. |
| **022** | **Phase 5B** | `022-source-aware-deep-link-entry` | **Source-Aware Entry & Deep-Link Reel Attribution**:<br/>1. **Inbound Clip Matching**: Reads `?lift=incline_db_press&source=reel_spotlight` so the very first card on `/today` highlights the exact movement and `<AnatomicalTensionSpotlight />` torso from the social clip.<br/>2. **Multi-Variant Attribution Telemetry**: Tracks conversion from specific spotlight clips to first logged set without cookies or PII. | **Deferred by MVP Police until Phase 5B**: Spec 019 already provides `[ Use in Day 1 Session ]` from `/exercises` and `?anchor=` query hydration. Full inbound campaign deep-link routing unblocks when paid/organic social clip volume scales (>500 weekly inbound taps). |
| **023** | **Phase 6B** | `023-trainer-invite-onboarding` | **B2B2C Trainer-Invite Zero-Calibration Onboarding (`/invite/[coachId]`)**:<br/>1. **Pre-Calibrated Client Link**: Coaches on `/roster` generate a signed invite link containing the trainee's custom 16-week mesocycle and pre-assigned starting loads.<br/>2. **Zero-Input Landing**: Trainee opens link and lands directly on Step 3 (`Check one number`) with their coach's avatar, custom loads pre-filled, and 1-tap `Start Day 1 Session`. | **Deferred by MVP Police until Phase 6B**: Requires multi-device cloud database sync (`Phase 4`) and branded custom domain (`app.vyra.fit` in `Phase 6`) so trainer invite links resolve cross-device. |

---

## 3. Core Infrastructure Horizons (Phases 4–6)

With the core single-device, offline-first Biomechanical Engine and Spec 019 Day-0 Onboarding validated in production, infrastructure scaling follows three disciplined horizons:

```
+---------------------------------------------------------------------------------------------------+
| HORIZON ROADMAP OVERVIEW                                                                          |
+------------------------------------+------------------------------------+-------------------------+
| PHASE 4: CLOUD SYNC & AUTH         | PHASE 5: WEARABLE WEBHOOKS         | PHASE 6: BRANDED PWA    |
| Multi-Device Cloud Sync & Postgres | Automated Passive Biometrics       | DNS A-Record Activation |
| WebAuthn / Passkeys + Specs 020/21 | Apple HealthKit + Spec 022         | app.vyra.fit + Spec 023 |
+------------------------------------+------------------------------------+-------------------------+
```

### Phase 4: Multi-Device Cloud Sync, Authentication & Specs 020–021

- **Objective**: Expand Vyra from a single-device, client-centric IndexedDB application to an authenticated, multi-device cloud-synchronized ecosystem without compromising offline gym reliability, while unlocking **Spec 020 (Historical Log Importer)** and **Spec 021 (Post-Session 1 Passkey Handoff)**.
- **Components & Technical Architecture**:
  1. **Server-Side PostgreSQL Database with Drizzle ORM**:
     - Database schema prepared and typed in `src/db/schema.ts` (`drizzle-orm` and `pg` installed).
     - Relational tables: `users`, `programs`, `program_days`, `exercise_blocks`, `exercises`, `set_logs`, `biometric_snapshots`, `sync_checkpoints`.
  2. **Passwordless WebAuthn & Passkey Authentication (Spec 021)**:
     - Triggered exclusively *after* Session 1 completion (never as a Day-0 signup wall).
     - Modern biometric authentication (FaceID, TouchID, Windows Hello) via FIDO2 / WebAuthn protocols.
     - Fallback: Email magic links issuing `httpOnly`, `Secure`, `SameSite=Strict` session cookies validated via Next.js middleware.
  3. **Two-Way Idempotent Synchronization Engine & Historical Importer (Spec 020)**:
     - Retains client-side IndexedDB as the primary write-ahead cache (`<2ms` set logging).
     - Deterministic CSV importer for Hevy/Strong/Fitbod logs + AI structured table confirmation.
     - Last-Write-Wins (LWW) conflict resolution with vector clocks and sync checkpoints.

---

### Phase 5: Automated Biometrics Webhook Ingestion & Spec 022

- **Objective**: Automate the readiness calculation by replacing manual check-in prompts with passive, high-fidelity physiological telemetry streams, and ship **Spec 022 (Source-Aware Deep-Link Entry)**.
- **Components & Technical Architecture**:
  1. **Wearable Ingestion Pipeline**:
     - Production webhook endpoint: `POST /api/webhooks/biometrics` (established in Spec 008).
     - Ingestion drivers for Apple HealthKit (via iOS Shortcuts / Health Auto Export webhook), Whoop 4.0 API (Recovery, Strain, Sleep), and Oura Ring Gen 3 (Daily Readiness, Sleep Stages, rMSSD).
     - Payload verification: Cryptographic HMAC signature validation (`X-Vyra-Signature`) and payload schema validation via Zod.
  2. **Physiological Signal Normalization**:
     - Extracts sleep architecture (`sleepHours`, `deepSleepMinutes`), autonomic nervous system balance (`hrvMs` / rMSSD), cardiovascular baseline (`restingHeartRateBpm`), and previous day active expenditure (`activeEnergyBurnedKcal`).
     - Normalizes disparate metrics into a unified 0–100 Biomechanical Readiness Index.
  3. **Source-Aware Inbound Deep-Link Routing (Spec 022)**:
     - Matches inbound social reel query params (`?lift=...&source=...`) to dynamically swap the Day-0 Spotlight hero lift to the exact clip the user tapped.

---

### Phase 6: DNS A-Record Activation, Branded Distribution & Spec 023

- **Objective**: Launch branded, zero-friction global distribution of Vyra as an elite Progressive Web Application (PWA) at `app.vyra.fit` and unlock **Spec 023 (B2B2C Trainer-Invite Onboarding)**.
- **Components & Technical Architecture**:
  1. **DNS & Anycast Edge Routing**:
     - Configure DNS A-Record: `app.vyra.fit` pointing to Anycast IP `136.81.52.191`.
     - Cloud Run custom domain mapping with automated TLS 1.3 / SSL certificate provisioning and renewal.
     - Geo-DNS routing requests to the nearest edge: Doha (`me-central1`) for GCC/Middle East trainees (<20ms latency) and US Central (`us-central1`) for North American trainees.
  2. **App Store Bypass & Gym-Ready PWA Installation**:
     - Zero 30% App Store revenue tax; zero arbitrary App Store review delays.
     - Contextual installation prompt integrated directly into the Day-0 `"Not at the gym yet? Get ready"` sheet (Spec 019) and `/install`.
  3. **B2B2C Trainer-Invite Onboarding (`/invite/[coachId]` — Spec 023)**:
     - Allows coaches on `/roster` to send pre-calibrated mesocycle links that bypass cold-start calibration entirely.

---

## 4. Exploratory & Architectural Backlog

Features reserved for exploration after validation of Phases 4 through 6:

| Domain | Feature Area | Strategic Rationale | Re-opening Gate | Est. Complexity |
| :--- | :--- | :--- | :--- | :---: |
| **Onboarding** | Spec 020: Hevy/Strong CSV & AI Log Importer | Eliminates switching cost for lifters with 2–7 years of historical logs. | Phase 4B (Post-Spec 019 Validation) | Medium |
| **Onboarding** | Spec 021: Post-Session 1 Passkey Cloud Save | Converts local IndexedDB state into a persistent multi-device cloud account after first value. | Phase 4C (Postgres + WebAuthn Live) | Medium |
| **Onboarding** | Spec 022: Source-Aware Deep-Link Entry | Guarantees 1:1 visual message match between specific social reel clips and Day-0 Hero Lift 1. | Phase 5B (>500 Weekly Clip Taps) | Low |
| **Onboarding** | Spec 023: B2B2C Trainer-Invite Flow | Enables VIP coaches to onboard clients with pre-loaded weights in zero taps. | Phase 6B (`app.vyra.fit` + Cloud Sync) | Medium |
| **Localization** | Ramadan & Fasting Protocol | Shifts training, hydration loading, and nutrient milestones to Suhoor/Iftar windows for GCC athletes. | Owner Gate | Medium |
| **Monetization** | GCC Local Payment Gateways | Local debit schemes (Mada, KNET, NAPS, Apple Pay) via regional payment orchestration. | Phase 4 Complete | Medium |
| **Hardware** | Native Taptic Haptics | True hardware-level Taptic pulses for rest alerts via Capacitor `@capacitor/haptics`. | Standalone App Wrap | Low |
| **Hardware** | iOS Live Activities | Dynamic Island and Lock Screen countdown widget for active rest intervals. | Standalone App Wrap | Medium |
| **Analytics** | Longitudinal Posture Tracking | Comparative polygonal radar progression tracking scapular balance over 24+ weeks. | 1,000 Active Mesocycles | Medium |

---

## 4. Strict Non-Negotiable Boundaries

To maintain software integrity and eliminate regulatory liability, Vyra operates under strict architectural boundaries:

1. **Pure Athletic Scope**: Vyra is exclusively an athletic progression, biomechanical overload, and strength training engine. It is never a clinical diagnostic or medical tool.
2. **Zero Clinical Medical Jargon**: All diagnostic and coaching copy must use athletic load-capacity, joint preservation, and neuromuscular recovery terminology. Clinical labels, pathology codes, and medical advisories are strictly prohibited per `AGENTS.md`.
3. **Deterministic Math Over LLM Hallucination**: Core calculations (1RM estimates, plate loading, progressive overload increments, stall streak deloads, and Poliquin structural balance ratios) are executed by deterministic TypeScript algorithms, never generative text models.
4. **Offline Floor Invariant**: The trainee must never be blocked from logging a set, viewing their workout sheet, calculating plates, or inspecting kinetic anchors due to a spotty gym basement cellular connection.
