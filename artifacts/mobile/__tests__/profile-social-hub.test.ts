import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("mobile social profile hub", () => {
  const profile = source("../app/(tabs)/profile.tsx");
  const settings = source("../app/settings.tsx");
  const memberProfile = source("../app/user-profile/[userId].tsx");
  const layout = source("../app/_layout.tsx");

  it("keeps social sections as quick links to existing mobile capabilities", () => {
    expect(profile).toContain("Your social hub");
    expect(profile).toContain('label: "Connections"');
    expect(profile).toContain('route: "/connections"');
    expect(profile).toContain('label: "Community activity"');
    expect(profile).toContain('route: "/(tabs)/community"');
    expect(profile).toContain('label: "Saved places"');
    expect(profile).toContain('route: "/dashboard"');
    expect(profile).toContain('label: "Circles"');
    expect(profile).toContain('route: "/circles"');
    expect(profile).toContain('label: "Privacy & safety"');
    expect(profile).toContain('route: "/privacy"');
    expect(profile).toContain('label: "Account settings"');
    expect(profile).toContain('route: "/settings"');
    expect(profile).toContain('route: "/business-owner"');
  });

  it("preserves settings and enforces the profile activity privacy response before loading posts", () => {
    expect(settings).toContain('route: "/privacy"');
    expect(settings).toContain('route: "/(tabs)/profile"');
    expect(profile).toContain("Private Account");
    expect(memberProfile).toContain("const permitted = data.canSeeContent === true");
    expect(memberProfile).toContain("if (!permitted)");
    expect(memberProfile).toContain("Follow requests must be accepted before activity is shown.");
    expect(memberProfile).toContain("isAuthenticated && canSeeContent");
    expect(layout).toContain('name="connections"');
    expect(layout).toContain('name="circles"');
    expect(layout).toContain('name="settings"');
    expect(layout).toContain('name="privacy"');
  });
});
