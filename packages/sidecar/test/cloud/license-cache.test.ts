import { LicenseCache } from '../../src/cloud/license-cache.js';
import type { LicenseInfo } from '../../src/cloud/types.js';

const MOCK_LICENSE: LicenseInfo = {
  valid: true,
  tier: 'pro',
  orgId: 'org_123',
  limits: { checksPerDay: 100000, maxAgents: -1, auditRetentionDays: 90, features: ['analytics'] },
  expiresAt: '2027-01-01T00:00:00Z',
};

describe('LicenseCache', () => {
  it('returns null when empty', () => {
    const cache = new LicenseCache(5000);
    expect(cache.get()).toBeNull();
  });

  it('returns cached license within TTL', () => {
    const cache = new LicenseCache(5000);
    cache.set(MOCK_LICENSE);
    expect(cache.get()).toEqual(MOCK_LICENSE);
  });

  it('returns null after TTL expires', () => {
    const cache = new LicenseCache(1); // 1ms TTL
    cache.set(MOCK_LICENSE);

    // Manually advance past TTL
    const origNow = Date.now;
    Date.now = () => origNow() + 10;
    try {
      expect(cache.get()).toBeNull();
      expect(cache.isExpired()).toBe(true);
    } finally {
      Date.now = origNow;
    }
  });

  it('isExpired returns true when empty', () => {
    const cache = new LicenseCache(5000);
    expect(cache.isExpired()).toBe(true);
  });

  it('isExpired returns false within TTL', () => {
    const cache = new LicenseCache(60000);
    cache.set(MOCK_LICENSE);
    expect(cache.isExpired()).toBe(false);
  });

  it('clear removes cached license', () => {
    const cache = new LicenseCache(60000);
    cache.set(MOCK_LICENSE);
    expect(cache.get()).toEqual(MOCK_LICENSE);

    cache.clear();
    expect(cache.get()).toBeNull();
  });

  it('getTtlMs returns configured TTL', () => {
    const cache = new LicenseCache(42000);
    expect(cache.getTtlMs()).toBe(42000);
  });

  it('overwrites previous license on set', () => {
    const cache = new LicenseCache(60000);
    cache.set(MOCK_LICENSE);

    const updated: LicenseInfo = { ...MOCK_LICENSE, tier: 'enterprise' };
    cache.set(updated);

    expect(cache.get()?.tier).toBe('enterprise');
  });
});
