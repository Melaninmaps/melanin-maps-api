import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const groupsRoute = source("../routes/groups.ts");
const communityRoute = source("../routes/community.ts");
const communityFeed = source("../community/communityFeed.ts");

function routeBlock(sourceText: string, start: string, end: string): string {
  const from = sourceText.indexOf(start);
  const to = sourceText.indexOf(end, from + start.length);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return sourceText.slice(from, to);
}

describe("Community Feed and My Groups active-membership boundary", () => {
  it("returns the authenticated Group catalog with private and audience eligibility enforced server-side", () => {
    const catalog = routeBlock(groupsRoute, 'router.get("/groups"', 'router.get("/groups/mine"');

    expect(catalog).toContain("if (!requireAuth(req, res)) return;");
    expect(catalog).toContain(".from(groups)");
    expect(catalog).toContain("if (g.isPrivate && !memberGroupIds.has(g.id)) return false;");
    expect(catalog).toContain("const aud = (g.audiencePreferences as string[] | null) ?? [];");
    expect(catalog).toContain("return aud.some((a) => userAudiencePrefs.includes(a));");
    expect(catalog).toContain("groupCatalogRecord(g, memberGroupIds.has(g.id))");
  });

  it("returns My Groups only from an authenticated current-membership join", () => {
    const mine = routeBlock(groupsRoute, 'router.get("/groups/mine"', 'router.get("/groups/my-invites"');

    expect(mine).toContain("if (!requireAuth(req, res)) return;");
    expect(mine).toContain(".from(groupMembers)");
    expect(mine).toContain(".innerJoin(groups, eq(groups.id, groupMembers.groupId))");
    expect(mine).toContain(".where(eq(groupMembers.userId, req.user!.id))");
    expect(mine).toContain("groupCatalogRecord(group, true)");
    expect(mine).not.toContain(".from(groups)\n      .orderBy");
  });

  it("applies membership server-side before returning an exact group post feed", () => {
    const posts = routeBlock(communityRoute, 'router.get("/community/posts"', "// POST /community/posts");

    expect(posts).toContain("requestedGroupId");
    expect(posts).toContain(".where(and(eq(groupMembers.groupId, requestedGroupId), eq(groupMembers.userId, req.user.id)))");
    expect(posts).toContain('res.status(404).json({ error: "Group posts not found" })');
    expect(posts).toContain("fetchGroupCommunityFeedRows");
  });

  it("includes group posts in the Community Feed only through the same active membership table", () => {
    expect(communityFeed).toContain("function postIsVisibleInCommunityFeed");
    expect(communityFeed).toContain("FROM group_members visible_group_membership");
    expect(communityFeed).toContain("visible_group_membership.user_id = ${viewerPlaceholder}");
    expect(communityFeed).toContain("visible_group_membership.group_id = CASE");
    expect(communityFeed).toContain("${POST_IS_NOT_GROUP_ONLY}");
  });

  it("allows authenticated free members to create Groups with the existing finite member cap and creator membership", () => {
    const create = routeBlock(groupsRoute, 'router.post("/groups"', 'router.patch("/groups/:id/settings"');

    expect(create).toContain("if (!requireAuth(req, res)) return;");
    expect(create).toContain("getUserTier(userId)");
    expect(create).not.toContain("Creating groups requires an Explorer+ or higher membership.");
    expect(create).toContain("const tierCap = GROUP_MAX_MEMBERS[tier] ?? 8;");
    expect(create).toContain("const cap = Math.min(Math.max(Number(maxMembers) || 8, 2), tierCap);");
    expect(create).toContain("await db.insert(groupMembers).values({ groupId: group.id, userId, role: \"admin\" })");
  });

  it("keeps the finite free join cap neutral while retaining private, age, capacity, and moderator protections", () => {
    const join = routeBlock(groupsRoute, 'router.post("/groups/:id/join"', 'router.delete("/groups/:id/leave"');
    const invite = routeBlock(groupsRoute, 'router.post("/groups/:id/invite"', 'router.post("/groups/invites/:inviteId/respond"');
    const role = routeBlock(groupsRoute, 'router.patch("/groups/:id/members/:userId/role"', 'router.delete("/groups/:id/members/:userId"');
    const remove = routeBlock(groupsRoute, 'router.delete("/groups/:id/members/:userId"', "export default router;");
    const freeCap = routeBlock(join, 'if (joinTier === "free")', "const nextTier");

    expect(join).toContain("if (!requireAuth(req, res)) return;");
    expect(join).toContain("const joinLimit: Record<string, number> = { free: 5, navigator: 25 };");
    expect(freeCap).toContain("res.status(403).json({");
    expect(freeCap).toContain('code: "TIER_LIMIT_REACHED"');
    expect(freeCap).not.toContain("upgradeUrl");
    expect(freeCap).not.toContain("Upgrade to");
    expect(join).toContain("if (group.isPrivate)");
    expect(join).toContain("if (group.isAgeRestricted)");
    expect(join).toContain("if (group.memberCount >= group.maxMembers)");
    expect(invite).toContain("Only group admins can invite members");
    expect(invite).toContain("Invite already pending for this user");
    expect(role).toContain("Only admins can change member roles");
    expect(role).toContain("A Group must keep at least one moderator");
    expect(remove).toContain("Only admins can remove members");
    expect(remove).toContain("A Group must keep at least one moderator");
  });
});
