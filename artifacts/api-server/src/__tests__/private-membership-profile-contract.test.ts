import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("private membership profile contract", () => {
  const usersRoute = source("../routes/users.ts");
  const webProfile = source("../../../web/src/pages/profile.tsx");
  const nativeProfile = source("../../../mobile/app/(tabs)/profile.tsx");
  const publicWebProfile = source("../../../web/src/pages/member-profile.tsx");
  const publicNativeProfile = source("../../../mobile/app/user-profile/[userId].tsx");

  it("returns effective membership only to the authenticated account owner", () => {
    expect(usersRoute).toContain('router.get("/users/me/membership-status"');
    expect(usersRoute).toContain('res.status(401).json({ error: "Authentication required" });');
    expect(usersRoute).toContain("const membershipTier = await getUserTier(req.user.id);");
    expect(usersRoute).toContain("membershipLabel: TIER_DISPLAY[membershipTier]");
  });

  it("keeps tiers out of public profile response and public profile surfaces", () => {
    const publicRoute = usersRoute.slice(usersRoute.indexOf('router.get("/users/:userId/profile"'));
    expect(publicRoute).not.toContain("membershipTier");
    expect(publicRoute).not.toContain("membershipLabel");
    expect(publicWebProfile).not.toContain("membershipLabel");
    expect(publicNativeProfile).not.toContain("membershipLabel");
  });

  it("shows the account owner their effective tier across web, iOS, and Android", () => {
    expect(webProfile).toContain("/api/users/me/membership-status");
    expect(webProfile).toContain("Your membership · {membershipLabel}");
    expect(nativeProfile).toContain("/api/users/me/membership-status");
    expect(nativeProfile).toContain("Your membership · {membershipLabel}");
  });

  it("keeps an authenticated profile read read-only without stripping stored profile fields", () => {
    const ownProfileRoute = usersRoute.slice(
      usersRoute.indexOf('router.get("/users/me", async'),
      usersRoute.indexOf('router.get("/users/check-username/:username"'),
    );

    expect(ownProfileRoute).toContain('if (!req.user?.id)');
    expect(ownProfileRoute).toContain('res.status(401).json({ error: "Authentication required" });');
    expect(ownProfileRoute).toContain('.from(usersTable)');
    expect(ownProfileRoute).toContain('.where(eq(usersTable.id, req.user.id));');
    expect(ownProfileRoute).toContain('res.status(404).json({ error: "User not found" });');
    expect(ownProfileRoute).toContain('const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;');
    expect(ownProfileRoute).toContain('res.json(safeUser);');
    expect(ownProfileRoute).not.toContain("db.update");
    expect(ownProfileRoute).not.toContain("Date.now");
    expect(ownProfileRoute).not.toContain("90 * 24 * 60 * 60 * 1000");
    expect(ownProfileRoute).not.toContain("Auto-start 90-day community premium trial");
    expect(ownProfileRoute).not.toContain("if (!user.trialEndsAt)");
  });
});
