import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

describe("Safety Hub fail-closed alert contracts", () => {
  it("keeps new Safety Tips pending, non-public, and non-notifying", () => {
    const tips = source("../routes/safety-tips.ts");
    expect(tips).toMatch(/router\.post\(\s*"\/safety-tips",\s*reportLimiter/);
    expect(tips).toContain('"[safety-tips] submitted pending review"');
    expect(tips).not.toContain("sendPushToAllMembers");
    expect(tips).toContain('where(eq(safetyTipsTable.status, "confirmed"))');
    expect(tips).toContain("lat < -90 || lat > 90 || lng < -180 || lng > 180");
    expect(tips).not.toContain("address: tip.address");
    expect(tips).not.toContain("description: tip.description");
  });

  it("does not turn unreviewed unsafe-space reports into public warnings", () => {
    const reports = source("../routes/space-reports.ts");
    expect(reports).toContain("status = 'actioned'");
    expect(reports).not.toContain("status != 'dismissed'");
  });

  it("mounts the canonical preference route before legacy user routes", () => {
    const index = source("../routes/index.ts");
    expect(index.indexOf("router.use(userSettingsRouter);")).toBeLessThan(
      index.indexOf("router.use(usersRouter);"),
    );
  });
});
