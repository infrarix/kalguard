<p align="center">
  <a href="https://github.com/infrarix/kalguard">
    <img src="https://raw.githubusercontent.com/infrarix/kalguard/main/kalguard-docs/static/img/logo.png" alt="KalGuard" width="140" />
  </a>
</p>

<h1 align="center">kalguard</h1>

<p align="center">
  <strong>The recommended entry point for integrating KalGuard runtime security into your AI agent.</strong>
  <br />
  Zero Trust · Fail-Closed · Sidecar-deployed
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kalguard"><img alt="npm" src="https://img.shields.io/npm/v/kalguard.svg?color=blue" /></a>
  <a href="https://www.npmjs.com/package/kalguard"><img alt="downloads" src="https://img.shields.io/npm/dm/kalguard.svg" /></a>
  <a href="https://github.com/infrarix/kalguard/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-brightgreen.svg" /></a>
  <a href="https://nodejs.org"><img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg?logo=node.js&logoColor=white" /></a>
  <img alt="types" src="https://img.shields.io/badge/types-included-3178C6.svg?logo=typescript&logoColor=white" />
</p>

<p align="center">
  <a href="https://infrarix.github.io/kalguard/"><strong>Docs</strong></a> ·
  <a href="https://infrarix.github.io/kalguard/docs/quick-start"><strong>Quick Start</strong></a> ·
  <a href="https://github.com/infrarix/kalguard"><strong>GitHub</strong></a> ·
  <a href="https://github.com/infrarix/kalguard/issues"><strong>Report a Bug</strong></a>
</p>

---

`kalguard` is the umbrella package — install it once and you get the SDK with the friendliest possible import path. Under the hood it re-exports the [`kalguard-sdk`][sdk] client so you can wire prompts and tool calls through the [KalGuard sidecar][sidecar] in one line.

> If you want lower-level building blocks (policy engine, prompt firewall, agent identity) without the sidecar, install [`kalguard-core`][core] directly.

## Why KalGuard

- **Zero Trust by default** — every prompt and tool call is mediated.
- **Fail-closed** — policy errors or sidecar outages produce *deny*, never *allow*.
- **Framework-agnostic** — works with any agent runtime: LangChain, LlamaIndex, custom orchestrators, Python over HTTP.
- **Tiny dependency footprint** — pure TypeScript, no runtime deps beyond the `kalguard/*` workspace packages.
- **Observable** — every decision is emitted as a structured audit event, ready for your SIEM.

## Install

```bash
npm install kalguard
# or
pnpm add kalguard
# or
yarn add kalguard
```

You will also need the sidecar running somewhere reachable. The fastest path:

```bash
# With KalGuard Cloud (recommended):
KALGUARD_API_KEY=kg_live_your_key_here kalguard-sidecar

# Local-only mode (deprecated):
# KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32) kalguard-sidecar
```

See [`kalguard-sidecar`][sidecar] for Docker, Kubernetes, and systemd deployment recipes.

## Quick Start

```ts
import { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard';

const guard = new KalGuardClient({
  baseUrl: 'http://localhost:9292',
  token: process.env.KALGUARD_AGENT_TOKEN!,
});

// 1. Mediate every LLM call
const reply = await withPromptCheck(guard, messages, async (safeMessages) => {
  return await llm.chat(safeMessages);
});

// 2. Mediate every tool execution
const result = await withToolCheck(guard, 'get_weather', { location: 'NYC' }, async () => {
  return await tools.getWeather('NYC');
});
```

If the sidecar denies the request, the wrapper throws — your agent never reaches the LLM or the tool. If the prompt is risky but salvageable, `safeMessages` contains the sanitized version.

## API

### `new KalGuardClient(options)`

| Option       | Type     | Description |
|--------------|----------|-------------|
| `baseUrl`    | `string` | URL of the running sidecar, e.g. `http://localhost:9292`. |
| `token`      | `string` | Agent bearer token (HMAC-signed). See [agent identity][core]. |
| `requestId?` | `string` | Optional correlation id; auto-generated when omitted. |

### `withPromptCheck(client, messages, run)`

Calls `POST /v1/prompt/check`. If the sidecar returns `allowed: true`, runs `run(sanitizedMessages ?? messages)`. Otherwise throws a `SecurityDenied` error containing the policy reason.

### `withToolCheck(client, toolName, args, run)`

Calls `POST /v1/tool/check`. Same allow/deny semantics, scoped to a single tool invocation.

For lower-level access, use `client.checkPrompt(...)` / `client.checkTool(...)` directly.

## Sub-paths

```ts
// Identical to the default import — re-exports the SDK
import { KalGuardClient } from 'kalguard';

// Lower-level core: policy engine, prompt firewall, token utilities
import { PolicyEngine, evaluatePrompt, createAgentToken } from 'kalguard-core';
```

## Configuration

The client itself is stateless — all knobs live on the sidecar. The most common environment variables:

| Variable | Purpose | Default |
|----------|---------|---------|
| `KALGUARD_TOKEN_SECRET` | HMAC secret for local-only mode (auto-synced from dashboard when `KALGUARD_API_KEY` is set) | *(deprecated for Cloud users)* |
| `KALGUARD_PORT`         | Sidecar listen port                            | `9292` |
| `KALGUARD_POLICY_PATH`  | Path to the JSON policy file                   | *(default-deny if unset)* |

See the full reference in the [`kalguard-sidecar` README][sidecar].

## Examples

- [`examples/simple-agent`](https://github.com/infrarix/kalguard/tree/main/examples/simple-agent) — minimal Node.js agent demonstrating prompt + tool mediation.
- [Integration guide](https://infrarix.github.io/kalguard/docs/integration/overview) — language-agnostic recipes (HTTP and SDK).

## Compatibility

- **Node.js**: 20 LTS or newer (uses native `fetch`).
- **Runtime**: ESM only. CommonJS consumers can use dynamic `import('kalguard')`.
- **Browser**: not supported — agent tokens are signed server-side and must never reach a user's device.

## Contributing

Issues and pull requests are welcome. Read [`CONTRIBUTING.md`](https://github.com/infrarix/kalguard/blob/main/CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](https://github.com/infrarix/kalguard/blob/main/CODE_OF_CONDUCT.md) before opening a PR.

## Security

Found a vulnerability? Please follow [`SECURITY.md`](https://github.com/infrarix/kalguard/blob/main/SECURITY.md) — do **not** open a public issue.

## License

[Apache-2.0](https://github.com/infrarix/kalguard/blob/main/LICENSE) © KalGuard Contributors

[sdk]: https://www.npmjs.com/package/kalguard-sdk
[core]: https://www.npmjs.com/package/kalguard-core
[sidecar]: https://www.npmjs.com/package/kalguard-sidecar

---

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/281149417?s=96&v=4" width="28" />
  <b>by Infrarix</b>
</p>

> Part of the **Infrarix AI Infrastructure ecosystem**
