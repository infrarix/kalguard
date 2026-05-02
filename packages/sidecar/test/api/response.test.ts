import { securityResponse, jsonResponse } from '../../src/api/response.js';
import { PassThrough } from 'node:stream';
import type { ServerResponse } from 'node:http';

describe('securityResponse', () => {
  it('creates an allow response', () => {
    const res = securityResponse(true, 'req-1', { message: 'OK' });
    expect(res.allowed).toBe(true);
    expect(res.decision).toBe('allow');
    expect(res.message).toBe('OK');
    expect(res.requestId).toBe('req-1');
  });

  it('creates a deny response', () => {
    const res = securityResponse(false, 'req-2', { message: 'Denied', errorCode: 'POLICY_DENY' });
    expect(res.allowed).toBe(false);
    expect(res.decision).toBe('deny');
    expect(res.errorCode).toBe('POLICY_DENY');
  });

  it('uses explicit decision over inferred', () => {
    const res = securityResponse(false, 'req-3', { message: 'Needs approval', decision: 'require_approval' });
    expect(res.decision).toBe('require_approval');
  });

  it('includes data when provided', () => {
    const res = securityResponse(true, 'req-4', { message: 'OK', data: { riskScore: 15 } });
    expect(res.data).toEqual({ riskScore: 15 });
  });

  it('omits data when undefined', () => {
    const res = securityResponse(true, 'req-5', { message: 'OK' });
    expect(res).not.toHaveProperty('data');
  });

  it('omits errorCode when undefined', () => {
    const res = securityResponse(true, 'req-6', { message: 'OK' });
    expect(res).not.toHaveProperty('errorCode');
  });
});

describe('jsonResponse', () => {
  it('writes JSON with correct status and content-type', () => {
    let writtenStatus = 0;
    let writtenHeaders: Record<string, string> = {};
    let writtenBody = '';
    const fakeRes = {
      writeHead(status: number, headers: Record<string, string>) {
        writtenStatus = status;
        writtenHeaders = headers;
      },
      end(body: string) {
        writtenBody = body;
      },
    } as unknown as ServerResponse;

    jsonResponse(fakeRes, 200, { allowed: true, message: 'OK' });

    expect(writtenStatus).toBe(200);
    expect(writtenHeaders['Content-Type']).toBe('application/json');
    expect(JSON.parse(writtenBody)).toEqual({ allowed: true, message: 'OK' });
  });

  it('writes error response with 403', () => {
    let writtenStatus = 0;
    let writtenBody = '';
    const fakeRes = {
      writeHead(status: number, _headers: Record<string, string>) {
        writtenStatus = status;
      },
      end(body: string) {
        writtenBody = body;
      },
    } as unknown as ServerResponse;

    jsonResponse(fakeRes, 403, { allowed: false, message: 'Forbidden' });

    expect(writtenStatus).toBe(403);
    expect(JSON.parse(writtenBody)).toEqual({ allowed: false, message: 'Forbidden' });
  });
});
