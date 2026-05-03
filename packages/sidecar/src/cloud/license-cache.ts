import type { LicenseInfo } from './types.js';

/**
 * In-memory cache for license information with configurable TTL.
 * Prevents hitting the cloud API on every request.
 */
export class LicenseCache {
  private license: LicenseInfo | null = null;
  private cachedAt: number = 0;
  private readonly ttlMs: number;

  constructor(ttlMs: number = 300_000) {
    this.ttlMs = ttlMs;
  }

  /** Get cached license, or null if expired / not set. */
  get(): LicenseInfo | null {
    if (!this.license) return null;
    if (this.isExpired()) return null;
    return this.license;
  }

  /** Store a license in the cache. */
  set(info: LicenseInfo): void {
    this.license = info;
    this.cachedAt = Date.now();
  }

  /** Check if the cached license has expired. */
  isExpired(): boolean {
    if (!this.license) return true;
    return Date.now() - this.cachedAt >= this.ttlMs;
  }

  /** Clear the cache. */
  clear(): void {
    this.license = null;
    this.cachedAt = 0;
  }

  /** Get the TTL in milliseconds. */
  getTtlMs(): number {
    return this.ttlMs;
  }
}
