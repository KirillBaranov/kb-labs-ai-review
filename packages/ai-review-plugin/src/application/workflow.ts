import type { AiReviewCommandOutput } from '@kb-labs/ai-review-contracts';
import { executeReview, type ReviewRuntimeOptions } from './review-service';

type AiReviewWorkflowOptions = ReviewRuntimeOptions;

export interface AiReviewWorkflowResult {
  output: AiReviewCommandOutput;
  producedArtifacts: string[];
}

export async function runAiReviewWorkflow(options: AiReviewWorkflowOptions): Promise<AiReviewWorkflowResult> {
  const output = await executeReview(options);
  const produced = Object.values(output.artifacts)
    .filter((value): value is string => typeof value === 'string');

  return {
    output,
    producedArtifacts: produced
  };
}
