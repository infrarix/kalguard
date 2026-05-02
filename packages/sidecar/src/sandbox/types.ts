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
 * Optional execution sandbox for tool invocations.
 * KalGuard does not require a sandbox; the sidecar and policy engine provide the primary boundary.
 * Sandbox is optional hardening for isolated tool execution.
 */

/** Sandbox run config: timeout, env allowlist, cwd. */
export interface SandboxConfig {
  /** Max execution time in ms. Required. */
  readonly timeoutMs: number;
  /** If set, only these env vars are passed to the child. If unset, inherit all. */
  readonly envAllowlist?: readonly string[];
  /** Working directory for the child. If unset, inherit. */
  readonly cwd?: string;
  /** Max stdout size in bytes before truncation. Default 1024 * 1024. */
  readonly maxStdoutBytes?: number;
  /** Max stderr size in bytes before truncation. Default 1024 * 1024. */
  readonly maxStderrBytes?: number;
  /** macOS sandbox-exec configuration. */
  readonly darwin?: import('../os/types.js').DarwinEnforcementConfig;
}

/** Result of a sandboxed run. */
export interface SandboxResult {
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly error?: string;
}
