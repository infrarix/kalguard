import type { LinuxSeccompConfig, LinuxAppArmorConfig } from './types.js';

/**
 * Linux seccomp/AppArmor config and profile generation.
 * Config-only: actual enforcement is applied by the container runtime (Docker, containerd)
 * or by running the process under the generated profile. This module outputs OCI-compatible
 * seccomp JSON and validates AppArmor profile paths.
 */

/** OCI seccomp profile format (subset). Used by Docker/containerd. */
export interface SeccompProfile {
  readonly defaultAction: string;
  readonly architectures: readonly string[];
  readonly syscalls: ReadonlyArray<{ names: readonly string[]; action: string }>;
}

/** Default allowlist for a minimal Node/HTTP sidecar: common syscalls only. */
export const DEFAULT_SECCOMP_ALLOWED_SYSCALLS: readonly string[] = [
  'read',
  'write',
  'openat',
  'close',
  'fstat',
  'lseek',
  'mmap',
  'mprotect',
  'munmap',
  'brk',
  'rt_sigaction',
  'rt_sigprocmask',
  'ioctl',
  'pread64',
  'pwrite64',
  'readv',
  'writev',
  'accept',
  'accept4',
  'bind',
  'listen',
  'socket',
  'connect',
  'getsockname',
  'getpeername',
  'setsockopt',
  'getsockopt',
  'clone',
  'execve',
  'uname',
  'fcntl',
  'getdents64',
  'stat',
  'futex',
  'set_tid_address',
  'set_robust_list',
  'prlimit64',
  'getrandom',
  'epoll_create1',
  'epoll_ctl',
  'epoll_pwait',
  'tgkill',
  'exit_group',
  'arch_prctl',
];

/**
 * Generate OCI/Docker-compatible seccomp profile from allowlist.
 * Use with Docker: --security-opt seccomp=path/to/profile.json
 */
export function generateSeccompProfile(config: LinuxSeccompConfig): SeccompProfile {
  const defaultAction = config.defaultAction ?? 'SCMP_ACT_ERRNO';
  const names = config.allowedSyscalls ?? [...DEFAULT_SECCOMP_ALLOWED_SYSCALLS];
  return {
    defaultAction,
    architectures: ['SCMP_ARCH_X86_64', 'SCMP_ARCH_X86', 'SCMP_ARCH_AARCH64'],
    syscalls: [{ names: [...names], action: 'SCMP_ACT_ALLOW' }],
  };
}

/**
 * Validate AppArmor config: profile name or path must be non-empty.
 * Does not load or apply profile; that is the responsibility of the runtime.
 */
export function validateAppArmorConfig(config: LinuxAppArmorConfig): boolean {
  return typeof config.profile === 'string' && config.profile.length > 0;
}

/**
 * Return recommended Docker run flags for Linux enforcement from config.
 * Caller must apply these when starting the container.
 */
export function dockerSeccompFlags(config: LinuxSeccompConfig): string[] {
  const flags: string[] = [];
  if (config.profilePath) {
    flags.push(`--security-opt`, `seccomp=${config.profilePath}`);
  }
  return flags;
}

/**
 * Return recommended Docker run flags for AppArmor.
 */
export function dockerAppArmorFlags(config: LinuxAppArmorConfig): string[] {
  if (!validateAppArmorConfig(config)) return [];
  return ['--security-opt', `apparmor=${config.profile}`];
}
