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

import type { PromptMessage } from '../types.js';

export type { PromptMessage };

/** Classified segment: system, user, or tool. */
export type MessageSegmentKind = 'system' | 'user' | 'tool';

/** Risk level for prompt firewall. */
export type PromptRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Result of prompt firewall evaluation. */
export interface PromptFirewallResult {
  readonly allowed: boolean;
  readonly riskScore: number; // 0-100
  readonly riskLevel: PromptRiskLevel;
  readonly sanitizedMessages?: ReadonlyArray<PromptMessage>;
  readonly reason?: string;
  readonly injectionDetected: boolean;
}

/** Options for prompt firewall. */
export interface PromptFirewallOptions {
  readonly blockThreshold?: number; // 0-100, default 70
  readonly sanitizeThreshold?: number; // 0-100, default 50
}
