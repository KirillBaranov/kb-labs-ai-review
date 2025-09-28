import config from "@kb-labs/devkit/tsup/node.js";

export default {
  ...config,
  entry: {
    index: "src/index.ts",
  },
  external: ["better-sqlite3"],
  clean: false,
  banner: {
    js: `
import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);
`.trim(),
  },
};
