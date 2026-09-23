import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("Community, map, and primary Kinfolk regressions", () => {
  it("keeps the member-selected display choice reachable without pushing posts below controls", () => {
    const community = source("app/(tabs)/community.tsx");
    expect(community).toContain('label: "Conversation"');
    expect(community).toContain('label: "Community Mix"');
    expect(community).toContain('label: "Watch"');
    expect(community).toContain('communityFeedDisplay');
    expect(community).toContain('presentation={communityFeedDisplay}');
    expect(community).toContain("setShowFeedControls(true)");
    expect(community).toContain("Feed options");
    const feed = community.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";
    expect(feed).not.toContain("ListHeaderComponent");
    expect(community).toContain('body: JSON.stringify({ communityFeedDisplay: next })');
  });

  it("keeps Community presentation separate from feed eligibility and ranking", () => {
    const community = source("app/(tabs)/community.tsx");
    const card = source("components/CommunityPostCard.tsx");
    expect(community).toContain("cannot change which posts are eligible or how");
    expect(card).toContain("same permitted posts, order,");
    expect(card).toContain('presentation?: "text_first" | "mixed" | "video_first"');
  });

  it("uses server-owned audio for primary Kinfolk responses rather than device TTS", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain('from "expo-audio"');
    expect(travel).toContain('useAudioPlayer(voiceAudioUri)');
    expect(travel).toContain('`${getApiBase()}/api/kinfolk/speak`');
    expect(travel).toContain('FileSystem.EncodingType.Base64');
    expect(travel).toContain('playsInSilentMode: true');
    expect(travel).not.toContain('from "expo-speech"');
  });

  it("does not erase successfully loaded pins after a transient business refresh failure", () => {
    const businesses = source("hooks/useBusinesses.ts");
    expect(businesses).toContain("lastSuccessfulBusinessesRef");
    expect(businesses).toContain("lastSuccessfulBusinessesRef.current = mappedBusinesses");
    expect(businesses).toContain("setBusinesses(lastSuccessfulBusinessesRef.current)");
    expect(businesses).toContain("map scope calculation must not blank already-visible, valid pins");
  });

  it("keeps a business pin tap connected to its MWM profile", () => {
    const map = source("components/FullMapView.tsx");
    expect(map).toContain("setSelectedBusiness(biz)");
    expect(map).toContain('pathname: "/business/[id]"');
    expect(map).toContain('Text style={s.cardBtnTxt}>View Business</Text>');
  });

  it("gives the primary Kinfolk conversation the guarded server transcription path", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain("useAudioRecorder(RecordingPresets.HIGH_QUALITY)");
    expect(travel).toContain("requestRecordingPermissionsAsync()");
    expect(travel).toContain("/api/kinfolk/transcribe");
    expect(travel).toContain('form.append("durationMs", String(durationMs))');
    expect(travel).toContain("Record a voice question for Kinfolk");
    expect(travel).toContain("await handleSend(payload.text)");
  });

  it("keeps How do you travel multi-select and explains the behavior", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain("Choose every option that fits you");
    expect(travel).toContain("toggleArr(tripStyles, s.id, setTripStyles)");
    expect(travel).toContain('accessibilityRole="checkbox"');
  });
});
