/**
 * Copyright 2025 KalGuard Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';

/** Sidecar server config. */
export const SidecarConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(9292),
  host: z.string().default('0.0.0.0'),
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
  };
  return SidecarConfigSchema.parse(raw);
}
