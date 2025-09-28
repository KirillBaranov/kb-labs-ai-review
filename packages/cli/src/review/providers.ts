import type { ReviewProvider } from '@kb-labs/ai-review-provider-types'
import { mockProvider } from '@kb-labs/ai-review-provider-mock'
import { localProvider } from '@kb-labs/ai-review-provider-local'

export function pickProvider(id?: string): ReviewProvider {
  const name = (id || process.env.SENTINEL_PROVIDER || 'local').toLowerCase()
  if (name === 'mock') return mockProvider
  return localProvider
}
