import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const admin = readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

describe("admin dashboard section selector", () => {
  it("replaces the horizontal scrolling tab strip with one accessible dropdown", () => {
    expect(admin).toContain('from "@/components/ui/select"');
    expect(admin).toContain('id="admin-dashboard-section"');
    expect(admin).toContain('aria-label="Choose an admin dashboard section"');
    expect(admin).toContain('<Select value={tab} onValueChange={(value) => setTab(value as Tab)}>');
    expect(admin).toContain('tabs.map((t) => (');
    expect(admin).toContain('<SelectItem');
    expect(admin).not.toContain('max-w-[1500px] mx-auto px-6 flex gap-0 items-center justify-between overflow-x-auto');
  });

  it("retains all existing administration sections and their selected-tab actions", () => {
    for (const marker of [
      'id: "waitlist"',
      'id: "businesses"',
      'id: "members"',
      'id: "reviews"',
      'id: "reports"',
      'id: "directory-imports"',
      'tab === "waitlist"',
      'tab === "businesses"',
      'Export CSV',
      'Add Business',
    ]) {
      expect(admin).toContain(marker);
    }
  });
});
