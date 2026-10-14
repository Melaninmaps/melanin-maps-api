import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("member privacy contract", () => {
  const users = source("../routes/users.ts");
  const privacyScreen = source("../../../mobile/app/privacy.tsx");

  it("returns only real, authenticated profile and direct-message controls", () => {
    expect(users).toMatch(/router\.get\("\/users\/me\/privacy"/);
    expect(users).toContain("profileVisibility: user.isPrivate ? \"private\" : \"public\"");
    expect(users).toContain("if (typeof allowDm === \"boolean\") updates.allowDm = allowDm");
    expect(users).toContain("allowDm: usersTable.allowDm");
    expect(privacyScreen).toContain("/api/users/me/privacy");
    expect(privacyScreen).toContain("Allow Direct Messages");
    expect(privacyScreen).not.toContain("/api/users/settings");
    expect(privacyScreen).not.toContain("Usage Analytics");
  });

  it("enforces private profile activity and hides blocked members", () => {
    expect(users).toContain("if (block) { res.status(404).json({ error: \"User not found\" }); return; }");
    expect(users).toContain("const canSeeContent = callerId === targetId || (!user.isPrivate || isFollowing);");
    expect(users).toContain("reviews: canSeeContent ? reviews : []");
    expect(users).toContain("tags: canSeeContent ? tags : []");
    expect(users).toContain("const visibleProfile = canSeeContent ? contentProfile : identityProfile;");
    expect(users).toContain("bio: user.bio,");
    expect(users).toContain("industry: user.industry,");
    expect(users).toContain("jobTitle: user.jobTitle,");
    expect(users).toContain("profile: visibleProfile,");
    expect(users).toContain("canSeeContent,");
  });

  it("does not surface private accounts through member search or suggestions", () => {
    expect(users).toContain("eq(usersTable.isPrivate, false)");
    expect(users).toContain("AND u.is_private = false");
  });

  it("does not let direct profile-tag routes bypass profile privacy or blocks", () => {
    expect(users).toContain('router.post("/users/:userId/tags"');
    expect(users).toContain('router.get("/users/:userId/tags"');
    expect(users).toContain('if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }');
    expect(users).toContain('if (!acceptedFollow) { res.status(403).json({ error: "This profile is private" }); return; }');
    expect(users).toContain('let canSeeTags = callerId === taggedUserId || !target.isPrivate;');
    expect(users).toContain('if (!canSeeTags) { res.json({ tags: [] }); return; }');
  });
});
