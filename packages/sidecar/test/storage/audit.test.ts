import { MemoryAuditLog, FileAuditLog } from '../../src/storage/audit.js';
import type { AuditEntry } from 'kalguard-core';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('MemoryAuditLog', () => {
  it('starts empty', () => {
    const log = new MemoryAuditLog();
    expect(log.getEntries()).toEqual([]);
  });

  it('appends entries', async () => {
    const log = new MemoryAuditLog();
    const entry: AuditEntry = {
      id: 'evt_1',
      type: 'tool_allowed',
      timestamp: new Date().toISOString(),
      agentId: 'agent-1',
      requestId: 'req-1',
      metadata: {},
    };
    await log.append(entry);
    expect(log.getEntries()).toHaveLength(1);
    expect(log.getEntries()[0]).toEqual(entry);
  });

  it('appends multiple entries in order', async () => {
    const log = new MemoryAuditLog();
    const entries: AuditEntry[] = [
      {
        id: 'evt_1',
        type: 'auth_success',
        timestamp: '2025-01-01T00:00:00Z',
        agentId: 'a1',
        requestId: 'r1',
        metadata: {},
      },
      {
        id: 'evt_2',
        type: 'tool_denied',
        timestamp: '2025-01-01T00:00:01Z',
        agentId: 'a2',
        requestId: 'r2',
        metadata: { reason: 'blocked' },
      },
      {
        id: 'evt_3',
        type: 'prompt_allowed',
        timestamp: '2025-01-01T00:00:02Z',
        agentId: 'a1',
        requestId: 'r3',
        metadata: {},
      },
    ];
    for (const e of entries) await log.append(e);
    expect(log.getEntries()).toHaveLength(3);
    expect(log.getEntries().map((e) => e.id)).toEqual(['evt_1', 'evt_2', 'evt_3']);
  });

  it('returns a copy (not mutable reference)', async () => {
    const log = new MemoryAuditLog();
    const entry: AuditEntry = {
      id: 'evt_1',
      type: 'auth_failure',
      timestamp: new Date().toISOString(),
      agentId: 'a1',
      requestId: 'r1',
      metadata: {},
    };
    await log.append(entry);
    const entries = log.getEntries();
    expect(entries).toHaveLength(1);
    // Should return a copy
    (entries as AuditEntry[]).push({
      id: 'evt_fake',
      type: 'tool_allowed',
      timestamp: '',
      agentId: '',
      requestId: '',
      metadata: {},
    });
    expect(log.getEntries()).toHaveLength(1);
  });
});

describe('FileAuditLog', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'kalguard-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('writes entries as JSON lines', async () => {
    const logPath = join(tmpDir, 'audit.jsonl');
    const log = new FileAuditLog(logPath);
    const entry: AuditEntry = {
      id: 'evt_1',
      type: 'tool_allowed',
      timestamp: '2025-01-01T00:00:00Z',
      agentId: 'agent-1',
      requestId: 'req-1',
      metadata: { toolName: 'search' },
    };
    await log.append(entry);
    const content = await readFile(logPath, 'utf8');
    const parsed = JSON.parse(content.trim());
    expect(parsed.id).toBe('evt_1');
    expect(parsed.type).toBe('tool_allowed');
  });

  it('appends multiple entries on separate lines', async () => {
    const logPath = join(tmpDir, 'audit.jsonl');
    const log = new FileAuditLog(logPath);
    await log.append({ id: 'e1', type: 'auth_success', timestamp: '', agentId: 'a1', requestId: 'r1', metadata: {} });
    await log.append({ id: 'e2', type: 'auth_failure', timestamp: '', agentId: 'a2', requestId: 'r2', metadata: {} });
    const content = await readFile(logPath, 'utf8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).id).toBe('e1');
    expect(JSON.parse(lines[1]!).id).toBe('e2');
  });

  it('creates directory if it does not exist', async () => {
    const logPath = join(tmpDir, 'subdir', 'nested', 'audit.jsonl');
    const log = new FileAuditLog(logPath);
    await log.append({ id: 'e1', type: 'tool_denied', timestamp: '', agentId: 'a1', requestId: 'r1', metadata: {} });
    const content = await readFile(logPath, 'utf8');
    expect(JSON.parse(content.trim()).id).toBe('e1');
  });
});
