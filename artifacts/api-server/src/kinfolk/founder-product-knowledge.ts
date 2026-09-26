export type FounderApprovedProductKnowledge = Readonly<{
  id: string;
  question: string;
  answer: string;
  keywords: readonly string[];
  approved: boolean;
  archivedAt: Date | null;
}>;

export type FounderProductKnowledgeMatch = Readonly<{
  id: string;
  reply: string;
}>;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distinctTerms(value: string): string[] {
  return [...new Set(
    normalize(value)
      .split(" ")
      .filter((term) => term.length >= 3)
      .filter((term) => !new Set([
        "about", "after", "again", "also", "and", "are", "can", "does", "for",
        "from", "have", "how", "into", "kinfolk", "mapping", "more", "that", "the",
        "this", "what", "when", "where", "which", "with", "would", "your",
      ]).has(term)),
  )];
}

/**
 * Selects only a founder-approved, non-archived product answer. The score is
 * deliberately conservative: an answer must share an exact question or at
 * least two meaningful terms with the member's question. Personal chat, saved
 * memories, searches, and business records never supply product knowledge.
 */
export function matchFounderApprovedProductKnowledge(
  question: string,
  records: readonly FounderApprovedProductKnowledge[],
): FounderProductKnowledgeMatch | null {
  const normalizedQuestion = normalize(question);
  const queryTerms = distinctTerms(question);
  if (!normalizedQuestion || queryTerms.length === 0) return null;

  const ranked = records
    .filter((record) => record.approved && record.archivedAt === null)
    .map((record) => {
      const normalizedRecordQuestion = normalize(record.question);
      if (normalizedRecordQuestion === normalizedQuestion) {
        return { record, score: Number.MAX_SAFE_INTEGER };
      }
      const haystack = new Set([
        ...distinctTerms(record.question),
        ...record.keywords.flatMap(distinctTerms),
      ]);
      const overlap = queryTerms.filter((term) => haystack.has(term)).length;
      return { record, score: overlap };
    })
    .filter(({ score }) => score === Number.MAX_SAFE_INTEGER || score >= 2)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));

  const winner = ranked[0]?.record;
  return winner ? { id: winner.id, reply: winner.answer.trim() } : null;
}
