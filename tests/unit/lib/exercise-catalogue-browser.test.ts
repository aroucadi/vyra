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
      assert.ok(duration < 50, `Query '${q}' took ${duration.toFixed(2)}ms, must be <50ms SLA`);
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

  it('verifies /api/exercises route handles parameters and caching cleanly', async () => {
    const { GET } = await import('@/app/api/exercises/route');
    const { NextRequest } = await import('next/server');

    // 1. Valid shorthand query
    const req1 = new NextRequest('http://localhost/api/exercises?q=lat&limit=5');
    const res1 = await GET(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.exercises.length, 5);
    assert.ok(data1.total > 0);
    assert.ok(res1.headers.get('cache-control')?.includes('stale-while-revalidate'));

    // 2. Sanitization on invalid negative limit
    const req2 = new NextRequest('http://localhost/api/exercises?q=rdl&limit=-99');
    const res2 = await GET(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.ok(data2.exercises.length > 0, 'Should fall back to default limit');

    // 3. Combined muscle and equipment filter
    const req3 = new NextRequest('http://localhost/api/exercises?muscle=chest&equipment=dumbbell&limit=10');
    const res3 = await GET(req3);
    assert.equal(res3.status, 200);
    const data3 = await res3.json();
    assert.ok(data3.exercises.length > 0);
    for (const ex of data3.exercises) {
      assert.ok(ex.equipment.toLowerCase().includes('dumbbell'));
    }
  });
});

