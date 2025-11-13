import { scoreFindings } from '@kb-labs/ai-review-core';
import type { ReviewFinding, Severity } from '@kb-labs/shared-review-types';
import type {
  AiReviewFinding,
  AiReviewRun,
  AiReviewFindingsBySeverity
} from '@kb-labs/ai-review-contracts';
import type { ProviderReviewInput } from './types.js';

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  major: 2,
  minor: 1,
  info: 0
};

function countBySeverity(findings: ReviewFinding[]): AiReviewFindingsBySeverity {
  const counts: AiReviewFindingsBySeverity = { critical: 0, major: 0, minor: 0, info: 0 };
  for (const finding of findings) {
    const severity = finding.severity as Severity;
    counts[severity] = (counts[severity] ?? 0) + 1;
  }
  return counts;
}

function maxSeverity(findings: ReviewFinding[]): Severity | null {
  let current: Severity | null = null;
  for (const finding of findings) {
    const severity = finding.severity as Severity;
    if (current == null || SEVERITY_RANK[severity] > SEVERITY_RANK[current]) {
      current = severity;
    }
  }
  return current;
}

export function computeSummary(findings: ReviewFinding[]) {
  const counts = countBySeverity(findings);
  return {
    findingsTotal: findings.length,
    findingsBySeverity: counts,
    topSeverity: maxSeverity(findings),
    risk: scoreFindings({ counts })
  };
}

function toAiReviewFinding(finding: ReviewFinding): AiReviewFinding {
  const raw = Array.isArray(finding.finding) ? finding.finding.filter(Boolean) : [];
  const normalized = (raw.length > 0 ? raw : ['Finding summary unavailable']) as [string, ...string[]];
  return {
    rule: finding.rule,
    severity: finding.severity,
    area: finding.area,
    file: finding.file,
    locator: finding.locator,
    finding: normalized,
    why: finding.why,
    suggestion: finding.suggestion,
    fingerprint: finding.fingerprint
  };
}

export function buildRun(input: ProviderReviewInput, findings: ReviewFinding[]): AiReviewRun {
  const runId = input.runId ?? `run_${Date.now()}`;
  const normalizedFindings = findings.map(toAiReviewFinding);
  const summary = computeSummary(findings);

  return {
    version: 1,
    runId,
    provider: input.provider ?? 'local',
    profile: input.profile,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    findings: normalizedFindings,
    summary,
    metadata: input.options ? { options: input.options } : undefined
  };
}
