# Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.
# Multi-stage production build for KalGuard sidecar.
# Uses pnpm workspaces to correctly build the monorepo.

# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/sidecar/package.json ./packages/sidecar/
COPY packages/aarsp/package.json ./packages/aarsp/

# Install all deps (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/core/src ./packages/core/src
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/sdk/src ./packages/sdk/src
COPY packages/sdk/tsconfig.json ./packages/sdk/
COPY packages/sidecar/src ./packages/sidecar/src
COPY packages/sidecar/tsconfig.json ./packages/sidecar/
COPY packages/aarsp/src ./packages/aarsp/src
COPY packages/aarsp/tsconfig.json ./packages/aarsp/
COPY tsconfig.json turbo.json ./

# Build all packages in dependency order via turbo
RUN pnpm run build

# ── Stage 2: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Drop to non-root for security
RUN addgroup -S kalguard && adduser -S kalguard -G kalguard

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/sidecar/package.json ./packages/sidecar/
COPY packages/aarsp/package.json ./packages/aarsp/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=builder /app/packages/sidecar/dist ./packages/sidecar/dist
COPY --from=builder /app/packages/aarsp/dist ./packages/aarsp/dist

# Create audit log dir and set permissions
RUN mkdir -p /var/log/kalguard && chown kalguard:kalguard /var/log/kalguard

USER kalguard

EXPOSE 9292
ENV KALGUARD_HOST=0.0.0.0
ENV KALGUARD_PORT=9292
ENV NODE_ENV=production

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:9292/health || exit 1

CMD ["node", "packages/sidecar/dist/cmd/sidecar.js"]
