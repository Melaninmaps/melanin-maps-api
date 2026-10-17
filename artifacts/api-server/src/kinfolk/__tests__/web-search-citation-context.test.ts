import { describe, expect, it } from "vitest";
import { parseOpenAiResponseCitations } from "../web-search";

const query = {
  text: "Jessica Jones current streaming availability US",
  role: "general" as const,
  reason: "test",
};

describe("OpenAI web-search citation context", () => {
  it("retains the complete cited sentence for deterministic downstream verification", () => {
    const text =
      "Jessica Jones is currently available to watch on Netflix in the United States with a subscription. [1]";
    const results = parseOpenAiResponseCitations(
      {
        output: [
          {
            content: [
              {
                type: "output_text",
                text,
                annotations: [
                  {
                    type: "url_citation",
                    url: "https://www.netflix.com/title/80002311",
                    title: "Watch Jessica Jones | Netflix Official Site",
                    start_index: text.indexOf("[1]"),
                    end_index: text.length,
                  },
                ],
              },
            ],
          },
        ],
      },
      [query],
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.citationText).toContain(
      "Jessica Jones is currently available to watch on Netflix",
    );
  });
});
