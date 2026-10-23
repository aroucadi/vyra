import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATES,
  EVALUATION_MODES,
  BALANCE_STATUSES,
  BORDERLINE_BAND_PCT,
  classify,
  targetFor,
  computeBalance,
  evaluateStructuralRatio,
} from '../../../src/lib/training-math/structural-balance';

describe('Biomechanical Structural Balance Suite (Ported from OpenGym)', () => {
  describe('classify ratio thresholds', () => {
    it('accurately categorizes balanced, borderline, and weak ratios', () => {
      // Target 75%
      assert.equal(classify(75, 75), BALANCE_STATUSES.BALANCED);
      assert.equal(classify(80, 75), BALANCE_STATUSES.BALANCED);
      assert.equal(classify(70, 75), BALANCE_STATUSES.BORDERLINE); // exactly 5% edge
      assert.equal(classify(69.9, 75), BALANCE_STATUSES.WEAK);
      assert.equal(classify(50, 75), BALANCE_STATUSES.WEAK);
      assert.equal(classify(null, 75), BALANCE_STATUSES.NO_DATA);
      assert.equal(classify(NaN, 75), BALANCE_STATUSES.NO_DATA);
    });
  });

  describe('Thibaudeau Powerlifting ratios (Load Ratio mode)', () => {
    const template = TEMPLATES.thibaudeauPowerlifting;

    it('evaluates Bench Press against Squat anchor (75% standard)', () => {
      // Squat: 100kg x 1 = 100kg 1RM
      // Bench: 75kg x 1 = 75kg 1RM -> Exactly 75% target
      const S = {
        unit: 'kg',
        workouts: [
          { d: '2026-01-01', start: 1, entries: [{ id: '0043', sets: [{ done: true, w: 100, r: 1 }] }] },
          { d: '2026-01-02', start: 2, entries: [{ id: '0025', sets: [{ done: true, w: 75, r: 1 }] }] },
        ],
      };

      const results = computeBalance(S as any, template);
      const benchResult = results.find((r) => r.roleId === 'bench');
      assert.ok(benchResult);
      assert.equal(benchResult.status, BALANCE_STATUSES.BALANCED);
      assert.equal(Math.round(benchResult.actualPct!), 75);

      const squatResult = results.find((r) => r.roleId === 'squat');
      assert.ok(squatResult);
      assert.equal(squatResult.status, BALANCE_STATUSES.BALANCED);
      assert.equal(Math.round(squatResult.actualPct!), 100);
    });

    it('detects borderline and weak ratios for lagging accessory lifts', () => {
      const sBorderline = {
        unit: 'kg',
        workouts: [
          { d: '2026-01-01', entries: [{ id: '0043', sets: [{ done: true, w: 100, r: 1 }] }] },
          { d: '2026-01-02', entries: [{ id: '0025', sets: [{ done: true, w: 71, r: 1 }] }] }, // 71% vs 75%
        ],
      };
      const rBorderline = computeBalance(sBorderline as any, template).find((r) => r.roleId === 'bench');
      assert.equal(rBorderline?.status, BALANCE_STATUSES.BORDERLINE);

      const sWeak = {
        unit: 'kg',
        workouts: [
          { d: '2026-01-01', entries: [{ id: '0043', sets: [{ done: true, w: 100, r: 1 }] }] },
          { d: '2026-01-02', entries: [{ id: '0025', sets: [{ done: true, w: 60, r: 1 }] }] }, // 60% vs 75%
        ],
      };
      const rWeak = computeBalance(sWeak as any, template).find((r) => r.roleId === 'bench');
      assert.equal(rWeak?.status, BALANCE_STATUSES.WEAK);
    });
  });

  describe('Poliquin Structural Balance Template', () => {
    const template = TEMPLATES.poliquin;

    it('evaluates Deadlift ratio against High-Bar Squat anchor (125% standard)', () => {
      // Squat: 100kg x 5 = 116.7 1RM
      // Deadlift: 125kg x 5 = 145.8 1RM -> Exactly 125% of Squat
      const S = {
        unit: 'kg',
        workouts: [
          { d: '2026-01-01', entries: [{ id: '1436', sets: [{ done: true, w: 100, r: 5 }] }] },
          { d: '2026-01-02', entries: [{ id: '0032', sets: [{ done: true, w: 125, r: 5 }] }] },
        ],
      };

      const results = computeBalance(S as any, template);
      const dlResult = results.find((r) => r.roleId === 'deadlift');
      assert.ok(dlResult);
      assert.equal(dlResult.status, BALANCE_STATUSES.BALANCED);
      assert.equal(Math.round(dlResult.actualPct!), 125);
    });

    it('evaluates Incline Bench against Close-Grip Bench anchor (91% standard)', () => {
      const S = {
        unit: 'kg',
        workouts: [
          { d: '2026-01-01', entries: [{ id: '0030', sets: [{ done: true, w: 100, r: 1 }] }] }, // CGB anchor
          { d: '2026-01-02', entries: [{ id: '0047', sets: [{ done: true, w: 91, r: 1 }] }] },  // Incline bench
        ],
      };

      const results = computeBalance(S as any, template);
      const incResult = results.find((r) => r.roleId === 'inclineBench');
      assert.ok(incResult);
      assert.equal(incResult.status, BALANCE_STATUSES.BALANCED);
      assert.equal(Math.round(incResult.actualPct!), 91);
    });
  });

  describe('ATG Bodyweight Ratio & Rep Count Templates', () => {
    const template = TEMPLATES.atg;

    it('evaluates Romanian Deadlift at 12 reps against bodyweight', () => {
      const S = {
        unit: 'kg',
        body: 'male',
        bodyweight: [{ d: '2026-01-01', w: 80 }],
        workouts: [
          { d: '2026-01-02', entries: [{ id: '0085', sets: [{ done: true, w: 80, r: 12 }] }] },
        ],
      };

      const results = computeBalance(S as any, template);
      const rdl = results.find((r) => r.roleId === 'romanianDeadlift');
      assert.ok(rdl);
      assert.equal(rdl.status, BALANCE_STATUSES.BALANCED);
      assert.equal(Math.round(rdl.actualPct!), 100);
    });

    it('adjusts target for female lifters when template specifies female target', () => {
      const S = {
        unit: 'kg',
        body: 'female',
        bodyweight: [{ d: '2026-01-01', w: 80 }],
        workouts: [
          { d: '2026-01-02', entries: [{ id: '0085', sets: [{ done: true, w: 64, r: 12 }] }] }, // 64kg is 80% of 80kg
        ],
      };

      const results = computeBalance(S as any, template);
      const rdl = results.find((r) => r.roleId === 'romanianDeadlift');
      assert.ok(rdl);
      assert.equal(rdl.targetPct, 80);
      assert.equal(rdl.status, BALANCE_STATUSES.BALANCED);
      assert.equal(Math.round(rdl.actualPct!), 80);
    });
  });

  describe('evaluateStructuralRatio backwards-compatible helper', () => {
    it('evaluates two sets directly and returns posture check structure', () => {
      const res = evaluateStructuralRatio(
        { weight: 100, reps: 1 },
        { weight: 82, reps: 1 },
        82,
        'Incline Bench Press',
        'incline_bench'
      );

      assert.equal(res.status, 'balanced');
      assert.equal(res.observedRatioPct, 82);
    });
  });

  describe('OpenGym Structural Balance Parity States', () => {
    const template = TEMPLATES.poliquin;

    it('sets needsAnchor when anchor lift has no completed sets', () => {
      const S = {
        unit: 'kg',
        workouts: [
          // Deadlift logged, but High-Bar Squat anchor has no sets
          { d: '2026-01-01', entries: [{ id: '0032', sets: [{ done: true, w: 140, r: 5 }] }] },
        ],
      };
      const results = computeBalance(S as any, template);
      const dl = results.find((r) => r.roleId === 'deadlift');
      assert.ok(dl);
      assert.equal(dl.status, BALANCE_STATUSES.NO_DATA);
      assert.equal(dl.needsAnchor, true);
    });

    it('sets needsBodyweight for bodyweight-ratio roles when weigh-in is missing', () => {
      const atgTemplate = TEMPLATES.atg;
      const S = {
        unit: 'kg',
        bodyweight: [], // No weigh-in recorded
        workouts: [
          { d: '2026-01-01', entries: [{ id: '0085', sets: [{ done: true, w: 80, r: 12 }] }] },
        ],
      };
      const results = computeBalance(S as any, atgTemplate);
      const rdl = results.find((r) => r.roleId === 'romanianDeadlift');
      assert.ok(rdl);
      assert.equal(rdl.needsBodyweight, true);
    });

    it('scores rep-count roles at pure bodyweight against target reps', () => {
      const atgTemplate = TEMPLATES.atg;
      const S = {
        unit: 'kg',
        workouts: [
          // 0652: Pull-ups, target is 10 reps
          { d: '2026-01-01', entries: [{ id: '0652', sets: [{ done: true, w: 0, r: 10 }] }] },
        ],
      };
      const results = computeBalance(S as any, atgTemplate);
      const pullups = results.find((r) => r.roleId === 'pullups');
      assert.ok(pullups);
      assert.equal(pullups.status, BALANCE_STATUSES.BALANCED);
      assert.equal(pullups.actualPct, 100);
    });
  });
});
