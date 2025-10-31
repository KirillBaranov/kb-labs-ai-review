/**
 * @kb-labs/ai-review-cli
 *
 * CLI commands are registered via cli.manifest.ts for @kb-labs/cli.
 * Use commands via: `kb ai-review <command>`
 *
 * This file exists only for package.json bin compatibility.
 * For command registration, see: ./cli.manifest.ts
 */

// Re-export manifest for compatibility
export { commands } from './cli.manifest.js';
