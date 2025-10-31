/**
 * AI Review: build-context command for @kb-labs/cli
 */

import type { CommandModule } from './types.js';
import { buildContextCLI } from '../context.js';
import { loadConfig } from '../config/config.js';
import { findRepoRoot } from '../cli-utils.js';
import path from 'node:path';
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
          type: ANALYTICS_EVENTS.BUILD_CONTEXT_STARTED,
          payload: {
            profile: flags.profile as string | undefined,
          },
        });
        const rc = loadConfig({
          profile: flags.profile as string | undefined,
          profilesDir: flags['profiles-dir'] as string | undefined,
        });

        const defaultOut = path.join(rc.out.contextDirAbs, `${rc.profile}.md`);
        const outFile = flags.out
          ? (path.isAbsolute(flags.out as string)
              ? flags.out as string
              : path.join(REPO_ROOT, flags.out as string))
          : defaultOut;

        await buildContextCLI({
          profile: rc.profile,
          profilesDir: rc.profilesDir,
          out: outFile,
          includeADR: rc.context.includeADR,
          includeBoundaries: rc.context.includeBoundaries,
          maxBytes: rc.context.maxBytes,
          maxApproxTokens: rc.context.maxApproxTokens,
        } as any);

        const totalTime = Date.now() - startTime;

        // Track command completion
        await emit({
          type: ANALYTICS_EVENTS.BUILD_CONTEXT_FINISHED,
          payload: {
            profile: rc.profile,
            durationMs: totalTime,
            result: 'success',
          },
        });

        return 0;
      } catch (e: any) {
        const totalTime = Date.now() - startTime;

        // Track command failure
        await emit({
          type: ANALYTICS_EVENTS.BUILD_CONTEXT_FINISHED,
          payload: {
            profile: flags.profile as string | undefined,
            durationMs: totalTime,
            result: 'error',
            error: e.message || String(e),
          },
        });
        if (/not found: .+rules\.json/.test(String(e?.message))) {
          const jsonMode = !!flags.json || !!ctx?.presenter;
          if (jsonMode && ctx?.presenter) {
            ctx.presenter.json({ ok: false, error: e.message });
            return 1;
          }
          console.error('Error:', e.message);
          const tmp = loadConfig({
            profile: flags.profile as string | undefined,
            profilesDir: flags['profiles-dir'] as string | undefined,
          });
          const candidates = [
            '`profiles/<name>`',
            '`packages/profiles/<name>`',
            tmp.profilesDir && `\`${tmp.profilesDir}/${tmp.profile}\``,
          ].filter(Boolean).join(', ');
          console.error(`\nProfile "${tmp.profile}" not found. Looked in: ${candidates}.\nTry: kb ai-review init-profile --name ${tmp.profile} or pass --profiles-dir to override root.`);
          return 1;
        } else {
          const jsonMode = !!flags.json || !!ctx?.presenter;
          if (jsonMode && ctx?.presenter) {
            ctx.presenter.json({ ok: false, error: String(e?.stack || e) });
            return 1;
          }
          console.error('Error:', String(e?.stack || e));
          return 1;
        }
      }
    }
  );
};

