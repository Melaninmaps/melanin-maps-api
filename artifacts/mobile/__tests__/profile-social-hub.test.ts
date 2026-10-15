import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("mobile social profile hub", () => {
  const profile = source("../app/(tabs)/profile.tsx");
  const settings = source("../app/settings.tsx");
  const memberProfile = source("../app/user/[id].tsx");
  const legacyMemberProfile = source("../app/user-profile/[userId].tsx");
  const connections = source("../app/connections.tsx");
  const layout = source("../app/_layout.tsx");
  const socialRecap = source("../components/MemberSocialProfileRecap.tsx");
  const displaySettings = source("../app/profile-presentation-settings.tsx");

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
    expect(settings).toContain('label: "KinfolkAI Settings"');
    expect(settings).toContain('route: "/kinfolk-settings"');
    expect(settings).toContain('accessibilityLabel="Open KinfolkAI Settings"');
    expect(settings).not.toContain('title: "Your Spaces"');
    expect(profile).toContain("Private Account");
    expect(memberProfile).toContain("if (!profile?.id || !canSeeContent)");
    expect(memberProfile).toContain("This profile is private. Follow requests must be accepted before activity is shown.");
    expect(memberProfile).toContain("profileLoadError === \"retry\"");
    expect(memberProfile).toContain('pathname: "/chat/[id]"');
    expect(legacyMemberProfile).toContain('pathname: "/user/[id]"');
    expect(connections).not.toContain("/user-profile/");
    expect(connections).toContain("/user/${u.id}");
    expect(layout).toContain('name="connections"');
    expect(layout).toContain('name="circles"');
    expect(layout).toContain('name="settings"');
    expect(layout).toContain('name="privacy"');
  });

  it("makes a real Community recap the primary profile while moving optional display details to settings", () => {
    expect(profile).toContain("MemberSocialProfileRecap");
    expect(profile).toContain("class ProfileSurfaceBoundary");
    expect(profile).toContain("Your profile could not open right now.");
    expect(profile).toContain("setProfileSurfaceRetryKey((current) => current + 1)");
    expect(profile).toContain("<ProfileSurfaceBoundary");
    expect(layout).toContain('name="profile-presentation-settings"');
    expect(profile).toContain("{false && <>");
    expect(settings).toContain('label: "Profile Display & Badges"');
    expect(settings).toContain('route: "/profile-presentation-settings"');
    expect(layout).toContain('name="profile-presentation-settings"');
    expect(socialRecap).toContain("taggedUserId");
    expect(socialRecap).toContain("Photos & videos");
    expect(socialRecap).toContain("CommunityPostCard");
    expect(socialRecap).toContain("getMemberApiHeaders");
    expect(socialRecap).toContain('post.visibility !== "public" && post.visibility !== "followers_only"');
    expect(displaySettings).toContain("showProfessionalDetails");
    expect(displaySettings).toContain("showBadges");
    expect(displaySettings).toContain("The profile will never show unearned badges or achievement progress.");
    expect(displaySettings).toContain("profile-cover");
  });

  it("shows only server-authorized visitor activity with separate media and tagged sections", () => {
    expect(memberProfile).toContain("taggedUserId=${encodeURIComponent(id)}");
    expect(memberProfile).toContain('type ProfileTab = "posts" | "media" | "tagged" | "notes"');
    expect(memberProfile).toContain("canReceiveDirectMessages");
    expect(memberProfile).toContain("setCanSeeContent(!profile.isPrivate)");
    expect(memberProfile).toContain("Community visibility, block, moderation, and group checks");
    expect(memberProfile).toContain("No visible tagged activity yet");
  });

  it("places a permitted bio immediately after the member name before profile metadata", () => {
    const nameIndex = memberProfile.indexOf('<View style={s.nameRow}>');
    const bioIndex = memberProfile.indexOf('{profile.bio && canSeeContent && (');
    const badgeIndex = memberProfile.indexOf('{memberBadge && (');
    expect(nameIndex).toBeGreaterThan(-1);
    expect(bioIndex).toBeGreaterThan(nameIndex);
    expect(badgeIndex).toBeGreaterThan(bioIndex);
  });

  it("shows member-owned business access from the approved managed-business endpoint", () => {
    expect(profile).toContain("function MyBusinessAccessCard");
    expect(profile).toContain('api/businesses/mine/managed');
    expect(profile).toContain("Approved businesses connected to this account");
    expect(profile).toContain("Checking your business access…");
    expect(profile).toContain("Your business access could not load.");
    expect(profile).toContain('router.push("/business-owner" as any)');
    expect(profile).toContain("<MyBusinessAccessCard");
  });
});
