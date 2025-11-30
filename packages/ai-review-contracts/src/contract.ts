import type { PluginContracts } from './types';
import { contractsSchemaId, contractsVersion } from './version';

/**
 * AI Review plugin contracts manifest
 * Level 2: Contracts типизация с as const для извлечения типов
 */
export const pluginContractsManifest = {
  schema: contractsSchemaId,
  pluginId: '@kb-labs/ai-review',
  contractsVersion,
  artifacts: {
    'ai-review.review.json': {
      id: 'ai-review.review.json',
      kind: 'json',
      description: 'AI Review results in JSON format',
      pathPattern: '.kb/artifacts/ai-review/review.json',
      mediaType: 'application/json',
    },
    'ai-review.review.md': {
      id: 'ai-review.review.md',
      kind: 'markdown',
      description: 'AI Review results in Markdown format',
      pathPattern: '.kb/artifacts/ai-review/review.md',
      mediaType: 'text/markdown',
    },
    'ai-review.review-human.md': {
      id: 'ai-review.review-human.md',
      kind: 'markdown',
      description: 'Human-readable AI Review results',
      pathPattern: '.kb/artifacts/ai-review/review-human.md',
      mediaType: 'text/markdown',
    },
    'ai-review.review.html': {
      id: 'ai-review.review.html',
      kind: 'html',
      description: 'AI Review results in HTML format',
      pathPattern: '.kb/artifacts/ai-review/review.html',
      mediaType: 'text/html',
    },
    'ai-review.context.json': {
      id: 'ai-review.context.json',
      kind: 'json',
      description: 'Review context and metadata',
      pathPattern: '.kb/artifacts/ai-review/context.json',
      mediaType: 'application/json',
    },
  },
  commands: {
    'ai-review:run': {
      id: 'ai-review:run',
      description: 'Run AI Review against a unified diff and emit artifacts',
      examples: [
        'kb ai-review run',
        'kb ai-review run --diff changes.diff',
        'kb ai-review run --file src/index.ts --profile frontend',
      ],
    },
  },
} as const satisfies PluginContracts;

// Извлекаем типы для использования в других местах
export type PluginArtifactIds = keyof typeof pluginContractsManifest.artifacts;
export type PluginCommandIds = keyof typeof pluginContractsManifest.commands;
