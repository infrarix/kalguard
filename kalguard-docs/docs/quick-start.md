---
sidebar_position: 2
id: quick-start
title: Quick Start
description: Get KalGuard up and running in under five minutes.
keywords: [quick start, setup, installation, tutorial]
---

# Quick Start

This guide takes you from zero to a running KalGuard sidecar with a secured agent in **under five minutes**.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20 or later |
| pnpm (or npm) | 8+ (or npm 9+) |
| OpenSSL | any recent version (for secret generation) |

## 1. Install

```bash
pnpm add kalguard
```

This installs the umbrella package which re-exports `kalguard-core`, `kalguard-sdk`, and the sidecar launcher.

:::tip
You can also install packages individually — see the [Installation Guide](/docs/installation).
:::

## 2. Configure

Create a `policy.json` that defines what the agent is allowed to do:

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "allow-dev-agent-prompts",
      "match": {
        "agentIds": ["dev-agent"],
        "actions": ["prompt:check"]
      },
      "decision": "allow",
      "reason": "Development agent may send prompts"
    },
    {
      "id": "allow-dev-agent-tools",
      "match": {
        "agentIds": ["dev-agent"],
        "actions": ["tool:execute"]
      },
      "decision": "allow",
      "reason": "Development agent may execute tools"
    }
  ],
  "defaultDecision": "deny",
  "defaultReason": "No matching policy rule"
}
```

:::warning
The example above is permissive for development. Always restrict policies before deploying to production.
:::

## 3. Start the Sidecar

```bash
# Generate a token-signing secret
export KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32)

# Point at your policy file
export KALGUARD_POLICY_PATH=./policy.json

# Start the sidecar (default port 9292)
pnpm --filter kalguard-sidecar start
```

You should see:

```text
[kalguard] sidecar listening on http://0.0.0.0:9292
[kalguard] policy loaded from ./policy.json (2 rules)
```

## 4. Create an Agent Token

```typescript
import { createAgentToken } from 'kalguard-core';

const token = createAgentToken('dev-agent', ['prompt:send', 'tool:execute'], {
  secret: process.env.KALGUARD_TOKEN_SECRET!,
  expiresInMs: 3_600_000, // 1 hour
  issuer: 'my-platform',
});
```

## 5. Integrate Your Agent

### TypeScript / JavaScript

```typescript
import { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard';

const kg = new KalGuardClient({
  baseUrl: 'http://localhost:9292',
  token: process.env.KALGUARD_AGENT_TOKEN!,
});

// Prompt check — sanitizes messages before the LLM call
const llmResponse = await withPromptCheck(kg, messages, async (safe) => {
  return await yourLLM.chat(safe);
});

// Tool check — validates the tool call against policy
const toolResult = await withToolCheck(kg, 'get_weather', { city: 'NYC' }, async () => {
  return await weather.get('NYC');
});
```

### Any Language (HTTP)

```python
import requests, os

TOKEN = os.environ["KALGUARD_AGENT_TOKEN"]

def check_prompt(messages: list) -> list:
    r = requests.post(
        "http://localhost:9292/v1/prompt/check",
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={"messages": messages},
    )
    data = r.json()
    if not data["allowed"]:
        raise RuntimeError(data["message"])
    return data.get("data", {}).get("sanitizedMessages", messages)
```

## 6. Verify

Tail the audit log to confirm decisions are being recorded:

```bash
tail -f audit.log | jq .
```

```json
{
  "timestamp": "2026-05-01T10:30:00.000Z",
  "requestId": "req_abc123",
  "agentId": "dev-agent",
  "action": "prompt:check",
  "decision": "allow",
  "reason": "Policy rule: allow-dev-agent-prompts"
}
```

## Next Steps

| Topic | Link |
|-------|------|
| Advanced policy rules | [Policy Engine](/docs/concepts/policy-engine) |
| Prompt firewall tuning | [Prompt Firewall](/docs/concepts/prompt-firewall) |
| Production deployment | [Deployment Guide](/docs/deployment/overview) |
| Full HTTP & SDK reference | [API Reference](/docs/api/overview) |

## Troubleshooting

<details>
<summary><strong>Sidecar won't start</strong></summary>

- Verify `KALGUARD_TOKEN_SECRET` is set (`echo $KALGUARD_TOKEN_SECRET`).
- Validate `policy.json` with `jq . policy.json`.
- Check that port 9292 is free: `lsof -i :9292`.

</details>

<details>
<summary><strong>Agent requests return 401 / 403</strong></summary>

- Ensure the token has not expired.
- Confirm the agent ID in the token matches a policy rule.
- Review sidecar stderr for detailed error messages.

</details>

<details>
<summary><strong>Policy changes are not picked up</strong></summary>

- Set `KALGUARD_POLICY_WATCH=true` to enable hot-reload.
- Check file permissions — the sidecar must be able to read the policy file.

</details>
