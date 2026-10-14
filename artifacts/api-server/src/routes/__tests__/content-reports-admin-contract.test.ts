import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const contentReports = readFileSync(
  fileURLToPath(new URL("../content-reports.ts", import.meta.url)),
  "utf8",
);

describe("content report administration contract", () => {
  it("keeps direct status and permanent cleanup actions behind the administrator route", () => {
    expect(contentReports).toContain('router.patch("/admin/content-reports/:id"');
    expect(contentReports).toContain('router.delete("/admin/content-reports/:id"');
    expect(contentReports).toContain("ADMIN_EMAILS.includes(req.user.email)");
    expect(contentReports).toContain("Admin deleted content report");
  });
});
