/** Plan tier returned by the KalGuard Cloud API. */
export type PlanTier = 'free' | 'pro' | 'enterprise';

/** Plan limits enforced by the sidecar based on cloud license. */
export interface PlanLimits {
  readonly checksPerDay: number;
  readonly maxAgents: number;
  readonly auditRetentionDays: number;
  readonly features: readonly string[];
}

/** License information returned by the cloud API. */
export interface LicenseInfo {
  readonly valid: boolean;
  readonly tier: PlanTier;
  readonly orgId: string;
  readonly limits: PlanLimits;
  readonly expiresAt: string;
  /** Per-org signing secret for agent token verification (synced from dashboard). */
  readonly tokenSigningSecret?: string;
  /** SHA-256 hashes of recently revoked tokens (synced from dashboard). */
  readonly revokedTokenHashes?: readonly string[];
}

/** Usage event reported to the cloud API. */
export interface UsageEvent {
  readonly eventType: 'prompt_check' | 'tool_check';
  readonly agentId: string;
  readonly decision: string;
  readonly timestamp: string;
  readonly requestId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Result from the cloud usage report endpoint. */
export interface UsageReportResult {
  readonly accepted: boolean;
  readonly remaining: number;
}

/** Rate limit check result. */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

/** Default license for when cloud is unreachable (graceful degradation). */
export const OFFLINE_LICENSE: LicenseInfo = {
  valid: false,
  tier: 'free',
  orgId: '',
  limits: {
    checksPerDay: 0,
    maxAgents: 0,
    auditRetentionDays: 0,
    features: [],
  },
  expiresAt: new Date(0).toISOString(),
  // tokenSigningSecret and revokedTokenHashes are omitted (not undefined) per exactOptionalPropertyTypes
};
