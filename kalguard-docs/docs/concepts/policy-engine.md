---
sidebar_position: 2
id: policy-engine
title: Policy Engine
description: Declarative policy rules, match conditions, and evaluation semantics.
keywords: [policy, rules, engine, authorization, match, deny, allow]
---

# Policy Engine

The policy engine is the authorization core of KalGuard. Every agent request is evaluated against a **declarative JSON rule set** before a decision is issued.

## Policy File Structure

```json
{
  "version": "1.0",
  "rules": [ /* ordered array of rule objects */ ],
  "defaultDecision": "deny",
  "defaultReason": "No matching policy rule"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Schema version — currently `"1.0"`. |
| `rules` | `Rule[]` | Ordered list of rules. First match wins. |
| `defaultDecision` | `"allow"` &#124; `"deny"` | Fallback when no rule matches. |
| `defaultReason` | `string` | Human-readable reason logged with the default decision. |

:::danger
Always set `defaultDecision` to `"deny"`. A permissive default negates the value of every rule you write.
:::

## Rule Object

```json
{
  "id": "allow-agent-alpha-prompts",
  "match": {
    "agentIds": ["agent-alpha"],
    "actions": ["prompt:check"],
    "resources": ["*"],
    "metadata": { "env": "production" }
  },
  "decision": "allow",
  "reason": "Agent Alpha is authorized for prompt checks in production"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (used in audit logs). |
| `match` | No | Conditions that must all be true for this rule to apply. Omitting `match` means the rule matches everything. |
| `decision` | Yes | `"allow"` or `"deny"`. |
| `reason` | Yes | Explanation recorded in the audit trail. |

## Match Conditions

Conditions within a single `match` block use **AND** logic — every specified field must match.  
Values within an array field use **OR** logic — at least one value must match.

### `agentIds`

```json
"agentIds": ["agent-alpha"]           // exact match
"agentIds": ["agent-*"]               // wildcard prefix
"agentIds": ["*"]                     // any agent
"agentIds": ["agent-1", "agent-2"]    // OR — either agent
```

### `actions`

Built-in action identifiers:

| Action | Triggered by |
|--------|-------------|
| `prompt:check` | `POST /v1/prompt/check` |
| `tool:execute` | `POST /v1/tool/check` |
| `tool:register` | `POST /v1/tool/register` |
| `*` | Any action |

### `resources`

Matches tool names during `tool:execute` checks:

```json
"resources": ["get_weather", "search_*"]
```

### `metadata`

Arbitrary key-value pairs passed in the request context. Wildcards are supported for values:

```json
"metadata": { "env": "production", "team": "platform-*" }
```

## Evaluation Algorithm

```text
for each rule in rules (in order):
    if rule.match is undefined  →  rule matches
    if all conditions in rule.match are satisfied  →  rule matches

    if rule matches:
        return rule.decision + rule.reason    ← first match wins

return defaultDecision + defaultReason         ← no rule matched
```

Key properties:

- **First-match semantics** — put more specific rules before general ones.
- **Fail-closed** — if evaluation throws an error, the decision is always `deny`.

## Common Patterns

### Deny-by-Default with Explicit Allows

```json
{
  "version": "1.0",
  "rules": [
    { "id": "allow-prod-prompts", "match": { "agentIds": ["prod-*"], "actions": ["prompt:check"] }, "decision": "allow", "reason": "Production agents may check prompts" },
    { "id": "deny-tools-in-prod", "match": { "agentIds": ["prod-*"], "actions": ["tool:execute"] }, "decision": "deny", "reason": "Tool execution not permitted in production" }
  ],
  "defaultDecision": "deny",
  "defaultReason": "Unlisted action is denied"
}
```

### Multi-Tenant Isolation

```json
{
  "id": "tenant-acme-only",
  "match": {
    "agentIds": ["acme-*"],
    "metadata": { "tenant": "acme" }
  },
  "decision": "allow",
  "reason": "ACME agents restricted to ACME tenant context"
}
```

### Environment-Gated Access

```json
{
  "id": "dev-allow-all",
  "match": { "metadata": { "env": "development" } },
  "decision": "allow",
  "reason": "Permissive in development"
}
```

## Policy Management

### Hot Reload

```bash
export KALGUARD_POLICY_WATCH=true
export KALGUARD_POLICY_WATCH_INTERVAL_MS=5000
```

The sidecar will poll the policy file and reload when it detects a change.

### Validation

```typescript
import { validatePolicy } from '@kalguard/core';

const errors = validatePolicy(policyJson);
if (errors.length > 0) {
  console.error('Invalid policy:', errors);
}
```

### Testing Rules Programmatically

```typescript
import { PolicyEngine } from '@kalguard/core';

const engine = new PolicyEngine(policy);
const result = engine.evaluate({
  agentId: 'agent-alpha',
  action: 'prompt:check',
  resource: undefined,
  metadata: { env: 'production' },
});
// result.decision === 'allow'
```

## Best Practices

1. **Default to deny.** Only allow what is explicitly needed.
2. **Order deny rules first.** A deny rule early in the list acts as a hard block.
3. **Use descriptive IDs.** Rule IDs appear in audit logs — make them human-readable.
4. **Document reasons.** Every rule's `reason` field should explain the business intent.
5. **Version-control policies.** Treat `policy.json` like infrastructure-as-code.
6. **Review audit logs.** Regularly verify that decisions match expectations.

## Next Steps

- [Prompt Firewall](/docs/concepts/prompt-firewall) — how prompts are scored and sanitized.
- [API Reference](/docs/api/overview) — HTTP endpoints and SDK methods.
