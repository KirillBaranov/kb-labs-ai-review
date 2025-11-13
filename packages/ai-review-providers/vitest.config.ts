import { defineConfig } from 'vitest/config';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '..');
const coreDir = path.resolve(rootDir, 'ai-review-core/src');
const contractsDir = path.resolve(rootDir, 'ai-review-contracts/src');

export default defineConfig({
  resolve: {
    alias: {
      '@kb-labs/ai-review-core': path.join(coreDir, 'index.ts'),
      '@kb-labs/ai-review-contracts': path.join(contractsDir, 'index.ts')
    }
  }
});
