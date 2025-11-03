/**
 * AI Review: build-context command
 */

import type { Command } from '@kb-labs/cli-commands';
import { buildContextCLI } from '../context.js';
import { loadConfig } from '../config/config.js';
import { findRepoRootAsync } from '../cli-utils.js';
import path from 'node:path';
import { runScope, type AnalyticsEventV1, type EmitResult } from '@kb-labs/analytics-sdk-node';
import { ANALYTICS_EVENTS, ANALYTICS_ACTOR } from '../analytics/events';

export const buildContext: Command = {
  name: 'ai-review:build-context',
  category: 'ai-review',
  describe: 'Build AI review context',
  async run(ctx, argv, flags) {
    const startTime = Date.now();
    const cwd = ctx?.cwd || process.cwd();
    const repoRoot = await findRepoRootAsync(cwd);

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

          const rc = await loadConfig({
            profile: flags.profile as string | undefined,
            profilesDir: flags['profiles-dir'] as string | undefined,
          }, {
            cwd: repoRoot,
            profileKey: flags.profile as string | undefined,
          });

          const defaultOut = path.join(rc.out.contextDirAbs, `${rc.profile}.md`);
          const outFile = flags.out
            ? (path.isAbsolute(flags.out as string)
                ? flags.out as string
                : path.join(repoRoot, flags.out as string))
            : defaultOut;

          await buildContextCLI({
            profile: rc.profile,
            profilesDir: rc.profilesDir,
            out: outFile,
            includeADR: rc.context.includeADR,
            includeBoundaries: rc.context.includeBoundaries,
            maxBytes: rc.context.maxBytes,
            maxApproxTokens: rc.context.maxApproxTokens,
            repoRoot,
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

          const jsonMode = !!flags.json || !!ctx?.presenter;
          if (jsonMode && ctx?.presenter) {
            ctx.presenter.json({ ok: false, error: e.message || String(e) });
            return 1;
          }

          if (/not found: .+rules\.json/.test(String(e?.message))) {
            console.error('Error:', e.message);
            const tmp = await loadConfig({
              profile: flags.profile as string | undefined,
              profilesDir: flags['profiles-dir'] as string | undefined,
            }, {
              cwd: repoRoot,
              profileKey: flags.profile as string | undefined,
            });
            const candidates = [
              '`profiles/<name>`',
              '`packages/profiles/<name>`',
              tmp.profilesDir && `\`${tmp.profilesDir}/${tmp.profile}\``,
            ].filter(Boolean).join(', ');
            console.error(`\nProfile "${tmp.profile}" not found. Looked in: ${candidates}.\nTry: kb ai-review build-context --profile ${tmp.profile} or pass --profiles-dir to override root.`);
            return 1;
          } else {
            console.error('Error:', String(e?.stack || e));
            return 1;
          }
        }
      }
    );
  },
};

