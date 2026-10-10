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
    expect(profile).not.toContain('label: "Privacy & safety"');
    expect(profile).not.toContain('label: "Account settings"');
    expect(profile).not.toContain('const SETTINGS = [');
    expect(profile).not.toContain('<PrivacyToggleCard user=');
    expect(profile).not.toContain('<SafetyAlertPrefsCard colors=');
  });

  it("keeps Profile settings behind the gear and preserves the profile activity privacy response", () => {
    expect(settings).toContain('route: "/privacy"');
    expect(settings).toContain('route: "/(tabs)/profile"');
    expect(settings).toContain('label: "KinfolkAI™"');
    expect(settings).toContain('route: "/kinfolk-settings"');
    // Settings intentionally stays a two-section, mutually-exclusive control
    // center. Social and contribution links remain reachable within App Settings
    // rather than reviving a third accordion.
    expect(settings).not.toContain('title: "Your Spaces"');
    expect(settings).toContain('label: "Chat with KinfolkAI™"');
    expect(settings).toContain('route: "/travel"');
    expect(settings).toContain('route: "/circles"');
    expect(settings).toContain('route: "/creator-profile"');
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
