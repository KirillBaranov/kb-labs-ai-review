import { makeFingerprint } from '@kb-labs/ai-review-core';
import type { AiReviewFinding, AiReviewRun } from '@kb-labs/ai-review-contracts';
import type { ReviewFinding } from '@kb-labs/shared-review-types';

function ensureFindingLines(finding: AiReviewFinding): [string, ...string[]] {
  const lines = [...finding.finding].filter(Boolean);
  if (lines.length === 0) {
    lines.push('Finding summary unavailable');
  }
  return [lines[0]!, ...lines.slice(1)];
}

export function toReviewFinding(finding: AiReviewFinding): ReviewFinding {
  const normalized = ensureFindingLines(finding);
  const file = finding.file ?? '';
  const locator = finding.locator ?? '';
  const fingerprint =
    finding.fingerprint ?? makeFingerprint(finding.rule, file, locator, normalized[0]);

  return {
    rule: finding.rule,
    area: finding.area ?? 'General',
    severity: finding.severity,
    file,
    locator,
    finding: normalized,
    why: finding.why ?? '',
    suggestion: finding.suggestion ?? '',
    fingerprint
  };
}

export function toReviewFindings(findings: AiReviewRun['findings']): ReviewFinding[] {
  return findings.map(toReviewFinding);
}
