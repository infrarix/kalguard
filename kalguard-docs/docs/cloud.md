---
sidebar_position: 4
id: cloud
title: KalGuard Cloud
description: Centralized management, usage analytics, and Pro/Enterprise features for KalGuard.
keywords: [cloud, pro, enterprise, pricing, dashboard, saas, api key]
---

# KalGuard Cloud

KalGuard Cloud adds a managed dashboard on top of the open-source sidecar. The sidecar remains fully open-source — Cloud provides centralized license management, usage analytics, and higher plan limits.

## How It Works

```text
┌──────────────┐      HTTP       ┌──────────────────┐      HTTPS      ┌─────────────────┐
│              │ ──────────────► │                  │ ──────────────► │                 │
│   AI Agent   │                 │  KalGuard Sidecar│                 │ KalGuard Cloud  │
│              │ ◄────────────── │    (open-source)  │ ◄────────────── │   (dashboard)   │
└──────────────┘  allow / deny   └──────────────────┘  license + usage └─────────────────┘
```

1. **Agent → Sidecar** — Same zero-trust flow as local-only mode. No code changes.
2. **Sidecar → Cloud** — On startup, the sidecar validates its API key with the cloud API. It then periodically reports usage and refreshes the license.
3. **Cloud → Sidecar** — Returns plan limits, feature flags, and remaining daily quota via response headers.

The sidecar works in **local-only mode** when no API key is set. All security enforcement happens locally — Cloud never sees your prompts or agent data.

## Plans

| Feature | Free | Pro ($49/mo) | Enterprise (Custom) |
|---------|------|-------------|---------------------|
| Security checks/day | 1,000 | 100,000 | Unlimited |
| Agents | 1 | Unlimited | Unlimited |
| Audit retention | 7 days | 90 days | 365 days |
| Prompt firewall | Basic | Advanced + PII redaction | Advanced + PII |
| Usage analytics dashboard | — | ✓ | ✓ |
| Custom policy rules | — | ✓ | ✓ |
| Email support | — | ✓ | ✓ |
| SSO / SAML | — | — | ✓ |
| SLA guarantee | — | — | ✓ |
| Dedicated support | — | — | ✓ |

## Getting Started

### 1. Create an Account

Sign up at [dashboard.kalguard.dev](https://dashboard.kalguard.dev). Registration creates an organization and a first API key automatically.

### 2. Set the API Key

Add a single environment variable to your sidecar:

```bash
export KALGUARD_API_KEY=kg_live_your_api_key_here
```

That's it. The sidecar will:
- Validate your license on startup
- Enforce plan-level rate limits (checks/day)
- Report usage to the dashboard (batched, non-blocking)
- Add plan headers to every response

### 3. View the Dashboard

Log in at [dashboard.kalguard.dev](https://dashboard.kalguard.dev) to see:

- **Usage analytics** — checks per day, allowed vs denied, trend charts
- **Active agents** — agents seen in the last 24 hours
- **Audit logs** — searchable, paginated security event history
- **API key management** — create, revoke, rotate keys
- **Access token management** — generate agent tokens with configurable expiry
- **Billing** — upgrade, downgrade, manage subscription via Stripe

### 4. Create Access Tokens

Access tokens authenticate AI agents with the sidecar. Create them from the dashboard:

1. Go to **Access Tokens** in the sidebar
2. Click **Create Token**
3. Configure:
   - **Name** — a descriptive label (e.g., "Production Agent")
   - **Agent ID** — the unique identifier for this agent
   - **Capabilities** — what the agent is allowed to do (`prompt:send`, `tool:execute`, etc.)
   - **Expiry** — choose from presets (1h to 365 days) or set a custom duration
4. Copy the token (shown once) and set it as `KALGUARD_AGENT_TOKEN` in your agent's environment

The sidecar automatically receives the signing secret during license sync — no manual `KALGUARD_TOKEN_SECRET` configuration needed.

:::tip
Tokens can be revoked at any time from the dashboard. Revocation propagates to sidecars within 5 minutes (the license sync interval).
:::

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KALGUARD_API_KEY` | Yes (for Cloud) | — | API key from the dashboard (`kg_live_...` or `kg_test_...`) |
| `KALGUARD_CLOUD_URL` | No | `https://api.kalguard.dev` | Cloud API base URL (override for self-hosted Cloud) |
| `KALGUARD_CLOUD_SYNC_INTERVAL_MS` | No | `300000` (5 min) | How often to refresh the license (min 10s, max 10min) |

## Response Headers

When connected to Cloud, every sidecar response includes:

| Header | Example | Description |
|--------|---------|-------------|
| `x-kalguard-plan` | `pro` | Current plan tier |
| `x-kalguard-usage-remaining` | `99842` | Remaining checks for the current day |
| `x-ratelimit-reset` | `1714694400` | Unix timestamp when the daily limit resets |

The SDK exposes these via `client.planInfo` after each request:

```typescript
const result = await client.checkPrompt(messages);
console.log(client.planInfo);
// { plan: 'pro', remaining: 99842, resetAt: 1714694400 }
```

## Rate Limiting

When the daily check limit is exhausted, the sidecar returns `429 Too Many Requests` with:

```json
{
  "allowed": false,
  "message": "Rate limit exceeded",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "data": { "remaining": 0, "resetAt": 1714694400 }
}
```

The `retry-after` header indicates seconds until the limit resets.

## Graceful Degradation

If the Cloud API is unreachable:

- **Startup**: Sidecar logs a warning and runs in degraded mode (no plan limits enforced).
- **Runtime**: License cache retains the last valid license for the configured TTL. Usage events are buffered and re-queued on failure.
- **Security**: Local policy enforcement, prompt firewall, and audit logging continue to work regardless of Cloud connectivity.

## Data Privacy

- **Prompts and agent data never leave the sidecar.** Cloud only receives aggregated usage events (event type, agent ID, decision, timestamp).
- Usage events are transmitted over HTTPS with API key authentication.
- The sidecar source code is fully open — audit it yourself.

## Self-Hosted Cloud

The KalGuard Cloud dashboard is available as a self-hosted deployment for Enterprise customers. Contact [sales@kalguard.dev](mailto:sales@kalguard.dev) for details.

## Next Steps

- [Quick Start](/docs/quick-start) — get the sidecar running locally.
- [Architecture](/docs/concepts/architecture) — understand the sidecar + cloud data flow.
- [Deployment](/docs/deployment/overview) — production deployment patterns.
