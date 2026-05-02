import { createSecurityEvent, toAuditEntry } from '../../src/monitoring/events.js';

describe('createSecurityEvent', () => {
  it('creates event with required fields', () => {
    const evt = createSecurityEvent('tool_allowed', 'agent-1', 'req-1');
    expect(evt.id).toMatch(/^evt_/);
    expect(evt.type).toBe('tool_allowed');
    expect(evt.agentId).toBe('agent-1');
    expect(evt.requestId).toBe('req-1');
    expect(evt.timestamp).toBeDefined();
    expect(new Date(evt.timestamp).getTime()).not.toBeNaN();
    expect(evt.metadata).toEqual({});
  });

  it('includes optional decision and reason', () => {
    const evt = createSecurityEvent('prompt_denied', 'agent-2', 'req-2', {
      decision: 'deny',
      reason: 'injection detected',
    });
    expect(evt.decision).toBe('deny');
    expect(evt.reason).toBe('injection detected');
  });

  it('includes metadata', () => {
    const evt = createSecurityEvent('tool_denied', 'agent-3', 'req-3', {
      metadata: { toolName: 'run_shell', riskScore: 85 },
    });
    expect(evt.metadata).toEqual({ toolName: 'run_shell', riskScore: 85 });
  });

  it('generates unique event IDs', () => {
    const evt1 = createSecurityEvent('auth_success', 'a', 'r1');
    const evt2 = createSecurityEvent('auth_success', 'a', 'r1');
    expect(evt1.id).not.toBe(evt2.id);
  });
});

describe('toAuditEntry', () => {
  it('converts SecurityEvent to AuditEntry', () => {
    const evt = createSecurityEvent('auth_failure', 'agent-1', 'req-1', {
      decision: 'deny',
      reason: 'bad token',
      metadata: { ip: '10.0.0.1' },
    });
    const entry = toAuditEntry(evt);
    expect(entry.id).toBe(evt.id);
    expect(entry.type).toBe('auth_failure');
    expect(entry.timestamp).toBe(evt.timestamp);
    expect(entry.agentId).toBe('agent-1');
    expect(entry.requestId).toBe('req-1');
    expect(entry.decision).toBe('deny');
    expect(entry.reason).toBe('bad token');
    expect(entry.metadata).toEqual({ ip: '10.0.0.1' });
  });

  it('omits decision and reason when not set on event', () => {
    const evt = createSecurityEvent('prompt_allowed', 'agent-1', 'req-1');
    const entry = toAuditEntry(evt);
    expect(entry.decision).toBeUndefined();
    expect(entry.reason).toBeUndefined();
  });
});
