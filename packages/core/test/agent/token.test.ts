import { createAgentToken, generateAgentId } from '../../src/agent/token.js';
import { validateAgentToken } from '../../src/agent/identity.js';

describe('createAgentToken', () => {
  const secret = 'test-secret-key';
  const issuer = 'test-issuer';

  it('creates a JWT token string', () => {
    const token = createAgentToken('agent-1', ['llm:call'], { secret, issuer });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('creates token with custom TTL', () => {
    const token = createAgentToken('agent-1', ['llm:call'], { secret, issuer, ttlSeconds: 60 });
    const identity = validateAgentToken(token, { secret });
    expect(identity).not.toBeNull();
    // expiresAt should be ~60 seconds from now
    const expectedExpiry = Date.now() + 60_000;
    expect(identity!.expiresAt).toBeGreaterThan(Date.now());
    expect(identity!.expiresAt).toBeLessThanOrEqual(expectedExpiry + 2000);
  });

  it('creates token with metadata', () => {
    const token = createAgentToken(
      'agent-1',
      ['tool:execute'],
      { secret, issuer },
      { env: 'production', version: '2.0' },
    );
    const identity = validateAgentToken(token, { secret });
    expect(identity).not.toBeNull();
    expect(identity!.metadata).toEqual({ env: 'production', version: '2.0' });
  });

  it('creates token with multiple capabilities', () => {
    const token = createAgentToken('agent-1', ['llm:call', 'tool:execute', 'prompt:send'], { secret, issuer });
    const identity = validateAgentToken(token, { secret });
    expect(identity).not.toBeNull();
    expect(identity!.capabilities.has('llm:call')).toBe(true);
    expect(identity!.capabilities.has('tool:execute')).toBe(true);
    expect(identity!.capabilities.has('prompt:send')).toBe(true);
  });

  it('creates token with no capabilities', () => {
    const token = createAgentToken('agent-1', [], { secret, issuer });
    const identity = validateAgentToken(token, { secret });
    expect(identity).not.toBeNull();
    expect(identity!.capabilities.size).toBe(0);
  });

  it('sets correct issuer', () => {
    const token = createAgentToken('agent-1', [], { secret, issuer: 'my-issuer' });
    const identity = validateAgentToken(token, { secret });
    expect(identity!.issuer).toBe('my-issuer');
  });

  it('defaults TTL to 3600 seconds', () => {
    const token = createAgentToken('agent-1', [], { secret, issuer });
    const identity = validateAgentToken(token, { secret });
    const expectedExpiry = Date.now() + 3600_000;
    expect(identity!.expiresAt).toBeGreaterThan(Date.now() + 3500_000);
    expect(identity!.expiresAt).toBeLessThanOrEqual(expectedExpiry + 2000);
  });
});

describe('generateAgentId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateAgentId()));
    expect(ids.size).toBe(100);
  });

  it('generates IDs with agent_ prefix', () => {
    const id = generateAgentId();
    expect(id).toMatch(/^agent_[0-9a-f]{32}$/);
  });
});
