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

  it("places the shared feed directly below the Feed and Groups navigation", () => {
    const feedList = source.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";

    expect(source).toContain("data={filteredPosts}");
    expect(source).toContain("<CommunityPostCard");
    expect(feedList).not.toContain("ListHeaderComponent");
    expect(feedList).not.toContain("feedComposeBar");
    expect(feedList).toContain('justifyContent: "flex-start"');
    expect(feedList).toContain('contentInsetAdjustmentBehavior="never"');
    expect(source).toContain('accessibilityLabel="Add a Community post, photo, or video"');
  });

  it("lets a member dismiss the Community keyboard or cancel without losing a draft", () => {
    expect(source).toContain("const dismissCommunityKeyboard = useCallback");
    expect(source).toContain("Keyboard.dismiss()");
    expect(source).toContain("const closeCompose = useCallback");
    expect(source).toContain('accessibilityLabel="Hide Community keyboard"');
    expect(source).toContain('accessibilityLabel="Cancel Community post and return to feed"');
    expect(source).toContain('keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}');
    const feedList = source.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";
    expect(feedList).toContain("onScrollBeginDrag={dismissCommunityKeyboard}");
  });

  it("preserves private display-only feed choices", () => {
    expect(source).toContain('id: "text_first", label: "Conversation"');
    expect(source).toContain('id: "mixed", label: "Community Mix"');
    expect(source).toContain('id: "video_first", label: "Watch"');
    expect(source).toContain('accessibilityLabel="Open Community settings"');
    expect(source).toContain("Community Settings");
    expect(source).toContain("CHOOSE YOUR COMMUNITY EXPERIENCE");
    expect(source).toContain("This changes presentation only");
    expect(source).toContain("People & connections");
    expect(source).toContain('router.push("/connections")');
  });
});
