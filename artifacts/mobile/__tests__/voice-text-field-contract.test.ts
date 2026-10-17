import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

const voiceTextField = source("../components/VoiceTextField.tsx");

const voiceCallers = [
  "../app/business-checkin.tsx",
  "../app/neighborhood-survey.tsx",
  "../app/nominate-business.tsx",
  "../app/report-experience.tsx",
  "../app/write-review.tsx",
].map(source);

describe("shared form voice-to-text contract", () => {
  it("uses the existing native recorder and secured transcription route instead of a placeholder", () => {
    expect(voiceTextField).toContain('from "expo-audio"');
    expect(voiceTextField).toContain(
      "useAudioRecorder(RecordingPresets.HIGH_QUALITY)",
    );
    expect(voiceTextField).toContain("useAudioRecorderState(recorder, 250)");
    expect(voiceTextField).toContain("requestRecordingPermissionsAsync()");
    expect(voiceTextField).toContain('Platform.OS === "web"');
    expect(voiceTextField).toContain("MAX_VOICE_RECORDING_MS = 60_000");
    expect(voiceTextField).toContain(
      "recorder.record({ forDuration: MAX_VOICE_RECORDING_MS / 1000 })",
    );
    expect(voiceTextField).toContain("new FileSystem.File(recordingUri)");
    expect(voiceTextField).toContain('form.append("audio"');
    expect(voiceTextField).toContain('form.append("durationMs"');
    expect(voiceTextField).toContain('form.append("mimeType"');
    expect(voiceTextField).toContain("/api/kinfolk/transcribe");
    expect(voiceTextField).toContain("Authorization: `Bearer ${token}`");
    expect(voiceTextField).not.toContain("Voice recording coming soon");
  });

  it("keeps voice input reviewable and preserves typed drafts on cancellation or failure", () => {
    expect(voiceTextField).toContain("const handleTextChange = useCallback");
    expect(voiceTextField).toContain("latestValue.current = nextValue");
    expect(voiceTextField).toContain("onChangeText={handleTextChange}");
    expect(voiceTextField).toContain("const draft = latestValue.current");
    expect(voiceTextField).toContain(
      "onChangeText(`${draft}${separator}${transcript}`)",
    );
    expect(voiceTextField).toContain(
      "Your words were added. Review them before submitting.",
    );
    expect(voiceTextField).toContain("discardVoiceRecording");
    expect(voiceTextField).toContain("Your typed response is still here.");
    expect(voiceTextField).toContain("deleteTemporaryRecording(recordingUri)");
    expect(voiceTextField).toContain(
      "if (recorder.isRecording) await recorder.stop()",
    );
    expect(voiceTextField).toContain("transcriptionAbortRef.current?.abort()");
    expect(voiceTextField).toContain("signal: transcriptionAbort.signal");
    expect(voiceTextField).toContain(
      "activeRecordingUriRef.current = recordingUri",
    );
    expect(voiceTextField).toContain(
      "const componentMountedRef = useRef(true)",
    );
    expect(voiceTextField).toContain("if (!componentMountedRef.current)");
    expect(voiceTextField).toContain("allowsRecording: false");
  });

  it("retains the existing shared input contract across all six member-visible forms", () => {
    expect(voiceCallers).toHaveLength(5);
    for (const caller of voiceCallers) {
      expect(caller).toContain("<VoiceTextField");
      expect(caller).toContain("onChangeText=");
      expect(caller).toContain("draftKey=");
    }
    const reportExperience = voiceCallers[3] ?? "";
    expect(reportExperience.match(/<VoiceTextField/g) ?? []).toHaveLength(2);
  });
});
