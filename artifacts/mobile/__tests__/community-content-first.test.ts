import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/community.tsx", import.meta.url)),
  "utf8",
);

describe("native Community content-first surface", () => {
  it("keeps Community navigation limited to the feed and groups", () => {
    expect(source).toContain('const TABS = ["Feed", "Groups"];');
    expect(source).toContain("Events, Library material, safety resources, market, and profiles retain their");
  });

  it("places the composer immediately before the same shared feed", () => {
    expect(source).toContain("ListHeaderComponent={");
    expect(source).toContain("Share a thought, photo, or video");
    expect(source).toContain("data={filteredPosts}");
    expect(source).toContain("<CommunityPostCard");
  });

  it("preserves private display-only feed choices", () => {
    expect(source).toContain('id: "text_first", label: "Conversation"');
    expect(source).toContain('id: "mixed", label: "Community Mix"');
    expect(source).toContain('id: "video_first", label: "Watch"');
    expect(source).toContain("This changes presentation only");
  });
});
