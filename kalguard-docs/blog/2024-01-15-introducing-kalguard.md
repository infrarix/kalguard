---
slug: introducing-kalguard
title: Introducing KalGuard
authors:
  name: KalGuard Team
tags: [announcement, security]
---

# Introducing KalGuard: Enterprise AI Agent Security

We're excited to announce **KalGuard**, an open-source, framework-agnostic security platform for AI agents.

{/* truncate */}

## The Problem

AI agents are powerful but introduce unique security challenges:

- Prompt injection attacks
- Uncontrolled tool access
- Lack of audit trails
- Difficult to enforce policies

## The Solution

KalGuard provides:

- **Prompt Firewall**: Detect and sanitize malicious prompts
- **Tool Mediation**: Control what tools agents can execute
- **Policy Engine**: Declarative security policies
- **Agent Identity**: JWT-based authentication
- **Audit Logging**: Complete visibility

## How It Works

The agent sends all prompts and tool executions to KalGuard for validation before execution.

## Get Started

```bash
pnpm add kalguard
```

Check out the [Quick Start Guide](/docs/quick-start) to get started.
