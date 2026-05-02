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

import { validateAgentToken, checkCapability } from '../../src/agent/identity.js';
import { createAgentToken } from '../../src/agent/token.js';

describe('Agent identity', () => {
  const secret = 'test-secret';
  const issuer = 'test-issuer';

  it('returns null for empty token', () => {
    expect(validateAgentToken('')).toBeNull();
    expect(validateAgentToken('   ')).toBeNull();
  });

  it('returns identity for valid token', () => {
    const token = createAgentToken('agent-1', ['llm:call', 'tool:execute'], { secret, issuer, ttlSeconds: 3600 });
    const identity = validateAgentToken(token, { secret });
    expect(identity).not.toBeNull();
    expect(identity!.agentId).toBe('agent-1');
    expect(identity!.capabilities.has('llm:call')).toBe(true);
    expect(identity!.capabilities.has('tool:execute')).toBe(true);
  });

  it('returns null when signature invalid', () => {
    const token = createAgentToken('agent-1', [], { secret, issuer });
    const badToken = token.slice(0, -2) + 'xx';
    expect(validateAgentToken(badToken, { secret })).toBeNull();
  });

  it('checkCapability allows when capability present', () => {
    const token = createAgentToken('agent-1', ['tool:execute'], { secret, issuer });
    const identity = validateAgentToken(token, { secret })!;
    expect(checkCapability(identity, 'tool:execute').allowed).toBe(true);
  });

  it('checkCapability denies when capability missing', () => {
    const token = createAgentToken('agent-1', ['llm:call'], { secret, issuer });
    const identity = validateAgentToken(token, { secret })!;
    expect(checkCapability(identity, 'tool:execute').allowed).toBe(false);
  });
});
