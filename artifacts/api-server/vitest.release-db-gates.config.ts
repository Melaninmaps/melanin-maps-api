import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Pool lifecycle diagnostics can outlive the worker console RPC. The
    // release gate reports only deterministic pass/fail output so teardown
    // cannot convert a passing database safety check into a false failure.
    silent: true,
    include: [
      "src/kinfolk/__tests__/alias-release-gate.test.ts",
      "src/kinfolk/__tests__/cultural-context-release-gate.test.ts",
    ],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
