import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("native Community social interactions", () => {
  const modal = source("../components/PostDetailModal.tsx");
  const feed = source("../app/(tabs)/community.tsx");
  const notifications = source("../app/notification-center.tsx");

  it("offers a bounded reply, edit, delete, and report flow", () => {
    expect(modal).toContain("parentCommentId?: string | null");
    expect(modal).toContain("Replying to");
    expect(modal).toContain("Edit your comment");
    expect(modal).toContain('method: activeEdit ? "PATCH" : "POST"');
    expect(modal).toContain("parentCommentId: activeReply.id");
    expect(modal).toContain("Report received");
    expect(modal).toContain("item.parentCommentId !== comment.id");
  });

  it("opens only a server-authorized post from a Community activity item", () => {
    expect(notifications).toContain('notif.entityType === "community_post"');
    expect(notifications).toContain('pathname: "/(tabs)/community"');
    expect(feed).toContain("api/community/posts/${encodeURIComponent(postId)}");
    expect(feed).toContain("setSelectedPost(toPostCard(body.post))");
    expect(feed).toContain("deleted, private, or blocked post");
  });

  it("routes profile activity to the authorized member profile", () => {
    expect(notifications).toContain('notif.entityType === "member_profile"');
    expect(notifications).toContain("router.push(`/user/${notif.data.userId}` as never)");
  });
});
