# DISPATCH — teamwork_preview_worker_m1

## 2026-10-15T22:31:00Z

## 2026-10-15T22:32:33Z

## Identity
- Archetype: teamwork_preview_worker
- Working Directory: d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_worker_m1
- Parent Conversation ID: a696f69d-facc-4020-9515-79d1de9309d1
- Milestone: M1 — Experience Documentation Overhaul (11 files in `docs/experience/`)

## Exclusive Write Ownership
You own and may ONLY edit these 11 files:
1. `docs/experience/information-architecture.md`
2. `docs/experience/ideal-day-map.md`
3. `docs/experience/render-contract.md`
4. `docs/experience/ai-native-spec.md`
5. `docs/experience/charter.md`
6. `docs/experience/laws.md`
7. `docs/experience/pillars.md`
8. `docs/experience/principles.md`
9. `docs/experience/customer-journey.md`
10. `docs/experience/concept-scouting-brief.md`
11. `docs/experience/audit-and-decisions.md`

STRICT PROHIBITION: Do NOT touch any files in `src/`, `specs/`, `tests/`, `public/`, or `docs/strategy/`. Documentation in `docs/experience/` ONLY.

## Mandatory Inputs to Read First
1. `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_orchestrator_1\PROJECT.md`
3. `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_explorer_survey_2\analysis.md` (contains the exact file-by-file upgrade blueprint and line-by-line findings for each of your 11 files)
4. `d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_spec_miner_survey_1\analysis.md` (Specs 001-018 and production architecture)

## Key Technical Requirements for docs/experience/
- **Routes**: Update to reflect the 24 compiled Next.js routes (18 pages, 6 API routes). Note that `/exercises` is the canonical exercise catalogue, `/library` has a permanent 308 redirect to `/exercises`. Primary trainee tabs in `TraineeNav.tsx` are: `Today (/today)`, `Program (/program)`, `Exercises (/exercises)`, `You (/you)`. Eliminate all legacy statements claiming there is no Program tab or claiming a 4-tab shell of Today/Coach/Life/You.
- **Live UI Primitives**: Fully document live components from `src/components/trainee/`:
  - `<AnatomicalTensionSpotlight />` micro-torso (SVG, Emerald `#10B981` target tension, Cyan `#06B6D4` synergist tension, anterior/posterior micro-segmented toggle, Setup Anchor & Kinetic Drive).
  - `<SubstitutionCopilotDrawer />` (equipment matrix and biomechanical vector matching from 6,554-exercise OpenGym catalogue).
  - `<PlateCalculatorPopover />` (multi-barbell plate calculations: 20kg Olympic, 15kg Women's, Smith 0-15kg).
  - `<RestIntervalBar />` + synthetic Web Audio oscillator chimes (`sound.ts`) + Screen WakeLock API (`wakelock.ts`).
- **AGENTS.md Design Constraints**:
  - Enforce 60-30-10 Obsidian surface hierarchy (`#0B0F17`, `#0F172A`, `bg-slate-900/60`, `border-slate-800`, `text-slate-400`).
  - Tabular numbers (`tabular-nums`).
  - Vertical element ceiling: $\le 3$ elements per vertical card context.
  - Single dominant CTA per viewport.
  - No unsegmented monoliths.
  - ZERO clinical medical jargon (e.g. remove "clinical underweight BMI 16.4" in `ai-native-spec.md` and `concept-scouting-brief.md`; replace with biomechanical/athletic focus on lean mass accrual and postural resilience).
- Remove all obsolete mockup references, outdated route names, or references to deprecated features.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Deliverables
- Fully rewritten/synchronized 11 Markdown files in `docs/experience/`.
- Detailed `handoff.md` in your working directory documenting changes per file, verification method, and git status.
- Call `send_message` to parent (Recipient: `a696f69d-facc-4020-9515-79d1de9309d1`) when complete.
