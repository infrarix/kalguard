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

import type { AuditEntry, AuditEventType, PolicyDecision } from '../types.js';
import { randomBytes } from 'node:crypto';

/** Security event for monitoring: tool usage, prompt patterns, network, anomalies. */
export interface SecurityEvent {
  readonly id: string;
  readonly type: AuditEventType;
  readonly timestamp: string;
  readonly agentId: string;
  readonly requestId: string;
  readonly decision?: PolicyDecision;
  readonly reason?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export function createSecurityEvent(
  type: AuditEventType,
  agentId: string,
  requestId: string,
  options: {
    decision?: PolicyDecision;
    reason?: string;
    metadata?: Readonly<Record<string, unknown>>;
  } = {},
): SecurityEvent {
  return {
    id: `evt_${randomBytes(12).toString('hex')}`,
    type,
    timestamp: new Date().toISOString(),
    agentId,
    requestId,
    metadata: options.metadata ?? {},
    ...(options.decision !== undefined ? { decision: options.decision } : {}),
    ...(options.reason !== undefined ? { reason: options.reason } : {}),
  };
}

/** Convert to immutable audit entry for storage. */
export function toAuditEntry(evt: SecurityEvent): AuditEntry {
  return {
    id: evt.id,
    type: evt.type,
    timestamp: evt.timestamp,
    agentId: evt.agentId,
    requestId: evt.requestId,
    metadata: evt.metadata,
    ...(evt.decision !== undefined ? { decision: evt.decision } : {}),
    ...(evt.reason !== undefined ? { reason: evt.reason } : {}),
  };
}
