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
