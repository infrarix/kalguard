import type { PromptMessage } from '../types.js';

export type { PromptMessage };

/** Classified segment: system, user, or tool. */
export type MessageSegmentKind = 'system' | 'user' | 'tool';

/** Risk level for prompt firewall. */
export type PromptRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Result of prompt firewall evaluation. */
export interface PromptFirewallResult {
  readonly allowed: boolean;
  readonly riskScore: number; // 0-100
  readonly riskLevel: PromptRiskLevel;
  readonly sanitizedMessages?: ReadonlyArray<PromptMessage>;
  readonly reason?: string;
  readonly injectionDetected: boolean;
}

/** Options for prompt firewall. */
export interface PromptFirewallOptions {
  readonly blockThreshold?: number; // 0-100, default 70
  readonly sanitizeThreshold?: number; // 0-100, default 50
}
