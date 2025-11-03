/**
 * AI Review: review command
 */

import type { Command } from '@kb-labs/cli-commands';
import { runReviewCLI } from '../review/review.js';
import { buildContextCLI } from '../context.js';
import { loadConfig } from '../config/config.js';
import { findRepoRootAsync } from '../cli-utils.js';
import path from 'node:path';
import fs from 'node:fs';
import { renderMdCLI } from '../review/render-md.js';
import { renderHtmlCLI } from '../review/render-html.js';
import { ensureDirForFile, printRenderSummaryMarkdown, printRenderSummaryHtml } from '../cli-utils.js';
import { runScope, type AnalyticsEventV1, type EmitResult } from '@kb-labs/analytics-sdk-node';
import { ANALYTICS_EVENTS, ANALYTICS_ACTOR } from '../analytics/events';

export const review: Command = {
  name: 'ai-review:review',
  category: 'ai-review',
  describe: 'Run code review against a unified diff',
  async run(ctx, argv, flags) {
    const jsonMode = !!flags.json || !!ctx?.presenter;
    const cwd = ctx?.cwd || process.cwd();
    const repoRoot = await findRepoRootAsync(cwd);

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

    // Determine render options: --render-md (default), --render-html, --no-render
    const renderMd = !flags['no-render'] && (!flags['render-html'] || flags['render-md']);
    const renderHtml = !flags['no-render'] && !!flags['render-html'];
    const noRender = !!flags['no-render'];

    try {
      const parsedMax = typeof flags['max-comments'] === 'string'
        ? Number(flags['max-comments'])
        : flags['max-comments'];
      const maxComments = Number.isFinite(parsedMax) ? parsedMax : undefined;

      const rc = await loadConfig({
        profile: flags.profile as string | undefined,
        profilesDir: flags['profiles-dir'] as string | undefined,
        provider: flags.provider as 'local' | 'mock' | 'openai' | 'claude' | undefined,
        failOn: flags['fail-on'] as 'none' | 'major' | 'critical' | undefined,
        maxComments,
      }, {
        cwd: repoRoot,
        profileKey: flags.profile as string | undefined,
      });

      // Build context internally (as per plan) - non-blocking
      const contextOut = path.join(rc.out.contextDirAbs, `${rc.profile}.md`);
      buildContextCLI({
        profile: rc.profile,
        profilesDir: rc.profilesDir,
        out: contextOut,
        includeADR: rc.context.includeADR,
        includeBoundaries: rc.context.includeBoundaries,
        maxBytes: rc.context.maxBytes,
        maxApproxTokens: rc.context.maxApproxTokens,
        repoRoot,
      } as any).catch((contextError: any) => {
        // If context build fails, we continue anyway (context might already exist)
        if (flags.debug) {
          console.warn('[review] Context build failed:', contextError.message);
        }
      });

      const diffPath = path.isAbsolute(diff) ? diff : path.join(repoRoot, diff);

      const reviewDirAbs = path.join(rc.out.reviewsDirAbs, rc.profile);

      const outJson = flags['out-json'] as string | undefined
        ? (path.isAbsolute(flags['out-json'] as string)
            ? flags['out-json'] as string
            : path.join(repoRoot, flags['out-json'] as string))
        : path.join(reviewDirAbs, rc.out.jsonName);

      const outMd = flags['out-md'] as string | undefined
        ? (path.isAbsolute(flags['out-md'] as string)
            ? flags['out-md'] as string
            : path.join(repoRoot, flags['out-md'] as string))
        : path.join(reviewDirAbs, rc.out.mdName);

      // Run review
      await runReviewCLI({
        diff: diffPath,
        profile: rc.profile,
        profilesDir: rc.profilesDir,
        provider: rc.provider,
        outMd, // Always provide outMd for transport MD (with JSON block)
        outJson,
        failOn: rc.failOn as any,
        maxComments,
        debug: !!flags.debug,
        rc,
        repoRoot,
      });

      // Render additional outputs based on flags
      if (renderMd && fs.existsSync(outJson)) {
        // Render human-readable Markdown
        const outMdHuman = outMd.replace(/\.md$/i, '.human.md');
        await renderMdCLI({
          inFile: outJson,
          outFile: outMdHuman,
          repoRoot,
        });
      }

      if (renderHtml && fs.existsSync(outJson)) {
        // Render HTML
        const outHtml = outJson.replace(/\.json$/i, '') + '.html';
        await renderHtmlCLI({
          inFile: outJson,
          outFile: outHtml,
          repoRoot,
        });
      }

      return 0;
    } catch (e: any) {
      if (/Profile .* not found/.test(String(e?.message))) {
        if (jsonMode && ctx?.presenter) {
          ctx.presenter.json({ ok: false, error: e.message });
          return 1;
        }
        console.error('Error:', e.message);
        const tmp = await loadConfig(
          { profile: flags.profile as string | undefined },
          { cwd: repoRoot, profileKey: flags.profile as string | undefined }
        );
        const candidates = [
          '`profiles/<name>`',
          '`packages/profiles/<name>`',
          flags['profiles-dir'] && `\`${flags['profiles-dir']}/${tmp.profile}\``,
        ].filter(Boolean).join(', ');
        console.error(`\nProfile "${tmp.profile}" not found. Looked in: ${candidates}.\nTry: kb ai-review build-context --profile ${tmp.profile} or pass --profiles-dir to override root.`);
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
  },
};

