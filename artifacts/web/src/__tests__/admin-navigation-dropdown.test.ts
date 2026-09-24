import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const admin = readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

describe("admin dashboard section selector", () => {
  it("retains the accessible dropdown without restoring the horizontal scrolling tab strip", () => {
    expect(admin).toContain('from "@/components/ui/select"');
    expect(admin).toContain('id="admin-dashboard-section"');
    expect(admin).toContain('aria-label="Choose an admin dashboard section"');
    expect(admin).toContain('<Select value={tab} onValueChange={(value) => selectDashboardSection(value as Tab)}>');
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

  it("provides direct keyboard-accessible list controls without relying on the dropdown", () => {
    for (const marker of [
      "const openWaitlistSection",
      "const selectDashboardSection",
      'onClick={() => openWaitlistSection()}',
      'onClick={() => openWaitlistSection("pending")}',
      'onClick={() => selectDashboardSection("businesses")}',
      'onClick={() => selectDashboardSection("users")}',
      'aria-label="Quick dashboard sections"',
      'aria-pressed={tab === item.id}',
      "focus-visible:ring-2",
      "Open list",
    ]) {
      expect(admin).toContain(marker);
    }
  });

  it("makes the unified waitlist join surface readable for each person", () => {
    for (const marker of [
      "WAITLIST_SOURCE_LABELS",
      'web: "Website"',
      'ios: "iOS app"',
      'android: "Android app"',
      "formatWaitlistSignupSources(entry.signupSources)",
      "Joined from more than one surface",
      "Website, iOS, and Android joins are one email-keyed list",
    ]) {
      expect(admin).toContain(marker);
    }
  });

  it("retains reversible administrator lifecycle and App Store reconciliation controls", () => {
    for (const marker of [
      "const reconcileIosWaitlistRegistrations",
      "Add App Store signups",
      "Hidden / archived",
      "updateUserLifecycle",
      '"hide" | "suspend" | "restore"',
      "View hidden accounts",
      "Hide keeps the account and activity for records",
      "Archive from view",
    ]) {
      expect(admin).toContain(marker);
    }
    expect(admin).not.toContain("Permanently delete user");
  });
});
