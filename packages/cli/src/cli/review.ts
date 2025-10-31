/**
 * AI Review: review command for @kb-labs/cli
 */

import type { CommandModule } from './types.js';
import { runReviewCLI } from '../review/review.js';
import { loadConfig } from '../config/config.js';
import { findRepoRoot } from '../cli-utils.js';
import path from 'node:path';

const REPO_ROOT = findRepoRoot();

export const run: CommandModule['run'] = async (ctx, argv, flags) => {
  const jsonMode = !!flags.json || !!ctx?.presenter;
  
  const diff = flags.diff as string | undefined;
  if (!diff) {
    if (jsonMode && ctx?.presenter) {
      ctx.presenter.json({ ok: false, error: 'Missing --diff <path>' });
      return 1;
    }
    console.error('Error: Missing --diff <path>');
    console.error('Example: kb ai-review review --diff changes.diff');
    return 1;
  }

  try {
    const parsedMax = typeof flags['max-comments'] === 'string' 
      ? Number(flags['max-comments']) 
      : flags['max-comments'];
    const maxComments = Number.isFinite(parsedMax) ? parsedMax : undefined;

    const rc = loadConfig({
      profile: flags.profile as string | undefined,
      profilesDir: flags['profiles-dir'] as string | undefined,
      provider: flags.provider as 'local' | 'mock' | 'openai' | 'claude' | undefined,
      failOn: flags['fail-on'] as 'none' | 'major' | 'critical' | undefined,
      maxComments,
    });

    const diffPath = path.isAbsolute(diff) ? diff : path.join(REPO_ROOT, diff);

    const reviewDirAbs = path.join(rc.out.reviewsDirAbs, rc.profile);
    // Create directory if needed - but runReviewCLI should handle this
    // We just ensure it exists for path resolution

    const outJson = flags['out-json'] as string | undefined
      ? (path.isAbsolute(flags['out-json'] as string) 
          ? flags['out-json'] as string 
          : path.join(REPO_ROOT, flags['out-json'] as string))
      : path.join(reviewDirAbs, rc.out.jsonName);

    const outMd = flags['out-md'] as string | undefined
      ? (path.isAbsolute(flags['out-md'] as string)
          ? flags['out-md'] as string
          : path.join(REPO_ROOT, flags['out-md'] as string))
      : path.join(reviewDirAbs, rc.out.mdName);

    await runReviewCLI({
      diff: diffPath,
      profile: rc.profile,
      profilesDir: rc.profilesDir,
      provider: rc.provider,
      outMd,
      outJson,
      failOn: rc.failOn as any,
      maxComments,
      debug: !!flags.debug,
      rc,
    });

    return 0;
  } catch (e: any) {
    if (/Profile .* not found/.test(String(e?.message))) {
      if (jsonMode && ctx?.presenter) {
        ctx.presenter.json({ ok: false, error: e.message });
        return 1;
      }
      console.error('Error:', e.message);
      const tmp = loadConfig({ profile: flags.profile as string | undefined });
      const candidates = [
        '`profiles/<name>`',
        '`packages/profiles/<name>`',
        flags['profiles-dir'] && `\`${flags['profiles-dir']}/${tmp.profile}\``,
      ].filter(Boolean).join(', ');
      console.error(`\nProfile "${tmp.profile}" not found. Looked in: ${candidates}.\nTry: kb ai-review init-profile --name ${tmp.profile} or pass --profiles-dir to override root.`);
      return 1;
    } else {
      if (jsonMode && ctx?.presenter) {
        ctx.presenter.json({ ok: false, error: String(e?.stack || e) });
        return 1;
      }
      console.error('Error:', String(e?.stack || e));
      return 1;
    }
  }
};

