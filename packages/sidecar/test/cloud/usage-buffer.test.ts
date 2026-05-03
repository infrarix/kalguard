import { UsageBuffer } from '../../src/cloud/usage-buffer.js';
import type { UsageReporter } from '../../src/cloud/usage-buffer.js';
import type { UsageEvent, UsageReportResult } from '../../src/cloud/types.js';

function makeEvent(overrides: Partial<UsageEvent> = {}): UsageEvent {
  return {
    eventType: 'prompt_check',
    agentId: 'agent_1',
    decision: 'allow',
    timestamp: new Date().toISOString(),
    requestId: `req_${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

function createMockReporter(
  result: UsageReportResult = { accepted: true, remaining: 100 },
): UsageReporter & { calls: UsageEvent[][] } {
  const reporter = {
    calls: [] as UsageEvent[][],
    async reportUsage(events: readonly UsageEvent[]): Promise<UsageReportResult> {
      reporter.calls.push([...events]);
      return result;
    },
  };
  return reporter;
}

describe('UsageBuffer', () => {
  it('buffers events', () => {
    const reporter = createMockReporter();
    const buffer = new UsageBuffer(reporter, 100, 60000);

    buffer.push(makeEvent());
    buffer.push(makeEvent());

    expect(buffer.size()).toBe(2);
    expect(reporter.calls.length).toBe(0);
  });

  it('flushes when maxSize is reached', async () => {
    const reporter = createMockReporter();
    const buffer = new UsageBuffer(reporter, 3, 60000);

    buffer.push(makeEvent());
    buffer.push(makeEvent());
    buffer.push(makeEvent()); // triggers flush

    // Wait for async flush
    await new Promise((r) => setTimeout(r, 10));

    expect(reporter.calls.length).toBe(1);
    expect(reporter.calls[0]!.length).toBe(3);
    expect(buffer.size()).toBe(0);
  });

  it('manual flush sends buffered events', async () => {
    const reporter = createMockReporter();
    const buffer = new UsageBuffer(reporter, 100, 60000);

    buffer.push(makeEvent());
    buffer.push(makeEvent());

    const result = await buffer.flush();

    expect(result?.accepted).toBe(true);
    expect(reporter.calls.length).toBe(1);
    expect(reporter.calls[0]!.length).toBe(2);
    expect(buffer.size()).toBe(0);
  });

  it('flush with empty buffer is a no-op', async () => {
    const reporter = createMockReporter();
    const buffer = new UsageBuffer(reporter, 100, 60000);

    const result = await buffer.flush();

    expect(reporter.calls.length).toBe(0);
    expect(result).toBeNull(); // lastFlushResult is null initially
  });

  it('re-queues events on flush failure', async () => {
    const reporter: UsageReporter = {
      async reportUsage(): Promise<UsageReportResult> {
        throw new Error('Network error');
      },
    };
    const origError = console.error;
    console.error = () => {};
    const buffer = new UsageBuffer(reporter, 100, 60000);

    buffer.push(makeEvent());
    buffer.push(makeEvent());

    await buffer.flush();

    // Events should be re-queued
    expect(buffer.size()).toBe(2);
    console.error = origError;
  });

  it('getLastFlushResult returns last result', async () => {
    const reporter = createMockReporter({ accepted: true, remaining: 42 });
    const buffer = new UsageBuffer(reporter, 100, 60000);

    expect(buffer.getLastFlushResult()).toBeNull();

    buffer.push(makeEvent());
    await buffer.flush();

    expect(buffer.getLastFlushResult()?.remaining).toBe(42);
  });

  it('start and stop manage the timer', () => {
    const reporter = createMockReporter();
    const buffer = new UsageBuffer(reporter, 100, 60000);

    // Should not throw
    buffer.start();
    buffer.stop();
    buffer.start();
    buffer.stop();
  });

  it('does not flush concurrently', async () => {
    let resolveFlush: (() => void) | undefined;
    const reporter: UsageReporter = {
      async reportUsage(_events: readonly UsageEvent[]): Promise<UsageReportResult> {
        await new Promise<void>((resolve) => {
          resolveFlush = resolve;
        });
        return { accepted: true, remaining: 50 };
      },
    };

    const buffer = new UsageBuffer(reporter, 100, 60000);
    buffer.push(makeEvent());

    // Start first flush (will hang on promise)
    const flush1 = buffer.flush();

    // Push more and try second flush — should be no-op (flushing flag)
    buffer.push(makeEvent());
    const flush2 = buffer.flush();

    // Resolve the first flush
    resolveFlush!();
    await flush1;
    await flush2;

    // The second event should still be in the buffer
    expect(buffer.size()).toBe(1);
  });
});
