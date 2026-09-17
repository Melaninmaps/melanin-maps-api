import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Community client contract", () => {
  const web = source("../../../web/src/pages/community.tsx");
  const mobile = source("../../../mobile/components/CommunityPostCard.tsx");

  it("uses the protected vote endpoint and authenticated native requests", () => {
    expect(web).toContain("api/community/posts/${postId}/vote");
    expect(web).toContain('body: JSON.stringify({ direction: "up" })');
    expect(web).not.toContain("api/community/posts/${postId}/upvote");
    expect(mobile).toContain("Authorization: `Bearer ${token}`");
    expect(mobile).toContain('body: JSON.stringify({ direction: next ? "up" : "down" })');
    expect(mobile).toContain("Could not save your reaction");
  });

  it("connects web reporting and blocking to existing protected routes", () => {
    expect(web).toContain("api/content-reports");
    expect(web).toContain('targetType: "post"');
    expect(web).toContain("api/users/${encodeURIComponent(post.authorId)}/block");
    expect(web).toContain("Block member");
    expect(web).not.toContain("Save Post");
  });
});
