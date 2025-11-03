/**
 * Type definitions for AI Review product configuration
 * Compatible with bundle system (loadBundle)
 */

export type FailOn = 'none' | 'major' | 'critical'
export type ProviderName = 'local' | 'mock' | 'openai' | 'claude'

/**
 * Review product configuration structure
 * Used in bundle.config from loadBundle
 * Note: profile and profilesDir are not here - they come from bundle.profile
 */
export interface ReviewProductConfig {
  enabled?: boolean
  provider?: ProviderName
  failOn?: FailOn
  maxComments?: number
  out?: {
    root?: string
    contextDir?: string
    reviewsDir?: string
    analyticsDir?: string
    exportsDir?: string
    mdName?: string
    jsonName?: string
  }
  render?: {
    template?: string
    severityMap?: Record<string, string>
  }
  context?: {
    includeADR?: boolean
    includeBoundaries?: boolean
    maxBytes?: number
    maxApproxTokens?: number
  }
  analytics?: {
    enabled?: boolean
    mode?: 'byRun' | 'byDay'
    outDir?: string
    salt?: string
    privacy?: 'team' | 'detailed'
    plugins?: string[]
    pluginConfig?: Record<string, any>
  }
}


