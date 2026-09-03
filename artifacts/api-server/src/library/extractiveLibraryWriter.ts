import type { LibrarySynthesisWriter } from "./types";

function plainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, (match) => match.replace(/\]\([^\)]+\)$/, "]"))
    .replace(/\s+/g, " ")
    .trim();
}

function boundedExcerpt(value: string, maximum: number): string {
  const clean = plainText(value);
  if (clean.length <= maximum) return clean;
  const boundary = clean.lastIndexOf(" ", maximum);
  return `${clean.slice(0, boundary > maximum / 2 ? boundary : maximum).trim()}…`;
}

export function createExtractiveLibraryWriter(): LibrarySynthesisWriter {
  return {
    async writeStructured({ question, domain, disclaimer, sources }) {
      const excerpts = sources.map((source) => boundedExcerpt(source.content, 760));
      const spiritual = /\b(afterlife|after death|life after death|spirit|spiritual|religion|soul|heaven|reincarnation|ancestor)\b/i.test(question);
      const framing = spiritual
        ? "Religious traditions, African and diasporic spiritual traditions, philosophical schools, and secular scholarship approach this question differently. The evidence does not establish one unknowable answer as fact."
        : "This overview summarizes what the cited sources report and notes where context or interpretation may differ.";
      const sections = sources.map((source, index) =>
        `### ${source.title}\n\n${excerpts[index]} [Source ${index + 1}]`,
      );
      return {
        title: `Research overview · ${domain}`,
        summary: boundedExcerpt(`${framing} ${excerpts.slice(0, 2).join(" ")}`, 560),
        body: [
          framing,
          ...sections,
          disclaimer ? `### Important context\n\n${disclaimer}` : "",
        ].filter(Boolean).join("\n\n"),
        citedSourceIndexes: sources.map((_, index) => index),
        relatedQuestions: [
          `What evidence shapes different perspectives on ${question}?`,
          `How has the African diaspora discussed ${question}?`,
          domain === "history" ? "Which primary sources document this history?" : "Which sources should I compare next?",
        ],
      };
    },
  };
}
