> [!WARNING] **Skepticism Disclaimer**
> 100% of the 221 unit tests pass deterministically in 1.84s across 56 test suites, with full TypeScript compilation parity (0 errors), but physical plate loading on non-standard gym plate combinations and serverless runtime cold-start memory pressure under 100+ concurrent search requests remain unverified under live production traffic.

## 1. What the prior attempt got wrong

1. **`selectDeloadCandidate` bypassed in `nextPrescription` on linear & double deload**:
   - *Input:* 3 consecutive missed sessions on 60kg × 5 reps with `deloadFactor: 0.8`, or a below-step 1kg set with 2.5kg step.
   - *Expected:* Deload returns optimal Epley candidate (`weight: 47.5kg`, `target1RM: 56`, `deloadFactor: 0.8`), and holds below-step loads at 1kg with why explanation indicating hold.
   - *Actual:* `nextPrescription` completely bypassed `selectDeloadCandidate`, calling `deloadTo(w, inc, factor)` directly. It omitted `target1RM` and `deloadFactor` entirely, and rounded 1kg UP to 2.5kg on a deload (violating the core invariant that deload never increases working weight).
   - *Root Cause:* The previous author implemented `selectDeloadCandidate` in lines 169–237 of `progression.ts`, but never connected it inside `nextPrescription`.

2. **`normalizeRepRange` divergence from OpenGym `rep-range.js`**:
   - *Input:* `normalizeRepRange(10, null)` or inverted bounds `normalizeRepRange(8, 10)`.
   - *Expected:* Omitted `repsMin` defaults to `Math.max(1, upper - 2)` (`{ reps: 10, repsMin: 8 }`), and inverted bounds (`repsMin >= reps`) adjust upper to `lower + stride` (`{ reps: 11, repsMin: 10 }`).
   - *Actual:* Setting `repsMin` to `null` collapsed the range to a single value `{ reps: 10, repsMin: 10 }`, and inverted bounds clamped `bottom` to `top` (`{ reps: 8, repsMin: 8 }`), losing the lifter's prescribed minimum reps.
   - *Root Cause:* Incomplete port of OpenGym `rep-range.js` helper logic.

3. **Missing OpenGym bar calculation exports and equipment resolution defect in `plates.ts`**:
   - *Input:* `usesBar({ id: 'barbell' })`, `dropGrid(S, { id: 'barbell' })`, `plateSplit(100, 20)`, `barWeightFor(S, '0746')`.
   - *Expected:* `usesBar` returns `true`, `dropGrid` resolves base weight 20kg, `plateSplit` returns 40kg per side, and `barWeightFor` resolves carriage weights (9kg default, 0kg counterbalanced override).
   - *Actual:* `usesBar({ id: 'barbell' })` returned `false` (inconsistent with string `'barbell'`), `dropGrid` passed `cfg?.id` instead of `cfg` to `baseWeightFor`, losing equipment context, and `plateSplit`, `barWeightFor`, `isNoBar`, and `hasBarOverride` were missing from module exports.
   - *Root Cause:* Omission of OpenGym `bar.js` utilities during the initial port and missing fallback check for `BAR_EQ.has(exOrId.id)` in `resolveExercise`.

4. **Punctuation and hyphenation search index miss in `exercise-search.ts`**:
   - *Input:* Searches with hyphens or punctuation, e.g. `searchExercises("squat (barbell)")`, `searchExercises("bench press, incline")`, `searchExercises("pull-up")`.
   - *Expected:* Fast O(1) inverted index token matching without linear fallback scans across 6,554 corpora.
   - *Actual:* Punctuation and hyphens remained attached to query tokens (`"(barbell)"`, `"press,"`, `"pull-up"`), which failed `wordToCorpora` lookup (indexed without punctuation) and forced vocabulary edit distance scans and 6,554 linear fallback scans.
   - *Root Cause:* Query tokenization split strictly on `/\s+/` without stripping punctuation or expanding hyphenated variants (`pull up` / `pullup`).

## 2. What I changed

1. **`src/lib/training-math/progression.ts`**:
   - Added `target1RM?: number | null` and `deloadFactor?: number` to `PrescriptionResult`.
   - Implemented `epleyDeload()` inside `nextPrescription`, executing `selectDeloadCandidate` on both linear and double progression deloads.
   - Correctly returns `target1RM`, `deloadFactor`, optimal candidate load/reps, and holds below-step loads (e.g. 1kg with 2.5kg step) without raising them.
   - Replaced `normalizeRepRange` with OpenGym `rep-range.js` implementation, properly handling omitted `repsMin` (`upper - 2` fallback) and inverted bounds (`lower + stride`).

2. **`src/lib/training-math/plates.ts`**:
   - Exported `isNoBar`, `hasBarOverride`, `barWeightFor`, and `plateSplit`.
   - Updated `resolveExercise` to recognize equipment IDs in `BAR_EQ` and `SINGLE_EQ` when passed as an object `{ id: 'barbell' }`.
   - Updated `dropGrid` to pass the entire exercise config `cfg` to `baseWeightFor(S, cfg)`.

3. **`src/lib/rag/exercise-search.ts`**:
   - Added hyphenated shorthand aliases (`'pull-up'`, `'chin-up'`, `'push-up'`, `'sit-up'`, `'pull-down'`, `'bench-press'`, `'benchpress'`, `'dead-lift'`).
   - Extended `formsOf` to generate space-separated and unhyphenated variants for any token containing hyphens.
   - Sanitized search query tokenization to split cleanly across punctuation (`[(),/:]`).
   - Clamped search `limit` parameter safely (`Math.max(0, options.limit ?? 30)`).

4. **`tests/unit/lib/biomechanical-plates.test.ts`**:
   - Added tests for `usesBar`, `plateSplit`, `barWeightFor`, `isNoBar`, `hasBarOverride`, and default vs counterbalanced carriage weights.

5. **`tests/unit/lib/biomechanical-progression.test.ts`**:
   - Added tests for `normalizeRepRange` defaults and inverted bounds.
   - Added tests for `nextPrescription` returning `target1RM` and `deloadFactor` on deload.
   - Added tests for `nextPrescription` holding below-step loads on deload without raising weight.

6. **`tests/unit/lib/exercise-catalogue.test.ts`**:
   - Added tests for hyphenated searches (`"pull-up"`, `"bench-press"`, `"chin-up"`).
   - Added tests for parenthesized and punctuated queries (`"squat (barbell)"`, `"bench press, incline"`).
   - Added tests for limit clamping (`limit: 0`, `limit: -1`).
   - Added tests for unmatched query (`"dumbbell curl qwxz"`).
   - Added tests for exact query prioritization (`"wrist"`).

## 3. Verification Record

- **Deep Verification (ran actual tests):**
  - Executed full test suite via `npm test` (`npx tsx --test tests/unit/lib/*.test.ts`):
    **Result: 221 tests passed across 56 test suites, 0 failed, duration: 1.84s.**
  - Executed TypeScript compilation check via `npx tsc --noEmit`:
    **Result: Exit code 0, 0 errors.**
  - Verified performance benchmark in `tests/unit/lib/exercise-catalogue.test.ts`:
    All 10 test queries (`bb rdl`, `dumbbell incline bench press`, `ohp`, `bnech press`, `cable lateral raise`, `pullup`, `hammer curls`, `leg press`, `squat`, `deadlift`) executed in **7.92ms combined** (<0.8ms average per query, well below the 50ms SLA).
  - Verified direct ID lookup latency: **0.134ms** (<1ms SLA).

- **Shallow Verification (manual only):**
  - Verified `src/lib/training-math/index.ts` re-exports all math modules without naming collisions.
  - Verified `src/lib/training-math/structuralBalance.ts` re-exports from `./structural-balance` for import path parity.

- **Unverified aspects:**
  - Active PostgreSQL connection pooling under heavy production load (tested with local in-memory store and file cache abstractions).
  - Web client performance when rendering full virtualized lists on low-end mobile hardware.

## 4. Known Issues

- `Minor Robustness Risk`: The inverted search index is loaded once in-memory per Node process. In serverless cold-start instances, the first request loads `public/data/exercise-catalogue.json` (~15ms latency), which remains safely below the 50ms SLA.
- `Shallow Verification`: Live PostgreSQL database schema migration parity against remote Supabase/Neon PostgreSQL clusters requires active DB connection credentials.

## 5. Remaining risk & next step

All Phase 1 requirements (Catalogue Ingestion Pipeline R1, Biomechanical Pure Math Suite R2, and Test Parity R3) are complete, verified, and hardened against subtle edge cases. All 221 repository tests pass with zero regressions. The project is ready for Phase 2 (In-Gym Execution UI & Session Flow Integration).
