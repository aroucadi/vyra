## 2026-10-13T18:22:30Z

You are teamwork_preview_swe.
Your working directory is: d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_swe_1
The project workspace root is: d:\rouca\DVM\workPlace\NewMe
The user request is recorded in: d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\ORIGINAL_REQUEST.md

Task Details:
Execute Phase 1 of the Vyra Biomechanical Engine release: Ingest OpenGym's 6,554-exercise catalogue and port its pure math calculation suite from OpenGym (`D:\rouca\DVM\workPlace\openGym`) into Vyra (`D:\rouca\DVM\workPlace\NewMe`) with comprehensive unit tests.

Integrity mode: development

Requirements:
R1. Exercise Catalogue Ingestion Pipeline
Build a high-performance ingestion script/loader in Vyra that imports all 6,554 exercise definitions from `D:\rouca\DVM\workPlace\openGym\catalogue\exercises\*.json` into Vyra (`src/lib/rag` / static seed / database). Preserve IDs, names, muscle targets, equipment, categories, instructions, and female variants. Provide fast (<50ms) search indexing supporting gym shorthands (e.g. "db", "rdl", "ohp", "bb").

R2. Biomechanical Pure Math Suite Port
Port OpenGym's production-tested math algorithms from `D:\rouca\DVM\workPlace\openGym\frontend\src\lib/`:
- `onerm.js` (Multi-formula 1RM calculations: Epley, Brzycki, Lombardi, etc.)
- `plates.js` (Barbell/Smith machine plate calculation based on gym plate inventory)
- `progression.js` (Double/triple progression, Greyskull LP, stall streaks, automatic deload triggers)
- `structuralBalance.js` (Poliquin and Thibaudeau postural strength ratios)
into clean TypeScript under `src/lib/training-math/`.

R3. Comprehensive Verification & Test Parity
Write comprehensive unit test suites in `tests/unit/lib/` or `tests/` matching OpenGym's original Vitest assertions to verify 100% mathematical and data integrity.

Acceptance Criteria:
- 100% of OpenGym's 6,554 JSON exercises are parsed and queryable without data loss or schema errors.
- Exercise lookup and search responds in under 50ms with typo tolerance and shorthand aliases.
- `onerm.ts` produces identical results to OpenGym across all 6 formulas for edge cases (0 reps, high reps, fractional weights).
- `plates.ts` accurately computes plate loading per side for Olympic bars (20kg), Women's bars (15kg), and Smith machines (0-15kg).
- `progression.ts` accurately triggers deloads after configured stall streaks and advances working weights upon hitting rep range ceilings.
- `structuralBalance.ts` correctly evaluates Poliquin & Thibaudeau ratios against benchmark lifts.
- All new tests pass with `npm test`.

Maintain your BRIEFING.md and progress.md in your working directory (`d:\rouca\DVM\workPlace\NewMe\.agents\teamwork\teamwork_preview_swe_1\`).
When complete, send your completion report and handoff back.
