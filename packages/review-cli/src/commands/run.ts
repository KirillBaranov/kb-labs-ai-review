/**
 * review:run command
 * Run code review analysis
 */

import {
  defineCommand,
  useLoader,
  useConfig,
  type PluginContextV3,
  type CLIInput,
  type CommandResult,
} from '@kb-labs/sdk';
import type { ReviewMode, ReviewResult, InputFile } from '@kb-labs/review-contracts';
import { runReview, resolveGitScope, getReposWithChanges } from '@kb-labs/review-core';

/**
 * Flags for review:run command
 */
type RunFlags = {
  mode?: ReviewMode;
  scope?: 'all' | 'changed' | 'staged';
  repos?: string[];
  task?: string;
  preset?: string;
  files?: string[];
  eslintConfig?: string;
  cwd?: string;
  json?: boolean;
  agent?: boolean;
};

/**
 * Agent-friendly review report.
 * Simplified format for automated workflows.
 */
interface AgentReviewReport {
  /** Can the agent proceed (commit/merge)? */
  passed: boolean;
  /** Issues that must be fixed before proceeding */
  issues: Array<{
    file: string;
    line: number;
    problem: string;
    fix: string;
    severity: 'blocker' | 'high' | 'medium' | 'low' | 'info';
  }>;
  /** One-line summary for logs */
  summary: string;
}

/**
 * Severity order for sorting (lower = more critical)
 */
const SEVERITY_ORDER: Record<string, number> = {
  blocker: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

/**
 * Security-sensitive patterns for file filtering.
 * Shared across all file filtering operations for consistency.
 */
const SECURITY_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/.env',
  '**/.env.*',
  '**/.ssh/**',
  '**/credentials/**',
  '**/password/**',
  '**/*.pem',
  '**/*.key',
  '**/*.secret',
] as const;

/**
 * Regex patterns for additional security filtering.
 * Used as a second layer of defense after glob ignore.
 */
const SECURITY_REGEX_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /\.env$/,
  /\.env\./,
  /\.ssh/,
  /\/etc\//,
  /\/usr\//,
  /\/var\//,
  /credentials/i,
  /password/i,
  /\.pem$/,
  /\.key$/,
  /\.secret$/,
] as const;

/**
 * Validate that a file path is within the allowed directory.
 * Prevents path traversal attacks.
 */
function isPathWithinCwd(filePath: string, cwd: string): boolean {
  const path = require('node:path');
  const resolvedPath = path.resolve(cwd, filePath);
  const resolvedCwd = path.resolve(cwd);
  return resolvedPath.startsWith(resolvedCwd + path.sep) || resolvedPath === resolvedCwd;
}

/**
 * Filter file paths for security concerns.
 */
function filterSecurePaths(filePaths: string[], cwd: string): string[] {
  return filePaths.filter(filePath => {
    // Path traversal check
    if (!isPathWithinCwd(filePath, cwd)) {
      return false;
    }
    // Security pattern check
    return !SECURITY_REGEX_PATTERNS.some(pattern => pattern.test(filePath));
  });
}

/**
 * Transform ReviewResult to agent-friendly format
 */
function toAgentReport(result: ReviewResult): AgentReviewReport {
  // Blocking issues = blocker and high severity only
  // Medium/low/info are acceptable and don't block the review
  const blockingIssues = result.findings.filter(
    f => f.severity === 'blocker' || f.severity === 'high'
  );

  // Pass when no blocking issues (medium and below are acceptable)
  const passed = blockingIssues.length === 0;

  // Sort by severity: blocker > high > medium > low > info
  const sortedFindings = [...result.findings].sort((a, b) => {
    const aOrder = SEVERITY_ORDER[a.severity] ?? 5;
    const bOrder = SEVERITY_ORDER[b.severity] ?? 5;
    return aOrder - bOrder;
  });

  const issues = sortedFindings.map(f => ({
    file: f.file,
    line: f.line,
    problem: f.message,
    fix: f.suggestion ?? 'Review and fix manually',
    severity: f.severity as 'blocker' | 'high' | 'medium' | 'low' | 'info',
  }));

  // Count non-blocking issues for summary
  const mediumCount = result.findings.filter(f => f.severity === 'medium').length;
  const lowCount = result.findings.filter(f => f.severity === 'low').length;
  const infoCount = result.findings.filter(f => f.severity === 'info').length;
  const nonBlockingCount = mediumCount + lowCount + infoCount;

  const summary = passed
    ? nonBlockingCount > 0
      ? `Review passed. ${nonBlockingCount} non-blocking issue(s) found (${mediumCount} medium, ${lowCount} low, ${infoCount} info).`
      : 'Review passed. No issues found.'
    : `Review failed. ${blockingIssues.length} blocking issue(s) must be fixed.`;

  return { passed, issues, summary };
}

export default defineCommand<unknown, CLIInput<RunFlags>, ReviewResult>({
  id: 'review:run',
  description: 'Run code review analysis',

  handler: {
    async execute(ctx: PluginContextV3, input: CLIInput<RunFlags>): Promise<CommandResult<ReviewResult>> {
      const startTime = Date.now();

      // Extract flags from input
      const flags = input.flags;

      // Parse input
      const mode = flags.mode ?? 'heuristic';
      const scope = flags.scope ?? 'changed';

      // Use --cwd flag if provided, otherwise use current directory where command was run
      const cwd = flags.cwd ?? ctx.cwd ?? process.cwd();

      // Load config
      const fileConfig = await useConfig<{ eslintConfig?: string }>();

      // Show progress
      const loader = useLoader(`Running ${mode} analysis...`);
      loader.start();

      try {
        // Collect files based on scope
        let files: InputFile[] = [];
        let repoScope: string[] | undefined;

        // If --repos flag is provided, use git-scope resolver
        // Normalize repos to array (may come as string from CLI)
        const reposInput = flags.repos
          ? (Array.isArray(flags.repos) ? flags.repos : [flags.repos])
          : undefined;

        if (reposInput && reposInput.length > 0) {
          repoScope = reposInput;

          const scopedFiles = await resolveGitScope({
            cwd,
            repos: repoScope,
            includeStaged: scope === 'staged' || scope === 'changed',
            includeUnstaged: scope === 'changed',
            // Include untracked (new) files when explicitly scoping to repos
            includeUntracked: true,
          });

          files = scopedFiles.files;
        } else if (flags.files) {
          // Use explicitly provided files (with security validation)
          const filePaths = Array.isArray(flags.files) ? flags.files : [flags.files];
          const safeFilePaths = filterSecurePaths(filePaths, cwd);

          const fileReadResults = await Promise.allSettled(
            safeFilePaths.map(async (filePath) => ({
              path: filePath,
              content: await ctx.runtime.fs.readFile(filePath, 'utf-8'),
            }))
          );

          files = fileReadResults
            .filter((r): r is PromiseFulfilledResult<InputFile> => r.status === 'fulfilled')
            .map(r => r.value);
        } else {
          // Resolve files based on file scope (all/changed/staged)
          let filePaths: string[] = [];

          switch (scope) {
            case 'all':
              // All TypeScript/JavaScript files
              // Run multiple globs in parallel since ctx.runtime.fs.glob might not support brace expansion
              const [tsFiles, tsxFiles, jsFiles, jsxFiles] = await Promise.all([
                ctx.runtime.fs.glob('**/*.ts', { cwd, ignore: [...SECURITY_IGNORE_PATTERNS] }),
                ctx.runtime.fs.glob('**/*.tsx', { cwd, ignore: [...SECURITY_IGNORE_PATTERNS] }),
                ctx.runtime.fs.glob('**/*.js', { cwd, ignore: [...SECURITY_IGNORE_PATTERNS] }),
                ctx.runtime.fs.glob('**/*.jsx', { cwd, ignore: [...SECURITY_IGNORE_PATTERNS] }),
              ]);
              filePaths = [...tsFiles, ...tsxFiles, ...jsFiles, ...jsxFiles];
              break;

            case 'staged':
              // Git staged files - try to detect repos with changes
              const reposWithChanges = await getReposWithChanges(cwd);
              if (reposWithChanges.length > 0) {
                const scopedFiles = await resolveGitScope({
                  cwd,
                  repos: reposWithChanges,
                  includeStaged: true,
                  includeUnstaged: false,
                  includeUntracked: false,
                });
                files = scopedFiles.files;
                repoScope = reposWithChanges;
              } else {
                // Fallback to glob
                filePaths = await ctx.runtime.fs.glob('**/*.{ts,tsx,js,jsx}', {
                  cwd,
                  ignore: [...SECURITY_IGNORE_PATTERNS],
                });
              }
              break;

            case 'changed':
            default:
              // Changed files - try to detect repos with changes
              const changedRepos = await getReposWithChanges(cwd);
              if (changedRepos.length > 0) {
                const scopedFiles = await resolveGitScope({
                  cwd,
                  repos: changedRepos,
                  includeStaged: true,
                  includeUnstaged: true,
                  includeUntracked: false,
                });
                files = scopedFiles.files;
                repoScope = changedRepos;
              } else {
                // Fallback to glob
                filePaths = await ctx.runtime.fs.glob('**/*.{ts,tsx,js,jsx}', {
                  cwd,
                  ignore: [...SECURITY_IGNORE_PATTERNS],
                });
              }
              break;
          }

          // If we used glob fallback, read file contents
          if (files.length === 0 && filePaths.length > 0) {
            // Apply security filtering (path traversal + pattern matching)
            const safeFilePaths = filterSecurePaths(filePaths, cwd);

            // Read files with individual error handling
            const fileReadResults = await Promise.allSettled(
              safeFilePaths.map(async (filePath) => ({
                path: filePath,
                content: await ctx.runtime.fs.readFile(filePath, 'utf-8'),
              }))
            );

            // Collect successful reads, skip failed ones
            files = fileReadResults
              .filter((r): r is PromiseFulfilledResult<InputFile> => r.status === 'fulfilled')
              .map(r => r.value);
          }
        }

        // Run review
        const result = await runReview({
          files,
          mode,
          presetId: flags.preset ?? 'default',
          cwd,
          taskContext: flags.task,
          repoScope,
          config: {
            eslintConfig: flags.eslintConfig ?? fileConfig?.eslintConfig,
          },
        });

        loader.succeed(`Found ${result.findings.length} issue(s)`);

        // Output results
        if (flags.agent) {
          // Agent-friendly format: simple pass/fail with actionable issues
          const agentReport = toAgentReport(result);
          ctx.ui?.json?.(agentReport);
        } else if (flags.json) {
          ctx.ui?.json?.(result);
        } else {
          // Build sections
          const sections: Array<{ header?: string; items: string[] }> = [];

          // Summary section
          const counts = {
            blocker: result.findings.filter((f) => f.severity === 'blocker').length,
            high: result.findings.filter((f) => f.severity === 'high').length,
            medium: result.findings.filter((f) => f.severity === 'medium').length,
            low: result.findings.filter((f) => f.severity === 'low').length,
            info: result.findings.filter((f) => f.severity === 'info').length,
          };

          const summaryItems: string[] = [
            `Files: ${result.metadata.analyzedFiles}`,
            `Findings: ${result.findings.length}`,
          ];

          // Show task context if provided
          if (flags.task) {
            summaryItems.push(`Task: ${flags.task}`);
          }

          // Show repo scope if used
          if (repoScope && repoScope.length > 0) {
            summaryItems.push(`Repos: ${repoScope.join(', ')}`);
          }

          if (counts.blocker > 0) summaryItems.push(`Blocker: ${counts.blocker}`);
          if (counts.high > 0) summaryItems.push(`High: ${counts.high}`);
          if (counts.medium > 0) summaryItems.push(`Medium: ${counts.medium}`);
          if (counts.low > 0) summaryItems.push(`Low: ${counts.low}`);
          if (counts.info > 0) summaryItems.push(`Info: ${counts.info}`);

          summaryItems.push(`Engines: ${result.metadata.engines.join(', ')}`);

          // Show incremental stats if available (LLM modes with caching)
          const incr = result.metadata.incremental;
          if (incr) {
            if (incr.cachedFiles > 0) {
              summaryItems.push(`Cached: ${incr.cachedFiles} file(s) skipped`);
            }
            if (incr.newFindings > 0 || incr.knownFindings > 0 || incr.cachedFindings > 0) {
              const parts: string[] = [];
              if (incr.newFindings > 0) parts.push(`${incr.newFindings} new`);
              if (incr.knownFindings > 0) parts.push(`${incr.knownFindings} known`);
              if (incr.cachedFindings > 0) parts.push(`${incr.cachedFindings} cached`);
              summaryItems.push(`Breakdown: ${parts.join(', ')}`);
            }
          }

          sections.push({
            header: 'Summary',
            items: summaryItems,
          });

          // Findings section (top 10, sorted by severity)
          if (result.findings.length > 0) {
            // Sort by severity: blocker > high > medium > low > info
            const sortedFindings = [...result.findings].sort((a, b) => {
              const aOrder = SEVERITY_ORDER[a.severity] ?? 5;
              const bOrder = SEVERITY_ORDER[b.severity] ?? 5;
              return aOrder - bOrder;
            });

            const topFindings = sortedFindings.slice(0, 10);
            const findingsItems = topFindings.map((f) => {
              const loc = `${f.file}:${f.line}`;
              const severity = f.severity.toUpperCase();
              return `[${severity}] ${loc} - ${f.message}`;
            });

            if (result.findings.length > 10) {
              findingsItems.push(`... and ${result.findings.length - 10} more`);
            }

            sections.push({
              header: 'Findings',
              items: findingsItems,
            });
          }

          const timing = Date.now() - startTime;

          if (result.findings.length === 0) {
            ctx.ui?.success?.('No issues found', {
              title: 'Code Review',
              sections,
              timing,
            });
          } else {
            ctx.ui?.warn?.(`Found ${result.findings.length} issue(s)`, {
              title: 'Code Review',
              sections,
              timing,
            });
          }
        }

        // Exit code based on severity
        const blockerCount = result.findings.filter((f) => f.severity === 'blocker').length;
        const highCount = result.findings.filter((f) => f.severity === 'high').length;

        if (blockerCount > 0) {
          return { exitCode: 1, result };
        }

        if (mode === 'heuristic' && highCount > 0) {
          // In CI mode (heuristic), fail on high severity
          return { exitCode: 1, result };
        }

        return { exitCode: 0, result };
      } catch (error) {
        loader.fail('Review failed');
        ctx.ui?.error?.(error instanceof Error ? error.message : String(error));
        return { exitCode: 1 };
      }
    },
  },
});
