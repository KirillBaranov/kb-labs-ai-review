import type { AiReviewRun } from '@kb-labs/ai-review-contracts';
import type { BoundariesConfig } from '@kb-labs/ai-review-core';
import type { RuleItem, RulesJson } from '@kb-labs/shared-review-types';

export interface ProviderReviewInput {
  diffText: string;
  profile: string;
  provider?: string;
  rules?: RulesJson | null;
  rulesById?: Map<string, RuleItem>;
  boundaries?: BoundariesConfig | null;
  contextPath?: string;
  options?: Record<string, unknown>;
  runId?: string;
}

export interface ReviewProvider {
  name: string;
  review(input: ProviderReviewInput): Promise<AiReviewRun>;
}
