import { getWindowsEnforcementDocs, isWindows } from '../../src/os/windows.js';

describe('Windows OS enforcement', () => {
  it('returns steps for integrity level config', () => {
    const result = getWindowsEnforcementDocs({ integrityLevel: 'low' });
    expect(result.applied).toBe(false);
    expect(result.recommendedSteps).toHaveLength(1);
    expect(result.recommendedSteps[0]).toContain('low');
  });

  it('returns steps for limitToSingleProcess', () => {
    const result = getWindowsEnforcementDocs({ limitToSingleProcess: true });
    expect(result.applied).toBe(false);
    expect(result.recommendedSteps).toHaveLength(1);
    expect(result.recommendedSteps[0]).toContain('job object');
  });

  it('returns both steps when both configured', () => {
    const result = getWindowsEnforcementDocs({
      integrityLevel: 'medium',
      limitToSingleProcess: true,
    });
    expect(result.recommendedSteps).toHaveLength(2);
  });

  it('returns empty steps when no config', () => {
    const result = getWindowsEnforcementDocs({});
    expect(result.applied).toBe(false);
    expect(result.recommendedSteps).toHaveLength(0);
    expect(result.documentation).toContain('No Windows enforcement');
  });

  it('isWindows returns boolean', () => {
    expect(typeof isWindows()).toBe('boolean');
  });
});
