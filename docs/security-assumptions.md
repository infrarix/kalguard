# Security Assumptions

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

## What KalGuard Assumes

- **Sidecar is in the request path**: Agents cannot bypass the sidecar for mediated actions (prompt check, tool check). Deployment must ensure traffic flows through the sidecar.
- **Token secret is protected**: The sidecar's token verification secret must be stored and accessed securely (e.g., secrets manager, env in controlled deployment).
- **Audit log integrity**: File-based audit log is append-only; assume OS and access controls protect the log from tampering. For high assurance, use a write-once store or SIEM ingestion.
- **Policy is correct**: Policy author is trusted; KalGuard does not verify policy semantics beyond structure. First matching rule wins; default is used when no rule matches.

## What KalGuard Does Not Assume

- **Agent internals**: No assumption about which framework or model the agent uses. Generic prompt and tool check APIs.
- **User identity**: Agent identity is separate; user mapping (if any) is out of scope for the runtime.
- **Network topology**: Works in local, Docker, K8s, VMs; no assumption about where the sidecar runs.

## Fail-Closed Behavior

- No policy loaded → **deny**.
- Policy evaluation throws → **deny**.
- Invalid or missing token → **deny** (401).
- Missing capability → **deny** (403).
- Policy decision `deny` or `require_approval` → **deny** (403).
- Prompt firewall risk score ≥ block threshold → **deny**.
- Tool not on allowlist / on denylist / schema invalid / command denylist matched / rate limit exceeded → **deny**.

Never return raw errors to agents; always return structured `SecurityResponse` with `allowed`, `decision`, `message`, `requestId`.
