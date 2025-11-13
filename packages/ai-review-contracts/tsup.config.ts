import { defineConfig } from 'tsup';
import nodePreset from '@kb-labs/devkit/tsup/node.js';

export default defineConfig({
  ...nodePreset,
  entry: ['src/index.ts', 'src/schema.ts', 'src/contract.ts'],
  dts: {
    resolve: true,
    skipLibCheck: true
  },
  clean: true,
  sourcemap: true
});

