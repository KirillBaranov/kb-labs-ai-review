import path from 'node:path';
import { Writable } from 'node:stream';
import type { CliHandlerContext } from '@kb-labs/sandbox';
import type { AiReviewCommandOutput } from '@kb-labs/ai-review-contracts';
import { executeReview, type FailMode } from '../../../runtime/review-service.js';

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
    stdout.write(`${formatSummary(output)}\n`);
    stdout.write(`Artifacts stored under ${path.dirname(output.artifacts.reviewJson)}\n`);
    stdout.write(`Exit code: ${output.exitCode}\n`);
  }

  return output;
}

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
