import { describe, expect, it } from "vitest";
import { parseOpenAiResponseCitations } from "../web-search";

const query = [{ text: "current Maryland news", role: "general" as const, reason: "current" }];

describe("Responses web-search citation contract", () => {
  it("returns only clickable HTTPS citations and provider metadata", () => {
    const citations = parseOpenAiResponseCitations({
      output_text: "A current answer.",
      output: [{ type: "message", content: [{ annotations: [
        { url: "https://maryland.gov/news?utm_source=x", title: "Official update", publisher: "Maryland.gov", published_at: "2026-01-02" },
        { url: "http://not-secure.example", title: "Excluded" },
      ] }] }],
    }, query);
    expect(citations).toEqual([expect.objectContaining({
      title: "Official update", url: "https://maryland.gov/news",
      publisher: "Maryland.gov", sourceDate: "2026-01-02",
    })]);
  });

  it("returns no invented citation when research yields no citation annotations", () => {
    expect(parseOpenAiResponseCitations({ output_text: "No sources." }, query)).toEqual([]);
  });
});