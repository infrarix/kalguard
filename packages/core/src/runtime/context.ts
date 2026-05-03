import type { AgentIdentity } from '../agent/types.js';

/** Request-scoped runtime context for policy and mediation. */
export interface RuntimeContext {
  readonly requestId: string;
  readonly agentIdentity: AgentIdentity | null;
  readonly timestamp: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export function createRuntimeContext(
  requestId: string,
  agentIdentity: AgentIdentity | null,
  metadata: Readonly<Record<string, unknown>> = {},
): RuntimeContext {
  return {
    requestId,
    agentIdentity,
    timestamp: Date.now(),
    metadata: { ...metadata },
  };
}
