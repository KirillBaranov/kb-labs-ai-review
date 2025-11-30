import { analyzeDiff } from '@kb-labs/ai-review-core';
import type { ReviewFinding, RulesJson, RuleItem } from '@kb-labs/shared-review-types';
import { buildRun } from './run-builder';
import type { ReviewProvider } from './types';

function buildRulesMap(rules?: RulesJson | null): Map<string, RuleItem> | undefined {
  if (!rules?.rules) {
    return undefined;
  }
  return new Map(rules.rules.map(rule => [rule.id, rule] as const));
}

export const localProvider: ReviewProvider = {
  name: 'local',
  async review(input) {
    const rulesJson = input.rules ?? null;
    const rulesById = input.rulesById ?? buildRulesMap(rulesJson);

    const findings: ReviewFinding[] = analyzeDiff({
      diffText: input.diffText,
      rulesById,
      rulesJson,
      boundaries: input.boundaries ?? null
    });

    return buildRun({ ...input, provider: input.provider ?? 'local' }, findings);
  }
};
