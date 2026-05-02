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
