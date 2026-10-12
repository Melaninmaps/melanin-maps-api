import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web member profile presentation controls", () => {
  const profile = source("../pages/profile.tsx");
  const controls = source("../components/profile/ProfilePresentationControls.tsx");

  it("places member-controlled optional presentation settings behind the profile settings panel", () => {
    expect(profile).toContain("ProfilePresentationControls");
    expect(controls).toContain("/api/users/me/profile-presentation");
    expect(controls).toContain("showProfessionalDetails");
    expect(controls).toContain("showBadges");
    expect(controls).toContain("/api/users/me/profile-cover");
    expect(controls).toContain('credentials: "include"');
    expect(controls).toContain("Progress stays private");
    expect(controls).toContain("age-safety requirements");
  });
});
