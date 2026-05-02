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
