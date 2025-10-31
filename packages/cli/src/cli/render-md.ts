/**
 * AI Review: render-md command for @kb-labs/cli
 */

import type { CommandModule } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../config/config.js';
import { findRepoRoot } from '../cli-utils.js';
import type { ReviewJson } from '@kb-labs/shared-review-types';
import type { RenderOptions } from '@kb-labs/ai-review-core';
import { renderMarkdown } from '@kb-labs/ai-review-core';
import { normalizeSeverityMap } from '../config/severity-normalize.js';
import { ensureDirForFile, printRenderSummaryMarkdown } from '../cli-utils.js';
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
          type: ANALYTICS_EVENTS.RENDER_MD_STARTED,
          payload: {
            profile: flags.profile as string | undefined,
          },
        });
        const rc = loadConfig({ profile: flags.profile as string | undefined });
        const profile = (flags.profile as string | undefined) || process.env.AI_REVIEW_PROFILE || rc.profile;

        const defaultIn = path.join(rc.out.reviewsDirAbs, profile, rc.out.jsonName);
        const defaultOut = path.join(
          rc.out.reviewsDirAbs,
          profile,
          rc.out.mdName.replace(/\.md$/i, '.human.md')
        );

        const inPath = flags.in
          ? (path.isAbsolute(flags.in as string)
              ? flags.in as string
              : path.join(rc.repoRoot, flags.in as string))
          : defaultIn;

        const outPath = flags.out
          ? (path.isAbsolute(flags.out as string)
              ? flags.out as string
              : path.join(rc.repoRoot, flags.out as string))
          : defaultOut;

        if (!fs.existsSync(inPath)) {
          const totalTime = Date.now() - startTime;
          await emit({
            type: ANALYTICS_EVENTS.RENDER_MD_FINISHED,
            payload: {
              profile,
              durationMs: totalTime,
              result: 'failed',
              error: `Input not found: ${inPath}`,
            },
          });
          
          const jsonMode = !!flags.json || !!ctx?.presenter;
          if (jsonMode && ctx?.presenter) {
            ctx.presenter.json({ ok: false, error: `[render-md] input not found: ${inPath}` });
            return 2;
          }
          console.error(`[render-md] input not found: ${inPath}`);
          return 2;
        }

        const raw = JSON.parse(fs.readFileSync(inPath, 'utf8')) as ReviewJson;
        const findings = raw.ai_review?.findings ?? [];

        const ropts: RenderOptions = {};

        if (flags.template) {
          const tpl = path.isAbsolute(flags.template as string)
            ? flags.template as string
            : path.join(rc.repoRoot, flags.template as string);
          if (fs.existsSync(tpl)) ropts.template = fs.readFileSync(tpl, 'utf8');
        } else if (rc.render.template && fs.existsSync(rc.render.template)) {
          ropts.template = fs.readFileSync(rc.render.template, 'utf8');
        }

        const sevPath = flags['severity-map'] as string | undefined;
        if (sevPath) {
          const sp = path.isAbsolute(sevPath) ? sevPath : path.join(rc.repoRoot, sevPath);
          if (fs.existsSync(sp)) {
            ropts.severityMap = normalizeSeverityMap(JSON.parse(fs.readFileSync(sp, 'utf8')));
          }
        } else if (rc.render.severityMap) {
          ropts.severityMap = normalizeSeverityMap(rc.render.severityMap);
        }

        ensureDirForFile(outPath);
        const md = renderMarkdown(findings, ropts);
        fs.writeFileSync(outPath, md, 'utf8');

        const totalTime = Date.now() - startTime;

        printRenderSummaryMarkdown({
          repoRoot: rc.repoRoot,
          inFile: inPath,
          outFile: outPath,
          findingsCount: findings.length,
        });

        // Track command completion
        await emit({
          type: ANALYTICS_EVENTS.RENDER_MD_FINISHED,
          payload: {
            profile,
            findingsCount: findings.length,
            durationMs: totalTime,
            result: 'success',
          },
        });

        return 0;
      } catch (e: any) {
        const totalTime = Date.now() - startTime;

        // Track command failure
        await emit({
          type: ANALYTICS_EVENTS.RENDER_MD_FINISHED,
          payload: {
            profile: flags.profile as string | undefined,
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

