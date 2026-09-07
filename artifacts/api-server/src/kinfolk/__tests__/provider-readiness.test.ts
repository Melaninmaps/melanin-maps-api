import { describe, expect, it, vi } from "vitest";
import { probeKinfolkProviderReadiness } from "../provider-readiness";

const configured = {
  AI_INTEGRATIONS_OPENAI_API_KEY: "present",
  AI_INTEGRATIONS_OPENAI_BASE_URL: "https://provider.example/v1",
};

describe("Kinfolk provider readiness", () => {
  it("fails every row as missing configuration without calling a provider", async () => {
    const chatCreate = vi.fn();
    const rows = await probeKinfolkProviderReadiness({}, {
      chatCreate: chatCreate as never,
    });
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.status === "FAIL" && row.category === "missing_configuration")).toBe(true);
    expect(chatCreate).not.toHaveBeenCalled();
  });

  it("requires real success evidence for each provider capability", async () => {
    const rows = await probeKinfolkProviderReadiness(configured, {
      chatCreate: vi.fn().mockResolvedValue({ choices: [{ message: { content: "{\"ok\":true}" } }] }) as never,
      responsesCreate: vi.fn().mockResolvedValue({
        output: [{ content: [{ annotations: [{ type: "url_citation", url: "https://www.nps.gov/" }] }] }],
      }) as never,
      transcriptionCreate: vi.fn().mockResolvedValue({ text: "ready" }) as never,
      textToSpeech: vi.fn().mockResolvedValue(Buffer.from([1, 2, 3])) as never,
      readFixture: vi.fn().mockResolvedValue(Buffer.from("wav")) as never,
    });
    expect(rows).toEqual([
      { capability: "staff_demo_chat", status: "PASS", category: "ok" },
      { capability: "fallback_chat", status: "PASS", category: "ok" },
      { capability: "web_search", status: "PASS", category: "ok" },
      { capability: "transcription", status: "PASS", category: "ok" },
      { capability: "tts", status: "PASS", category: "ok" },
    ]);
  });

  it("fails web search when the provider did not produce an explicit URL citation", async () => {
    const rows = await probeKinfolkProviderReadiness(configured, {
      chatCreate: vi.fn().mockResolvedValue({ choices: [{ message: { content: "{\"ok\":true}" } }] }) as never,
      responsesCreate: vi.fn().mockResolvedValue({ output: [{ type: "web_search_call" }] }) as never,
      transcriptionCreate: vi.fn().mockResolvedValue({ text: "ready" }) as never,
      textToSpeech: vi.fn().mockResolvedValue(Buffer.from([1])) as never,
      readFixture: vi.fn().mockResolvedValue(Buffer.from("wav")) as never,
    });
    expect(rows.find((row) => row.capability === "web_search")).toEqual({
      capability: "web_search", status: "FAIL", category: "connection_failure",
    });
  });
});