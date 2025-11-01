import fs from 'node:fs'
import path from 'node:path'
import { resolveProfile } from '@kb-labs/shared-profiles'

import type { RulesJson, BoundariesConfig } from '@kb-labs/ai-review-core'

/**
 * Resolve profile root directory using resolveProfile from @kb-labs/shared-profiles
 * Falls back to legacy path resolution if profile file is not found
 */
export async function resolveProfileRoot(repoRoot: string, profile: string, profilesDir?: string): Promise<string> {
  // Legacy: direct path (absolute or relative)
  if (profile.includes('/') || profile.startsWith('.') || path.isAbsolute(profile)) {
    const abs = path.isAbsolute(profile) ? profile : path.join(repoRoot, profile)
    if (!fs.existsSync(abs)) throw new Error(`[profile] path not found: ${abs}`)
    return abs
  }

  // Try to resolve via @kb-labs/shared-profiles first
  try {
    const { files } = await resolveProfile({
      repoRoot,
      profileId: profile,
      profilesDir,
    })
    
    // If profile was loaded, try to find its root directory
    if (files.length > 0) {
      const profileFile = files[files.length - 1] // Last file is the actual profile
      if (profileFile) {
        const profilePath = profileFile.path
      // Profile file is at <profilesDir>/<id>/profile.json or <profilesDir>/<id>.profile.json
      const profileDir = path.dirname(profilePath)
      // Check if profile.json format (dir is the profile root)
      if (path.basename(profilePath) === 'profile.json' && fs.existsSync(profileDir)) {
        return profileDir
      }
      // Check if <id>.profile.json format (parent dir is profiles dir, profile root is <parent>/<id>)
      const parentDir = path.dirname(profileDir)
        const candidate = path.join(parentDir, profile)
        if (fs.existsSync(candidate)) {
          return candidate
        }
      }
      }
    } catch (error) {
    // Profile not found via shared-profiles, fall back to legacy resolution
  }

  // Legacy: fallback path resolution
  if (profilesDir) {
    const base = path.isAbsolute(profilesDir) ? profilesDir : path.join(repoRoot, profilesDir)
    const candidate = path.join(base, profile)
    if (fs.existsSync(candidate)) return candidate
  }
  const candidates = [
    path.join(repoRoot, 'profiles', profile),
    path.join(repoRoot, 'packages', 'profiles', profile),
  ]
  for (const c of candidates) if (fs.existsSync(c)) return c
  throw new Error(`[profile] not found: "${profile}" (tried: ${candidates.join(', ')})`)
}

export async function loadRules(repoRoot: string, profile: string, profilesDir?: string): Promise<RulesJson | null> {
  const root = await resolveProfileRoot(repoRoot, profile, profilesDir)
  const rulesPath = path.join(root, 'docs', 'rules', 'rules.json')
  try {
    return JSON.parse(fs.readFileSync(rulesPath, 'utf8')) as RulesJson
  } catch {
    console.warn(`[review] rules.json not found or invalid for profile=${profile}. Looked at: ${rulesPath}`)
    return null
  }
}

export async function loadBoundaries(repoRoot: string, profile: string, profilesDir?: string): Promise<BoundariesConfig | null> {
  const root = await resolveProfileRoot(repoRoot, profile, profilesDir)
  const p = path.join(root, 'docs', 'rules', 'boundaries.json')
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as BoundariesConfig
  } catch {
    console.warn(`[review] boundaries.json not found for profile=${profile} (expected at ${p})`)
    return null
  }
}
