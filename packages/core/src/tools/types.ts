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

import type { ToolInvocation } from '../types.js';

export type { ToolInvocation };

/** Tool mediation result: allow, deny, or require_approval. */
export interface ToolMediationResult {
  readonly allowed: boolean;
  readonly decision: 'allow' | 'deny' | 'require_approval';
  readonly reason?: string;
  readonly schemaValid: boolean;
}

/** Tool allowlist entry: tool name + optional argument schema. */
export interface ToolAllowlistEntry {
  readonly name: string;
  readonly argumentSchema?: Record<string, { type: string; required?: boolean }>;
}

/** Mediator config: allowlist, denylist, rate limits. */
export interface ToolMediatorConfig {
  readonly allowlist: ReadonlyArray<ToolAllowlistEntry>;
  readonly denylist?: ReadonlyArray<string>;
  readonly commandDenylist?: ReadonlyArray<string | RegExp>;
  readonly rateLimitPerAgent?: number; // requests per minute
}
