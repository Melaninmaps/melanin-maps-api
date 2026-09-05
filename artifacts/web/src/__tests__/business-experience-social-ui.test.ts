import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("website business experience", () => {
  it("routes Share Your Experience to the single governed panel", () => {
    const detail = source("../pages/business-detail.tsx");
    expect(detail).toContain('getElementById("community-experience")');
    expect(detail).toContain("<CommunityVibes");
    expect(detail).not.toContain("handleVibeToggle");
    expect(detail).not.toContain("handleCaptionToggle");
  });

  it("shows immediate positive feedback, category policy, price, and optional diaspora wording", () => {
    const panel = source("../features/businesses/CommunityVibes.tsx");
    expect(panel).toContain("/community-feedback");
    expect(panel).toContain("Choose up to two");
    expect(panel).toContain("data.ownerChoices.price");
    expect(panel).toContain("Owner-provided price");
    expect(panel).toContain("Community price estimate");
    expect(panel).toContain("Different wording is shown only when you select it");
    expect(panel).toContain("Positive quick tags appear right away");
  });

  it("gives claimed owners a searchable, optional ownership editor", () => {
    const dashboard = source("../pages/business-dashboard.tsx");
    const editor = source("../features/businesses/BusinessOwnershipEditor.tsx");
    expect(dashboard).toContain("<BusinessOwnershipEditor");
    expect(editor).toContain("OWNERSHIP_DESIGNATIONS");
    expect(editor).toContain("Optional self-identification");
    expect(editor).toContain("verification remains separate");
  });

  it("lets claimed owners set two category-aware tags and an honest price point", () => {
    const dashboard = source("../pages/business-dashboard.tsx");
    const editor = source("../features/businesses/BusinessExperienceEditor.tsx");
    expect(dashboard).toContain("<BusinessExperienceEditor");
    expect(editor).toContain("getBusinessExperiencePolicy");
    expect(editor).toContain("current.length < 2");
    expect(editor).toContain("priceKey");
    expect(editor).toContain("Community feedback remains separate");
  });
});

describe("website social video choices", () => {
  it("supports Twitch and Snapchat while honoring member platform preferences", () => {
    const media = source("../components/community/CommunityMedia.tsx");
    const profile = source("../features/profile/SocialVideoPreferences.tsx");
    expect(media).toContain("getTwitchPlayerUrl");
    expect(media).toContain("detectSocialVideoPlatform");
    expect(media).toContain("allows(detectSocialVideoPlatform(url))");
    expect(profile).toContain("SOCIAL_VIDEO_PLATFORM_OPTIONS");
    expect(profile).toContain("api/users/me/content-preferences");
  });

  it("lets community members paste all supported public social links", () => {
    const community = source("../pages/community.tsx");
    expect(community).toContain("Twitch, Snapchat");
  });

  it("opens only allowlisted HTTPS creator links from business details", () => {
    const detail = source("../pages/business-detail.tsx");
    expect(detail).toContain("detectSocialVideoPlatform(c.source_url");
    expect(detail).toContain("safeExternalProfileUrl(c.source_url, detected)");
    expect(detail).toContain('target="_blank"');
    expect(detail).toContain('rel="noopener noreferrer"');
  });
});
