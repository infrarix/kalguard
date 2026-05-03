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
