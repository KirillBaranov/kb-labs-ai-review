import { describe, expect, it } from 'vitest';
import {
  AiReviewCommandInputSchema,
  AiReviewCommandOutputSchema,
  AiReviewRunSchema,
  parseAiReviewRun
} from '../src/schema';

const baseRun = {
  version: 1,
  runId: 'run_123',
  provider: 'local',
  profile: 'frontend',
  findings: [
    {
      rule: 'style.no-todo',
      severity: 'minor',
      finding: ['Avoid TODO comments']
    }
  ]
};

describe('AiReview schemas', () => {
  it('parses a minimal run', () => {
    expect(() => parseAiReviewRun(baseRun)).not.toThrow();
  });

  it('rejects invalid severity', () => {
    const invalid = {
      ...baseRun,
      findings: [
        {
          rule: 'style.no-todo',
          severity: 'blocker',
          finding: ['invalid']
        }
      ]
    };

    expect(() => AiReviewRunSchema.parse(invalid)).toThrow();
  });

  it('validates command input', () => {
    const input = {
      diff: 'changes.diff',
      profile: 'frontend',
      failOn: 'major'
    };

    expect(() => AiReviewCommandInputSchema.parse(input)).not.toThrow();
  });

  it('validates command output', () => {
    const output = {
      run: baseRun,
      exitCode: 0,
      artifacts: {
        reviewJson: '.ai-review/reviews/frontend/review.json',
        reviewMd: '.ai-review/reviews/frontend/review.md'
      }
    };

    expect(() => AiReviewCommandOutputSchema.parse(output)).not.toThrow();
  });
});
