/**
 * Copyright 2025 AARSP Contributors
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

import {
  generateSeccompProfile,
  validateAppArmorConfig,
  dockerSeccompFlags,
  dockerAppArmorFlags,
  DEFAULT_SECCOMP_ALLOWED_SYSCALLS,
} from '../../src/os/linux.js';

describe('Linux OS enforcement', () => {
  it('generates seccomp profile with default allowlist', () => {
    const profile = generateSeccompProfile({});
    expect(profile.defaultAction).toBe('SCMP_ACT_ERRNO');
    expect(profile.architectures).toContain('SCMP_ARCH_X86_64');
    expect(profile.syscalls).toHaveLength(1);
    expect(profile.syscalls[0]!.names).toContain('read');
    expect(profile.syscalls[0]!.action).toBe('SCMP_ACT_ALLOW');
  });

  it('generates seccomp profile with custom allowlist', () => {
    const profile = generateSeccompProfile({
      allowedSyscalls: ['read', 'write'],
      defaultAction: 'SCMP_ACT_KILL',
    });
    expect(profile.defaultAction).toBe('SCMP_ACT_KILL');
    expect(profile.syscalls[0]!.names).toEqual(['read', 'write']);
  });

  it('validates AppArmor config', () => {
    expect(validateAppArmorConfig({ profile: 'aarsp-sidecar' })).toBe(true);
    expect(validateAppArmorConfig({ profile: '' })).toBe(false);
  });

  it('returns Docker seccomp flags when profilePath set', () => {
    const flags = dockerSeccompFlags({ profilePath: '/path/to/profile.json' });
    expect(flags).toEqual(['--security-opt', 'seccomp=/path/to/profile.json']);
  });

  it('returns Docker AppArmor flags', () => {
    const flags = dockerAppArmorFlags({ profile: 'aarsp-sidecar' });
    expect(flags).toEqual(['--security-opt', 'apparmor=aarsp-sidecar']);
  });

  it('DEFAULT_SECCOMP_ALLOWED_SYSCALLS includes common syscalls', () => {
    expect(DEFAULT_SECCOMP_ALLOWED_SYSCALLS).toContain('read');
    expect(DEFAULT_SECCOMP_ALLOWED_SYSCALLS).toContain('write');
    expect(DEFAULT_SECCOMP_ALLOWED_SYSCALLS).toContain('exit_group');
  });
});
