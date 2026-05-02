# OS-Level Enforcement (Optional Extension)

Copyright 2025 KalGuard Contributors. Licensed under the Apache License, Version 2.0.

Implemented OS-level enforcement (config + helpers):

- **Linux**: seccomp config and OCI/Docker-compatible profile generation; AppArmor config and Docker flags.
- **macOS**: Documented stubs for `sandbox-exec` (profile path or named profile).
- **Windows**: Documented stubs for job objects and integrity levels.

Security assumption: KalGuard does not rely on OS enforcement for core guarantees. The sidecar and policy engine provide the primary security boundary. OS hooks are optional hardening.

## Usage

### Linux seccomp

```ts
import { generateSeccompProfile, dockerSeccompFlags } from 'kalguard/integrations/os';
const profile = generateSeccompProfile({ allowedSyscalls: ['read', 'write', ...], defaultAction: 'SCMP_ACT_ERRNO' });
// Write profile.json and run: docker run --security-opt seccomp=profile.json ...
```

Generate profile to file: `node dist/cmd/seccomp-profile.js /path/to/seccomp.json`

### macOS sandbox-exec

```ts
import { getDarwinEnforcementCommand } from 'kalguard/integrations/os';
const result = getDarwinEnforcementCommand({ sandboxProfilePath: '/path/to/profile.sb' });
// Run: sandbox-exec -f /path/to/profile.sb -- node dist/cmd/sidecar.js
```

### Windows

```ts
import { getWindowsEnforcementDocs } from 'kalguard/integrations/os';
const result = getWindowsEnforcementDocs({ integrityLevel: 'medium', limitToSingleProcess: true });
// Apply steps via Windows API or container runtime.
```
