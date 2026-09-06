import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAiTranscriptionProvider } from "./openAiTranscriptionProvider";

const originalFetch = globalThis.fetch;

afterEach(() => { globalThis.fetch = originalFetch; });

describe("OpenAI multipart transcription provider", () => {
  it("submits a known WAV-like audio buffer as multipart and returns its contract text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: "hello Kinfolk" }), { status: 200 }));
    globalThis.fetch = fetchMock;
    const provider = createOpenAiTranscriptionProvider({
      apiKey: "test-key", baseUrl: "https://provider.example/v1", model: "gpt-4o-mini-transcribe",
    });
    await expect(provider.transcribe({
      audio: Buffer.from("RIFF-known-audio-fixture"), filename: "fixture.wav", mimeType: "audio/wav",
    })).resolves.toBe("hello Kinfolk");
    const [, request] = fetchMock.mock.calls[0]!;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get("model")).toBe("gpt-4o-mini-transcribe");
    expect((request.body as FormData).get("file")).toBeInstanceOf(Blob);
  });

  it("preserves a provider failure for the route to report honestly", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: "provider unavailable" },
    }), { status: 503 }));
    const provider = createOpenAiTranscriptionProvider({
      apiKey: "test-key", baseUrl: "https://provider.example/v1", model: "gpt-4o-mini-transcribe",
    });
    await expect(provider.transcribe({
      audio: Buffer.from("RIFF-known-audio-fixture"), filename: "fixture.wav", mimeType: "audio/wav",
    })).rejects.toThrow("provider unavailable");
  });
});