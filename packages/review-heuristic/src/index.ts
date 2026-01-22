/**
 * @module @kb-labs/review-heuristic
 * Heuristic analysis engines for AI Review plugin.
 *
 * Provides adapters for deterministic code analysis tools:
 * - ESLint (TypeScript/JavaScript)
 * - Ruff (Python)
 * - golangci-lint (Go)
 * - Clippy (Rust)
 * - etc.
 */

// Engine registry
export {
  ENGINE_REGISTRY,
  getEngine,
  getEnginesForLanguage,
  getEngineTypePriority,
} from './engine-registry.js';

// Deduplication
export {
  generateFingerprint,
  hashSnippet,
  deduplicateFindings,
  deduplicateFindingsWithSnippets,
} from './deduplication.js';

// ESLint adapter
export {
  ESLintAdapter,
  analyzeWithESLint,
  type ESLintAdapterConfig,
} from './adapters/eslint-adapter.js';
