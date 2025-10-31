import config from "@kb-labs/devkit/tsup/node.js";

export default {
  ...config,
  entry: {
    index: "src/index.ts",
  },
  tsconfig: "../../../tsconfig.base.json",
  external: [
    "@kb-labs/ai-review-core",
    "@kb-labs/ai-review-provider-types",
    "@kb-labs/shared-review-types"
  ],
  clean: false,
};
