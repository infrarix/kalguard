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

Tokens are JWTs signed with `KALGUARD_TOKEN_SECRET`. See [Quick Start § Create an Agent Token](/docs/quick-start#4-create-an-agent-token).

---

## Endpoints

### `GET /health`

Health check. No authentication required.

**Response `200`**

```json
{ "status": "healthy", "uptime": 123456 }
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
  "data": {
    "sanitizedMessages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello, my email is [EMAIL_REDACTED]" }
    ]
  },
  "metadata": {
    "riskScore": 0.35,
    "sanitized": true,
    "redactions": ["EMAIL_REDACTED"]
  }
}
```

**Response `200` — Denied**

```json
{
  "allowed": false,
  "message": "Prompt blocked: injection detected (score 0.92)",
  "metadata": {
    "riskScore": 0.92,
    "reasons": ["injection_override"],
    "blockedPhrases": []
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
  "toolArgs": { "query": "weather NYC" },
  "context": {
    "metadata": { "env": "production" }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolName` | `string` | Yes | Identifier of the tool to execute |
| `toolArgs` | `object` | Yes | Arguments to pass to the tool |
| `context.metadata` | `Record<string, string>` | No | Metadata for policy matching |

**Response `200` — Allowed**

```json
{
  "allowed": true,
  "metadata": { "policyRuleId": "allow-search", "reason": "Tool is on the allowlist" }
}
```

**Response `200` — Denied**

```json
{
  "allowed": false,
  "message": "Tool denied by policy",
  "metadata": { "policyRuleId": "deny-dangerous-tools", "reason": "Tool not on allowlist" }
}
```

---

### `POST /v1/tool/register`

Register a JSON Schema for a tool. Once registered, all `tool:execute` requests for this tool will have their arguments validated against the schema.

**Request Body**

```json
{
  "toolName": "search_web",
  "schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "maxLength": 500 }
    },
    "required": ["query"],
    "additionalProperties": false
  }
}
```

**Response `200`**

```json
{ "success": true, "data": { "toolName": "search_web" } }
```

---

## Error Responses

All endpoints return a consistent error shape:

```json
{
  "error": "Unauthorized",
  "message": "Token expired",
  "statusCode": 401
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

When `KALGUARD_TOOL_RATE_LIMIT` is configured, rate-limited responses include headers:

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1714567890
```

---

## TypeScript SDK

### `KalGuardClient`

```typescript
import { KalGuardClient } from 'kalguard';

const client = new KalGuardClient({
  baseUrl: string;       // Sidecar URL (required)
  token: string;         // Agent JWT (required)
  timeout?: number;      // Request timeout in ms (default: 5000)
  retries?: number;      // Automatic retries on network errors (default: 3)
  headers?: Record<string, string>;  // Extra headers
});
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `client.checkPrompt({ messages, context? })` | `PromptCheckResponse` | Call `/v1/prompt/check` |
| `client.checkTool({ toolName, toolArgs, context? })` | `ToolCheckResponse` | Call `/v1/tool/check` |
| `client.registerTool({ toolName, schema })` | `ToolRegisterResponse` | Call `/v1/tool/register` |

### Helper Functions

```typescript
import { withPromptCheck, withToolCheck } from 'kalguard';

// Calls handler with sanitized messages if allowed; throws KalGuardError if denied
const result = await withPromptCheck(client, messages, async (sanitized) => {
  return await llm.chat(sanitized);
});

// Calls handler if tool is allowed; throws KalGuardError if denied
const toolResult = await withToolCheck(client, 'search_web', { query: 'test' }, async () => {
  return await tools.search('test');
});
```

### `KalGuardError`

```typescript
class KalGuardError extends Error {
  denied: boolean;       // true if the request was explicitly denied by policy
  statusCode: number;    // HTTP status code from the sidecar
  metadata?: Record<string, unknown>;  // Additional context (riskScore, reasons, etc.)
}
```

## Next Steps

- [Quick Start](/docs/quick-start) — integrate in five minutes.
- [Integration Guide](/docs/integration/overview) — patterns for TypeScript and HTTP.
- [Policy Engine](/docs/concepts/policy-engine) — configure the rules that drive these responses.
