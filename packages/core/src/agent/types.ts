/**
 * Agent identity is explicitly separate from user identity.
 * Agents are untrusted by default; capabilities are scoped.
 */

/** Scoped capability for an agent (allowlist). */
export type AgentCapability =
  | 'llm:call'
  | 'tool:execute'
  | 'tool:read'
  | 'tool:write'
  | 'network:outbound'
  | 'prompt:send'
  | 'prompt:receive';

/** Verified agent identity after token validation. */
export interface AgentIdentity {
  readonly agentId: string;
  readonly capabilities: ReadonlySet<AgentCapability>;
  readonly expiresAt: number; // Unix ms
  readonly issuer: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** Token payload (short-lived). */
export interface AgentTokenPayload {
  readonly sub: string; // agent id
  readonly iss: string;
  readonly exp: number;
  readonly iat: number;
  readonly capabilities: readonly AgentCapability[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Result of capability check. */
export interface CapabilityCheckResult {
  readonly allowed: boolean;
  readonly reason?: string;
}
