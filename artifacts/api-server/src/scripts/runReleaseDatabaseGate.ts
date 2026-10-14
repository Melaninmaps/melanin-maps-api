import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  applyReleaseGateDatabaseUrl,
  RELEASE_DB_GATE_TEST_FILES,
} from "../lib/releaseDbGate";

// Validate before starting Vitest, then replace (rather than inherit) the
// child process DATABASE_URL with the explicit release-gate target.
const databaseUrl = applyReleaseGateDatabaseUrl({ ...process.env });
const apiServerDirectory = fileURLToPath(new URL("../..", import.meta.url));
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const result = spawnSync(
  pnpmCommand,
  [
    "exec",
    "vitest",
    "run",
    "--config",
    "vitest.release-db-gate.config.ts",
    ...RELEASE_DB_GATE_TEST_FILES,
  ],
  {
    cwd: apiServerDirectory,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
}
