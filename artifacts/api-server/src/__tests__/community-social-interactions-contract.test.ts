import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Community social interaction contract", () => {
  const route = source("../routes/community.ts");
  const follows = source("../routes/follows.ts");
  const notifications = source("../community/communitySocialNotifications.ts");

  it("keeps replies bound to the same accessible post and supports author-only edits", () => {
    expect(route).toContain('router.post("/community/posts/:id/comments"');
    expect(route).toContain("parentCommentId");
    expect(route).toContain("Replies can only be added to a top-level comment.");
    expect(route).toContain('router.patch("/community/posts/:postId/comments/:commentId"');
    expect(route).toContain("eq(communityPostCommentsTable.authorId, req.user.id)");
    expect(route).toContain("editedAt: new Date()");
  });

  it("soft-deletes a reply with its parent and retains reporting controls", () => {
    expect(route).toContain("eq(communityPostCommentsTable.parentCommentId, commentId)");
    expect(route).toContain('router.post("/community/posts/:postId/comments/:commentId/report"');
    expect(route).toContain("contentReportsTable");
  });

  it("makes reactions, comments, and follows recipient-opted-in activities without content previews", () => {
    expect(notifications).toContain("recipient?.notifCommunity === true");
    expect(notifications).toContain("participantsAreBlocked");
    expect(notifications).toContain("notificationsTable");
    expect(route).toContain("Open Community to view this activity.");
    expect(follows).toContain("deliverCommunitySocialNotification");
    expect(follows).not.toContain("notificationsTable");
  });

  it("resolves notification post navigation through the same Community authorization gate", () => {
    expect(route).toContain('router.get("/community/posts/:id"');
    expect(route).toContain("resolveCommentAccess(postId, req.user.id)");
    expect(route).toContain('res.status(404).json({ error: "Post not found" })');
  });
});
