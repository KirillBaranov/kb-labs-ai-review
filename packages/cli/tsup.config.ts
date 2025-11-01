import config from "@kb-labs/devkit/tsup/node.js";

export default {
  ...config,
  entry: {
    index: "src/index.ts",
    "cli.manifest": "src/cli.manifest.ts",
  },
  external: [
    "@kb-labs/ai-review-core",
    "@kb-labs/ai-review-provider-types",
    "@kb-labs/ai-review-provider-mock",
    "@kb-labs/ai-review-provider-local",
    "@kb-labs/shared-diff",
    "@kb-labs/core-sys",
    "commander",
    "colorette",
    "picomatch",
    "better-sqlite3"
  ],
  clean: false,
  sourcemap: false,
};
