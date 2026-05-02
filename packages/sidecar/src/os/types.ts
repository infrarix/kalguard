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

/**
 * OS-level enforcement config types.
 * KalGuard does not rely on OS enforcement for core guarantees; these are optional hardening.
 */

/** Linux seccomp config: allowlist of syscalls or path to profile JSON. */
export interface LinuxSeccompConfig {
  /** Allowlist of syscall names (e.g. read, write, exit_group). Used to generate profile. */
  readonly allowedSyscalls?: readonly string[];
  /** Path to pre-built seccomp profile JSON (Docker/OCI format). Overrides allowedSyscalls if set. */
  readonly profilePath?: string;
  /** Default action for syscalls not in allowlist: SCMP_ACT_ERRNO, SCMP_ACT_KILL, etc. */
  readonly defaultAction?: 'SCMP_ACT_ERRNO' | 'SCMP_ACT_KILL' | 'SCMP_ACT_ALLOW';
}

/** Linux AppArmor config: profile name or path. */
export interface LinuxAppArmorConfig {
  /** AppArmor profile name (e.g. kalguard-sidecar) or path to profile file. */
  readonly profile: string;
  /** If true, load profile from file; otherwise use named profile. */
  readonly fromFile?: boolean;
}

/** Linux OS enforcement config. */
export interface LinuxEnforcementConfig {
  readonly seccomp?: LinuxSeccompConfig;
  readonly appArmor?: LinuxAppArmorConfig;
}

/** macOS sandbox-exec config. Enforcement is applied by running under sandbox-exec with profile. */
export interface DarwinEnforcementConfig {
  /** Path to sandbox profile (.sb or inline). See sandbox(7). */
  readonly sandboxProfilePath?: string;
  /** Named profile: 'no-network', 'no-write', etc. Applied automatically by runInSandbox on macOS. */
  readonly profileName?: string;
}

/** Windows job object / integrity level config for hardening via external tooling. */
export interface WindowsEnforcementConfig {
  /** Integrity level: low, medium, high. Documented for use with job objects. */
  readonly integrityLevel?: 'low' | 'medium' | 'high';
  /** Limit job to a single process (documented). */
  readonly limitToSingleProcess?: boolean;
}

/** Platform-agnostic OS enforcement config. */
export interface OSEnforcementConfig {
  readonly linux?: LinuxEnforcementConfig;
  readonly darwin?: DarwinEnforcementConfig;
  readonly windows?: WindowsEnforcementConfig;
}
