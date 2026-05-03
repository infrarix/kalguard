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
