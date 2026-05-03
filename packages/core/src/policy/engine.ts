import type { PolicyContext, PolicyDocument, PolicyResult, RuleMatch, IPolicyEngine } from './types.js';

/**
 * Deterministic policy engine. First matching rule wins.
 * Fail-closed: no policy or evaluation error yields deny.
 */
export class PolicyEngine implements IPolicyEngine {
  private policy: PolicyDocument | null = null;

  loadPolicy(doc: PolicyDocument): void {
    if (doc.rules.length === 0 && doc.defaultDecision === 'allow') {
      // Reject permissive default with no rules to avoid accidental allow-all.
      throw new Error('Policy document must not have default allow with zero rules');
    }
    this.policy = { ...doc, rules: [...doc.rules] };
  }

  getLoadedPolicy(): PolicyDocument | null {
    return this.policy ? { ...this.policy } : null;
  }

  async evaluate(ctx: PolicyContext): Promise<PolicyResult> {
    try {
      if (!this.policy) {
        return { decision: 'deny', reason: 'no policy loaded' };
      }
      for (const rule of this.policy.rules) {
        if (this.matches(rule.match, ctx)) {
          return {
            decision: rule.decision,
            reason: rule.reason ?? `rule: ${rule.id}`,
          };
        }
      }
      return {
        decision: this.policy.defaultDecision,
        reason: this.policy.defaultReason,
      };
    } catch (err) {
      // Fail closed: any exception -> deny
      const message = err instanceof Error ? err.message : String(err);
      return { decision: 'deny', reason: `policy error: ${message}` };
    }
  }

  private matches(match: RuleMatch, ctx: PolicyContext): boolean {
    if (match.agentIds != null && match.agentIds.length > 0) {
      if (!match.agentIds.includes(ctx.agentId)) return false;
    }
    if (match.actions != null && match.actions.length > 0) {
      if (!match.actions.includes(ctx.action)) return false;
    }
    if (match.resources != null && match.resources.length > 0 && ctx.resource != null) {
      if (!match.resources.includes(ctx.resource)) return false;
    }
    if (match.attributes != null && Object.keys(match.attributes).length > 0) {
      for (const [k, v] of Object.entries(match.attributes)) {
        if (ctx.attributes[k] !== v) return false;
      }
    }
    return true;
  }
}
