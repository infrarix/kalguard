/**
 * Copyright 2025 KalGuard Contributors
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

import type { SecurityResponse } from '@kalguard/core';

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
