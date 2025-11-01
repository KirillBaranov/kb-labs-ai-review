// packages/cli/src/config.ts
import path from 'node:path'
import { loadBundle } from '@kb-labs/core-bundle'
import { findRepoRootAsync } from '../cli-utils'
import { adaptBundleConfigToResolvedConfig } from './bundle-adapter'
import type { ReviewProductConfig } from './types'

export type FailOn = 'none' | 'major' | 'critical'
export type ProviderName = 'local' | 'mock' | 'openai' | 'claude'

export interface AiReviewRc {
  profile?: string
  provider?: ProviderName
  /** profiles root, e.g. "packages/profiles" */
  profilesDir?: string

  /** CI exit policy and limits */
  failOn?: FailOn
  maxComments?: number

  /** Единый стандарт путей */
  out?: {
    root?: string          // корень артефактов, по умолчанию ".sentinel"
    contextDir?: string    // "context"
    reviewsDir?: string    // "reviews"
    analyticsDir?: string  // "analytics"
    exportsDir?: string    // "exports"
    // для review-файлов храним только имена (куда класть — решает reviewsDir)
    mdName?: string        // "review.md"
    jsonName?: string      // "review.json"
  }

  /** Параметры рендера */
  render?: {
    template?: string          // abs/rel к repoRoot
    severityMap?: Record<string, string>
  }

  /** build-context options */
  context?: {
    includeADR?: boolean
    includeBoundaries?: boolean
    maxBytes?: number
    maxApproxTokens?: number
  }

  /** Аналитика (file JSONL sink + плагины) */
  analytics?: {
    enabled?: boolean
    /** byRun | byDay */
    mode?: 'byRun' | 'byDay'
    /** если не задано — берём <out.root>/<out.analyticsDir> */
    outDir?: string
    salt?: string
    privacy?: 'team' | 'detailed'
    plugins?: string[]
    pluginConfig?: Record<string, any>
  }
}

/** Разрешённая конфигурация с абсолютными путями */
export interface ResolvedConfig {
  repoRoot: string

  profile: string
  provider: ProviderName
  profilesDir: string

  failOn: FailOn | 'none'
  maxComments?: number

  out: {
    rootAbs: string
    contextDirAbs: string
    reviewsDirAbs: string
    analyticsDirAbs: string
    exportsDirAbs: string
    mdName: string
    jsonName: string
  }

  render: {
    template?: string
    severityMap?: Record<string, string>
  }

  context: Required<Pick<NonNullable<AiReviewRc['context']>, 'includeADR' | 'includeBoundaries' | 'maxBytes' | 'maxApproxTokens'>>

  analytics: {
    enabled: boolean
    mode: 'byRun' | 'byDay'
    outDir: string
    salt: string
    privacy: 'team' | 'detailed'
    plugins?: string[]
    pluginConfig?: Record<string, any>
  }
}

/* ──────────────────────────────────────────────────────────────────────────── */

/**
 * Converts AiReviewRc CLI overrides to ReviewProductConfig format
 * Note: profile is handled separately as profileKey
 */
function cliOverridesToReviewConfig(rc?: AiReviewRc): Partial<ReviewProductConfig> {
  if (!rc) return {}
  
  const config: Partial<ReviewProductConfig> = {}
  
  if (rc.provider) config.provider = rc.provider
  if (rc.failOn) config.failOn = rc.failOn
  if (rc.maxComments !== undefined) config.maxComments = rc.maxComments
  if (rc.out) config.out = rc.out
  if (rc.render) config.render = rc.render
  if (rc.context) config.context = rc.context
  if (rc.analytics) {
    config.analytics = {
      ...rc.analytics,
      // Convert analytics flag to enabled
      enabled: rc.analytics.enabled !== undefined ? rc.analytics.enabled : undefined,
    }
  }
  
  return config
}

/**
 * Public config loader using loadBundle
 * 
 * Full migration to @kb-labs/core-bundle::loadBundle
 * Configuration is loaded from:
 * - Profile defaults (products.review.config)
 * - Workspace config (products.aiReview)
 * - CLI overrides (via cli parameter)
 */
export async function loadConfig(
  cliOverrides?: AiReviewRc,
  options?: {
    cwd?: string
    profileKey?: string
  }
): Promise<ResolvedConfig> {
  const cwd = options?.cwd || process.cwd()
  
  // Extract profile key from CLI overrides or options
  // Default to 'frontend' if not specified
  const profileKey = options?.profileKey || cliOverrides?.profile || 'frontend'
  
  // Convert CLI overrides to ReviewProductConfig format
  const cliConfig = cliOverridesToReviewConfig(cliOverrides)
  
  // loadBundle handles:
  // - Reading workspace config (kb-labs.config.yaml)
  // - Resolving profile via workspace.profiles[profileKey]
  // - Loading profile via loadProfile (inheritance, artifacts)
  // - Extracting products.review.config from profile
  // - Merging layers: defaults → profile → preset → workspace → CLI
  const bundle = await loadBundle<ReviewProductConfig>({
    cwd,
    product: 'aiReview',
    profileKey, // key from workspace.profiles
    cli: cliConfig, // CLI overrides applied as last layer
    validate: 'warn',
  })
  
  const repoRoot = await findRepoRootAsync(cwd)
  
  return adaptBundleConfigToResolvedConfig(bundle, repoRoot)
}

