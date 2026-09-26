import { readFileSync } from "node:fs";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const transcribe = vi.hoisted(() => vi.fn());
const resolveOpenAIConfiguration = vi.hoisted(() => vi.fn());
const resolveAudioOpenAIConfiguration = vi.hoisted(() => vi.fn());
vi.mock("@workspace/integrations-openai-ai-server", () => ({
  openai: {
    audio: { transcriptions: { create: transcribe } },
    chat: { completions: { create: vi.fn() } },
    responses: { create: vi.fn() },
  },
  resolveOpenAIConfiguration,
}));
vi.mock("@workspace/integrations-openai-ai-server/audio", () => ({
  audioOpenai: { audio: { transcriptions: { create: transcribe } } },
  resolveAudioOpenAIConfiguration,
  textToSpeechWithStyle: vi.fn(),
}));

import router, { safeKinfolkErrorMetadata } from "../../routes/kinfolk";

const fixtures = new URL("./fixtures/", import.meta.url);
const load = (name: string) => readFileSync(new URL(name, fixtures));
let memberSequence = 0;

function longPcmWav(durationSeconds: number): Buffer {
  const sampleRate = 8_000;
  const dataLength = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(44 + dataLength, 128);
  buffer.write("RIFF", 0, "ascii"); buffer.writeUInt32LE(36 + dataLength, 4); buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii"); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate, 28); buffer.writeUInt16LE(1, 32); buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36, "ascii"); buffer.writeUInt32LE(dataLength, 40);
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

function safariStyleFragmentedM4a(): Buffer {
  const tkhd = isoBox("tkhd", fullBox(0, u32(0), u32(0), u32(1), u32(0), u32(0)));
  const mdhd = isoBox("mdhd", fullBox(0, u32(0), u32(0), u32(48_000), u32(0)));
  const hdlr = isoBox("hdlr", fullBox(0, u32(0), Buffer.from("soun", "ascii")));
  const trak = isoBox("trak", tkhd, isoBox("mdia", mdhd, hdlr));
  const trex = isoBox("trex", fullBox(0, u32(1), u32(1), u32(1_024), u32(0)));
  const moov = isoBox("moov", trak, isoBox("mvex", trex));
  const tfhd = isoBox("tfhd", fullBox(0x000008, u32(1), u32(1_024)));
  const trun = isoBox("trun", fullBox(0, u32(96)));
  const moof = isoBox("moof", isoBox("traf", tfhd, trun));
  return Buffer.concat([isoBox("ftyp", Buffer.from("isom\x00\x00\x00\x01isom", "binary")), moov, moof, isoBox("mdat", Buffer.from([0]))]);
}

function app(authenticated = true) {
  const instance = express();
  instance.use((req, _res, next) => {
    if (authenticated) (req as any).user = { id: `voice-member-${++memberSequence}` };
    (req as any).log = {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };
    next();
  });
  instance.use(express.json());
  instance.use("/api", router);
  return instance;
}

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test-provider-key";
  resolveOpenAIConfiguration.mockImplementation((environment = process.env) =>
    environment.OPENAI_API_KEY || environment.AI_INTEGRATIONS_OPENAI_API_KEY
      ? { apiKey: "test-provider-key", baseURL: "https://api.openai.test/v1" }
      : null,
  );
  resolveAudioOpenAIConfiguration.mockImplementation((environment = process.env) =>
    environment.OPENAI_API_KEY || environment.AI_INTEGRATIONS_OPENAI_API_KEY
      ? { apiKey: "test-provider-key", baseURL: "https://api.openai.test/v1" }
      : null,
  );
  transcribe.mockResolvedValue({ text: "hello Kinfolk" });
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  vi.clearAllMocks();
});

describe("actual Kinfolk transcription handler", () => {
  it("never carries adversarial provider or member content into structured error metadata", () => {
    const sensitive = "raw question transcript member-123 secret-key provider text https://private.example";
    const metadata = safeKinfolkErrorMetadata(Object.assign(new Error(sensitive), { code: sensitive, status: 503 }));
    expect(metadata).toEqual({ errorCode: undefined, providerStatus: 503, timeout: false });
    expect(JSON.stringify(metadata)).not.toContain(sensitive);
    for (const fragment of ["raw question", "transcript", "member-123", "secret-key", "provider text", "private.example"]) {
      expect(JSON.stringify(metadata)).not.toContain(fragment);
    }
  });

  it("checks authentication before revealing provider configuration", async () => {
    delete process.env.OPENAI_API_KEY;
    const response = await request(app(false)).post("/api/kinfolk/transcribe");
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: "AUTHENTICATION_REQUIRED", audioRetained: false });
  });

  it("accepts the standard production OpenAI configuration for voice input", async () => {
    const response = await request(app())
      .post("/api/kinfolk/transcribe")
      .attach("audio", load("voice.wav"), { filename: "voice.wav", contentType: "audio/wav" });
    expect(response.status).toBe(200);
    expect(resolveAudioOpenAIConfiguration).toHaveBeenCalled();
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(transcribe).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-transcribe" }),
      expect.anything(),
    );
  });

  it.each([
    ["voice.wav", "audio/wav"],
    ["voice.mp3", "audio/mpeg"],
    ["voice.m4a", "audio/mp4"],
    ["voice.webm", "audio/webm"],
  ])("accepts real %s bytes and calls the provider once", async (filename, mimeType) => {
    const response = await request(app())
      .post("/api/kinfolk/transcribe")
      .attach("audio", load(filename), { filename, contentType: mimeType });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ transcript: "hello Kinfolk", audioRetained: false });
    expect(transcribe).toHaveBeenCalledTimes(1);
  });

  it("accepts a Safari-style fragmented M4A with zero movie-header duration", async () => {
    const response = await request(app())
      .post("/api/kinfolk/transcribe")
      .field("mimeType", "audio/mp4")
      .field("durationMs", "2048")
      .attach("audio", safariStyleFragmentedM4a(), { filename: "kinfolk-voice.m4a", contentType: "audio/mp4" });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ transcript: "hello Kinfolk", audioRetained: false });
    expect(transcribe).toHaveBeenCalledTimes(1);
  });

  it("rejects JSON legacy voice with an explicit current-client error", async () => {
    const response = await request(app())
      .post("/api/kinfolk/transcribe")
      .send({ audio: "legacy-base64-payload", format: "wav" });
    expect(response.status).toBe(415);
    expect(response.body).toMatchObject({ error: "AUDIO_MULTIPART_REQUIRED", audioRetained: false });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("rejects contradictory or invalid multipart metadata before provider upload", async () => {
    const mismatchedMime = await request(app())
      .post("/api/kinfolk/transcribe")
      .field("mimeType", "audio/mpeg")
      .attach("audio", load("voice.wav"), { filename: "voice.wav", contentType: "audio/wav" });
    expect(mismatchedMime.status).toBe(400);
    expect(mismatchedMime.body).toMatchObject({ error: "AUDIO_MIME_MISMATCH", audioRetained: false });

    const invalidDuration = await request(app())
      .post("/api/kinfolk/transcribe")
      .field("durationMs", "not-a-duration")
      .attach("audio", load("voice.wav"), { filename: "voice.wav", contentType: "audio/wav" });
    expect(invalidDuration.status).toBe(400);
    expect(invalidDuration.body).toMatchObject({ error: "AUDIO_METADATA_INVALID", audioRetained: false });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("uses declared duration as an early bound but still inspects accepted bytes", async () => {
    const declaredTooLong = await request(app())
      .post("/api/kinfolk/transcribe")
      .field("durationMs", "60001")
      .attach("audio", load("voice.wav"), { filename: "voice.wav", contentType: "audio/wav" });
    expect(declaredTooLong.status).toBe(400);
    expect(declaredTooLong.body).toMatchObject({ error: "AUDIO_DURATION_EXCEEDED", audioRetained: false });

    const understatedLongAudio = await request(app())
      .post("/api/kinfolk/transcribe")
      .field("durationMs", "1000")
      .field("mimeType", "audio/wav")
      .attach("audio", longPcmWav(61), { filename: "voice.wav", contentType: "audio/wav" });
    expect(understatedLongAudio.status).toBe(400);
    expect(understatedLongAudio.body).toMatchObject({ error: "AUDIO_DURATION_EXCEEDED", audioRetained: false });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it.each([
    ["MIME/container mismatch", "voice.wav", "voice.mp3", "audio/mpeg", "AUDIO_MIME_MISMATCH"],
    ["video-bearing MP4", "video-with-audio.mp4", "video-with-audio.mp4", "audio/mp4", "AUDIO_MIME_MISMATCH"],
  ])("rejects %s before calling the provider", async (_label, fixture, filename, mimeType, error) => {
    const response = await request(app())
      .post("/api/kinfolk/transcribe")
      .attach("audio", load(fixture), { filename, contentType: mimeType });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error, audioRetained: false });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("rejects a measured recording over 60 seconds before calling the provider", async () => {
    const response = await request(app())
      .post("/api/kinfolk/transcribe")
      .attach("audio", longPcmWav(61), { filename: "voice.wav", contentType: "audio/wav" });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: "AUDIO_DURATION_EXCEEDED", audioRetained: false });
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("rejects unsupported and oversized uploads before calling the provider", async () => {
    const unsupported = await request(app())
      .post("/api/kinfolk/transcribe")
      .attach("audio", Buffer.from("not audio"), { filename: "voice.bin", contentType: "application/octet-stream" });
    expect(unsupported.status).toBe(400);

    const oversized = await request(app())
      .post("/api/kinfolk/transcribe")
      .attach("audio", Buffer.alloc(4 * 1024 * 1024 + 1, 1), { filename: "voice.wav", contentType: "audio/wav" });
    expect(oversized.status).toBe(413);
    expect(oversized.body).toMatchObject({ error: "AUDIO_PAYLOAD_TOO_LARGE", audioRetained: false });
    expect(transcribe).not.toHaveBeenCalled();
  });
});
