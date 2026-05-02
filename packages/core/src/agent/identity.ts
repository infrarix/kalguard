/**
 * Copyright 2025 KalGuard Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import jwt from 'jsonwebtoken';
import type { AgentIdentity, AgentTokenPayload, AgentCapability, CapabilityCheckResult } from './types.js';

const VALID_CAPABILITIES: ReadonlySet<AgentCapability> = new Set([
  'llm:call',
  'tool:execute',
  'tool:read',
  'tool:write',
  'network:outbound',
  'prompt:send',
  'prompt:receive',
]);

export interface ValidateTokenOptions {
  readonly nowMs?: number;
  /** If provided, signature is verified with this secret. */
  readonly secret?: string;
}

/**
 * Validates bearer token and returns agent identity.
 * Short-lived tokens; agent identity != user identity.
 * Invalid or expired tokens yield null (fail closed).
 * If secret is provided, HMAC-SHA256 signature is verified.
 */
export function validateAgentToken(
  token: string,
  options: ValidateTokenOptions | number = Date.now(),
): AgentIdentity | null {
  const nowMs = typeof options === 'number' ? options : (options.nowMs ?? Date.now());
  const secret = typeof options === 'object' ? options.secret : undefined;
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }
  try {
    let raw: unknown;
    if (secret != null && secret.length > 0) {
      raw = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        clockTimestamp: Math.floor(nowMs / 1000),
      });
    } else {
      raw = jwt.decode(token);
      if (!raw) return null;
      const nowSec = Math.floor(nowMs / 1000);
      const exp = (raw as jwt.JwtPayload).exp;
      const iat = (raw as jwt.JwtPayload).iat;
      if (exp !== undefined && exp < nowSec) return null;
      if (iat !== undefined && iat > nowSec) return null;
    }

    const payload = validateTokenPayload(raw);
    if (!payload) return null;

    const capabilities = new Set<AgentCapability>();
    for (const c of payload.capabilities) {
      if (VALID_CAPABILITIES.has(c)) capabilities.add(c);
    }
    return {
      agentId: payload.sub,
      capabilities,
      expiresAt: payload.exp * 1000,
      issuer: payload.iss,
      metadata: payload.metadata ?? {},
    };
  } catch {
    return null;
  }
}

function validateTokenPayload(raw: unknown): AgentTokenPayload | null {
  if (raw == null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const sub = obj.sub;
  const iss = obj.iss;
  const exp = obj.exp;
  const iat = obj.iat;
  const caps = obj.capabilities;
  if (typeof sub !== 'string' || sub.length === 0) return null;
  if (typeof iss !== 'string' || iss.length === 0) return null;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;
  if (typeof iat !== 'number' || !Number.isFinite(iat)) return null;
  if (!Array.isArray(caps)) return null;
  const capabilities: AgentCapability[] = [];
  for (const c of caps) {
    if (typeof c === 'string' && VALID_CAPABILITIES.has(c as AgentCapability)) {
      capabilities.push(c as AgentCapability);
    }
  }
  const metadata =
    obj.metadata != null && typeof obj.metadata === 'object' && !Array.isArray(obj.metadata)
      ? (obj.metadata as Record<string, unknown>)
      : undefined;
  return { sub, iss, exp, iat, capabilities, ...(metadata !== undefined ? { metadata } : {}) };
}

/**
 * Check whether identity has the required capability.
 */
export function checkCapability(identity: AgentIdentity, required: AgentCapability): CapabilityCheckResult {
  if (identity.expiresAt < Date.now()) {
    return { allowed: false, reason: 'token expired' };
  }
  if (identity.capabilities.has(required)) {
    return { allowed: true };
  }
  return { allowed: false, reason: `missing capability: ${required}` };
}
