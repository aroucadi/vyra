import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLATE_SIZES,
  DEFAULT_PAIRS,
  inventoryFor,
  ownsPlates,
  withPlatePairs,
  withStandardPlates,
  loadKindOf,
  withLoadKind,
  plateStack,
  plateDelta,
  loadKindFor,
  baseWeightFor,
  barWeightFor,
  plateSplit,
  isNoBar,
  hasBarOverride,
  usesBar,
  rowLoad,
  sameLoad,
  calculateBarbellPlates,
  dropGrid,
} from '../../../src/lib/training-math/plates';

describe('Biomechanical Plate Math Suite (Ported from OpenGym)', () => {
  const homeInv = [
    { w: 45, n: 1 },
    { w: 35, n: 1 },
    { w: 25, n: 1 },
    { w: 15, n: 1 },
    { w: 10, n: 1 },
    { w: 5, n: 1 },
    { w: 2.5, n: 1 },
  ];

  describe('inventoryFor & plate ownership', () => {
    it('provides standard inventory for kg and lb profiles by default', () => {
      const lb = inventoryFor({ unit: 'lb' });
      assert.deepEqual(
        lb.map((p) => p.w),
        [45, 35, 25, 10, 5, 2.5]
      );
      assert.ok(lb.every((p) => p.n === DEFAULT_PAIRS));

      const kg = inventoryFor({ unit: 'kg' });
      assert.deepEqual(
        kg.map((p) => p.w),
        [25, 20, 15, 10, 5, 2.5, 1.25]
      );
      assert.ok(kg.every((p) => p.n === DEFAULT_PAIRS));
    });

    it('handles custom plate ownership mutation and reset', () => {
      const state = { unit: 'lb', plates: {} };
      const updated = withPlatePairs(state, 45, 2, 1000);
      const nextState = { unit: 'lb', plates: updated };
      assert.ok(ownsPlates(nextState as any));

      const reset = withStandardPlates(nextState as any, 2000);
      assert.equal(ownsPlates({ unit: 'lb', plates: reset } as any), false);
    });
  });

  describe('plateStack loading algorithm', () => {
    it('loads heaviest plates first when greedy lands exactly', () => {
      const res50 = plateStack(50, homeInv);
      assert.deepEqual(res50, { plates: [45, 5], missing: 0 });

      const res60 = plateStack(60, inventoryFor({ unit: 'lb' }));
      assert.deepEqual(res60, { plates: [45, 10, 5], missing: 0 });

      const res115 = plateStack(115, inventoryFor({ unit: 'lb' }));
      assert.deepEqual(res115, { plates: [45, 45, 25], missing: 0 });

      const res21_25 = plateStack(21.25, inventoryFor({ unit: 'kg' }));
      assert.deepEqual(res21_25, { plates: [20, 1.25], missing: 0 });
    });

    it('finds exact fit with fewest plates when greedy misses', () => {
      // greedy would take 35 and get stuck; two 25s hit exactly 50
      const res = plateStack(50, [
        { w: 35, n: 1 },
        { w: 25, n: 2 },
      ]);
      assert.deepEqual(res, { plates: [25, 25], missing: 0 });

      // 100 with one pair of each: 45 + 35 + 15 + 5
      const res100 = plateStack(100, homeInv);
      assert.deepEqual(res100, { plates: [45, 35, 15, 5], missing: 0 });
    });

    it('reports missing load when requested weight cannot be fulfilled', () => {
      const res = plateStack(140, homeInv);
      assert.deepEqual(res.plates, [45, 35, 25, 15, 10, 5, 2.5]);
      assert.equal(res.missing, 2.5);
    });

    it('returns empty stack for zero or null weight', () => {
      assert.deepEqual(plateStack(0, homeInv), { plates: [], missing: 0 });
      assert.deepEqual(plateStack(null, homeInv), { plates: [], missing: 0 });
    });
  });

  describe('plateDelta calculation', () => {
    it('calculates what plates to strip and add between working sets', () => {
      const delta1 = plateDelta([10, 2.5], [25, 2.5]);
      assert.deepEqual(delta1, { strip: [10], add: [25] });

      const delta2 = plateDelta([45, 5], [45, 5]);
      assert.deepEqual(delta2, { strip: [], add: [] });

      const delta3 = plateDelta([45, 45, 10], [45, 25, 5]);
      assert.deepEqual(delta3.strip, [45, 10]);
      assert.deepEqual(delta3.add, [25, 5]);
    });
  });

  describe('Barbell & Smith machine loading variations', () => {
    it('computes plate loading for standard Olympic bar (20kg)', () => {
      const res = rowLoad('pairs', 100, 20, inventoryFor({ unit: 'kg' }));
      assert.ok(res !== null);
      assert.equal(res.barOnly, false);
      assert.equal(res.perSide, 40);
      assert.deepEqual(res.plates, [25, 15]);
      assert.equal(res.missing, 0);
    });

    it('computes plate loading for Women’s bar (15kg)', () => {
      const res = rowLoad('pairs', 75, 15, inventoryFor({ unit: 'kg' }));
      assert.ok(res !== null);
      assert.equal(res.barOnly, false);
      assert.equal(res.perSide, 30); // (75 - 15) / 2 = 30kg per side
      assert.deepEqual(res.plates, [25, 5]);
      assert.equal(res.missing, 0);
    });

    it('computes plate loading for Smith machine with 9kg carriage', () => {
      const res = rowLoad('pairs', 69, 9, inventoryFor({ unit: 'kg' }));
      assert.ok(res !== null);
      assert.equal(res.barOnly, false);
      assert.equal(res.perSide, 30); // (69 - 9) / 2 = 30kg per side
      assert.deepEqual(res.plates, [25, 5]);
      assert.equal(res.missing, 0);
    });

    it('computes plate loading for counterbalanced Smith machine (0kg carriage)', () => {
      const res = rowLoad('pairs', 90, 0, inventoryFor({ unit: 'kg' }));
      assert.ok(res !== null);
      assert.equal(res.barOnly, false);
      assert.equal(res.perSide, 45); // (90 - 0) / 2 = 45kg per side
      assert.deepEqual(res.plates, [25, 20]);
      assert.equal(res.missing, 0);
    });

    it('marks set as barOnly when weight is at or below bar weight', () => {
      const res = rowLoad('pairs', 20, 20, inventoryFor({ unit: 'kg' }));
      assert.ok(res !== null);
      assert.equal(res.barOnly, true);
      assert.deepEqual(res.plates, []);
    });
  });

  describe('Single-stack equipment (sled, dip belt)', () => {
    it('loads both plates of each pair on a single stack', () => {
      const inv = [
        { w: 20, n: 1 },
        { w: 10, n: 1 },
      ];
      // On single stack, 1 pair of 20s provides two 20kg plates
      const res = rowLoad('single', 40, 0, inv);
      assert.ok(res !== null);
      assert.deepEqual(res.plates, [20, 20]);
      assert.equal(res.missing, 0);
    });
  });

  describe('Exercise ID & Equipment Resolution (OpenGym Parity)', () => {
    it('resolves exercise IDs from catalogue for base weight calculation', () => {
      // 0032 is Barbell Deadlift
      assert.equal(baseWeightFor({ unit: 'lb' }, '0032'), 45);
      assert.equal(baseWeightFor({ unit: 'kg' }, '0032'), 20);

      // Custom bar weight override wins over default
      assert.equal(baseWeightFor({ unit: 'kg', barWeights: { '0032': 25 } }, '0032'), 25);
    });

    it('resolves loadKindFor correctly across exercise IDs', () => {
      // Barbell deadlift -> 'pairs'
      assert.equal(loadKindFor({}, '0032'), 'pairs');
      // 3/4 sit-up (body weight) -> 'single'
      assert.equal(loadKindFor({}, '0001'), 'single');
      // Dumbbell curl -> 'none'
      assert.equal(loadKindFor({}, '0293'), 'none');
    });

    it('sameLoad correctly detects equivalent and divergent row loads', () => {
      const a = rowLoad('pairs', 100, 20, inventoryFor({ unit: 'kg' }));
      const b = rowLoad('pairs', 100, 20, inventoryFor({ unit: 'kg' }));
      const c = rowLoad('pairs', 90, 20, inventoryFor({ unit: 'kg' }));
      assert.equal(sameLoad(a, b), true);
      assert.equal(sameLoad(a, c), false);
    });

    it('dropGrid snaps to loads counted plates can make', () => {
      const S = { unit: 'kg', plates: { kg: { 10: 2, 5: 1, _ts: 1 } } };
      const snap = dropGrid(S as any, { id: '0032' });
      assert.equal(typeof snap, 'function');
      if (typeof snap === 'function') {
        assert.equal(snap(48), 40);
        assert.equal(snap(64), 60);
        assert.equal(snap(15), 20); // below bar weight
      }
    });

    it('quarter-unit boundaries never exceed requested weight', () => {
      const testWeights = [0.1, 2.4, 2.6, 7.4, 8.1];
      for (const w of testWeights) {
        const result = plateStack(w, [{ w: 2.5, n: 3 }]);
        const loaded = result.plates.reduce((sum, p) => sum + p, 0);
        assert.ok(loaded <= w + 1e-9);
        assert.ok(Math.abs(result.missing - (w - loaded)) < 1e-6);
      }
    });
  });

  describe('calculateBarbellPlates utility compatibility', () => {
    it('returns exact structure matching UI expectations', () => {
      const res = calculateBarbellPlates(100, 'kg', 20);
      assert.equal(res.barWeight, 20);
      assert.equal(res.weightPerSide, 40);
      assert.deepEqual(res.platesPerSide, [25, 15]);
      assert.equal(res.remainder, 0);
    });
  });

  describe('OpenGym Bar utilities & overrides (barWeightFor, plateSplit, isNoBar)', () => {
    it('usesBar correctly detects bar equipment from ID and object', () => {
      assert.equal(usesBar('0032'), true); // deadlift uses barbell
      assert.equal(usesBar('barbell'), true);
      assert.equal(usesBar({ id: 'barbell' }), true);
      assert.equal(usesBar({ eq: 'barbell' }), true);
      assert.equal(usesBar('dumbbell'), false);
      assert.equal(usesBar({ eq: 'dumbbell' }), false);
    });

    it('plateSplit splits load per side accurately and handles no bar (0kg)', () => {
      assert.equal(plateSplit(100, 20), 40); // (100 - 20) / 2
      assert.equal(plateSplit(75, 15), 30);
      assert.equal(plateSplit(90, 0), 45); // no bar splits entire weight
      assert.equal(plateSplit(20, 20), null); // at bar weight -> null
      assert.equal(plateSplit(15, 20), null); // below bar -> null
      assert.equal(plateSplit(0, 20), null);
      assert.equal(plateSplit(null, 20), null);
    });

    it('barWeightFor resolves bar weight including overrides and counterbalanced Smith machine', () => {
      const S = {
        unit: 'kg',
        barWeights: {
          '0032': 25, // custom 25kg bar override
          '0746': 0,  // 0kg counterbalanced smith machine
        },
      };

      assert.equal(barWeightFor(S as any, '0032'), 25);
      assert.equal(barWeightFor(S as any, '0746'), 0);
      assert.equal(isNoBar(S as any, '0746'), true);
      assert.equal(hasBarOverride(S as any, '0746'), true);
      assert.equal(hasBarOverride(S as any, '0032'), true);
      assert.equal(hasBarOverride(S as any, '0043'), false);

      // Default bar weight without override
      assert.equal(barWeightFor({ unit: 'kg' } as any, '0746'), 9); // default 9kg smith machine carriage
      assert.equal(barWeightFor({ unit: 'kg' } as any, '0043'), 20); // default 20kg barbell

      // Non-bar exercise returns null
      assert.equal(barWeightFor(S as any, { eq: 'dumbbell' }), null);
    });
  });
});

