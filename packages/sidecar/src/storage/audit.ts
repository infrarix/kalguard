/**
 * Copyright 2025 KalGuard Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { AuditEntry } from 'kalguard/core';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Immutable, structured JSON audit log. SIEM-ready. */
export interface IAuditLog {
  append(entry: AuditEntry): Promise<void>;
}

/** File-based append-only audit log (one JSON line per entry). */
export class FileAuditLog implements IAuditLog {
  private readonly path: string;
  private initialized = false;

  constructor(filePath: string) {
    this.path = filePath;
  }

  async append(entry: AuditEntry): Promise<void> {
    if (!this.initialized) {
      await mkdir(dirname(this.path), { recursive: true });
      this.initialized = true;
    }
    const line = JSON.stringify(entry) + '\n';
    await appendFile(this.path, line, 'utf8');
  }
}

/** In-memory audit log (for tests or buffering). */
export class MemoryAuditLog implements IAuditLog {
  private readonly entries: AuditEntry[] = [];

  async append(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  getEntries(): ReadonlyArray<AuditEntry> {
    return [...this.entries];
  }
}
