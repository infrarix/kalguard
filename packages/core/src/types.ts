/**
 * Shared types and trust boundaries for KalGuard.
 * Agent identity is explicitly separate from user identity.
 */

/** Policy decision: allow, deny, or require human approval. */
export type PolicyDecision = 'allow' | 'deny' | 'require_approval';

/** Context passed to policy evaluation. */
export interface PolicyContext {
  readonly agentId: string;
  readonly action: string;
  readonly resource?: string;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}

/** Result of policy evaluation. Fail-closed: errors yield deny. */
export interface PolicyResult {
  readonly decision: PolicyDecision;
  readonly reason?: string;
  readonly obligations?: Readonly<string[]>;
}

/** Structured security response returned to callers (never raw errors). */
export interface SecurityResponse<T = unknown> {
  readonly allowed: boolean;
  readonly decision: PolicyDecision;
  readonly data?: T;
  readonly errorCode?: string;
  readonly message: string;
  readonly requestId: string;
}

/** Prompt message role for firewall classification. */
export type PromptRole = 'system' | 'user' | 'assistant' | 'tool';

/** Single message in a prompt sequence. */
export interface PromptMessage {
  readonly role: PromptRole;
  readonly content: string;
  readonly name?: string;
}

/** Tool invocation request for mediation. */
export interface ToolInvocation {
  readonly toolName: string;
  readonly arguments: Readonly<Record<string, unknown>>;
  readonly agentId: string;
  readonly requestId: string;
}

/** Audit event type for SIEM correlation. */
export type AuditEventType =
  | 'auth_success'
  | 'auth_failure'
  | 'prompt_allowed'
  | 'prompt_denied'
  | 'prompt_sanitized'
  | 'tool_allowed'
  | 'tool_denied'
  | 'policy_deny'
  | 'policy_error'
  | 'llm_request'
  | 'llm_response'
  | 'network_request'
  | 'network_denied';

/** Immutable audit log entry. */
export interface AuditEntry {
  readonly id: string;
  readonly type: AuditEventType;
  readonly timestamp: string; // ISO8601
  readonly agentId: string;
  readonly requestId: string;
  readonly decision?: PolicyDecision;
  readonly reason?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

/** LLM API request shape (generic for interception). */
export interface LLMRequest {
  readonly messages: ReadonlyArray<PromptMessage>;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly [key: string]: unknown;
}

/** LLM API response shape (generic). */
export interface LLMResponse {
  readonly choices?: ReadonlyArray<{ message?: { role?: string; content?: string }; [key: string]: unknown }>;
  readonly usage?: { prompt_tokens?: number; completion_tokens?: number };
  readonly [key: string]: unknown;
}
