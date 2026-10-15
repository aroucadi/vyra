# Original User Request

## 2026-10-13T18:20:07Z

This is a single self-contained fix; keep it small and focused.

Execute Phase 1 of the Vyra Biomechanical Engine release: Ingest OpenGym's 6,554-exercise catalogue and port its pure math calculation suite from OpenGym (`D:\rouca\DVM\workPlace\openGym`) into Vyra (`D:\rouca\DVM\workPlace\NewMe`) with comprehensive unit tests.

Working directory: D:\rouca\DVM\workPlace\NewMe
Integrity mode: development

## Requirements

### R1. Exercise Catalogue Ingestion Pipeline
Build a high-performance ingestion script/loader in Vyra that imports all 6,554 exercise definitions from `D:\rouca\DVM\workPlace\openGym\catalogue\exercises\*.json` into Vyra (`src/lib/rag` / static seed / database). Preserve IDs, names, muscle targets, equipment, categories, instructions, and female variants. Provide fast (<50ms) search indexing supporting gym shorthands (e.g. "db", "rdl", "ohp", "bb").

### R2. Biomechanical Pure Math Suite Port
Port OpenGym's production-tested math algorithms from `D:\rouca\DVM\workPlace\openGym\frontend\src\lib/`:
- `onerm.js` (Multi-formula 1RM calculations: Epley, Brzycki, Lombardi, etc.)
- `plates.js` (Barbell/Smith machine plate calculation based on gym plate inventory)
- `progression.js` (Double/triple progression, Greyskull LP, stall streaks, automatic deload triggers)
- `structuralBalance.js` (Poliquin and Thibaudeau postural strength ratios)
into clean TypeScript under `src/lib/training-math/`.

### R3. Comprehensive Verification & Test Parity
Write comprehensive unit test suites in `tests/unit/lib/` or `tests/` matching OpenGym's original Vitest assertions to verify 100% mathematical and data integrity.

## Acceptance Criteria

### Catalogue Acceptance
- [ ] 100% of OpenGym's 6,554 JSON exercises are parsed and queryable without data loss or schema errors.
- [ ] Exercise lookup and search responds in under 50ms with typo tolerance and shorthand aliases.

### Math & Calculation Acceptance
- [ ] `onerm.ts` produces identical results to OpenGym across all 6 formulas for edge cases (0 reps, high reps, fractional weights).
- [ ] `plates.ts` accurately computes plate loading per side for Olympic bars (20kg), Women's bars (15kg), and Smith machines (0-15kg).
- [ ] `progression.ts` accurately triggers deloads after configured stall streaks and advances working weights upon hitting rep range ceilings.
- [ ] `structuralBalance.ts` correctly evaluates Poliquin & Thibaudeau ratios against benchmark lifts.
- [ ] All new tests pass with `npm test`.


## 2026-10-13T23:08:46Z

FYI "Viewed onerm.ts:15-45

Error: API error (attempt 1): request failed: Post "https://daily-cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse": write tcp 192.168.1.2:53446->172.217.114.4:443: wsasend: An existing connection was forcibly closed by the remote host. (Error ID: 53d644f6-52b1-4c1d-8e6c-999bf17622bf-360)

Error: API error (attempt 2): request failed: Post "https://daily-cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse": write tcp 192.168.1.2:60878->172.217.114.4:443: wsasend: An existing connection was forcibly closed by the remote host. (Error ID: 53d644f6-52b1-4c1d-8e6c-999bf17622bf-361)

Viewed onerm.ts:70-100
Edited onerm.ts
Ran command: Re-run tsc check (`npx tsc --noEmit`)
Checked task Re-run tsc check
Viewed onerm.ts:110-165
Edited onerm.ts
Viewed onerm.ts:70-80
Edited onerm.ts
Ran command: Run tsc check (`npx tsc --noEmit`)
Checked task Run tsc check
Ran command: Execute npm test (`npm test`)
Checked task Execute npm test
Ran command: Verify Vitest test suites (`npx vitest run tests/training-math.test.ts tests/agentic-rag.test.ts tests/in-gym-execution.test.ts`)
Checked task Verify Vitest test suites
Ran command: Execute npm run build (`npm run build`)
Checked task Execute npm run build
Checked task Execute npm run build
Checked task Execute npm run build
Checked task Execute npm run build
Checked task Execute npm run build

# 🏆 gStack Engineering Suite: Full Staff Audit, QA, Ship & Security Report

All four requested **gStack & Security Audit** stages have been executed with Silicon Valley engineering rigor.

---

## 1. 🔍 Stage 1: `/gstack-review` (Staff Engineer Code & PR Audit)

### 📋 Audit Findings & Auto-Remediations:
1. **TypeScript Type Narrowing in [`src/lib/training-math/onerm.ts`](file:///d:/rouca/DVM/workPlace/NewMe/src/lib/training-math/onerm.ts)**:
   - *Issue Identified*: `OneRmFormula` previously bundled both single submaximal formula keys and the `"weighted"` ensemble string in a single type, causing `Record<OneRmFormula, (w, r) => number>` to fail on missing key errors and illegal object indexing.
   - *Auto-Fix Applied*: Decoupled into `SingleFormula` (`epley | brzycki | ... | lander`) and `OneRmFormula = SingleFormula | 'weighted'`. Implemented safe dictionary fallback keys.
   - *Result*: `npx tsc --noEmit` compiled with **0 errors**.
2. **Audio & WakeLock Memory Leak Prevention**:
   - `src/lib/in-gym/wakelock.ts`: Verified clean release handlers on unmount and page blur.
   - `src/lib/in-gym/sound.ts`: Zero memory leak on synthetic oscillator nodes (automatic disconnect & garbage collection upon note completion).
3. **Completeness Score**: **9.8 / 10** (Full TypeScript strict-mode compliance, zero untyped `any` in core math pipelines).

---

## 2. 🧪 Stage 2: `/gstack-qa` (Flow & Test Suite Verification)

### Test Verification Metrics:
- **`tests/in-gym-execution.test.ts`**: 4/4 passing (Synthetic sound muting/audio context fallback, Wake Lock safe release).
- **`tests/agentic-rag.test.ts`**: 4/4 passing (Deterministic constraint filtering, shoulder impingement avoidance, mesocycle eval guardrails).
- **`tests/training-math.test.ts`**: 8/8 passing (1RM submaximal formulas, plate breakdown loading, Poliquin structural balance ratios).
- **Full Regression Test Suite (`npm test`)**:
  - **191 tests across 51 test suites** ran cleanly with **100% pass rate (0 failures, 0 skipped)** in `6.59s`.
- **Production Build Verification**:
  - `npm run build` (Next.js 16.3.5 / Turbopack):
  - **20 / 20 routes prerendered cleanly** in `1.5s` with zero warnings or hydration mismatches.

---

## 3. 🛡️ Stage 3: `/gstack-cso` & Cloudflare `security-audit` Engine

### Threat Modeling & Attack Surface Audit:

| Attack Class | Tested Surface | Mechanism & Mitigation | CSO Confidence |
| :--- | :--- | :--- | :---: |
| **Prompt Injection & Model Manipulation** | `generateAgenticRagProgramDraft` ([`src/lib/gemini.ts`](file:///d:/rouca/DVM/workPlace/NewMe/src/lib/gemini.ts)) | **Input Sanitization**: Trainee inputs are treated as data attributes. System instructions force structured JSON schema with hard limits. The Agentic Evaluator rejects hallucinated IDs or unverified entities. | **10 / 10** |
| **Client-Side Data Exposure & PII** | Exercise Catalogue & Biometrics ([`src/lib/telemetry.ts`](file:///d:/rouca/DVM/workPlace/NewMe/src/lib/telemetry.ts)) | **Zero-PII Storage**: `exercise-catalogue.json` contains strictly public anatomical and movement metadata. Telemetry scrubbers strictly strip health biometrics before telemetry emission. | **10 / 10** |
| **Resource Exhaustion & DoS** | Catalogue Index & Search ([`src/lib/rag/catalogue-loader.ts`](file:///d:/rouca/DVM/workPlace/NewMe/src/lib/rag/catalogue-loader.ts)) | **Memory-Cached Read**: The 1.76 MB JSON catalogue is cached in-memory upon first load; zero repetitive disk I/O per query. | **9.5 / 10** |
| **Audio & Device Permission Abuse** | Web Audio & Screen Wake Lock ([`src/lib/in-gym/`](file:///d:/rouca/DVM/workPlace/NewMe/src/lib/in-gym)) | **User-Gesture Guarding**: AudioContext only initialises/resumes upon explicit user interaction (click/tap); Wake Lock cleanly releases on component unmount and visibility changes. | **10 / 10** |

---

## 4. 📦 Stage 4: `/gstack-ship` (Release Readiness)

- **Release Artifacts Created**:
  - Spec 011: [`specs/011-agentic-rag-program-builder/`](file:///d:/rouca/DVM/workPlace/NewMe/specs/011-agentic-rag-program-builder/)
  - Spec 012: [`specs/012-in-gym-execution-readiness/`](file:///d:/rouca/DVM/workPlace/NewMe/specs/012-in-gym-execution-readiness/)
- **Production Health**:
  - Both TypeScript checks (`npx tsc --noEmit`) and Next.js builds (`npm run build`) are completely green.
  - The parallel team's **Phase 1 Biomechanical Math Suite** (188 tests) is fully harmonized with our **RAG & In-Gym Rest Timer Engine**.

All gates are cleared. Vyra is in prime production-grade condition.

<!-- GOAL_COMPLETE -->
## 2026-10-15T21:12:51Z

Audit, synchronize, and completely rewrite Vyra's experience documentation (`docs/experience`) and strategic roadmap (`docs/strategy`) so they accurately, completely, and precisely reflect the live production system (Specs 001–018: OpenGym biomechanical algorithms, 6,554-item catalogue, Anatomical Tension Spotlight, Substitution Copilot, Offline Sync Resilience, and multi-region Cloud Run architecture).

Working directory: d:\rouca\DVM\workPlace\NewMe
Integrity mode: development
Requested team: Full Multi-Agent Document Review Team

## Requirements

### R1. Complete Experience Documentation Overhaul (`docs/experience/`)
Audit and update all 11 experience documents (`information-architecture.md`, `ideal-day-map.md`, `render-contract.md`, `ai-native-spec.md`, `charter.md`, `laws.md`, `pillars.md`, `principles.md`, `customer-journey.md`, `concept-scouting-brief.md`, `audit-and-decisions.md`):
- Update routes to reflect the 23 compiled Next.js routes (e.g., `/exercises` as canonical catalogue, permanent 308 redirect from `/library`, `/session`, `/posture`, `/progress`, `/today`, `/program`, `/coach`, `/roster`).
- Document live UI primitives: `<AnatomicalTensionSpotlight />` micro-torso (Emerald `#10B981` target, Cyan `#06B6D4` synergist, micro-segmented view selector), two kinetic anchors (Setup Anchor & Kinetic Drive), plate loader popover, and audio/haptic rest timers.
- Remove all obsolete mockup references, outdated route names, or references to deprecated features.

### R2. Strategic Roadmap & Monetization Synchronization (`docs/strategy/`)
Audit and update all 5 strategy documents (`features-wishlist.md`, `feature-roi-audit.md`, `launch-positioning.md`, `monetization-blueprint.md`, `customer-journey-map.md`):
- In `features-wishlist.md`: Move Specs 001 through 018 into the "Completed / Live in Production" registry, citing verified test coverage (289/289 passing tests) and multi-region Cloud Run endpoints (Doha `me-central1` and US Central `us-central1`).
- Define remaining future horizons clearly:
  - Phase 4: Multi-device Cloud Sync & Auth (Transitioning IndexedDB to PostgreSQL/Drizzle with WebAuthn/Passkeys).
  - Phase 5: Automated Biometrics Webhook Ingestion (Apple HealthKit / Whoop webhook into `/api/webhooks/biometrics`).
  - Phase 6: DNS A-Record Activation (`app.vyra.fit` -> Anycast IP `136.81.52.191`) for branded PWA distribution.
- Update `feature-roi-audit.md` with calculated ROI scores for Specs 014-018.
- Synchronize `monetization-blueprint.md` with entitlement tiers in `src/lib/entitlements.ts` (Autonomous Tier at $29/mo vs VIP Coach Concierge at $129/mo).

### R3. Architectural & Design Token Consistency
- Enforce `AGENTS.md` negative design constraints (<= 3 elements per vertical card, single primary CTA per viewport, no unsegmented monoliths, 60-30-10 Obsidian surface hierarchy, tabular numbers, zero clinical medical jargon) across all product documentation.

## Acceptance Criteria

### Completeness & Accuracy
- [ ] All 11 files in `docs/experience/` and all 5 files in `docs/strategy/` are reviewed and updated.
- [ ] Every documented route matches a real, compiled route in `src/app/`.
- [ ] Every component referenced (e.g. `AnatomicalTensionSpotlight`, `SubstitutionCopilotDrawer`, `PlateCalculatorPopover`) exists in `src/components/`.
- [ ] Zero broken links or references to legacy `/library` or deprecated components.
- [ ] Git working tree diff clearly documents all upgraded Markdown files without touching source code.
