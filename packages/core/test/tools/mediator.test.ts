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

import { ToolMediator } from '../../src/tools/mediator.js';

describe('ToolMediator', () => {
  const allowlist = [
    { name: 'get_weather', argumentSchema: { location: { type: 'string', required: true } } },
    { name: 'search', argumentSchema: { query: { type: 'string', required: true } } },
  ];

  it('denies tool not on allowlist', () => {
    const mediator = new ToolMediator({ allowlist });
    const result = mediator.mediate({
      toolName: 'run_shell',
      arguments: {},
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('allowlist');
  });

  it('denies tool on denylist', () => {
    const mediator = new ToolMediator({ allowlist, denylist: ['get_weather'] });
    const result = mediator.mediate({
      toolName: 'get_weather',
      arguments: { location: 'NYC' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('denylist');
  });

  it('allows tool on allowlist with valid args', () => {
    const mediator = new ToolMediator({ allowlist });
    const result = mediator.mediate({
      toolName: 'get_weather',
      arguments: { location: 'NYC' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('allow');
  });

  it('denies when required argument missing', () => {
    const mediator = new ToolMediator({ allowlist });
    const result = mediator.mediate({
      toolName: 'get_weather',
      arguments: {},
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
    expect(result.schemaValid).toBe(false);
  });

  it('denies when command denylist matched', () => {
    const mediator = new ToolMediator({
      allowlist,
      commandDenylist: [/bash/i],
    });
    const result = mediator.mediate({
      toolName: 'search',
      arguments: { query: 'run bash -c "rm -rf /"' },
      agentId: 'a1',
      requestId: 'r1',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('denylist');
  });
});
