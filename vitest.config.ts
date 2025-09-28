import { defineConfig } from "vitest/config";
import { resolve } from "path";
import nodePreset from "@kb-labs/devkit/vitest/node.js";

export default defineConfig({
  ...nodePreset,
  resolve: {
    alias: {
      "@kb-labs/ai-review-core": resolve(__dirname, "./packages/core/src"),
      "@kb-labs/ai-review-cli": resolve(__dirname, "./packages/cli/src"),
      "@kb-labs/ai-review-analytics": resolve(__dirname, "./packages/analytics/src"),
      "@kb-labs/ai-review-provider-types": resolve(__dirname, "./packages/providers/types/src"),
      "@kb-labs/ai-review-provider-mock": resolve(__dirname, "./packages/providers/mock/src"),
      "@kb-labs/ai-review-provider-local": resolve(__dirname, "./packages/providers/local/src"),
    },
  },
  test: {
    ...nodePreset.test,
    include: ["packages/**/src/**/*.spec.ts", "packages/**/src/**/*.test.ts"],
    coverage: {
      ...nodePreset.test?.coverage,
      enabled: true,
      exclude: [
        "**/dist/**",
        "**/fixtures/**",
        "**/__tests__/**",
        "**/*.spec.*",
        "**/*.test.*",
        // non-source and config files
        "eslint.config.js",
        "**/vitest.config.ts",
        "**/tsup.config.ts",
        "**/tsconfig*.json",
        "apps/**",
        // barrel files / types
        "**/index.ts",
        "**/types.ts",
        "**/types/**",
        // devkit scripts
        "scripts/devkit-sync.mjs",
        // CLI bin files (executable entry points)
        "**/bin.ts",
        "**/bin.js",
        // test files and directories
        "**/tests/**",
        "**/test/**",
      ],
    },
  },
});
