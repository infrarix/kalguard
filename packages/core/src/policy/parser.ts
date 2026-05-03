import type { PolicyDocument, PolicyRule, RuleMatch } from './types.js';
import type { PolicyDecision } from '../types.js';

/**
 * Parse policy from JSON. Validates structure; invalid input throws.
 * Used for hot-reload: load from file/API and pass to engine.
 */
export function parsePolicyDocument(raw: unknown): PolicyDocument {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('Policy must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;
  const version = String(obj.version ?? '1.0');
  const defaultDecision = validateDecision(obj.defaultDecision, 'defaultDecision');
  const defaultReason = String(obj.defaultReason ?? 'default policy');
  const rulesRaw = obj.rules;
  if (!Array.isArray(rulesRaw)) {
    throw new Error('Policy must have a "rules" array');
  }
  const rules: PolicyRule[] = rulesRaw.map((r: unknown, i: number) => parseRule(r, i));
  return { version, rules, defaultDecision, defaultReason };
}

function validateDecision(value: unknown, field: string): PolicyDecision {
  const s = typeof value === 'string' ? value : String(value);
  if (s !== 'allow' && s !== 'deny' && s !== 'require_approval') {
    throw new Error(`Invalid ${field}: must be allow, deny, or require_approval`);
  }
  return s as PolicyDecision;
}

function parseRule(raw: unknown, index: number): PolicyRule {
  if (raw == null || typeof raw !== 'object') {
    throw new Error(`Rule at index ${index} must be an object`);
  }
  const obj = raw as Record<string, unknown>;
  const id = String(obj.id ?? `rule-${index}`);
  const decision = validateDecision(obj.decision, `rules[${index}].decision`);
  const match = parseMatch(obj.match);
  return {
    id,
    match,
    decision,
    ...(obj.description != null ? { description: String(obj.description) } : {}),
    ...(obj.reason != null ? { reason: String(obj.reason) } : {}),
  };
}

function parseMatch(raw: unknown): RuleMatch {
  if (raw == null || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  return {
    ...(Array.isArray(obj.agentIds) ? { agentIds: obj.agentIds.map((x) => String(x)) } : {}),
    ...(Array.isArray(obj.actions) ? { actions: obj.actions.map((x) => String(x)) } : {}),
    ...(Array.isArray(obj.resources) ? { resources: obj.resources.map((x) => String(x)) } : {}),
    ...(obj.attributes != null && typeof obj.attributes === 'object' && !Array.isArray(obj.attributes)
      ? { attributes: obj.attributes as Record<string, unknown> }
      : {}),
  };
}
