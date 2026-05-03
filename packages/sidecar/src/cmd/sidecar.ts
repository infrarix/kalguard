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

import { readFile } from 'node:fs/promises';
import { loadSidecarConfig, startPolicyWatch } from '../config/index.js';
import { PolicyEngine, parsePolicyDocument, ToolMediator } from 'kalguard-core';
import type { PolicyDocument, ToolAllowlistEntry } from 'kalguard-core';
import { FileAuditLog, MemoryAuditLog } from '../storage/audit.js';
import { createSidecarServer } from '../sidecar/server.js';

async function main(): Promise<void> {
  const config = loadSidecarConfig();
  const policyEngine = new PolicyEngine();
  const defaultPolicy: PolicyDocument = {
    version: '1.0',
    rules: [],
    defaultDecision: config.policyDefaultDeny ? 'deny' : 'allow',
    defaultReason: 'no policy loaded; fail closed',
  };
  if (config.policyPath) {
    try {
      const raw = await readFile(config.policyPath, 'utf8');
      const doc = parsePolicyDocument(JSON.parse(raw) as unknown);
      policyEngine.loadPolicy(doc);
    } catch (err) {
      console.error('[kalguard] Failed to load policy from', config.policyPath, err);
      policyEngine.loadPolicy(defaultPolicy);
    }
  } else {
    policyEngine.loadPolicy(defaultPolicy);
  }

  let stopPolicyWatch: (() => void) | undefined;
  if (config.policyWatch && config.policyPath) {
    stopPolicyWatch = startPolicyWatch({
      policyPath: config.policyPath,
      policyEngine,
      debounceMs: config.policyWatchIntervalMs,
    });
  }

  const toolAllowlist: ToolAllowlistEntry[] = [
    { name: 'get_weather', argumentSchema: { location: { type: 'string', required: true } } },
    { name: 'search', argumentSchema: { query: { type: 'string', required: true } } },
    { name: 'read_file', argumentSchema: { path: { type: 'string', required: true } } },
  ];
  const toolMediator = new ToolMediator({
    allowlist: toolAllowlist,
    denylist: [],
    ...(config.toolRateLimitPerAgent != null ? { rateLimitPerAgent: config.toolRateLimitPerAgent } : {}),
  });

  const auditLog = config.auditLogPath ? new FileAuditLog(config.auditLogPath) : new MemoryAuditLog();

  const server = createSidecarServer({
    config,
    policyEngine,
    toolMediator,
    auditLog,
  });

  server.listen(config.port, config.host, () => {
    console.log(`[kalguard] sidecar listening on http://${config.host}:${config.port}`);
    if (stopPolicyWatch) console.log('[kalguard] policy watch enabled for', config.policyPath);
  });
}

main().catch((err) => {
  console.error('[kalguard] fatal:', err);
  process.exit(1);
});
