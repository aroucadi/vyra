import { describe, it, expect } from 'vitest';
import { estimate1RM } from '@/lib/training-math/onerm';
import { calculateBarbellPlates } from '@/lib/training-math/plates';
import { evaluateStructuralRatio } from '@/lib/training-math/structural-balance';

describe('Training Math Engine', () => {
  describe('1RM Estimation', () => {
    it('returns exact weight for a 1-rep set', () => {
      expect(estimate1RM(100, 1)).toBe(100);
    });

    it('estimates 1RM using Epley default formula for submaximal reps', () => {
      // 100 * (1 + 10 / 30) = 133.3
      const estimate = estimate1RM(100, 10);
      expect(estimate).toBe(133.3);
    });

    it('adjusts estimate when RIR is provided', () => {
      // 10 reps with 2 RIR -> effective reps = 12 (weighted ensemble yields 138.7kg vs 133.3kg at 0 RIR)
      const estimate = estimate1RM(100, 10, { rir: 2 });
      expect(estimate).toBe(138.7);
    });

    it('returns null for extreme rep counts beyond cap', () => {
      expect(estimate1RM(50, 25)).toBeNull();
    });
  });

  describe('Plate Math Calculator', () => {
    it('returns empty plates when target weight equals standard bar weight', () => {
      const res = calculateBarbellPlates(20, 'kg');
      expect(res.weightPerSide).toBe(0);
      expect(res.platesPerSide).toEqual([]);
      expect(res.remainder).toBe(0);
    });

    it('correctly calculates 100kg barbell plate layout (40kg per side)', () => {
      const res = calculateBarbellPlates(100, 'kg');
      expect(res.weightPerSide).toBe(40);
      // 40kg per side with default [25, 20, 15, 10, 5, 2.5, 1.25]:
      // 25kg + 15kg = 40kg
      expect(res.platesPerSide).toEqual([25, 15]);
      expect(res.remainder).toBe(0);
    });
  });

  describe('Structural Balance Evaluator', () => {
    it('detects balanced ratio according to Poliquin standard', () => {
      // Anchor: Close Grip Bench 100kg x 1 = 100 1RM
      // Secondary: Incline Bench 82kg x 1 = 82 1RM -> Exactly 82%
      const res = evaluateStructuralRatio(
        { weight: 100, reps: 1 },
        { weight: 82, reps: 1 },
        82,
        'Incline Bench Press',
        'incline_bench'
      );

      expect(res.status).toBe('balanced');
      expect(res.observedRatioPct).toBe(82);
    });

    it('flags weak structural ratio when lagging by >10%', () => {
      const res = evaluateStructuralRatio(
        { weight: 100, reps: 1 },
        { weight: 60, reps: 1 }, // 60% vs 82% target -> 22% gap
        82,
        'Incline Bench Press',
        'incline_bench'
      );

      expect(res.status).toBe('weak');
      expect(res.observedRatioPct).toBe(60);
    });
  });
});
