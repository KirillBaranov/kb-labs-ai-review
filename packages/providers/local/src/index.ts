import type { ReviewJson, BoundariesConfig } from '@kb-labs/ai-review-core'
import type { ReviewProvider, ProviderReviewInput } from '@kb-labs/ai-review-provider-types'
import { analyzeDiff } from '@kb-labs/ai-review-core'

export const localProvider: ReviewProvider = {
  name: 'local',
  async review(input: ProviderReviewInput): Promise<ReviewJson> {
    const findings = analyzeDiff({
      diffText: input.diffText,
      rulesById: undefined,
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
