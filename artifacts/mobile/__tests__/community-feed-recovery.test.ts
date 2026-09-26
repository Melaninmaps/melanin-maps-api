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
    expect(source).toContain("feedRequestInFlightRef.current");
    expect(source).toContain("now - lastFeedRequestAtRef.current < 30_000");
    expect(source).toContain("useFocusEffect");
    expect(source).not.toContain("setPosts([])");
  });

  it("renders posts directly below Community navigation while retaining compose and filter controls", () => {
    const feedList = source.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";
    expect(feedList).toContain('justifyContent: "flex-start"');
    expect(feedList).toContain("paddingTop: 16");
    expect(feedList).not.toContain("ListHeaderComponent");
    expect(feedList).not.toContain("feedComposeBar");
    expect(source).toContain("setShowFeedControls(true)");
    expect(source).toContain("setShowCompose(true)");
    expect(source).toContain('accessibilityLabel="Hide Community keyboard"');
    expect(source).toContain("onRequestClose={closeCompose}");
  });

  it("keeps comments retryable and reconciles canonical counts after create and delete", () => {
    const modal = readFileSync(
      fileURLToPath(new URL("../components/PostDetailModal.tsx", import.meta.url)),
      "utf8",
    );
    expect(modal).toContain('method: "POST"');
    expect(modal).toContain("/api/community/posts/${post.id}/comments");
    expect(modal).toContain("setComments((prev) => [data.comment, ...prev])");
    expect(modal).toContain("data.commentsCount ?? commentCountRef.current + 1");
    expect(modal).toContain("body.commentsCount ?? Math.max(0, commentCountRef.current - 1)");
    expect(modal).toContain('accessibilityLabel="Retry loading comments"');
    expect(modal).toContain('setCommentLoadError("Could not refresh comments. Check your connection and try again.")');
    expect(modal).toContain('AppState.currentState === "active"');
    expect(source).toContain("onCommentCountChanged={(count) =>");
    expect(source).toContain("comments: count");
  });

  it("renders current author photos with initials fallbacks in cards and post detail", () => {
    const card = readFileSync(
      fileURLToPath(new URL("../components/CommunityPostCard.tsx", import.meta.url)),
      "utf8",
    );
    const modal = readFileSync(
      fileURLToPath(new URL("../components/PostDetailModal.tsx", import.meta.url)),
      "utf8",
    );
    expect(source).toContain("authorImageUrl: (raw.authorImageUrl as string) ?? null");
    expect(card).toContain("post.authorImageUrl && failedAuthorImageUrl !== post.authorImageUrl");
    expect(card).toContain("setFailedAuthorImageUrl(post.authorImageUrl ?? null)");
    expect(card).toContain("<Text style={s.initials}>{post.authorInitials}</Text>");
    expect(modal).toContain("post.authorImageUrl && !postImageFailed");
    expect(modal).toContain("<Text style={m.initials}>{post.authorInitials}</Text>");
  });

  it("keeps Conversation, Community Mix, and Watch as accessible presentation-only choices", () => {
    const card = readFileSync(
      fileURLToPath(new URL("../components/CommunityPostCard.tsx", import.meta.url)),
      "utf8",
    );
    expect(source).toContain('label: "Conversation"');
    expect(source).toContain('label: "Community Mix"');
    expect(source).toContain('label: "Watch"');
    expect(source).toContain('accessibilityRole="radio"');
    expect(source).toContain("This changes presentation only. It never changes which posts are permitted, their privacy, or their ranking.");
    expect(source).not.toContain("communityFeedDisplay}`");
    expect(card).toContain('const isConversation = presentation === "text_first"');
    expect(card).toContain("const showMediaBeforeText = hasMedia && !isConversation");
    expect(card).toContain("compact={isConversation}");
  });
});
