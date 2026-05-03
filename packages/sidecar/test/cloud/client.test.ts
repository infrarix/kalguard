import { KalGuardCloudClient } from '../../src/cloud/client.js';
import { OFFLINE_LICENSE } from '../../src/cloud/types.js';

// Mock global fetch
const originalFetch = globalThis.fetch;

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>): void {
  globalThis.fetch = impl as typeof globalThis.fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('KalGuardCloudClient', () => {
  const API_KEY = 'kg_live_test1234567890abcdef';
  const BASE_URL = 'https://api.kalguard.dev';

  describe('validateLicense', () => {
    it('returns license info on successful response', async () => {
      const mockLicense = {
        valid: true,
        tier: 'pro',
        orgId: 'org_123',
        limits: { checksPerDay: 100000, maxAgents: -1, auditRetentionDays: 90, features: ['analytics'] },
        expiresAt: '2027-01-01T00:00:00Z',
      };

      mockFetch(async () => new Response(JSON.stringify(mockLicense), { status: 200 }));

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.validateLicense();

      expect(result.valid).toBe(true);
      expect(result.tier).toBe('pro');
      expect(result.orgId).toBe('org_123');
      expect(result.limits.checksPerDay).toBe(100000);
      expect(result.limits.features).toEqual(['analytics']);
    });

    it('returns OFFLINE_LICENSE on 401', async () => {
      mockFetch(async () => new Response('Unauthorized', { status: 401 }));

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.validateLicense();

      expect(result).toEqual(OFFLINE_LICENSE);
    });

    it('returns OFFLINE_LICENSE on network error after retries', async () => {
      let callCount = 0;
      mockFetch(async () => {
        callCount++;
        throw new Error('Network error');
      });

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 100);
      const result = await client.validateLicense();

      expect(result).toEqual(OFFLINE_LICENSE);
      expect(callCount).toBe(3); // MAX_RETRIES
    });

    it('retries on 500 errors', async () => {
      let callCount = 0;
      const mockLicense = {
        valid: true,
        tier: 'free',
        orgId: 'org_1',
        limits: { checksPerDay: 1000, maxAgents: 1, auditRetentionDays: 7, features: [] },
        expiresAt: '2027-01-01T00:00:00Z',
      };

      mockFetch(async () => {
        callCount++;
        if (callCount < 3) return new Response('Error', { status: 500 });
        return new Response(JSON.stringify(mockLicense), { status: 200 });
      });

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.validateLicense();

      expect(result.valid).toBe(true);
      expect(callCount).toBe(3);
    });

    it('does not retry on 400 errors', async () => {
      let callCount = 0;
      mockFetch(async () => {
        callCount++;
        return new Response('Bad request', { status: 400 });
      });

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.validateLicense();

      expect(result).toEqual(OFFLINE_LICENSE);
      expect(callCount).toBe(1); // No retries for client errors
    });

    it('defaults unknown tier to free', async () => {
      mockFetch(
        async () =>
          new Response(
            JSON.stringify({
              valid: true,
              tier: 'unknown_tier',
              orgId: 'org_1',
              limits: { checksPerDay: 1, maxAgents: 1, auditRetentionDays: 1, features: [] },
              expiresAt: '2027-01-01T00:00:00Z',
            }),
            { status: 200 },
          ),
      );

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.validateLicense();

      expect(result.tier).toBe('free');
    });

    it('sends correct headers', async () => {
      let capturedHeaders: Record<string, string> = {};
      mockFetch(async (_url, init) => {
        const headers = init?.headers as Record<string, string>;
        capturedHeaders = headers;
        return new Response(
          JSON.stringify({
            valid: true,
            tier: 'free',
            orgId: 'org_1',
            limits: { checksPerDay: 1000, maxAgents: 1, auditRetentionDays: 7, features: [] },
            expiresAt: '2027-01-01T00:00:00Z',
          }),
          { status: 200 },
        );
      });

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      await client.validateLicense();

      expect(capturedHeaders['x-api-key']).toBe(API_KEY);
      expect(capturedHeaders['Content-Type']).toBe('application/json');
    });
  });

  describe('reportUsage', () => {
    it('returns result on successful report', async () => {
      mockFetch(async () => new Response(JSON.stringify({ accepted: true, remaining: 500 }), { status: 200 }));

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.reportUsage([
        {
          eventType: 'prompt_check',
          agentId: 'agent_1',
          decision: 'allow',
          timestamp: new Date().toISOString(),
          requestId: 'req_1',
        },
      ]);

      expect(result.accepted).toBe(true);
      expect(result.remaining).toBe(500);
    });

    it('returns empty result for empty events', async () => {
      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 1000);
      const result = await client.reportUsage([]);

      expect(result.accepted).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('returns failure on network error', async () => {
      mockFetch(async () => {
        throw new Error('Network error');
      });

      const client = new KalGuardCloudClient(API_KEY, BASE_URL, 100);
      const result = await client.reportUsage([
        {
          eventType: 'tool_check',
          agentId: 'agent_1',
          decision: 'deny',
          timestamp: new Date().toISOString(),
          requestId: 'req_2',
        },
      ]);

      expect(result.accepted).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
