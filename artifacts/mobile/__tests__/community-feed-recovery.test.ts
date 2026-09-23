import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/community.tsx", import.meta.url)),
  "utf8",
);

describe("mobile Community feed recovery", () => {
  it("keeps the member-only feed protected while giving failures a safe recovery path", () => {
    expect(source).toContain('kind: "auth" | "temporary" | "configuration" | "unknown"');
    expect(source).toContain('res.headers.get("x-request-id")');
    expect(source).toContain("Your Community session needs to reconnect");
    expect(source).toContain("Your existing posts and media are safe");
    expect(source).toContain('router.push("/login" as any)');
    expect(source).toContain("Community could not refresh right now");
  });

  it("renders posts directly below Community navigation while retaining compose and filter controls", () => {
    const feedList = source.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";
    expect(feedList).toContain('justifyContent: "flex-start"');
    expect(source).toContain("list: { paddingHorizontal: 16, paddingTop: 0 }");
    expect(feedList).not.toContain("ListHeaderComponent");
    expect(source).toContain("setShowFeedControls(true)");
    expect(source).toContain("setShowCompose(true)");
  });

  it("keeps a submitted comment visible immediately and refreshes the post count", () => {
    const modal = readFileSync(
      fileURLToPath(new URL("../components/PostDetailModal.tsx", import.meta.url)),
      "utf8",
    );
    expect(modal).toContain('method: "POST"');
    expect(modal).toContain("/api/community/posts/${post.id}/comments");
    expect(modal).toContain("setComments((prev) => [data.comment, ...prev])");
    expect(modal).toContain("onCommentAdded?.()");
    expect(source).toContain("comments: item.comments + 1");
  });
});
