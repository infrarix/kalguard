import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { parsePolicyDocument, PolicyEngine } from 'kalguard-core';

export interface PolicyWatchOptions {
  readonly policyPath: string;
  readonly policyEngine: PolicyEngine;
  readonly debounceMs: number;
}

/**
 * Watch policy file and hot-reload into policy engine on change.
 * Debounced to avoid reload storms. On parse error, keeps previous policy (fail closed: don't clear).
 */
export function startPolicyWatch(options: PolicyWatchOptions): () => void {
  const { policyPath, policyEngine, debounceMs } = options;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const reload = async (): Promise<void> => {
    try {
      const raw = await readFile(policyPath, 'utf8');
      const doc = parsePolicyDocument(JSON.parse(raw) as unknown);
      policyEngine.loadPolicy(doc);
      console.log('[kalguard] policy reloaded from', policyPath);
    } catch (err) {
      console.error('[kalguard] policy reload failed; keeping previous policy:', err);
    }
  };

  const scheduleReload = (): void => {
    if (debounceTimer != null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      reload().catch((e) => console.error('[kalguard] policy watch reload error:', e));
    }, debounceMs);
  };

  const watcher = watch(policyPath, { persistent: true }, (event, filename) => {
    if (event === 'change' && filename) scheduleReload();
  });

  const stop = (): void => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    watcher.close();
  };

  return stop;
}
