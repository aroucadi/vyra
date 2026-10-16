/**
 * @file entitlements.ts
 * @description Code-level feature gating middleware and entitlement checker.
 * Enforces boundaries between Free Tier and Vyra Pro ($19/mo) based on Pricing Strategy Architect specifications.
 */

export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  expiresAt?: string | null;
}

export type EntitledFeature =
  | 'basic_workout_logging'
  | 'catalogue_browsing'
  | 'stealth_gym_mode'
  | 'plate_calculator'
  | 'anatomical_tension_spotlight'
  | 'substitution_copilot_preview'
  | 'progression_engine'
  | 'structural_balance_radar'
  | 'autoregulation_advanced'
  | 'gemini_biometric_synthesis';

export const TIER_CAPABILITIES: Record<SubscriptionTier, Set<EntitledFeature>> = {
  FREE: new Set([
    'basic_workout_logging',
    'catalogue_browsing',
    'stealth_gym_mode',
    'plate_calculator',
    'anatomical_tension_spotlight',
    'substitution_copilot_preview',
  ]),
  PRO: new Set([
    'basic_workout_logging',
    'catalogue_browsing',
    'stealth_gym_mode',
    'plate_calculator',
    'anatomical_tension_spotlight',
    'substitution_copilot_preview',
    'progression_engine',
    'structural_balance_radar',
    'autoregulation_advanced',
    'gemini_biometric_synthesis',
  ]),
  ENTERPRISE: new Set([
    'basic_workout_logging',
    'catalogue_browsing',
    'stealth_gym_mode',
    'plate_calculator',
    'anatomical_tension_spotlight',
    'substitution_copilot_preview',
    'progression_engine',
    'structural_balance_radar',
    'autoregulation_advanced',
    'gemini_biometric_synthesis',
  ]),
};

export class EntitlementError extends Error {
  public readonly code = 'ENTITLEMENT_REQUIRED';
  public readonly requiredTier = 'PRO';
  public readonly upgradeUrl = '/pricing';

  constructor(public readonly feature: EntitledFeature, message?: string) {
    super(message || `Feature '${feature}' requires a Vyra Pro ($19/mo) subscription.`);
    this.name = 'EntitlementError';
  }
}

/**
 * Checks if a user tier has access to a specific feature.
 */
export function hasEntitlement(tier: SubscriptionTier, feature: EntitledFeature): boolean {
  const capabilities = TIER_CAPABILITIES[tier] || TIER_CAPABILITIES.FREE;
  return capabilities.has(feature);
}

/**
 * Throws EntitlementError if user tier lacks entitlement for feature.
 */
export function assertEntitlement(tier: SubscriptionTier, feature: EntitledFeature): void {
  if (!hasEntitlement(tier, feature)) {
    throw new EntitlementError(feature);
  }
}
