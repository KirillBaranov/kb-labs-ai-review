import config from "@kb-labs/devkit/tsup/node.js";

export default {
  ...config,
  entry: {
    index: "src/index.ts",
  },
  external: ["@kb-labs/ai-review-core", "@kb-labs/ai-review-provider-types"],
  clean: false,
};
