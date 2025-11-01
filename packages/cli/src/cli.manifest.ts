/**
 * AI Review CLI manifest
 */

// Local type definition to avoid external dependencies
type CommandManifest = {
  manifestVersion: '1.0';
  id: string;
  aliases?: string[];
  group: string;
  describe: string;
  longDescription?: string;
  requires?: string[];
  flags?: FlagDefinition[];
  examples?: string[];
  loader: () => Promise<{ run: any }>;
};

type FlagDefinition = {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  alias?: string;
  default?: any;
  description?: string;
  choices?: string[];
  required?: boolean;
};

export const commands: CommandManifest[] = [
  {
    manifestVersion: '1.0',
    id: 'ai-review:review',
    aliases: ['ai-review-review'],
    group: 'ai-review',
    describe: 'Run code review against a unified diff',
    longDescription: 'Run review (local/mock/openai/claude), write JSON and Markdown transport. Builds context internally.',
    flags: [
      {
        name: 'diff',
        type: 'string',
        alias: 'd',
        description: 'Unified diff file (required)',
        required: true,
      },
      {
        name: 'profile',
        type: 'string',
        alias: 'p',
        description: 'Profile name (default: frontend)',
      },
      {
        name: 'profiles-dir',
        type: 'string',
        description: 'Override profiles root',
      },
      {
        name: 'provider',
        type: 'string',
        description: 'Provider: local|mock|openai|claude',
        choices: ['local', 'mock', 'openai', 'claude'],
      },
      {
        name: 'fail-on',
        type: 'string',
        description: 'Exit policy: none|major|critical',
        choices: ['none', 'major', 'critical'],
      },
      {
        name: 'max-comments',
        type: 'number',
        description: 'Cap number of findings',
      },
      {
        name: 'out-json',
        type: 'string',
        description: 'Override review.json output path',
      },
      {
        name: 'out-md',
        type: 'string',
        description: 'Override review.md output path',
      },
      {
        name: 'render-md',
        type: 'boolean',
        description: 'Render human-readable Markdown (default: true)',
        default: true,
      },
      {
        name: 'render-html',
        type: 'boolean',
        description: 'Render HTML report',
      },
      {
        name: 'no-render',
        type: 'boolean',
        description: 'Skip rendering (only output JSON and transport MD)',
      },
      {
        name: 'analytics',
        type: 'boolean',
        description: 'Enable analytics (file JSONL sink)',
      },
      {
        name: 'analytics-out',
        type: 'string',
        description: 'Analytics output dir',
      },
      {
        name: 'debug',
        type: 'boolean',
        description: 'Verbose debug logs',
      },
    ],
    examples: [
      'kb ai-review review --diff changes.diff',
      'kb ai-review review --diff changes.diff --provider local',
      'kb ai-review review --diff changes.diff --profile frontend --provider openai',
      'kb ai-review review --diff changes.diff --render-html',
      'kb ai-review review --diff changes.diff --no-render',
    ],
    loader: async () => {
      const mod = await import('./commands/review.js');
      return { run: mod.review.run };
    },
  },
  {
    manifestVersion: '1.0',
    id: 'ai-review:build-context',
    aliases: ['ai-review-build-context'],
    group: 'ai-review',
    describe: 'Build AI review context',
    longDescription: 'Build AI review context (handbook + rules + ADR) into out/context/<profile>.md',
    flags: [
      {
        name: 'profile',
        type: 'string',
        alias: 'p',
        description: 'Profile name',
      },
      {
        name: 'profiles-dir',
        type: 'string',
        description: 'Override profiles root',
      },
      {
        name: 'out',
        type: 'string',
        alias: 'o',
        description: 'Output file (abs or repo-root relative)',
      },
    ],
    examples: [
      'kb ai-review build-context --profile frontend',
      'kb ai-review build-context --profile frontend --out dist/context.md',
    ],
    loader: async () => {
      const mod = await import('./commands/build-context.js');
      return { run: mod.buildContext.run };
    },
  },
];

