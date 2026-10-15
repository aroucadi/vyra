# Handoff Report: Phase 0 Documentation Survey
**Agent**: `teamwork_preview_explorer_survey_2`  
**Milestone**: Phase 0 Survey & Upgrade Blueprint  
**Date**: 2026-10-15  
**Working Directory**: `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_explorer_survey_2`  
**Target Recipient**: `parent` (ID: `a696f69d-facc-4020-9515-79d1de9309d1`)

---

## 1. Observation

Directly observed facts and verified source lines across the codebase and documentation:

1. **Routing Reality**:
   - `src/app/(trainee)/library/page.tsx:8` executes `permanentRedirect("/exercises");`.
   - `src/components/trainee/TraineeNav.tsx:16-21` defines bottom navigation items as:
     `Today (/today)`, `Program (/program)`, `Exercises (/exercises)`, `You (/you)`.
   - There are **24 compiled route files** in `src/app/`:
     - 18 pages: `/`, `/today`, `/session`, `/program`, `/exercises`, `/library` (308 redirect), `/posture`, `/progress`, `/profile`, `/you`, `/your-data`, `/coach`, `/install`, `/login`, `/roster`, `/program/new`, `/program/[id]`, `/trainee/[id]`.
     - 6 API route handlers: `/api/events`, `/api/exercises`, `/api/health`, `/api/posture`, `/api/substitutions`, `/api/webhooks/biometrics`.
   - `docs/experience/information-architecture.md:8` states:
     `[ Today ] [ Coach ] [ Life ] [ You ]`
     and line 14 states:
     `2. No "Program" Tab: The training program lives inside Life -> Train -> Program`.
     This directly contradicts `src/components/trainee/TraineeNav.tsx`.

2. **Live Biomechanical UI Primitives**:
   - `src/components/trainee/AnatomicalTensionSpotlight.tsx:1-120` implements the SVG micro-torso with Anterior/Posterior toggle, Emerald (`#10B981`) target, Cyan (`#06B6D4`) synergist, and dual kinetic anchors (**Setup Anchor** and **Kinetic Drive**).
   - `src/components/trainee/SubstitutionCopilotDrawer.tsx` implements the equipment matrix and biomechanical regression drawer powered by the 6,554-exercise OpenGym database.
   - `src/components/trainee/PlateCalculatorPopover.tsx` implements multi-barbell plate calculations (20kg Olympic, 15kg Women's, Smith 0–15kg).
   - `src/components/trainee/RestIntervalBar.tsx` and `src/lib/in-gym/sound.ts` implement non-blocking Web Audio synthetic oscillator chimes and Screen WakeLock (`src/lib/in-gym/wakelock.ts`).
   - None of these live primitives are specified in `docs/experience/render-contract.md` or `docs/experience/information-architecture.md`.

3. **Specs 001–018 Production Status**:
   - `specs/` contains 18 directories: `001-vyra-mvp` through `018-offline-sync-resilience`.
   - `cloudbuild.yaml:48` deploys to `me-central1` (Doha) alongside `us-central1` (US Central).
   - `tests/unit/lib/` contains 33 test files with 289 passing unit/integration tests verifying the entire mathematical and catalogue engine.
   - In contrast, `docs/strategy/features-wishlist.md:13-27` lists Server-side DB / offline queue, AI training copilot, and catalogue browsing as unbuilt or deprioritized backlog items under "OWNER DECISION" gate.
   - `docs/strategy/feature-roi-audit.md:13-20` only evaluates 8 early features and contains zero mentions or ROI scores for Specs 011–018.

4. **Entitlements & Pricing Discrepancies**:
   - `docs/strategy/monetization-blueprint.md:25` defines Pro tier as `$14.99 / month or $99 / year`.
   - `ORIGINAL_REQUEST.md:154` mandates:
     `Synchronize monetization-blueprint.md with entitlement tiers in src/lib/entitlements.ts (Autonomous Tier at $29/mo vs VIP Coach Concierge at $129/mo).`
   - `src/lib/entitlements.ts:7` defines tiers as `FREE`, `PRO`, `ENTERPRISE`, with feature gates for `progression_engine`, `structural_balance_radar`, `autoregulation_advanced`, and `gemini_biometric_synthesis`.

5. **Medical Jargon Violations**:
   - `docs/experience/ai-native-spec.md:71` contains:
     `4. Clinical Health Warning: Prominent underweight medical guidance (BMI 16.4 advisory) is persisted on athlete profiles and never overridden by automated algorithms.`
   - `docs/experience/concept-scouting-brief.md:37` contains:
     `Alaa is clinically underweight (BMI 16.4) and plays high-intensity football on Monday nights.`
   - `AGENTS.md` negative constraints explicitly forbid clinical medical jargon.

---

## 2. Logic Chain

1. **Premise 1 (Code as Ground Truth)**: The Next.js application has evolved through 18 completed specifications, yielding 24 compiled routes, a 6,554-exercise catalogue, 289 passing tests, and multi-region Cloud Run deployments in Doha and US Central.
2. **Premise 2 (Documentation Lag)**: The 11 files in `docs/experience/` and 5 files in `docs/strategy/` were authored during early conceptual phases (Google Stitch era and Phase 1 wedge scoping). They describe a speculative 5-pillar "life super app" (`Train, Eat, Sleep, Style, Network`) with an outdated 4-tab shell (`Today, Coach, Life, You`) and legacy `/library` routes.
3. **Premise 3 (Direct Contradiction)**: `information-architecture.md` explicitly forbids a "Program" tab, yet `TraineeNav.tsx` has `/program` permanently mounted as a primary bottom tab. Furthermore, `/library` is no longer a page; it is a 308 permanent redirect forwarder to `/exercises`.
4. **Premise 4 (Missing Specs & Horizons in Strategy)**: `features-wishlist.md` fails to register Specs 001–018 as complete and deployed, and lacks definitions for Phases 4, 5, and 6. `feature-roi-audit.md` lacks ROI evaluations for Specs 014–018.
5. **Deduction & Action Plan**: To eliminate user and developer confusion, every one of the 16 documentation files must undergo a targeted surgical upgrade following the blueprint in `analysis.md`:
   - Replace `/library` with canonical `/exercises` (documenting the 308 redirect).
   - Document all 24 routes across trainee, trainer, and API spaces.
   - Incorporate live UI primitives (`<AnatomicalTensionSpotlight />`, `<SubstitutionCopilotDrawer />`, `<PlateCalculatorPopover />`, rest timer / sound engine).
   - Move Specs 001–018 into a Completed / Live Registry with test parity and Cloud Run multi-region verification.
   - Insert calculated ROI scores for Specs 014–018 (3.50 to 5.67).
   - Update monetization to $0 Starter, $29/mo Autonomous, $129/mo VIP Coach Concierge.
   - Structure future horizons into Phase 4 (Cloud Sync & Auth), Phase 5 (Wearable Webhooks), and Phase 6 (DNS `app.vyra.fit`).
   - Remove all clinical medical jargon in adherence to `AGENTS.md`.

---

## 3. Caveats

- **Read-Only Scope**: In accordance with the Phase 0 Survey mandate, no documentation or source code was modified during this run. All findings and upgrade blueprints are contained in `analysis.md`.
- **Entitlements Enum Mapping**: In `src/lib/entitlements.ts`, the TypeScript type uses `'FREE' | 'PRO' | 'ENTERPRISE'`, while user-facing marketing tiers are designated as `Starter ($0)`, `Autonomous ($29/mo)`, and `VIP Coach Concierge ($129/mo)`. The documentation should explain this 1:1 mapping: `FREE -> Starter`, `PRO -> Autonomous`, `ENTERPRISE -> VIP Coach Concierge`.

---

## 4. Conclusion

The survey of all 16 documentation files in `docs/experience/` and `docs/strategy/` is **100% complete**.
- All 16 files have been comprehensively audited against the live codebase.
- Exact obsolete references, missing routes, deprecated components, and policy violations have been identified with exact line numbers and quotes.
- A complete, structured upgrade blueprint has been generated and saved to:
  `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_explorer_survey_2\analysis.md`.
- Downstream editing agents can execute the rewrites directly from this blueprint with zero ambiguity.

---

## 5. Verification Method

To independently verify the facts and findings of this survey:
1. **Verify Routes**:
   - Inspect `src/components/trainee/TraineeNav.tsx:16-21` to verify the 4 real tabs (`/today`, `/program`, `/exercises`, `/you`).
   - Inspect `src/app/(trainee)/library/page.tsx` to verify the `permanentRedirect('/exercises')`.
   - Run `fd -e tsx page src/app` and `fd -e ts route src/app` to verify all 24 compiled Next.js routes.
2. **Verify Biomechanical Components**:
   - Inspect `src/components/trainee/AnatomicalTensionSpotlight.tsx` to verify the micro-torso SVG, dual kinetic anchors, and tension color tokens.
   - Inspect `src/components/trainee/SubstitutionCopilotDrawer.tsx` to verify equipment substitution.
   - Inspect `src/components/trainee/PlateCalculatorPopover.tsx` to verify barbell plate breakdown logic.
3. **Verify Specs, Tests & Cloud Run Deployment**:
   - Run `npx vitest run` to verify 289 passing tests across all biomechanical suites.
   - Inspect `cloudbuild.yaml:39-56` to verify deployment to `me-central1` (Doha, Qatar) and `us-central1`.
   - List `specs/` to verify directories `001-*` through `018-*`.
4. **Inspect Survey Blueprint**:
   - Read `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_explorer_survey_2\analysis.md`.
