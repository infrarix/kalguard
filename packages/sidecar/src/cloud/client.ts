import type { LicenseInfo, UsageEvent, UsageReportResult, PlanLimits } from './types.js';
import { OFFLINE_LICENSE } from './types.js';

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1_000;

/**
 * Thin HTTP client for the KalGuard Cloud API.
 * Contains ZERO business logic — only HTTP calls with retry and timeout.
 * All errors are caught and safe defaults returned (never throws).
 */
export class KalGuardCloudClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, baseUrl: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Validate license with the cloud API.
   * Returns OFFLINE_LICENSE on any failure (graceful degradation).
   */
  async validateLicense(): Promise<LicenseInfo> {
    try {
      const data = await this.request<{
        valid: boolean;
        tier: string;
        orgId: string;
        limits: PlanLimits;
        expiresAt: string;
        tokenSigningSecret?: string;
        revokedTokenHashes?: string[];
      }>('POST', '/api/v1/license/validate', undefined);

      if (!data || typeof data.valid !== 'boolean') {
        return OFFLINE_LICENSE;
      }

      return {
        valid: data.valid,
        tier: parseTier(data.tier),
        orgId: String(data.orgId ?? ''),
        limits: {
          checksPerDay: Number(data.limits?.checksPerDay ?? 0),
          maxAgents: Number(data.limits?.maxAgents ?? 0),
          auditRetentionDays: Number(data.limits?.auditRetentionDays ?? 0),
          features: Array.isArray(data.limits?.features) ? data.limits.features.map(String) : [],
        },
        expiresAt: String(data.expiresAt ?? new Date(0).toISOString()),
        tokenSigningSecret: typeof data.tokenSigningSecret === 'string' ? data.tokenSigningSecret : undefined,
        revokedTokenHashes: Array.isArray(data.revokedTokenHashes) ? data.revokedTokenHashes.map(String) : [],
      };
    } catch {
      return OFFLINE_LICENSE;
    }
  }

  /**
   * Report usage events to the cloud API.
   * Returns `{ accepted: false, remaining: 0 }` on any failure.
   */
  async reportUsage(events: readonly UsageEvent[]): Promise<UsageReportResult> {
    if (events.length === 0) {
      return { accepted: true, remaining: -1 };
    }
    try {
      const data = await this.request<UsageReportResult>('POST', '/api/v1/usage/report', { events });
      if (!data || typeof data.accepted !== 'boolean') {
        return { accepted: false, remaining: 0 };
      }
      return {
        accepted: data.accepted,
        remaining: Number(data.remaining ?? 0),
      };
    } catch {
      return { accepted: false, remaining: 0 };
    }
  }

  /**
   * Make an HTTP request with retry and timeout.
   * Retries up to MAX_RETRIES times with exponential backoff.
   */
  private async request<T>(method: string, path: string, body: unknown): Promise<T | null> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (res.status === 401 || res.status === 403) {
          // Auth failures should not retry
          return null;
        }

        if (res.ok) {
          return (await res.json()) as T;
        }

        // Server errors: retry
        if (res.status >= 500) {
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        }

        // Client errors (except auth): don't retry
        return null;
      } catch (err) {
        lastError = err;
        // Network errors and timeouts: retry
        continue;
      }
    }

    console.error('[kalguard:cloud] request failed after retries:', lastError);
    return null;
  }
}

function parseTier(tier: unknown): 'free' | 'pro' | 'enterprise' {
  if (tier === 'pro' || tier === 'enterprise') return tier;
  return 'free';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
