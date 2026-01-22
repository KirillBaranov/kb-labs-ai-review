/**
 * Command flags definitions for AI Review plugin
 */

import type { FlagDefinitions } from '@kb-labs/sdk';

/**
 * Flags for review:run command
 */
export const runFlags = {
  mode: {
    type: 'string',
    describe: 'Review mode: heuristic (CI), full (local), llm (deep)',
    choices: ['heuristic', 'full', 'llm'],
    default: 'heuristic',
  },
  scope: {
    type: 'string',
    describe: 'File scope: all, changed (vs main), staged',
    choices: ['all', 'changed', 'staged'],
    default: 'changed',
  },
  repos: {
    type: 'array',
    describe: 'Repository scope (submodule names to include, e.g., --repos kb-labs-core kb-labs-cli)',
  },
  task: {
    type: 'string',
    describe: 'Task context - describe what the changes are trying to achieve',
  },
  preset: {
    type: 'string',
    describe: 'Preset ID (e.g., typescript-strict)',
  },
  files: {
    type: 'array',
    describe: 'File patterns to analyze',
  },
  eslintConfig: {
    type: 'string',
    describe: 'ESLint config file path',
  },
  json: {
    type: 'boolean',
    describe: 'Output JSON',
    default: false,
  },
} satisfies FlagDefinitions;
