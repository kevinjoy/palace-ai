import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/index.ts"],
      // Global thresholds disabled during scaffold phase.
      // Per-module thresholds enforced as modules are implemented.
      // Target: 80% on implemented modules.
    },
  },
  resolve: {
    alias: {
      "@palace": "./src",
      "@config": "./config",
    },
  },
});
