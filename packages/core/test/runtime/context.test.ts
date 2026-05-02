import { createRuntimeContext } from '../../src/runtime/context.js';

describe('createRuntimeContext', () => {
  it('creates context with required fields', () => {
    const ctx = createRuntimeContext('req-1', null);
    expect(ctx.requestId).toBe('req-1');
    expect(ctx.agentIdentity).toBeNull();
    expect(ctx.timestamp).toBeGreaterThan(0);
    expect(ctx.metadata).toEqual({});
  });

  it('includes agent identity when provided', () => {
    const identity = {
      agentId: 'agent-1',
      capabilities: new Set(['llm:call' as const]),
      expiresAt: Date.now() + 3600_000,
      issuer: 'test',
      metadata: {},
    };
    const ctx = createRuntimeContext('req-2', identity);
    expect(ctx.agentIdentity).toBe(identity);
    expect(ctx.agentIdentity!.agentId).toBe('agent-1');
  });

  it('includes metadata when provided', () => {
    const ctx = createRuntimeContext('req-3', null, { source: 'sdk', version: '1.0' });
    expect(ctx.metadata).toEqual({ source: 'sdk', version: '1.0' });
  });

  it('copies metadata to prevent mutation', () => {
    const meta: Record<string, unknown> = { key: 'value' };
    const ctx = createRuntimeContext('req-4', null, meta);
    meta.key = 'changed';
    expect(ctx.metadata.key).toBe('value');
  });

  it('sets timestamp close to now', () => {
    const before = Date.now();
    const ctx = createRuntimeContext('req-5', null);
    const after = Date.now();
    expect(ctx.timestamp).toBeGreaterThanOrEqual(before);
    expect(ctx.timestamp).toBeLessThanOrEqual(after);
  });
});
