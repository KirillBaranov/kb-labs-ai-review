/**
 * AI Review: init-profile command for @kb-labs/cli
 */

import type { CommandModule } from './types.js';
import { initProfileCLI } from '../cmd/init-profile.js';
import { runScope, type AnalyticsEventV1, type EmitResult } from '@kb-labs/analytics-sdk-node';
import { ANALYTICS_EVENTS, ANALYTICS_ACTOR } from '../analytics/events';
import { findRepoRoot } from '../cli-utils.js';

const REPO_ROOT = findRepoRoot();

export const run: CommandModule['run'] = async (ctx, argv, flags) => {
  const startTime = Date.now();
  const cwd = typeof flags.cwd === 'string' ? flags.cwd : REPO_ROOT;
  const name = flags.name as string | undefined;

  return await runScope(
    {
      actor: ANALYTICS_ACTOR,
      ctx: { workspace: cwd },
    },
    async (emit: (event: Partial<AnalyticsEventV1>) => Promise<EmitResult>) => {
      try {
        if (!name) {
          const totalTime = Date.now() - startTime;
          await emit({
            type: ANALYTICS_EVENTS.INIT_PROFILE_FINISHED,
            payload: {
              durationMs: totalTime,
              result: 'failed',
              error: 'Missing --name <name>',
            },
          });
          
          const jsonMode = !!flags.json || !!ctx?.presenter;
          if (jsonMode && ctx?.presenter) {
            ctx.presenter.json({ ok: false, error: 'Missing --name <name>' });
            return 1;
          }
          console.error('Error: Missing --name <name>');
          return 1;
        }

        // Track command start
        await emit({
          type: ANALYTICS_EVENTS.INIT_PROFILE_STARTED,
          payload: {
            name,
            force: !!flags.force,
            withAdr: !!flags['with-adr'],
          },
        });
        await initProfileCLI({
          name,
          outDir: flags['out-dir'] as string | undefined,
          force: !!flags.force,
          withAdr: !!flags['with-adr'],
        });

        const totalTime = Date.now() - startTime;

        // Track command completion
        await emit({
          type: ANALYTICS_EVENTS.INIT_PROFILE_FINISHED,
          payload: {
            name,
            force: !!flags.force,
            withAdr: !!flags['with-adr'],
            durationMs: totalTime,
            result: 'success',
          },
        });

        return 0;
      } catch (e: any) {
        const totalTime = Date.now() - startTime;

        // Track command failure
        await emit({
          type: ANALYTICS_EVENTS.INIT_PROFILE_FINISHED,
          payload: {
            name,
            force: !!flags.force,
            withAdr: !!flags['with-adr'],
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

