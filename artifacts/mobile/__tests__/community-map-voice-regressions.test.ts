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
    expect(community).toContain("Community Settings");
    const feed = community.split("data={filteredPosts}")[1]?.split("ListEmptyComponent")[0] ?? "";
    expect(feed).not.toContain("ListHeaderComponent");
    expect(feed).not.toContain("feedComposeBar");
    expect(feed).toContain('justifyContent: "flex-start"');
    expect(feed).not.toContain("HappeningNowPanel");
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

  it("makes native playback state visible and validates delivered audio before playing", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain('setVoiceOutputStatus("Preparing voice…")');
    expect(travel).toContain('setVoiceOutputStatus("Speaking…")');
    expect(travel).toContain('Voice unavailable — try Listen again.');
    expect(travel).toContain('payload.bytes < 256');
    expect(travel).toContain('payload.contentType?.startsWith("audio/")');
    expect(travel).toContain('playsInSilentMode: true');
  });

  it("waits for native playback completion, removes temporary audio, and leaves a retryable state", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain("const voiceAudioFileRef = useRef<FileSystem.File | null>(null)");
    expect(travel).toContain("const pendingVoiceClipFilesRef = useRef<FileSystem.File[]>([])");
    expect(travel).toContain("const activeVoicePlaybackRef = useRef<VoicePlaybackRequest | null>(null)");
    expect(travel).toContain("payload.clips");
    expect(travel).toContain("setVoiceOutputStatus(\"Continuing voice…\")");
    expect(travel).toContain("serverVoicePlayerStatus.didJustFinish");
    expect(travel).toContain('setVoiceOutputStatus("Voice finished. Tap Listen to play it again.")');
    expect(travel).toContain("temporaryFile.delete()");
    expect(travel).toContain("stopServerVoice(`new_${source}_voice_request`)");
    expect(travel).not.toContain("serverVoicePlayer.isLoaded && !serverVoicePlayer.playing && !queuedVoicePlaybackRef.current");
  });

  it("keeps the Kinfolk header compact and places secondary actions behind overflow", () => {
    const travel = source("app/travel.tsx");
    const header = travel.split("{/* Header */}")[1]?.split("{showHeaderActions && (")[0] ?? "";
    const overflow = travel.split("{showHeaderActions && (")[1]?.split("{isAuthenticated && (")[0] ?? "";
    expect(header).toContain('accessibilityLabel="Open Kinfolk conversation actions"');
    expect(header).toContain("numberOfLines={1}");
    expect(header).not.toContain("person-circle-outline");
    expect(overflow).toContain('accessibilityLabel="Open Kinfolk profile"');
    expect(overflow).toContain('accessibilityLabel="Open saved places"');
  });

  it("keeps the exact spoken reply text visible in the active message during and after playback", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain("spokenText?: string");
    expect(travel).toContain("setSpokenVoiceText({ messageId, content: payload.spokenText, phase: \"preparing\" })");
    expect(travel).toContain('testID="kinfolk-visible-spoken-text"');
    expect(travel).toContain("Audio is playing — spoken text");
    expect(travel).toContain("Audio finished — spoken text");
    expect(travel).toContain("onSpeak(msg.id, msg.content)");
    expect(travel).toContain("spokenVoiceText={spokenVoiceText}");
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
    expect(travel).toContain("useAudioRecorderState(primaryRecorder, 250)");
    expect(travel).toContain("primaryRecorder.getStatus().canRecord");
    expect(travel).toContain("primaryRecorder.getStatus().isRecording");
    expect(travel).toContain("Linking.openSettings()");
    expect(travel).toContain("/api/kinfolk/transcribe");
    expect(travel).toContain('form.append("durationMs", String(durationMs))');
    expect(travel).toContain('form.append(\n        "regionalFlavor"');
    expect(travel).toContain("Record a voice question for Kinfolk");
    expect(travel).toContain("const originalText = payload.meaningReview?.originalText?.trim() || payload.text.trim()");
    expect(travel).toContain("voiceTranscriptReview");
    expect(travel).toContain("Use suggestion");
    expect(travel).toContain("Keep original");
    expect(travel).not.toContain("await handleSend(payload.text)");
  });

  it("keeps How do you travel multi-select and explains the behavior", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain("Choose every option that fits you");
    expect(travel).toContain("toggleArr(tripStyles, s.id, setTripStyles)");
    expect(travel).toContain('accessibilityRole="checkbox"');
  });
});
