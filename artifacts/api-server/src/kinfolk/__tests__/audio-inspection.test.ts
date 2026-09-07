import { describe, expect, it } from "vitest";
import {
  canonicalVoiceFormat,
  inspectVoiceAudio,
  VoiceAudioInspectionError,
} from "../voice/audioInspection";

function pcmWav(durationSeconds: number): Buffer {
  const sampleRate = 8_000;
  const channels = 1;
  const bitsPerSample = 8;
  const dataLength = Math.round(sampleRate * durationSeconds * channels * bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataLength, 128);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  buffer.writeUInt16LE(channels * bitsPerSample / 8, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

describe("Kinfolk voice audio inspection", () => {
  it("normalizes only supported mobile and browser recording MIME aliases", () => {
    expect(canonicalVoiceFormat("audio/x-m4a")).toEqual({ safeFormat: "m4a", mimeType: "audio/mp4" });
    expect(canonicalVoiceFormat("audio/webm;codecs=opus")).toEqual({ safeFormat: "webm", mimeType: "audio/webm" });
    expect(canonicalVoiceFormat("video/mp4")).toBeNull();
  });

  it("detects a real WAV container and measures duration from its bytes", async () => {
    await expect(inspectVoiceAudio(pcmWav(2), "audio/wav", 60_000)).resolves.toMatchObject({
      durationMs: 2_000,
    });
  });

  it("rejects a measured recording over 60 seconds even without client duration", async () => {
    await expect(inspectVoiceAudio(pcmWav(61), "audio/wav", 60_000)).rejects.toMatchObject({
      code: "AUDIO_DURATION_EXCEEDED",
    });
  });

  it("rejects declared MIME that does not match the detected container", async () => {
    await expect(inspectVoiceAudio(pcmWav(1), "audio/mp4", 60_000)).rejects.toBeInstanceOf(VoiceAudioInspectionError);
    await expect(inspectVoiceAudio(pcmWav(1), "audio/mp4", 60_000)).rejects.toMatchObject({
      code: "AUDIO_MIME_MISMATCH",
    });
  });

  it("rejects invalid bytes without echoing them", async () => {
    await expect(inspectVoiceAudio(Buffer.alloc(256, 7), "audio/wav", 60_000)).rejects.toMatchObject({
      code: "AUDIO_MIME_MISMATCH",
    });
  });
});
