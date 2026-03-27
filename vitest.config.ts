import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./setupTestFramework.ts"],
    include: ["integration-tests/**/*.test.ts"],
  },
});
