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

import type { PolicyContext, PolicyDecision, PolicyResult } from '../types.js';

export type { PolicyContext, PolicyDecision, PolicyResult };

/** Rule in policy DSL: condition -> decision. */
export interface PolicyRule {
  readonly id: string;
  readonly description?: string;
  readonly match: RuleMatch;
  readonly decision: PolicyDecision;
  readonly reason?: string;
}

/** Match expression: all must hold (AND). */
export interface RuleMatch {
  readonly agentIds?: string[];
  readonly actions?: string[];
  readonly resources?: string[];
  readonly attributes?: Record<string, unknown>;
}

/** Policy document: ordered list of rules. First match wins. */
export interface PolicyDocument {
  readonly version: string;
  readonly rules: ReadonlyArray<PolicyRule>;
  readonly defaultDecision: PolicyDecision;
  readonly defaultReason: string;
}

/** Policy engine interface: deterministic, hot-reloadable. */
export interface IPolicyEngine {
  evaluate(ctx: PolicyContext): Promise<PolicyResult>;
  loadPolicy(doc: PolicyDocument): void;
  getLoadedPolicy(): PolicyDocument | null;
}
