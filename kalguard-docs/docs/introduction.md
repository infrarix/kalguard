---
sidebar_position: 1
id: introduction
title: Introduction
description: KalGuard — an open-source, Zero Trust security layer for AI agents.
keywords: [kalguard, ai security, agent security, runtime security, zero trust]
---

# Introduction

**KalGuard** is an open-source, enterprise-grade security layer for AI agents. It runs as a **sidecar process** that mediates every prompt and tool call your agent makes — enforcing policy, filtering dangerous inputs, and producing an immutable audit trail.

## The Problem

Autonomous AI agents introduce a class of risk that traditional application security does not address:

| Challenge | Impact |
|-----------|--------|
| **Prompt injection** | Adversarial inputs can override agent instructions |
| **Uncontrolled tool access** | Agents may invoke dangerous operations without authorization |
| **Lack of audit trail** | No structured record of what the agent actually did |
| **Implicit trust** | Most frameworks assume the agent is trustworthy by default |

## The KalGuard Approach

KalGuard treats every agent as **untrusted by default** and enforces five design principles:

1. **Zero Trust** — every request is validated against policy before execution.
2. **Fail Closed** — if evaluation errors or the sidecar is unreachable, access is denied.
3. **Agent Agnostic** — works with OpenAI, Anthropic, LangChain, custom frameworks, or local models.
4. **Environment Agnostic** — deploy locally, in Docker, on Kubernetes, or on bare-metal VMs.
5. **Security as Infrastructure** — the sidecar is a separate process, not library code inside your agent.

## Core Components

```text
┌──────────────┐     HTTP / SDK     ┌──────────────────┐
│              │ ─────────────────► │                  │
│   AI Agent   │                    │  KalGuard Sidecar│
│              │ ◄───────────────── │                  │
└──────────────┘   allow / deny     └────────┬─────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                        Policy Engine   Prompt Firewall  Audit Log
                                         Tool Mediator
```

| Component | Responsibility |
|-----------|---------------|
| **Policy Engine** | Evaluates declarative JSON rules (first-match, fail-closed) |
| **Prompt Firewall** | Risk scoring, injection detection, PII redaction, content filtering |
| **Tool Mediator** | Allowlist/denylist, schema validation, per-tool rate limiting |
| **Agent Identity** | Short-lived JWT tokens scoped to specific capabilities |
| **Audit Logger** | Structured, append-only JSON logs (SIEM-ready) |
| **SDK Client** | TypeScript helper that wraps HTTP calls to the sidecar |

## Use Cases

- **Enterprise AI deployments** — enforce uniform security policy across an agent fleet.
- **Regulated industries** — maintain audit trails and access controls for compliance.
- **Multi-tenant platforms** — isolate agent capabilities per customer or environment.
- **Development & testing** — sandbox agent behavior before promoting to production.

## What's Next?

- **[Quick Start](/docs/quick-start)** — get KalGuard running in five minutes.
- **[Architecture](/docs/concepts/architecture)** — understand the sidecar model in depth.
- **[Installation](/docs/installation)** — comprehensive install guide for every platform.
