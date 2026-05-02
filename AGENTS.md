# Agent Instructions — KalGuard

**KalGuard** is an enterprise-grade, open-source AI agent runtime security platform. This is a **pnpm workspace + Turbo monorepo** with 4 packages: `@kalguard/core`, `@kalguard/sdk`, `@kalguard/sidecar`, and `kalguard` (umbrella).

## Quick Start

```bash
pnpm install          # Workspace linking
pnpm build            # Turbo builds all packages in dependency order
pnpm test             # Run all tests (requires NODE_OPTIONS=--experimental-vm-modules)
pnpm test:coverage    # Coverage (70% thresholds enforced)
pnpm start            # Start sidecar on http://0.0.0.0:9292
pnpm format           # Prettier format (committed files MUST be formatted)
```

**Development:**
- Build single package: `pnpm --filter @kalguard/core build`
- Watch mode: Not configured (manual rebuild)
- Clean: `pnpm clean` (removes `dist/` + `node_modules/`)

## Critical: TypeScript ESM Rules

⚠️ **All imports MUST include `.js` extension**, even for `.ts` files:

```typescript
// ❌ WRONG — Will break
import { PolicyEngine } from './policy/engine';

// ✅ CORRECT — Always use .js
import { PolicyEngine } from './policy/engine.js';
```

**Why:** Strict ESM with `"type": "module"` and `moduleResolution: "NodeNext"`. Jest uses `moduleNameMapper` to resolve `.js` → `.ts` at test time.

**Other ESM requirements:**
- No `require()` or `module.exports` (pure ESM only)
- All package.json have `"type": "module"`
- Tests: `NODE_OPTIONS=--experimental-vm-modules npx jest`

## Commit Conventions (Enforced)

**Commitlint with mandatory scopes:**
```bash
# Format: type(scope): message
# Scope is REQUIRED (not optional)

feat(core): add policy engine caching
fix(sidecar): handle missing env vars gracefully
docs(readme): update quick start guide
chore(deps): bump jest to 29.7.0
```

**Valid scopes:** `core`, `sdk`, `sidecar`, `kalguard`, `docs`, `release`, `deps`, `ci`, `repo`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Commits failing this format will be rejected by `husky` pre-commit hook.

## Package Architecture

| Package | Purpose | Depends On |
|---------|---------|------------|
| **@kalguard/core** | Policy engine, prompt firewall, agent identity, tool mediator | None |
| **@kalguard/sdk** | `KalGuardClient`, `withPromptCheck`, `withToolCheck` | `@kalguard/core` |
| **@kalguard/sidecar** | HTTP server + CLI (`kalguard-sidecar` bin) | `@kalguard/core` |
| **kalguard** | Umbrella package (re-exports SDK for branding) | `@kalguard/sdk`, `@kalguard/core` |

**Data flow:** Agent → Sidecar HTTP (`POST /v1/prompt/check` or `/v1/tool/check`) → Policy Engine → Prompt Firewall / Tool Mediator → Audit Log → `SecurityResponse`

**Fail-closed principle:** No policy, error, or missing token = deny. Never expose raw errors to agents.

## Testing Requirements

**Jest with ESM preset:**
- Run: `NODE_OPTIONS=--experimental-vm-modules npx jest`
- Config: `jest.config.js` (root), uses `ts-jest/presets/default-esm`
- Test location: `packages/*/test/**/*.test.ts` (mirrors `src/` structure)

**Coverage thresholds (CI enforced):**
- 70% branches, functions, lines, statements
- Collectible: `packages/*/src/**/*.ts` (excludes `/dist/`, `/test/`, `/cmd/`)

**Test patterns:**
- **Fail-closed first:** Test deny behavior before allow (e.g., "denies when no policy loaded")
- Use descriptive test names: `it('denies access when policy evaluation throws error')`
- Mock external dependencies (no network calls, file I/O in unit tests)

## Code Conventions

**TypeScript strict mode:**
- All strict flags enabled (`noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`)
- Array access: `arr[0]` returns `T | undefined` (handle with `!` or explicit check)
- Immutability: Use `readonly` for props, `Readonly<T>` for objects

**Naming:**
- Files: `kebab-case.ts` (e.g., `policy-engine.ts`)
- Types/Interfaces: `PascalCase` (e.g., `SecurityResponse`)
- Functions/Variables: `camelCase` (e.g., `evaluatePolicy`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `DEFAULT_PORT`)

**Copyright headers:**
- Every source file must start with Apache 2.0 license header (see existing files)

## Environment Variables (Sidecar)

```bash
KALGUARD_PORT=9292                          # HTTP server port
KALGUARD_HOST=0.0.0.0                       # Bind address
KALGUARD_TOKEN_SECRET=<32+ char hex>        # JWT signing (required for prod)
KALGUARD_POLICY_PATH=/path/to/policy.json   # Policy file (default: ./policy.json)
KALGUARD_POLICY_WATCH=true                  # Hot reload policy (500ms debounce)
KALGUARD_AUDIT_LOG_PATH=/var/log/kalguard   # Audit log directory (default: ./logs)
```

**Critical:** `KALGUARD_TOKEN_SECRET` must be ≥32 chars hex. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Common Pitfalls

1. **Missing `.js` extensions** — Biggest ESM gotcha; always use `.js` in imports
2. **Running tests without `NODE_OPTIONS`** — Jest will fail on ESM; use `pnpm test` script
3. **Commitlint scope errors** — Scope is mandatory; use one of the valid scopes
4. **Turbo cache issues** — Run `pnpm clean` if builds behave unexpectedly
5. **Workspace dependencies** — Use `workspace:*` in package.json, not version ranges
6. **Array indexing** — `noUncheckedIndexedAccess` means `arr[0]` is `T | undefined`

## Documentation

**Detailed guides (link, don't duplicate):**
- [Architecture & Zero Trust Principles](docs/architecture.md)
- [Integration Guide (HTTP + SDK)](docs/integration-guide.md)
- [Security Assumptions](docs/security-assumptions.md)
- [Deployment (Docker, K8s, systemd)](docs/deployment.md)
- [Publishing to npm](docs/publishing.md)

**Example code:**
- [Simple Agent Example](examples/simple-agent/README.md) — Complete working integration

**Key config files:**
- `turbo.json` — Build pipeline, outputs, dependencies
- `jest.config.js` — ESM preset, coverage thresholds
- `commitlint.config.cjs` — Conventional commits + mandatory scopes
- `pnpm-workspace.yaml` — Workspace packages

## Changesets & Release

**Versioning workflow:**
```bash
pnpm changeset              # Create changeset (automated via commit messages)
pnpm changeset:version      # Bump versions + update CHANGELOGs
pnpm changeset:publish      # Build + publish to npm
```

Changesets are **auto-generated** from commit messages by `.github/changeset-autogenerate.mjs` during CI. Manual changesets not required.

**Release process:**
- CI runs on `main` branch push
- Changesets action creates PR with version bumps
- Merge PR → packages auto-publish to npm (if `NPM_TOKEN` is set)

## When to Create Skills/Hooks

**Consider custom agent-customizations for:**
- **Skill**: Automating policy file generation from templates
- **Skill**: Sandbox profile creation (seccomp, AppArmor)
- **Skill**: Integration test scaffolding (sidecar + mock agent)
- **Hook**: Pre-commit format check (already handled by `lint-staged`)
- **Hook**: Pre-push test validation (optional enhancement)

---

**First-time contributors:** Read [CONTRIBUTING.md](CONTRIBUTING.md) for PR process, code style, and testing requirements.

**Security issues:** Email **security@kalguard.dev** (do not open public issues). See [SECURITY.md](SECURITY.md).
