import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasEntitlement,
  assertEntitlement,
  EntitlementError,
  SubscriptionTier,
} from '@/lib/entitlements';

describe('Vyra Monetization & Entitlements Gate', () => {
  it('allows Free tier access to core gym utility features', () => {
    assert.equal(hasEntitlement('FREE', 'basic_workout_logging'), true);
    assert.equal(hasEntitlement('FREE', 'catalogue_browsing'), true);
    assert.equal(hasEntitlement('FREE', 'stealth_gym_mode'), true);
    assert.equal(hasEntitlement('FREE', 'plate_calculator'), true);
  });

  it('blocks Free tier from premium biomechanical algorithms', () => {
    assert.equal(hasEntitlement('FREE', 'progression_engine'), false);
    assert.equal(hasEntitlement('FREE', 'structural_balance_radar'), false);
    assert.equal(hasEntitlement('FREE', 'gemini_biometric_synthesis'), false);

    assert.throws(
      () => assertEntitlement('FREE', 'progression_engine'),
      (err: any) => {
        assert.ok(err instanceof EntitlementError);
        assert.equal(err.code, 'ENTITLEMENT_REQUIRED');
        assert.equal(err.requiredTier, 'PRO');
        return true;
      }
    );
  });

  it('allows Pro tier full access across all capabilities', () => {
    const proTier: SubscriptionTier = 'PRO';
    assert.equal(hasEntitlement(proTier, 'basic_workout_logging'), true);
    assert.equal(hasEntitlement(proTier, 'plate_calculator'), true);
    assert.equal(hasEntitlement(proTier, 'progression_engine'), true);
    assert.equal(hasEntitlement(proTier, 'structural_balance_radar'), true);
    assert.equal(hasEntitlement(proTier, 'gemini_biometric_synthesis'), true);

    assert.doesNotThrow(() => {
      assertEntitlement(proTier, 'progression_engine');
      assertEntitlement(proTier, 'structural_balance_radar');
    });
  });
});
