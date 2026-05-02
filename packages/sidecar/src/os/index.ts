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

export * from './types.js';
export {
  generateSeccompProfile,
  validateAppArmorConfig,
  dockerSeccompFlags,
  dockerAppArmorFlags,
  DEFAULT_SECCOMP_ALLOWED_SYSCALLS,
} from './linux.js';
export type { SeccompProfile } from './linux.js';
export { getDarwinEnforcementCommand, isDarwin } from './darwin.js';
export type { DarwinEnforcementResult } from './darwin.js';
export { getWindowsEnforcementDocs, isWindows } from './windows.js';
export type { WindowsEnforcementResult } from './windows.js';
