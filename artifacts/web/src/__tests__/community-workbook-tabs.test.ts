import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const community = source("../pages/community.tsx");
const groupDetail = source("../pages/community-group.tsx");
const app = source("../App.tsx");

describe("Community workbook tabs", () => {
  it("uses distinct Community Feed and My Groups destinations with an active page state", () => {
    expect(community).toContain('const TABS = ["Community Feed", "My Groups"] as const;');
    expect(community).toContain('pathname === "/community/groups"');
    expect(community).toContain('navigate(tab === "Community Feed" ? "/community" : "/community/groups")');
    expect(community).toContain('aria-current={activeTab === tab ? "page" : undefined}');
    expect(app).toContain('<Route path="/community/groups">');
  });

  it("keeps current memberships separate while allowing only server-visible public Group discovery", () => {
    const start = community.indexOf("function MyGroupsPage");
    const end = community.indexOf("// ── People Search Result", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const mine = community.slice(start, end);

    expect(mine).toContain("api/groups/mine");
    expect(mine).toContain("You have not joined any groups yet");
    expect(mine).toContain('navigate(`/community/groups/${encodeURIComponent(String(g.id))}`)');
    expect(mine).toContain("api/groups");
    expect(mine).toContain("!group.isPrivate && !group.isMember");
    expect(mine).toContain("Explore public Groups");
    expect(mine).toContain("api/groups/${encodeURIComponent(String(group.id))}/join");
    expect(mine).toContain("Private groups stay invite-only");
    expect(mine).not.toContain('"Leave"');
  });

  it("creates Groups through the existing tier-gated route with explicit privacy and content rules", () => {
    const start = community.indexOf("function MyGroupsPage");
    const end = community.indexOf("// ── People Search Result", start);
    const mine = community.slice(start, end);

    expect(mine).toContain('data-testid="community-group-create-dialog"');
    expect(mine).toContain("api/groups");
    expect(mine).toContain("isPrivate: newGroupPrivate");
    expect(mine).toContain("isAgeRestricted: newGroupAgeRestricted");
    expect(mine).toContain("rules: newGroupRules.split");
    expect(mine).toContain("Private Group");
  });

  it("renders pending private-group invitations separately and responds through the authenticated invite contract", () => {
    const start = community.indexOf("function MyGroupsPage");
    const end = community.indexOf("// ── People Search Result", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const mine = community.slice(start, end);

    expect(mine).toContain("api/groups/my-invites");
    expect(mine).toContain("api/groups/invites/${encodeURIComponent(String(invite.id))}/respond");
    expect(mine).toContain('body: JSON.stringify({ action })');
    expect(mine).toContain("Private groups require an invitation");
    expect(mine).toContain("Group invitation accepted");
    expect(mine).toContain("The group has not been changed.");
    expect(mine).toContain('data-testid={`community-group-invite-${invite.id}`}');
  });

  it("loads group posts, shared media, and member information only after current membership is confirmed", () => {
    expect(app).toContain('<Route path="/community/groups/:id">');
    expect(groupDetail).toContain("api/groups/${encodeURIComponent(String(groupId))}");
    expect(groupDetail).toContain("api/community/posts?groupId=${encodeURIComponent(String(groupId))}");
    expect(groupDetail).toContain("if (!groupPayload.group?.isMember)");
    expect(groupDetail).toContain("Only current members can open a group’s posts, media, and member information.");
    expect(groupDetail).toContain("<CommunityMedia");
  });

  it("lets a current member publish a bounded group post with private media without exposing the group feed outside membership", () => {
    expect(groupDetail).toContain('data-testid="community-group-compose"');
    expect(groupDetail).toContain('data-testid="community-group-post-content"');
    expect(groupDetail).toContain('data-testid="community-group-media-toggle"');
    expect(groupDetail).toContain('data-testid="community-group-post-submit"');
    expect(groupDetail).toContain("api/community/posts");
    expect(groupDetail).toContain("groupId,");
    expect(groupDetail).toContain("Only current group members can open this group feed.");
    expect(groupDetail).toContain("Posts and media shared here remain available only to current group members.");
    expect(groupDetail).toContain("api/media/upload?purpose=community_post_private");
    expect(groupDetail).toContain("privateMediaAssetIds");
    expect(groupDetail).toContain("Add private photo or video");
    expect(groupDetail).not.toContain("Paste a supported social video link");
  });
});
