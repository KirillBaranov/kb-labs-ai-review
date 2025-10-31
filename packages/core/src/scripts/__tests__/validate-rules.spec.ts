import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, ExecFileSyncOptions } from 'node:child_process'
import { describe, it, beforeEach, afterEach, expect } from 'vitest'

// путь к TS-скрипту
const SCRIPT = path.resolve(__dirname, '..', 'validate-rules.ts')

// ESM-compatible: use npx tsx for ESM modules
const NODE_BIN = process.execPath
const TSX_CMD = 'tsx' // Use npx tsx via execFileSync

function makeSandbox(prefix = 'ai-review-validate-rules-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  const cleanup = () => {
    try { fs.rmSync(root, { recursive: true, force: true }) } catch {}
  }
  return { root, cleanup }
}

function writeValidProfile(profilesRoot: string, profile = 'frontend') {
  const base = path.join(profilesRoot, profile, 'docs', 'rules')
  fs.mkdirSync(base, { recursive: true })
  const validRules = {
    version: 1,
    domain: profile,
    metadata: { owner: `profiles/${profile}` },
    rules: [
      {
        id: 'style.no-todo-comment',
        area: 'DX',
        severity: 'minor',
        description: 'Avoid TODO comments',
        link: 'docs/handbook/style.md#no-todo',
        examples: { bad: ['// TODO: later'], good: ['// see ISSUE-123'] },
        scope: ['changed'],
        trigger: { type: 'pattern', signals: ['added-line:TODO'] },
        status: 'active',
        version: 1,
      },
    ],
  }
  fs.writeFileSync(path.join(base, 'rules.json'), JSON.stringify(validRules, null, 2), 'utf8')
  return { rulesPath: path.join(base, 'rules.json'), profile }
}

function writeInvalidProfile(profilesRoot: string, profile = 'frontend') {
  const base = path.join(profilesRoot, profile, 'docs', 'rules')
  fs.mkdirSync(base, { recursive: true })
  // намеренно невалидный
  const invalidRules = { domain: profile, rules: { not: 'an array' } } as any
  fs.writeFileSync(path.join(base, 'rules.json'), JSON.stringify(invalidRules, null, 2), 'utf8')
  return { rulesPath: path.join(base, 'rules.json'), profile }
}

function runScript(args: string[], opts?: ExecFileSyncOptions) {
  const execOpts: ExecFileSyncOptions = {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...(opts || {}),
  }
  // Use npx tsx for ESM compatibility
  try {
    return execFileSync('npx', ['tsx', SCRIPT, ...args], execOpts) as unknown as string
  } catch (e: any) {
    // If npx fails, try with node + tsx directly
    throw e
  }
}

describe('scripts/validate-rules.ts (process integration)', () => {
  let sbx: ReturnType<typeof makeSandbox>
  let envBackup: NodeJS.ProcessEnv

  beforeEach(() => {
    envBackup = { ...process.env }
    sbx = makeSandbox()
  })

  afterEach(() => {
    process.env = envBackup
    sbx.cleanup()
  })

  it('exits 0 and prints ✅ for a valid rules.json (via --profiles-dir)', () => {
    const { profile } = writeValidProfile(sbx.root, 'frontend')
    const out = runScript(['--profile', profile, '--profiles-dir', sbx.root], {
      env: { ...process.env },
    })
    expect(out).toMatch(/✅ rules\.json is valid/)
  })

  it('exits 2 and prints errors for an invalid rules.json', () => {
    const { profile } = writeInvalidProfile(sbx.root, 'frontend')
    try {
      runScript(['--profile', profile, '--profiles-dir', sbx.root], {
        env: { ...process.env },
      })
      throw new Error('expected non-zero exit')
    } catch (e: any) {
      expect(e && typeof e.status !== 'undefined').toBe(true)
      expect(e.status).toBe(2)
      const stderr: string = e.stderr?.toString?.() ?? ''
      expect(stderr).toMatch(/invalid rules\.json/i)
      expect(stderr).toMatch(/\(root\)|instancePath/)
    }
  })

  it('resolves profiles directory from AI_REVIEW_PROFILES_DIR when flag is absent', () => {
    const { profile } = writeValidProfile(sbx.root, 'frontend')
    const out = runScript(['--profile', profile], {
      env: { ...process.env, AI_REVIEW_PROFILES_DIR: sbx.root },
    })
    expect(out).toMatch(/✅ rules\.json is valid/)
  })

  it('fails with a helpful message when rules.json is missing', () => {
    const profile = 'frontend' // rules.json не создаём
    try {
      runScript(['--profile', profile, '--profiles-dir', sbx.root], {
        env: { ...process.env },
      })
      throw new Error('expected non-zero exit')
    } catch (e: any) {
      expect(e && typeof e.status !== 'undefined').toBe(true)
      expect(e.status).toBe(1)
      const stderr: string = e.stderr?.toString?.() ?? ''
      expect(stderr).toMatch(/\[validate-rules] rules\.json not found/)
    }
  })
})
