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

import { PolicyEngine } from '../../src/policy/engine.js';
import type { PolicyContext, PolicyDocument } from '../../src/policy/types.js';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  it('denies when no policy loaded (fail closed)', async () => {
    const ctx: PolicyContext = { agentId: 'a1', action: 'tool:execute', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('no policy loaded');
  });

  it('first matching rule wins', async () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [
        { id: 'r1', match: { agentIds: ['a1'] }, decision: 'allow', reason: 'allowed' },
        { id: 'r2', match: { agentIds: ['a1'] }, decision: 'deny', reason: 'denied' },
      ],
      defaultDecision: 'deny',
      defaultReason: 'default',
    };
    engine.loadPolicy(doc);
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('allowed');
  });

  it('falls to default when no rule matches', async () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [{ id: 'r1', match: { agentIds: ['other'] }, decision: 'allow', reason: 'ok' }],
      defaultDecision: 'deny',
      defaultReason: 'default deny',
    };
    engine.loadPolicy(doc);
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('default deny');
  });

  it('falls to default deny when no rule matches (fail closed)', async () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [{ id: 'r1', match: { agentIds: ['other'] }, decision: 'allow', reason: 'ok' }],
      defaultDecision: 'deny',
      defaultReason: 'no matching rule',
    };
    engine.loadPolicy(doc);
    const ctx: PolicyContext = { agentId: 'a1', action: 'x', attributes: {}, timestamp: Date.now() };
    const result = await engine.evaluate(ctx);
    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('no matching rule');
  });

  it('rejects default allow with zero rules', () => {
    const doc: PolicyDocument = {
      version: '1.0',
      rules: [],
      defaultDecision: 'allow',
      defaultReason: 'default',
    };
    expect(() => engine.loadPolicy(doc)).toThrow('must not have default allow with zero rules');
  });
});
