import { writeFile } from 'node:fs/promises';
import { generateSeccompProfile, DEFAULT_SECCOMP_ALLOWED_SYSCALLS } from '../os/linux.js';
import type { LinuxSeccompConfig } from '../os/types.js';

/**
 * Generate OCI/Docker-compatible seccomp profile and optionally write to file.
 * Usage: node dist/cmd/seccomp-profile.js [output.json]
 * Or use programmatically: generateSeccompProfile(config) then write output.
 */
async function main(): Promise<void> {
  const config: LinuxSeccompConfig = {
    allowedSyscalls: [...DEFAULT_SECCOMP_ALLOWED_SYSCALLS],
    defaultAction: 'SCMP_ACT_ERRNO',
  };
  const profile = generateSeccompProfile(config);
  const outPath = process.argv[2];
  const json = JSON.stringify(profile, null, 2);
  if (outPath) {
    await writeFile(outPath, json, 'utf8');
    console.log('[kalguard] seccomp profile written to', outPath);
  } else {
    console.log(json);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
