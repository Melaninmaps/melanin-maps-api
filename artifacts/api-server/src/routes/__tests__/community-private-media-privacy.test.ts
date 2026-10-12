import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const communityRoute = readFileSync(
  fileURLToPath(new URL("../community.ts", import.meta.url)),
  "utf8",
);
const mobileCommunity = readFileSync(
  fileURLToPath(new URL("../../../../mobile/app/(tabs)/community.tsx", import.meta.url)),
  "utf8",
);

describe("private Community media privacy boundary", () => {
  it("refuses new public-bucket media on followers-only, private-topic, and Group posts", () => {
    expect(communityRoute).toContain("const privateAudienceRequested = visibility === \"followers_only\" || isPrivateTopic || resolvedGroupId !== null;");
    expect(communityRoute).toContain("if (privateAudienceRequested && mediaValidation.urls.length > 0)");
    expect(communityRoute).toContain('code: "PRIVATE_MEDIA_UNAVAILABLE"');
    expect(communityRoute).toContain("General Community uploads use public delivery");
  });

  it("does not return legacy public media URLs within a private Community audience", () => {
    expect(communityRoute).toContain("function hasPrivateCommunityAudience");
    expect(communityRoute).toContain("mediaUrls: hasPrivateAudience ? [] : normalizeCommunityMediaUrls");
    expect(communityRoute).toContain("mediaUrls: hasPrivateCommunityAudience(r) ? [] : normalizeCommunityMediaUrls");
  });

  it("keeps the native composer truthful before a member uploads or changes privacy", () => {
    expect(mobileCommunity).toContain("Private Community media isn't available yet");
    expect(mobileCommunity).toContain("Remove media before changing privacy");
    expect(mobileCommunity).toContain("Remove media before making this topic private");
    expect(mobileCommunity).toContain("newPostVisibility === \"followers_only\" || newPostIsPrivateTopic || activeGroupId !== null");
  });
});
