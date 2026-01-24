import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

const externalDeps = JSON.parse(
  readFileSync(new URL('../../../tsup.external.json', import.meta.url), 'utf-8')
);

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: externalDeps.external,
});
