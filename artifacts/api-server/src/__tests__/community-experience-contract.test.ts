import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Community experience contract", () => {
  it("keeps the Community tab focused on the social feed and groups", () => {
    const mobile = source("../../../mobile/app/(tabs)/community.tsx");
    const web = source("../../../web/src/pages/community.tsx");
    const profile = source("../../../mobile/app/(tabs)/profile.tsx");
    const settings = source("../../../mobile/app/settings.tsx");
    expect(mobile).toContain('const TABS = ["Community Feed", "My Groups"]');
    expect(mobile).toContain('activeTab === "Community Feed"');
    expect(mobile).toContain('activeTab === "My Groups"');
    expect(web).toContain('const TABS = ["Community Feed", "My Groups"] as const');
    expect(profile).toContain('label: "Circles"');
    expect(profile).toContain('route: "/circles"');
    expect(settings).toContain('label: "My Circles"');
    expect(settings).toContain('route: "/circles"');
  });

  it("preserves author-only comment controls through the existing protected endpoint", () => {
    const route = source("../routes/community.ts");
    const mobile = source("../../../mobile/components/CommunityPostCard.tsx");
    const web = source("../../../web/src/pages/community.tsx");
    expect(route).toContain('router.patch("/community/posts/:id/comment-policy"');
    expect(route).toContain('eq(communityPostsTable.authorId, req.user.id)');
    expect(mobile).toContain('Turn off comments');
    expect(mobile).toContain('commentPolicy === "off"');
    expect(web).toContain('Who can comment');
    expect(web).toContain('commentPolicy === "off"');
  });
});
