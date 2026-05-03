---
sidebar_position: 1
id: overview
title: API Reference
description: Complete HTTP API and TypeScript SDK reference for KalGuard.
keywords: [api, reference, http, sdk, endpoints, rest]
---

# API Reference

KalGuard exposes an HTTP API on the sidecar (default `http://localhost:9292`) and a TypeScript SDK that wraps it.

## Authentication

All endpoints except `/health` require a valid agent token:

```text
Authorization: Bearer <agent-token>
```

Tokens are JWTs signed by KalGuard. Generate them from the [KalGuard Dashboard](/docs/cloud#4-create-access-tokens) or locally with `createAgentToken()` from `kalguard-core` (for development).

---

## Endpoints

### `GET /health`

Health check. No authentication required.

**Response `200`**

```json
{
  "status": "ok",
  "requestId": "req_abc123..."
}
```

When connected to KalGuard Cloud, the response also includes:

```json
{
  "status": "ok",
  "requestId": "req_abc123...",
  "cloud": {
    "connected": true,
    "tier": "pro",
    "orgId": "org-uuid-here"
  }
}
```

---

### `POST /v1/prompt/check`

Validate and optionally sanitize a prompt before sending it to the LLM.

**Request Body**

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello, my email is john@example.com" }
  ],
  "context": {
    "metadata": { "env": "production" }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | `Message[]` | Yes | Array of `{ role, content }` objects |
| `context.metadata` | `Record<string, string>` | No | Arbitrary metadata for policy matching |

**Response `200` — Allowed**

```json
{
  "allowed": true,
  "decision": "allow",
  "message": "OK",
  "requestId": "req_abc123...",
  "data": {
    "allowed": true,
    "riskScore": 35,
    "riskLevel": "low",
    "sanitizedMessages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello, my email is [EMAIL_REDACTED]" }
    ]
  }
}
```

**Response `403` — Denied**

```json
{
  "allowed": false,
  "decision": "deny",
  "message": "Prompt blocked",
  "requestId": "req_abc123...",
  "errorCode": "PROMPT_BLOCKED",
  "data": {
    "riskScore": 92,
    "riskLevel": "critical"
  }
}
```

---

### `POST /v1/tool/check`

Validate a tool execution against policy and registered schemas.

**Request Body**

```json
{
  "toolName": "search_web",
  "arguments": { "query": "weather NYC" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolName` | `string` | Yes | Identifier of the tool to execute |
| `arguments` | `object` | Yes | Arguments to pass to the tool |

**Response `200` — Allowed**

```json
{
  "allowed": true,
  "decision": "allow",
  "message": "OK",
  "requestId": "req_abc123...",
  "data": { "allowed": true }
}
```

**Response `403` — Denied**

```json
{
  "allowed": false,
  "decision": "deny",
  "message": "Tool denied by policy",
  "requestId": "req_abc123...",
  "errorCode": "TOOL_DENIED"
}
```

---

## Error Responses

All endpoints return a consistent error shape:

```json
{
  "allowed": false,
  "message": "Unauthorized",
  "requestId": "req_abc123...",
  "errorCode": "AUTH_FAILED"
}
```

| Status | Meaning |
|--------|---------|
| `400` | Invalid request body |
| `401` | Missing or invalid token |
| `403` | Token valid but lacks required capability |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

### Rate Limiting

Rate limiting operates at two levels:

**Local rate limiting** — When `KALGUARD_TOOL_RATE_LIMIT` is configured, per-agent tool call limits are enforced by the sidecar.

**Cloud rate limiting** — When connected to KalGuard Cloud, daily check limits are enforced based on your plan tier. Every response includes:

```text
x-kalguard-plan: pro
x-kalguard-usage-remaining: 99842
x-ratelimit-reset: 1714694400
```

When the limit is exceeded, the sidecar returns `429 Too Many Requests`:

```json
{
  "allowed": false,
  "message": "Rate limit exceeded",
  "requestId": "req_abc123...",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "data": { "remaining": 0, "resetAt": 1714694400 }
}
```

The `retry-after` header indicates seconds until the limit resets.

---

## TypeScript SDK

### `KalGuardClient`

```typescript
import { KalGuardClient } from 'kalguard';

const client = new KalGuardClient({
  baseUrl: string;       // Sidecar URL (required)
  token: string;         // Agent JWT (required)
});
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `client.checkPrompt(messages, requestId?)` | `SecurityResponse` | Call `/v1/prompt/check` |
| `client.checkTool(toolName, args, requestId?)` | `SecurityResponse` | Call `/v1/tool/check` |
| `client.planInfo` | `KalGuardPlanInfo \| undefined` | Plan info from the last cloud-connected response |

### Plan Info (Cloud)

After each request, `client.planInfo` is populated from cloud response headers:

```typescript
const result = await client.checkPrompt(messages);
console.log(client.planInfo);
// { plan: 'pro', remaining: 99842, resetAt: 1714694400 }
```

### Helper Functions

```typescript
import { withPromptCheck, withToolCheck } from 'kalguard';

// Calls handler with sanitized messages if allowed; throws if denied
const result = await withPromptCheck(client, messages, async (sanitized) => {
  return await llm.chat(sanitized);
});

// Calls handler if tool is allowed; throws if denied
const toolResult = await withToolCheck(client, 'search_web', { query: 'test' }, async () => {
  return await tools.search('test');
});
```

## Next Steps

- [Quick Start](/docs/quick-start) — integrate in five minutes.
- [Integration Guide](/docs/integration/overview) — patterns for TypeScript and HTTP.
- [Policy Engine](/docs/concepts/policy-engine) — configure the rules that drive these responses.
