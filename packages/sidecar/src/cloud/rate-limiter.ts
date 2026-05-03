import type { RateLimitResult } from './types.js';

/**
 * In-memory sliding window rate limiter.
 * Enforces plan-level daily check limits.
 * Unlimited plans use limit = -1.
 */
export class CloudRateLimiter {
  private count: number = 0;
  private windowStart: number;
  private readonly limit: number;
  private readonly windowMs: number;

  /**
   * @param limit - Maximum requests per window. Use -1 for unlimited.
   * @param windowMs - Window duration in milliseconds (default: 24 hours).
   */
  constructor(limit: number, windowMs: number = 86_400_000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.windowStart = Date.now();
  }

  /** Check if a request is allowed without incrementing. */
  check(): RateLimitResult {
    this.maybeResetWindow();

    // Unlimited plan
    if (this.limit < 0) {
      return { allowed: true, remaining: -1, resetAt: this.windowStart + this.windowMs };
    }

    const remaining = Math.max(0, this.limit - this.count);
    return {
      allowed: this.count < this.limit,
      remaining,
      resetAt: this.windowStart + this.windowMs,
    };
  }

  /** Increment the counter. Call after a successful request. */
  increment(): void {
    this.maybeResetWindow();
    this.count++;
  }

  /** Update the limit (e.g., after plan change). */
  updateLimit(newLimit: number): void {
    if (this.limit === newLimit) return;
    (this as unknown as { limit: number }).limit = newLimit;
  }

  /** Get current count for diagnostics. */
  getCount(): number {
    this.maybeResetWindow();
    return this.count;
  }

  /** Reset the window if it has elapsed. */
  private maybeResetWindow(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.count = 0;
      this.windowStart = now;
    }
  }
}
