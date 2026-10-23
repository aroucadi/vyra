import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimate1RM,
  bestSetOf,
  e1rmSeries,
  best1RM,
  is1RMRecord,
  REP_CAP,
  WEIGHTED_REP_CAP,
  FORMULAS,
  FORMULA_NAMES,
  calculate1RMAccuracy,
  formulaOf,
} from '../../../src/lib/training-math/onerm';

describe('Biomechanical 1RM Calculation Suite (Ported from OpenGym)', () => {
  describe('estimate1RM core calculations', () => {
    it('returns the load unchanged for a single rep', () => {
      assert.equal(estimate1RM(100, 1), 100);
      assert.equal(estimate1RM(62.5, 1), 62.5);
    });

    it('matches Epley by hand across the usual rep ranges', () => {
      assert.equal(estimate1RM(100, 5), 116.7); // 100 * (1 + 5/30)
      assert.equal(estimate1RM(100, 10), 133.3);
      assert.equal(estimate1RM(80, 8), 101.3);
      assert.equal(estimate1RM(60, 3), 66);
    });

    it('rounds to one decimal place accurately', () => {
      assert.equal(estimate1RM(101.25, 7), 124.9);
      const est = estimate1RM(100, 3);
      assert.ok(est !== null);
      assert.equal(Number.isInteger(est * 10), true);
    });

    it('refuses reps beyond REP_CAP rather than guessing', () => {
      assert.ok(estimate1RM(100, REP_CAP) !== null);
      assert.equal(estimate1RM(100, REP_CAP + 1), null);
      assert.equal(estimate1RM(60, 30), null);
    });

    it('rejects invalid, zero, and negative inputs', () => {
      assert.equal(estimate1RM(0, 5), null);
      assert.equal(estimate1RM(-100, 5), null);
      assert.equal(estimate1RM(100, 0), null);
      assert.equal(estimate1RM(100, -3), null);
      assert.equal(estimate1RM(undefined, 5), null);
      assert.equal(estimate1RM(100, undefined), null);
      assert.equal(estimate1RM(NaN, 5), null);
      assert.equal(estimate1RM(Infinity, 5), null);
      assert.equal(estimate1RM('', ''), null);
    });

    it('accepts numeric strings identical to form inputs', () => {
      assert.equal(estimate1RM('100', '5'), 116.7);
    });

    it('offers other documented formulas and agrees with them at low reps', () => {
      assert.equal(estimate1RM(100, 5, 'brzycki'), 112.5);
      assert.equal(estimate1RM(100, 5, 'lombardi'), 117.5);
      assert.ok(Object.keys(FORMULAS).includes('epley'));
    });

    it('falls back to default for an unknown formula name', () => {
      assert.equal(estimate1RM(100, 5, 'unknown_formula'), estimate1RM(100, 5));
    });
  });

  describe('all 7 formulas (epley, brzycki, lombardi, oconner, mayhew, wathan, lander)', () => {
    it("O'Conner matches calculation at r=5", () => {
      // 100 * (1 + 5/40) = 112.5
      assert.equal(estimate1RM(100, 5, 'oconner'), 112.5);
    });

    it('Mayhew matches calculation at r=5', () => {
      const expected = (100 * 100) / (52.2 + 41.9 * Math.exp(-0.055 * 5));
      assert.equal(estimate1RM(100, 5, 'mayhew'), Math.round(expected * 10) / 10);
    });

    it('Wathan matches calculation at r=5', () => {
      const expected = (100 * 100) / (48.8 + 53.8 * Math.exp(-0.075 * 5));
      assert.equal(estimate1RM(100, 5, 'wathan'), Math.round(expected * 10) / 10);
    });

    it('Lander matches calculation at r=5', () => {
      const expected = (100 * 100) / (101.3 - 2.67123 * 5);
      assert.equal(estimate1RM(100, 5, 'lander'), Math.round(expected * 10) / 10);
    });

    it('all formulas present in FORMULA_NAMES dictionary', () => {
      const names = Object.keys(FORMULA_NAMES);
      assert.ok(names.includes('epley'));
      assert.ok(names.includes('brzycki'));
      assert.ok(names.includes('lombardi'));
      assert.ok(names.includes('oconner'));
      assert.ok(names.includes('mayhew'));
      assert.ok(names.includes('wathan'));
      assert.ok(names.includes('lander'));
    });
  });

  describe('weighted ensemble formula & RIR integration', () => {
    it('returns a finite estimate between the min and max of individual formulas', () => {
      const est = estimate1RM(100, 5, 'weighted');
      assert.ok(est !== null);
      const vals = (Object.keys(FORMULAS) as (keyof typeof FORMULAS)[]).map((f) => estimate1RM(100, 5, f)!);
      assert.ok(est >= Math.min(...vals) - 0.1);
      assert.ok(est <= Math.max(...vals) + 0.1);
    });

    it('returns exactly w for a single rep under weighted formula', () => {
      assert.equal(estimate1RM(100, 1, 'weighted'), 100);
    });

    it('returns null when effective reps exceed WEIGHTED_REP_CAP', () => {
      assert.ok(estimate1RM(100, WEIGHTED_REP_CAP, 'weighted') !== null);
      assert.equal(estimate1RM(100, WEIGHTED_REP_CAP + 1, 'weighted'), null);
    });

    it('weighted with RIR computes effective reps properly', () => {
      const withRir = estimate1RM(100, 5, 'weighted', 2);
      const withoutRir = estimate1RM(100, 5, 'weighted');
      assert.ok(withRir !== null && withoutRir !== null);
      assert.ok(withRir > withoutRir);
    });

    it('supports options object signature { rir }', () => {
      const est = estimate1RM(100, 10, { rir: 2 });
      assert.ok(est !== null && est > 130 && est < 145);
    });
  });

  describe('calculate1RMAccuracy confidence scoring', () => {
    it('returns 1 for a single rep to failure', () => {
      assert.equal(calculate1RMAccuracy(1, 0), 1);
    });

    it('returns 0 for reps beyond WEIGHTED_REP_CAP', () => {
      assert.equal(calculate1RMAccuracy(WEIGHTED_REP_CAP + 1), 0);
    });

    it('decreases accuracy as rep count increases', () => {
      const a3 = calculate1RMAccuracy(3);
      const a8 = calculate1RMAccuracy(8);
      const a13 = calculate1RMAccuracy(13);
      assert.ok(a3 > a8);
      assert.ok(a8 > a13);
    });
  });

  describe('bestSetOf, e1rmSeries, and is1RMRecord', () => {
    it('picks highest 1RM estimate rather than just heaviest set', () => {
      const entry = {
        id: 'bench',
        sets: [
          { w: 100, r: 5, done: true }, // 116.7
          { w: 110, r: 3, done: true }, // 121.0
          { w: 120, r: 1, done: true }, // 120.0
        ],
      };
      const best = bestSetOf(entry);
      assert.deepEqual(best, { est: 121, w: 110, r: 3 });
    });

    it('ignores unfinished or warmup sets', () => {
      const entry = {
        id: 'bench',
        sets: [
          { w: 100, r: 5, done: true },
          { w: 200, r: 5, done: false },
          { w: 300, r: 5, done: true, warmup: true },
        ],
      };
      const best = bestSetOf(entry);
      assert.equal(best?.w, 100);
    });

    it('flags new 1RM personal records accurately', () => {
      const S = {
        workouts: [
          { d: '2026-01-01', start: 1, entries: [{ id: 'bench', sets: [{ w: 80, r: 5, done: true }] }] },
          { d: '2026-01-08', start: 2, entries: [{ id: 'bench', sets: [{ w: 90, r: 5, done: true }] }] }, // 105
        ],
      };
      // Beating previous best 105
      const rec = is1RMRecord(S, 'bench', { id: 'bench', sets: [{ w: 95, r: 5, done: true }] });
      assert.ok(rec !== null);
      assert.equal(rec?.est, 110.8);
      assert.equal(rec?.prev, 105);

      // Not beating previous best
      const noRec = is1RMRecord(S, 'bench', { id: 'bench', sets: [{ w: 85, r: 5, done: true }] });
      assert.equal(noRec, null);
    });

    it('estimates each completed per-side limb and ignores uncompleted sides', () => {
      const sides = {
        id: 'bench',
        target: { mode: 'reps', side: true },
        sets: [
          {
            w: 100,
            r: 10,
            done: false,
            sides: {
              L: { w: 100, r: 5, done: true },
              R: { w: 90, r: 5, done: false },
            },
          },
        ],
      };
      assert.deepEqual(bestSetOf(sides as any), { est: 116.7, w: 100, r: 5 });
    });

    it('estimates only from activation weight, ignoring lighter dropsets', () => {
      const entry = {
        id: 'x',
        sets: [
          {
            type: 'dropset',
            w: 100,
            r: 5,
            done: true,
            drops: [
              { w: 80, r: 5 },
              { w: 60, r: 5 },
            ],
          },
        ],
      };
      assert.deepEqual(bestSetOf(entry as any), bestSetOf({ id: 'x', sets: [{ w: 100, r: 5, done: true }] } as any));
    });

    it('does not let a ticked-off warm-up set raise the estimated 1RM', () => {
      const entry = {
        id: 'warm-test',
        sets: [
          { w: 20, r: 8, done: true, warmup: true },
          { w: 80, r: 5, done: true },
        ],
      };
      const working = { id: 'warm-test', sets: [{ w: 80, r: 5, done: true }] };
      assert.deepEqual(bestSetOf(entry as any), bestSetOf(working as any));
    });
  });

  describe('OpenGym Parity Edge Cases & Formula Divergence', () => {
    it('individual formulas ignore the RIR parameter (OpenGym parity)', () => {
      assert.equal(estimate1RM(100, 5, 'epley', 2), estimate1RM(100, 5, 'epley'));
      assert.equal(estimate1RM(100, 5, 'brzycki', 3), estimate1RM(100, 5, 'brzycki'));
    });

    it('ignores negative or non-numeric RIR', () => {
      assert.equal(estimate1RM(100, 5, 'weighted', -1), estimate1RM(100, 5, 'weighted'));
      assert.equal(estimate1RM(100, 5, 'weighted', 'abc' as any), estimate1RM(100, 5, 'weighted'));
    });

    it('accepts reps above REP_CAP but within WEIGHTED_REP_CAP for weighted formula', () => {
      assert.ok(estimate1RM(100, 13, 'weighted') !== null);
      assert.equal(estimate1RM(100, 13, 'epley'), null);
    });

    it('keeps formulas within a few percent up to 8 reps, and diverges most at REP_CAP', () => {
      const spread = (r: number) =>
        Math.max(...(Object.keys(FORMULAS) as (keyof typeof FORMULAS)[]).map((f) => estimate1RM(100, r, f)!)) -
        Math.min(...(Object.keys(FORMULAS) as (keyof typeof FORMULAS)[]).map((f) => estimate1RM(100, r, f)!));

      assert.equal(spread(1), 0); // single rep is measured, not estimated
      for (let r = 2; r <= 8; r++) {
        assert.ok(spread(r) < 10);
      }
      const upTo: number[] = [];
      for (let r = 1; r < REP_CAP; r++) upTo.push(spread(r));
      assert.ok(spread(REP_CAP) > Math.max(...upTo));
    });

    it('formulaOf returns default when empty or unknown, and honors valid settings', () => {
      assert.equal(formulaOf({}), 'epley');
      assert.equal(formulaOf({ oneRmFormula: 'toString' }), 'epley');
      assert.equal(formulaOf({ oneRmFormula: 'brzycki' }), 'brzycki');
      assert.equal(formulaOf({ oneRmFormula: 'weighted' }), 'weighted');
    });
  });
});
