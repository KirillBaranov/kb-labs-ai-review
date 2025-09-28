import config from "@kb-labs/devkit/tsup/node.js";

export default {
  ...config,
  entry: {
    index: "src/index.ts",
  },
  external: [
    "@kb-labs/ai-review-core",
    "@kb-labs/ai-review-provider-types",
    "@kb-labs/ai-review-provider-mock",
    "@kb-labs/ai-review-provider-local",
    "@kb-labs/ai-review-analytics",
    "commander",
    "colorette"
  ],
  clean: false,
};
