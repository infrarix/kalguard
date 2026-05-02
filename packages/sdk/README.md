<p align="center">
  <a href="https://github.com/infrarix/kalguard">
    <img src="https://raw.githubusercontent.com/infrarix/kalguard/main/kalguard-docs/static/img/logo.png" alt="KalGuard" width="140" />
  </a>
</p>

<h1 align="center">kalguard/sdk</h1>

<p align="center">
  <strong>One-line TypeScript client for mediating prompts and tool calls through the KalGuard sidecar.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kalguard/sdk"><img alt="npm" src="https://img.shields.io/npm/v/kalguard/sdk.svg?color=blue" /></a>
  <a href="https://www.npmjs.com/package/kalguard/sdk"><img alt="downloads" src="https://img.shields.io/npm/dm/kalguard/sdk.svg" /></a>
  <a href="https://github.com/infrarix/kalguard/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-brightgreen.svg" /></a>
  <a href="https://nodejs.org"><img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg?logo=node.js&logoColor=white" /></a>
  <img alt="types" src="https://img.shields.io/badge/types-included-3178C6.svg?logo=typescript&logoColor=white" />
</p>

<p align="center">
  <a href="https://infrarix.github.io/kalguard/"><strong>Docs</strong></a> ·
  <a href="https://infrarix.github.io/kalguard/docs/integration/overview"><strong>Integration Guide</strong></a> ·
  <a href="https://github.com/infrarix/kalguard"><strong>GitHub</strong></a>
</p>

---

`kalguard/sdk` is the lightweight HTTP client agents use to talk to the KalGuard sidecar. It exposes a typed client (`KalGuardClient`) plus two convenience wrappers (`withPromptCheck`, `withToolCheck`) that turn security mediation into a single line of code.

> Most users should install the umbrella [`kalguard`](https://www.npmjs.com/package/kalguard) package, which re-exports everything in this SDK. Install `kalguard/sdk` directly if you want to pin only the client surface.

## Install

```bash
npm install kalguard/sdk
# or
pnpm add kalguard/sdk
```

You also need:

- A running [`kalguard/sidecar`](https://www.npmjs.com/package/kalguard/sidecar) reachable over HTTP.
- An agent bearer token signed with the sidecar's `KALGUARD_TOKEN_SECRET`. Issue one with `createAgentToken(...)` from [`kalguard/core`](https://www.npmjs.com/package/kalguard/core).

## Quick Start

```ts
import { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard/sdk';

const guard = new KalGuardClient({
  baseUrl: 'http://localhost:9292',
  token: process.env.KALGUARD_AGENT_TOKEN!,
});

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user',   content: userInput },
];

const reply = await withPromptCheck(guard, messages, async (safe) => {
  return await llm.chat(safe);          // only runs if policy allows
});

const weather = await withToolCheck(guard, 'get_weather', { location: 'NYC' }, async () => {
  return await tools.getWeather('NYC'); // only runs if policy allows
});
```

If the sidecar denies the request the wrapper throws; your agent never invokes the LLM or the tool. If the prompt firewall sanitizes the input, the wrapper hands you the cleaned `safe` messages.

## API

### `class KalGuardClient`

```ts
new KalGuardClient(options: KalGuardClientOptions)
```

| Option       | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `baseUrl`    | `string` | yes      | Sidecar URL, e.g. `http://localhost:9292`. Trailing slash is stripped. |
| `token`      | `string` | yes      | Agent bearer token (HMAC-signed; verified by the sidecar). |
| `requestId?` | `string` | no       | Default correlation id. Per-call ids override this. |

#### `client.checkPrompt(messages, requestId?)`

Calls `POST /v1/prompt/check`. Returns:

```ts
SecurityResponse<{
  allowed: boolean;
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  sanitizedMessages?: ReadonlyArray<PromptMessage>;
}>
```

#### `client.checkTool(toolName, args, requestId?)`

Calls `POST /v1/tool/check`. Returns `SecurityResponse<{ allowed: boolean }>`.

### `withPromptCheck(client, messages, run)`

Convenience wrapper:

1. Calls `client.checkPrompt(messages)`.
2. If `allowed`, invokes `run(sanitizedMessages ?? messages)` and returns the result.
3. If denied, throws an error carrying the policy reason — your agent must surface this to the caller, not retry.

### `withToolCheck(client, toolName, args, run)`

Same shape for tool invocations.

## Error model

All wrapper rejections include:

- `name`: `'KalGuardDenied'`
- `reason`: human-readable string from policy
- `requestId`: correlation id (also returned in the `x-kalguard-request-id` response header)

Treat denials as **terminal** — never silently fall through to an unguarded path.

## Compatibility

- **Node.js**: 20+ (relies on global `fetch`).
- **Module format**: ESM only.
- **Browser / edge runtimes**: not supported. Tokens are sensitive and must stay server-side.

## Related packages

- [`kalguard`](https://www.npmjs.com/package/kalguard) — umbrella package; re-exports this SDK.
- [`kalguard/core`](https://www.npmjs.com/package/kalguard/core) — types, policy engine, prompt firewall, token utilities.
- [`kalguard/sidecar`](https://www.npmjs.com/package/kalguard/sidecar) — the HTTP server this client talks to.

## License

[Apache-2.0](https://github.com/infrarix/kalguard/blob/main/LICENSE) © KalGuard Contributors
