# KalGuard Architecture

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

## Overview

KalGuard is an **agent-agnostic**, **environment-agnostic** runtime security layer for AI agents. It does not assume agent internals and works across local, Docker, Kubernetes, VMs, and macOS/Linux/Windows.

## Core Principles

- **Zero Trust**: Agents are untrusted by default; all actions are mediated.
- **Fail Closed**: If policy evaluation fails or is ambiguous, the decision is **deny**.
- **Security as Infrastructure**: Implemented as a sidecar proxy + optional SDK; not a library embedded in agent logic.

## Integration Modes

### 1. Sidecar Proxy (Primary)

- HTTP server running locally (or in-pod in K8s).
- Intercepts: LLM API calls (prompt check), tool execution requests, and can be extended for network egress.
- Zero agent code changes: agents point their HTTP client at the sidecar; sidecar forwards or denies.
- Endpoints: `POST /v1/prompt/check`, `POST /v1/tool/check`, `GET /health`.

### 2. SDK Interceptor (Secondary)

- Lightweight Node.js client (`KalGuardClient`).
- Wraps LLM calls and tool execution with one-line helpers: `withPromptCheck`, `withToolCheck`.
- One-line integration: instantiate client with base URL and token; call check before executing.

### 3. OS-Level Enforcement (Optional Extension)

- Linux: seccomp/AppArmor hooks — generates OCI-compatible seccomp profiles and Docker/containerd flags.
- macOS: `sandbox-exec` integration — `runInSandbox` automatically wraps child processes in `sandbox-exec` when a `darwin` config is provided and the host platform is macOS.
- Windows: documented enforcement steps for job objects and integrity levels — outputs required Windows API steps for callers using the container runtime.

## Trust Boundaries

- **Agent identity ≠ user identity**: Agents have short-lived tokens and scoped capabilities.
- **All decisions are mediated**: Policy engine + prompt firewall + tool mediator; no direct tool execution without allowlist and schema validation.
- **Structured responses only**: Raw errors are never returned to agents; only `SecurityResponse` with `allowed`, `decision`, `message`, `requestId`.

## Data Flow

1. Request arrives at sidecar with `Authorization: Bearer <token>`.
2. Token validated → agent identity and capabilities.
3. Policy engine evaluates context (agentId, action, resource) → allow / deny / require_approval.
4. For prompt: prompt firewall evaluates messages → risk score, injection detection, optional sanitization.
5. For tool: tool mediator checks allowlist, denylist, argument schema, command denylist, rate limit.
6. All deny decisions and security events are written to the audit log (immutable, structured JSON, SIEM-ready).

## Performance

- Policy decisions are designed to complete in &lt; 100ms.
- Async where possible; no blocking I/O in hot paths (audit append is async).
