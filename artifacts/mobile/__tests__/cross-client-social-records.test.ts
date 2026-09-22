import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(
  fileURLToPath(new URL(relative, import.meta.url)),
  "utf8",
);

const serverUsers = source("../../api-server/src/routes/users.ts");
const serverReviews = source("../../api-server/src/routes/reviews.ts");
const serverCommunity = source("../../api-server/src/routes/community.ts");
const webProfile = source("../../web/src/pages/profile.tsx");
const webComments = source("../../web/src/components/community/CommentsDialog.tsx");
const mobileProfile = source("../app/(tabs)/profile.tsx");
const mobileComments = source("../components/PostDetailModal.tsx");
const mobileReviews = source("../hooks/useReviews.ts");
const preservationContract = source("../../../docs/guardrails/CROSS_CLIENT_CONTENT_PRESERVATION_CONTRACT.md");

describe("cross-client social record contracts", () => {
  it("uses the shared user record for profile photos on web and mobile", () => {
    expect(serverUsers).toContain('router.post("/users/avatar"');
    expect(serverUsers).toContain(".set({ profileImageUrl: avatarUrl");
    expect(serverUsers).toContain('router.patch("/users/me"');
    expect(webProfile).toContain("api/users/avatar");
    expect(webProfile).toContain('queryKey: ["getMyProfile"]');
    expect(mobileProfile).toContain("/api/users/me");
    expect(mobileProfile).toContain("body.profileImageUrl = resolvedAvatarUrl");
  });

  it("uses the same durable review API from mobile and web profile activity", () => {
    expect(serverReviews).toContain('router.post("/reviews"');
    expect(serverReviews).toContain('router.get("/reviews/mine"');
    expect(mobileReviews).toContain('fetch(`${apiBase}/api/reviews`');
    expect(webProfile).toContain("api/reviews/mine");
  });

  it("uses the same Community comment records from web and mobile", () => {
    const sharedPath = "api/community/posts/${";
    expect(serverCommunity).toContain('router.post("/community/posts/:id/comments"');
    expect(serverCommunity).toContain("communityPostCommentsTable");
    expect(webComments).toContain(sharedPath);
    expect(mobileComments).toContain(sharedPath);
    expect(webComments).toContain('method: "POST"');
    expect(mobileComments).toContain('method: "POST"');
  });

  it("shows a current profile photo on every comment and refreshes open conversations", () => {
    expect(serverCommunity).toContain("authorImageUrl: commentAuthor?.profileImageUrl ?? null");
    expect(webComments).toContain("authorImageUrl?: string | null");
    expect(mobileComments).toContain("authorImageUrl?: string | null");
    expect(webComments).toContain("<CommentAvatar comment={comment} />");
    expect(mobileComments).toContain("<CommentAvatar comment={c} />");
    expect(webComments).toContain("load(true)");
    expect(mobileComments).toContain("loadComments(true)");
  });

  it("treats transient feed failures as recoverable and preserves eligible content", () => {
    expect(preservationContract).toContain("same durable server-side records");
    expect(preservationContract).toContain("not removed because of a deployment");
    expect(preservationContract).toContain("report or automated safety/moderation flag");
    expect(preservationContract).toContain("a visible retry/recovery state");
  });
});
