import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAndroidVoiceUploadPlan,
  hasIsoBmffHeader,
  inferKinfolkVoiceMimeType,
} from "../lib/kinfolkVoiceUploadPolicy";

const root = resolve(__dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

function m4aHeader(): Uint8Array {
  return Uint8Array.from([0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]);
}

describe("Kinfolk Android voice multipart policy", () => {
  it("uses M4A/AAC metadata for the Android HIGH_QUALITY recorder and strips URI query data", () => {
    expect(inferKinfolkVoiceMimeType("file:///cache/Audio/recording-123.m4a?temporary=1")).toBe("audio/mp4");
    expect(inferKinfolkVoiceMimeType("file:///cache/Audio/recording-123.webm")).toBe("audio/webm");
    expect(inferKinfolkVoiceMimeType("file:///cache/Audio/recording-123.3gp")).toBeNull();

    const plan = createAndroidVoiceUploadPlan(
      "file:///cache/Audio/recording-123.m4a",
      "audio/mpeg",
      m4aHeader(),
    );
    expect(plan).toEqual({
      mimeType: "audio/mp4",
      filename: "kinfolk-voice.m4a",
      requiresTypedBlob: true,
    });
  });

  it("requires real ISO-BMFF container bytes before canonical Android multipart metadata is used", () => {
    expect(hasIsoBmffHeader(m4aHeader())).toBe(true);
    expect(hasIsoBmffHeader(Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);

    expect(() => createAndroidVoiceUploadPlan(
      "file:///cache/Audio/recording-123.m4a",
      "audio/mpeg",
      Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]),
    )).toThrow("not a supported M4A audio file");
    expect(() => createAndroidVoiceUploadPlan(
      "file:///cache/Audio/recording-123.3gp",
      "audio/3gpp",
      m4aHeader(),
    )).toThrow("must record M4A audio");
  });

  it("uses one shared typed-Blob transport in primary chat and the floating widget", () => {
    const primary = source("app/travel.tsx");
    const widget = source("components/AIChatWidget.tsx");

    for (const surface of [primary, widget]) {
      expect(surface).toContain("prepareKinfolkVoiceUpload(uri, Platform.OS)");
      expect(surface).toContain('form.append("audio", voiceUpload.body, voiceUpload.filename)');
      expect(surface).toContain('form.append("mimeType", voiceUpload.mimeType)');
      expect(surface).toContain("voiceUpload?.cleanup()");
      expect(surface).not.toContain('form.append("audio", new FileSystem.File(uri))');
      expect(surface).not.toContain("handleSend(payload.text)");
    }

    const helper = source("lib/kinfolkVoiceUpload.ts");
    expect(helper).toContain("new Blob([recordingFile], { type: plan.mimeType })");
    expect(helper).toContain("readBytes(12)");
    expect(helper).toContain("platform === \"android\"");
    expect(helper).toContain("cleanup: () => safeDelete(recordingFile)");
  });

  it("keeps a draft and resets recording state after retryable transcription failure on both native surfaces", () => {
    const primary = source("app/travel.tsx");
    const widget = source("components/AIChatWidget.tsx");

    expect(primary).toContain("const preservedDraft = primaryRecordingDraftRef.current");
    expect(primary).toContain("setInputText(preservedDraft)");
    expect(primary).toContain("setIsRecordingVoice(false)");
    expect(primary).toContain("setIsTranscribingVoice(false)");
    expect(primary).toContain("setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })");

    expect(widget).toContain("const preservedDraft = recordingDraftRef.current");
    expect(widget).toContain("setInput(preservedDraft)");
    expect(widget).toContain("setIsRecording(false)");
    expect(widget).toContain("setRecordingElapsedSeconds(0)");
    expect(widget).toContain("setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })");
  });
});
