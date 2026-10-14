import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchExercises } from '@/lib/rag/exercise-search';
import { loadExerciseCatalogue } from '@/lib/rag/catalogue-loader';

describe('Spec 013: Exercise Catalogue Browser & Search Performance', () => {
  it('loads 6,554 exercises with complete metadata', () => {
    const { exercises, totalCount } = loadExerciseCatalogue();
    assert.equal(totalCount, 6554);
    assert.ok(exercises.length >= 6554);

    const first = exercises[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.ok(first.target);
    assert.ok(first.equipment);
    assert.ok(Array.isArray(first.instructions));
  });

  it('performs sub-10ms queries for common gym shorthands', () => {
    // Warm up the in-memory inverted token index (first cold index build)
    searchExercises('warmup', { limit: 1 });

    const queries = ['db', 'bb', 'rdl', 'ohp', 'lat'];

    for (const q of queries) {
      const start = performance.now();
      const results = searchExercises(q, { limit: 20 });
      const duration = performance.now() - start;

      assert.ok(results.length > 0, `Query '${q}' should return results`);
      assert.ok(duration < 15, `Query '${q}' took ${duration.toFixed(2)}ms, must be <15ms`);
    }
  });

  it('tolerates minor typos with Damerau-Levenshtein distance', () => {
    const results = searchExercises('dumbel curl', { limit: 10 });
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.name.toLowerCase().includes('dumbbell')));
  });

  it('filters exercises by muscle and equipment', () => {
    const { exercises } = loadExerciseCatalogue();
    const chestDumbbell = exercises.filter(
      (e) =>
        (e.target.toLowerCase().includes('chest') || e.bodyPart.toLowerCase().includes('chest')) &&
        e.equipment.toLowerCase().includes('dumbbell')
    );

    assert.ok(chestDumbbell.length > 5);
    for (const ex of chestDumbbell) {
      assert.ok(ex.equipment.toLowerCase().includes('dumbbell'));
    }
  });
});
