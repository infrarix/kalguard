---
sidebar_position: 1
id: overview
title: Deployment Guide
description: Deploy KalGuard in production — Docker, Kubernetes, systemd, and scaling.
keywords: [deployment, production, docker, kubernetes, systemd, scaling, security]
---

# Deployment Guide

KalGuard is stateless and lightweight, making it straightforward to deploy in any environment. This guide covers production deployment patterns, security hardening, and scaling.

## Deployment Architectures

| Pattern | Description | Latency | Best For |
|---------|-------------|---------|----------|
| **Co-located sidecar** | Same host or Kubernetes pod as the agent | 1–5 ms | Lowest latency, simplest networking |
| **Shared service** | Central KalGuard instance shared by multiple agents | 5–20 ms | Centralized policy, fewer instances to manage |
| **Per-node sidecar** | One sidecar per host, shared by all agents on that host | 2–10 ms | Balance of latency and resource efficiency |

:::tip
The co-located sidecar pattern is recommended for most deployments. It minimizes network latency and avoids cross-service dependencies.
:::

## Docker

### Single Container

```bash
docker run -d \
  --name kalguard \
  --restart unless-stopped \
  -p 9292:9292 \
  -e KALGUARD_TOKEN_SECRET="$TOKEN_SECRET" \
  -v "$(pwd)/policy.json:/policy/policy.json:ro" \
  -v "$(pwd)/audit:/var/log/kalguard" \
  kalguard/sidecar:latest
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  kalguard:
    image: kalguard/sidecar:latest
    restart: unless-stopped
    ports:
      - "9292:9292"
    environment:
      KALGUARD_TOKEN_SECRET: "${TOKEN_SECRET}"
      KALGUARD_POLICY_PATH: /policy/policy.json
      KALGUARD_AUDIT_LOG_PATH: /var/log/kalguard/audit.log
      KALGUARD_POLICY_WATCH: "true"
    volumes:
      - ./policy.json:/policy/policy.json:ro
      - audit-data:/var/log/kalguard

  your-agent:
    build: ./agent
    environment:
      KALGUARD_SIDECAR_URL: http://kalguard:9292
    depends_on:
      - kalguard

volumes:
  audit-data:
```

## Kubernetes

### Sidecar Pattern (Same Pod)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-agent
spec:
  template:
    spec:
      containers:
        - name: agent
          image: your-agent:latest
          env:
            - name: KALGUARD_SIDECAR_URL
              value: "http://localhost:9292"
        - name: kalguard
          image: kalguard/sidecar:latest
          ports:
            - containerPort: 9292
          env:
            - name: KALGUARD_TOKEN_SECRET
              valueFrom:
                secretKeyRef:
                  name: kalguard-secret
                  key: token-secret
          volumeMounts:
            - name: policy
              mountPath: /policy
              readOnly: true
      volumes:
        - name: policy
          configMap:
            name: kalguard-policy
```

### Shared Service Pattern

```bash
kubectl apply -f deploy/k8s/configmap.yaml
kubectl apply -f deploy/k8s/secret.example.yaml   # replace with real values
kubectl apply -f deploy/k8s/deployment.yaml
kubectl apply -f deploy/k8s/service.yaml
```

Agents connect to `http://kalguard.kalguard.svc.cluster.local:9292`.

## systemd (VM / Bare Metal)

```ini
# /etc/systemd/system/kalguard.service
[Unit]
Description=KalGuard Sidecar
After=network.target

[Service]
Type=simple
User=kalguard
Environment=KALGUARD_TOKEN_SECRET=<your-secret>
Environment=KALGUARD_POLICY_PATH=/etc/kalguard/policy.json
Environment=KALGUARD_AUDIT_LOG_PATH=/var/log/kalguard/audit.log
ExecStart=/usr/local/bin/node /opt/kalguard/dist/cmd/sidecar.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kalguard
sudo systemctl status kalguard
```

## Security Hardening

### Network

- In Kubernetes, apply a `NetworkPolicy` that only allows traffic from agent pods to the sidecar port.
- On VMs, use `iptables` or `ufw` to restrict port 9292 to localhost or the agent's IP.
- Use TLS (reverse proxy or application-level) for any deployment where the sidecar is not co-located.

### File Permissions

```bash
chmod 640 /etc/kalguard/policy.json     # owner + group read
chmod 600 /var/log/kalguard/audit.log   # owner read/write only
chown kalguard:kalguard /etc/kalguard/policy.json /var/log/kalguard/audit.log
```

### Secret Management

| Platform | Recommendation |
|----------|---------------|
| Kubernetes | Use `Secret` objects; inject via `valueFrom.secretKeyRef` |
| Docker | Use Docker secrets or a `.env` file (never commit to git) |
| VM | Use HashiCorp Vault, AWS Secrets Manager, or OS keyring |

:::danger
Never hard-code `KALGUARD_TOKEN_SECRET` in source code, Dockerfiles, or CI/CD configs.
:::

## Health Checks

```bash
curl -f http://localhost:9292/health
# {"status":"healthy","uptime":12345}
```

Configure your orchestrator to check this endpoint:

- **Kubernetes**: `livenessProbe` and `readinessProbe` on `/health`.
- **Docker**: `HEALTHCHECK CMD curl -f http://localhost:9292/health`.
- **ELB / ALB**: Target group health check on port 9292, path `/health`.

## Scaling

### Resource Sizing

| Profile | CPU | Memory | Use Case |
|---------|-----|--------|----------|
| Minimal | 100m | 128 Mi | Development, low traffic |
| Standard | 500m | 256 Mi | Production, moderate traffic |
| High | 1000m | 512 Mi | High-throughput agent fleets |

### Horizontal Scaling

KalGuard is stateless — scale with a standard HPA:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kalguard-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kalguard
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Monitoring

- **Audit logs**: Ship to a centralized logging platform (ELK, Datadog, Splunk) using Filebeat or Fluentd.
- **Metrics**: Prometheus endpoint on port 9293 (planned).
- **Alerting**: Alert on high denial rates, sidecar restarts, and health check failures.

## Backup and Recovery

- **Policy files**: Store in version control. Redeploy from git on recovery.
- **Audit logs**: Rotate with `logrotate` or ship to durable storage (S3, GCS).
- **Sidecar state**: None — sidecars are stateless and can be replaced immediately.

## Next Steps

- [Installation](/docs/installation) — platform-specific install instructions.
- [Architecture](/docs/concepts/architecture) — understand the sidecar model.
- [Integration Guide](/docs/integration/overview) — connect your agent to the sidecar.
