import fs from 'node:fs'
import path from 'node:path'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { makeSandbox } from './helpers/sandbox'

async function loadConfigFresh() {
  vi.resetModules()
  const mod: typeof import('../config') = await import('../config')
  return mod
}

describe('config.loadConfig (with sandbox)', () => {
  let sbx: ReturnType<typeof makeSandbox>
  let envBackup: NodeJS.ProcessEnv
  let cwdBackup: string

  beforeEach(() => {
    envBackup = { ...process.env }
    cwdBackup = process.cwd()

    sbx = makeSandbox('ai-review-config-')
    process.env.AI_REVIEW_REPO_ROOT = sbx.root
    process.chdir(sbx.root)
  })

  afterEach(() => {
    process.env = envBackup
    process.chdir(cwdBackup)
    sbx.cleanup()
  })

  function writeRc(dir: string, data: any) {
    fs.writeFileSync(path.join(dir, '.ai-reviewrc.json'), JSON.stringify(data, null, 2), 'utf8')
  }

  it('returns defaults when no rc and no env', async () => {
    const { loadConfig } = await loadConfigFresh()
    const cfg = await loadConfig()
    expect(cfg.profile).toBe('frontend')
    expect(cfg.provider).toBe('local')
    expect(cfg.out.rootAbs).toContain('.ai-review')
    expect(cfg.out.mdName).toBe('review.md')
    expect(cfg.out.jsonName).toBe('review.json')
    expect(cfg.profilesDir).toBeDefined()
  })

  it('merges rc from repo root and normalizes output.dir', async () => {
    writeRc(sbx.root, {
      profile: 'backend',
      provider: 'mock',
      out: { root: 'build', mdName: 'x.md', jsonName: 'y.json' }
    })

    const { loadConfig } = await loadConfigFresh()
    const cfg = await loadConfig()
    expect(cfg.profile).toBe('backend')
    expect(cfg.provider).toBe('mock')
    expect(cfg.out.rootAbs).toBe(path.join(sbx.root, 'build'))
    expect(cfg.out.mdName).toBe('x.md')
    expect(cfg.out.jsonName).toBe('y.json')
  })

  it('finds nearest .ai-reviewrc.json walking up, but not above repo root', async () => {
    writeRc(sbx.root, { profile: 'root-rc' })

    const deep = path.join(sbx.root, 'a/b/c')
    fs.mkdirSync(deep, { recursive: true })
    process.chdir(deep)

    {
      const { loadConfig } = await loadConfigFresh()
      const cfg = await loadConfig()
      expect(cfg.profile).toBe('root-rc')
    }

    const parentOfRepo = path.dirname(sbx.root)
    const outsidePath = path.join(parentOfRepo, '.ai-reviewrc.json')

    try {
      fs.writeFileSync(outsidePath, JSON.stringify({ profile: 'outside' }), 'utf8')

      const { loadConfig } = await loadConfigFresh()
      const cfg = await loadConfig()
      expect(cfg.profile).toBe('root-rc')
    } finally {
      try { fs.rmSync(outsidePath, { force: true }) } catch {}
    }
  })

  it('ENV overrides rc', async () => {
    writeRc(sbx.root, { profile: 'rc-prof', provider: 'mock' })

    process.env.AI_REVIEW_PROFILE = 'env-prof'
    process.env.AI_REVIEW_PROVIDER = 'openai'
    process.env.AI_REVIEW_OUT_ROOT = 'out'
    process.env.AI_REVIEW_OUT_MD_NAME = 'env.md'
    process.env.AI_REVIEW_OUT_JSON_NAME = 'env.json'
    process.env.AI_REVIEW_MAX_COMMENTS = '7'
    process.env.AI_REVIEW_CONTEXT_INCLUDE_ADR = '0'
    process.env.AI_REVIEW_CONTEXT_INCLUDE_BOUNDARIES = '1'
    process.env.AI_REVIEW_CONTEXT_MAX_BYTES = '12345'
    process.env.AI_REVIEW_CONTEXT_MAX_TOKENS = '999'

    const { loadConfig } = await loadConfigFresh()
    const cfg = await loadConfig()

    expect(cfg.profile).toBe('env-prof')
    expect(cfg.provider).toBe('openai')
    expect(cfg.maxComments).toBe(7)
    expect(cfg.out.rootAbs).toBe(path.join(sbx.root, 'out'))
    expect(cfg.out.mdName).toBe('env.md')
    expect(cfg.out.jsonName).toBe('env.json')

    expect(cfg.context.includeADR).toBe(false)
    expect(cfg.context.includeBoundaries).toBe(true)
    expect(cfg.context.maxBytes).toBe(12345)
    expect(cfg.context.maxApproxTokens).toBe(999)
  })

  it('CLI overrides highest priority (over env and rc)', async () => {
    writeRc(sbx.root, { profile: 'rc-prof', provider: 'mock' })
    process.env.AI_REVIEW_PROFILE = 'env-prof'
    process.env.AI_REVIEW_PROVIDER = 'openai'
    process.env.AI_REVIEW_OUT_ROOT = 'env-out'

    const { loadConfig } = await loadConfigFresh()
    const cfg = await loadConfig({
      profile: 'cli-prof',
      provider: 'claude',
      out: { root: 'cli-out', mdName: 'cli.md', jsonName: 'cli.json' },
      context: { includeADR: true, includeBoundaries: false, maxBytes: 42, maxApproxTokens: 77 },
      profilesDir: 'profiles' // относительный → нормализуем
    })

    expect(cfg.profile).toBe('cli-prof')
    expect(cfg.provider).toBe('claude')
    expect(cfg.out.rootAbs).toBe(path.join(sbx.root, 'cli-out'))
    expect(cfg.out.mdName).toBe('cli.md')
    expect(cfg.out.jsonName).toBe('cli.json')
    expect(cfg.context.includeADR).toBe(true)
    expect(cfg.context.includeBoundaries).toBe(false)
    expect(cfg.context.maxBytes).toBe(42)
    expect(cfg.context.maxApproxTokens).toBe(77)

    expect(cfg.profilesDir).toBe(path.join(sbx.root, 'profiles'))
  })

  it('does not change absolute profilesDir', async () => {
    const absProfiles = path.join(sbx.root, 'custom-profiles')
    const { loadConfig } = await loadConfigFresh()
    const cfg = await loadConfig({ profilesDir: absProfiles })
    expect(cfg.profilesDir).toBe(absProfiles)
  })
})
