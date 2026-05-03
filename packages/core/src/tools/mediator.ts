import type { ToolInvocation } from '../types.js';
import type { ToolMediationResult, ToolMediatorConfig } from './types.js';

/** Default command denylist: no shell execution, no eval. */
const DEFAULT_COMMAND_DENYLIST: ReadonlyArray<RegExp> = [
  /^\s*(bash|sh|zsh|cmd|powershell)\s+/i,
  /^\s*eval\s*\(/i,
  /^\s*exec\s*\(/i,
  /\|\s*sh\s*$/i,
  /\$\s*\(/i,
  /`[^`]*`/,
];

/**
 * No direct tool execution without mediation.
 * Allowlist-based; argument schema validation; command denylist; rate limiting.
 */
export class ToolMediator {
  private config: ToolMediatorConfig;
  private readonly usageByAgent: Map<string, { count: number; windowStart: number }> = new Map();
  private readonly windowMs = 60_000;

  constructor(config: ToolMediatorConfig) {
    this.config = { ...config };
    if (!this.config.allowlist || this.config.allowlist.length === 0) {
      throw new Error('ToolMediator requires a non-empty allowlist');
    }
  }

  updateConfig(config: Partial<ToolMediatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  mediate(invocation: ToolInvocation): ToolMediationResult {
    const allowlist = this.config.allowlist;
    const denylist = this.config.denylist ?? [];
    const commandDenylist = [
      ...DEFAULT_COMMAND_DENYLIST,
      ...(this.config.commandDenylist ?? []).map((p) => (typeof p === 'string' ? new RegExp(escapeRe(p), 'i') : p)),
    ];
    const name = invocation.toolName;
    if (denylist.includes(name)) {
      return { allowed: false, decision: 'deny', reason: 'tool on denylist', schemaValid: true };
    }
    const entry = allowlist.find((e) => e.name === name);
    if (!entry) {
      return { allowed: false, decision: 'deny', reason: 'tool not on allowlist', schemaValid: true };
    }
    const schemaValid = validateArguments(invocation.arguments, entry.argumentSchema);
    if (!schemaValid) {
      return { allowed: false, decision: 'deny', reason: 'argument schema validation failed', schemaValid: false };
    }
    for (const re of commandDenylist) {
      const str = JSON.stringify(invocation.arguments);
      if (re.test(str)) {
        return { allowed: false, decision: 'deny', reason: 'command denylist matched', schemaValid: true };
      }
    }
    const rateLimit = this.config.rateLimitPerAgent;
    if (rateLimit != null && rateLimit > 0) {
      const ok = this.checkRateLimit(invocation.agentId, rateLimit);
      if (!ok) {
        return { allowed: false, decision: 'deny', reason: 'rate limit exceeded', schemaValid: true };
      }
    }
    return { allowed: true, decision: 'allow', schemaValid: true };
  }

  private checkRateLimit(agentId: string, limit: number): boolean {
    const now = Date.now();
    let entry = this.usageByAgent.get(agentId);
    if (!entry) {
      this.usageByAgent.set(agentId, { count: 1, windowStart: now });
      return true;
    }
    if (now - entry.windowStart >= this.windowMs) {
      entry = { count: 1, windowStart: now };
      this.usageByAgent.set(agentId, entry);
      return true;
    }
    entry.count++;
    return entry.count <= limit;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateArguments(
  args: Readonly<Record<string, unknown>>,
  schema?: Record<string, { type: string; required?: boolean }>,
): boolean {
  if (!schema) return true;
  for (const [key, def] of Object.entries(schema)) {
    const value = args[key];
    if (def.required && value === undefined) return false;
    if (value === undefined) continue;
    const t = typeof value;
    if (def.type === 'string' && t !== 'string') return false;
    if (def.type === 'number' && t !== 'number') return false;
    if (def.type === 'boolean' && t !== 'boolean') return false;
    if (def.type === 'object' && (t !== 'object' || value === null)) return false;
    if (def.type === 'array' && !Array.isArray(value)) return false;
  }
  return true;
}
