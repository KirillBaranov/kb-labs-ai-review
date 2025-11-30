import fs from 'node:fs/promises';
import path from 'node:path';

import type { AiReviewCommandOutput, AiReviewFinding } from '@kb-labs/ai-review-contracts';
import { AiReviewCommandOutputSchema } from '@kb-labs/ai-review-contracts';
import type { BoundariesConfig } from '@kb-labs/ai-review-core';
import { localProvider, mockProvider, computeSummary } from '@kb-labs/ai-review-providers';
import type { ReviewProvider } from '@kb-labs/ai-review-providers';

import { buildContextDocument, type ContextBuildResult } from '../shared/context';
import { loadRules, loadBoundaries } from '../domain/profile';
import { writeReviewArtifacts } from '../domain/artifacts';
import { toReviewFindings } from '../domain/findings';

export type FailMode = 'none' | 'major' | 'critical';

export interface ReviewRuntimeOptions {
  diffPath: string;
  repoRoot: string;
  profile: string;
  provider?: string;
  failOn?: FailMode;
  maxComments?: number;
  profilesDir?: string;
  render?: {
    humanMarkdown?: boolean;
    html?: boolean;
  };
  context?: {
    includeAdr?: boolean;
    includeBoundaries?: boolean;
    maxBytes?: number;
    maxApproxTokens?: number;
  };
  output?: {
    root?: string;
  };
}

const SEVERITY_RANK = { critical: 3, major: 2, minor: 1, info: 0 } as const;

function resolveProvider(name?: string): ReviewProvider {
  const key = (name ?? 'local').toLowerCase();
  if (key === 'mock') {
    return mockProvider;
  }
  return localProvider;
}

async function readDiff(repoRoot: string, diffPath: string) {
  const abs = path.isAbsolute(diffPath) ? diffPath : path.join(repoRoot, diffPath);
  const text = await fs.readFile(abs, 'utf8');
  return { abs, text };
}

function clampFindings(findings: AiReviewFinding[], maxComments?: number): AiReviewFinding[] {
  if (!maxComments || maxComments <= 0 || findings.length <= maxComments) {
    return findings;
  }
  return [...findings].sort((a, b) => SEVERITY_RANK[b.severity as keyof typeof SEVERITY_RANK] - SEVERITY_RANK[a.severity as keyof typeof SEVERITY_RANK]).slice(0, maxComments);
}

function computeExitCode(summary: ReturnType<typeof computeSummary>, failOn?: FailMode): number {
  const top = summary.topSeverity;
  if (failOn === 'none') {
    return 0;
  }
  if (failOn === 'critical') {
    return top === 'critical' ? 1 : 0;
  }
  if (failOn === 'major') {
    return top && SEVERITY_RANK[top] >= SEVERITY_RANK.major ? 1 : 0;
  }
  if (!top) {
    return 0;
  }
  if (top === 'critical') {
    return 20;
  }
  if (top === 'major') {
    return 10;
  }
  return 0;
}

async function writeContextMarkdown(
  result: ContextBuildResult,
  contextPath: string
) {
  await fs.mkdir(path.dirname(contextPath), { recursive: true });
  await fs.writeFile(contextPath, result.markdown, 'utf8');
}

export async function executeReview(options: ReviewRuntimeOptions): Promise<AiReviewCommandOutput> {
  const provider = resolveProvider(options.provider);
  const repoRoot = options.repoRoot;
  const { abs: diffAbs, text: diffText } = await readDiff(repoRoot, options.diffPath);

  const rules = await loadRules(repoRoot, options.profile, options.profilesDir);
  const boundaries = (await loadBoundaries(repoRoot, options.profile, options.profilesDir)) as BoundariesConfig | null;

  const outRoot = options.output?.root ?? path.join(repoRoot, '.ai-review');
  const contextDir = path.join(outRoot, 'context', options.profile);
  const reviewsDir = path.join(outRoot, 'reviews', options.profile);
  const reviewJsonPath = path.join(reviewsDir, 'review.json');
  const reviewMdPath = path.join(reviewsDir, 'review.md');
  const humanMarkdownPath = options.render?.humanMarkdown === false ? undefined : path.join(reviewsDir, 'review.human.md');
  const htmlPath = options.render?.html ? path.join(reviewsDir, 'review.html') : undefined;
  const contextPath = path.join(contextDir, `${options.profile}.md`);

  const contextResult = await buildContextDocument({
    profile: options.profile,
    repoRoot,
    profilesDir: options.profilesDir,
    includeAdr: options.context?.includeAdr,
    includeBoundaries: options.context?.includeBoundaries,
    maxBytes: options.context?.maxBytes,
    maxApproxTokens: options.context?.maxApproxTokens
  });

  await writeContextMarkdown(contextResult, contextPath);

  const run = await provider.review({
    diffText,
    profile: options.profile,
    provider: provider.name,
    rules,
    boundaries,
    options: {
      diffPath: diffAbs,
      profilesDir: options.profilesDir
    }
  });

  const findings = clampFindings(run.findings, options.maxComments);
  const summary = computeSummary(toReviewFindings(findings));
  const finalRun = {
    ...run,
    findings,
    summary,
    artifacts: run.artifacts
  };

  const artifacts = await writeReviewArtifacts({
    run: finalRun,
    reviewJsonPath,
    reviewMdPath,
    humanMarkdownPath,
    htmlPath,
    contextPath
  });

  finalRun.artifacts = artifacts;
  finalRun.context = {
    profile: options.profile,
    handbookSections: contextResult.sections.handbook,
    adrIncluded: contextResult.sections.adr > 0,
    boundariesIncluded: contextResult.sections.hasBoundaries
  };

  const exitCode = computeExitCode(summary, options.failOn);

  const output: AiReviewCommandOutput = {
    run: finalRun,
    exitCode,
    artifacts
  };

  return AiReviewCommandOutputSchema.parse(output);
}
