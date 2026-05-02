import { parsePolicyDocument } from '../../src/policy/parser.js';

describe('parsePolicyDocument', () => {
  it('parses valid policy document', () => {
    const doc = parsePolicyDocument({
      version: '1.0',
      rules: [{ id: 'r1', decision: 'allow', match: { agentIds: ['a1'] }, reason: 'ok' }],
      defaultDecision: 'deny',
      defaultReason: 'denied',
    });
    expect(doc.version).toBe('1.0');
    expect(doc.rules).toHaveLength(1);
    expect(doc.rules[0]!.id).toBe('r1');
    expect(doc.rules[0]!.decision).toBe('allow');
    expect(doc.defaultDecision).toBe('deny');
    expect(doc.defaultReason).toBe('denied');
  });

  it('throws for null input', () => {
    expect(() => parsePolicyDocument(null)).toThrow('non-null object');
  });

  it('throws for non-object input', () => {
    expect(() => parsePolicyDocument('string')).toThrow('non-null object');
  });

  it('throws for missing rules array', () => {
    expect(() => parsePolicyDocument({ defaultDecision: 'deny' })).toThrow('"rules" array');
  });

  it('throws for invalid defaultDecision', () => {
    expect(() => parsePolicyDocument({ rules: [], defaultDecision: 'invalid' })).toThrow('Invalid defaultDecision');
  });

  it('throws for invalid rule decision', () => {
    expect(() =>
      parsePolicyDocument({
        rules: [{ id: 'r1', decision: 'bad', match: {} }],
        defaultDecision: 'deny',
      }),
    ).toThrow('Invalid rules[0].decision');
  });

  it('throws for non-object rule', () => {
    expect(() => parsePolicyDocument({ rules: ['not-an-object'], defaultDecision: 'deny' })).toThrow(
      'Rule at index 0 must be an object',
    );
  });

  it('generates rule id when missing', () => {
    const doc = parsePolicyDocument({
      rules: [{ decision: 'deny', match: {} }],
      defaultDecision: 'deny',
    });
    expect(doc.rules[0]!.id).toBe('rule-0');
  });

  it('parses match with all fields', () => {
    const doc = parsePolicyDocument({
      rules: [
        {
          id: 'r1',
          decision: 'allow',
          match: {
            agentIds: ['a1', 'a2'],
            actions: ['tool:execute'],
            resources: ['file:read'],
            attributes: { env: 'prod' },
          },
          description: 'test rule',
          reason: 'matched',
        },
      ],
      defaultDecision: 'deny',
    });
    const rule = doc.rules[0]!;
    expect(rule.match.agentIds).toEqual(['a1', 'a2']);
    expect(rule.match.actions).toEqual(['tool:execute']);
    expect(rule.match.resources).toEqual(['file:read']);
    expect(rule.match.attributes).toEqual({ env: 'prod' });
    expect(rule.description).toBe('test rule');
    expect(rule.reason).toBe('matched');
  });

  it('parses empty match as empty object', () => {
    const doc = parsePolicyDocument({
      rules: [{ id: 'r1', decision: 'deny', match: {} }],
      defaultDecision: 'deny',
    });
    expect(doc.rules[0]!.match).toEqual({});
  });

  it('handles null match', () => {
    const doc = parsePolicyDocument({
      rules: [{ id: 'r1', decision: 'deny', match: null }],
      defaultDecision: 'deny',
    });
    expect(doc.rules[0]!.match).toEqual({});
  });

  it('defaults version to 1.0', () => {
    const doc = parsePolicyDocument({
      rules: [{ id: 'r1', decision: 'deny', match: {} }],
      defaultDecision: 'deny',
    });
    expect(doc.version).toBe('1.0');
  });

  it('accepts require_approval decision', () => {
    const doc = parsePolicyDocument({
      rules: [{ id: 'r1', decision: 'require_approval', match: {} }],
      defaultDecision: 'require_approval',
    });
    expect(doc.rules[0]!.decision).toBe('require_approval');
    expect(doc.defaultDecision).toBe('require_approval');
  });
});
