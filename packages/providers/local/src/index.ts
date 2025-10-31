import type { ReviewJson, RulesJson, RuleItem } from '@kb-labs/shared-review-types'
import type { BoundariesConfig } from '@kb-labs/ai-review-core'
import type { ReviewProvider, ProviderReviewInput } from '@kb-labs/ai-review-provider-types'
import { analyzeDiff } from '@kb-labs/ai-review-core'

export const localProvider: ReviewProvider = {
  name: 'local',
  async review(input: ProviderReviewInput): Promise<ReviewJson> {
    // Build rulesById Map from rulesJson if available
    let rulesById: Map<string, RuleItem> | undefined = undefined
    if (input.rules?.rules) {
      rulesById = new Map(input.rules.rules.map((r: RuleItem) => [r.id, r]))
    }

    const findings = analyzeDiff({
      diffText: input.diffText,
      rulesById,
      rulesJson: input.rules ?? null,
      boundaries: (input.boundaries as BoundariesConfig) ?? null,
    })

    return {
      ai_review: {
        version: 1,
        run_id: `run_${Date.now()}`,
        findings,
      }
    }
  }
}

export default localProvider
