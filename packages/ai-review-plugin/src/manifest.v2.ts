import type { ManifestV2 } from '@kb-labs/plugin-manifest';

export const manifest: ManifestV2 = {
  schema: 'kb.plugin/2',
  id: '@kb-labs/ai-review',
  version: '0.0.1',
  display: {
    name: 'AI Review',
    description: 'Run AI-powered code review with shared heuristics and providers.',
    tags: ['ai', 'review', 'code-review']
  },
  cli: {
    commands: [
      {
        id: 'ai-review:run',
        group: 'ai-review',
        describe: 'Run AI Review against a unified diff and emit artifacts.',
        longDescription: 'Executes AI Review providers, builds context, and writes artifacts under .ai-review/.',
        flags: [
          {
            name: 'diff',
            type: 'string',
            alias: 'd',
            description: 'Path to unified diff file.'
          },
          {
            name: 'file',
            type: 'string',
            description: 'Generate diff for a single file relative to HEAD.'
          },
          {
            name: 'branch',
            type: 'string',
            description: 'Generate diff against the specified git ref (default: origin/master).'
          },
          {
            name: 'staged',
            type: 'boolean',
            description: 'Use staged changes (git diff --cached).'
          },
          {
            name: 'profile',
            type: 'string',
            alias: 'p',
            description: 'Profile name (default: frontend).'
          },
          {
            name: 'profiles-dir',
            type: 'string',
            description: 'Override profiles directory.'
          },
          {
            name: 'provider',
            type: 'string',
            description: 'Provider id (local|mock).',
            choices: ['local', 'mock']
          },
          {
            name: 'fail-on',
            type: 'string',
            description: 'Failure policy: none|major|critical.',
            choices: ['none', 'major', 'critical']
          },
          {
            name: 'max-comments',
            type: 'number',
            description: 'Limit the number of findings returned.'
          },
          {
            name: 'render-md',
            type: 'boolean',
            description: 'Render transport Markdown (default: true).',
            default: true
          },
          {
            name: 'render-html',
            type: 'boolean',
            description: 'Render HTML report.'
          },
          {
            name: 'no-render',
            type: 'boolean',
            description: 'Skip all human-readable renderers.'
          },
          {
            name: 'json',
            type: 'boolean',
            description: 'Print JSON output instead of a human summary.'
          },
          {
            name: 'out-json',
            type: 'string',
            description: 'Override review.json output path.'
          },
          {
            name: 'out-md',
            type: 'string',
            description: 'Override review.md output path.'
          },
          {
            name: 'output-root',
            type: 'string',
            description: 'Override artifact root directory (default: .ai-review).'
          },
          {
            name: 'include-adr',
            type: 'boolean',
            description: 'Include ADR docs in context (default: true).'
          },
          {
            name: 'include-boundaries',
            type: 'boolean',
            description: 'Include boundaries.json in context (default: true).'
          },
          {
            name: 'context-max-bytes',
            type: 'number',
            description: 'Hard limit for context size in bytes.'
          },
          {
            name: 'context-max-approx-tokens',
            type: 'number',
            description: 'Soft limit for context size in approximate tokens.'
          },
          {
            name: 'analytics',
            type: 'boolean',
            description: 'Enable local analytics JSONL sink.'
          },
          {
            name: 'analytics-out',
            type: 'string',
            description: 'Override analytics output directory.'
          },
          {
            name: 'debug',
            type: 'boolean',
            description: 'Enable verbose logging.'
          }
        ],
        examples: [
          'kb ai-review run --diff changes.diff',
          'kb ai-review run --file src/app.ts',
          'kb ai-review run --branch origin/master --provider mock'
        ],
        handler: './cli/commands/run/command#runAiReviewCommand'
      }
    ]
  },
  capabilities: [],
  permissions: {
    fs: {
      mode: 'read',
      allow: [],
      deny: ['**/*.key', '**/*.secret']
    },
    net: 'none',
    env: {
      allow: ['NODE_ENV']
    },
    quotas: {
      timeoutMs: 10000,
      memoryMb: 128,
      cpuMs: 5000
    },
    capabilities: []
  },
  artifacts: []
};

export default manifest;
