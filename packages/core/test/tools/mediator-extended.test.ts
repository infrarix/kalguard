import { ToolMediator } from '../../src/tools/mediator.js';

describe('ToolMediator - extended coverage', () => {
  const allowlist = [
    { name: 'get_weather', argumentSchema: { location: { type: 'string', required: true } } },
    { name: 'search', argumentSchema: { query: { type: 'string', required: true } } },
    {
      name: 'calc',
      argumentSchema: {
        value: { type: 'number', required: true },
        debug: { type: 'boolean' },
        data: { type: 'object' },
        items: { type: 'array' },
      },
    },
  ];

  it('throws when allowlist is empty', () => {
    expect(() => new ToolMediator({ allowlist: [] })).toThrow('non-empty allowlist');
  });

  it('validates number argument type', () => {
    const m = new ToolMediator({ allowlist });
    const ok = m.mediate({ toolName: 'calc', arguments: { value: 42 }, agentId: 'a1', requestId: 'r1' });
    expect(ok.allowed).toBe(true);
    const bad = m.mediate({ toolName: 'calc', arguments: { value: 'not-a-number' }, agentId: 'a1', requestId: 'r1' });
    expect(bad.allowed).toBe(false);
    expect(bad.schemaValid).toBe(false);
  });

  it('validates boolean argument type', () => {
    const m = new ToolMediator({ allowlist });
    const ok = m.mediate({ toolName: 'calc', arguments: { value: 1, debug: true }, agentId: 'a1', requestId: 'r1' });
    expect(ok.allowed).toBe(true);
    const bad = m.mediate({ toolName: 'calc', arguments: { value: 1, debug: 'yes' }, agentId: 'a1', requestId: 'r1' });
    expect(bad.allowed).toBe(false);
  });

  it('validates object argument type', () => {
    const m = new ToolMediator({ allowlist });
    const ok = m.mediate({
      toolName: 'calc',
      arguments: { value: 1, data: { key: 'val' } },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(ok.allowed).toBe(true);
    const bad = m.mediate({ toolName: 'calc', arguments: { value: 1, data: null }, agentId: 'a1', requestId: 'r1' });
    expect(bad.allowed).toBe(false);
  });

  it('validates array argument type', () => {
    const m = new ToolMediator({ allowlist });
    const ok = m.mediate({
      toolName: 'calc',
      arguments: { value: 1, items: [1, 2, 3] },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(ok.allowed).toBe(true);
    const bad = m.mediate({
      toolName: 'calc',
      arguments: { value: 1, items: 'not-array' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(bad.allowed).toBe(false);
  });

  it('allows when no argument schema defined', () => {
    const m = new ToolMediator({ allowlist: [{ name: 'no_schema' }] });
    const result = m.mediate({
      toolName: 'no_schema',
      arguments: { anything: 'goes' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(true);
  });

  it('skips optional arguments when not provided', () => {
    const m = new ToolMediator({ allowlist });
    const result = m.mediate({ toolName: 'calc', arguments: { value: 5 }, agentId: 'a1', requestId: 'r1' });
    expect(result.allowed).toBe(true);
  });

  it('enforces rate limiting', () => {
    const m = new ToolMediator({ allowlist, rateLimitPerAgent: 2 });
    const inv = { toolName: 'search', arguments: { query: 'test' }, agentId: 'rate-agent', requestId: 'r1' };
    expect(m.mediate(inv).allowed).toBe(true);
    expect(m.mediate(inv).allowed).toBe(true);
    expect(m.mediate(inv).allowed).toBe(false);
    expect(m.mediate(inv).reason).toContain('rate limit');
  });

  it('rate limit resets after window', () => {
    const m = new ToolMediator({ allowlist, rateLimitPerAgent: 1 });
    const inv = { toolName: 'search', arguments: { query: 'test' }, agentId: 'window-agent', requestId: 'r1' };
    expect(m.mediate(inv).allowed).toBe(true);
    expect(m.mediate(inv).allowed).toBe(false);

    // Simulate time passing by manipulating the internal map
    const usageByAgent = (m as any).usageByAgent as Map<string, { count: number; windowStart: number }>;
    const entry = usageByAgent.get('window-agent');
    if (entry) entry.windowStart = Date.now() - 70_000; // 70 seconds ago

    expect(m.mediate(inv).allowed).toBe(true);
  });

  it('rate limits are per-agent', () => {
    const m = new ToolMediator({ allowlist, rateLimitPerAgent: 1 });
    expect(
      m.mediate({ toolName: 'search', arguments: { query: 'test' }, agentId: 'agent-a', requestId: 'r1' }).allowed,
    ).toBe(true);
    expect(
      m.mediate({ toolName: 'search', arguments: { query: 'test' }, agentId: 'agent-b', requestId: 'r1' }).allowed,
    ).toBe(true);
    expect(
      m.mediate({ toolName: 'search', arguments: { query: 'test' }, agentId: 'agent-a', requestId: 'r1' }).allowed,
    ).toBe(false);
  });

  it('updateConfig changes allowlist', () => {
    const m = new ToolMediator({ allowlist });
    expect(m.mediate({ toolName: 'new_tool', arguments: {}, agentId: 'a1', requestId: 'r1' }).allowed).toBe(false);

    m.updateConfig({ allowlist: [...allowlist, { name: 'new_tool' }] });
    expect(m.mediate({ toolName: 'new_tool', arguments: {}, agentId: 'a1', requestId: 'r1' }).allowed).toBe(true);
  });

  it('uses default command denylist (shell subcommand)', () => {
    const m = new ToolMediator({ allowlist });
    const result = m.mediate({
      toolName: 'search',
      arguments: { query: '$(cat /etc/passwd)' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('denylist');
  });

  it('uses default command denylist (backticks)', () => {
    const m = new ToolMediator({ allowlist });
    const result = m.mediate({
      toolName: 'search',
      arguments: { query: '`whoami`' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('denylist');
  });

  it('custom string command denylist', () => {
    const m = new ToolMediator({ allowlist, commandDenylist: ['drop table'] });
    const result = m.mediate({
      toolName: 'search',
      arguments: { query: 'drop table users' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
  });

  it('no rate limit when rateLimitPerAgent is 0', () => {
    const m = new ToolMediator({ allowlist, rateLimitPerAgent: 0 });
    const inv = { toolName: 'search', arguments: { query: 'test' }, agentId: 'a1', requestId: 'r1' };
    // Should always allow (rate limit disabled when 0)
    for (let i = 0; i < 100; i++) {
      expect(m.mediate(inv).allowed).toBe(true);
    }
  });
});
