import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { communityFeedErrorState } from "../features/community/feedErrorState";

const communityPageSource = readFileSync(
  fileURLToPath(new URL("../pages/community.tsx", import.meta.url)),
  "utf8",
);

describe("Community feed client error state", () => {
  it("identifies an expired or unauthorized session as sign-in required", () => {
    expect(communityFeedErrorState(401)).toEqual({
      kind: "auth",
      title: "Sign in required",
      message: "Your session has ended. Sign in again to load the Community feed.",
    });
    expect(communityFeedErrorState(403).kind).toBe("auth");
    expect(communityPageSource).toContain('data-testid="community-feed-auth-required"');
    expect(communityPageSource).toContain('<Link href="/login">');
  });

  it("offers retry and request-id guidance for server and network failures", () => {
    expect(communityFeedErrorState(500, "req-123")).toEqual({
      kind: "server",
      title: "Couldn't refresh the feed",
      message: "The posts already on screen are still available. Try again, or contact support with request ID req-123.",
    });
    expect(communityFeedErrorState(0)).toMatchObject({ kind: "server" });
    expect(communityPageSource).toContain('data-testid="community-feed-retry"');
    expect(communityPageSource).toContain("No posts or comments were removed.");
    expect(communityPageSource).toContain('res.headers.get("x-request-id")');
  });

  it("retains previously loaded posts and renders a non-destructive stale warning", () => {
    expect(communityPageSource).toContain('data-testid="community-feed-stale-warning"');
    expect(communityPageSource).toContain('{posts.map(post => (');
    expect(communityPageSource).not.toContain("setPosts([])");
    expect(communityFeedErrorState(503).message).toContain("posts already on screen are still available");
    expect(communityPageSource).toContain("{feedError.message}");
  });
});
