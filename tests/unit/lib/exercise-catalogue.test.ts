import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadExerciseCatalogue, getExerciseById } from '../../../src/lib/rag/catalogue-loader';
import { searchExercises, normalizeStr, editDistance } from '../../../src/lib/rag/exercise-search';

describe('OpenGym 6,554 Exercise Catalogue & Search Index Engine', () => {
  const catalogue = loadExerciseCatalogue();

  describe('Catalogue Parsing & Data Integrity', () => {
    it('successfully parses 100% of the 6,554 exercises from OpenGym', () => {
      assert.equal(catalogue.totalCount, 6554);
      assert.equal(catalogue.exercises.length, 6554);
      assert.equal(catalogue.byId.size, 6554);
    });

    it('preserves all required schema attributes across exercises', () => {
      // Sample diverse exercises across the dataset
      const ex1 = catalogue.byId.get('0001');
      assert.ok(ex1, '0001 must exist');
      assert.equal(ex1?.id, '0001');
      assert.equal(ex1?.name, '3/4 sit-up');
      assert.equal(ex1?.bodyPart, 'waist');
      assert.equal(ex1?.equipment, 'body weight');
      assert.equal(ex1?.target, 'abs');
      assert.ok(Array.isArray(ex1?.secondaryMuscles));
      assert.equal(ex1?.category, 'calisthenics');
      assert.ok(Array.isArray(ex1?.instructions) && ex1!.instructions.length > 0);
      assert.equal(ex1?.femaleVariant, '2476');
    });

    it('resolves drawing variants and variantOf relationships without data loss', () => {
      const ex4 = getExerciseById('0004');
      assert.ok(ex4, 'Exercise 0004 must be queryable');
      assert.equal(ex4?.variantOf, '5266');
      assert.ok(ex4?.name.toLowerCase().includes('air twisting crunch'));

      const canonical5266 = getExerciseById('5266');
      assert.ok(canonical5266, 'Base exercise 5266 must exist');
      assert.equal(canonical5266?.femaleVariant, '0004');
    });

    it('guarantees valid non-empty fields for standard exercises', () => {
      const standardExercises = catalogue.exercises.filter((e) => !e.variantOf);
      assert.ok(standardExercises.length > 5000);
      for (const ex of standardExercises.slice(0, 500)) {
        assert.ok(ex.id.length >= 4, `ID ${ex.id} must be valid`);
        assert.ok(ex.name.length > 0, `Name for ${ex.id} must not be empty`);
        assert.ok(ex.bodyPart.length > 0, `BodyPart for ${ex.id} must not be empty`);
        assert.ok(ex.equipment.length > 0, `Equipment for ${ex.id} must not be empty`);
        assert.ok(ex.target.length > 0, `Target for ${ex.id} must not be empty`);
      }
    });
  });

  describe('Search Engine, Shorthands & Typo Tolerance', () => {
    it('expands gym shorthand "db" to dumbbell exercises', () => {
      const results = searchExercises('db bench press');
      assert.ok(results.length > 0);
      assert.ok(results.some((e) => e.equipment === 'dumbbell' && e.name.includes('bench press')));
    });

    it('expands gym shorthand "rdl" to romanian deadlift', () => {
      const results = searchExercises('rdl');
      assert.ok(results.length > 0);
      assert.ok(results.some((e) => e.name.toLowerCase().includes('romanian deadlift')));
    });

    it('expands gym shorthand "ohp" to overhead / shoulder press', () => {
      const results = searchExercises('bb ohp');
      assert.ok(results.length > 0);
      assert.ok(
        results.some(
          (e) =>
            e.equipment === 'barbell' &&
            (e.name.includes('overhead press') || e.name.includes('shoulder press') || e.name.includes('military press'))
        )
      );
    });

    it('expands gym shorthand "bb" to barbell exercises', () => {
      const results = searchExercises('bb squat');
      assert.ok(results.length > 0);
      assert.ok(results.some((e) => e.equipment === 'barbell' && e.name.includes('squat')));
    });

    it('tolerates typos in exercise queries (e.g. dumbell, sqat, bnech)', () => {
      const typoDb = searchExercises('dumbell curl');
      assert.ok(typoDb.length > 0);
      assert.ok(typoDb.some((e) => e.name.includes('dumbbell') && e.name.includes('curl')));

      const typoSq = searchExercises('sqat');
      assert.ok(typoSq.length > 0);
      assert.ok(typoSq.some((e) => e.name.includes('squat')));

      const typoBench = searchExercises('bnech press');
      assert.ok(typoBench.length > 0);
      assert.ok(typoBench.some((e) => e.name.includes('bench press')));
    });

    it('handles multi-token searches with out-of-order terms', () => {
      const res = searchExercises('press bench barbell');
      assert.ok(res.length > 0);
      assert.equal(res[0].name.toLowerCase(), 'barbell bench press');
    });

    it('handles hyphenated queries and gym variants cleanly', () => {
      const pullups = searchExercises('pull-up');
      assert.ok(pullups.length > 0);
      assert.ok(pullups.some((e) => e.name.toLowerCase().includes('pull-up') || e.name.toLowerCase().includes('pull up')));

      const benchPress = searchExercises('bench-press');
      assert.ok(benchPress.length > 0);
      assert.ok(benchPress.some((e) => e.name.toLowerCase().includes('bench press')));

      const chinUps = searchExercises('chin-up');
      assert.ok(chinUps.length > 0);
      assert.ok(chinUps.some((e) => e.name.toLowerCase().includes('chin-up') || e.name.toLowerCase().includes('chin up')));
    });

    it('tolerates punctuation and parentheses in query string without breaking', () => {
      const resWithParens = searchExercises('squat (barbell)');
      assert.ok(resWithParens.length > 0);
      assert.ok(resWithParens.some((e) => e.name.toLowerCase().includes('squat') && e.equipment === 'barbell'));

      const resWithComma = searchExercises('bench press, incline');
      assert.ok(resWithComma.length > 0);
      assert.ok(resWithComma.some((e) => e.name.toLowerCase().includes('incline') && e.name.toLowerCase().includes('bench press')));
    });

    it('safely clamps limit and handles whitespace or empty queries', () => {
      const zeroLimit = searchExercises('squat', { limit: 0 });
      assert.equal(zeroLimit.length, 0);

      const empty = searchExercises('   ', { limit: 5 });
      assert.equal(empty.length, 5);

      const negativeLimit = searchExercises('squat', { limit: -1 });
      assert.equal(negativeLimit.length, 0);
    });

    it('returns empty array when search has impossible token', () => {
      const impossible = searchExercises('dumbbell curl qwxz');
      assert.deepEqual(impossible, []);
    });

    it('prioritizes exact matches and never fuzzy-matches correctly spelled words (QA C26)', () => {
      // "wrist" must return wrist exercises, never pull in "waist" via typo tolerance
      const wrist = searchExercises('wrist');
      assert.ok(wrist.length > 0);
      assert.ok(wrist.every((e) => e.name.includes('wrist') || e.bodyPart.includes('lower arms') || e.target.includes('forearm')));
    });
  });

  describe('Performance Benchmark (<50ms requirement)', () => {
    it('responds to searches in strictly under 50ms across high-volume queries', () => {
      const testQueries = [
        'bb rdl',
        'dumbbell incline bench press',
        'ohp',
        'bnech press',
        'cable lateral raise',
        'pullup',
        'hammer curls',
        'leg press',
        'squat',
        'deadlift',
      ];

      // Warm up search index
      searchExercises('bench');

      for (const q of testQueries) {
        const t0 = performance.now();
        const results = searchExercises(q, { limit: 20 });
        const latency = performance.now() - t0;
        assert.ok(results.length > 0, `Query "${q}" should yield results`);
        assert.ok(
          latency < 50,
          `Query "${q}" took ${latency.toFixed(2)}ms, exceeding 50ms requirement`
        );
      }
    });

    it('direct ID lookup responds in under 1ms', () => {
      const t0 = performance.now();
      const ex = getExerciseById('0032');
      const latency = performance.now() - t0;
      assert.ok(ex !== null);
      assert.ok(latency < 1, `ID lookup took ${latency.toFixed(3)}ms`);
    });
  });
});
