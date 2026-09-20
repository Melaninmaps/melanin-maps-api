import { describe, expect, it } from "vitest";
import { buildKendrickDrakeCulturalConsensusAnswer } from "../cultural-consensus-answer";

describe("Kinfolk Kendrick Drake cultural consensus answer", () => {
  it("answers the named battle directly with sourced consensus and facts", () => {
    const answer = buildKendrickDrakeCulturalConsensusAnswer("Between Drake and Kendrick, who won the beef?");
    expect(answer?.reply).toContain("broad public and cultural consensus");
    expect(answer?.reply).toContain("evaluative conclusion—not an objective fact");
    expect(answer?.reply).toContain("five GRAMMY Awards");
    expect(answer?.reply).toContain("70.9 million official U.S. streams");
    expect(answer?.reply).toContain("38 million streams");
    expect(answer?.reply).toContain("allegations, not verified facts");
    expect(answer?.sources.map((source) => source.url)).toEqual([
      "https://www.grammy.com/news/kendrick-lamar-not-like-us-wins-record-of-the-year-2025-grammys/",
      "https://www.billboard.com/lists/kendrick-lamar-not-like-us-hot-100-number-one-debut/",
    ]);
    expect(answer?.followUpSuggestions).toEqual([
      "What is Kendrick Lamar working on right now?",
      "What is Drake working on right now?",
      "Compare their battle impact with their overall commercial history.",
    ]);
  });

  it("does not substitute the answer for other artist conflicts", () => {
    expect(buildKendrickDrakeCulturalConsensusAnswer("Who won Nicki and Cardi's beef?"))
      .toBeNull();
  });
});
