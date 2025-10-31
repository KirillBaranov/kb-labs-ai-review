/**
 * AI Review: render-html command for @kb-labs/cli
 */

import type { CommandModule } from './types.js';
import { renderHtmlCLI } from '../cmd/render-html.js';
import { loadConfig } from '../config/config.js';
import { findRepoRoot } from '../cli-utils.js';
import path from 'node:path';
import fs from 'node:fs';
import { runScope, type AnalyticsEventV1, type EmitResult } from '@kb-labs/analytics-sdk-node';
import { ANALYTICS_EVENTS, ANALYTICS_ACTOR } from '../analytics/events';

const REPO_ROOT = findRepoRoot();

export const run: CommandModule['run'] = async (ctx, argv, flags) => {
  const startTime = Date.now();
  const cwd = typeof flags.cwd === 'string' ? flags.cwd : REPO_ROOT;

  return await runScope(
    {
      actor: ANALYTICS_ACTOR,
      ctx: { workspace: cwd },
    },
    async (emit: (event: Partial<AnalyticsEventV1>) => Promise<EmitResult>) => {
      try {
        // Track command start
        await emit({
          type: ANALYTICS_EVENTS.RENDER_HTML_STARTED,
          payload: {},
        });
        const rc = loadConfig();

        const defaultIn = path.join(rc.out.reviewsDirAbs, rc.profile, rc.out.jsonName);
        const defaultOut = path.join(rc.out.reviewsDirAbs, rc.profile, 'review.html');

        const inPathRaw = (flags.in as string | undefined) ?? defaultIn;
        const inPath = path.isAbsolute(inPathRaw) ? inPathRaw : path.join(REPO_ROOT, inPathRaw);

        if (!fs.existsSync(inPath)) {
          const totalTime = Date.now() - startTime;
          await emit({
            type: ANALYTICS_EVENTS.RENDER_HTML_FINISHED,
            payload: {
              durationMs: totalTime,
              result: 'failed',
              error: `Input not found: ${inPath}`,
            },
          });
          
          const jsonMode = !!flags.json || !!ctx?.presenter;
          if (jsonMode && ctx?.presenter) {
            ctx.presenter.json({ ok: false, error: `[render-html] input not found: ${inPath}` });
            return 2;
          }
          console.error(`[render-html] input not found: ${inPath}`);
          return 2;
        }

        let outPath: string;
        if (flags.out) {
          outPath = path.isAbsolute(flags.out as string)
            ? flags.out as string
            : path.join(REPO_ROOT, flags.out as string);
        } else {
          const derived = inPath.replace(/\.json$/i, '') + '.html';
          outPath = derived || defaultOut;
        }

        await renderHtmlCLI({ inFile: inPath, outFile: outPath });

        const totalTime = Date.now() - startTime;

        // Track command completion
        await emit({
          type: ANALYTICS_EVENTS.RENDER_HTML_FINISHED,
          payload: {
            durationMs: totalTime,
            result: 'success',
          },
        });

        return 0;
      } catch (e: any) {
        const totalTime = Date.now() - startTime;

        // Track command failure
        await emit({
          type: ANALYTICS_EVENTS.RENDER_HTML_FINISHED,
          payload: {
            durationMs: totalTime,
            result: 'error',
            error: e.message || String(e),
          },
        });

        const jsonMode = !!flags.json || !!ctx?.presenter;
        if (jsonMode && ctx?.presenter) {
          ctx.presenter.json({ ok: false, error: String(e?.stack || e) });
          return 1;
        }
        console.error('Error:', String(e?.stack || e));
        return 1;
      }
    }
  );
};

