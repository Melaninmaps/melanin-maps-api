import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("Expo business experience", () => {
  it("keeps one category-aware experience form while removing the redundant jump shortcut", () => {
    const detail = source("../app/business/[id].tsx");
    expect(detail).toContain("<BusinessExperienceCard");
    expect(detail).not.toContain("experienceYRef.current");
    expect(detail).not.toContain("style={[styles.rateSafetyBanner");
    expect(detail).not.toContain("captionSheetOpen");
  });

  it("supports two atmosphere tags, two quick reviews, one price, and opt-in diaspora wording", () => {
    const card = source("../components/BusinessExperienceCard.tsx");
    expect(card).toContain("/community-feedback");
    expect(card).toContain("Choose up to two");
    expect(card).toContain("data.ownerChoices.price");
    expect(card).toContain("Owner-provided price");
    expect(card).toContain('group("price", "Price"');
    expect(card).toContain("Different wording is shown only when you select it");
    expect(card).toContain('group("vibe", "Vibe"');
    expect(card).toContain("These same tags support VIBES search");
    expect(card).toContain("accessibilityState={{ expanded: isExpanded }}");
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

  it("shows approved place videos and lets members submit a public video for moderation", () => {
    const detail = source("../app/business/[id].tsx");
    expect(detail).toContain("/contributions");
    expect(detail).toContain("Community posts");
    expect(detail).toContain("Add a public video");
    expect(detail).toContain("Submit for review");
    expect(detail).toContain("detectSocialVideoPlatform(sourceUrl)");
    expect(detail).toContain("after moderation confirms the public link and context");
    expect(detail).toContain("openApprovedContribution(item)");
    expect(detail).toContain("Watch community posts");
    expect(detail).toContain("Share your visit");
  });

  it("keeps the official website near listing identity and consolidates community media actions", () => {
    const detail = source("../app/business/[id].tsx");
    expect(detail).toContain("safeOfficialWebsite");
    expect(detail).toContain("Official website");
    expect(detail).toContain("Community posts");
    expect(detail).toContain("Watch community posts");
    expect(detail).toContain("Share your visit");
    expect(detail).toContain("communityMediaYRef.current");
    expect(detail).not.toContain("Show Me the Vibe");
  });

  it("keeps ownership designations while removing public listing-status disclaimers", () => {
    const detail = source("../app/business/[id].tsx");
    expect(detail).toContain("OwnershipBadges");
    expect(detail).not.toContain("Ownership designations indicate the business is owned and operated 51%");
    expect(detail).not.toContain("This business has not yet claimed its profile");
  });

  it("withholds confidence scores until enough member feedback exists", () => {
    const detail = source("../app/business/[id].tsx");
    const snapshot = source("../components/CommunitySnapshot.tsx");
    const score = source("../components/CommunityConfidenceScore.tsx");
    expect(detail).toContain("MINIMUM_COMMUNITY_SIGNAL");
    expect(detail).toContain("(business.reviewCount ?? 0) >= MINIMUM_COMMUNITY_SIGNAL ? business.safetyRating : null");
    expect(snapshot).toContain("Community scores will appear after at least");
    expect(snapshot).toContain("MINIMUM_COMMUNITY_SIGNAL = 5");
    expect(score).toContain("MINIMUM_COMMUNITY_REVIEWS = 5");
  });

  it("filters business-profile public videos by the member's explicit Video Sources choices", () => {
    const detail = source("../app/business/[id].tsx");
    expect(detail).toContain("useSocialVideoPreferences");
    expect(detail).toContain("visibleContributions");
    expect(detail).toContain("allows(detectSocialVideoPlatform");
    expect(detail).toContain("Choose video sources");
  });
});
