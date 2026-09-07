import { describe, expect, it } from "vitest";
import {
  KINFOLK_OPENAI_WEB_SEARCH_TIMEOUT_MS,
  parseOpenAiResponseCitations,
} from "../web-search";

const query = [{ text: "current Maryland news", role: "general" as const, reason: "current" }];

describe("Responses web-search citation contract", () => {
  it("uses the provider-proven bounded timeout for cited current research", () => {
    expect(KINFOLK_OPENAI_WEB_SEARCH_TIMEOUT_MS).toBe(30_000);
  });

  it("returns only clickable HTTPS citations and provider metadata", () => {
    const support = "Official services reopened.";
    const citations = parseOpenAiResponseCitations({
      output_text: "A current answer.",
      output: [{ type: "message", content: [{ text: `Lead. ${support} Other claim.`, annotations: [
        { type: "url_citation", url: "https://maryland.gov/news?utm_source=x", title: "Official update", publisher: "Maryland.gov", published_at: "2026-01-02", start_index: 6, end_index: 6 + support.length },
        { type: "url_citation", url: "http://not-secure.example.com", title: "Excluded" },
        { type: "url_citation", url: "https://user:secret@example.com/private", title: "Credentialed" },
        { type: "url_citation", url: "https://localhost/admin", title: "Localhost" },
        { type: "url_citation", url: "https://service.internal/metadata", title: "Internal" },
        { type: "url_citation", url: "https://intranet/private", title: "Single-label intranet" },
        { type: "url_citation", url: "https://127.0.0.1/admin", title: "IPv4" },
        { type: "url_citation", url: "https://[::1]/admin", title: "IPv6" },
        { type: "web_search_result", url: "https://uncited.example.com", title: "Consulted, not cited" },
      ] }] }],
    }, query);
    expect(citations).toEqual([expect.objectContaining({
      title: "Official update", url: "https://maryland.gov/news",
      publisher: "Maryland.gov", sourceDate: "2026-01-02", content: support,
    })]);
  });

  it("returns no invented citation when research yields no citation annotations", () => {
    expect(parseOpenAiResponseCitations({ output_text: "No sources." }, query)).toEqual([]);
  });

  it("does not treat an arbitrary provider URL field as a citation", () => {
    expect(parseOpenAiResponseCitations({
      output: [{ type: "web_search_call", action: { sources: [{ url: "https://source.example.com" }] } }],
    }, query)).toEqual([]);
  });
});
