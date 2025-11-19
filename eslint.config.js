import nodePreset from '@kb-labs/devkit/eslint/node.js';

export default [
  ...nodePreset,
  {
    ignores: [
      '**/tsup.config.ts',
      '**/vitest.config.ts',
      '**/*.vue'
    ]
  }
];