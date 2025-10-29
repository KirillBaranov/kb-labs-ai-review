import config from "@kb-labs/devkit/tsup/node.js";

export default {
  ...config,
  entry: {
    index: "src/index.ts",
    "scripts/validate-rules": "src/scripts/validate-rules.ts",
  },
  external: ["ajv", "ajv-formats", "yaml", "picomatch"],
  clean: true,
};
