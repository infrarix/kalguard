# Publishing KalGuard to npm

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

This repo is a pnpm workspace + Turbo monorepo. Publishable packages:

| Package | npm name | Use case |
|---------|----------|----------|
| Main (branding) | **kalguard** | `pnpm add kalguard` — re-exports SDK |
| SDK | **kalguard-sdk** | Agent integration (client, withPromptCheck, withToolCheck) |
| Core | **kalguard-core** | Types, policy engine, agent identity, prompt firewall, tool mediation |
| Sidecar | **kalguard-sidecar** | Run the sidecar proxy (bin: `kalguard-sidecar`) |

## Prerequisites

- [pnpm](https://pnpm.io/) (e.g. `corepack enable && corepack prepare pnpm@latest --activate`)
- npm account; for scoped packages `kalguard/*`, create org **kalguard** or use your scope (e.g. `@your-org/sdk`)

## Versioning and publish order

1. Bump version in each package that changed (or use a tool like [changesets](https://github.com/changesets/changesets)).
2. Publish in dependency order so workspace deps resolve:
   - **kalguard-core** (no internal deps)
   - **kalguard-sdk** (depends on kalguard-core)
   - **kalguard-sidecar** (depends on kalguard-core)
   - **kalguard** (depends on kalguard-core, kalguard-sdk)

## One-time: npm login and scope

```bash
npm login
# If using scope kalguard: ensure org "kalguard" exists on npm, or use your scope in package.json "name": "your-org/sdk"
```

## Publish (from repo root)

```bash
pnpm install
pnpm run build

# Publish each package (use --access public for scoped packages)
pnpm --filter kalguard-core publish --access public --no-git-checks
pnpm --filter kalguard-sdk publish --access public --no-git-checks
pnpm --filter kalguard-sidecar publish --access public --no-git-checks
pnpm --filter kalguard publish --access public --no-git-checks
```

Or publish all at once (Turbo doesn’t define a publish pipeline; run from root):

```bash
pnpm -r publish --access public --no-git-checks
```

You may be prompted for OTP if your account has 2FA.

## Before publishing

- Run `pnpm run build` and fix any errors.
- Ensure each `package.json` has `"publishConfig": { "access": "public" }` for scoped packages.
- Ensure `"files": ["dist"]` (or equivalent) so only built output is published; no secrets or `.env`.
- Optionally set `"repository"` and `"keywords"` in each package for discovery and branding.

## Marketing and branding

- **kalguard** is the main package name for discovery (`npm install kalguard`).
- **kalguard-core**, **kalguard-sdk**, **kalguard-sidecar** give a clear, scoped brand and let users install only what they need.
- Document in README: "Install: `pnpm add kalguard` (SDK) or `pnpm add kalguard-sidecar` (run the proxy)."
