import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  fileURLToPath(new URL("../app/business-dashboard.tsx", import.meta.url)),
  "utf8",
);

describe("Business Dashboard canonical owner skip insights", () => {
  it("uses only the owner-bound canonical skip-feedback endpoint with the session token", () => {
    expect(dashboardSource).toContain("/api/businesses/mine/skip-feedback");
    expect(dashboardSource).not.toContain("/api/kinfolk/skip-feedback");
    expect(dashboardSource).toContain(
      'fetch(`${base}/api/businesses/mine/skip-feedback`, { headers: { Authorization: `Bearer ${token}` } })',
    );
  });

  it("preserves feedback-shape consumption and non-OK recovery without cross-business selection", () => {
    expect(dashboardSource).toContain(".then((r) => r.ok ? r.json() : null)");
    expect(dashboardSource).toContain("{ feedback?: { id: string; message: string; createdAt: string }[] }");
    expect(dashboardSource).toContain("if (d?.feedback) setSkipFeedback(d.feedback);");
    expect(dashboardSource).not.toContain("skip-feedback/${business.id}");
  });

  it("keeps the existing bounded rendering cap for owner feedback", () => {
    expect(dashboardSource).toContain("skipFeedback.slice(0, 5).map((item) => (");
    expect(dashboardSource).toContain("skipFeedback.length > 5");
  });
});
