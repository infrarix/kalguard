<p align="center">
  <a href="https://github.com/infrarix/kalguard">
    <img src="https://raw.githubusercontent.com/infrarix/kalguard/main/kalguard-docs/static/img/logo.png" alt="KalGuard" width="140" />
  </a>
</p>

<h1 align="center">KalGuard</h1>

<p align="center">
  <strong>Enterprise-grade, open-source, framework-agnostic runtime security for AI agents.</strong>
  <br />
  Zero Trust · Fail-Closed · Sidecar-deployed
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kalguard"><img alt="npm" src="https://img.shields.io/npm/v/kalguard.svg?color=blue" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-brightgreen.svg" /></a>
  <a href="https://nodejs.org"><img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg?logo=node.js&logoColor=white" /></a>
  <a href="https://github.com/infrarix/kalguard/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/infrarix/kalguard/ci.yml?branch=main" /></a>
  <a href="https://github.com/infrarix/kalguard/issues"><img alt="Issues" src="https://img.shields.io/github/issues/infrarix/kalguard.svg" /></a>
</p>

<p align="center">
  <a href="https://infrarix.github.io/kalguard/"><strong>Documentation</strong></a> ·
  <a href="https://infrarix.github.io/kalguard/docs/quick-start"><strong>Quick Start</strong></a> ·
  <a href="https://infrarix.github.io/kalguard/docs/integration/overview"><strong>Integration</strong></a> ·
  <a href="https://infrarix.github.io/kalguard/docs/concepts/architecture"><strong>Architecture</strong></a>
</p>

---

Copyright 2025 KalGuard Contributors. Licensed under the [Apache License, Version 2.0](LICENSE).

## Features

- **Agent-agnostic**: Works with any AI agent (OpenClaw-like, custom, local, cloud). No assumptions about agent internals.
- **Environment-agnostic**: Local, Docker, Kubernetes, VMs; macOS, Linux, Windows.
- **Zero Trust**: Agents are untrusted by default. All actions are mediated.
- **Fail Closed**: If policy evaluation fails → deny. No unsafe defaults.
- **Security as Infrastructure**: Sidecar proxy + optional Node.js SDK; not a library embedded in agent logic.

## Install (npm / pnpm)

```bash
# SDK (recommended for agents) — one package for branding
pnpm add kalguard
# or: npm install kalguard

# Scoped packages (optional)
pnpm add kalguard-sdk      # SDK only
pnpm add kalguard-core     # Types, policy engine, agent identity, prompt firewall, tool mediation
pnpm add kalguard-sidecar  # Sidecar CLI (run the proxy)
```

## Quick Start

### 1. Run the sidecar

```bash
# From this repo (pnpm workspace + Turbo)
pnpm install
pnpm run build
pnpm start
# Or run sidecar package only: pnpm --filter kalguard-sidecar start
# Optional: set KALGUARD_POLICY_PATH, KALGUARD_AUDIT_LOG_PATH
# Access tokens are managed via the KalGuard Dashboard (https://dashboard.kalguard.dev)
```

Sidecar listens on `http://0.0.0.0:9292` by default. Endpoints:

- `POST /v1/prompt/check` — Prompt firewall + policy (body: `{ "messages": [ { "role", "content" } ] }`).
- `POST /v1/tool/check` — Tool mediation (body: `{ "toolName", "arguments" }`).
- `GET /health` — Health check.

All requests require `Authorization: Bearer <agent-token>`.

### 2. Use the SDK (one-line integration)

```ts
import { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard';

const client = new KalGuardClient({ baseUrl: 'http://localhost:9292', token: process.env.KALGUARD_AGENT_TOKEN! });

// Before calling LLM:
await withPromptCheck(client, messages, async (sanitizedMessages) => {
  return await yourLLM.chat(sanitizedMessages);
});

// Before executing tool:
await withToolCheck(client, 'get_weather', { location: 'NYC' }, async () => {
  return await yourToolRunner.run('get_weather', { location: 'NYC' });
});
```

### 3. Integrate into your agent

- **Any language**: Call `POST /v1/prompt/check` before every LLM call and `POST /v1/tool/check` before every tool run. Use `Authorization: Bearer <agent-token>`. If the response is not allowed, do not call the LLM or run the tool.
- **Node.js / TypeScript**: Use the SDK (`KalGuardClient`, `withPromptCheck`, `withToolCheck`) as in the example above.

See **[Integration guide](docs/integration-guide.md)** for step-by-step integration (HTTP and SDK), token issuance, and policy. A minimal runnable example: **[examples/simple-agent](examples/simple-agent/README.md)**.

### 4. Agent tokens

Agent access tokens are created in the **KalGuard Dashboard** (Dashboard → Access Tokens). Set a name, agent ID, capabilities, and expiry — the dashboard generates a signed JWT. When the sidecar is connected to KalGuard Cloud (`KALGUARD_API_KEY`), it automatically receives the signing secret. For local-only mode, set `KALGUARD_TOKEN_SECRET` manually.

## Monorepo (pnpm + Turbo)

This repo is a **pnpm workspace** with **Turbo**. Packages:

| Package | Description | Publish |
|---------|-------------|---------|
| **kalguard** | Main entry — re-exports SDK (branding) | `npm install kalguard` |
| **kalguard-sdk** | SDK: KalGuardClient, withPromptCheck, withToolCheck | `npm install kalguard-sdk` |
| **kalguard-core** | Core: types, policy, agent, prompt firewall, tools | `npm install kalguard-core` |
| **kalguard-sidecar** | Sidecar CLI + server | `npm install kalguard-sidecar` |

```bash
pnpm install
pnpm run build    # Turbo: build all packages
pnpm start        # Run sidecar
pnpm run clean    # Clean dist + node_modules
```

See **[Publishing](docs/publishing.md)** for npm publish and versioning.

## Project Structure

```
packages/
├── kalguard/        # Main package (re-exports SDK) — npm install kalguard
├── core/            # kalguard-core — types, policy, agent, prompt, tools, runtime, monitoring
├── sdk/             # kalguard-sdk — KalGuardClient, withPromptCheck, withToolCheck
└── sidecar/         # kalguard-sidecar — HTTP sidecar server + CLI
docs/                # Architecture, integration, security, deployment, publishing
deploy/              # Docker, Kubernetes, systemd
examples/            # Simple agent example
test/                # Unit tests (run from repo root; see test/README or package scripts)
```

## Configuration (environment)

| Variable | Description | Default |
|----------|-------------|---------|
| `KALGUARD_PORT` | Sidecar port | 9292 |
| `KALGUARD_HOST` | Bind host | 0.0.0.0 |
| `KALGUARD_TOKEN_SECRET` | Secret for token verification (local-only mode; deprecated when using Cloud) | (auto-synced from dashboard when `KALGUARD_API_KEY` is set) |
| `KALGUARD_POLICY_PATH` | Path to policy JSON file | (default policy: deny all) |
| `KALGUARD_POLICY_DEFAULT_DENY` | Default policy decision when no file | true |
| `KALGUARD_POLICY_WATCH` | Hot-reload policy on file change | false |
| `KALGUARD_POLICY_WATCH_INTERVAL_MS` | Debounce for policy watch (ms) | 500 |
| `KALGUARD_PROMPT_BLOCK_THRESHOLD` | Prompt risk score block threshold (0–100) | 70 |
| `KALGUARD_PROMPT_SANITIZE_THRESHOLD` | Prompt risk score sanitize threshold | 50 |
| `KALGUARD_TOOL_RATE_LIMIT` | Tool requests per agent per minute | (no limit) |
| `KALGUARD_AUDIT_LOG_PATH` | File path for audit log | (memory-only if unset) |
| `KALGUARD_API_KEY` | KalGuard Cloud API key (enables Pro features) | (local-only if unset) |
| `KALGUARD_CLOUD_URL` | KalGuard Cloud API base URL | `https://api.kalguard.dev` |
| `KALGUARD_CLOUD_SYNC_INTERVAL_MS` | License refresh interval (ms) | 300000 (5 min) |

## Policy format (JSON)

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "allow-agent-1-prompt",
      "match": { "agentIds": ["agent-1"], "actions": ["prompt:check"] },
      "decision": "allow",
      "reason": "allowed"
    },
    {
      "id": "allow-agent-1-tool",
      "match": { "agentIds": ["agent-1"], "actions": ["tool:execute"] },
      "decision": "allow",
      "reason": "allowed"
    }
  ],
  "defaultDecision": "deny",
  "defaultReason": "no matching rule"
}
```

First matching rule wins. Fail closed: no policy or error → deny.

## Quality

- TypeScript (Node 20+), strict typing, no `any`.
- Input validation and defensive checks throughout.
- Unit tests for policy engine, prompt firewall, tool mediator, agent identity.
- Structured security responses; no raw errors to agents.
- Audit log: immutable, structured JSON, SIEM-ready.

## Optional: OS enforcement and sandbox

- **OS enforcement** (`integrations/os`): Linux seccomp/AppArmor config and profile generation; macOS sandbox-exec docs; Windows job object/integrity docs. Generate seccomp profile: `npm run seccomp-profile [output.json]`.
- **Sandbox** (`sandbox`): Optional runner for tool execution with timeout, env allowlist, cwd. Use for isolated tool runs.

## Documentation

- **[Integration guide](docs/integration-guide.md)** — How to integrate KalGuard into any agent (HTTP or SDK)
- **[Publishing](docs/publishing.md)** — npm publish, versioning, branding
- [Architecture](docs/architecture.md)
- [Security assumptions](docs/security-assumptions.md)
- [Deploy](deploy/README.md)
- [OS enforcement](packages/sidecar/src/os/README.md)
- [Sandbox](packages/sidecar/src/sandbox/README.md)
- [Example: simple agent](examples/simple-agent/README.md)

## KalGuard Cloud (Pro & Enterprise)

KalGuard is fully functional as an open-source, self-hosted solution. For teams that need more, **KalGuard Cloud** adds centralized management, usage analytics, and higher limits.

| Feature | Free (OSS) | Pro ($49/mo) | Enterprise |
|---------|-----------|-------------|------------|
| Security checks/day | 1,000 | 100,000 | Unlimited |
| Agents | 1 | Unlimited | Unlimited |
| Audit retention | 7 days | 90 days | 365 days |
| Prompt firewall | Basic | Advanced + PII redaction | Advanced + PII |
| Usage analytics | — | Dashboard | Dashboard |
| Custom policy rules | — | Yes | Yes |
| SSO / SAML | — | — | Yes |
| SLA | — | — | Yes |

### Connect to Cloud

1. Sign up at [dashboard.kalguard.dev](https://dashboard.kalguard.dev) and create an organization.
2. Generate an API key from the dashboard.
3. Set the environment variable on your sidecar:

```bash
export KALGUARD_API_KEY=kg_live_your_api_key_here
```

The sidecar will automatically validate your license, enforce plan limits, and report usage to the dashboard. No code changes required — the same sidecar binary works in local-only and cloud-connected modes.

### Cloud Response Headers

When connected to KalGuard Cloud, every sidecar response includes:

| Header | Description |
|--------|-------------|
| `x-kalguard-plan` | Current plan tier (`free`, `pro`, `enterprise`) |
| `x-kalguard-usage-remaining` | Remaining checks for the day |
| `x-ratelimit-reset` | Unix timestamp when the limit resets |

## License

Apache-2.0. See [LICENSE](LICENSE).

---

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/281149417?s=96&v=4" width="28" />
  <b>by Infrarix</b>
</p>

> Part of the **Infrarix AI Infrastructure ecosystem**
