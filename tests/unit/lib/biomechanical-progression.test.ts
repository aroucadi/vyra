import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLICIES,
  POLICIES_FOR,
  DELOAD_FACTOR,
  DELOAD_AFTER,
  epley1RM,
  deloadTarget1RM,
  snapWeight,
  addStep,
  stepWeight,
  deloadTo,
  normalizeRepRange,
  policyFor,
  stallCount,
  nextPrescription,
  tripleSetsOf,
  defaultIncrement,
  plannedOf,
  planChanged,
  selectDeloadCandidate,
} from '../../../src/lib/training-math/progression';

describe('Biomechanical Progression & Deload Engine (Ported from OpenGym)', () => {
  describe('Mathematical helpers & weight snapping', () => {
    it('snaps weights accurately to increment grid', () => {
      assert.equal(snapWeight(62.4, 2.5), 62.5);
      assert.equal(snapWeight(61.2, 1.25), 61.25);
      assert.equal(snapWeight(100, 5), 100);
    });

    it('addStep increments on-grid and off-grid weights cleanly', () => {
      assert.equal(addStep(60, 2.5, 2.5), 62.5);
      assert.equal(addStep(61.3, 2.5, 2.5), 63.8); // off-grid keeps offset
    });

    it('stepWeight supports bidirectional stepping', () => {
      assert.equal(stepWeight(100, 2.5, 1), 102.5);
      assert.equal(stepWeight(100, 2.5, -1), 97.5);
    });

    it('deloadTo reduces weight by deload factor and snaps to increment', () => {
      // 100kg * 0.9 = 90kg
      assert.equal(deloadTo(100, 2.5, 0.9), 90);
      // Ensures deload is strictly below current weight
      assert.ok(deloadTo(20, 2.5) < 20);
    });

    it('epley1RM and deloadTarget1RM compute accurate base targets', () => {
      // 100 * (1 + 10/30) = 133.3
      assert.equal(epley1RM(100, 10), 133.3);
      // 133.3 * 0.9 = 120.0
      assert.equal(deloadTarget1RM(100, 10, 0.9), 120);
    });
  });

  describe('stallCount tracking & streak resets', () => {
    it('counts consecutive missed sessions back from the latest', () => {
      const sessions = [
        { weight: 100, goal: 5, ok: true },
        { weight: 100, goal: 5, ok: false },
        { weight: 100, goal: 5, ok: false },
      ];
      assert.equal(stallCount(sessions as any, 'linear'), 2);
    });

    it('ends stall streak when weight changes', () => {
      const sessions = [
        { weight: 105, goal: 5, ok: false },
        { weight: 105, goal: 5, ok: false },
        { weight: 100, goal: 5, ok: false }, // weight changed here
      ];
      assert.equal(stallCount(sessions as any, 'linear'), 1);
    });

    it('ends stall streak under double progression if session beats previous best reps', () => {
      const sessions = [
        { weight: 100, goal: 10, low: 6, ok: false },
        { weight: 100, goal: 10, low: 7, ok: false },
        { weight: 100, goal: 10, low: 8, ok: false }, // progressing reps (8 > 7 > 6)
      ];
      assert.equal(stallCount(sessions as any, 'double'), 0);
    });
  });

  describe('Linear Progression policy', () => {
    const cfg = { id: 'bench', weight: 100, sets: 3, reps: 5, inc: 2.5, prog: 'linear' as const };

    it('advances weight when all prescribed reps are completed', () => {
      const sessions = [
        { weight: 100, goal: 5, reps: [5, 5, 5], ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.weight, 102.5);
    });

    it('holds weight on single miss', () => {
      const sessions = [
        { weight: 100, goal: 5, reps: [5, 4, 3], ok: false },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'hold');
      assert.equal(next.weight, 100);
    });

    it('triggers deload after 3 consecutive missed sessions', () => {
      const sessions = [
        { weight: 100, goal: 5, reps: [5, 4, 3], ok: false },
        { weight: 100, goal: 5, reps: [5, 4, 4], ok: false },
        { weight: 100, goal: 5, reps: [4, 4, 3], ok: false },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'deload');
      assert.equal(next.weight, 90); // 100 * 0.9 = 90
    });
  });

  describe('Greyskull LP policy', () => {
    const cfg = { id: 'ohp', weight: 60, sets: 3, reps: 5, inc: 2.5, prog: 'greyskull' as const };

    it('advances weight normally on successful sets', () => {
      const sessions = [
        { weight: 60, goal: 5, amrap: 6, ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.weight, 62.5);
    });

    it('triggers double jump when AMRAP doubles target reps (>=10 reps on 5 rep target)', () => {
      const sessions = [
        { weight: 60, goal: 5, amrap: 11, ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.weight, 65); // 60 + (2.5 * 2) = 65
    });

    it('triggers deload immediately after 1 missed session', () => {
      const sessions = [
        { weight: 60, goal: 5, amrap: 4, ok: false },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'deload');
      assert.ok(next.weight! < 60);
    });
  });

  describe('Double Progression policy', () => {
    const cfg = {
      id: 'db_bench',
      weight: 30,
      sets: 3,
      reps: 12, // top of range
      repsMin: 8, // bottom of range
      inc: 2,
      prog: 'double' as const,
    };

    it('holds weight and aims for higher reps when not yet at range ceiling', () => {
      const sessions = [
        { weight: 30, goal: 8, low: 8, ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'hold');
      assert.equal(next.weight, 30);
      assert.equal(next.reps, 9);
    });

    it('advances weight and resets reps to bottom upon hitting rep range ceiling', () => {
      const sessions = [
        { weight: 30, goal: 12, low: 12, ok: true }, // hit ceiling 12 on all sets
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.weight, 32); // 30 + 2
      assert.equal(next.reps, 8); // reset to bottom of range
    });

    it('triggers deload after 3 stalls without progress', () => {
      const sessions = [
        { weight: 30, goal: 10, low: 8, ok: false },
        { weight: 30, goal: 10, low: 8, ok: false },
        { weight: 30, goal: 10, low: 8, ok: false },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'deload');
      assert.equal(next.reps, 8);
    });
  });

  describe('Triple Progression policy', () => {
    const cfg = {
      id: 'curl',
      weight: 20,
      sets: 3,
      setsMax: 5,
      reps: 12,
      repsMin: 8,
      inc: 2.5,
      prog: 'triple' as const,
    };

    it('adds a set when hitting rep ceiling across base sets', () => {
      const sessions = [
        { weight: 20, goal: 12, low: 12, reps: [12, 12, 12], ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.weight, 20); // weight holds
      assert.equal(next.sets, 4); // set added
      assert.equal(next.reps, 8); // new set starts at bottom
    });

    it('advances weight when reaching rep ceiling across maximum sets (setsMax)', () => {
      const sessions = [
        { weight: 20, goal: 12, low: 12, reps: [12, 12, 12, 12, 12], ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.weight, 22.5); // weight advances!
      assert.equal(next.sets, 3); // sets reset to base sets
      assert.equal(next.reps, 8); // reps reset to bottom
    });
  });

  describe('Timed progression', () => {
    const cfg = { id: 'plank', sec: 60, inc: 5, prog: 'time' as const };

    it('advances duration by inc seconds when goal is held', () => {
      const sessions = [
        { weight: 0, goal: 60, held: [60, 60], ok: true },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'up');
      assert.equal(next.sec, 65);
    });
  });

  describe('Catalogue Integration & Plan Changed Detection (OpenGym Parity)', () => {
    it('resolves heavy body part default increments from exercise ID', () => {
      // 0032 is Barbell Deadlift (back) -> heavy
      assert.equal(defaultIncrement('0032', 'kg'), 5);
      assert.equal(defaultIncrement('0032', 'lb'), 10);

      // 0031 is Barbell Curl (upper arms) -> normal
      assert.equal(defaultIncrement('0031', 'kg'), 2.5);
      assert.equal(defaultIncrement('0031', 'lb'), 5);
    });

    it('detects planChanged between previous planned target and current config', () => {
      const cfg = { id: 'bench', sets: 3, reps: 10, repsMin: 8, weight: 80 };
      const planned = plannedOf(cfg);
      assert.equal(planChanged(planned, cfg), false);

      // Edited sets from 3 to 4
      assert.equal(planChanged(planned, { ...cfg, sets: 4 }), true);

      // Edited rep range ceiling from 10 to 12
      assert.equal(planChanged(planned, { ...cfg, reps: 12 }), true);
    });

    it('selectDeloadCandidate selects bounded Epley deload candidate load and reps', () => {
      const candidate = selectDeloadCandidate({
        currentWeight: 100,
        targetWeight: 100,
        targetReps: 5,
        step: 2.5,
        factor: 0.9,
      });

      assert.ok(candidate !== null);
      assert.ok(candidate!.weight <= 100);
      assert.ok(candidate!.epley! > 0);
      assert.equal(candidate!.fallback, false);
    });

    it('normalizeRepRange correctly defaults repsMin and handles inverted bounds (OpenGym parity)', () => {
      // Omitted repsMin defaults to upper - 2
      const def1 = normalizeRepRange(10, null);
      assert.deepEqual(def1, { reps: 10, repsMin: 8 });

      const def2 = normalizeRepRange(5, undefined);
      assert.deepEqual(def2, { reps: 5, repsMin: 3 });

      // Inverted bounds (repsMin >= reps) adjust upper to lower + stride
      const inv1 = normalizeRepRange(8, 10);
      assert.deepEqual(inv1, { reps: 11, repsMin: 10 });

      const inv2 = normalizeRepRange(10, 10);
      assert.deepEqual(inv2, { reps: 11, repsMin: 10 });
    });

    it('nextPrescription surfaces target1RM and deloadFactor on Epley deload', () => {
      const cfg = { id: 'bench', weight: 60, sets: 3, reps: 5, inc: 2.5, prog: 'linear' as const, deloadFactor: 0.8 };
      const sessions = [
        { weight: 60, goal: 5, reps: [4, 4, 4], ok: false },
        { weight: 60, goal: 5, reps: [4, 4, 4], ok: false },
        { weight: 60, goal: 5, reps: [4, 4, 4], ok: false },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'deload');
      assert.equal(next.deloadFactor, 0.8);
      assert.equal(next.target1RM, 56);
      assert.equal(next.weight, 47.5);
    });

    it('holds a below-step load instead of deloading upward', () => {
      const cfg = { id: 'lift', weight: 1, sets: 3, reps: 5, inc: 2.5, prog: 'linear' as const };
      const sessions = [
        { weight: 1, goal: 5, reps: [1, 1, 1], ok: false },
        { weight: 1, goal: 5, reps: [1, 1, 1], ok: false },
        { weight: 1, goal: 5, reps: [1, 1, 1], ok: false },
      ];
      const next = nextPrescription({ unit: 'kg' }, cfg, null, sessions as any);
      assert.equal(next.kind, 'deload');
      assert.equal(next.weight, 1);
      assert.ok(String(next.why?.[0]).toLowerCase().includes('hold'));
    });
  });
});
