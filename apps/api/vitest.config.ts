import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals:     true,
    environment: "node",
    include:     ["src/tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include:  ["src/services/sheets/**", "src/hooks/**", "src/config/sheets.ts"],
      reporter: ["text", "lcov"],
    },
    setupFiles: ["src/tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
