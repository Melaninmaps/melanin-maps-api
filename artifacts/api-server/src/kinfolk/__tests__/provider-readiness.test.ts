import { describe, expect, it, vi } from "vitest";
import {
  kinfolkProviderReadinessHttpResult,
  probeKinfolkProviderReadiness,
  summarizeKinfolkProviderReadiness,
} from "../provider-readiness";

const configured = {
  AI_INTEGRATIONS_OPENAI_API_KEY: "present",
  AI_INTEGRATIONS_OPENAI_BASE_URL: "https://provider.example/v1",
};

function pcmWav(durationSeconds = 0.05): Buffer {
  const sampleRate = 8_000;
  const dataLength = Math.round(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(44 + dataLength, 128);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

function authoritativeUtcResponse(url = "https://www.nist.gov/pml/time-and-frequency-division/time-realization/utc") {
  const text = "Coordinated Universal Time is the international time standard called UTC.";
  return {
    output_text: text,
    output: [{
      type: "message",
      content: [{
        type: "output_text",
        text,
        annotations: [{ type: "url_citation", url, start_index: 0, end_index: text.length }],
      }],
    }],
  };
}

function authoritativeTavilyResponse() {
  return new Response(JSON.stringify({ results: [{
    title: "Coordinated Universal Time",
    url: "https://www.nist.gov/pml/time-and-frequency-division/time-realization/utc",
    content: "NIST realizes and distributes Coordinated Universal Time.",
  }] }), { status: 200 });
}

function embeddingVector(length = 1536): number[] {
  return Array.from({ length }, (_, index) => index / 1536);
}

function passingDependencies() {
  return {
    chatCreate: vi.fn().mockResolvedValue({ choices: [{ message: { content: "{\"ok\":true}" } }] }),
    responsesCreate: vi.fn().mockResolvedValue(authoritativeUtcResponse()),
    transcriptionCreate: vi.fn().mockResolvedValue({
      text: "This synthetic provider readiness voice fixture checks transcription.",
    }),
    embeddingsCreate: vi.fn().mockResolvedValue({ data: [{ embedding: embeddingVector() }] }),
    tavilySearch: vi.fn().mockImplementation(async () => authoritativeTavilyResponse()),
    textToSpeech: vi.fn().mockResolvedValue(pcmWav()),
    readFixture: vi.fn().mockResolvedValue(pcmWav()),
  };
}

function row(rows: Awaited<ReturnType<typeof probeKinfolkProviderReadiness>>, capability: string) {
  return rows.find((candidate) => candidate.capability === capability);
}

describe("Kinfolk provider readiness", () => {
  it("fails every required row as missing configuration without calling a provider", async () => {
    const dependencies = passingDependencies();
    const rows = await probeKinfolkProviderReadiness({}, dependencies as never);
    expect(rows.map((candidate) => candidate.capability)).toEqual([
      "staff_demo_chat", "fallback_chat", "web_search", "library_research", "transcription", "tts",
    ]);
    expect(rows.every((candidate) => candidate.status === "FAIL" && candidate.category === "missing_configuration")).toBe(true);
    expect(dependencies.chatCreate).not.toHaveBeenCalled();
    expect(dependencies.responsesCreate).not.toHaveBeenCalled();
  });

  it("probes every configured runtime role and includes optional embedding only when configured", async () => {
    const dependencies = passingDependencies();
    const rows = await probeKinfolkProviderReadiness({
      ...configured,
      KINFOLK_STAFF_DEMO_MODEL: "gpt-5-mini",
      KINFOLK_FALLBACK_MODEL: "gpt-5",
      KINFOLK_WEB_SEARCH_MODEL: "gpt-5-mini",
      LIBRARY_RESEARCH_MODEL: "gpt-5",
      KINFOLK_TRANSCRIPTION_MODEL: "whisper-1",
      KINFOLK_EMBEDDING_DIMENSIONS: "1536",
    }, dependencies as never);
    expect(rows).toEqual([
      { capability: "staff_demo_chat", status: "PASS", category: "ok" },
      { capability: "fallback_chat", status: "PASS", category: "ok" },
      { capability: "web_search", status: "PASS", category: "ok" },
      { capability: "library_research", status: "PASS", category: "ok" },
      { capability: "transcription", status: "PASS", category: "ok" },
      { capability: "tts", status: "PASS", category: "ok" },
      { capability: "embedding", status: "PASS", category: "ok" },
    ]);
    expect(dependencies.chatCreate).toHaveBeenCalledTimes(3);
    expect(dependencies.responsesCreate).toHaveBeenCalledTimes(1);
    expect(dependencies.transcriptionCreate).toHaveBeenCalledTimes(1);
    expect(dependencies.textToSpeech).toHaveBeenCalledTimes(1);
    expect(dependencies.embeddingsCreate).toHaveBeenCalledTimes(1);
    expect(dependencies.embeddingsCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      dimensions: 1536,
      input: "Kinfolk readiness",
    });
  });

  it("probes configured Tavily fallback with one sanitized authoritative result and includes it in aggregate health", async () => {
    const dependencies = passingDependencies();
    const environment = { ...configured, TAVILY_API_KEY: "tavily-test-secret" };
    const rows = await probeKinfolkProviderReadiness(environment, dependencies as never);
    expect(row(rows, "tavily_fallback")).toEqual({
      capability: "tavily_fallback", status: "PASS", category: "ok",
    });
    expect(summarizeKinfolkProviderReadiness(rows)).toEqual({ ok: true });
    expect(dependencies.tavilySearch).toHaveBeenCalledTimes(1);
    const [url, init] = dependencies.tavilySearch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.tavily.com/search");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer tavily-test-secret",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      query: "Coordinated Universal Time NIST definition",
      topic: "general",
      search_depth: "basic",
      max_results: 1,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      include_domains: ["nist.gov"],
      safe_search: true,
    });
  });

  it.each([
    ["auth failure", () => new Response("credential rejected", { status: 401 })],
    ["malformed response", () => new Response("not-json", { status: 200 })],
    ["zero results", () => new Response(JSON.stringify({ results: [] }), { status: 200 })],
    ["unsafe or irrelevant result", () => new Response(JSON.stringify({ results: [{
      title: "Coordinated Universal Time", url: "https://nist.gov.evil.example/utc", content: "Coordinated Universal Time",
    }] }), { status: 200 })],
  ])("fails aggregate readiness for Tavily %s", async (_label, response) => {
    const dependencies = passingDependencies();
    dependencies.tavilySearch.mockImplementation(async () => response());
    const rows = await probeKinfolkProviderReadiness({
      ...configured,
      TAVILY_API_KEY: "never-returned-secret",
    }, dependencies as never);
    expect(row(rows, "tavily_fallback")).toEqual({
      capability: "tavily_fallback", status: "FAIL", category: "connection_failure",
    });
    expect(kinfolkProviderReadinessHttpResult(rows)).toEqual({
      status: 503, body: { ok: false, reason: "connection_failure" },
    });
  });

  it("fails aggregate readiness when the Tavily probe times out", async () => {
    const dependencies = passingDependencies();
    dependencies.tavilySearch.mockImplementation(() => new Promise<Response>(() => undefined));
    const rows = await probeKinfolkProviderReadiness({
      ...configured,
      TAVILY_API_KEY: "timeout-secret",
    }, { ...dependencies, tavilyTimeoutMilliseconds: 5 } as never);
    expect(row(rows, "tavily_fallback")?.status).toBe("FAIL");
    expect(kinfolkProviderReadinessHttpResult(rows).status).toBe(503);
  });

  it("still probes Tavily when fallback is usable but OpenAI configuration is absent", async () => {
    const dependencies = passingDependencies();
    const rows = await probeKinfolkProviderReadiness({ TAVILY_API_KEY: "fallback-only" }, dependencies as never);
    expect(row(rows, "tavily_fallback")?.status).toBe("PASS");
    expect(row(rows, "staff_demo_chat")?.category).toBe("missing_configuration");
    expect(dependencies.tavilySearch).toHaveBeenCalledTimes(1);
    expect(dependencies.chatCreate).not.toHaveBeenCalled();
    expect(kinfolkProviderReadinessHttpResult(rows).status).toBe(503);
  });

  it("uses GPT-5-family-compatible shared Chat Completions shapes for every chat readiness role", async () => {
    const dependencies = passingDependencies();
    await probeKinfolkProviderReadiness({
      ...configured,
      KINFOLK_STAFF_DEMO_MODEL: "gpt-5-mini",
      KINFOLK_FALLBACK_MODEL: "gpt-5",
      LIBRARY_RESEARCH_MODEL: "gpt-5-mini",
    }, dependencies as never);
    const bodies = dependencies.chatCreate.mock.calls.map(([body]) => body as Record<string, unknown>);
    expect(bodies).toHaveLength(3);
    for (const body of bodies) {
      expect(body).toHaveProperty("max_completion_tokens", 1024);
      expect(body).not.toHaveProperty("max_tokens");
      expect(body).not.toHaveProperty("temperature");
    }
    expect(bodies[0]?.response_format).toEqual({ type: "json_object" });
    expect(bodies[1]?.response_format).toEqual({ type: "json_object" });
    expect(bodies[2]?.response_format).toMatchObject({
      type: "json_schema", json_schema: { name: "kinfolk_readiness", strict: true },
    });
  });

  it("requires the exact structured chat predicate rather than merely non-empty text", async () => {
    const dependencies = passingDependencies();
    dependencies.chatCreate
      .mockResolvedValueOnce({ choices: [{ message: { content: "ready" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "{\"ok\":true,\"raw\":\"provider text\"}" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "{\"ok\":true}" } }] });
    const rows = await probeKinfolkProviderReadiness(configured, dependencies as never);
    expect(row(rows, "staff_demo_chat")?.status).toBe("FAIL");
    expect(row(rows, "fallback_chat")?.status).toBe("FAIL");
    expect(row(rows, "library_research")?.status).toBe("PASS");
  });

  it("requires transcript meaning from the synthetic spoken fixture", async () => {
    const dependencies = passingDependencies();
    dependencies.transcriptionCreate.mockResolvedValue({ text: "ready" });
    const rows = await probeKinfolkProviderReadiness(configured, dependencies as never);
    expect(row(rows, "transcription")).toEqual({ capability: "transcription", status: "FAIL", category: "connection_failure" });
  });

  it("accepts the real provider transcript when it retains the three fixture-specific terms", async () => {
    const dependencies = passingDependencies();
    dependencies.transcriptionCreate.mockResolvedValue({
      text: "This readiness voice fixture checks transcription.",
    });
    const rows = await probeKinfolkProviderReadiness(configured, dependencies as never);
    expect(row(rows, "transcription")).toEqual({ capability: "transcription", status: "PASS", category: "ok" });
  });

  it("rejects a plausible transcript that is missing any fixture-specific term", async () => {
    const dependencies = passingDependencies();
    dependencies.transcriptionCreate.mockResolvedValue({ text: "This readiness voice check passed." });
    const rows = await probeKinfolkProviderReadiness(configured, dependencies as never);
    expect(row(rows, "transcription")).toEqual({ capability: "transcription", status: "FAIL", category: "connection_failure" });
  });

  it("requires a decodable WAV rather than arbitrary non-empty TTS bytes", async () => {
    const dependencies = passingDependencies();
    dependencies.textToSpeech.mockResolvedValue(Buffer.from([1, 2, 3]));
    const rows = await probeKinfolkProviderReadiness(configured, dependencies as never);
    expect(row(rows, "tts")?.status).toBe("FAIL");
  });

  it.each([
    ["uncited", { output_text: "Coordinated Universal Time is UTC.", output: [] }],
    ["unsafe private host", authoritativeUtcResponse("https://127.0.0.1/utc")],
    ["spoofed government suffix", authoritativeUtcResponse("https://nist.gov.evil.example.net/utc")],
    ["irrelevant authority", {
      output_text: "Coordinated Universal Time is UTC.",
      output: [{ content: [{ text: "A weather page.", annotations: [{ type: "url_citation", url: "https://www.nist.gov/weather" }] }] }],
    }],
  ])("fails web readiness for %s evidence", async (_label, response) => {
    const dependencies = passingDependencies();
    dependencies.responsesCreate.mockResolvedValue(response);
    const rows = await probeKinfolkProviderReadiness(configured, dependencies as never);
    expect(row(rows, "web_search")?.status).toBe("FAIL");
  });

  it("returns only stable row categories and never provider content, URLs, prompts, models, errors, or secrets", async () => {
    const dependencies = passingDependencies();
    const sensitive = "secret-key raw transcript https://private.example member content";
    dependencies.chatCreate.mockRejectedValue(new Error(sensitive));
    dependencies.responsesCreate.mockResolvedValue(authoritativeUtcResponse());
    dependencies.transcriptionCreate.mockResolvedValue({ text: sensitive });
    dependencies.tavilySearch.mockRejectedValue(new Error(`${sensitive} Coordinated Universal Time NIST definition`));
    const rows = await probeKinfolkProviderReadiness({
      ...configured,
      AI_INTEGRATIONS_OPENAI_API_KEY: sensitive,
      TAVILY_API_KEY: sensitive,
    }, dependencies as never);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain(sensitive);
    expect(serialized).not.toContain("Coordinated Universal Time NIST definition");
    expect(serialized).not.toMatch(/https?:|gpt-|"prompt"|"transcript"|secret|member content/i);
    expect(rows.every((candidate) => Object.keys(candidate).sort().join(",") === "capability,category,status")).toBe(true);
  });

  it("maps any required failure to an honest Kinfolk-only HTTP 503 decision", () => {
    const passing = [{ capability: "fallback_chat", status: "PASS", category: "ok" }] as const;
    const missing = [{ capability: "fallback_chat", status: "FAIL", category: "missing_configuration" }] as const;
    const failed = [{ capability: "web_search", status: "FAIL", category: "connection_failure" }] as const;
    expect(summarizeKinfolkProviderReadiness(passing)).toEqual({ ok: true });
    expect(kinfolkProviderReadinessHttpResult(passing)).toEqual({ status: 200, body: { ok: true } });
    expect(kinfolkProviderReadinessHttpResult(missing)).toEqual({ status: 503, body: { ok: false, reason: "missing_configuration" } });
    expect(kinfolkProviderReadinessHttpResult(failed)).toEqual({ status: 503, body: { ok: false, reason: "connection_failure" } });
  });
});
