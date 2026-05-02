import { PolicyEngine } from '../../src/policy/engine.js';
import type { PolicyContext, PolicyDocument } from '../../src/policy/types.js';

describe('PolicyEngine - extended coverage', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  it('getLoadedPolicy returns null before loading', () => {
    expect(engine.getLoadedPolicy()).toBeNull();
  });

  it('getLoadedPolicy returns copy after loading', () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [{ id: 'r1', match: {}, decision: 'deny', reason: 'test' }],
      defaultDecision: 'deny',
      defaultReason: 'default',
    };
    engine.loadPolicy(doc);
    const loaded = engine.getLoadedPolicy();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe('1.0');
    expect(loaded!.rules).toHaveLength(1);
  });

  it('matches by action', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: { actions: ['tool:execute'] }, decision: 'allow', reason: 'action match' }],
      defaultDecision: 'deny',
      defaultReason: 'default deny',
    });
    const ctx: PolicyContext = { agentId: 'a1', action: 'tool:execute', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('action match');
  });

  it('does not match when action mismatches', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: { actions: ['prompt:check'] }, decision: 'allow', reason: 'ok' }],
      defaultDecision: 'deny',
      defaultReason: 'default deny',
    });
    const ctx: PolicyContext = { agentId: 'a1', action: 'tool:execute', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
  });

  it('matches by resource', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: { resources: ['database'] }, decision: 'deny', reason: 'resource deny' }],
      defaultDecision: 'allow',
      defaultReason: 'default allow',
    });
    const ctx: PolicyContext = {
      agentId: 'a1',
      action: 'x',
      resource: 'database',
      attributes: {},
      timestamp: Date.now(),
    };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('resource deny');
  });

  it('matches by attributes', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: { attributes: { env: 'prod' } }, decision: 'deny', reason: 'prod deny' }],
      defaultDecision: 'allow',
      defaultReason: 'default',
    });
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: { env: 'prod' }, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
  });

  it('does not match when attribute value differs', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: { attributes: { env: 'prod' } }, decision: 'deny', reason: 'prod only' }],
      defaultDecision: 'allow',
      defaultReason: 'default allow',
    });
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: { env: 'staging' }, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('allow');
  });

  it('matches compound rule (agentId + action)', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [
        { id: 'r1', match: { agentIds: ['a1'], actions: ['tool:execute'] }, decision: 'allow', reason: 'compound' },
      ],
      defaultDecision: 'deny',
      defaultReason: 'default',
    });
    expect(
      (await engine.evaluate({ agentId: 'a1', action: 'tool:execute', attributes: {}, timestamp: Date.now() }))
        .decision,
    ).toBe('allow');
    expect(
      (await engine.evaluate({ agentId: 'a2', action: 'tool:execute', attributes: {}, timestamp: Date.now() }))
        .decision,
    ).toBe('deny');
    expect(
      (await engine.evaluate({ agentId: 'a1', action: 'prompt:send', attributes: {}, timestamp: Date.now() })).decision,
    ).toBe('deny');
  });

  it('uses rule.id as reason when rule.reason is missing', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'my-rule', match: {}, decision: 'deny' }],
      defaultDecision: 'deny',
      defaultReason: 'default',
    });
    const result = await engine.evaluate({ agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() });
    expect(result.reason).toBe('rule: my-rule');
  });

  it('empty match matches everything', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: {}, decision: 'allow', reason: 'catch-all' }],
      defaultDecision: 'deny',
      defaultReason: 'default',
    });
    const result = await engine.evaluate({
      agentId: 'anything',
      action: 'anything',
      attributes: {},
      timestamp: Date.now(),
    });
    expect(result.decision).toBe('allow');
  });

  it('allows require_approval decision', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: {}, decision: 'require_approval', reason: 'needs human' }],
      defaultDecision: 'deny',
      defaultReason: 'default',
    });
    const result = await engine.evaluate({ agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() });
    expect(result.decision).toBe('require_approval');
  });

  it('replaces policy on second loadPolicy call', async () => {
    engine.loadPolicy({
      version: '1.0',
      rules: [{ id: 'r1', match: {}, decision: 'allow', reason: 'first' }],
      defaultDecision: 'deny',
      defaultReason: 'first',
    });
    expect((await engine.evaluate({ agentId: 'a', action: 'x', attributes: {}, timestamp: Date.now() })).decision).toBe(
      'allow',
    );

    engine.loadPolicy({
      version: '2.0',
      rules: [{ id: 'r2', match: {}, decision: 'deny', reason: 'second' }],
      defaultDecision: 'deny',
      defaultReason: 'second',
    });
    expect((await engine.evaluate({ agentId: 'a', action: 'x', attributes: {}, timestamp: Date.now() })).decision).toBe(
      'deny',
    );
  });
});
