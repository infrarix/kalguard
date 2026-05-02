# Changelog

All notable changes to this project will be documented in this file.

This project uses [Changesets](https://github.com/changesets/changesets) for automated versioning and changelog generation. See individual package changelogs for detailed per-package changes.

## [0.1.0] - 2025-01-01

### 🎉 Initial Release

#### kalguard/core
- Policy engine with first-match rule evaluation and fail-closed defaults
- Prompt firewall with 12 injection detection patterns and risk scoring
- Agent identity system with JWT-based short-lived tokens and capability scoping
- Tool mediator with allowlist/denylist, argument schema validation, and rate limiting
- Security event monitoring and immutable audit entry generation
- Request-scoped runtime context

#### kalguard/sdk
- Lightweight `KalGuardClient` for sidecar integration
- `withPromptCheck()` and `withToolCheck()` secure wrappers
- Structured error handling with error codes and request IDs

#### kalguard/sidecar
- HTTP sidecar server with prompt check and tool check endpoints
- Zod-validated configuration from environment variables
- Policy file hot-reload with debounced file watching
- File-based and in-memory audit logging
- Sandbox runner with timeout, env allowlist, and macOS sandbox-exec support
- Linux seccomp profile generation and AppArmor config
- Darwin and Windows OS enforcement documentation helpers

#### kalguard (umbrella)
- Re-exports `KalGuardClient`, `withPromptCheck`, `withToolCheck` from SDK
- Re-exports all core types and utilities via `kalguard/core`
