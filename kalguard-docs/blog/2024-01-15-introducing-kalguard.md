---
slug: introducing-kalguard
title: Introducing KalGuard
authors: [kalguard]
tags: [announcement, security]
---

# Introducing KalGuard: Enterprise AI Agent Security

We're excited to announce **KalGuard**, an open-source, framework-agnostic security platform for AI agents.

{/* truncate */}

## The Problem

AI agents are powerful but introduce unique security challenges:

- **Prompt injection attacks** — malicious inputs that hijack agent behavior
- **Uncontrolled tool access** — agents executing dangerous operations without authorization
- **Lack of audit trails** — no visibility into what agents actually did
- **Difficult to enforce policies** — security rules scattered across application code

## The Solution

KalGuard provides a **zero-trust, fail-closed security layer** that sits between your agent and the outside world:

- **Prompt Firewall** — Detect and sanitize malicious prompts before they reach the LLM
- **Tool Mediation** — Control exactly which tools agents can execute, with what arguments
- **Policy Engine** — Declarative, composable security policies with hot-reload support
- **Agent Identity** — JWT-based authentication and per-agent authorization
- **Immutable Audit Logging** — Append-only, signed audit trail for every decision

## Architecture

KalGuard runs as a **sidecar process** — not embedded in your agent. This means:

- Works with **any framework** (LangChain, AutoGPT, custom agents)
- Simple HTTP API or TypeScript SDK integration
- Deploy alongside your agent in Docker, Kubernetes, or bare metal
- No vendor lock-in — swap it out without changing your agent code

## Free & Cloud Options

KalGuard is fully functional as a **free, self-hosted** open-source project. For teams that need more, **KalGuard Cloud** adds managed rate limiting, usage analytics, and extended audit retention through a simple API key.

| Feature | Free (OSS) | Cloud Pro |
|---------|-----------|-----------|
| Policy Engine | Full | Full |
| Prompt Firewall | Full | Full |
| Rate Limiting | Manual config | Cloud-managed |
| Audit Retention | Local storage | 90-day cloud |
| Checks/day | Unlimited (self-hosted) | 100K |

## Get Started

```bash
pnpm add kalguard
```

Check out the [Quick Start Guide](/docs/quick-start) to get started, or read the [Cloud documentation](/docs/cloud) for managed features.
