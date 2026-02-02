/**
 * @module @kb-labs/review-core/git-scope
 * Git scope resolver for diff-based reviews.
 *
 * Supports nested git repositories (submodules) common in monorepos.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { simpleGit, type SimpleGit, type StatusResult } from 'simple-git';
import type { InputFile } from '@kb-labs/review-contracts';
import { useLogger } from '@kb-labs/sdk';

export interface GitScopeOptions {
  /** Working directory (root of monorepo) */
  cwd: string;
  /** Repository names to include (e.g., ['kb-labs-core', 'kb-labs-cli']) */
  repos: string[];
  /** Include staged files */
  includeStaged?: boolean;
  /** Include unstaged files */
  includeUnstaged?: boolean;
  /** Include untracked files */
  includeUntracked?: boolean;
}

export interface ScopedFiles {
  /** Files with content ready for review */
  files: InputFile[];
  /** Summary of what was found */
  summary: {
    repos: string[];
    staged: number;
    unstaged: number;
    untracked: number;
    total: number;
  };
}

/**
 * Resolve git scope to list of changed files.
 *
 * For each repo in scope:
 * 1. Detect if it's a nested git repo (has .git)
 * 2. Get git status from that repo
 * 3. Read file contents
 * 4. Return as InputFile[] with paths relative to root
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- Git scope resolution: iterates repos, checks nested git, parses status, filters by include flags (staged/unstaged/untracked), reads files, tracks counts
export async function resolveGitScope(options: GitScopeOptions): Promise<ScopedFiles> {
  const {
    cwd,
    repos,
    includeStaged = true,
    includeUnstaged = true,
    includeUntracked = false,
  } = options;

  const allFiles: InputFile[] = [];
  let stagedCount = 0;
  let unstagedCount = 0;
  let untrackedCount = 0;

  for (const repo of repos) {
    const repoPath = join(cwd, repo);
    const gitPath = join(repoPath, '.git');

    // Check if repo exists and has .git
    if (!existsSync(repoPath)) {
      useLogger()?.debug(`[git-scope] Repo not found: ${repo}`);
      continue;
    }

    const isNestedRepo = existsSync(gitPath);
    const gitCwd = isNestedRepo ? repoPath : cwd;

    try {
      const git: SimpleGit = simpleGit(gitCwd);
      // eslint-disable-next-line no-await-in-loop -- Sequential per-repo processing is intentional
      const status: StatusResult = await git.status();

      // Collect file paths based on options
      const filePaths: string[] = [];

      if (includeStaged) {
        // Exclude deleted files from staged (can't read them)
        const stagedNotDeleted = status.staged.filter((f) => !status.deleted.includes(f));
        stagedCount += stagedNotDeleted.length;
        filePaths.push(...stagedNotDeleted);
      }

      if (includeUnstaged) {
        // Only include modified files, not deleted (can't read deleted files)
        const unstaged = status.modified
          .filter((f) => !status.staged.includes(f));
        unstagedCount += unstaged.length;
        filePaths.push(...unstaged);
      }

      if (includeUntracked) {
        untrackedCount += status.not_added.length;
        filePaths.push(...status.not_added);
      }

      // Dedupe and filter
      const uniquePaths = [...new Set(filePaths)]
        .filter((f) => !shouldIgnoreFile(f))
        .filter((f) => isReviewableFile(f));

      // Read file contents
      for (const filePath of uniquePaths) {
        try {
          const absolutePath = join(gitCwd, filePath);
          // eslint-disable-next-line no-await-in-loop -- Sequential file reading for memory efficiency
          const content = await readFile(absolutePath, 'utf-8');

          // Path relative to root cwd
          const relativePath = isNestedRepo
            ? `${repo}/${filePath}`
            : filePath;

          allFiles.push({
            path: relativePath,
            content,
          });
        } catch {
          useLogger()?.debug(`[git-scope] Could not read file: ${filePath}`);
        }
      }
    } catch (error) {
      useLogger()?.debug(`[git-scope] Git error in ${repo}:`, { error });
    }
  }

  return {
    files: allFiles,
    summary: {
      repos,
      staged: stagedCount,
      unstaged: unstagedCount,
      untracked: untrackedCount,
      total: allFiles.length,
    },
  };
}

/**
 * Detect all submodules/nested repos in cwd
 */
export async function discoverRepos(cwd: string): Promise<string[]> {
  const repos: string[] = [];

  try {
    const { readdirSync, statSync } = await import('node:fs');
    const entries = readdirSync(cwd);

    for (const entry of entries) {
      const entryPath = join(cwd, entry);
      const gitPath = join(entryPath, '.git');

      // Skip hidden dirs and node_modules
      if (entry.startsWith('.') || entry === 'node_modules') {
        continue;
      }

      // Check if directory with .git
      try {
        if (statSync(entryPath).isDirectory() && existsSync(gitPath)) {
          repos.push(entry);
        }
      } catch {
        // Skip
      }
    }
  } catch {
    // Return empty if can't read
  }

  return repos;
}

/**
 * Get all repos with uncommitted changes
 */
export async function getReposWithChanges(cwd: string): Promise<string[]> {
  const allRepos = await discoverRepos(cwd);
  const reposWithChanges: string[] = [];

  for (const repo of allRepos) {
    const repoPath = join(cwd, repo);

    try {
      const git: SimpleGit = simpleGit(repoPath);
      // eslint-disable-next-line no-await-in-loop -- Sequential per-repo processing is intentional
      const status: StatusResult = await git.status();

      const hasChanges =
        status.staged.length > 0 ||
        status.modified.length > 0 ||
        status.deleted.length > 0 ||
        status.not_added.length > 0;

      if (hasChanges) {
        reposWithChanges.push(repo);
      }
    } catch {
      // Skip repos with git errors
    }
  }

  return reposWithChanges;
}

/**
 * Files to ignore
 */
function shouldIgnoreFile(file: string): boolean {
  const ignoredPaths = [
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    '.next/',
    '.turbo/',
    'coverage/',
    '.cache/',
    '.temp/',
    'tmp/',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
  ];

  return ignoredPaths.some((path) => file.includes(path));
}

/**
 * Only review code files
 */
function isReviewableFile(file: string): boolean {
  const reviewableExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.py',
    '.go',
    '.rs',
    '.java',
    '.kt',
    '.swift',
    '.rb',
    '.php',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
  ];

  return reviewableExtensions.some((ext) => file.endsWith(ext));
}
