import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("website member social experience", () => {
  const app = source("../../../web/src/App.tsx");
  const community = source("../../../web/src/pages/community.tsx");
  const memberProfile = source("../../../web/src/pages/member-profile.tsx");
  const messages = source("../../../web/src/pages/messages.tsx");
  const users = source("../routes/users.ts");
  const conversations = source("../routes/conversations.ts");

  it("provides protected website routes from Community to a member profile and message center", () => {
    expect(app).toContain('path="/members/:userId"');
    expect(app).toContain('path="/messages"');
    expect(app).toContain("<PreLaunchRoute><MemberProfile /></PreLaunchRoute>");
    expect(app).toContain("<PreLaunchRoute><Messages /></PreLaunchRoute>");
    expect(community).toContain("function memberProfilePath(userId: string): string {");
    expect(community).toContain("return `/members/${encodeURIComponent(userId)}`;");
    expect(community).toContain("href={memberProfilePath(post.authorId)}");
  });

  it("starts and displays messages only through server-authorized conversation endpoints", () => {
    expect(memberProfile).toContain('authenticatedFetch(`${BASE}api/conversations`');
    expect(memberProfile).toContain('type: "dm", participantId: profile.id');
    expect(memberProfile).toContain("canReceiveDirectMessages");
    expect(messages).toContain('authenticatedFetch(`${BASE}api/conversations`)');
    expect(messages).toContain('api/conversations/${selected.id}/messages');
    expect(messages).toContain('api/conversations/${selected.id}/${action}');
    expect(conversations).toContain("conversationHasParticipant(conv, req.user.id)");
    expect(conversations).toContain("usersAreBlocked(req.user.id, recipient.id)");
  });

  it("returns only a message availability hint while retaining API enforcement", () => {
    expect(users).toContain("canReceiveDirectMessages: Boolean(callerId && callerId !== targetId && allowDm)");
    expect(users).toContain("const { followersCount, followingCount, allowDm } = user;");
    expect(users).toContain("const visibleProfile = canSeeContent ? contentProfile : identityProfile;");
    expect(conversations).toContain("if (!recipient.allowDm)");
  });

  it("uses the same guarded profile for owner controls, visitor activity, follow state, and tag removal", () => {
    expect(memberProfile).toContain('api/community/posts?authorId=${encodeURIComponent(userId)}&limit=20');
    expect(memberProfile).toContain("if (!profileResponse.canSeeContent)");
    expect(memberProfile).toContain('api/users/${encodeURIComponent(profile.id)}/follow');
    expect(memberProfile).toContain('href="/profile"');
    expect(memberProfile).toContain("Edit my profile");
    expect(memberProfile).toContain('api/profile-tags/${encodeURIComponent(tagId)}');
    expect(memberProfile).toContain("canManageProfileTag(tag)");
  });
});
