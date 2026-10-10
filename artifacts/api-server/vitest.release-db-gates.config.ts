import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/kinfolk/__tests__/alias-release-gate.test.ts",
      "src/kinfolk/__tests__/cultural-context-release-gate.test.ts",
    ],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
