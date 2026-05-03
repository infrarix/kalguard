import type { PromptMessage, PromptRole } from '../types.js';
import type { PromptFirewallResult, PromptFirewallOptions, PromptRiskLevel, MessageSegmentKind } from './types.js';

/** Known prompt-injection patterns (indicators; not exhaustive). */
const INJECTION_INDICATORS: ReadonlyArray<{ pattern: RegExp; score: number }> = [
  { pattern: /ignore\s+(previous|above|all)\s+instructions/i, score: 80 },
  { pattern: /you\s+are\s+now\s+/i, score: 70 },
  { pattern: /system\s*:\s*/i, score: 40 },
  { pattern: /\[INST\]|\[\/INST\]/i, score: 50 },
  { pattern: /<\s*script\s*>/i, score: 90 },
  { pattern: /prompt\s+injection/i, score: 60 },
  { pattern: /override\s+your\s+(instructions|rules)/i, score: 85 },
  { pattern: /reveal\s+(your|the)\s+(system\s+)?prompt/i, score: 75 },
  { pattern: /disregard\s+(your|the)\s+/i, score: 70 },
  { pattern: /new\s+instructions\s*:/i, score: 65 },
  { pattern: /human\s*:\s*.*\n\s*assistant\s*:\s*/i, score: 55 },
  { pattern: /(\r?\n){3,}\s*\[/i, score: 30 },
];

const DEFAULT_OPTIONS: Required<PromptFirewallOptions> = {
  blockThreshold: 70,
  sanitizeThreshold: 50,
};

/**
 * Separates system / user / tool messages and scores injection risk.
 * Block or sanitize based on policy thresholds.
 */
export function evaluatePrompt(
  messages: ReadonlyArray<PromptMessage>,
  options: PromptFirewallOptions = {},
): PromptFirewallResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let totalScore = 0;
  let injectionDetected = false;
  const sanitized: PromptMessage[] = [];

  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : '';
    const role = normalizeRole(msg.role);
    let segmentScore = 0;
    for (const { pattern, score } of INJECTION_INDICATORS) {
      if (pattern.test(content)) {
        segmentScore += score;
        injectionDetected = true;
      }
    }
    // Multiple system-like messages from "user" increase risk
    if (role === 'user' && content.length > 500 && /instruction|rule|always|never/i.test(content)) {
      segmentScore += 25;
    }
    totalScore = Math.min(100, totalScore + segmentScore);
    const sanitizedContent = segmentScore >= opts.sanitizeThreshold ? redactSuspicious(content) : content;
    sanitized.push({ ...msg, role, content: sanitizedContent });
  }

  const riskLevel = scoreToLevel(totalScore);
  const allowed = totalScore < opts.blockThreshold;
  return {
    allowed,
    riskScore: totalScore,
    riskLevel,
    injectionDetected,
    ...(allowed && totalScore >= opts.sanitizeThreshold ? { sanitizedMessages: sanitized } : {}),
    ...(!allowed ? { reason: `prompt blocked: risk score ${totalScore} >= ${opts.blockThreshold}` } : {}),
  };
}

function normalizeRole(role: string): PromptRole {
  const r = role.toLowerCase();
  if (r === 'system' || r === 'user' || r === 'assistant' || r === 'tool') return r as PromptRole;
  return 'user';
}

function scoreToLevel(score: number): PromptRiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Redact suspicious substrings to reduce injection impact. */
function redactSuspicious(content: string): string {
  let out = content;
  for (const { pattern } of INJECTION_INDICATORS) {
    out = out.replace(pattern, '[REDACTED]');
  }
  return out;
}

/** Classify message segment for logging (system / user / tool). */
export function classifySegment(msg: PromptMessage): MessageSegmentKind {
  const role = (msg.role ?? 'user').toString().toLowerCase();
  if (role === 'system') return 'system';
  if (role === 'tool') return 'tool';
  return 'user';
}
