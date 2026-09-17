import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@codetranslate/shared": path.join(root, "packages/shared/src/index.ts"),
      "@codetranslate/core": path.join(root, "packages/core/src/index.ts"),
      "@codetranslate/ingest": path.join(root, "packages/ingest/src/index.ts"),
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.ts", "tests/**/*.test.ts"],
    testTimeout: 15_000,
  },
});
