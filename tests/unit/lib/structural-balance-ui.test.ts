import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TEMPLATES,
  computeBalance,
  BALANCE_STATUSES,
} from '../../../src/lib/training-math/structural-balance';
import { hasEntitlement } from '../../../src/lib/entitlements';

describe('Structural Balance Radar & Intelligent Posture Suite', () => {
  describe('Templates and Benchmark Definitions', () => {
    it('defines Poliquin, Thibaudeau, and ATG benchmark templates', () => {
      assert.ok(TEMPLATES.poliquin);
      assert.ok(TEMPLATES.thibaudeauPowerlifting);
      assert.ok(TEMPLATES.atg);

      assert.strictEqual(TEMPLATES.poliquin.roles.length >= 4, true);
      assert.strictEqual(TEMPLATES.thibaudeauPowerlifting.roles.length >= 4, true);
    });

    it('verifies Poliquin standards (Deadlift 125%, Incline 91%)', () => {
      const deadliftRole = TEMPLATES.poliquin.roles.find((r) => r.id === 'deadlift');
      assert.ok(deadliftRole);
      assert.strictEqual(deadliftRole.targetPct, 125);

      const inclineRole = TEMPLATES.poliquin.roles.find((r) => r.id === 'inclineBench');
      assert.ok(inclineRole);
      assert.strictEqual(inclineRole.targetPct, 91);
    });
  });

  describe('computeBalance Evaluation Logic', () => {
    it('evaluates structural balance across workouts cleanly', () => {
      const mockContext = {
        unit: 'kg',
        bodyweight: [{ d: '2026-10-01', w: 80 }],
        workouts: [
          {
            d: '2026-10-01',
            start: 1000,
            bw: 80,
            entries: [
              {
                id: '0043', // Barbell Squat (High bar anchor)
                sets: [{ done: true, w: 100, r: 5 }],
              },
              {
                id: '0032', // Deadlift (125% target)
                sets: [{ done: true, w: 125, r: 5 }],
              },
            ],
          },
        ],
      };

      const results = computeBalance(mockContext, TEMPLATES.poliquin);
      assert.strictEqual(Array.isArray(results), true);
      assert.strictEqual(results.length, TEMPLATES.poliquin.roles.length);

      const squatResult = results.find((r) => r.roleId === 'highBarSquat');
      assert.ok(squatResult);
      assert.strictEqual(squatResult.status, BALANCE_STATUSES.BALANCED);
    });

    it('flags lagging lifts as WEAK when ratio is below borderline band', () => {
      const mockContext = {
        unit: 'kg',
        bodyweight: [{ d: '2026-10-01', w: 80 }],
        workouts: [
          {
            d: '2026-10-01',
            start: 1000,
            bw: 80,
            entries: [
              {
                id: '0043', // Squat at 140kg
                sets: [{ done: true, w: 140, r: 5 }],
              },
              {
                id: '0032', // Deadlift at only 80kg (target should be 125% = 175kg)
                sets: [{ done: true, w: 80, r: 5 }],
              },
            ],
          },
        ],
      };

      const results = computeBalance(mockContext, TEMPLATES.poliquin);
      const deadliftResult = results.find((r) => r.roleId === 'deadlift');
      assert.ok(deadliftResult);
      assert.strictEqual(deadliftResult.status, BALANCE_STATUSES.WEAK);
    });
  });

  describe('Entitlements Gate', () => {
    it('restricts structural_balance_radar feature strictly to Pro and Enterprise', () => {
      assert.strictEqual(hasEntitlement('FREE', 'structural_balance_radar'), false);
      assert.strictEqual(hasEntitlement('PRO', 'structural_balance_radar'), true);
      assert.strictEqual(hasEntitlement('ENTERPRISE', 'structural_balance_radar'), true);
    });
  });

  describe('Posture API Route Contract', () => {
    it('executes GET /api/posture and returns structured radar evaluation payload', async () => {
      const { GET } = await import('@/app/api/posture/route');
      const { NextRequest } = await import('next/server');

      const req = new NextRequest('http://localhost/api/posture?template=poliquin');
      const res = await GET(req);

      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.strictEqual(data.template, 'poliquin');
      assert.ok(data.templateLabel);
      assert.ok(Array.isArray(data.results));
      assert.ok(data.results.length >= 4);
      assert.ok(data.labels);
      assert.ok(Object.keys(data.labels).length >= 4);
    });
  });
});
