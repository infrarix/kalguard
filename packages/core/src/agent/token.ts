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
