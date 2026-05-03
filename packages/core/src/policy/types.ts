import type { PolicyContext, PolicyDecision, PolicyResult } from '../types.js';

export type { PolicyContext, PolicyDecision, PolicyResult };

/** Rule in policy DSL: condition -> decision. */
export interface PolicyRule {
  readonly id: string;
  readonly description?: string;
  readonly match: RuleMatch;
  readonly decision: PolicyDecision;
  readonly reason?: string;
}

/** Match expression: all must hold (AND). */
export interface RuleMatch {
  readonly agentIds?: string[];
  readonly actions?: string[];
  readonly resources?: string[];
  readonly attributes?: Record<string, unknown>;
}

/** Policy document: ordered list of rules. First match wins. */
export interface PolicyDocument {
  readonly version: string;
  readonly rules: ReadonlyArray<PolicyRule>;
  readonly defaultDecision: PolicyDecision;
  readonly defaultReason: string;
}

/** Policy engine interface: deterministic, hot-reloadable. */
export interface IPolicyEngine {
  evaluate(ctx: PolicyContext): Promise<PolicyResult>;
  loadPolicy(doc: PolicyDocument): void;
  getLoadedPolicy(): PolicyDocument | null;
}
