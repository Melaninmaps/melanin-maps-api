import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const indexSource = readFileSync(
  fileURLToPath(new URL("../../index.ts", import.meta.url)),
  "utf8",
);
const appSource = readFileSync(
  fileURLToPath(new URL("../../app.ts", import.meta.url)),
  "utf8",
);

describe("isolated community verification startup", () => {
  it("returns before all unrelated startup activity", () => {
    const guard = indexSource.indexOf("if (isCommunityVerificationIsolatedTest()) {");
    expect(guard).toBeGreaterThan(-1);

    for (const routine of [
      "initPoolInstrumentation(pool, getPool)",
      "startDirectoryPublicationWorker(directoryReviewPool, pool)",
      "startHealthMonitor()",
      "initStripe().catch",
      "startLatinxLehighValleyPublication(pool",
      "runStartupMigrations(logger)",
      "seedLibraryStarterTopics(pool)",
      "seedLibraryStarterEntries(pool)",
      "startCityHealthAlertScheduler()",
      "startNudgeCronScheduler()",
      "startLibraryGrowthWorker()",
      "startCityRequestFlush()",
    ]) {
      expect(indexSource.indexOf(routine)).toBeGreaterThan(guard);
    }
  });

  it("does not initialize directory review or the unrelated Places lookup route", () => {
    expect(appSource).toContain(
      "export const directoryReviewPool = isCommunityVerificationIsolatedTest()",
    );
    expect(appSource).toContain(
      "if (!isCommunityVerificationIsolatedTest() && assertDirectoryReviewLocalStaging(process.env))",
    );
    expect(appSource).toContain(
      "if (!isCommunityVerificationIsolatedTest()) {\n  registerEssentialServicesRoute",
    );
    expect(indexSource).toContain(
      "const directoryReviewEnabled = !isCommunityVerificationIsolatedTest()",
    );
  });
});
