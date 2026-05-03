import { CloudRateLimiter } from '../../src/cloud/rate-limiter.js';

describe('CloudRateLimiter', () => {
  it('allows requests under limit', () => {
    const limiter = new CloudRateLimiter(10, 60000);
    const result = limiter.check();
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('decrements remaining on increment', () => {
    const limiter = new CloudRateLimiter(5, 60000);

    limiter.increment();
    limiter.increment();
    const result = limiter.check();

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it('denies when limit is reached', () => {
    const limiter = new CloudRateLimiter(3, 60000);

    limiter.increment();
    limiter.increment();
    limiter.increment();

    const result = limiter.check();
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const limiter = new CloudRateLimiter(2, 100); // 100ms window

    limiter.increment();
    limiter.increment();
    expect(limiter.check().allowed).toBe(false);

    // Advance time past window
    const origNow = Date.now;
    Date.now = () => origNow() + 200;
    try {
      const result = limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    } finally {
      Date.now = origNow;
    }
  });

  it('returns unlimited for limit = -1', () => {
    const limiter = new CloudRateLimiter(-1, 60000);

    // Even after many increments, still unlimited
    for (let i = 0; i < 100; i++) limiter.increment();

    const result = limiter.check();
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(-1);
  });

  it('provides resetAt timestamp', () => {
    const limiter = new CloudRateLimiter(10, 86400000);
    const result = limiter.check();

    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 86400000);
  });

  it('getCount returns current count', () => {
    const limiter = new CloudRateLimiter(10, 60000);
    expect(limiter.getCount()).toBe(0);

    limiter.increment();
    limiter.increment();
    expect(limiter.getCount()).toBe(2);
  });

  it('updateLimit changes the limit', () => {
    const limiter = new CloudRateLimiter(5, 60000);

    limiter.increment();
    limiter.increment();
    limiter.increment();
    limiter.increment();
    limiter.increment();
    expect(limiter.check().allowed).toBe(false);

    limiter.updateLimit(10);
    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().remaining).toBe(5);
  });

  it('handles zero limit', () => {
    const limiter = new CloudRateLimiter(0, 60000);
    expect(limiter.check().allowed).toBe(false);
    expect(limiter.check().remaining).toBe(0);
  });

  it('handles limit of 1', () => {
    const limiter = new CloudRateLimiter(1, 60000);

    expect(limiter.check().allowed).toBe(true);
    limiter.increment();
    expect(limiter.check().allowed).toBe(false);
  });
});
