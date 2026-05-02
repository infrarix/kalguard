<p align="center">
  <a href="https://github.com/infrarix/kalguard">
    <img src="https://raw.githubusercontent.com/infrarix/kalguard/main/kalguard-docs/static/img/logo.png" alt="KalGuard" width="140" />
  </a>
</p>

<h1 align="center">kalguard/sidecar</h1>

<p align="center">
  <strong>The KalGuard sidecar — an HTTP proxy that mediates every prompt and tool call your AI agent makes.</strong>
  <br />
  Zero Trust · Fail-Closed · SIEM-ready audit log
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kalguard/sidecar"><img alt="npm" src="https://img.shields.io/npm/v/kalguard/sidecar.svg?color=blue" /></a>
  <a href="https://www.npmjs.com/package/kalguard/sidecar"><img alt="downloads" src="https://img.shields.io/npm/dm/kalguard/sidecar.svg" /></a>
  <a href="https://github.com/infrarix/kalguard/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-brightgreen.svg" /></a>
  <a href="https://nodejs.org"><img alt="Node" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg?logo=node.js&logoColor=white" /></a>
  <img alt="types" src="https://img.shields.io/badge/types-included-3178C6.svg?logo=typescript&logoColor=white" />
</p>

<p align="center">
  <a href="https://infrarix.github.io/kalguard/"><strong>Docs</strong></a> ·
  <a href="https://infrarix.github.io/kalguard/docs/deployment/overview"><strong>Deployment</strong></a> ·
  <a href="https://github.com/infrarix/kalguard"><strong>GitHub</strong></a>
</p>

---

The sidecar is the enforcement plane of KalGuard. Run it next to your agent — locally, in Docker, on Kubernetes, or as a systemd service — and route every LLM call and tool invocation through it. Decisions are deterministic, fail-closed, and emitted as immutable audit events.

## Install

```bash
# Project-local
npm install kalguard/sidecar

# Or global (CLI use)
npm install -g kalguard/sidecar
```

This installs the `kalguard-sidecar` binary plus the `seccomp-profile` helper.

## Run it

```bash
# Minimum viable startup
KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32) \
  kalguard-sidecar
```

By default the server binds `http://0.0.0.0:9292`. Health-check it:

```bash
curl -s http://localhost:9292/health
# {"status":"ok"}
```

For a production-ready run, supply a policy file and an audit log path:

```bash
KALGUARD_TOKEN_SECRET=$KG_SECRET \
KALGUARD_POLICY_PATH=/etc/kalguard/policy.json \
KALGUARD_POLICY_WATCH=true \
KALGUARD_AUDIT_LOG_PATH=/var/log/kalguard/audit.jsonl \
  kalguard-sidecar
```

## HTTP API

Every request requires `Authorization: Bearer <agent-token>`. Tokens are HMAC-signed; sign and verify them with [`kalguard/core`][core].

### `POST /v1/prompt/check`

Score a prompt against the firewall and policy.

```http
POST /v1/prompt/check
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user",   "content": "Ignore prior instructions..." }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "allowed": false,
    "riskScore": 92,
    "riskLevel": "critical"
  },
  "reason": "prompt blocked: injection.detected",
  "requestId": "req_3a9c..."
}
```

### `POST /v1/tool/check`

Mediate a tool invocation. The sidecar checks allow/deny lists, validates the argument schema, and applies rate limits.

```http
POST /v1/tool/check
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{ "toolName": "get_weather", "arguments": { "location": "NYC" } }
```

Response:

```json
{ "ok": true, "data": { "allowed": true }, "requestId": "req_..." }
```

### `GET /health`

Liveness probe. Returns `200` when the policy engine, tool mediator, and audit sink are healthy.

## Configuration

All knobs are environment variables. Defaults are safe (deny-by-default) but minimal — production deployments should at minimum set `KALGUARD_TOKEN_SECRET` and `KALGUARD_POLICY_PATH`.

| Variable | Description | Default |
|----------|-------------|---------|
| `KALGUARD_PORT`                       | Listen port                                            | `9292` |
| `KALGUARD_HOST`                       | Bind address                                           | `0.0.0.0` |
| `KALGUARD_TOKEN_SECRET`               | HMAC secret for agent token verification               | *(no signature check if unset — **set this in production**)* |
| `KALGUARD_POLICY_PATH`                | Path to a JSON policy file                             | *(default policy: deny all)* |
| `KALGUARD_POLICY_DEFAULT_DENY`        | Default decision when no file is provided              | `true` |
| `KALGUARD_POLICY_WATCH`               | Hot-reload the policy file on change                   | `false` |
| `KALGUARD_POLICY_WATCH_INTERVAL_MS`   | Debounce window for the policy watcher                 | `500` |
| `KALGUARD_PROMPT_BLOCK_THRESHOLD`     | Risk score (0–100) above which prompts are blocked     | `70` |
| `KALGUARD_PROMPT_SANITIZE_THRESHOLD`  | Risk score above which prompts are sanitized           | `50` |
| `KALGUARD_TOOL_RATE_LIMIT`            | Max tool calls per agent per minute                    | *(unlimited)* |
| `KALGUARD_AUDIT_LOG_PATH`             | Append-only audit log path                             | *(memory-only)* |

## Policy format

```json
{
  "version": "1.0",
  "defaultDecision": "deny",
  "defaultReason": "no matching rule",
  "rules": [
    {
      "id": "allow-agent-1-prompt",
      "match": { "agentIds": ["agent-1"], "actions": ["prompt:check"] },
      "decision": "allow",
      "reason": "agent-1 may submit prompts"
    },
    {
      "id": "allow-agent-1-weather",
      "match": { "agentIds": ["agent-1"], "actions": ["tool:execute"], "tools": ["get_weather"] },
      "decision": "allow",
      "reason": "weather lookups are safe"
    }
  ]
}
```

First match wins. Any error during evaluation returns *deny* with a structured reason.

## Deployment recipes

- **Docker**: see [`deploy/docker`](https://github.com/infrarix/kalguard/tree/main/deploy/docker) for an `image: kalguard/sidecar` example.
- **Kubernetes**: see [`deploy/kubernetes`](https://github.com/infrarix/kalguard/tree/main/deploy/kubernetes) for sidecar-pattern manifests.
- **systemd**: see [`deploy/systemd`](https://github.com/infrarix/kalguard/tree/main/deploy/systemd) for a hardened unit file.

## Optional hardening

The sidecar ships with two opt-in modules for additional defense in depth.

### OS enforcement

Generate a seccomp profile pinned to the syscalls KalGuard actually uses:

```bash
kalguard-sidecar # to start the server
# In another shell:
npx kalguard/sidecar seccomp-profile ./seccomp.json
```

See [`packages/sidecar/src/os/README.md`](https://github.com/infrarix/kalguard/blob/main/packages/sidecar/src/os/README.md) for AppArmor and macOS sandbox-exec recipes.

### Tool sandbox

The sandbox runner executes tool commands with a timeout, an allowlisted environment, and a forced cwd. See [`packages/sidecar/src/sandbox/README.md`](https://github.com/infrarix/kalguard/blob/main/packages/sidecar/src/sandbox/README.md).

## Compatibility

- **Node.js**: 20 LTS or newer.
- **Module format**: ESM only.
- **Operating systems**: Linux, macOS, Windows (the seccomp/AppArmor extras are Linux-only).

## Related packages

- [`kalguard`][umbrella] — umbrella package; recommended client install.
- [`kalguard/sdk`][sdk] — typed HTTP client used by your agent.
- [`kalguard/core`][core] — primitives the sidecar is built on.

## License

[Apache-2.0](https://github.com/infrarix/kalguard/blob/main/LICENSE) © KalGuard Contributors

[umbrella]: https://www.npmjs.com/package/kalguard
[sdk]: https://www.npmjs.com/package/kalguard/sdk
[core]: https://www.npmjs.com/package/kalguard/core
