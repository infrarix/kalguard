# Deploy

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

Deployment assets:

- **Docker**: `Dockerfile`, `docker-compose.yml` — build and run sidecar with policy and audit volume.
- **Kubernetes**: `k8s/configmap.yaml`, `k8s/deployment.yaml`, `k8s/service.yaml`, `k8s/secret.example.yaml` — ConfigMap for policy, Deployment, Service, optional Secret for token.
- **Systemd**: `kalguard-sidecar.service` — unit file for bare-metal/Linux; install to `/etc/systemd/system/`.

See `docs/deployment.md` for instructions. Optional: generate seccomp profile with `npm run seccomp-profile [output.json]` and use with Docker/containerd.
