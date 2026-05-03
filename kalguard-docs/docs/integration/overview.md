---
sidebar_position: 1
id: overview
title: Integration Guide
description: Integrate KalGuard with any AI agent using the TypeScript SDK or HTTP API.
keywords: [integration, sdk, http, agent, langchain, openai]
---

# Integration Guide

KalGuard is designed to work with **any** AI agent framework. This guide covers the two primary integration methods and common patterns.

## Integration Methods

| Method | Best For | Features |
|--------|----------|----------|
| **TypeScript SDK** | Node.js / TypeScript agents | Type safety, automatic retries, helper functions |
| **HTTP API** | Python, Go, Rust, Java, or any language with HTTP support | Universal compatibility, simple request/response |

## TypeScript SDK

### Initialize the Client

```typescript
import { KalGuardClient } from 'kalguard';

const kg = new KalGuardClient({
  baseUrl: process.env.KALGUARD_SIDECAR_URL ?? 'http://localhost:9292',
  token: process.env.KALGUARD_AGENT_TOKEN!,
  timeout: 5_000,   // ms (default)
  retries: 3,       // automatic retries on network errors
});
```

### Prompt Check

```typescript
import { withPromptCheck } from 'kalguard';

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: userInput },
];

const response = await withPromptCheck(kg, messages, async (sanitized) => {
  // `sanitized` is the message array after PII redaction / injection removal
  return await openai.chat.completions.create({
    model: 'gpt-4',
    messages: sanitized,
  });
});
```

`withPromptCheck` will throw a `KalGuardError` if the request is denied.

### Tool Check

```typescript
import { withToolCheck } from 'kalguard';

const result = await withToolCheck(kg, 'search_web', { query: 'weather NYC' }, async () => {
  return await tools.searchWeb('weather NYC');
});
```

### Error Handling

```typescript
import { KalGuardError } from 'kalguard';

try {
  await withPromptCheck(kg, messages, handler);
} catch (err) {
  if (err instanceof KalGuardError && err.denied) {
    console.warn('Blocked by policy:', err.message);
    // Return a safe fallback to the user
  } else {
    // Network or unexpected error — fail closed
    throw err;
  }
}
```

## HTTP API

Any language can call the sidecar directly. All endpoints require a `Bearer` token.

### Prompt Check

```bash
curl -X POST http://localhost:9292/v1/prompt/check \
  -H "Authorization: Bearer $KALGUARD_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user",   "content": "What is the weather in NYC?"}
    ]
  }'
```

**Response (allowed):**

```json
{
  "allowed": true,
  "data": { "sanitizedMessages": [ /* ... */ ] },
  "metadata": { "riskScore": 0.12, "sanitized": false }
}
```

**Response (denied):**

```json
{
  "allowed": false,
  "message": "Prompt blocked: injection detected",
  "metadata": { "riskScore": 0.91, "reasons": ["injection_override"] }
}
```

### Tool Check

```bash
curl -X POST http://localhost:9292/v1/tool/check \
  -H "Authorization: Bearer $KALGUARD_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "search_web",
    "toolArgs": { "query": "weather NYC" }
  }'
```

### Python Example

```python
import requests, os

BASE = os.environ.get("KALGUARD_SIDECAR_URL", "http://localhost:9292")
TOKEN = os.environ["KALGUARD_AGENT_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def check_prompt(messages: list[dict]) -> list[dict]:
    r = requests.post(f"{BASE}/v1/prompt/check", headers=HEADERS, json={"messages": messages})
    r.raise_for_status()
    body = r.json()
    if not body["allowed"]:
        raise RuntimeError(f"Blocked: {body['message']}")
    return body.get("data", {}).get("sanitizedMessages", messages)

def check_tool(name: str, args: dict) -> None:
    r = requests.post(f"{BASE}/v1/tool/check", headers=HEADERS, json={"toolName": name, "toolArgs": args})
    r.raise_for_status()
    body = r.json()
    if not body["allowed"]:
        raise RuntimeError(f"Tool denied: {body['message']}")
```

## Integration Points

The recommended integration pattern wraps **four** points in your agent loop:

```text
User Input
    │
    ▼
① Prompt Check  ──► KalGuard  ──► allow / deny
    │
    ▼
   LLM Call
    │
    ▼
② Tool Check    ──► KalGuard  ──► allow / deny
    │
    ▼
   Tool Execution
    │
    ▼
   Return Response
```

1. **Before the LLM call** — validate and sanitize the prompt.
2. **Before each tool execution** — validate tool name and arguments.
3. (Optional) Wrap the agent loop in a try/catch that fails closed on any `KalGuardError`.
4. (Optional) Register tool schemas at startup with `POST /v1/tool/register` for argument validation.

## Error Handling Strategies

| Strategy | Behavior | Recommended For |
|----------|----------|-----------------|
| **Fail Closed** | Deny on any error (network, timeout, policy) | Production |
| **Fail Open** | Log the error and proceed | Local development only |
| **Graceful Degradation** | Fail closed in production, fail open in dev | Mixed environments |

:::warning
Never use fail-open in production. An unreachable sidecar should halt the agent, not grant unchecked access.
:::

## Performance Tips

- **Co-locate the sidecar** with the agent (same host or same Kubernetes pod) — reduces latency to 1–5 ms.
- **Reuse the client instance** — the SDK maintains an internal connection pool.
- **Set reasonable timeouts** — the default 5 s timeout is safe; lower it to 2 s for latency-sensitive paths.

## Testing

### Unit Tests

Mock the `KalGuardClient` and verify your agent handles both allow and deny responses:

```typescript
const mockClient = {
  checkPrompt: jest.fn().mockResolvedValue({ allowed: true, data: { sanitizedMessages: messages } }),
};
```

### Integration Tests

Point the client at a real sidecar loaded with a test policy:

```bash
KALGUARD_POLICY_PATH=./test-policy.json pnpm --filter kalguard-sidecar start &
pnpm test
```

## Next Steps

- [API Reference](/docs/api/overview) — full endpoint and SDK documentation.
- [Policy Engine](/docs/concepts/policy-engine) — write rules that match your integration.
- [Deployment](/docs/deployment/overview) — run the sidecar in production.
