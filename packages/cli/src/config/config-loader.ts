/**
 * Configuration loader adapter for ai-review
 * Supports both old (.sentinelrc.json) and new (loadBundle) systems
 * for gradual migration
 */

import { findRepoRoot } from '../cli-utils'
import { loadConfig as loadLegacyConfig, type ResolvedConfig } from './config'
import type { AiReviewRc } from './config'

/**
 * Load configuration using legacy system (.sentinelrc.json)
 * This is the current implementation, kept for backward compatibility
 */
export async function loadConfigLegacy(cliOverrides?: AiReviewRc): Promise<ResolvedConfig> {
  // Current sync implementation
  return loadLegacyConfig(cliOverrides)
}

/**
 * Load configuration using new system (loadBundle)
 * This will be the future implementation once migration is complete
 */
export async function loadConfigNew(
  cwd: string,
  profileKey?: string,
  cliOverrides?: Record<string, unknown>
): Promise<ResolvedConfig> {
  // TODO: Implement using loadBundle once schema is extended
  // For now, fallback to legacy
  return loadConfigLegacy(cliOverrides as AiReviewRc | undefined)
}

/**
 * Main config loader - tries new system first, falls back to legacy
 * This allows gradual migration without breaking existing setups
 */
export async function loadConfig(
  options: {
    cwd?: string
    profileKey?: string
    cliOverrides?: AiReviewRc | Record<string, unknown>
    useNewSystem?: boolean
  } = {}
): Promise<ResolvedConfig> {
  const { cwd, profileKey, cliOverrides, useNewSystem = false } = options

  // For now, always use legacy system until migration is complete
  // Once review.schema.json is extended, we can switch to loadBundle
  if (useNewSystem) {
    try {
      return await loadConfigNew(cwd || findRepoRoot(), profileKey, cliOverrides as Record<string, unknown> | undefined)
    } catch (error) {
      // Fallback to legacy if new system fails
      console.warn('[ai-review] Failed to load config via new system, falling back to legacy:', error)
      return loadConfigLegacy(cliOverrides as AiReviewRc | undefined)
    }
  }

  return loadConfigLegacy(cliOverrides as AiReviewRc | undefined)
}

