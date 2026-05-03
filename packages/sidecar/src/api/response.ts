import type { SecurityResponse } from 'kalguard-core';

/** Never expose raw errors to agents; always return structured security responses. */
export function securityResponse<T>(
  allowed: boolean,
  requestId: string,
  options: {
    decision?: 'allow' | 'deny' | 'require_approval';
    data?: T;
    errorCode?: string;
    message: string;
  },
): SecurityResponse<T> {
  const decision = options.decision ?? (allowed ? 'allow' : 'deny');
  return {
    allowed,
    decision,
    message: options.message,
    requestId,
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.errorCode !== undefined ? { errorCode: options.errorCode } : {}),
  };
}

export function jsonResponse(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
