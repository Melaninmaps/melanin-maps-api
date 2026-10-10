import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KINFOLK_VOICE_MAX_BYTES,
  KINFOLK_VOICE_MAX_DURATION_MS,
  classifyKinfolkVoiceUploadFailure,
  inferKinfolkVoiceMimeType,
  inspectKinfolkVoiceSource,
  kinfolkVoiceSourceFailureMessage,
} from "../lib/kinfolkVoiceSourceContract";

const root = resolve(__dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("Kinfolk native voice source contract", () => {
  it("accepts only transcription-route containers and rejects duration or size before upload", () => {
    expect(inferKinfolkVoiceMimeType("file:///cache/question.m4a")).toBe("audio/mp4");
    expect(inferKinfolkVoiceMimeType("file:///cache/question.webm?attempt=1")).toBe("audio/webm");
    expect(inferKinfolkVoiceMimeType("file:///cache/question.mp3")).toBeNull();

    expect(inspectKinfolkVoiceSource({
      durationMs: KINFOLK_VOICE_MAX_DURATION_MS,
      sizeBytes: 1024,
      uri: "file:///cache/question.m4a",
    })).toEqual({ ok: true, mimeType: "audio/mp4" });
    expect(inspectKinfolkVoiceSource({
      durationMs: KINFOLK_VOICE_MAX_DURATION_MS + 1,
      sizeBytes: 1024,
      uri: "file:///cache/question.m4a",
    }).failure).toBe("recording_too_long");
    expect(inspectKinfolkVoiceSource({
      durationMs: 1_000,
      sizeBytes: KINFOLK_VOICE_MAX_BYTES + 1,
      uri: "file:///cache/question.m4a",
    }).failure).toBe("recording_too_large");
    expect(inspectKinfolkVoiceSource({
      durationMs: 1_000,
      sizeBytes: 99,
      uri: "file:///cache/question.m4a",
    }).failure).toBe("recording_too_small");
  });

  it("maps transport failures to safe member-facing recovery states", () => {
    expect(classifyKinfolkVoiceUploadFailure({ status: 401 })).toBe("authentication_required");
    expect(classifyKinfolkVoiceUploadFailure({ status: 413 })).toBe("upload_too_large");
    expect(classifyKinfolkVoiceUploadFailure({ status: 429 })).toBe("upload_rate_limited");
    expect(classifyKinfolkVoiceUploadFailure({ code: "AUDIO_MIME_MISMATCH" })).toBe("transcription_failed");
    expect(classifyKinfolkVoiceUploadFailure({ code: "TRANSCRIPTION_PROVIDER_FAILED" })).toBe("transcription_failed");

    const message = kinfolkVoiceSourceFailureMessage("transcription_failed");
    expect(message).toContain("could not transcribe");
    expect(message).not.toContain("provider");
    expect(message).not.toContain("token");
    expect(message).not.toContain("transcript text");
  });

  it("keeps raw audio temporary, abortable, and out of chat submission", () => {
    const hook = source("hooks/useKinfolkVoiceSource.ts");
    expect(hook).toContain("requestRecordingPermissionsAsync");
    expect(hook).toContain("KINFOLK_VOICE_MAX_DURATION_MS");
    expect(hook).toContain("inspectKinfolkVoiceSource");
    expect(hook).toContain("abortControllerRef.current?.abort()");
    expect(hook).toContain("clearTemporaryFile(uri)");
    expect(hook).toContain("finally");
    expect(hook).toContain("/api/kinfolk/transcribe");
    expect(hook).not.toContain("/api/kinfolk/chat");
    expect(hook).not.toContain("console.");
  });

  it("requires an editable review and explicit draft placement rather than auto-sending a transcript", () => {
    const controls = source("components/KinfolkVoiceSourceControls.tsx");
    expect(controls).toContain("Nothing is uploaded until you stop");
    expect(controls).toContain("Cancel recording and discard local audio");
    expect(controls).toContain("Review transcription");
    expect(controls).toContain("Add to draft");
    expect(controls).toContain("It will not be sent until you review it");
    expect(controls).not.toContain("/api/kinfolk/chat");
  });

  it("integrates the native lifecycle into the primary chat without auto-sending a turn", () => {
    const travel = source("app/travel.tsx");
    expect(travel).toContain("useKinfolkVoiceSource");
    expect(travel).toContain("KinfolkVoiceSourceControls");
    expect(travel).toContain("startPrimaryVoiceSource");
    expect(travel).toContain("addPrimaryVoiceTranscriptToDraft");
    expect(travel).toContain("It never creates a");
    expect(travel).toContain("chat turn—the member must still review");
    expect(travel).toContain("setInputText(transcript)");
  });
});
