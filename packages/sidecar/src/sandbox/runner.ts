import { spawn } from 'node:child_process';
import type { SandboxConfig, SandboxResult } from './types.js';

const DEFAULT_MAX_OUTPUT = 1024 * 1024;

/**
 * Run a command in a restricted subprocess: timeout, env allowlist, optional cwd.
 * Dynamically applies OS-level sandboxing (e.g., macOS sandbox-exec) if configured.
 * This provides true isolation alongside timeout and env filtering.
 */
export async function runInSandbox(
  command: string,
  args: readonly string[],
  config: SandboxConfig,
): Promise<SandboxResult> {
  const timeoutMs = config.timeoutMs;
  const maxStdout = config.maxStdoutBytes ?? DEFAULT_MAX_OUTPUT;
  const maxStderr = config.maxStderrBytes ?? DEFAULT_MAX_OUTPUT;

  let env: NodeJS.ProcessEnv;
  if (config.envAllowlist != null && config.envAllowlist.length > 0) {
    env = {};
    for (const key of config.envAllowlist) {
      const val = process.env[key];
      if (val !== undefined) env[key] = val;
    }
  } else {
    env = { ...process.env };
  }

  let execCommand = command;
  let execArgs = [...args];

  if (config.darwin && process.platform === 'darwin') {
    if (config.darwin.sandboxProfilePath) {
      execCommand = 'sandbox-exec';
      execArgs = ['-f', config.darwin.sandboxProfilePath, command, ...args];
    } else if (config.darwin.profileName) {
      execCommand = 'sandbox-exec';
      execArgs = ['-n', config.darwin.profileName, command, ...args];
    }
  }

  const spawnOpts: { env: NodeJS.ProcessEnv; cwd?: string; shell: boolean } = {
    env,
    shell: false,
  };
  if (config.cwd) spawnOpts.cwd = config.cwd;

  return new Promise((resolve) => {
    const child = spawn(execCommand, execArgs, spawnOpts);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let resolved = false;

    const finish = (exitCode: number | null, signal: string | null, err?: string, fromTimeout = false) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      if (fromTimeout) {
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore if already exited
        }
      }
      resolve({
        exitCode,
        signal,
        stdout: truncate(stdout, maxStdout),
        stderr: truncate(stderr, maxStderr),
        timedOut,
        ...(err !== undefined ? { error: err } : {}),
      });
    };

    const timeout = setTimeout(() => {
      timedOut = true;
      finish(null, 'SIGKILL', 'sandbox timeout', true);
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (err) => {
      finish(null, null, err.message, false);
    });
    child.on('close', (code, signal) => {
      if (!resolved) finish(code, signal ?? null, undefined, false);
    });
  });
}

function truncate(s: string, maxBytes: number): string {
  const buf = Buffer.from(s, 'utf8');
  if (buf.length <= maxBytes) return s;
  return buf.subarray(0, maxBytes).toString('utf8') + '\n...[truncated]';
}
