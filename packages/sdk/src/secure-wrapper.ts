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

import type { PromptMessage } from '@kalguard/core';
import type { KalGuardClient } from './client.js';

/**
 * One-line secure wrapper: wrap LLM call and tool execution with KalGuard checks.
 * If check fails, throws a structured error (no raw agent exposure).
 */
export async function withPromptCheck(
  client: KalGuardClient,
  messages: ReadonlyArray<PromptMessage>,
  fn: (sanitizedMessages: ReadonlyArray<PromptMessage>) => Promise<unknown>,
  requestId?: string,
): Promise<unknown> {
  const response = await client.checkPrompt(messages, requestId);
  if (!response.allowed) {
    const err = new Error(response.message);
    (err as Error & { code: string }).code = response.errorCode ?? 'PROMPT_DENIED';
    (err as Error & { requestId: string }).requestId = response.requestId;
    throw err;
  }
  const toUse = response.data?.sanitizedMessages ?? messages;
  return fn(toUse);
}

/**
 * One-line secure wrapper for tool execution: check with sidecar before calling tool.
 */
export async function withToolCheck<T>(
  client: KalGuardClient,
  toolName: string,
  args: Record<string, unknown>,
  fn: () => Promise<T>,
  requestId?: string,
): Promise<T> {
  const response = await client.checkTool(toolName, args, requestId);
  if (!response.allowed) {
    const err = new Error(response.message);
    (err as Error & { code: string }).code = response.errorCode ?? 'TOOL_DENIED';
    (err as Error & { requestId: string }).requestId = response.requestId;
    throw err;
  }
  return fn();
}
