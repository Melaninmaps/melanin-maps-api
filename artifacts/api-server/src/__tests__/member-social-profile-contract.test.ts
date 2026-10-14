import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("member social profile presentation", () => {
  const users = source("../routes/users.ts");
  const presentation = source("../social/memberProfilePresentation.ts");
  const community = source("../routes/community.ts");
  const feed = source("../community/communityFeed.ts");
  const migrations = source("../lib/startup-migrations.ts");

  it("keeps optional personal profile details private until a member explicitly opts in", () => {
    expect(presentation).toContain("DEFAULT_MEMBER_PROFILE_PRESENTATION");
    expect(presentation).toContain("showAge: false");
    expect(presentation).toContain("showBirthday: false");
    expect(presentation).toContain("showLocation: false");
    expect(presentation).toContain("showProfessionalDetails: false");
    expect(presentation).toContain("showBadges: false");
    expect(presentation).toContain("canPresentOptionalPersonalDetails");
    expect(users).toContain('router.put("/users/me/profile-presentation"');
    expect(users).toContain("canShowOptionalDetails && presentation.showProfessionalDetails");
    expect(users).toContain("...(canSeeContent ? { followersCount, followingCount } : {})");
    expect(users).toContain("public profiles and accepted followers may see them");
  });

  it("uses authenticated no-store cover delivery instead of a public object URL", () => {
    const coverRoutes = users.slice(
      users.indexOf('router.post("/users/me/profile-cover"'),
      users.indexOf('router.patch("/users/me/privacy"'),
    );
    expect(users).toContain('router.post("/users/me/profile-cover"');
    expect(users).toContain('router.get("/users/:userId/profile-cover"');
    expect(coverRoutes).toContain('res.setHeader("Cache-Control", "private, no-store")');
    expect(coverRoutes).toContain("targetUser.isPrivate");
    expect(coverRoutes).toContain("getMemberProfilePresentation(targetId)");
    expect(coverRoutes).not.toContain("makePublic");
  });

  it("persists only authorized member tags and rereads authorization for profile retrieval", () => {
    expect(migrations).toContain("community_post_member_tags_v1");
    expect(community).toContain("Community post member-tag persistence unavailable");
    expect(community).toContain("target.is_private");
    expect(community).toContain("taggedUserId");
    expect(feed).toContain("input.taggedUserId");
    expect(feed).toContain("community_post_member_tags_v1 profile_tags");
    expect(feed).toContain("postIsVisibleInCommunityFeed");
    expect(feed).toContain("currentGroupMembership");
    expect(feed).toContain("Group check is repeated for every read so removal revokes access");
    expect(feed).toContain("notBlocked");
    expect(feed).toContain("POST_REQUIRES_MODERATION");
  });
});
