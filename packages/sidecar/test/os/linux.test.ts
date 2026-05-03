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
    expect(validateAppArmorConfig({ profile: 'kalguard-sidecar' })).toBe(true);
    expect(validateAppArmorConfig({ profile: '' })).toBe(false);
  });

  it('returns Docker seccomp flags when profilePath set', () => {
    const flags = dockerSeccompFlags({ profilePath: '/path/to/profile.json' });
    expect(flags).toEqual(['--security-opt', 'seccomp=/path/to/profile.json']);
  });

  it('returns Docker AppArmor flags', () => {
    const flags = dockerAppArmorFlags({ profile: 'kalguard-sidecar' });
    expect(flags).toEqual(['--security-opt', 'apparmor=kalguard-sidecar']);
  });

  it('DEFAULT_SECCOMP_ALLOWED_SYSCALLS includes common syscalls', () => {
    expect(DEFAULT_SECCOMP_ALLOWED_SYSCALLS).toContain('read');
    expect(DEFAULT_SECCOMP_ALLOWED_SYSCALLS).toContain('write');
    expect(DEFAULT_SECCOMP_ALLOWED_SYSCALLS).toContain('exit_group');
  });
});
