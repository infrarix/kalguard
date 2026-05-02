import { loadSidecarConfig } from '../../src/config/schema.js';

describe('loadSidecarConfig', () => {
  it('loads default config when env is empty', () => {
    const config = loadSidecarConfig({});
    expect(config.port).toBe(9292);
    expect(config.host).toBe('0.0.0.0');
    expect(config.tokenSecret).toBeUndefined();
    expect(config.policyPath).toBeUndefined();
    expect(config.policyDefaultDeny).toBe(true);
    expect(config.policyWatch).toBe(false);
    expect(config.policyWatchIntervalMs).toBe(500);
    expect(config.promptBlockThreshold).toBe(70);
    expect(config.promptSanitizeThreshold).toBe(50);
    expect(config.toolRateLimitPerAgent).toBeUndefined();
    expect(config.auditLogPath).toBeUndefined();
  });

  it('reads port from env', () => {
    const config = loadSidecarConfig({ KALGUARD_PORT: '8080' });
    expect(config.port).toBe(8080);
  });

  it('reads host from env', () => {
    const config = loadSidecarConfig({ KALGUARD_HOST: '127.0.0.1' });
    expect(config.host).toBe('127.0.0.1');
  });

  it('reads token secret from env', () => {
    const config = loadSidecarConfig({ KALGUARD_TOKEN_SECRET: 'my-secret' });
    expect(config.tokenSecret).toBe('my-secret');
  });

  it('reads policy path from env', () => {
    const config = loadSidecarConfig({ KALGUARD_POLICY_PATH: '/etc/policy.json' });
    expect(config.policyPath).toBe('/etc/policy.json');
  });

  it('reads policyDefaultDeny=false', () => {
    const config = loadSidecarConfig({ KALGUARD_POLICY_DEFAULT_DENY: 'false' });
    expect(config.policyDefaultDeny).toBe(false);
  });

  it('enables policy watch', () => {
    const config = loadSidecarConfig({ KALGUARD_POLICY_WATCH: 'true' });
    expect(config.policyWatch).toBe(true);
  });

  it('reads custom thresholds', () => {
    const config = loadSidecarConfig({
      KALGUARD_PROMPT_BLOCK_THRESHOLD: '80',
      KALGUARD_PROMPT_SANITIZE_THRESHOLD: '40',
    });
    expect(config.promptBlockThreshold).toBe(80);
    expect(config.promptSanitizeThreshold).toBe(40);
  });

  it('reads rate limit', () => {
    const config = loadSidecarConfig({ KALGUARD_TOOL_RATE_LIMIT: '100' });
    expect(config.toolRateLimitPerAgent).toBe(100);
  });

  it('reads audit log path', () => {
    const config = loadSidecarConfig({ KALGUARD_AUDIT_LOG_PATH: '/var/log/kalguard.jsonl' });
    expect(config.auditLogPath).toBe('/var/log/kalguard.jsonl');
  });

  it('throws for invalid port (too high)', () => {
    expect(() => loadSidecarConfig({ KALGUARD_PORT: '99999' })).toThrow();
  });

  it('throws for invalid port (zero)', () => {
    expect(() => loadSidecarConfig({ KALGUARD_PORT: '0' })).toThrow();
  });
});
