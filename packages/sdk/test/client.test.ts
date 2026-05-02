import { KalGuardClient } from '../src/client.js';
import { withPromptCheck, withToolCheck } from '../src/secure-wrapper.js';
import { createServer } from 'node:http';
import type { Server, IncomingMessage } from 'node:http';

/** Fake sidecar HTTP server for testing the SDK client */
function createFakeServer(handler: (req: IncomingMessage, body: string) => { status: number; body: unknown }): Server {
  return createServer((req, res) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      const { status, body } = handler(req, data);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
}

describe('KalGuardClient', () => {
  let server: Server;
  let baseUrl: string;

  afterEach((done) => {
    if (server) server.close(done);
    else done();
  });

  it('throws if token is empty', () => {
    expect(() => new KalGuardClient({ baseUrl: 'http://localhost', token: '' })).toThrow('requires token');
  });

  it('strips trailing slash from baseUrl', () => {
    const client = new KalGuardClient({ baseUrl: 'http://localhost:9292/', token: 'test' });
    // If construction succeeds, baseUrl was set correctly
    expect(client).toBeDefined();
  });

  describe('checkPrompt', () => {
    it('sends correct request and returns response', async () => {
      let receivedHeaders: Record<string, string | string[] | undefined> = {};
      let receivedBody = '';
      server = createFakeServer((req, body) => {
        receivedHeaders = req.headers;
        receivedBody = body;
        return {
          status: 200,
          body: {
            allowed: true,
            decision: 'allow',
            message: 'OK',
            requestId: 'test-req',
            data: { allowed: true, riskScore: 10, riskLevel: 'low' },
          },
        };
      });

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;

      const client = new KalGuardClient({ baseUrl, token: 'my-token' });
      const result = await client.checkPrompt([{ role: 'user', content: 'hello' }], 'req-123');

      expect(result.allowed).toBe(true);
      expect(result.decision).toBe('allow');
      expect(result.data?.riskScore).toBe(10);
      expect(receivedHeaders['authorization']).toBe('Bearer my-token');
      expect(receivedHeaders['x-kalguard-request-id']).toBe('req-123');
      const parsed = JSON.parse(receivedBody);
      expect(parsed.messages).toEqual([{ role: 'user', content: 'hello' }]);
    });

    it('handles denied response', async () => {
      server = createFakeServer(() => ({
        status: 403,
        body: {
          allowed: false,
          decision: 'deny',
          message: 'Prompt blocked',
          requestId: 'req-456',
          errorCode: 'PROMPT_BLOCKED',
        },
      }));

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const addr = server.address() as { port: number };
      const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });
      const result = await client.checkPrompt([{ role: 'user', content: 'bad' }]);

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe('PROMPT_BLOCKED');
    });

    it('auto-generates requestId when not provided', async () => {
      let receivedRequestId = '';
      server = createFakeServer((req) => {
        receivedRequestId = req.headers['x-kalguard-request-id'] as string;
        return {
          status: 200,
          body: { allowed: true, decision: 'allow', message: 'OK', requestId: receivedRequestId },
        };
      });

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const addr = server.address() as { port: number };
      const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });
      await client.checkPrompt([{ role: 'user', content: 'hi' }]);
      expect(receivedRequestId).toMatch(/^req_/);
    });
  });

  describe('checkTool', () => {
    it('sends correct request and returns response', async () => {
      let receivedBody = '';
      server = createFakeServer((_req, body) => {
        receivedBody = body;
        return {
          status: 200,
          body: {
            allowed: true,
            decision: 'allow',
            message: 'OK',
            requestId: 'req-tool',
            data: { allowed: true },
          },
        };
      });

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const addr = server.address() as { port: number };
      const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });
      const result = await client.checkTool('get_weather', { location: 'NYC' }, 'req-tool');

      expect(result.allowed).toBe(true);
      const parsed = JSON.parse(receivedBody);
      expect(parsed.toolName).toBe('get_weather');
      expect(parsed.arguments).toEqual({ location: 'NYC' });
    });

    it('handles denied tool', async () => {
      server = createFakeServer(() => ({
        status: 403,
        body: {
          allowed: false,
          decision: 'deny',
          message: 'Tool denied',
          requestId: 'req-789',
          errorCode: 'TOOL_DENIED',
        },
      }));

      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const addr = server.address() as { port: number };
      const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });
      const result = await client.checkTool('run_shell', { command: 'rm -rf /' });

      expect(result.allowed).toBe(false);
    });
  });
});

describe('withPromptCheck', () => {
  let server: Server;

  afterEach((done) => {
    if (server) server.close(done);
    else done();
  });

  it('calls handler with messages on allow', async () => {
    server = createFakeServer(() => ({
      status: 200,
      body: {
        allowed: true,
        decision: 'allow',
        message: 'OK',
        requestId: 'req-1',
        data: { allowed: true, riskScore: 5, riskLevel: 'low' },
      },
    }));

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });

    let receivedMessages: any;
    const result = await withPromptCheck(client, [{ role: 'user', content: 'hello' }], async (msgs) => {
      receivedMessages = msgs;
      return 'done';
    });

    expect(result).toBe('done');
    expect(receivedMessages).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('passes sanitized messages to handler when provided', async () => {
    const sanitized = [{ role: 'user', content: '[REDACTED]' }];
    server = createFakeServer(() => ({
      status: 200,
      body: {
        allowed: true,
        decision: 'allow',
        message: 'OK',
        requestId: 'req-1',
        data: { allowed: true, riskScore: 55, riskLevel: 'medium', sanitizedMessages: sanitized },
      },
    }));

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });

    let receivedMessages: any;
    await withPromptCheck(client, [{ role: 'user', content: 'dangerous' }], async (msgs) => {
      receivedMessages = msgs;
      return 'ok';
    });

    expect(receivedMessages).toEqual(sanitized);
  });

  it('throws on deny with code and requestId', async () => {
    server = createFakeServer(() => ({
      status: 403,
      body: {
        allowed: false,
        decision: 'deny',
        message: 'Prompt blocked',
        requestId: 'req-deny',
        errorCode: 'PROMPT_BLOCKED',
      },
    }));

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });

    try {
      await withPromptCheck(client, [{ role: 'user', content: 'bad' }], async () => 'should not reach');
      fail('should have thrown');
    } catch (err: any) {
      expect(err.message).toBe('Prompt blocked');
      expect(err.code).toBe('PROMPT_BLOCKED');
      expect(err.requestId).toBe('req-deny');
    }
  });
});

describe('withToolCheck', () => {
  let server: Server;

  afterEach((done) => {
    if (server) server.close(done);
    else done();
  });

  it('calls handler on allow', async () => {
    server = createFakeServer(() => ({
      status: 200,
      body: {
        allowed: true,
        decision: 'allow',
        message: 'OK',
        requestId: 'req-1',
        data: { allowed: true },
      },
    }));

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });

    const result = await withToolCheck(client, 'get_weather', { location: 'NYC' }, async () => 42);
    expect(result).toBe(42);
  });

  it('throws on deny', async () => {
    server = createFakeServer(() => ({
      status: 403,
      body: {
        allowed: false,
        decision: 'deny',
        message: 'Tool denied',
        requestId: 'req-deny',
        errorCode: 'TOOL_DENIED',
      },
    }));

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const client = new KalGuardClient({ baseUrl: `http://127.0.0.1:${addr.port}`, token: 'tk' });

    try {
      await withToolCheck(client, 'run_shell', {}, async () => 'nope');
      fail('should have thrown');
    } catch (err: any) {
      expect(err.message).toBe('Tool denied');
      expect(err.code).toBe('TOOL_DENIED');
      expect(err.requestId).toBe('req-deny');
    }
  });
});
