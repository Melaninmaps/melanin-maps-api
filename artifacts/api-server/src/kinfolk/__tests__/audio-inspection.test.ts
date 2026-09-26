import { describe, expect, it } from "vitest";
import {
  canonicalVoiceFormat,
  inspectFragmentedMp4Duration,
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

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function isoBox(type: string, ...payloads: Buffer[]): Buffer {
  const payload = Buffer.concat(payloads);
  const buffer = Buffer.alloc(8 + payload.length);
  buffer.writeUInt32BE(buffer.length, 0);
  buffer.write(type, 4, "ascii");
  payload.copy(buffer, 8);
  return buffer;
}

function fullBox(flags: number, ...payloads: Buffer[]): Buffer {
  return Buffer.concat([Buffer.from([0, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff]), ...payloads]);
}

/** A small, structurally valid audio-only fMP4 with zero movie-header duration. */
function fragmentedM4a(sampleCount: number, defaultSampleDuration = 1_024, timescale = 48_000): Buffer {
  const tkhd = isoBox("tkhd", fullBox(0, u32(0), u32(0), u32(1), u32(0), u32(0)));
  const mdhd = isoBox("mdhd", fullBox(0, u32(0), u32(0), u32(timescale), u32(0)));
  const hdlr = isoBox("hdlr", fullBox(0, u32(0), Buffer.from("soun", "ascii")));
  const mdia = isoBox("mdia", mdhd, hdlr);
  const trak = isoBox("trak", tkhd, mdia);
  const trex = isoBox("trex", fullBox(0, u32(1), u32(1), u32(defaultSampleDuration), u32(0)));
  const moov = isoBox("moov", trak, isoBox("mvex", trex));
  const tfhd = isoBox("tfhd", fullBox(0x000008, u32(1), u32(defaultSampleDuration)));
  const trun = isoBox("trun", fullBox(0, u32(sampleCount)));
  const moof = isoBox("moof", isoBox("traf", tfhd, trun));
  return Buffer.concat([isoBox("ftyp", Buffer.from("isom\x00\x00\x00\x01isom", "binary")), moov, moof, isoBox("mdat", Buffer.from([0]))]);
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

  it("measures a valid Safari-style fragmented M4A when the movie header has no duration", async () => {
    const audio = fragmentedM4a(96);
    await expect(inspectFragmentedMp4Duration(audio)).toEqual({
      container: "M4A fragmented MP4",
      durationMs: 2_048,
    });
    await expect(inspectVoiceAudio(audio, "audio/mp4", 60_000)).resolves.toEqual({
      container: "M4A fragmented MP4",
      durationMs: 2_048,
    });
  });

  it("still rejects a fragmented M4A whose measured audio exceeds the voice limit", async () => {
    await expect(inspectVoiceAudio(fragmentedM4a(3_000), "audio/mp4", 60_000)).rejects.toMatchObject({
      code: "AUDIO_DURATION_EXCEEDED",
    });
  });
});
