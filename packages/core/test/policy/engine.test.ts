import { PolicyEngine } from '../../src/policy/engine.js';
import type { PolicyContext, PolicyDocument } from '../../src/policy/types.js';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  it('denies when no policy loaded (fail closed)', async () => {
    const ctx: PolicyContext = { agentId: 'a1', action: 'tool:execute', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('no policy loaded');
  });

  it('first matching rule wins', async () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [
        { id: 'r1', match: { agentIds: ['a1'] }, decision: 'allow', reason: 'allowed' },
        { id: 'r2', match: { agentIds: ['a1'] }, decision: 'deny', reason: 'denied' },
      ],
      defaultDecision: 'deny',
      defaultReason: 'default',
    };
    engine.loadPolicy(doc);
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('allowed');
  });

  it('falls to default when no rule matches', async () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [{ id: 'r1', match: { agentIds: ['other'] }, decision: 'allow', reason: 'ok' }],
      defaultDecision: 'deny',
      defaultReason: 'default deny',
    };
    engine.loadPolicy(doc);
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('default deny');
  });

  it('falls to default deny when no rule matches (fail closed)', async () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [{ id: 'r1', match: { agentIds: ['other'] }, decision: 'allow', reason: 'ok' }],
      defaultDecision: 'deny',
      defaultReason: 'no matching rule',
    };
    engine.loadPolicy(doc);
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('no matching rule');
  });

  it('rejects default allow with zero rules', () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [],
      defaultDecision: 'allow',
      defaultReason: 'default',
    };
    expect(() => engine.loadPolicy(doc)).toThrow('must not have default allow with zero rules');
  });
});
