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

  it("loads My Groups from the membership-only endpoint and never renders join controls", () => {
    const start = community.indexOf("function MyGroupsPage");
    const end = community.indexOf("// ── People Search Result", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const mine = community.slice(start, end);

    expect(mine).toContain("api/groups/mine");
    expect(mine).toContain("You have not joined any groups yet");
    expect(mine).toContain('navigate(`/community/groups/${encodeURIComponent(String(g.id))}`)');
    expect(mine).not.toContain("toggleJoin");
    expect(mine).not.toContain('"Join"');
    expect(mine).not.toContain('"Leave"');
  });

  it("loads group posts, shared media, and member information only after current membership is confirmed", () => {
    expect(app).toContain('<Route path="/community/groups/:id">');
    expect(groupDetail).toContain("api/groups/${encodeURIComponent(String(groupId))}");
    expect(groupDetail).toContain("api/community/posts?groupId=${encodeURIComponent(String(groupId))}");
    expect(groupDetail).toContain("if (!groupPayload.group?.isMember)");
    expect(groupDetail).toContain("Only current members can open a group’s posts, media, and member information.");
    expect(groupDetail).toContain("<CommunityMedia");
  });
});
