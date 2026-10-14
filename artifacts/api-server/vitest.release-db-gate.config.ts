import { defineConfig } from "vitest/config";
import { RELEASE_DB_GATE_TEST_FILES } from "./src/lib/releaseDbGate";

export default defineConfig({
  test: {
    environment: "node",
    include: [...RELEASE_DB_GATE_TEST_FILES],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // The database pool emits connection lifecycle diagnostics while the
    // worker is tearing down. Suppress those non-test logs so Vitest does not
    // report an RPC teardown error after a successful disposable gate.
    silent: true,
  },
});
