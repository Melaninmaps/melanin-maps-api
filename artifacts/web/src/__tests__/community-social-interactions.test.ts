import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web Community social interactions", () => {
  const dialog = source("../components/community/CommentsDialog.tsx");
  const page = source("../pages/community.tsx");

  it("presents reply and author-only edit controls without weakening reports", () => {
    expect(dialog).toContain("parentCommentId?: string | null");
    expect(dialog).toContain("Replying to");
    expect(dialog).toContain("aria-label=\"Edit comment\"");
    expect(dialog).toContain('method: activeEdit ? "PATCH" : "POST"');
    expect(dialog).toContain("parentCommentId: activeReply.id");
    expect(dialog).toContain("aria-label=\"Report comment\"");
  });

  it("keeps rendered comment counts server-authoritative after add or delete", () => {
    expect(dialog).toContain("onCommentCountChanged(postId, body.commentsCount)");
    expect(page).toContain("onCommentCountChanged={(postId, commentsCount)");
  });
});
