import { defineConfig } from 'vitest/config';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '..');
const contractsDir = path.resolve(rootDir, 'ai-review-contracts/src');
const coreDir = path.resolve(rootDir, 'ai-review-core/src');
const providersDir = path.resolve(rootDir, 'ai-review-providers/src');
const sharedProfilesDir = path.resolve(rootDir, '../kb-labs-shared/packages/profiles/src');

export default defineConfig({
  test: {
    globals: true
  },
  resolve: {
    alias: {
      '@kb-labs/ai-review-contracts': path.join(contractsDir, 'index.ts'),
      '@kb-labs/ai-review-contracts/*': path.join(contractsDir, '*'),
      '@kb-labs/ai-review-core': path.join(coreDir, 'index.ts'),
      '@kb-labs/ai-review-core/*': path.join(coreDir, '*'),
      '@kb-labs/ai-review-providers': path.join(providersDir, 'index.ts'),
      '@kb-labs/ai-review-providers/*': path.join(providersDir, '*'),
      '@kb-labs/shared-profiles': path.join(sharedProfilesDir, 'index.ts'),
      '@kb-labs/shared-profiles/*': path.join(sharedProfilesDir, '*')
    }
  }
});
