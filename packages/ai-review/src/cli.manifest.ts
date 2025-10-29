/**
 * AI Review CLI manifest
 */

import type { CommandManifest } from '@kb-labs/cli-commands/registry/types.js';

export const commands: CommandManifest[] = [
  {
    manifestVersion: '1.0',
    id: 'ai-review:analyze',
    aliases: ['ai-review-analyze'],
    group: 'ai-review',
    describe: 'Analyze code with AI',
    longDescription: 'Run AI analysis on code changes and provide feedback',
    flags: [
      {
        name: 'cwd',
        type: 'string',
        description: 'Working directory',
        default: process.cwd(),
      },
      {
        name: 'diff',
        type: 'string',
        description: 'Git diff to analyze',
      },
      {
        name: 'model',
        type: 'string',
        description: 'AI model to use',
        choices: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
        default: 'gpt-4',
      },
    ],
    examples: [
      'kb ai-review analyze',
      'kb ai-review analyze --diff HEAD~1',
      'kb ai-review analyze --model claude-3',
    ],
    loader: async () => import('./cli/analyze.js'),
  },
  {
    manifestVersion: '1.0',
    id: 'ai-review:review',
    aliases: ['ai-review-review'],
    group: 'ai-review',
    describe: 'Review pull request',
    longDescription: 'Review a pull request using AI analysis',
    flags: [
      {
        name: 'pr',
        type: 'string',
        description: 'Pull request number or URL',
        required: true,
      },
      {
        name: 'model',
        type: 'string',
        description: 'AI model to use',
        choices: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
        default: 'gpt-4',
      },
    ],
    examples: [
      'kb ai-review review --pr 123',
      'kb ai-review review --pr https://github.com/owner/repo/pull/123',
    ],
    loader: async () => import('./cli/review.js'),
  },
];
