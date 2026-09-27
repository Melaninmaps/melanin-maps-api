import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("public profile membership display contract", () => {
  const usersRoute = source("../routes/users.ts");
  const webMemberProfile = source("../../../web/src/pages/member-profile.tsx");
  const mobileMemberProfile = source("../../../mobile/app/user-profile/[userId].tsx");
  const mobileVisitorProfile = source("../../../mobile/app/user/[id].tsx");

  it("uses the existing effective tier resolver so approved business owners retain their higher active tier", () => {
    expect(usersRoute).toContain('import { getUserTier, TIER_DISPLAY } from "../middleware/requireMembership";');
    expect(usersRoute).toContain("const membershipTier = await getUserTier(targetId)");
    expect(usersRoute).toContain("const membershipLabel = TIER_DISPLAY[membershipTier];");
    expect(usersRoute).toContain("user: { ...publicProfile, membershipTier, membershipLabel }");
    expect(usersRoute).toContain("profile: { ...publicProfile, membershipTier, membershipLabel }");
    expect(usersRoute).not.toContain("stripeSubscriptionId: usersTable.stripeSubscriptionId");
  });

  it("renders the same explicit membership label on web, iOS, and Android public profile surfaces", () => {
    expect(webMemberProfile).toContain("Membership · {profile.membershipLabel}");
    expect(mobileMemberProfile).toContain("Membership · {profile.membershipLabel}");
    expect(mobileVisitorProfile).toContain("Membership · {membershipLabel}");
  });
});
