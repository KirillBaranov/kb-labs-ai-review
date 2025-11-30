import path from 'node:path';
import { Writable } from 'node:stream';
import { defineCommand, type CommandResult } from '@kb-labs/shared-command-kit';
import type { CliHandlerContext } from '@kb-labs/core-sandbox';
import type { AiReviewCommandOutput } from '@kb-labs/ai-review-contracts';
import { executeReview, type FailMode } from '../../../application/review-service';

export interface RunCommandArgs {
  diff: string;
  profile?: string;
  provider?: string;
  failOn?: FailMode;
  maxComments?: number;
  profilesDir?: string;
  renderHumanMarkdown?: boolean;
  renderHtml?: boolean;
  includeAdr?: boolean;
  includeBoundaries?: boolean;
  contextMaxBytes?: number;
  contextMaxApproxTokens?: number;
  outputRoot?: string;
  json?: boolean;
}

export interface RunCommandContext {
  repoRoot?: string;
  stdout?: NodeJS.WritableStream;
}

function getRepoRoot(context: RunCommandContext): string {
  return context.repoRoot ?? process.cwd();
}

function formatSummary(output: AiReviewCommandOutput): string {
  const summary = output.run.summary;
  if (!summary) {
    return 'No summary available.';
  }
  const counts = summary.findingsBySeverity;
  const top = summary.topSeverity ?? 'none';
  return `Findings: ${summary.findingsTotal} (critical ${counts.critical}, major ${counts.major}, minor ${counts.minor}, info ${counts.info}) — top ${top}`;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === 'true') {
      return true;
    }
    if (lowered === 'false') {
      return false;
    }
  }
  return undefined;
}

function normalizeInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function normalizeFailOn(value: unknown): FailMode | undefined {
  const str = normalizeString(value);
  if (!str) {
    return undefined;
  }
  if (str === 'none' || str === 'major' || str === 'critical') {
    return str;
  }
  return undefined;
}

function presenterWritable(ctx: CliHandlerContext): NodeJS.WritableStream {
  const presenter = ctx.presenter;
  return new Writable({
    write(chunk, _encoding, callback) {
      const text = typeof chunk === 'string' ? chunk : chunk?.toString?.() ?? '';
      if (presenter.write) {
        presenter.write(text);
      } else if (presenter.info) {
        presenter.info(text);
      } else {
        process.stdout.write(text);
      }
      callback();
    }
  }) as unknown as NodeJS.WritableStream;
}

function getFlag(flags: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(flags, key)) {
      return flags[key];
    }
  }
  return undefined;
}

function mapFlagsToArgs(flags: Record<string, unknown>): RunCommandArgs {
  const diff = normalizeString(getFlag(flags, 'diff', 'd'));
  const profile = normalizeString(getFlag(flags, 'profile', 'p'));
  const provider = normalizeString(getFlag(flags, 'provider'));
  const failOn = normalizeFailOn(getFlag(flags, 'fail-on', 'failOn'));
  const maxComments = normalizeInteger(getFlag(flags, 'max-comments', 'maxComments'));
  const profilesDir = normalizeString(getFlag(flags, 'profiles-dir', 'profilesDir'));
  const includeAdr = normalizeBoolean(getFlag(flags, 'include-adr', 'includeAdr'));
  const includeBoundaries = normalizeBoolean(getFlag(flags, 'include-boundaries', 'includeBoundaries'));
  const contextMaxBytes = normalizeInteger(getFlag(flags, 'context-max-bytes', 'contextMaxBytes'));
  const contextMaxApproxTokens = normalizeInteger(
    getFlag(flags, 'context-max-approx-tokens', 'contextMaxApproxTokens')
  );
  const outputRoot = normalizeString(getFlag(flags, 'output-root', 'outputRoot'));
  const json = normalizeBoolean(getFlag(flags, 'json')) ?? false;

  const renderHtml = normalizeBoolean(getFlag(flags, 'render-html', 'renderHtml'));
  const renderMd = normalizeBoolean(getFlag(flags, 'render-md', 'renderMd'));
  const noRender = normalizeBoolean(getFlag(flags, 'no-render', 'noRender'));

  let renderHumanMarkdown: boolean | undefined;
  let finalRenderHtml: boolean | undefined;

  if (noRender === true) {
    renderHumanMarkdown = false;
    finalRenderHtml = false;
  } else {
    if (renderMd !== undefined) {
      renderHumanMarkdown = renderMd;
    }
    if (renderHtml !== undefined) {
      finalRenderHtml = renderHtml;
    }
  }

  return {
    diff: diff ?? '',
    profile,
    provider,
    failOn,
    maxComments,
    profilesDir,
    renderHumanMarkdown,
    renderHtml: finalRenderHtml,
    includeAdr,
    includeBoundaries,
    contextMaxBytes,
    contextMaxApproxTokens,
    outputRoot,
    json
  };
}

export async function executeRunCommand(
  args: RunCommandArgs,
  context: RunCommandContext = {}
): Promise<AiReviewCommandOutput> {
  if (!args?.diff) {
    throw new Error('Missing required --diff <path> argument');
  }

  const repoRoot = getRepoRoot(context);
  const output = await executeReview({
    diffPath: args.diff,
    repoRoot,
    profile: args.profile ?? 'frontend',
    provider: args.provider ?? 'local',
    failOn: args.failOn,
    maxComments: args.maxComments,
    profilesDir: args.profilesDir,
    render: {
      humanMarkdown: args.renderHumanMarkdown !== false,
      html: args.renderHtml === true
    },
    context: {
      includeAdr: args.includeAdr,
      includeBoundaries: args.includeBoundaries,
      maxBytes: args.contextMaxBytes,
      maxApproxTokens: args.contextMaxApproxTokens
    },
    output: {
      root: args.outputRoot
    }
  });

  const stdout = context.stdout ?? process.stdout;
  if (args.json) {
    stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    const summary = output.run.summary;
    const counts = summary?.findingsBySeverity ?? { critical: 0, major: 0, minor: 0, info: 0 };
    const top = summary?.topSeverity ?? 'none';

    // Note: Can't use ctx.output.ui.sideBox here as we don't have ctx in executeRunCommand
    // This function is used by both CLI and programmatic API
    stdout.write(`${formatSummary(output)}\n`);
    stdout.write(`Artifacts stored under ${path.dirname(output.artifacts.reviewJson)}\n`);
    stdout.write(`Exit code: ${output.exitCode}\n`);
  }

  return output;
}

type AiReviewRunFlags = {
  diff: { type: 'string'; description?: string; alias?: string; required: true };
  file: { type: 'string'; description?: string };
  branch: { type: 'string'; description?: string };
  staged: { type: 'boolean'; description?: string; default?: boolean };
  profile: { type: 'string'; description?: string; alias?: string; default?: string };
  'profiles-dir': { type: 'string'; description?: string };
  provider: { type: 'string'; description?: string; choices?: readonly string[]; default?: string };
  'fail-on': { type: 'string'; description?: string; choices?: readonly string[] };
  'max-comments': { type: 'number'; description?: string };
  'render-md': { type: 'boolean'; description?: string; default?: boolean };
  'render-html': { type: 'boolean'; description?: string; default?: boolean };
  'no-render': { type: 'boolean'; description?: string; default?: boolean };
  json: { type: 'boolean'; description?: string; default?: boolean };
  'out-json': { type: 'string'; description?: string };
  'out-md': { type: 'string'; description?: string };
  'include-adr': { type: 'boolean'; description?: string; default?: boolean };
  'include-boundaries': { type: 'boolean'; description?: string; default?: boolean };
  'context-max-bytes': { type: 'number'; description?: string };
  'context-max-approx-tokens': { type: 'number'; description?: string };
  'output-root': { type: 'string'; description?: string };
};

type AiReviewRunResult = CommandResult & {
  exitCode?: number;
  result?: AiReviewCommandOutput;
};

export const run = defineCommand<AiReviewRunFlags, AiReviewRunResult>({
  name: 'ai-review:run',
  flags: {
    diff: {
      type: 'string',
      description: 'Path to unified diff file.',
      alias: 'd',
      required: true,
    },
    file: {
      type: 'string',
      description: 'Generate diff for a single file relative to HEAD.',
    },
    branch: {
      type: 'string',
      description: 'Generate diff against the specified git ref (default: origin/master).',
    },
    staged: {
      type: 'boolean',
      description: 'Use staged changes (git diff --cached).',
      default: false,
    },
    profile: {
      type: 'string',
      description: 'Profile name (default: frontend).',
      alias: 'p',
      default: 'frontend',
    },
    'profiles-dir': {
      type: 'string',
      description: 'Override profiles directory.',
    },
    provider: {
      type: 'string',
      description: 'Provider id (local|mock).',
      choices: ['local', 'mock'] as const,
      default: 'local',
    },
    'fail-on': {
      type: 'string',
      description: 'Failure policy: none|major|critical.',
      choices: ['none', 'major', 'critical'] as const,
    },
    'max-comments': {
      type: 'number',
      description: 'Limit the number of findings returned.',
    },
    'render-md': {
      type: 'boolean',
      description: 'Render transport Markdown (default: true).',
      default: true,
    },
    'render-html': {
      type: 'boolean',
      description: 'Render HTML report.',
      default: false,
    },
    'no-render': {
      type: 'boolean',
      description: 'Skip all human-readable renderers.',
      default: false,
    },
    json: {
      type: 'boolean',
      description: 'Print JSON output instead of a human summary.',
      default: false,
    },
    'out-json': {
      type: 'string',
      description: 'Override review.json output path.',
    },
    'out-md': {
      type: 'string',
      description: 'Override review.md output path.',
    },
    'include-adr': {
      type: 'boolean',
      description: 'Include ADR context.',
      default: false,
    },
    'include-boundaries': {
      type: 'boolean',
      description: 'Include boundary context.',
      default: false,
    },
    'context-max-bytes': {
      type: 'number',
      description: 'Maximum context size in bytes.',
    },
    'context-max-approx-tokens': {
      type: 'number',
      description: 'Maximum approximate tokens in context.',
    },
    'output-root': {
      type: 'string',
      description: 'Override output root directory.',
    },
  },
  async handler(ctx, argv, flags) {
    ctx.logger?.info('AI Review run started', { flags });

    ctx.tracker.checkpoint('review');

    const args = mapFlagsToArgs(flags);
    if (!args.diff) {
      throw new Error('Missing required --diff <path> argument');
    }

    const repoRoot = ctx.cwd ?? process.cwd();

    // Execute review without output (executeRunCommand will not write to stdout)
    const output = await executeReview({
      diffPath: args.diff,
      repoRoot,
      profile: args.profile ?? 'frontend',
      provider: args.provider ?? 'local',
      failOn: args.failOn,
      maxComments: args.maxComments,
      profilesDir: args.profilesDir,
      render: {
        humanMarkdown: args.renderHumanMarkdown !== false,
        html: args.renderHtml === true
      },
      context: {
        includeAdr: args.includeAdr,
        includeBoundaries: args.includeBoundaries,
        maxBytes: args.contextMaxBytes,
        maxApproxTokens: args.contextMaxApproxTokens
      },
      output: {
        root: args.outputRoot
      }
    });

    ctx.tracker.checkpoint('complete');

    ctx.logger?.info('AI Review run completed', {
      exitCode: output.exitCode,
      findingsTotal: output.run.summary?.findingsTotal ?? 0,
    });

    // Format output using sideBox
    if (args.json) {
      ctx.output?.json(output);
    } else {
      const summary = output.run.summary;
      const counts = summary?.findingsBySeverity ?? { critical: 0, major: 0, minor: 0, info: 0 };
      const top = summary?.topSeverity ?? 'none';
      const total = summary?.findingsTotal ?? 0;

      const status = output.exitCode === 0 ? 'success' : 'error';

      const outputText = ctx.output?.ui.sideBox({
        title: 'AI Review',
        sections: [
          {
            header: 'Summary',
            items: [
              `Findings: ${total}`,
              `Critical: ${counts.critical}`,
              `Major: ${counts.major}`,
              `Minor: ${counts.minor}`,
              `Info: ${counts.info}`,
              `Top severity: ${top}`,
            ],
          },
          {
            header: 'Artifacts',
            items: [
              `Location: ${path.dirname(output.artifacts.reviewJson)}`,
              `Exit code: ${output.exitCode}`,
            ],
          },
        ],
        status,
        timing: ctx.tracker.total(),
      });
      ctx.output?.write(outputText);
    }

    return { ok: output.exitCode === 0, exitCode: output.exitCode, result: output };
  },
});

export async function runAiReviewCommand(
  cliCtx: CliHandlerContext,
  _argv: string[] = [],
  flags: Record<string, unknown> = {}
): Promise<AiReviewCommandOutput> {
  const args = mapFlagsToArgs(flags);
  if (!args.diff) {
    throw new Error('Missing required --diff <path> argument');
  }

  const repoRoot = cliCtx.cwd ?? process.cwd();
  const stdout = cliCtx.presenter ? presenterWritable(cliCtx) : process.stdout;

  return executeRunCommand(args, { repoRoot, stdout });
}
