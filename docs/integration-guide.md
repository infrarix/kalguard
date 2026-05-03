# Integrating KalGuard into Any Agent

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

This guide explains how to integrate the AI Agent Runtime Security Platform (KalGuard) into **any** AI agent—OpenAI/Anthropic-style, OpenClaw, custom, local, or cloud. Integration is **agent-agnostic**: you only need to call KalGuard **before** each LLM request and **before** each tool execution.

---

## Overview: Two Integration Modes

| Mode | Best for | Agent code changes |
|------|----------|--------------------|
| **Sidecar + HTTP** | Any language (Python, Go, Rust, etc.) | Call KalGuard HTTP endpoints before LLM and before tool |
| **Sidecar + SDK** | Node.js/TypeScript agents | One-line wrappers: `withPromptCheck`, `withToolCheck` |

In both modes:

1. **Run the KalGuard sidecar** (same process, container, or cluster).
2. **Obtain an agent token** (short-lived; scoped capabilities).
3. **Before every LLM call**: ask KalGuard to check the prompt; use sanitized messages if returned; if denied, do not call the LLM.
4. **Before every tool call**: ask KalGuard to check the tool; if denied, do not run the tool.

KalGuard never executes your LLM or tools; it only returns **allow** or **deny** (and optionally sanitized prompts).

---

## Prerequisites

1. **Sidecar running**  
   ```bash
   npm start
   # Or: docker run ... kalguard-sidecar
   ```  
   Default: `http://localhost:9292`.

2. **Agent token**  
   Must be a short-lived token signed with the same secret as `KALGUARD_TOKEN_SECRET`.  
   See [Getting agent tokens](#getting-agent-tokens) below.

3. **Policy allows your agent**  
   Policy must allow your agent ID for `prompt:check` and `tool:execute`.  
   Example: [Policy format](README.md#policy-format-json) in the main README.

---

## Option A: Integrate via HTTP (Any Language)

Use this when your agent is in **Python, Go, Rust, Java**, or any language that can send HTTP requests.

### 1. Before calling the LLM

- **Endpoint:** `POST /v1/prompt/check`
- **Headers:** `Authorization: Bearer <agent-token>`, `Content-Type: application/json`
- **Body:** `{ "messages": [ { "role": "system"|"user"|"assistant"|"tool", "content": "..." } ] }`
- **Success (200):** `allowed: true`. Optionally use `data.sanitizedMessages` instead of `messages` when present.
- **Deny (403):** `allowed: false`; do **not** call the LLM. Log `message`, `errorCode`, `requestId`.

Example (pseudocode):

```python
# Python
def call_llm_safely(messages):
    r = requests.post(
        "http://localhost:9292/v1/prompt/check",
        headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
        json={"messages": messages},
    )
    data = r.json()
    if not data.get("allowed"):
        raise SecurityDenied(data.get("message"), data.get("errorCode"))
    messages_to_use = data.get("data", {}).get("sanitizedMessages") or messages
    return your_llm_client.chat(messages_to_use)
```

### 2. Before executing a tool

- **Endpoint:** `POST /v1/tool/check`
- **Headers:** `Authorization: Bearer <agent-token>`, `Content-Type: application/json`
- **Body:** `{ "toolName": "get_weather", "arguments": { "location": "NYC" } }`
- **Success (200):** `allowed: true`; proceed to run the tool.
- **Deny (403):** `allowed: false`; do **not** run the tool. Log `message`, `errorCode`, `requestId`.

Example (pseudocode):

```python
# Python
def run_tool_safely(tool_name, arguments):
    r = requests.post(
        "http://localhost:9292/v1/tool/check",
        headers={"Authorization": f"Bearer {AGENT_TOKEN}"},
        json={"toolName": tool_name, "arguments": arguments},
    )
    data = r.json()
    if not data.get("allowed"):
        raise SecurityDenied(data.get("message"), data.get("errorCode"))
    return your_tool_runner.run(tool_name, arguments)
```

### 3. Optional: Request ID

Send `x-kalguard-request-id` with a unique value per request so logs and audit entries can be correlated.

---

## Option B: Integrate via SDK (Node.js / TypeScript)

Use this when your agent runs in **Node.js** or **TypeScript**. The SDK wraps the HTTP calls and throws structured errors on deny.

### 1. Install and create client

```bash
npm install kalguard
# Or link locally: npm link /path/to/kalguard
```

```ts
import { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard';

const kalguard = new KalGuardClient({
  baseUrl: process.env.KALGUARD_SIDECAR_URL ?? 'http://localhost:9292',
  token: process.env.KALGUARD_AGENT_TOKEN!,
});
```

### 2. Before calling the LLM

Use **sanitized messages** when KalGuard returns them (e.g. after redacting risky content):

```ts
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userInput },
];

const llmResponse = await withPromptCheck(kalguard, messages, async (sanitizedMessages) => {
  return await yourLLM.chat(sanitizedMessages);
});
```

If the prompt is denied, `withPromptCheck` throws an error with `code` (e.g. `PROMPT_DENIED`) and `requestId`. Do not call the LLM.

### 3. Before executing a tool

```ts
const result = await withToolCheck(
  kalguard,
  'get_weather',
  { location: 'NYC' },
  async () => yourToolRunner.run('get_weather', { location: 'NYC' })
);
```

If the tool is denied, `withToolCheck` throws with `code` (e.g. `TOOL_DENIED`) and `requestId`. Do not run the tool.

### 4. Minimal agent loop (Node/TS)

```ts
async function runAgent(userInput: string) {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: userInput },
  ];

  while (true) {
    // 1) Check prompt with KalGuard, then call LLM
    const response = await withPromptCheck(kalguard, messages, async (msgs) => llm.chat(msgs));
    messages.push({ role: 'assistant', content: response.content });

    if (response.finishReason === 'stop') break;

    // 2) Parse tool call from LLM output, then check with KalGuard before running
    const { toolName, args } = parseToolCall(response);
    const toolResult = await withToolCheck(kalguard, toolName, args, () => tools.run(toolName, args));
    messages.push({ role: 'tool', content: JSON.stringify(toolResult) });
  }

  return messages;
}
```

---

## Getting Agent Tokens

Agents need a **short-lived token** signed with the same secret the sidecar uses (`KALGUARD_TOKEN_SECRET`). Agent identity is **separate** from user identity.

### Option 1: Issue tokens from your backend (recommended)

Your auth service or API gateway issues a token per agent (or per session) and sets the same secret in the sidecar:

```ts
import { createAgentToken, generateAgentId } from 'kalguard-core';

const agentId = generateAgentId(); // or your stable agent ID
const token = createAgentToken(
  agentId,
  ['prompt:send', 'tool:execute'], // capabilities
  {
    secret: process.env.KALGUARD_TOKEN_SECRET!,
    issuer: 'https://your-platform.com',
    ttlSeconds: 3600,
  }
);
// Return token to the agent (e.g. in login response or env).
```

Ensure your **policy** allows this `agentId` for `prompt:check` and `tool:execute` (see main README policy example).

### Option 2: Single shared token for development

For local/dev only, create one token and set it in the agent's env (e.g. `KALGUARD_AGENT_TOKEN`). Use the same secret in the sidecar. **Do not** use a shared long-lived token in production.

---

## Policy: Allow Your Agent

Policy is loaded by the sidecar (e.g. `KALGUARD_POLICY_PATH`). Rules match on `agentIds` and `actions`. Example that allows one agent for both prompt and tool checks:

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "allow-my-agent-prompt",
      "match": { "agentIds": ["agent_abc123"], "actions": ["prompt:check"] },
      "decision": "allow",
      "reason": "allowed"
    },
    {
      "id": "allow-my-agent-tool",
      "match": { "agentIds": ["agent_abc123"], "actions": ["tool:execute"] },
      "decision": "allow",
      "reason": "allowed"
    }
  ],
  "defaultDecision": "deny",
  "defaultReason": "no matching rule"
}
```

Replace `agent_abc123` with the `agentId` (token `sub` claim) your agent uses. First matching rule wins; default is deny.

---

## End-to-End Flow

```
┌─────────────┐     POST /v1/prompt/check      ┌─────────────┐
│   Agent     │ ───────────────────────────────► │   KalGuard   │
│  (your app) │  Authorization: Bearer <token> │   Sidecar   │
│             │  Body: { messages }             │             │
└─────────────┘                                 └──────┬──────┘
       │                                                │
       │ 200 { allowed, data.sanitizedMessages? }       │ policy + prompt
       │ 403 { allowed: false, message }                 │ firewall
       ◄────────────────────────────────────────────────┘
       │
       │  If allowed: call your LLM with (sanitized?) messages
       │
       │     POST /v1/tool/check
       │  ──────────────────────────────►  Sidecar
       │  Body: { toolName, arguments }         │
       │                                        │ policy + tool
       │ 200 { allowed } / 403 { allowed: false }│ mediator
       ◄────────────────────────────────────────┘
       │
       │  If allowed: run tool
```

---

## Checklist

- [ ] Sidecar running and reachable (e.g. `http://localhost:9292`, or your deployment URL).
- [ ] Agent has a token signed with `KALGUARD_TOKEN_SECRET` and policy allows its `agentId` for `prompt:check` and `tool:execute`.
- [ ] Before **every** LLM call: call `POST /v1/prompt/check` (or `withPromptCheck`); if denied, do not call the LLM.
- [ ] Before **every** tool call: call `POST /v1/tool/check` (or `withToolCheck`); if denied, do not run the tool.
- [ ] Use sanitized messages when KalGuard returns them in the prompt-check response.
- [ ] On deny, log/handle structured response (`message`, `errorCode`, `requestId`); never expose raw internals to the agent.

For more detail, see [Architecture](architecture.md) and [Security assumptions](security-assumptions.md).
