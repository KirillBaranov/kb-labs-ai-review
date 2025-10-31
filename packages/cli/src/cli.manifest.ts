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
    longDescription: 'Run review (local/mock/openai/claude), write JSON and Markdown transport',
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
    ],
    loader: async () => {
      const mod = await import('./cli/review.js');
      return { run: mod.run };
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
      const mod = await import('./cli/build-context.js');
      return { run: mod.run };
    },
  },
  {
    manifestVersion: '1.0',
    id: 'ai-review:render-md',
    aliases: ['ai-review-render-md'],
    group: 'ai-review',
    describe: 'Render review.json to Markdown',
    longDescription: 'Render review.json → human-friendly Markdown',
    flags: [
      {
        name: 'profile',
        type: 'string',
        alias: 'p',
        description: 'Profile name (default from rc/env)',
      },
      {
        name: 'in',
        type: 'string',
        description: 'Input review.json (abs or repo-root relative)',
      },
      {
        name: 'out',
        type: 'string',
        description: 'Output review.md (abs or repo-root relative)',
      },
      {
        name: 'template',
        type: 'string',
        description: 'Custom template file',
      },
      {
        name: 'severity-map',
        type: 'string',
        description: 'JSON with full SeverityMap {title, icon?, order?}',
      },
    ],
    examples: [
      'kb ai-review render-md',
      'kb ai-review render-md --in review.json --out review.md',
    ],
    loader: async () => {
      const mod = await import('./cli/render-md.js');
      return { run: mod.run };
    },
  },
  {
    manifestVersion: '1.0',
    id: 'ai-review:render-html',
    aliases: ['ai-review-render-html'],
    group: 'ai-review',
    describe: 'Render review.json to HTML',
    longDescription: 'Render review.json → HTML report',
    flags: [
      {
        name: 'in',
        type: 'string',
        description: 'Input review.json (defaults to .ai-review/reviews/<profile>/review.json)',
      },
      {
        name: 'out',
        type: 'string',
        description: 'Output review.html',
      },
    ],
    examples: [
      'kb ai-review render-html',
      'kb ai-review render-html --in review.json --out review.html',
    ],
    loader: async () => {
      const mod = await import('./cli/render-html.js');
      return { run: mod.run };
    },
  },
  {
    manifestVersion: '1.0',
    id: 'ai-review:init-profile',
    aliases: ['ai-review-init-profile'],
    group: 'ai-review',
    describe: 'Scaffold a new review profile',
    longDescription: 'Scaffold a new review profile (handbook + rules + boundaries [+ ADR])',
    flags: [
      {
        name: 'name',
        type: 'string',
        description: 'Profile name (e.g. frontend)',
        required: true,
      },
      {
        name: 'out-dir',
        type: 'string',
        description: 'Profiles root (default: packages/profiles)',
      },
      {
        name: 'force',
        type: 'boolean',
        description: 'Overwrite existing files',
      },
      {
        name: 'with-adr',
        type: 'boolean',
        description: 'Create docs/adr starter file',
      },
    ],
    examples: [
      'kb ai-review init-profile --name frontend',
      'kb ai-review init-profile --name backend --with-adr',
    ],
    loader: async () => {
      const mod = await import('./cli/init-profile.js');
      return { run: mod.run };
    },
  },
];

