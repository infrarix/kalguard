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

import type { SecurityResponse, PromptMessage } from 'kalguard/core';

export interface KalGuardClientOptions {
  readonly baseUrl: string;
  readonly token: string;
  readonly requestId?: string;
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
    const data = (await res.json()) as SecurityResponse<{ allowed: boolean }>;
    return data;
  }
}
