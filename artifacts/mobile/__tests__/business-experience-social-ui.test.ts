import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("Expo business experience", () => {
  it("routes Share Your Experience to one category-aware experience card", () => {
    const detail = source("../app/business/[id].tsx");
    expect(detail).toContain("<BusinessExperienceCard");
    expect(detail).toContain("experienceYRef.current");
    expect(detail).toContain("scrollTo");
    expect(detail).not.toContain("captionSheetOpen");
  });

  it("supports two atmosphere tags, two quick reviews, one price, and opt-in diaspora wording", () => {
    const card = source("../components/BusinessExperienceCard.tsx");
    expect(card).toContain("/community-feedback");
    expect(card).toContain("Choose up to two");
    expect(card).toContain("data.ownerChoices.price");
    expect(card).toContain("Owner-provided price");
    expect(card).toContain("Community price estimate");
    expect(card).toContain("Different wording is shown only when you select it");
  });

  it("lets claimed owners select governed ownership labels and two relevant profile tags", () => {
    const identity = source("../app/business-owner/identity.tsx");
    const tags = source("../app/business-owner/vibe-tags.tsx");
    expect(identity).toContain("OWNERSHIP_DESIGNATIONS");
    expect(identity).toContain("Search ownership labels");
    expect(tags).toContain("getBusinessExperiencePolicy");
    expect(tags).toContain('Alert.alert("Choose up to 2"');
    expect(tags).toContain("priceChoices");
    expect(tags).toContain("priceKey: selectedPrice");
    expect(tags).toContain("Community members can also share their experience separately");
  });
});

describe("Expo social video choices", () => {
  it("makes Twitch and Snapchat preferences reachable from Settings", () => {
    const settings = source("../app/settings.tsx");
    const preferences = source("../app/social-video-preferences.tsx");
    const hook = source("../hooks/useSocialVideoPreferences.ts");
    expect(settings).toContain("/social-video-preferences");
    expect(preferences).toContain("SOCIAL_VIDEO_PLATFORM_OPTIONS");
    expect(hook).toContain("/api/users/me/content-preferences");
  });

  it("turns a tagged public social link into post media and filters display by member choices", () => {
    const community = source("../app/(tabs)/community.tsx");
    const card = source("../components/CommunityPostCard.tsx");
    expect(community).toContain("taggedSocialVideoUrl");
    expect(community).toContain("postMediaUrls");
    expect(community).toContain("Twitch, Snapchat");
    expect(card).toContain("useSocialVideoPreferences");
    expect(card).toContain("detectSocialVideoPlatform");
    expect(card).toContain("Watch on");
  });

  it("accepts Twitch and public Snapchat links for reviews and owner featured videos", () => {
    const review = source("../components/WriteReviewModal.tsx");
    const featured = source("../app/business-owner/featured-video.tsx");
    expect(review).toContain("Twitch");
    expect(review).toContain("Snapchat");
    expect(featured).toContain("Twitch");
    expect(featured).toContain("Snapchat");
  });
});
