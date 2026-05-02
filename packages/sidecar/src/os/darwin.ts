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

import type { DarwinEnforcementConfig } from './types.js';

/**
 * macOS enforcement via sandbox-exec.
 * Validates Darwin config and returns the recommended sandbox-exec invocation,
 * which is applied automatically by `runInSandbox` when `config.darwin` is set
 * and the host platform is macOS.
 */

/** Result of applying Darwin config (documented; no kernel enforcement from Node). */
export interface DarwinEnforcementResult {
  readonly applied: boolean;
  readonly recommendedCommand: string;
  readonly message: string;
}

/**
 * Validate Darwin config and return recommended sandbox-exec command.
 * Does not execute sandbox-exec; caller must run: sandbox-exec -f profile.sb node dist/cmd/sidecar.js
 */
export function getDarwinEnforcementCommand(config: DarwinEnforcementConfig): DarwinEnforcementResult {
  if (config.sandboxProfilePath) {
    return {
      applied: false,
      recommendedCommand: `sandbox-exec -f ${config.sandboxProfilePath}`,
      message: 'Run the sidecar under sandbox-exec with the given profile path.',
    };
  }
  if (config.profileName) {
    const profileNames = ['no-network', 'no-write', 'no-internet', 'no-sysctl'];
    const name = config.profileName;
    if (profileNames.includes(name)) {
      return {
        applied: false,
        recommendedCommand: `sandbox-exec -n ${name}`,
        message: `Use: sandbox-exec -n ${name} -- node dist/cmd/sidecar.js`,
      };
    }
    return {
      applied: false,
      recommendedCommand: `sandbox-exec -n ${name}`,
      message: `Named profile "${name}". Ensure profile exists in /usr/share/sandbox/ or use -f for custom profile.`,
    };
  }
  return {
    applied: false,
    recommendedCommand: '',
    message: 'No Darwin enforcement config; run without sandbox-exec for no OS-level restriction.',
  };
}

/**
 * Check if current platform is Darwin (macOS). For use when deciding to suggest sandbox-exec.
 */
export function isDarwin(): boolean {
  return process.platform === 'darwin';
}
