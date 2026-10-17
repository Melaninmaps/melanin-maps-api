import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationsSource = readFileSync(
  fileURLToPath(new URL("../startup-migrations.ts", import.meta.url)),
  "utf8",
);

describe("isolated staging administrator bootstrap guard startup registration", () => {
  it("installs the guarded database boundary before any tester recovery writer can run", () => {
    const importIndex = migrationsSource.indexOf(
      "ensureIsolatedStagingAdminBootstrapGuard",
    );
    const guardCallIndex = migrationsSource.indexOf(
      "await ensureIsolatedStagingAdminBootstrapGuard(pool)",
    );
    const testerRecoveryIndex = migrationsSource.indexOf(
      "await ensureFounderApprovedTesterAccessRecovery(log, warn)",
    );

    expect(importIndex).toBeGreaterThan(-1);
    expect(guardCallIndex).toBeGreaterThan(-1);
    expect(testerRecoveryIndex).toBeGreaterThan(guardCallIndex);
  });
});
