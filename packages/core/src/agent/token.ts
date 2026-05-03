import type { AgentCapability } from './types.js';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

/**
 * Issuer-side: create short-lived agent token.
 * Uses industry-standard jsonwebtoken library for creating compliant JWTs.
 */
export interface TokenIssuerOptions {
  readonly secret: string;
  readonly issuer: string;
  readonly ttlSeconds?: number;
}

export function createAgentToken(
  agentId: string,
  capabilities: readonly AgentCapability[],
  options: TokenIssuerOptions,
  metadata?: Readonly<Record<string, unknown>>,
): string {
  const ttl = options.ttlSeconds ?? 3600;

  const payload = {
    capabilities: [...capabilities],
    metadata: metadata ?? {},
  };

  return jwt.sign(payload, options.secret, {
    subject: agentId,
    issuer: options.issuer,
    expiresIn: ttl,
    algorithm: 'HS256',
  });
}

/** Generate a random agent ID (for testing/registration). */
export function generateAgentId(): string {
  return `agent_${randomBytes(16).toString('hex')}`;
}
