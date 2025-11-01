import * as path from 'node:path'
import * as crypto from 'node:crypto'

import type { ReviewJson } from '@kb-labs/shared-review-types'
import type { Severity } from '@kb-labs/shared-review-types'
import { maxSeverity, sevRank, findRepoRootAsync, printReviewSummary } from '../cli-utils'

import { pickProvider } from './providers'
import { loadRules, loadBoundaries } from './profiles'
import { readDiff, prepareOutputs, writeArtifacts } from './io'

import { runScope, type AnalyticsEventV1, type EmitResult } from '@kb-labs/analytics-sdk-node'
import { ANALYTICS_EVENTS, ANALYTICS_ACTOR } from '../analytics/events'

function capFindings<T extends { severity: Severity }>(list: T[], cap?: number): T[] {
  return cap && cap > 0 && list.length > cap ? list.slice(0, cap) : list
}

type Exit =
  | { mode: 'legacy'; exitCode: number; top?: Severity | null }
  | { mode: 'threshold'; exitCode: number; threshold: Severity; top?: Severity | null }
  | { mode: 'none'; exitCode: 0 }

function computeExit(top: Severity | null | undefined, failOn?: 'none' | 'major' | 'critical'): Exit {
  if (failOn === 'none') return { mode: 'none', exitCode: 0 }
  if (failOn) {
    const threshold: Severity = failOn === 'critical' ? 'critical' : 'major'
    const shouldFail = top != null && sevRank[top] >= sevRank[threshold]
    return { mode: 'threshold', exitCode: shouldFail ? 1 : 0, threshold, top }
  }
  const code = top === 'critical' ? 20 : top === 'major' ? 10 : 0
  return { mode: 'legacy', exitCode: code, top }
}

// helpers
function resolveAbs(repoRoot: string, maybePath?: string): string | undefined {
  if (!maybePath) return undefined
  return path.isAbsolute(maybePath) ? maybePath : path.join(repoRoot, maybePath)
}

// ────────────────────────────────────────────────────────────────────────────────
export async function runReviewCLI(opts: {
  diff: string
  profile: string
  outMd: string
  outJson?: string
  profilesDir?: string
  provider?: string
  failOn?: 'none' | 'major' | 'critical'
  maxComments?: number
  debug?: boolean
  rc?: any               // пробрасываем целиком rc из команды
  repoRoot?: string      // optional repo root (auto-detected if not provided)
}) {
  const repoRoot = opts.repoRoot || await findRepoRootAsync()
  const provider = pickProvider(opts.provider)
  const providerLabel = provider.name || 'local'

  const { outMdPath, outJsonPath } = prepareOutputs(repoRoot, opts.outMd, opts.outJson)
  const { diffPath, diffText } = readDiff(repoRoot, opts.diff)

  const rulesRaw = await loadRules(repoRoot, opts.profile, opts.profilesDir)
  const boundaries = await loadBoundaries(repoRoot, opts.profile, opts.profilesDir)

  if (opts.debug) {
    console.log('[review:debug]', {
      repoRoot,
      provider: providerLabel,
      diffPath,
      outMdPath,
      outJsonPath,
      profilesDir: opts.profilesDir,
      profile: opts.profile,
      hasRules: !!rulesRaw,
      hasBoundaries: !!boundaries,
    })
  }

  const startTime = Date.now()
  const runId = crypto.randomUUID?.() ?? `run_${Date.now()}`

  return await runScope(
    {
      runId,
      actor: ANALYTICS_ACTOR,
      ctx: {
        workspace: repoRoot,
        provider: providerLabel,
        profile: opts.profile,
      },
    },
    async (emit: (event: Partial<AnalyticsEventV1>) => Promise<EmitResult>) => {
      try {
        // Track command start
        await emit({
          type: ANALYTICS_EVENTS.REVIEW_STARTED,
          payload: {
            provider: providerLabel,
            profile: opts.profile,
            maxComments: opts.maxComments,
            failOn: opts.failOn,
          },
        })

        // ── Основной review через провайдера
        const review: ReviewJson = await provider.review({
          diffText,
          profile: opts.profile,
          rules: rulesRaw,
          boundaries,
        })

        // Канонизируем run_id
        review.ai_review.run_id = runId

        // cap findings: cli flag > ENV
        const envCap = process.env.AI_REVIEW_MAX_COMMENTS ? Number(process.env.AI_REVIEW_MAX_COMMENTS) : undefined
        const cap = Number.isFinite(opts.maxComments as number)
          ? (opts.maxComments as number)
          : Number.isFinite(envCap as number)
          ? (envCap as number)
          : undefined

        review.ai_review.findings = capFindings(
          review.ai_review.findings as unknown as { severity: Severity }[],
          cap
        ) as any

        // артефакты JSON + Markdown транспорт
        writeArtifacts(outJsonPath, outMdPath, review)

        // summary + exit
        const findings = review.ai_review.findings as unknown as {
          severity: Severity
          rule: string
          file?: string
          locator?: string
        }[]

        const top = maxSeverity(findings)
        const exit = computeExit(top, opts.failOn)

        printReviewSummary({
          repoRoot,
          providerLabel,
          profile: opts.profile,
          outJsonPath,
          outMdPath,
          findings,
          exit,
        })

        const totalTime = Date.now() - startTime
        const counts: Record<Severity, number> = { critical: 0, major: 0, minor: 0, info: 0 }
        
        for (const f of findings) {
          counts[f.severity] = (counts[f.severity] ?? 0) + 1
        }

        // Track command completion
        await emit({
          type: ANALYTICS_EVENTS.REVIEW_FINISHED,
          payload: {
            provider: providerLabel,
            profile: opts.profile,
            findingsTotal: findings.length,
            findingsBySeverity: counts,
            topSeverity: top || 'none',
            exitCode: exit.exitCode,
            durationMs: totalTime,
            result: exit.exitCode === 0 ? 'success' : 'failed',
          },
        })

        process.exit(exit.exitCode)
      } catch (error: any) {
        const totalTime = Date.now() - startTime

        // Track command failure
        await emit({
          type: ANALYTICS_EVENTS.REVIEW_FINISHED,
          payload: {
            provider: providerLabel,
            profile: opts.profile,
            durationMs: totalTime,
            result: 'error',
            error: error.message || String(error),
          },
        })

        throw error
      }
    }
  )
}
