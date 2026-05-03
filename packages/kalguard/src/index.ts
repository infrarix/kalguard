/**
 * Main entry point: re-export SDK (recommended for agent integration).
 * For core types/policy/agent only: use "kalguard-core" or install kalguard-core.
 */
export { KalGuardClient, withPromptCheck, withToolCheck } from 'kalguard-sdk';
export type { KalGuardClientOptions } from 'kalguard-sdk';
