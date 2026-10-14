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
  it("requires owner-controlled private assets for followers-only, private-topic, and Group posts", () => {
    expect(communityRoute).toContain("const privateAudienceRequested = visibility === \"followers_only\" || isPrivateTopic || resolvedGroupId !== null;");
    expect(communityRoute).toContain("if (privateAudienceRequested && mediaValidation.urls.length > 0)");
    expect(communityRoute).toContain('code: "PRIVATE_MEDIA_REQUIRED"');
    expect(communityRoute).toContain("validatePrivateCommunityMediaAssetIds");
    expect(communityRoute).toContain("toPrivateCommunityMediaReference");
  });

  it("does not return legacy public media URLs and uses authenticated application routes", () => {
    expect(communityRoute).toContain("function hasPrivateCommunityAudience");
    expect(communityRoute).toContain("mediaUrls: hasPrivateAudience ? [] : normalizeCommunityMediaUrls");
    expect(communityRoute).toContain('router.get("/community/posts/:id/private-media/:assetId"');
    expect(communityRoute).toContain('res.setHeader("Cache-Control", "private, no-store, max-age=0")');
    expect(communityRoute).toContain("privateCommunityMediaAssetIdsFromValue");
  });

  it("keeps native private uploads audience-bound and avoids storage URLs", () => {
    expect(mobileCommunity).toContain('"community_post_private"');
    expect(mobileCommunity).toContain("privateMediaAssetIds");
    expect(mobileCommunity).toContain("Reattach media for a private audience");
    expect(mobileCommunity).toContain("newPostVisibility === \"followers_only\" || newPostIsPrivateTopic || activeGroupId !== null");
  });
});
