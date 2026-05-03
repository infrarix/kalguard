import type { SecurityResponse, PromptMessage } from 'kalguard-core';

export interface KalGuardClientOptions {
  readonly baseUrl: string;
  readonly token: string;
  readonly requestId?: string;
}

/** Plan info returned by cloud-connected sidecar via response headers. */
export interface KalGuardPlanInfo {
  readonly plan: string;
  readonly remaining: number;
  readonly resetAt: number;
}

function parsePlanHeaders(headers: Headers): KalGuardPlanInfo | undefined {
  const plan = headers.get('x-kalguard-plan');
  if (!plan) return undefined;
  return {
    plan,
    remaining: Number(headers.get('x-kalguard-usage-remaining') ?? -1),
    resetAt: Number(headers.get('x-ratelimit-reset') ?? 0),
  };
}

/**
 * Lightweight SDK client: one-line integration to check prompts and tools via sidecar.
 * Agents send requests through this client; sidecar mediates.
 */
export class KalGuardClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(options: KalGuardClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    if (!this.token) throw new Error('KalGuardClient requires token');
  }

  /** Last plan info received from sidecar (populated after each request). */
  get planInfo(): KalGuardPlanInfo | undefined {
    return this._planInfo;
  }

  private _planInfo: KalGuardPlanInfo | undefined;

  /**
   * Check prompt with sidecar (prompt firewall + policy). Use sanitized messages if returned.
   */
  async checkPrompt(
    messages: ReadonlyArray<PromptMessage>,
    requestId?: string,
  ): Promise<
    SecurityResponse<{
      allowed: boolean;
      riskScore?: number;
      riskLevel?: string;
      sanitizedMessages?: ReadonlyArray<PromptMessage>;
    }>
  > {
    const id = requestId ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const res = await fetch(`${this.baseUrl}/v1/prompt/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'x-kalguard-request-id': id,
      },
      body: JSON.stringify({ messages }),
    });
    this._planInfo = parsePlanHeaders(res.headers);
    const data = (await res.json()) as SecurityResponse<{
      allowed: boolean;
      riskScore?: number;
      riskLevel?: string;
      sanitizedMessages?: ReadonlyArray<PromptMessage>;
    }>;
    return data;
  }

  /**
   * Check tool execution with sidecar (allowlist, denylist, schema, rate limit).
   */
  async checkTool(
    toolName: string,
    args: Record<string, unknown>,
    requestId?: string,
  ): Promise<SecurityResponse<{ allowed: boolean }>> {
    const id = requestId ?? `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const res = await fetch(`${this.baseUrl}/v1/tool/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'x-kalguard-request-id': id,
      },
      body: JSON.stringify({ toolName, arguments: args }),
    });
    this._planInfo = parsePlanHeaders(res.headers);
    const data = (await res.json()) as SecurityResponse<{ allowed: boolean }>;
    return data;
  }
}
