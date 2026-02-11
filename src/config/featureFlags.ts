// ==============================================
// Feature Flags
// ==============================================
// Toggle features on/off during development.
// Override any flag in localStorage: localStorage.setItem('ff_ANALYTICS', 'true')

export const FEATURES = {
  // Active features
  COPILOT_MANAGEMENT: true,
  TWO_FACTOR_CHECKER: true,
  ACCESS_MANAGEMENT: true,
  SEARCH: true,

  // In development
  ANALYTICS: false,
  AUDIT_LOGS: false,
  SMART_RECOMMENDATIONS: false,

  // Planned
  NOTIFICATION_SYSTEM: false,
  DARK_LIGHT_TOGGLE: false,
  BULK_SCHEDULER: false,
  SLACK_NOTIFICATIONS: false,
  COMMAND_PALETTE: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled.
 * Supports localStorage overrides for dev/testing.
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Check localStorage override first
  const override = localStorage.getItem(`ff_${feature}`);
  if (override !== null) return override === 'true';

  return FEATURES[feature];
}

/**
 * Enable/disable a feature flag at runtime (persists in localStorage).
 */
export function setFeatureFlag(feature: FeatureFlag, enabled: boolean): void {
  localStorage.setItem(`ff_${feature}`, String(enabled));
}

/**
 * Reset a feature flag to its default value.
 */
export function resetFeatureFlag(feature: FeatureFlag): void {
  localStorage.removeItem(`ff_${feature}`);
}

/**
 * Get all feature flags with their current effective values.
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>;
  for (const key of Object.keys(FEATURES) as FeatureFlag[]) {
    flags[key] = isFeatureEnabled(key);
  }
  return flags;
}
