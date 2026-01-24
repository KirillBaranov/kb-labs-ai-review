import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  splitting: false,
  minify: false,
  external: [
    '@kb-labs/review-contracts',
    '@kb-labs/core-sys',
    'eslint',
    'glob',
  ],
});
