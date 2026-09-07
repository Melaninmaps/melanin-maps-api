import { describe, expect, it } from "vitest";
import { parseOpenAiResponseCitations } from "../web-search";

const query = [{ text: "current Maryland news", role: "general" as const, reason: "current" }];

describe("Responses web-search citation contract", () => {
  it("returns only clickable HTTPS citations and provider metadata", () => {
    const support = "Official services reopened.";
    const citations = parseOpenAiResponseCitations({
      output_text: "A current answer.",
      output: [{ type: "message", content: [{ text: `Lead. ${support} Other claim.`, annotations: [
        { url: "https://maryland.gov/news?utm_source=x", title: "Official update", publisher: "Maryland.gov", published_at: "2026-01-02", start_index: 6, end_index: 6 + support.length },
        { url: "http://not-secure.example.com", title: "Excluded" },
        { url: "https://user:secret@example.com/private", title: "Credentialed" },
        { url: "https://localhost/admin", title: "Localhost" },
        { url: "https://service.internal/metadata", title: "Internal" },
        { url: "https://intranet/private", title: "Single-label intranet" },
        { url: "https://127.0.0.1/admin", title: "IPv4" },
        { url: "https://[::1]/admin", title: "IPv6" },
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
});
