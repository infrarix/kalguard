#!/usr/bin/env node
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
 *
 * Minimal agent that integrates KalGuard: check prompt and tool with sidecar before each step.
 * Run: KALGUARD_AGENT_TOKEN=... KALGUARD_SIDECAR_URL=http://localhost:9292 node agent.js
 * Requires sidecar running and policy allowing this agent.
 */

// Run from repo root: pnpm run build && node examples/simple-agent/agent.js
// Or from any project: pnpm add kalguard then import from 'kalguard'
import { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard';

const baseUrl = process.env.KALGUARD_SIDECAR_URL ?? 'http://localhost:9292';
const token = process.env.KALGUARD_AGENT_TOKEN;

if (!token) {
  console.error('Set KALGUARD_AGENT_TOKEN (short-lived agent token).');
  process.exit(1);
}

const kalguard = new KalGuardClient({ baseUrl, token });

// Mock LLM: in a real agent, replace with your LLM client.
async function mockLLM(messages) {
  return { content: 'Mock response. Tool: get_weather(location="NYC").', finishReason: 'tool_calls' };
}

// Mock tool: in a real agent, replace with your tool runner.
async function mockTool(name, args) {
  return { result: `Mock ${name}(${JSON.stringify(args)})` };
}

async function main() {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the weather in NYC?' },
  ];

  try {
    // 1) Check prompt with KalGuard, then call LLM
    const response = await withPromptCheck(kalguard, messages, async (sanitizedMessages) => {
      return await mockLLM(sanitizedMessages);
    });
    console.log('LLM response:', response.content);

    // 2) Check tool with KalGuard, then run tool
    const toolResult = await withToolCheck(kalguard, 'get_weather', { location: 'NYC' }, async () => {
      return await mockTool('get_weather', { location: 'NYC' });
    });
    console.log('Tool result:', toolResult);

    console.log('Done. All checks passed.');
  } catch (err) {
    console.error('KalGuard denied or error:', err.message);
    if (err.code) console.error('Code:', err.code);
    if (err.requestId) console.error('Request ID:', err.requestId);
    process.exit(1);
  }
}

main();
