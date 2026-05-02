import { getDarwinEnforcementCommand, isDarwin } from '../../src/os/darwin.js';

describe('Darwin OS enforcement', () => {
  it('returns sandbox-exec -f command for profile path', () => {
    const result = getDarwinEnforcementCommand({ sandboxProfilePath: '/tmp/profile.sb' });
    expect(result.applied).toBe(false);
    expect(result.recommendedCommand).toBe('sandbox-exec -f /tmp/profile.sb');
    expect(result.message).toContain('sandbox-exec');
  });

  it('returns sandbox-exec -n command for known profile name', () => {
    const result = getDarwinEnforcementCommand({ profileName: 'no-network' });
    expect(result.applied).toBe(false);
    expect(result.recommendedCommand).toBe('sandbox-exec -n no-network');
    expect(result.message).toContain('no-network');
  });

  it('returns sandbox-exec -n for custom profile name', () => {
    const result = getDarwinEnforcementCommand({ profileName: 'custom-profile' });
    expect(result.applied).toBe(false);
    expect(result.recommendedCommand).toBe('sandbox-exec -n custom-profile');
    expect(result.message).toContain('custom-profile');
  });

  it('returns empty command with no config', () => {
    const result = getDarwinEnforcementCommand({});
    expect(result.applied).toBe(false);
    expect(result.recommendedCommand).toBe('');
    expect(result.message).toContain('No Darwin enforcement');
  });

  it('prefers sandboxProfilePath over profileName', () => {
    const result = getDarwinEnforcementCommand({
      sandboxProfilePath: '/tmp/profile.sb',
      profileName: 'no-network',
    });
    expect(result.recommendedCommand).toBe('sandbox-exec -f /tmp/profile.sb');
  });

  it('isDarwin returns boolean', () => {
    expect(typeof isDarwin()).toBe('boolean');
  });
});
