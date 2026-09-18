import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("social profile hub", () => {
  const profile = source("../pages/profile.tsx");
  const app = source("../App.tsx");

  it("puts information-first social sections on the member's profile home", () => {
    expect(profile).toContain('aria-label="Social profile hub"');
    expect(profile).toContain('label: "Overview"');
    expect(profile).toContain('label: "Activity"');
    expect(profile).toContain('label: "Saved"');
    expect(profile).toContain('label: "Circles"');
    expect(profile).toContain('label: "Account & settings"');
    expect(profile).toContain("At a glance");
    expect(profile).toContain("Photos & videos");
    expect(profile).toContain("A separate profile media gallery is not available");
    expect(profile).toContain('href="/connections"');
    expect(profile).toContain('href="/community"');
    expect(profile).toContain('href="/circles"');
    expect(profile).toContain("api/reviews/mine");
    expect(profile).toContain("api/community/posts?authorId=${userId}&limit=1");
  });

  it("keeps privacy, account controls, badges, and routes reachable rather than replacing them", () => {
    expect(profile).toContain('id="legacy-account-controls"');
    expect(profile).toContain("Profile Visibility");
    expect(profile).toContain("api/auth/user/privacy");
    expect(profile).toContain("Change Password");
    expect(profile).toContain("All Devices");
    expect(profile).toContain("Sign Out");
    expect(profile).toContain('id="legacy-community-badges"');
    expect(profile).toContain("<BadgePanel");
    expect(profile).toContain('href="/business-dashboard"');
    expect(app).toContain('<Route path="/profile">');
    expect(app).toContain('<Route path="/connections">');
    expect(app).toContain('<Route path="/circles">');
    expect(app).toContain('<Route path="/messages">');
  });
});
