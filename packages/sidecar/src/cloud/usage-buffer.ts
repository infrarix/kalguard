import type { UsageEvent, UsageReportResult } from './types.js';

/** Interface for the cloud client's reportUsage method. */
export interface UsageReporter {
  reportUsage(events: readonly UsageEvent[]): Promise<UsageReportResult>;
}

/**
 * Non-blocking usage event buffer.
 * Accumulates events in memory and flushes to the cloud API
 * when the buffer is full or at a timed interval.
 *
 * Flush failures are logged but never block the request path.
 */
export class UsageBuffer {
  private buffer: UsageEvent[] = [];
  private readonly reporter: UsageReporter;
  private readonly maxSize: number;
  private readonly flushIntervalMs: number;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing: boolean = false;
  private lastFlushResult: UsageReportResult | null = null;

  /**
   * @param reporter - Cloud client implementing reportUsage.
   * @param maxSize - Flush when buffer reaches this size (default: 100).
   * @param flushIntervalMs - Periodic flush interval in ms (default: 30s).
   */
  constructor(reporter: UsageReporter, maxSize: number = 100, flushIntervalMs: number = 30_000) {
    this.reporter = reporter;
    this.maxSize = maxSize;
    this.flushIntervalMs = flushIntervalMs;
  }

  /** Start the periodic flush timer. */
  start(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[kalguard:cloud] periodic flush error:', err);
      });
    }, this.flushIntervalMs);
    // Allow the process to exit even if timer is active
    if (this.flushTimer && typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
      (this.flushTimer as NodeJS.Timeout).unref();
    }
  }

  /** Stop the periodic flush timer. */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /** Push a usage event into the buffer. Triggers flush if buffer is full. */
  push(event: UsageEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.maxSize) {
      this.flush().catch((err) => {
        console.error('[kalguard:cloud] buffer flush error:', err);
      });
    }
  }

  /** Flush all buffered events to the cloud API. Non-blocking. */
  async flush(): Promise<UsageReportResult | null> {
    if (this.flushing || this.buffer.length === 0) {
      return this.lastFlushResult;
    }

    this.flushing = true;
    const events = this.buffer.splice(0);

    try {
      const result = await this.reporter.reportUsage(events);
      this.lastFlushResult = result;
      return result;
    } catch (err) {
      // Put events back at the front of the buffer for retry
      this.buffer.unshift(...events);
      console.error('[kalguard:cloud] flush failed, events re-queued:', err);
      return null;
    } finally {
      this.flushing = false;
    }
  }

  /** Get the current buffer size. */
  size(): number {
    return this.buffer.length;
  }

  /** Get the last flush result for diagnostics. */
  getLastFlushResult(): UsageReportResult | null {
    return this.lastFlushResult;
  }
}
