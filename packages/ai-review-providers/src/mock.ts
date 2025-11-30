import type { ReviewFinding, Severity } from '@kb-labs/shared-review-types';
import { buildRun } from './run-builder';
import type { ReviewProvider } from './types';

export const mockProvider: ReviewProvider = {
  name: 'mock',
  async review(input) {
    const findings: ReviewFinding[] = [];

    if (/TODO/i.test(input.diffText)) {
      findings.push({
        rule: 'style.no-todo-comment',
        area: 'DX',
        severity: 'minor' as Severity,
        file: 'unknown',
        locator: 'L0',
        finding: ['TODO comment found'],
        why: 'Inline TODOs get stale and hide tech debt.',
        suggestion: 'Replace with a link to a tracked ticket (issue/ID) and remove the inline TODO.',
        fingerprint: 'mock-fp-todo'
      });
    }

    if (/\/internal\b/.test(input.diffText)) {
      findings.push({
        rule: 'arch.modular-boundaries',
        area: 'Architecture',
        severity: 'critical' as Severity,
        file: 'unknown',
        locator: 'L0',
        finding: ['Cross-feature internal import'],
        why: 'Features must not import each other directly; this couples internals.',
        suggestion: 'Use shared adapter/port or the feature public API.',
        fingerprint: 'mock-fp-internal'
      });
    }

    return buildRun({ ...input, provider: input.provider ?? 'mock', runId: input.runId ?? `mock_${Date.now()}` }, findings);
  }
};
