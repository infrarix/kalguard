import { z } from 'zod';

/** Sidecar server config. */
export const SidecarConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(9292),
  host: z.string().default('0.0.0.0'),
  /**
   * @deprecated Use dashboard-managed access tokens instead. The sidecar will receive the
   * signing secret automatically via cloud license sync when KALGUARD_API_KEY is set.
   * This env var is retained for local-only / self-hosted mode without KalGuard Cloud.
   */
  tokenSecret: z.string().min(1).optional(),
  policyPath: z.string().optional(),
  policyDefaultDeny: z.boolean().default(true),
  /** If true and policyPath is set, watch policy file and hot-reload on change. */
  policyWatch: z.boolean().default(false),
  /** Debounce interval for policy file watch (ms). */
  policyWatchIntervalMs: z.number().int().min(100).max(60_000).default(500),
  promptBlockThreshold: z.number().min(0).max(100).default(70),
  promptSanitizeThreshold: z.number().min(0).max(100).default(50),
  toolRateLimitPerAgent: z.number().int().min(0).optional(),
  auditLogPath: z.string().optional(),
  /** KalGuard Cloud API key for Pro features. If unset, runs in local-only mode. */
  apiKey: z.string().min(1).optional(),
  /** KalGuard Cloud API base URL. */
  cloudBaseUrl: z.string().default('https://api.kalguard.dev'),
  /** License refresh interval in ms (min 10s, max 10min, default 5min). */
  cloudSyncIntervalMs: z.number().int().min(10_000).max(600_000).default(300_000),
});

export type SidecarConfig = z.infer<typeof SidecarConfigSchema>;

/** Load and validate config from env/object. */
export function loadSidecarConfig(
  env: Record<string, unknown> = process.env as unknown as Record<string, unknown>,
): SidecarConfig {
  const raw = {
    port: env.KALGUARD_PORT != null ? Number(env.KALGUARD_PORT) : 9292,
    host: env.KALGUARD_HOST ?? '0.0.0.0',
    tokenSecret: env.KALGUARD_TOKEN_SECRET,
    policyPath: env.KALGUARD_POLICY_PATH,
    policyDefaultDeny: env.KALGUARD_POLICY_DEFAULT_DENY !== 'false',
    policyWatch: env.KALGUARD_POLICY_WATCH === 'true',
    policyWatchIntervalMs:
      env.KALGUARD_POLICY_WATCH_INTERVAL_MS != null ? Number(env.KALGUARD_POLICY_WATCH_INTERVAL_MS) : 500,
    promptBlockThreshold:
      env.KALGUARD_PROMPT_BLOCK_THRESHOLD != null ? Number(env.KALGUARD_PROMPT_BLOCK_THRESHOLD) : 70,
    promptSanitizeThreshold:
      env.KALGUARD_PROMPT_SANITIZE_THRESHOLD != null ? Number(env.KALGUARD_PROMPT_SANITIZE_THRESHOLD) : 50,
    toolRateLimitPerAgent: env.KALGUARD_TOOL_RATE_LIMIT != null ? Number(env.KALGUARD_TOOL_RATE_LIMIT) : undefined,
    auditLogPath: env.KALGUARD_AUDIT_LOG_PATH,
    apiKey: env.KALGUARD_API_KEY ?? undefined,
    cloudBaseUrl: env.KALGUARD_CLOUD_URL ?? 'https://api.kalguard.dev',
    cloudSyncIntervalMs:
      env.KALGUARD_CLOUD_SYNC_INTERVAL_MS != null ? Number(env.KALGUARD_CLOUD_SYNC_INTERVAL_MS) : 300_000,
  };
  return SidecarConfigSchema.parse(raw);
}
