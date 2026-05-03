import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import type { SidecarConfig } from '../config/schema.js';
import { validateAgentToken, checkCapability } from 'kalguard-core';
import type { AgentIdentity } from 'kalguard-core';
import { evaluatePrompt } from 'kalguard-core';
import type { PromptMessage, ToolInvocation } from 'kalguard-core';
import { PolicyEngine } from 'kalguard-core';
import type { PolicyContext } from 'kalguard-core';
import { ToolMediator } from 'kalguard-core';
import { createSecurityEvent, toAuditEntry } from 'kalguard-core';
import type { IAuditLog } from '../storage/audit.js';
import { securityResponse, jsonResponse } from '../api/response.js';
import type { CloudRateLimiter } from '../cloud/rate-limiter.js';
import type { LicenseCache } from '../cloud/license-cache.js';
import type { UsageBuffer } from '../cloud/usage-buffer.js';
import type { UsageEvent } from '../cloud/types.js';

/** Request ID header; agents must not trust it for auth. */
const REQUEST_ID_HEADER = 'x-kalguard-request-id';
const AUTH_HEADER = 'authorization';

export interface SidecarDeps {
  config: SidecarConfig;
  policyEngine: PolicyEngine;
  toolMediator: ToolMediator;
  auditLog: IAuditLog;
  /** Cloud rate limiter — present only when KALGUARD_API_KEY is set. */
  rateLimiter?: CloudRateLimiter;
  /** Cloud license cache — present only when KALGUARD_API_KEY is set. */
  licenseCache?: LicenseCache;
  /** Cloud usage buffer — present only when KALGUARD_API_KEY is set. */
  usageBuffer?: UsageBuffer;
}

/**
 * HTTP sidecar: intercepts LLM and tool requests, enforces policy, logs all deny decisions.
 * Fail closed on any policy/auth error.
 */
export function createSidecarServer(deps: SidecarDeps) {
  const { config, policyEngine, toolMediator, auditLog, rateLimiter, licenseCache, usageBuffer } = deps;
  const envTokenSecret = config.tokenSecret;
  let cloudSecretWarningLogged = false;

  /**
   * Resolve the token signing secret.
   * Priority: cloud-synced secret > KALGUARD_TOKEN_SECRET env var > null (decode-only).
   */
  function getTokenSecret(): string | undefined {
    if (licenseCache) {
      const license = licenseCache.get();
      if (license?.valid && license.tokenSigningSecret) {
        if (envTokenSecret && !cloudSecretWarningLogged) {
          console.warn(
            '[kalguard] KALGUARD_TOKEN_SECRET env var is set but cloud-provided signing secret is active. Using cloud secret. Remove KALGUARD_TOKEN_SECRET to suppress this warning.',
          );
          cloudSecretWarningLogged = true;
        }
        return license.tokenSigningSecret;
      }
    }
    return envTokenSecret;
  }

  /** Check if a token has been revoked (by hash). */
  function isTokenRevoked(token: string): boolean {
    if (!licenseCache) return false;
    const license = licenseCache.get();
    if (!license?.revokedTokenHashes?.length) return false;
    const hash = createHash('sha256').update(token).digest('hex');
    return license.revokedTokenHashes.includes(hash);
  }

  /** Add cloud plan headers to response if cloud is connected. */
  function setCloudHeaders(res: ServerResponse): void {
    if (licenseCache) {
      const license = licenseCache.get();
      if (license?.valid) {
        res.setHeader('x-kalguard-plan', license.tier);
      }
    }
    if (rateLimiter) {
      const rl = rateLimiter.check();
      if (rl.remaining >= 0) {
        res.setHeader('x-kalguard-usage-remaining', String(rl.remaining));
        res.setHeader('x-ratelimit-reset', String(Math.ceil(rl.resetAt / 1000)));
      }
    }
  }

  /** Push a usage event to the cloud buffer (fire-and-forget). */
  function reportUsage(
    eventType: 'prompt_check' | 'tool_check',
    agentId: string,
    decision: string,
    requestId: string,
  ): void {
    if (!usageBuffer) return;
    const event: UsageEvent = {
      eventType,
      agentId,
      decision,
      requestId,
      timestamp: new Date().toISOString(),
    };
    usageBuffer.push(event);
  }

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) ?? `req_${randomBytes(12).toString('hex')}`;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    setCloudHeaders(res);

    try {
      const authHeader = req.headers[AUTH_HEADER];
      const token =
        typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice(7).trim()
          : undefined;

      // Check revocation before signature validation
      if (token && isTokenRevoked(token)) {
        const evt = createSecurityEvent('auth_failure', 'anonymous', requestId, { reason: 'token revoked' });
        await auditLog.append(toAuditEntry(evt));
        jsonResponse(
          res,
          401,
          securityResponse(false, requestId, { message: 'Token revoked', errorCode: 'TOKEN_REVOKED' }),
        );
        return;
      }

      const tokenSecret = getTokenSecret();
      const identity = token
        ? validateAgentToken(token, tokenSecret != null ? { nowMs: Date.now(), secret: tokenSecret } : Date.now())
        : null;

      if (!identity) {
        const evt = createSecurityEvent('auth_failure', 'anonymous', requestId, { reason: 'invalid or missing token' });
        await auditLog.append(toAuditEntry(evt));
        jsonResponse(
          res,
          401,
          securityResponse(false, requestId, { message: 'Unauthorized', errorCode: 'AUTH_FAILED' }),
        );
        return;
      }

      const url = req.url ?? '/';
      const method = req.method ?? 'GET';

      // Cloud rate limit check (before any processing)
      if (rateLimiter && method === 'POST') {
        const rl = rateLimiter.check();
        if (!rl.allowed) {
          const evt = createSecurityEvent('policy_deny', identity.agentId, requestId, {
            reason: 'cloud rate limit exceeded',
          });
          await auditLog.append(toAuditEntry(evt));
          res.setHeader('retry-after', String(Math.ceil((rl.resetAt - Date.now()) / 1000)));
          jsonResponse(
            res,
            429,
            securityResponse(false, requestId, {
              message: 'Rate limit exceeded',
              errorCode: 'RATE_LIMIT_EXCEEDED',
              data: { remaining: 0, resetAt: rl.resetAt },
            }),
          );
          return;
        }
      }

      if (method === 'POST' && (url === '/v1/llm/check' || url === '/v1/prompt/check')) {
        await handlePromptCheck(
          req,
          res,
          identity,
          requestId,
          auditLog,
          policyEngine,
          config,
          rateLimiter,
          reportUsage,
        );
        return;
      }
      if (method === 'POST' && url === '/v1/tool/check') {
        await handleToolCheck(
          req,
          res,
          identity,
          requestId,
          auditLog,
          policyEngine,
          toolMediator,
          rateLimiter,
          reportUsage,
        );
        return;
      }
      if (method === 'GET' && url === '/health') {
        const healthData: Record<string, unknown> = { status: 'ok', requestId };
        if (licenseCache) {
          const license = licenseCache.get();
          healthData.cloud = license
            ? { connected: true, tier: license.tier, orgId: license.orgId }
            : { connected: false };
        }
        jsonResponse(res, 200, healthData);
        return;
      }

      jsonResponse(res, 404, securityResponse(false, requestId, { message: 'Not Found', errorCode: 'NOT_FOUND' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      jsonResponse(
        res,
        500,
        securityResponse(false, requestId, { message: 'Internal error', errorCode: 'INTERNAL', data: undefined }),
      );
      // Log but do not expose internal details to agent
      console.error(`[kalguard] ${requestId} error:`, message);
    }
  }

  return createServer((req, res) => {
    handleRequest(req, res).catch((e) => {
      console.error('[kalguard] unhandled:', e);
      const requestId = res.getHeader(REQUEST_ID_HEADER) ?? 'unknown';
      jsonResponse(
        res,
        500,
        securityResponse(false, String(requestId), { message: 'Internal error', errorCode: 'INTERNAL' }),
      );
    });
  });
}

async function handlePromptCheck(
  req: IncomingMessage,
  res: ServerResponse,
  identity: AgentIdentity,
  requestId: string,
  auditLog: IAuditLog,
  policyEngine: PolicyEngine,
  config: SidecarConfig,
  rateLimiter?: CloudRateLimiter,
  reportUsage?: (
    eventType: 'prompt_check' | 'tool_check',
    agentId: string,
    decision: string,
    requestId: string,
  ) => void,
): Promise<void> {
  const cap = checkCapability(identity, 'prompt:send');
  if (!cap.allowed) {
    const evt = createSecurityEvent('auth_failure', identity.agentId, requestId, {
      ...(cap.reason !== undefined ? { reason: cap.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, { message: cap.reason ?? 'Forbidden', errorCode: 'CAPABILITY_DENIED' }),
    );
    return;
  }

  let body: string;
  try {
    body = await readBody(req);
  } catch (e) {
    if (e instanceof Error && e.message === 'Payload Too Large') {
      jsonResponse(
        res,
        413,
        securityResponse(false, requestId, { message: 'Payload Too Large', errorCode: 'PAYLOAD_TOO_LARGE' }),
      );
    } else {
      jsonResponse(res, 400, securityResponse(false, requestId, { message: 'Invalid body', errorCode: 'BAD_REQUEST' }));
    }
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    jsonResponse(res, 400, securityResponse(false, requestId, { message: 'Invalid JSON', errorCode: 'BAD_REQUEST' }));
    return;
  }

  const messages = parseMessages(parsed);
  if (!messages) {
    jsonResponse(
      res,
      400,
      securityResponse(false, requestId, { message: 'Missing or invalid messages', errorCode: 'BAD_REQUEST' }),
    );
    return;
  }

  const policyCtx: PolicyContext = {
    agentId: identity.agentId,
    action: 'prompt:check',
    attributes: { messageCount: messages.length },
    timestamp: Date.now(),
  };
  const policyResult = await policyEngine.evaluate(policyCtx);
  if (policyResult.decision === 'deny') {
    const evt = createSecurityEvent('prompt_denied', identity.agentId, requestId, {
      decision: 'deny',
      ...(policyResult.reason !== undefined ? { reason: policyResult.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, {
        message: policyResult.reason ?? 'Denied by policy',
        decision: 'deny',
        errorCode: 'POLICY_DENY',
      }),
    );
    return;
  }
  if (policyResult.decision === 'require_approval') {
    const evt = createSecurityEvent('prompt_denied', identity.agentId, requestId, {
      decision: 'require_approval',
      ...(policyResult.reason !== undefined ? { reason: policyResult.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, {
        message: 'Requires approval',
        decision: 'require_approval',
        errorCode: 'REQUIRE_APPROVAL',
      }),
    );
    return;
  }

  const firewallResult = evaluatePrompt(messages, {
    blockThreshold: config.promptBlockThreshold,
    sanitizeThreshold: config.promptSanitizeThreshold,
  });

  if (!firewallResult.allowed) {
    const evt = createSecurityEvent('prompt_denied', identity.agentId, requestId, {
      ...(firewallResult.reason !== undefined ? { reason: firewallResult.reason } : {}),
      metadata: { riskScore: firewallResult.riskScore, injectionDetected: firewallResult.injectionDetected },
    });
    await auditLog.append(toAuditEntry(evt));
    if (rateLimiter) rateLimiter.increment();
    reportUsage?.('prompt_check', identity.agentId, 'deny', requestId);
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, {
        message: firewallResult.reason ?? 'Prompt blocked',
        errorCode: 'PROMPT_BLOCKED',
        data: { riskScore: firewallResult.riskScore, riskLevel: firewallResult.riskLevel },
      }),
    );
    return;
  }

  const evt = createSecurityEvent('prompt_allowed', identity.agentId, requestId, {
    metadata: { riskScore: firewallResult.riskScore, sanitized: firewallResult.sanitizedMessages != null },
  });
  await auditLog.append(toAuditEntry(evt));
  if (rateLimiter) rateLimiter.increment();
  reportUsage?.('prompt_check', identity.agentId, 'allow', requestId);
  jsonResponse(
    res,
    200,
    securityResponse(true, requestId, {
      message: 'OK',
      decision: 'allow',
      data: {
        allowed: true,
        riskScore: firewallResult.riskScore,
        riskLevel: firewallResult.riskLevel,
        sanitizedMessages: firewallResult.sanitizedMessages,
      },
    }),
  );
}

async function handleToolCheck(
  req: IncomingMessage,
  res: ServerResponse,
  identity: AgentIdentity,
  requestId: string,
  auditLog: IAuditLog,
  policyEngine: PolicyEngine,
  toolMediator: ToolMediator,
  rateLimiter?: CloudRateLimiter,
  reportUsage?: (
    eventType: 'prompt_check' | 'tool_check',
    agentId: string,
    decision: string,
    requestId: string,
  ) => void,
): Promise<void> {
  const cap = checkCapability(identity, 'tool:execute');
  if (!cap.allowed) {
    const evt = createSecurityEvent('auth_failure', identity.agentId, requestId, {
      ...(cap.reason !== undefined ? { reason: cap.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, { message: cap.reason ?? 'Forbidden', errorCode: 'CAPABILITY_DENIED' }),
    );
    return;
  }

  let body: string;
  try {
    body = await readBody(req);
  } catch (e) {
    if (e instanceof Error && e.message === 'Payload Too Large') {
      jsonResponse(
        res,
        413,
        securityResponse(false, requestId, { message: 'Payload Too Large', errorCode: 'PAYLOAD_TOO_LARGE' }),
      );
    } else {
      jsonResponse(res, 400, securityResponse(false, requestId, { message: 'Invalid body', errorCode: 'BAD_REQUEST' }));
    }
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    jsonResponse(res, 400, securityResponse(false, requestId, { message: 'Invalid JSON', errorCode: 'BAD_REQUEST' }));
    return;
  }

  const inv = parseToolInvocation(parsed, identity.agentId, requestId);
  if (!inv) {
    jsonResponse(
      res,
      400,
      securityResponse(false, requestId, {
        message: 'Missing or invalid toolName/arguments',
        errorCode: 'BAD_REQUEST',
      }),
    );
    return;
  }

  const policyCtx: PolicyContext = {
    agentId: identity.agentId,
    action: 'tool:execute',
    resource: inv.toolName,
    attributes: { toolName: inv.toolName },
    timestamp: Date.now(),
  };
  const policyResult = await policyEngine.evaluate(policyCtx);
  if (policyResult.decision === 'deny') {
    const evt = createSecurityEvent('tool_denied', identity.agentId, requestId, {
      decision: 'deny',
      ...(policyResult.reason !== undefined ? { reason: policyResult.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, {
        message: policyResult.reason ?? 'Denied by policy',
        decision: 'deny',
        errorCode: 'POLICY_DENY',
      }),
    );
    return;
  }
  if (policyResult.decision === 'require_approval') {
    const evt = createSecurityEvent('tool_denied', identity.agentId, requestId, {
      decision: 'require_approval',
      ...(policyResult.reason !== undefined ? { reason: policyResult.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, {
        message: 'Requires approval',
        decision: 'require_approval',
        errorCode: 'REQUIRE_APPROVAL',
      }),
    );
    return;
  }

  const mediation = toolMediator.mediate(inv);
  if (!mediation.allowed) {
    const evt = createSecurityEvent('tool_denied', identity.agentId, requestId, {
      ...(mediation.reason !== undefined ? { reason: mediation.reason } : {}),
    });
    await auditLog.append(toAuditEntry(evt));
    if (rateLimiter) rateLimiter.increment();
    reportUsage?.('tool_check', identity.agentId, 'deny', requestId);
    jsonResponse(
      res,
      403,
      securityResponse(false, requestId, { message: mediation.reason ?? 'Tool denied', errorCode: 'TOOL_DENIED' }),
    );
    return;
  }

  const evt = createSecurityEvent('tool_allowed', identity.agentId, requestId, {
    metadata: { toolName: inv.toolName },
  });
  await auditLog.append(toAuditEntry(evt));
  if (rateLimiter) rateLimiter.increment();
  reportUsage?.('tool_check', identity.agentId, 'allow', requestId);
  jsonResponse(
    res,
    200,
    securityResponse(true, requestId, { message: 'OK', decision: 'allow', data: { allowed: true } }),
  );
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalLength = 0;
    const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB
    req.on('data', (chunk: Buffer) => {
      totalLength += chunk.length;
      if (totalLength > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('Payload Too Large'));
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseMessages(raw: unknown): PromptMessage[] | null {
  if (raw == null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const messages = obj.messages;
  if (!Array.isArray(messages)) return null;
  const out: PromptMessage[] = [];
  for (const m of messages) {
    if (m == null || typeof m !== 'object') return null;
    const msg = m as Record<string, unknown>;
    const role = msg.role;
    const content = msg.content;
    if (typeof role !== 'string' || typeof content !== 'string') return null;
    out.push({
      role: role as PromptMessage['role'],
      content,
      ...(msg.name !== undefined ? { name: msg.name as string } : {}),
    });
  }
  return out.length > 0 ? out : null;
}

function parseToolInvocation(raw: unknown, agentId: string, requestId: string): ToolInvocation | null {
  if (raw == null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const toolName = obj.toolName;
  const args = obj.arguments ?? obj.args;
  if (typeof toolName !== 'string' || toolName.length === 0) return null;
  const arguments_ =
    args != null && typeof args === 'object' && !Array.isArray(args) ? (args as Record<string, unknown>) : {};
  return { toolName, arguments: arguments_, agentId, requestId };
}
