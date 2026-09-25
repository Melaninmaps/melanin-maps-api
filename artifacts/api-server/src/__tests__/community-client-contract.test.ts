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

  it("retains a canonical public TikTok attachment from the feed response", () => {
    const media = source("../../../web/src/components/community/CommunityMedia.tsx");
    expect(web).toContain("/^https?:\\/\\//i.test(current.trim())");
    expect(web).toContain("return [current.trim()]");
    expect(media).toContain("getTikTokPlayerUrl");
    expect(media).toContain("Open on TikTok");
    expect(media).toContain('target="_blank"');
    expect(media).toContain('rel="noopener noreferrer"');
  });

  it("keeps thread retrieval authenticated, private, and client-serializable", () => {
    const route = source("../routes/community.ts");
    expect(route).toContain('router.get("/community/thread/:threadId"');
    expect(route).toContain('res.status(401).json({ error: "Authentication required" })');
    expect(route).toContain("resolveCommentAccess(post.id, viewerId)");
    expect(route).toContain("posts: posts.map((post) => serializeCommunityPost(post))");
    expect(route).toContain("function serializeCommunityPost");
  });
});
