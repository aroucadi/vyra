# Project: Vyra Documentation Overhaul & Production System Synchronization

## Architecture
- **Next.js 16.3.5 / Turbopack with 24 compiled routes in `src/app/`**:
  - Trainee Experience: `/today`, `/session`, `/program`, `/exercises`, `/posture`, `/progress`, `/you`, `/your-data`, `/profile`
  - Canonical Catalogue: `/exercises` (permanent 308 redirect from `/library`)
  - Trainer / Admin / Auth: `/coach`, `/roster`, `/program/new`, `/program/[id]`, `/trainee/[id]`, `/login`, `/install`
  - API Routes: `/api/events`, `/api/exercises`, `/api/health`, `/api/posture`, `/api/substitutions`, `/api/webhooks/biometrics`
- **Live UI Primitives in `src/components/trainee/`**:
  - `<AnatomicalTensionSpotlight />` micro-torso (Emerald `#10B981` target, Cyan `#06B6D4` synergist, view selector, ⚡ Setup Anchor & 🎯 Kinetic Drive)
  - `<SubstitutionCopilotDrawer />` (equipment matrix & biomechanical vector matching)
  - `<PlateCalculatorPopover />` (Olympic 20kg, Women's 15kg, Smith 0-15kg)
  - `<RestIntervalBar />` + synthetic Web Audio oscillator (`sound.ts`) + Screen WakeLock (`wakelock.ts`)
- **Backend & Cloud Architecture**:
  - Multi-region Cloud Run: Doha (`me-central1`) & US Central (`us-central1`) on port 8080
  - 6,554-exercise catalogue search engine in `src/lib/rag/` (<10ms inverted token index, 40+ shorthands)
  - Biomechanical math suite in `src/lib/training-math/` (`onerm.ts`, `plates.ts`, `progression.ts`, `structural-balance.ts`)
  - Entitlements in `src/lib/entitlements.ts` (Starter $0, Autonomous $29/mo, VIP Coach Concierge $129/mo)
  - Future Horizons: Phase 4 (Cloud Sync & Auth), Phase 5 (Wearable Webhooks), Phase 6 (DNS `app.vyra.fit` -> Anycast `136.81.52.191`)
- **Design System & Negative Constraints (`AGENTS.md`)**:
  - 60-30-10 Obsidian surface hierarchy (`#0B0F17`, `#0F172A`, `bg-slate-900/60`, `border-slate-800`, `text-slate-400`)
  - Tabular numbers (`tabular-nums`)
  - Negative constraints: <=3 elements per vertical card, single primary CTA per viewport, no unsegmented monoliths, zero clinical medical jargon

## Feature Inventory
| # | Feature / Document Scope | Description | Milestone | Source |
|---|--------------------------|-------------|-----------|--------|
| 1 | `docs/experience/information-architecture.md` | Overhaul IA, routes (24 routes), TraineeNav 4 tabs, eliminate legacy 4-tab model | M1 | survey |
| 2 | `docs/experience/ideal-day-map.md` | Align daily journey with live app flow, workout session, plate popover, rest timers | M1 | survey |
| 3 | `docs/experience/render-contract.md` | Document live UI primitives: Tension Spotlight, Copilot Drawer, Plate Popover | M1 | survey |
| 4 | `docs/experience/ai-native-spec.md` | Remove clinical jargon, document Agentic RAG, Copilot Drawer, Coach Smart Cards | M1 | survey |
| 5 | `docs/experience/charter.md` | Align mission with live production capabilities and athletic focus | M1 | survey |
| 6 | `docs/experience/laws.md` | Update UX laws with AGENTS.md negative constraints, <=3 card items, single CTA | M1 | survey |
| 7 | `docs/experience/pillars.md` | Update pillars to reflect live biomechanical engine and current UI architecture | M1 | survey |
| 8 | `docs/experience/principles.md` | Reconcile design principles with 60-30-10 Obsidian tokens and live components | M1 | survey |
| 9 | `docs/experience/customer-journey.md` | Update athlete lifecycle with real screens, `/exercises`, `/session`, `/posture` | M1 | survey |
| 10 | `docs/experience/concept-scouting-brief.md` | Remove medical jargon (Alaa BMI), reflect live 16-week transformation protocol | M1 | survey |
| 11 | `docs/experience/audit-and-decisions.md` | Record architectural decisions for Specs 001-018, 308 redirect, SVG micro-torso | M1 | survey |
| 12 | `docs/strategy/features-wishlist.md` | Move Specs 001-018 to Live Registry (289 tests, Cloud Run), add Phases 4, 5, 6 | M2 | survey |
| 13 | `docs/strategy/feature-roi-audit.md` | Calculate & document ROI scores for Specs 014-018 | M2 | survey |
| 14 | `docs/strategy/launch-positioning.md` | Update product wedge, positioning, competitive moat with 6,554 catalogue | M2 | survey |
| 15 | `docs/strategy/monetization-blueprint.md` | Align pricing with entitlements: Starter $0, Autonomous $29/mo, VIP Concierge $129/mo | M2 | survey |
| 16 | `docs/strategy/customer-journey-map.md` | Update strategic journey with live routes, real conversion points, retention telemetry | M2 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Experience Documentation Overhaul | 11 files in `docs/experience/` | Survey | DONE |
| M2 | Strategy Roadmap & Monetization Overhaul | 5 files in `docs/strategy/` | Survey | DONE |
| M3 | Cross-Document Verification & Forensic Audit | Review, Challenge & Audit across all 16 files | M1, M2 | DONE (GATE PASS) |

## Code Layout & Exclusive Write Ownership
- **Worker 1 (`teamwork_preview_worker_m1`) owns exclusively**:
  - `docs/experience/information-architecture.md`
  - `docs/experience/ideal-day-map.md`
  - `docs/experience/render-contract.md`
  - `docs/experience/ai-native-spec.md`
  - `docs/experience/charter.md`
  - `docs/experience/laws.md`
  - `docs/experience/pillars.md`
  - `docs/experience/principles.md`
  - `docs/experience/customer-journey.md`
  - `docs/experience/concept-scouting-brief.md`
  - `docs/experience/audit-and-decisions.md`
- **Worker 2 (`teamwork_preview_worker_m2`) owns exclusively**:
  - `docs/strategy/features-wishlist.md`
  - `docs/strategy/feature-roi-audit.md`
  - `docs/strategy/launch-positioning.md`
  - `docs/strategy/monetization-blueprint.md`
  - `docs/strategy/customer-journey-map.md`
- **Strict Prohibition**: Zero modification to any files in `src/`, `specs/`, `tests/`, `public/`, or repo root. Documentation only.
