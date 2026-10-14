import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("profile social entry points", () => {
  const memberProfile = source("../../../mobile/app/user/[id].tsx");
  const ownProfile = source("../../../mobile/app/(tabs)/profile.tsx");
  const socialRecap = source("../../../mobile/components/MemberSocialProfileRecap.tsx");
  const webMemberProfile = source("../../../web/src/pages/member-profile.tsx");
  const conversations = source("../routes/conversations.ts");

  it("starts profile DMs through the server-authorized conversation endpoint", () => {
    expect(memberProfile).toContain('fetch(`${getApiBase()}/api/conversations`, {');
    expect(memberProfile).toContain('type: "dm"');
    expect(memberProfile).toContain("participantId: id");
    expect(memberProfile).toContain("Message unavailable");
    expect(memberProfile).toContain(">Message</Text>");
    expect(conversations).toContain("if (!recipient.allowDm)");
    expect(conversations).toContain("usersAreBlocked(req.user.id, recipient.id)");
  });

  it("routes the profile Circle action to Circle creation, not Community", () => {
    expect(ownProfile).toContain('label: "Start a Kinfolk Circle", route: "/circles/create"');
    expect(ownProfile).not.toContain('label: "Start a Kinfolk Circle", route: "/(tabs)/community"');
  });

  it("renders only server-consented visitor facts, covers, and earned badges", () => {
    expect(memberProfile).toContain("profile.coverUrl && canSeeContent");
    expect(memberProfile).toContain("earnedBadges.length > 0 && canSeeContent");
    expect(memberProfile).toContain("profile.location || profile.age || profile.birthday");
    expect(socialRecap).toContain("post.visibility !== \"public\" && post.visibility !== \"followers_only\"");
    expect(webMemberProfile).toContain("profile?.coverUrl");
    expect(webMemberProfile).toContain("data?.canSeeContent");
    expect(webMemberProfile).toContain("data?.badges");
    expect(webMemberProfile).toContain("profile.location");
  });
});
