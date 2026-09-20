export type KinfolkCulturalConsensusAnswer = Readonly<{
  reply: string;
  sources: ReadonlyArray<Readonly<{ title: string; url: string }>>;
  followUpSuggestions: readonly string[];
}>;

const KENDRICK_DRAKE_PAIR = /\b(?:kendrick(?:\s+lamar)?\b[\s\S]{0,80}\bdrake\b|\bdrake\b[\s\S]{0,80}\bkendrick(?:\s+lamar)?\b)/i;

/**
 * Provides a narrowly scoped, sourced answer for the specific 2024 Kendrick
 * Lamar/Drake battle. "Who won" is clearly marked as cultural consensus rather
 * than an objective fact, while the supporting impact measures are factual.
 */
export function buildKendrickDrakeCulturalConsensusAnswer(
  message: string,
): KinfolkCulturalConsensusAnswer | null {
  if (!KENDRICK_DRAKE_PAIR.test(message)) return null;

  return {
    reply: [
      "The broad public and cultural consensus is that Kendrick Lamar won the 2024 Kendrick–Drake rap battle. That is an evaluative conclusion—not an objective fact—but the measurable case is strong.",
      "**Why the consensus leans Kendrick:** “Not Like Us” debuted at No. 1 on the Billboard Hot 100 with 70.9 million official U.S. streams, 5 million radio-audience impressions, and 15,000 sales in its first chart week. In that same week, Kendrick’s “Euphoria” rose to No. 3; Drake’s “Family Matters” debuted at No. 7 with 38 million streams, 646,000 radio-audience impressions, and 5,000 sales. The Recording Academy reported that “Not Like Us” won five GRAMMY Awards in 2025, including Record of the Year and Song of the Year.",
      "Drake had strong counterpunches, especially “Family Matters,” and listeners can reasonably disagree about individual bars, strategy, or who had the stronger catalog overall. Drake’s broader commercial standing is a separate question from who most people believe won this particular battle. Kinfolk should also treat claims made in diss tracks as allegations, not verified facts.",
    ].join("\n\n"),
    sources: [
      {
        title: "Recording Academy: Kendrick Lamar wins Record of the Year for “Not Like Us”",
        url: "https://www.grammy.com/news/kendrick-lamar-not-like-us-wins-record-of-the-year-2025-grammys/",
      },
      {
        title: "Billboard: “Not Like Us” debuts at No. 1 on the Hot 100",
        url: "https://www.billboard.com/lists/kendrick-lamar-not-like-us-hot-100-number-one-debut/",
      },
    ],
    followUpSuggestions: [
      "What is Kendrick Lamar working on right now?",
      "What is Drake working on right now?",
      "Compare their battle impact with their overall commercial history.",
    ],
  };
}
