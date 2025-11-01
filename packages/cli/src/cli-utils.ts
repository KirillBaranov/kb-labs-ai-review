import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { bold, cyan, dim, green, red, yellow } from 'colorette'
import type { Severity } from '@kb-labs/shared-review-types'
import { findRepoRoot as findRepoRootCore, toAbsolute } from '@kb-labs/core'
import { box, keyValue, safeColors, safeSymbols } from '@kb-labs/shared-cli-ui'

type AnalyticsRcLike = {
  analytics?: {
    enabled?: boolean
    outDir?: string
  }
}

/** ────────────────────────────────────────────────────────────────────────────
 *  FS helpers
 *  ──────────────────────────────────────────────────────────────────────────── */
/**
 * Ensure parent directory exists for a file path (sync, local utility).
 * For directory creation, consider @kb-labs/cli-adapters/io/fs-artifacts.ensureDir (async).
 */
export function ensureDirForFile(p: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
}

/** Resolve a (possibly relative) path against repo root
 *  Uses @kb-labs/core-sys/fs::toAbsolute
 */
export function resolveRepoPath(repoRoot: string, p: string): string {
  return toAbsolute(repoRoot, p)
}

/** Make file:// link for pretty output */
export const linkifyFile = (absPath: string) => pathToFileURL(absPath).href

/** Human friendly sizes/tokens */
export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B`
  : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB`
  : `${(n / 1024 / 1024).toFixed(2)} MB`

/** Safe JSON helpers */
export function readJsonSync<T = unknown>(file: string): T {
  const raw = fs.readFileSync(file, 'utf8')
  return JSON.parse(raw) as T
}
export function writeJsonSync(file: string, data: unknown) {
  ensureDirForFile(file)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

/** Assert a file exists (throws a clear error) */
export function assertFileExists(absPath: string, label = 'file') {
  if (!fs.existsSync(absPath)) {
    throw new Error(`[ai-review] ${label} not found at ${absPath}`)
  }
}

/** Pretty rel + file link for logs */
export function prettyRelLink(repoRoot: string, absPath: string) {
  return `${dim(path.relative(repoRoot, absPath))} ${cyan('→')} ${dim(linkifyFile(absPath))}`
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Repo root detection (stable for monorepos)
 *  ────────────────────────────────────────────────────────────────────────────
 *  Async version using @kb-labs/core-sys/repo with env override support.
 *  Rules:
 *   - If AI_REVIEW_REPO_ROOT is set and exists → use it
 *   - Else use @kb-labs/core-sys/repo.findRepoRoot()
 *  @deprecated Use findRepoRootAsync instead. This sync wrapper will be removed.
 */
export function findRepoRoot(start = process.cwd()): string {
  // Env override (ai-review specific)
  const envRoot = process.env.AI_REVIEW_REPO_ROOT
  if (envRoot && fs.existsSync(envRoot)) {
    return path.resolve(envRoot)
  }

  // Sync fallback for backward compatibility
  const markers = ['.git', 'pnpm-workspace.yaml', 'package.json']
  let dir = path.resolve(start)

  while (true) {
    for (const marker of markers) {
      if (fs.existsSync(path.join(dir, marker))) {
        return dir
      }
    }

    const parent = path.dirname(dir)
    if (parent === dir) {
      // reached FS root — fallback to original start
      return path.resolve(start)
    }
    dir = parent
  }
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Async repo root detection using @kb-labs/core-sys/repo
 *  ────────────────────────────────────────────────────────────────────────────
 *  Uses @kb-labs/core-sys/repo.findRepoRoot() with env override support.
 *  Rules:
 *   - If AI_REVIEW_REPO_ROOT is set and exists → use it
 *   - Else use @kb-labs/core-sys/repo.findRepoRoot()
 */
export async function findRepoRootAsync(start = process.cwd()): Promise<string> {
  // Env override (ai-review specific)
  const envRoot = process.env.AI_REVIEW_REPO_ROOT
  if (envRoot && fs.existsSync(envRoot)) {
    return path.resolve(envRoot)
  }

  // Use platform implementation
  return await findRepoRootCore(start)
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Pretty console helpers (consistent UX)
 *  ──────────────────────────────────────────────────────────────────────────── */
export const ok   = (msg: string) => console.log(green('✔ ') + msg)
export const info = (msg: string) => console.log(cyan('ℹ ') + msg)
export const warn = (msg: string) => console.warn(yellow('▲ ') + msg)
export const fail = (msg: string) => console.error(red('✖ ') + msg)

/** ────────────────────────────────────────────────────────────────────────────
 *  Severity helpers (shared with review)
 *  ──────────────────────────────────────────────────────────────────────────── */
export const sevRank: Record<Severity, number> = {
  critical: 3, major: 2, minor: 1, info: 0,
}

export function maxSeverity(findings: { severity: Severity }[]): Severity | null {
  let max: Severity | null = null
  for (const f of findings) if (!max || sevRank[f.severity] > sevRank[max]) max = f.severity
  return max
}

export function countBySeverity(findings: { severity: Severity }[]) {
  const c = { critical: 0, major: 0, minor: 0, info: 0 }
  for (const f of findings) c[f.severity]++
  return c
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Unified summaries
 *  ──────────────────────────────────────────────────────────────────────────── */

/** Print nice summary for review run */
export function printReviewSummary(args: {
  repoRoot: string
  providerLabel: string
  profile: string
  outJsonPath: string
  outMdPath: string
  findings: { severity: Severity }[]
  exit: { mode: 'legacy' | 'threshold' | 'none'; exitCode: number; threshold?: Severity; top?: Severity | null }
}) {
  const { repoRoot, providerLabel, profile, outJsonPath, outMdPath, findings, exit } = args
  const total = findings?.length ?? 0
  const counts = countBySeverity(findings ?? [])
  const top = maxSeverity(findings ?? [])

  const summaryInfo: Record<string, string> = {
    provider: providerLabel,
    profile,
    outputs: `${safeColors.dim(path.relative(repoRoot, outJsonPath))}, ${safeColors.dim(path.relative(repoRoot, outMdPath))}`,
    findings: `${total} ${safeColors.dim(`(critical ${counts.critical}, major ${counts.major}, minor ${counts.minor}, info ${counts.info})`)}`,
    'max severity': top
      ? (top === 'critical' ? safeColors.error('critical') : top === 'major' ? safeColors.warning('major') : safeColors.success(top))
      : safeColors.success('none'),
  }

  // Exit policy
  let exitPolicy = ''
  if (exit.mode === 'none') {
    exitPolicy = `${safeColors.success('exit 0')} ${safeColors.dim('— failOn=none (never fail)')}`
  } else if (exit.mode === 'threshold') {
    const shouldFail = exit.exitCode !== 0
    exitPolicy = `${shouldFail ? safeColors.error('exit 1') : safeColors.success('exit 0')} ${safeColors.dim(`— failOn=${exit.threshold}, max=${exit.top ?? 'none'}`)}`
  } else {
    exitPolicy = `${exit.exitCode ? safeColors.warning(`exit ${exit.exitCode}`) : safeColors.success('exit 0')} ${safeColors.dim('— legacy policy (critical→20, major→10, else 0)')}`
  }
  summaryInfo['exit policy'] = exitPolicy

  const lines: string[] = []
  lines.push(...keyValue(summaryInfo))
  const output = box('Review Summary', lines)
  console.log(output)
}

/** Print nice summary for context build */
export function printContextSummary(args: {
  repoRoot: string
  profile: string
  profilesRootLabel: string
  outFile: string
  handbookCount: number
  adrCount: number
  hasBoundaries: boolean
  bytes: number
  tokens: number
  checksum: string
}) {
  const { repoRoot, profile, profilesRootLabel, outFile, handbookCount, adrCount, hasBoundaries, bytes, tokens, checksum } = args

  const summaryInfo: Record<string, string> = {
    profile,
    profiles: profilesRootLabel,
    output: `${safeColors.dim(path.relative(repoRoot, outFile))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(outFile))}`,
    sections: `handbook ${handbookCount}, adr ${adrCount}, boundaries ${hasBoundaries ? 'yes' : 'no'}`,
    size: `${bytes} bytes, ~${tokens} tokens`,
    checksum,
  }

  const lines: string[] = []
  lines.push(...keyValue(summaryInfo))
  const output = box('Context Summary', lines)
  console.log(output)
}

/** Print nice summary for render → Markdown */
export function printRenderSummaryMarkdown(args: {
  repoRoot: string
  inFile: string
  outFile: string
  findingsCount?: number
}) {
  const { repoRoot, inFile, outFile, findingsCount } = args

  const summaryInfo: Record<string, string> = {
    input: `${safeColors.dim(path.relative(repoRoot, inFile))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(inFile))}`,
    output: `${safeColors.dim(path.relative(repoRoot, outFile))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(outFile))}`,
  }

  if (typeof findingsCount === 'number') {
    summaryInfo.findings = String(findingsCount)
  }

  const lines: string[] = []
  lines.push(...keyValue(summaryInfo))
  lines.push('')
  lines.push(`${safeSymbols.success} ${safeColors.success('Markdown written')}`)
  const output = box('Render (Markdown) Summary', lines)
  console.log(output)
}

/** Print nice summary for render → HTML */
export function printRenderSummaryHtml(args: {
  repoRoot: string
  inFile: string
  outFile: string
}) {
  const { repoRoot, inFile, outFile } = args

  const summaryInfo: Record<string, string> = {
    input: `${safeColors.dim(path.relative(repoRoot, inFile))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(inFile))}`,
    output: `${safeColors.dim(path.relative(repoRoot, outFile))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(outFile))}`,
  }

  const lines: string[] = []
  lines.push(...keyValue(summaryInfo))
  lines.push('')
  lines.push(`${safeSymbols.success} ${safeColors.success('HTML written')}`)
  const output = box('Render (HTML) Summary', lines)
  console.log(output)
}

/** Print concise summary for init-profile */
export function printInitSummary(args: {
  repoRoot: string
  profile: string
  root: string          // абсолютный путь к созданному профилю (profiles/<name>)
  adr: boolean
  created: string[]     // абсолютные пути созданных файлов
  skipped: string[]     // абсолютные пути пропущенных (существующих) файлов
}) {
  const { repoRoot, profile, root, adr, created, skipped } = args

  console.log('')
  console.log(bold('Init profile summary'))
  console.log('  ' + cyan('profile: ') + profile)
  console.log('  ' + cyan('root:    ') + path.relative(repoRoot, root))
  console.log('  ' + cyan('adr:     ') + (adr ? 'yes' : 'no'))

  if (created.length) {
    ok('Created:')
    for (const f of created) {
      const rel = path.relative(repoRoot, f)
      console.log('   • ' + dim(rel) + ' ' + cyan('→') + ' ' + dim(linkifyFile(f)))
    }
  }

  if (skipped.length) {
    warn('Skipped (already exists):')
    for (const f of skipped) {
      const rel = path.relative(repoRoot, f)
      console.log('   • ' + dim(rel))
    }
  }
}

export function printInitNextSteps(args: {
  repoRoot: string
  profile: string
  root: string        // абсолютный путь к созданному профилю (profiles/<name>)
  baseRoot: string    // корень каталога профилей (packages/profiles или переопределённый)
}) {
  const { repoRoot, profile, root, baseRoot } = args
  const relHandbook = path.relative(repoRoot, path.join(root, 'docs/handbook'))
  const relRules    = path.relative(repoRoot, path.join(root, 'docs/rules/rules.json'))
  const relProfilesRoot = path.relative(repoRoot, baseRoot)

  console.log('')
  console.log(bold('Next steps'))
  console.log('  - Edit ' + yellow(relHandbook) + ' to reflect your team agreements.')
  console.log('  - Adjust ' + yellow(relRules) + ' severities/areas to fit your policy.')
  console.log('  - Try a dry run:\n    ' +
    dim(`pnpm --filter @kb-labs/ai-review-cli exec tsx src/index.ts review ` +
        `--diff ../../fixtures/changes.diff ` +
        `--profile ${profile} ` +
        `--profiles-dir ${relProfilesRoot} ` +
        `--provider local ` +
        `--fail-on none`))
}

/** Resolve analytics out directory and filename pattern (byDay|byRun) from repo root */
export function resolveAnalyticsOut(args: {
  repoRoot: string
  rc?: AnalyticsRcLike
  runId?: string
}) {
  const { repoRoot, rc, runId } = args

  // enabled: rc or env
  const enabled =
    !!rc?.analytics?.enabled ||
    process.env.AI_REVIEW_ANALYTICS === '1' ||
    process.env.AI_REVIEW_ANALYTICS === 'true'

  // outDir: rc → env → default
  const outDirRaw =
    rc?.analytics?.outDir ||
    process.env.AI_REVIEW_ANALYTICS_DIR ||
    '.ai-review/analytics'

  const outDirAbs = resolveRepoPath(repoRoot, outDirRaw)

  // file mode: byDay | byRun (env switch; byDay по умолчанию)
  const mode =
    (process.env.AI_REVIEW_ANALYTICS_FILE_MODE === 'byRun' ? 'byRun' : 'byDay') as
      | 'byDay'
      | 'byRun'

  // current file path (best-effort)
  const day = new Date().toISOString().slice(0, 10)
  const fileAbs =
    mode === 'byRun' && runId
      ? path.join(outDirAbs, `events.run.${runId}.jsonl`)
      : path.join(outDirAbs, `events.${day}.jsonl`)

  return { enabled, outDirAbs, mode, fileAbs }
}

/** Pretty print where analytics will be written */
export function printAnalyticsSummary(args: {
  repoRoot: string
  runId?: string
  diag: {
    enabled: boolean
    mode: 'byDay' | 'byRun'
    outDir?: string
    currentFile?: string
    privacy: 'team' | 'detailed'
  }
}) {
  const { repoRoot, runId, diag } = args

  if (!diag.enabled) {
    const summaryInfo: Record<string, string> = {
      status: safeColors.dim('disabled (rc/env)'),
    }
    const lines: string[] = []
    lines.push(...keyValue(summaryInfo))
    const output = box('Analytics Summary', lines)
    console.log(output)
    return
  }

  const summaryInfo: Record<string, string> = {
    status: safeColors.success('enabled'),
    mode: diag.mode,
    privacy: diag.privacy,
  }

  if (runId) {
    summaryInfo['run_id'] = safeColors.dim(runId)
  }

  if (diag.outDir) {
    summaryInfo.directory = `${safeColors.dim(path.relative(repoRoot, diag.outDir))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(diag.outDir))}`
  }

  if (diag.currentFile) {
    summaryInfo.file = `${safeColors.dim(path.relative(repoRoot, diag.currentFile))} ${safeColors.success('→')} ${safeColors.dim(linkifyFile(diag.currentFile))}`
  }

  const lines: string[] = []
  lines.push(...keyValue(summaryInfo))
  const output = box('Analytics Summary', lines)
  console.log(output)
}
