import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/__tests__/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "**/*-release-gate.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
