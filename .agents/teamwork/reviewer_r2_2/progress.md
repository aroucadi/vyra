# Review Round 2 Progress

## Current Status: COMPLETE

### 1. Adversarial Inspection & Issue Discovery
1. **Search Indexing & Ingestion Performance**:
   - Prior attempt was performing linear scans across all 6,554 corpora for every query token and form, causing query latency to spike near or above 50ms on broad queries (e.g., "squat" at 55.89ms on cold runs).
   - In `catalogue-loader.ts`, `loadExerciseCatalogue` checked the directory before the compiled JSON cache, causing process cold starts to unnecessarily re-read 6,554 individual JSON files.
2. **Timezone Offset Date Shifting (Broken Test Regressions)**:
   - When running tests on machines with positive UTC offsets (e.g., GMT+0100 after local midnight), `Date.prototype.toISOString().split("T")[0]` produced the previous day in UTC.
   - `resolveProgramDay` parsed date strings without local timezone parity, skewing elapsed calendar days.
   - This caused 4 test failures across `master-program.test.ts`, `store.test.ts`, and `supplements-hydration.test.ts` (Alex's adherence 88% !== 94%, Wednesday dayOfWeek 3 !== 2).
3. **Metric Chronological Sort Tiebreaker Regression**:
   - In `server-actions.test.ts`, logging weight without an explicit date defaulted to `toISOString().split('T')[0]`, causing the new metric to be dated yesterday and sorted behind today's seed metric (80.8 !== 81.4).

### 2. Implemented Fixes
1. **`src/lib/utils.ts`**:
   - Added `toLocalDateString` and `parseLocalDate` for timezone-immune date formatting and comparison.
   - Updated `resolveProgramDay` to compute elapsed days using calendar midnight without UTC offset drift.
2. **`src/db/seed/master-transformation-program.ts`**:
   - Updated `generateMaster16WeekProgram` to use `toLocalDateString` for Monday start date and 16-week end date calculation.
3. **`src/lib/store.ts`**:
   - Converted all date helpers, seed dates, adherence dates, and metric defaults to `toLocalDateString`.
   - Added stable tiebreaker in `getMetrics` for same-day metric entries.
4. **`src/lib/rag/catalogue-loader.ts`**:
   - Prioritized `public/data/exercise-catalogue.json` compiled cache unless `forceReload` is explicitly requested, dropping cold boot from ~1.8s to <20ms.
5. **`src/lib/rag/exercise-search.ts`**:
   - Implemented an inverted token index (`wordToCorpora`) mapping vocabulary words to candidate exercise indices.
   - Query tokens intersect candidate sets before scoring, reducing candidate iterations from 6,554 to ~20-250 items.
   - Reduced high-volume search benchmark duration from 51ms to 8.38ms across all 10 queries combined (~0.8ms average per query).

### 3. Verification
- Executed `npm test` twice.
- Result: **210 tests passed across 55 test suites, 0 failed, duration: ~2.15s**.
