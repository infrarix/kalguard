# Simple Agent Integration Example

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

This example shows how to integrate KalGuard into a minimal Node.js agent using the SDK. The agent checks every prompt and every tool call with the sidecar before proceeding.

## Prerequisites

1. **Build KalGuard** (from repo root, pnpm workspace):
   ```bash
   pnpm install
   pnpm run build
   ```

2. **Start the sidecar** (in one terminal):
   ```bash
   # From repo root; use a policy that allows agent-1
   KALGUARD_TOKEN_SECRET=dev-secret KALGUARD_POLICY_PATH=./deploy/policy.example.json pnpm start
   ```

3. **Create an agent token** (see below) and set `KALGUARD_AGENT_TOKEN`.

## Run the example

From **repo root** (so `kalguard` resolves from the workspace):

```bash
# Issue a token for agent-1 (using kalguard/core; run from repo root after pnpm install)
export KALGUARD_AGENT_TOKEN=$(node --input-type=module -e "
const m = await import('kalguard/core');
console.log(m.createAgentToken('agent-1', ['prompt:send', 'tool:execute'], { secret: 'dev-secret', expiresInMs: 3600000 }));
")

export KALGUARD_SIDECAR_URL=http://localhost:9292
node examples/simple-agent/agent.js
```

Or set a token from your issuer and run:

```bash
export KALGUARD_AGENT_TOKEN="..."  # from your token issuer
export KALGUARD_SIDECAR_URL=http://localhost:9292
node examples/simple-agent/agent.js
```

From **another project** (after `pnpm add kalguard`): use the same env vars and run your script that `import { KalGuardClient, ... } from 'kalguard'`.

## What the example does

- Creates a `KalGuardClient` with `KALGUARD_SIDECAR_URL` and `KALGUARD_AGENT_TOKEN`.
- **Before LLM**: calls `withPromptCheck(kalguard, messages, fn)` — if denied, throws; otherwise runs a mock LLM with (optionally sanitized) messages.
- **Before tool**: calls `withToolCheck(kalguard, toolName, args, fn)` — if denied, throws; otherwise runs a mock tool.

No real LLM or tools are used; the example only demonstrates the integration pattern.

## Policy

Ensure the sidecar policy allows `agent-1` for `prompt:check` and `tool:execute`. The repo’s `deploy/policy.example.json` uses `agent-1`; if you use a different agent ID, add a rule for it or change the example’s token subject.
