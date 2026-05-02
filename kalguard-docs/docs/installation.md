---
sidebar_position: 3
id: installation
title: Installation
description: Install KalGuard on any platform — npm, Docker, Kubernetes, or from source.
keywords: [installation, npm, docker, kubernetes, setup]
---

# Installation

KalGuard supports multiple installation methods. Pick the one that matches your workflow.

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 20.x | 20 LTS or 22 LTS |
| **OS** | macOS 13+, Ubuntu 20.04+, Windows 10+ | Ubuntu 22.04 LTS or Debian 12 |
| **Memory** | 512 MB | 2 GB+ |
| **Disk** | 100 MB | 1 GB+ (for audit logs) |

## npm / pnpm

### Umbrella Package

```bash
# pnpm (recommended)
pnpm add kalguard

# npm
npm install kalguard

# yarn
yarn add kalguard
```

The `kalguard` package re-exports everything from the three sub-packages:

| Package | Purpose |
|---------|---------|
| `kalguard/core` | Types, policy engine, prompt firewall, agent identity |
| `kalguard/sdk` | Client SDK for agent integration |
| `kalguard/sidecar` | HTTP sidecar server |

### Individual Packages

```bash
# Only the SDK (smallest footprint for agent code)
pnpm add kalguard/sdk

# Only the core library
pnpm add kalguard/core
```

## Docker

```bash
docker pull kalguard/sidecar:latest

docker run -d \
  --name kalguard \
  -p 9292:9292 \
  -e KALGUARD_TOKEN_SECRET="$(openssl rand -hex 32)" \
  -v "$(pwd)/policy.json:/policy/policy.json:ro" \
  -v "$(pwd)/audit:/var/log/kalguard" \
  kalguard/sidecar:latest
```

:::tip
Mount the policy file as **read-only** (`:ro`) and the audit directory as read-write.
:::

## Kubernetes

Apply the manifests from the `deploy/k8s/` directory:

```bash
kubectl create namespace kalguard
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/secret.example.yaml   # replace values first
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/service.yaml
```

> Helm chart support is planned for a future release.

## From Source

```bash
git clone https://github.com/kalguard/kalguard.git
cd kalguard
pnpm install
pnpm run build
pnpm test          # verify everything passes
```

Start the sidecar from the built output:

```bash
export KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32)
export KALGUARD_POLICY_PATH=./deploy/policy.example.json
pnpm --filter kalguard/sidecar start
```

## Post-Install Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KALGUARD_TOKEN_SECRET` | Yes | — | HMAC secret for signing agent tokens |
| `KALGUARD_POLICY_PATH` | Yes | — | Path to the JSON policy file |
| `KALGUARD_PORT` | No | `9292` | HTTP listen port |
| `KALGUARD_HOST` | No | `0.0.0.0` | Bind address |
| `KALGUARD_AUDIT_LOG_PATH` | No | `./audit.log` | Audit log file location |
| `KALGUARD_POLICY_WATCH` | No | `false` | Hot-reload policy on file change |
| `KALGUARD_POLICY_WATCH_INTERVAL_MS` | No | `5000` | Poll interval for policy watch |

### Verify

```bash
curl -s http://localhost:9292/health | jq .
# {"status":"healthy","uptime":12345}
```

## Platform Notes

### macOS

- Install OpenSSL via Homebrew if the system version is outdated: `brew install openssl`.
- Gatekeeper may quarantine downloaded binaries — use `xattr -d com.apple.quarantine <binary>`.

### Linux

- See the [Deployment Guide](/docs/deployment/overview) for a ready-made `systemd` unit file.
- If AppArmor or SELinux is active, ensure the sidecar binary and policy file are in an allowed path.

### Windows

- Use PowerShell or WSL for OpenSSL commands.
- File watching uses native Windows APIs — no additional configuration needed.

## Next Steps

- [Quick Start](/docs/quick-start) — five-minute walkthrough.
- [Deployment Guide](/docs/deployment/overview) — production hardening and scaling.
