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

import type { WindowsEnforcementConfig } from './types.js';

/**
 * Windows enforcement via job objects and integrity levels.
 * Returns documented enforcement steps and required Windows API calls for callers
 * using external tooling (container runtime or process manager) to apply hardening.
 */

/** Result of Windows enforcement (documented; no Win32 API calls from base package). */
export interface WindowsEnforcementResult {
  readonly applied: boolean;
  readonly documentation: string;
  readonly recommendedSteps: readonly string[];
}

/**
 * Return documented steps for Windows hardening based on config.
 * Does not create job objects or set integrity levels; caller must use external tooling.
 */
export function getWindowsEnforcementDocs(config: WindowsEnforcementConfig): WindowsEnforcementResult {
  const steps: string[] = [];
  if (config.integrityLevel) {
    steps.push(`Set process integrity level to ${config.integrityLevel} (e.g. via CreateProcess with token).`);
  }
  if (config.limitToSingleProcess === true) {
    steps.push('Create a job object with JOB_OBJECT_LIMIT_ACTIVE_PROCESS = 1 and assign the sidecar process.');
  }
  if (steps.length === 0) {
    return {
      applied: false,
      documentation: 'No Windows enforcement config. Use job objects or integrity levels for optional hardening.',
      recommendedSteps: [],
    };
  }
  return {
    applied: false,
    documentation: 'Apply these steps via Windows API or container runtime when starting the sidecar.',
    recommendedSteps: steps,
  };
}

/**
 * Check if current platform is Windows.
 */
export function isWindows(): boolean {
  return process.platform === 'win32';
}
