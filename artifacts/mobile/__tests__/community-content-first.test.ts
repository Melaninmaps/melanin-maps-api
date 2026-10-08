import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../app/(tabs)/community.tsx", import.meta.url)),
  "utf8",
);
const postCardSource = readFileSync(
  fileURLToPath(new URL("../components/CommunityPostCard.tsx", import.meta.url)),
  "utf8",
);
const threadSource = readFileSync(
  fileURLToPath(new URL("../app/community-thread.tsx", import.meta.url)),
  "utf8",
);
const groupsHookSource = readFileSync(
  fileURLToPath(new URL("../hooks/useGroups.ts", import.meta.url)),
  "utf8",
);
const groupDetailSource = readFileSync(
  fileURLToPath(new URL("../app/group/[id].tsx", import.meta.url)),
  "utf8",
);

describe("native Community content-first surface", () => {
  it("keeps Community navigation limited to the feed and groups", () => {
    expect(source).toContain('const TABS = ["Community Feed", "My Groups"];');
    expect(source).toContain('activeTab === "Community Feed"');
    expect(source).toContain('activeTab === "My Groups"');
    expect(groupsHookSource).toContain("/api/groups/mine");
    expect(groupsHookSource).toContain("prev.filter((group) => group.id !== groupId)");
    expect(groupDetailSource).toContain("/api/community/posts?groupId=");
    expect(groupDetailSource).toContain("Posts and shared media are visible only to current members of this group.");
    expect(groupDetailSource).toContain("<CommunityPostCard");
    expect(source).toContain("Events, Library material, safety resources, market, and profiles retain their");
  });

  it("renders My Groups as one membership-only list with visible loading, empty, and recovery states", () => {
    const myGroupsStart = source.lastIndexOf(') : activeTab === "My Groups" ? (');
    const myGroupsEnd = source.indexOf(') : activeTab === "Resources"', myGroupsStart);
    const myGroups = source.slice(myGroupsStart, myGroupsEnd);
    expect(source).toContain("const memberGroups = groups.filter((group) => group.isMember === true);");
    expect(myGroups).toContain("data={filteredGroups}");
    expect(myGroups).toContain("ListHeaderComponent");
    expect(myGroups).toContain('testID="my-groups-loading"');
    expect(myGroups).toContain('testID="my-groups-empty"');
    expect(myGroups).toContain('testID="my-groups-recovery"');
    expect(myGroups).toContain('accessibilityLabel="Retry loading My Groups"');
    expect(myGroups).toContain('pathname: "/group/[id]"');
    expect(groupsHookSource).toContain("const [error, setError]");
    expect(groupsHookSource).toContain("Array.isArray(data.groups)");
    expect(groupsHookSource).toContain("(group as Group).isMember === true");
    expect(groupsHookSource).toContain("My Groups could not refresh right now");
  });

  it("places the shared feed directly below the Feed and Groups navigation", () => {
    const feedList = source.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";

    expect(source).toContain("data={filteredPosts}");
    expect(source).toContain("<CommunityPostCard");
    expect(feedList).not.toContain("ListHeaderComponent");
    expect(feedList).not.toContain("feedComposeBar");
    expect(feedList).toContain("paddingTop: 0");
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
    expect(source).toContain("const feedListRef = useRef<FlatList<CommunityPost> | null>(null)");
    expect(source).toContain("feedListRef.current?.scrollToOffset({ offset: 0, animated: false })");
    expect(source).toContain("setShowFeedControls(false)");
  });

  it("keeps a playable visual card in the feed while a native video frame loads", () => {
    for (const marker of [
      "function InlineCommunityVideoPreview",
      "Community video",
      "Play Community video",
      "inlineVideoCallToAction",
      "useVideoPlayer({ uri: url, useCaching: true }",
    ]) {
      expect(postCardSource).toContain(marker);
    }
    expect(postCardSource).not.toContain('backgroundColor: "#0008", justifyContent: "center", alignItems: "center"');
  });

  it("shows a public TikTok cover before sending a member to the provider", () => {
    for (const marker of [
      "function TikTokCommunityPreview",
      "/api/community/social-video-preview?url=",
      'socialPlatform === "tiktok"',
      "Loading TikTok preview",
      "Watch on TikTok",
      "socialVideoPreview",
    ]) {
      expect(postCardSource).toContain(marker);
    }
    expect(postCardSource).not.toContain('backgroundColor: "#000000", justifyContent: "center", alignItems: "center"');
  });

  it("prioritizes selected media and keeps long captions deliberately expandable", () => {
    expect(postCardSource).toContain("const COMMUNITY_CAPTION_PREVIEW_LENGTH = 280");
    expect(postCardSource).toContain("const showMediaBeforeText = hasMedia && !isConversation");
    expect(postCardSource).toContain("emphasized={!isConversation}");
    expect(postCardSource).toContain('accessibilityLabel={captionExpanded ? "See less of this Community caption" : "See more of this Community caption"}');
    expect(postCardSource).toContain("aspectRatio: 4 / 5");
  });

  it("opens long threads and makes Share functional without exposing private posts", () => {
    expect(source).toContain('pathname: "/community-thread"');
    expect(postCardSource).toContain("await Share.share");
    expect(postCardSource).toContain('post.visibility !== "public"');
    expect(postCardSource).toContain("Only public Community posts can be shared outside the app.");
    expect(threadSource).toContain("/api/community/thread/");
    expect(threadSource).toContain("Community thread");
    expect(threadSource).toContain("keyboardDismissMode=\"on-drag\"");
  });
});
