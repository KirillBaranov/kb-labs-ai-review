import config from '@kb-labs/devkit/tsup/node.js';

export default {
  ...config,
  entry: {
    index: 'src/index.ts'
  },
  external: ['node:crypto'],
  clean: true
};
