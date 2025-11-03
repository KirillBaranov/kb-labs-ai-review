/**
 * Adapter from Bundle<ReviewProductConfig> to ResolvedConfig
 * Converts bundle-based configuration to the existing ResolvedConfig format
 */

import path from 'node:path'
import type { Bundle } from '@kb-labs/core-bundle'
import type { ReviewProductConfig, FailOn, ProviderName } from './types'
import type { ResolvedConfig } from './config'

/**
 * Resolves profiles directory from bundle trace or uses default locations
 */
function resolveProfilesDir(repoRoot: string, bundle: Bundle<ReviewProductConfig>): string {
  // Try to find profilesDir from trace
  // Look for profile file path in trace
  for (const trace of bundle.trace) {
    if (trace.source === 'profile' && trace.path) {
      // Extract profilesDir from profile file path
      // e.g., if trace.path is "packages/profiles/frontend/profile.json"
      // then profilesDir is "packages/profiles"
      const profilePath = trace.path
      if (profilePath.includes('/profiles/')) {
        const parts = profilePath.split('/profiles/')
        if (parts[0]) {
          const candidate = path.isAbsolute(parts[0])
            ? parts[0]
            : path.join(repoRoot, parts[0])
          // Return directory containing "profiles" folder
          return candidate
        }
      }
      // If profile path is like "packages/profiles/frontend/profile.json"
      // Get parent of parent directory
      const profileDir = path.dirname(profilePath)
      const parent = path.dirname(profileDir)
      if (path.basename(parent) === 'profiles') {
        return path.isAbsolute(parent) ? parent : path.join(repoRoot, parent)
      }
    }
  }

  // Fallback to common locations
  const candidates = [
    path.join(repoRoot, 'profiles'),
    path.join(repoRoot, 'packages', 'profiles'),
  ]
  const fs = require('node:fs')
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }

  // Default to packages/profiles even if it doesn't exist yet
  return path.join(repoRoot, 'packages', 'profiles')
}

/**
 * Adapts Bundle<ReviewProductConfig> to ResolvedConfig
 */
export async function adaptBundleConfigToResolvedConfig(
  bundle: Bundle<ReviewProductConfig>,
  repoRoot: string
): Promise<ResolvedConfig> {
  const config = bundle.config

  // Normalize & absolutize paths
  const out = config.out || {}
  const outRoot = out.root || '.ai-review'
  const outRootAbs = path.isAbsolute(outRoot)
    ? outRoot
    : path.join(repoRoot, outRoot)

  const contextDirAbs = path.join(outRootAbs, out.contextDir || 'context')
  const reviewsDirAbs = path.join(outRootAbs, out.reviewsDir || 'reviews')
  const analyticsDirAbs = path.join(outRootAbs, out.analyticsDir || 'analytics')
  const exportsDirAbs = path.join(outRootAbs, out.exportsDir || 'exports')

  const mdName = out.mdName || 'review.md'
  const jsonName = out.jsonName || 'review.json'

  // Analytics output directory
  const analytics = config.analytics || {}
  const analyticsOutDirAbs = (() => {
    if (analytics.outDir && path.isAbsolute(analytics.outDir)) return analytics.outDir
    if (analytics.outDir) return path.join(repoRoot, analytics.outDir)
    // If not specified, use standard location from out.*
    return analyticsDirAbs
  })()

  // Profiles directory
  const profilesDirAbs = resolveProfilesDir(repoRoot, bundle)

  // Render template
  const render = config.render || {}
  const renderTemplateAbs = render.template
    ? (path.isAbsolute(render.template) ? render.template : path.join(repoRoot, render.template))
    : undefined

  // Profile name from bundle
  const profileName = bundle.profile.key || bundle.profile.name || 'frontend'

  return {
    repoRoot,
    profile: profileName,
    provider: (config.provider || 'local') as ProviderName,
    profilesDir: profilesDirAbs,
    failOn: (config.failOn || 'major') as FailOn,
    maxComments: config.maxComments,

    out: {
      rootAbs: outRootAbs,
      contextDirAbs,
      reviewsDirAbs,
      analyticsDirAbs,
      exportsDirAbs,
      mdName,
      jsonName,
    },

    render: {
      template: renderTemplateAbs,
      severityMap: render.severityMap,
    },

    context: {
      includeADR: config.context?.includeADR ?? true,
      includeBoundaries: config.context?.includeBoundaries ?? true,
      maxBytes: config.context?.maxBytes ?? 1_500_000,
      maxApproxTokens: config.context?.maxApproxTokens ?? 0,
    },

    analytics: {
      enabled: analytics.enabled ?? false,
      mode: analytics.mode || 'byDay',
      outDir: analyticsOutDirAbs,
      salt: analytics.salt || 'ai-review',
      privacy: analytics.privacy || 'team',
      plugins: analytics.plugins,
      pluginConfig: analytics.pluginConfig,
    },
  }
}


