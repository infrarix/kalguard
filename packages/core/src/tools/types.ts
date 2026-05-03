import type { ToolInvocation } from '../types.js';

export type { ToolInvocation };

/** Tool mediation result: allow, deny, or require_approval. */
export interface ToolMediationResult {
  readonly allowed: boolean;
  readonly decision: 'allow' | 'deny' | 'require_approval';
  readonly reason?: string;
  readonly schemaValid: boolean;
}

/** Tool allowlist entry: tool name + optional argument schema. */
export interface ToolAllowlistEntry {
  readonly name: string;
  readonly argumentSchema?: Record<string, { type: string; required?: boolean }>;
}

/** Mediator config: allowlist, denylist, rate limits. */
export interface ToolMediatorConfig {
  readonly allowlist: ReadonlyArray<ToolAllowlistEntry>;
  readonly denylist?: ReadonlyArray<string>;
  readonly commandDenylist?: ReadonlyArray<string | RegExp>;
  readonly rateLimitPerAgent?: number; // requests per minute
}
