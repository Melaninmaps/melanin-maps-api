import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createVoicePreflightStages,
  formatVoicePreflightLog,
  inferVoicePreflightMimeType,
  updateVoicePreflightStage,
  voicePreflightFailure,
} from "../lib/voicePreflight";

const root = resolve(__dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("Kinfolk Voice Preflight", () => {
  it("tracks all required diagnostic stages without retaining audio or transcript content", () => {
    const stages = createVoicePreflightStages();
    expect(stages.map((stage) => stage.id)).toEqual([
      "permission",
      "audio_route",
      "recording_started",
      "recording_captured",
      "transcription_upload",
      "transcript_inserted",
      "chat_reply",
      "speech_created",
      "playback_started",
      "playback_completed",
    ]);
    const passed = updateVoicePreflightStage(stages, "recording_captured", "passed", "1200 ms · 4096 bytes · declared audio/mp4.");
    const log = formatVoicePreflightLog([{
      id: "voice-test",
      startedAt: "2026-09-29T00:00:00.000Z",
      platform: "ios",
      route: "bluetooth",
      stages: passed,
    }]);
    expect(log).toContain("Recording captured: passed");
    expect(log).toContain("1200 ms · 4096 bytes · declared audio/mp4.");
    expect(log).toContain("excludes recording contents, transcript text, account tokens, and raw audio");
    expect(log).not.toContain("secret transcript");
  });

  it("uses known MIME mappings and specific failure language", () => {
    expect(inferVoicePreflightMimeType("file:///cache/test.m4a")).toBe("audio/mp4");
    expect(inferVoicePreflightMimeType("file:///cache/test.webm")).toBe("audio/webm");
    expect(inferVoicePreflightMimeType("file:///cache/test.bin")).toBeNull();
    expect(voicePreflightFailure("permission")).toContain("Microphone permission is off");
    expect(voicePreflightFailure("transcription_upload")).toContain("Upload failed");
    expect(voicePreflightFailure("playback_started")).toContain("Speech playback could not start");
  });

  it("uses the authenticated existing voice contracts and removes temporary audio", () => {
    const preflight = source("app/kinfolk-voice-preflight.tsx");
    expect(preflight).toContain("/api/kinfolk/transcribe");
    expect(preflight).toContain("/api/kinfolk/chat");
    expect(preflight).toContain("/api/kinfolk/speak");
    expect(preflight).toContain("file.delete()");
    expect(preflight).toContain("audio route");
    expect(preflight).toContain("The text is not copied into the technical log");
    expect(preflight).toContain("five consecutive normal voice turns");
    expect(preflight).toContain('speakerProfile?: "standard" | "female"');
    expect(preflight).toContain('payload.speakerProfile === "female"');
    expect(preflight).toContain("Standard Kinfolk Voice and Female Voice");
  });

  it("aborts and deletes a recording when the app backgrounds before it can upload", () => {
    const preflight = source("app/kinfolk-voice-preflight.tsx");
    const backgroundAbort = preflight.slice(
      preflight.indexOf("const abortBackgroundRecording = async"),
      preflight.indexOf('AppState.addEventListener("change"'),
    );
    const stopAndTranscribe = preflight.slice(
      preflight.indexOf("const stopAndTranscribe = async"),
      preflight.indexOf("const sendTranscript = async"),
    );
    const stopFinally = stopAndTranscribe.slice(stopAndTranscribe.lastIndexOf("} finally {"));
    expect(backgroundAbort).toContain("backgroundCancelledAttemptIdsRef.current.add(attemptId);");
    expect(backgroundAbort).toContain("recordingStartedAtRef.current = null;");
    expect(backgroundAbort).toContain("setRecordedUri(null);");
    expect(backgroundAbort).toContain("setRecordedDurationMs(0);");
    expect(backgroundAbort).toContain("if (recorder.isRecording) await recorder.stop();");
    expect(backgroundAbort).toContain("cleanRecordedFile(recorder.uri);");
    expect(preflight).toContain("inFlightRecordingAttemptRef.current = attemptId;");
    expect(preflight).toContain("const backgroundAbortPromiseRef = useRef<Promise<void> | null>(null);");
    expect(preflight).toContain("backgroundAbortPromiseRef.current = backgroundAbort;");
    expect(preflight).toContain("const backgroundAbort = abortBackgroundRecording();");
    expect(preflight).toContain("if (attemptId && !backgroundCancelledAttemptIdsRef.current.has(attemptId))");
    expect(preflight).toContain("isStoppingRef.current || inFlightRecordingAttemptRef.current || recorderState.isRecording");
    expect(stopAndTranscribe).toContain("isStopping || isStoppingRef.current");
    expect(stopAndTranscribe).toContain("isStoppingRef.current = true;");
    expect(stopAndTranscribe).toContain("isStoppingRef.current = false;");
    expect(stopAndTranscribe.match(/backgroundCancelledAttemptIdsRef\.current\.has\(attemptId\)/g)).toHaveLength(2);
    expect(stopAndTranscribe.lastIndexOf("backgroundCancelledAttemptIdsRef.current.has(attemptId)")).toBeLessThan(
      stopAndTranscribe.indexOf("/api/kinfolk/transcribe"),
    );
    expect(stopFinally).toContain("await waitForBackgroundAbort();");
    expect(stopFinally.indexOf("await waitForBackgroundAbort();")).toBeLessThan(
      stopFinally.indexOf("isStoppingRef.current = false;"),
    );
    expect(backgroundAbort).toContain("if (!isStoppingRef.current && inFlightRecordingAttemptRef.current === attemptId)");
  });

  it("keeps the screen reachable from Kinfolk settings and registered in native navigation", () => {
    const settings = source("components/KinfolkSettingsControlCenter.tsx");
    const layout = source("app/_layout.tsx");
    expect(settings).toContain("Run Voice Preflight");
    expect(settings).toContain('router.push("/kinfolk-voice-preflight" as never)');
    expect(layout).toContain('name="kinfolk-voice-preflight"');
  });
});
