# Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.
# KalGuard Deployment — complete guide for local, Docker, Kubernetes, and systemd.

# KalGuard Deployment Guide

## Local (pnpm monorepo)

```bash
pnpm install
pnpm run build

export KALGUARD_TOKEN_SECRET=$(node -e "require('crypto').randomBytes(32).toString('hex') |> console.log")
export KALGUARD_POLICY_PATH=./deploy/policy.example.json
export KALGUARD_AUDIT_LOG_PATH=./audit.log
export KALGUARD_POLICY_DEFAULT_DENY=true

pnpm --filter @kalguard/sidecar start
```

Sidecar listens on `http://0.0.0.0:9292` by default.

## Docker

Build and run with Docker Compose (recommended):

```bash
# From repo root — the build context is the repo root
KALGUARD_TOKEN_SECRET=<your-32-char-secret> \
docker compose -f deploy/docker-compose.yml up --build -d
```

Or build and run manually:

```bash
docker build -f deploy/Dockerfile -t kalguard-sidecar .
docker run -d \
  --name kalguard-sidecar \
  -p 127.0.0.1:9292:9292 \
  -e KALGUARD_TOKEN_SECRET=<your-secret> \
  -e KALGUARD_POLICY_PATH=/policy/policy.json \
  -e KALGUARD_AUDIT_LOG_PATH=/var/log/kalguard/audit.log \
  -v "$(pwd)/deploy/policy.example.json:/policy/policy.json:ro" \
  --read-only \
  --security-opt no-new-privileges:true \
  kalguard-sidecar
```

## Kubernetes

Apply all manifests:

```bash
# Create the token secret (replace the value)
kubectl create secret generic kalguard-secrets \
  --from-literal=token-secret="$(openssl rand -hex 32)"

# Apply policy ConfigMap and deployment
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/service.yaml

# Verify
kubectl rollout status deployment/kalguard-sidecar
kubectl get pods -l app=kalguard-sidecar
curl http://<cluster-ip>:9292/health
```

The deployment runs 2 replicas with a rolling update strategy, non-root user, read-only root filesystem, dropped Linux capabilities, and both liveness and readiness probes.

## Systemd (Linux bare-metal / VM)

```bash
# Install the built package
pnpm install && pnpm run build
sudo cp -r packages/sidecar/dist /opt/kalguard/dist
sudo cp packages/sidecar/package.json /opt/kalguard/

# Create kalguard system user
sudo useradd --system --no-create-home --shell /usr/sbin/nologin kalguard

# Create config and log dirs
sudo mkdir -p /etc/kalguard /var/log/kalguard
sudo chown kalguard:kalguard /var/log/kalguard
sudo cp deploy/policy.example.json /etc/kalguard/policy.json

# Configure secrets (never commit to VCS)
sudo tee /etc/kalguard/env > /dev/null <<EOF
KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32)
KALGUARD_POLICY_PATH=/etc/kalguard/policy.json
KALGUARD_AUDIT_LOG_PATH=/var/log/kalguard/audit.log
EOF
sudo chmod 600 /etc/kalguard/env
sudo chown root:root /etc/kalguard/env

# Install and enable systemd unit
sudo cp deploy/kalguard-sidecar.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kalguard-sidecar

# Verify
sudo systemctl status kalguard-sidecar
curl http://localhost:9292/health
```

## Policy Hot-Reload

The sidecar supports hot-reloading the policy file without restart when `KALGUARD_POLICY_WATCH=true` is set. It watches the `KALGUARD_POLICY_PATH` file and reloads on change (debounced). On parse error, the previous policy is kept (fail closed — no policy gap).

```bash
# Update policy without restart:
cp new-policy.json /etc/kalguard/policy.json
# Sidecar automatically reloads within ~500ms
```

## Generating Seccomp Profiles

Generate an OCI-compatible seccomp profile for Docker or containerd:

```bash
pnpm --filter @kalguard/sidecar seccomp-profile ./seccomp.json
docker run --security-opt seccomp=./seccomp.json ... kalguard-sidecar
```
