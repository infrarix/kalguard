---
sidebar_position: 1
id: architecture
title: Architecture
description: KalGuard's sidecar architecture, request flow, and security model.
keywords: [architecture, sidecar, zero trust, design, security model]
---

# Architecture

KalGuard follows a **sidecar pattern**: the security layer runs as an independent process alongside your AI agent, communicating over HTTP.

## Component Overview

```text
┌──────────────┐       HTTP        ┌───────────────────────────────┐
│              │ ────────────────► │  KalGuard Sidecar             │
│   AI Agent   │                   │                               │
│  (any framework) ◄────────────── │  ┌─────────┐  ┌───────────┐  │
└──────────────┘  allow / deny     │  │ Policy   │  │ Prompt    │  │
                                   │  │ Engine   │  │ Firewall  │  │
                                   │  └─────────┘  └───────────┘  │
                                   │  ┌─────────┐  ┌───────────┐  │
                                   │  │ Tool     │  │ Agent     │  │
                                   │  │ Mediator │  │ Identity  │  │
                                   │  └─────────┘  └───────────┘  │
                                   │  ┌───────────────────────┐   │
                                   │  │     Audit Logger      │   │
                                   │  └───────────────────────┘   │
                                   │  ┌───────────────────────┐   │
                                   │  │  Cloud Connector (opt)│   │
                                   │  └───────────┬───────────┘   │
                                   └──────────────┼───────────────┘
                                                  │ HTTPS (optional)
                                                  ▼
                                   ┌───────────────────────────────┐
                                   │  KalGuard Cloud Dashboard     │
                                   │  (license, usage, analytics)  │
                                   └───────────────────────────────┘
```

| Component | Package | Responsibility |
|-----------|---------|---------------|
| **Policy Engine** | `kalguard-core` | Evaluates requests against a declarative JSON rule set. First-match semantics; fail-closed default. |
| **Prompt Firewall** | `kalguard-core` | Scores prompt risk (0–1), detects injection patterns, redacts PII, filters harmful content. |
| **Tool Mediator** | `kalguard-core` | Validates tool names and arguments against registered schemas; enforces allowlists and rate limits. |
| **Agent Identity** | `kalguard-core` | Issues and verifies short-lived JWT tokens scoped to specific agent capabilities. |
| **Audit Logger** | `kalguard-sidecar` | Writes every decision as a structured, append-only JSON record. |
| **Sidecar Server** | `kalguard-sidecar` | HTTP server that ties all components together and exposes the `/v1/` API. |
| **Cloud Connector** | `kalguard-sidecar` | Optional module that validates license, enforces plan limits, and reports usage to KalGuard Cloud. |
| **SDK Client** | `kalguard-sdk` | TypeScript client with `checkPrompt()` and `checkTool()` helpers. Exposes plan info from cloud headers. |

## Request Flow

### Prompt Check

1. Agent prepares a message array and calls `withPromptCheck()` (or `POST /v1/prompt/check`).
2. Sidecar verifies the agent token (JWT signature + expiry + capabilities).
3. Policy engine evaluates the request against the rule set.
4. Prompt firewall computes a risk score and, if the score exceeds the sanitize threshold, rewrites the messages (PII redaction, injection removal).
5. If the score exceeds the block threshold, the request is **denied**.
6. An audit record is written.
7. The response is returned — `allowed: true` with sanitized messages, or `allowed: false` with a reason.

### Tool Execution

1. Agent calls `withToolCheck()` (or `POST /v1/tool/check`) with the tool name and arguments.
2. Token is verified.
3. Policy engine evaluates the rule set for `tool:execute` actions.
4. Tool mediator validates arguments against the registered schema and checks rate limits.
5. Audit record is written.
6. Allow or deny response is returned.

### Cloud Integration (Optional)

When `KALGUARD_API_KEY` is configured, the sidecar connects to KalGuard Cloud:

1. **Startup** — validates the API key and retrieves plan limits (checks/day, features, retention).
2. **Per-request** — checks the cloud rate limiter before processing. Adds plan headers (`x-kalguard-plan`, `x-kalguard-usage-remaining`) to every response.
3. **Background** — usage events are buffered and flushed to the Cloud API in batches (non-blocking, fire-and-forget).
4. **Periodic** — the license is refreshed at the configured interval (default: 5 minutes).
5. **Graceful degradation** — if Cloud is unreachable, the sidecar continues with the cached license or runs in local-only mode.

## Security Model

### Trust Boundaries

| Boundary | Trust Level | Notes |
|----------|------------|-------|
| Agent code | **Untrusted** | May be compromised or manipulated by prompt injection |
| User input | **Untrusted** | Arbitrary; may contain adversarial payloads |
| LLM responses | **Untrusted** | Model output is not guaranteed to be safe |
| KalGuard sidecar | **Trusted** | Must be deployed in a secure, isolated environment |
| Policy file | **Trusted** | Source of truth — version-control and review changes |
| Audit log | **Trusted** | Append-only; protect from tampering |

### What KalGuard Protects Against

- Prompt injection and manipulation attacks
- Unauthorized or out-of-policy tool execution
- Sensitive data leakage (PII redaction)
- Lack of audit trail and accountability

### What KalGuard Does **Not** Protect Against

- A compromised agent that bypasses KalGuard entirely (enforce network-level controls)
- Vulnerabilities in the LLM provider
- Network-level attacks (use TLS and firewall rules)

## Design Principles

1. **Separation of Concerns** — the agent focuses on reasoning; the sidecar handles security.
2. **Fail Closed** — errors and unreachable sidecars always result in denial.
3. **Stateless** — sidecars hold no session state and can be restarted or scaled freely.
4. **Immutable Audit** — logs are append-only JSON; no update or delete operations.

## Performance

| Metric | Typical Value |
|--------|--------------|
| Prompt check latency | 5–20 ms |
| Tool check latency | 3–10 ms |
| Throughput (single instance) | 1 000+ req/s |
| Memory footprint | 100–200 MB |

## Next Steps

- [Policy Engine](/docs/concepts/policy-engine) — rule syntax and evaluation semantics.
- [Prompt Firewall](/docs/concepts/prompt-firewall) — risk scoring and detection details.
- [Deployment](/docs/deployment/overview) — production deployment patterns.
