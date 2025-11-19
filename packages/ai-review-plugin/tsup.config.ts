import { defineConfig } from 'tsup';
import nodePreset from '@kb-labs/devkit/tsup/node.js';

export default defineConfig({
  ...nodePreset,
  entry: [
    'src/index.ts',
    'src/manifest.v2.ts',
    'src/cli/commands/run/command.ts',
    'src/runtime/review-service.ts',
    'src/runtime/context.ts',
    'src/runtime/profile.ts',
    'src/runtime/artifacts.ts',
    'src/runtime/workflow.ts'
  ],
  tsconfig: "tsconfig.build.json", // Use build-specific tsconfig without paths
  // nodePreset already includes all workspace packages as external via tsup.external.json
  dts: {
    resolve: true,
    skipLibCheck: true
  }
});
