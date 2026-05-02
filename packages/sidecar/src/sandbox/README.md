# Sandbox

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

Optional execution sandbox for tool invocations: timeout, env allowlist, cwd, stdout/stderr size limits. Core KalGuard does not require a sandbox; the sidecar and policy engine provide the primary boundary. Use for isolated tool execution (e.g., run agent tools in a subprocess with timeout and restricted env).

## Usage

```ts
import { runInSandbox } from '../sandbox/runner.js';

const result = await runInSandbox('node', ['script.js'], {
  timeoutMs: 5000,
  envAllowlist: ['PATH', 'HOME'],
  cwd: '/tmp',
  maxStdoutBytes: 1024 * 1024,
});
if (result.timedOut) { /* handle timeout */ }
```
