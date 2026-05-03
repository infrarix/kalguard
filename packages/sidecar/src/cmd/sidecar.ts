import { readFile } from 'node:fs/promises';
import { loadSidecarConfig, startPolicyWatch } from '../config/index.js';
import { PolicyEngine, parsePolicyDocument, ToolMediator } from 'kalguard-core';
import type { PolicyDocument, ToolAllowlistEntry } from 'kalguard-core';
import { FileAuditLog, MemoryAuditLog } from '../storage/audit.js';
import { createSidecarServer } from '../sidecar/server.js';
import { KalGuardCloudClient, LicenseCache, CloudRateLimiter, UsageBuffer } from '../cloud/index.js';

async function main(): Promise<void> {
  const config = loadSidecarConfig();
  const policyEngine = new PolicyEngine();
  const defaultPolicy: PolicyDocument = {
    version: '1.0',
    rules: [],
    defaultDecision: config.policyDefaultDeny ? 'deny' : 'allow',
    defaultReason: 'no policy loaded; fail closed',
  };
  if (config.policyPath) {
    try {
      const raw = await readFile(config.policyPath, 'utf8');
      const doc = parsePolicyDocument(JSON.parse(raw) as unknown);
      policyEngine.loadPolicy(doc);
    } catch (err) {
      console.error('[kalguard] Failed to load policy from', config.policyPath, err);
      policyEngine.loadPolicy(defaultPolicy);
    }
  } else {
    policyEngine.loadPolicy(defaultPolicy);
  }

  let stopPolicyWatch: (() => void) | undefined;
  if (config.policyWatch && config.policyPath) {
    stopPolicyWatch = startPolicyWatch({
      policyPath: config.policyPath,
      policyEngine,
      debounceMs: config.policyWatchIntervalMs,
    });
  }

  const toolAllowlist: ToolAllowlistEntry[] = [
    { name: 'get_weather', argumentSchema: { location: { type: 'string', required: true } } },
    { name: 'search', argumentSchema: { query: { type: 'string', required: true } } },
    { name: 'read_file', argumentSchema: { path: { type: 'string', required: true } } },
  ];
  const toolMediator = new ToolMediator({
    allowlist: toolAllowlist,
    denylist: [],
    ...(config.toolRateLimitPerAgent != null ? { rateLimitPerAgent: config.toolRateLimitPerAgent } : {}),
  });

  const auditLog = config.auditLogPath ? new FileAuditLog(config.auditLogPath) : new MemoryAuditLog();

  // Cloud connector (Pro features) — only when API key is configured
  let rateLimiter: CloudRateLimiter | undefined;
  let licenseCache: LicenseCache | undefined;
  let usageBuffer: UsageBuffer | undefined;

  if (config.apiKey) {
    const cloudClient = new KalGuardCloudClient(config.apiKey, config.cloudBaseUrl);
    licenseCache = new LicenseCache(config.cloudSyncIntervalMs);

    // Validate license on startup
    const licenseInfo = await cloudClient.validateLicense();
    licenseCache.set(licenseInfo);

    if (licenseInfo.valid) {
      console.log(`[kalguard] cloud connected: ${licenseInfo.tier} plan, org: ${licenseInfo.orgId}`);

      // Rate limiter based on plan limits (-1 = unlimited)
      rateLimiter = new CloudRateLimiter(licenseInfo.limits.checksPerDay, 86_400_000);

      // Usage buffer: batch reports to cloud
      usageBuffer = new UsageBuffer(cloudClient, 100, 30_000);
      usageBuffer.start();

      // Periodic license refresh
      const refreshTimer = setInterval(async () => {
        try {
          const refreshed = await cloudClient.validateLicense();
          licenseCache!.set(refreshed);
          if (refreshed.valid && rateLimiter) {
            rateLimiter.updateLimit(refreshed.limits.checksPerDay);
          }
          if (!refreshed.valid) {
            console.warn('[kalguard] cloud license invalid on refresh — using cached plan');
          }
        } catch (err) {
          console.error('[kalguard] license refresh failed:', err);
        }
      }, config.cloudSyncIntervalMs);

      // Allow process to exit even if timer is active
      if (refreshTimer && typeof refreshTimer === 'object' && 'unref' in refreshTimer) {
        (refreshTimer as NodeJS.Timeout).unref();
      }
    } else {
      console.warn('[kalguard] cloud license invalid — running in degraded mode');
    }
  } else {
    console.log('[kalguard] running in local-only mode (no API key)');
  }

  const server = createSidecarServer({
    config,
    policyEngine,
    toolMediator,
    auditLog,
    rateLimiter,
    licenseCache,
    usageBuffer,
  });

  server.listen(config.port, config.host, () => {
    console.log(`[kalguard] sidecar listening on http://${config.host}:${config.port}`);
    if (stopPolicyWatch) console.log('[kalguard] policy watch enabled for', config.policyPath);
  });
}

main().catch((err) => {
  console.error('[kalguard] fatal:', err);
  process.exit(1);
});
