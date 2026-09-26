import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("web Community display preferences", () => {
  it("uses the existing private display preference without changing feed inputs or ranking", () => {
    const community = source("../pages/community.tsx");

    expect(community).toContain('id: "text_first", label: "Conversation"');
    expect(community).toContain('id: "mixed", label: "Community Mix"');
    expect(community).toContain('id: "video_first", label: "Watch"');
    expect(community).toContain('data-testid="community-settings-open"');
    expect(community).toContain('aria-label="Open Community settings"');
    expect(community).toContain("Community Settings");
    expect(community).toContain("This changes presentation only. It never changes which posts are permitted, their privacy, or their ranking.");
    expect(community).toContain("api/users/me/content-preferences");
    expect(community).toContain('body: JSON.stringify({ communityFeedDisplay: next })');
    expect(community).toContain("presentation={communityFeedDisplay}");
    expect(community).not.toContain("communityFeedDisplay=${");
  });

  it("uses an authenticated public-preview request for canonical TikTok covers and preserves an external fallback", () => {
    const media = source("../components/community/CommunityMedia.tsx");

    expect(media).toContain("function TikTokPreviewCard");
    expect(media).toContain("api/community/social-video-preview?url=");
    expect(media).toContain('data-testid={`community-tiktok-preview-${index}`}');
    expect(media).toContain('data-testid={`community-tiktok-link-${index}`}');
    expect(media).toContain('target="_blank"');
    expect(media).toContain('rel="noopener noreferrer"');
    expect(media).toContain("getTikTokPlayerUrl(url)");
  });
});
