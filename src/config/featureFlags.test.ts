import { describe, it, expect, beforeEach } from 'vitest';
import {
  FEATURES,
  isFeatureEnabled,
  setFeatureFlag,
  resetFeatureFlag,
  getAllFeatureFlags,
} from './featureFlags';

describe('featureFlags', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return the default value for an active feature', () => {
    expect(isFeatureEnabled('COPILOT_MANAGEMENT')).toBe(true);
  });

  it('should return the default value for a disabled feature', () => {
    expect(isFeatureEnabled('ANALYTICS')).toBe(false);
  });

  it('should honor localStorage override (enable a disabled flag)', () => {
    expect(isFeatureEnabled('ANALYTICS')).toBe(false);

    setFeatureFlag('ANALYTICS', true);
    expect(isFeatureEnabled('ANALYTICS')).toBe(true);
  });

  it('should honor localStorage override (disable an active flag)', () => {
    expect(isFeatureEnabled('COPILOT_MANAGEMENT')).toBe(true);

    setFeatureFlag('COPILOT_MANAGEMENT', false);
    expect(isFeatureEnabled('COPILOT_MANAGEMENT')).toBe(false);
  });

  it('should reset a flag to its default value', () => {
    setFeatureFlag('ANALYTICS', true);
    expect(isFeatureEnabled('ANALYTICS')).toBe(true);

    resetFeatureFlag('ANALYTICS');
    expect(isFeatureEnabled('ANALYTICS')).toBe(false);
  });

  it('should return all feature flags with effective values', () => {
    setFeatureFlag('ANALYTICS', true);
    const all = getAllFeatureFlags();

    expect(all.COPILOT_MANAGEMENT).toBe(true);
    expect(all.ANALYTICS).toBe(true); // overridden
    expect(all.DARK_LIGHT_TOGGLE).toBe(false); // default
    expect(Object.keys(all).length).toBe(Object.keys(FEATURES).length);
  });
});
