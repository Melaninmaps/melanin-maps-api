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
      return {
        title: `Research overview · ${domain}`,
        summary: boundedExcerpt(`${framing} ${excerpts.slice(0, 2).join(" ")}`, 560),
        body: [
          `## At a glance\n\n${framing}`,
          `## What the evidence says\n\n${sources.map((source, index) => `${source.title}: ${excerpts[index]} [Source ${index + 1}]`).join("\n\n")}`,
          "## Why this matters\n\nThe cited material provides a starting point for understanding this question. Its relevance to a particular community or person depends on what the sources directly establish.",
          `## What to consider next\n\nCompare the cited primary or research sources, identify which facts apply to the specific question, and bring personal medical, legal, or financial decisions to an appropriately qualified professional.${disclaimer ? `\n\n${disclaimer}` : ""}`,
        ].filter(Boolean).join("\n\n"),
        citedSourceIndexes: sources.map((_, index) => index),
        relatedQuestions: [
          `What evidence shapes different perspectives on ${question}?`,
          "Which population or life-stage question would make this research more specific?",
          domain === "history" ? "Which primary sources document this history?" : "Which sources should I compare next?",
        ],
      };
    },
  };
}
