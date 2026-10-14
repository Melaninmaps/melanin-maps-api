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
    const posts = routeBlock(communityRoute, 'router.get("/community/posts"', '// POST /community/posts');

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

  it("keeps Group creation, invitations, and member management behind existing tier and admin gates", () => {
    const create = routeBlock(groupsRoute, 'router.post("/groups"', 'router.patch("/groups/:id/settings"');
    const invite = routeBlock(groupsRoute, 'router.post("/groups/:id/invite"', 'router.post("/groups/invites/:inviteId/respond"');
    const role = routeBlock(groupsRoute, 'router.patch("/groups/:id/members/:userId/role"', 'router.delete("/groups/:id/members/:userId"');
    const remove = routeBlock(groupsRoute, 'router.delete("/groups/:id/members/:userId"', "export default router;");

    expect(create).toContain("getUserTier(userId)");
    expect(create).toContain("Creating groups requires an Explorer+ or higher membership.");
    expect(create).toContain("await db.insert(groupMembers).values({ groupId: group.id, userId, role: \"admin\" })");
    expect(invite).toContain("Only group admins can invite members");
    expect(invite).toContain("Invite already pending for this user");
    expect(role).toContain("Only admins can change member roles");
    expect(role).toContain("A Group must keep at least one moderator");
    expect(remove).toContain("Only admins can remove members");
    expect(remove).toContain("A Group must keep at least one moderator");
  });
});
