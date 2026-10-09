import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const widget = readFileSync(
  fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)),
  "utf8",
);
const travel = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk audit repairs on mobile", () => {
  it("suppresses the floating widget on the primary travel conversation", () => {
    expect(widget).toContain('pathname === "/travel" || pathname.startsWith("/travel/")');
    expect(widget).toContain("if (suppressed) return null");
  });

  it("authenticates before requesting microphone permission in the widget", () => {
    const start = widget.indexOf("const startVoice = async () => {");
    const end = widget.indexOf("const stopVoice", start);
    const block = widget.slice(start, end);
    expect(block.indexOf("if (!isAuthenticated || !token)")).toBeGreaterThan(-1);
    expect(block.indexOf("requestRecordingPermissionsAsync()")).toBeGreaterThan(block.indexOf("if (!isAuthenticated || !token)"));
  });

  it("shows, persists, and uses the four widget delivery modes", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      expect(widget).toContain(`id: "${mode}"`);
    }
    expect(widget).toContain("accessibilityRole=\"radio\"");
    expect(widget).toContain("void saveVoiceMode(v.id)");
    expect(widget).toContain("JSON.stringify({ personalityMode: nextMode })");
    expect(widget).toContain("sendToKinfolk(text, token, voiceMode");
  });

  it("keeps native voice controls off web and enforces a visible cancel-safe 60-second limit", () => {
    expect(widget).toContain('Platform.OS !== "web" ? (');
    expect(travel).toContain('Platform.OS !== "web" ? (');
    expect(widget).toContain("NATIVE_VOICE_MAX_DURATION_MS = 60_000");
    expect(travel).toContain("NATIVE_VOICE_MAX_DURATION_MS = 60_000");
    expect(widget).toContain("recordingElapsedSeconds}s / 60s");
    expect(travel).toContain("voiceRecordingElapsedSeconds}s / 60s");
    expect(widget).toContain("setInput(draft)");
    expect(travel).toContain("setInputText(primaryRecordingDraftRef.current)");
    expect(travel).toContain("cancelPrimaryVoiceRecording()");
    expect(travel).toContain("primaryVoiceStartGenerationRef");
  });

  it("recovers an externally interrupted widget recording without uploading partial audio", () => {
    expect(widget).toContain("useAudioRecorderState");
    expect(widget).toContain("const recorderState = useAudioRecorderState(recorder, 250)");
    expect(widget).toContain("voiceRecordingObservedRef");
    expect(widget).toContain("voiceStopRequestedRef");
    expect(widget).toContain("voiceStartGenerationRef");
    expect(widget).toContain("const startStillAllowed");
    expect(widget).toContain("isRecordingRef.current");
    expect(widget).toContain("voiceRecordingControlRef");
    expect(widget).toContain("permitsTranscription(recordingSession)");
    expect(widget).toContain("beginTranscription(recordingSession)");
    expect(widget).toContain("signal: transcriptionAbortController.signal");
    expect(widget).toContain("Recording was interrupted. Your draft was restored.");
    expect(widget).toContain("removeTemporaryVoiceRecording(recorder.uri)");
    expect(widget).toContain("if (recorder.getStatus().isRecording || voiceStopRequestedRef.current) return");
  });

  it("discards widget audio before close, background, or unmount can race a transcription upload", () => {
    const closeControl = widget.slice(widget.indexOf("const setWidgetOpen"), widget.indexOf("const openRecommendationBusiness"));
    expect(closeControl.indexOf("void discardVoiceRecording()")).toBeGreaterThan(-1);
    expect(closeControl.indexOf("void discardVoiceRecording()")).toBeLessThan(closeControl.indexOf('stopPlayback("widget_closed")'));
    expect(widget).toContain('void discardVoiceRecording();\n        stopPlayback("app_background")');
    expect(widget).toContain('void discardVoiceRecording();\n      stopPlayback("unmount")');
  });

  it("keeps widget preview audio owned by cleanup on completion, close, and background", () => {
    expect(widget).toContain("previewPlaybackFileRef");
    expect(widget).toContain("kinfolk_preview_${mode}.${format}");
    expect(widget).toContain("previewPlaybackFileRef.current = file");
    expect(widget).toContain("playingId.startsWith(\"__preview_\")");
    expect(widget).toContain("previewFile.delete()");
    expect(widget).toContain("previewPlaybackFileRef.current = null");
  });

  it("never treats a primary travel interruption or unmount as a member stop", () => {
    const interrupted = travel.slice(travel.indexOf("Calls, route changes, and media-service resets"), travel.indexOf("const handleFeedback"));
    expect(interrupted).toContain("primaryVoiceRecordingControlRef.current.cancel()");
    expect(interrupted).toContain("Your draft was restored. Nothing was uploaded.");
    expect(interrupted).not.toContain("void stopPrimaryVoiceRecording()");
    expect(interrupted).toContain("temporaryFile.delete()");
    expect(travel).toContain("permitsTranscription(recordingSession)");
    expect(travel).toContain("beginTranscription(recordingSession)");
    expect(travel).toContain("signal: transcriptionAbortController.signal");
    expect(travel).toContain('void cancelPrimaryVoiceRecording();');
  });

  it("removes raw voice recordings after every transcription attempt", () => {
    expect(widget).toContain("let temporaryRecordingUri: string | null = null");
    expect(widget).toContain("removeTemporaryVoiceRecording(temporaryRecordingUri)");
    expect(travel).toContain("let temporaryRecordingUri: string | null = null");
    expect(travel).toContain("new FileSystem.File(temporaryRecordingUri)");
    expect(travel).toContain("if (temporaryFile.exists) temporaryFile.delete()");
  });

  it("does not silently persist a mobile reminder proposal and preserves its due date on explicit save", () => {
    expect(widget).toContain("taskAction: taskAction ?? null");
    expect(widget).not.toContain("if (taskAction && token)");
    expect(widget).toContain("const saveProposedTaskAction = async");
    expect(widget).toContain("handleTaskAction(action, token)");
    expect(widget).toContain('accessibilityLabel="Save this Kinfolk reminder"');
    expect(widget).toContain("dueAt: t.dueAt");
  });

  it("requires separate sensitive-memory confirmation in the floating widget", () => {
    expect(widget).toContain("sensitiveMemoryConfirmation");
    expect(widget).toContain("sensitiveMemoryDraft");
    expect(widget).toContain("KinfolkSensitiveMemoryConfirmation");
    expect(widget).toContain("purpose: data.sensitiveMemoryConfirmation.purpose");
  });
});
