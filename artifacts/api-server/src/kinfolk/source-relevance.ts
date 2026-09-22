import { requiresCurrentResearch } from "./current-research";

export type MemberFacingSourceCandidate = Readonly<{
  id: string;
  label: string;
  title?: string;
  url?: string;
  evidenceText?: string;
}>;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "ask", "at", "be", "by", "can", "conversation", "current", "directly", "do", "does", "for", "follow", "from", "get", "how", "i", "in", "is", "it", "live", "many", "me", "member", "my", "not", "of", "on", "only", "or", "people", "please", "preceding", "relevant", "repeat", "reputable", "request", "retrieve", "subject", "the", "their", "this", "to", "up", "us", "what", "when", "where", "who", "will", "with", "you", "your", "article", "articles", "link", "links", "news", "report", "reports", "source", "sources",
]);

function normalizedTokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

/**
 * Adds neutral factual-retrieval vocabulary only when the member asks the
 * corresponding question. It does not infer demographic context or intent.
 */
export function sourceRelevanceTerms(message: string): string[] {
  const terms = new Set(normalizedTokens(message));
  const normalized = message.toLowerCase();
  if (/\bhow many\s+(?:people|residents)\s+live\b|\bhow many\s+people\b/.test(normalized)) {
    terms.add("population");
    terms.add("census");
  }
  if (/\b(?:united states|usa|u\.?s\.?a?)\b/.test(normalized)) {
    terms.add("united");
    terms.add("states");
  }
  return [...terms];
}

export function sourceHasMemberQuestionRelevance(
  source: Pick<MemberFacingSourceCandidate, "title" | "url" | "evidenceText">,
  message: string,
): boolean {
  const terms = sourceRelevanceTerms(message);
  if (terms.length === 0) return false;
  const haystack = `${source.title ?? ""} ${source.evidenceText ?? ""} ${source.url ?? ""}`
    .normalize("NFKC")
    .toLowerCase();
  const matchingTerms = terms.filter((term) => haystack.includes(term));
  // One word is enough only when that is genuinely all the member supplied
  // (for example, a named place). Multi-word questions must match at least two
  // substantive terms, preventing generic “article/image” search results from
  // appearing below an unrelated answer.
  const requiredMatches = terms.length >= 3 ? 2 : 1;
  return matchingTerms.length >= requiredMatches;
}

/**
 * Never render a source merely because it was returned by an unrelated lookup.
 * Fresh-fact answers accept only live-web evidence with visible, question-related
 * support; if none survives, the route's existing fail-closed answer is used.
 */
export function filterMemberFacingSources(
  sources: ReadonlyArray<MemberFacingSourceCandidate>,
  message: string,
): MemberFacingSourceCandidate[] {
  const currentFact = requiresCurrentResearch(message);
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (!source.id || seen.has(source.id)) return false;
    if (currentFact && source.label !== "web_search" && source.label !== "kinfolk_web") return false;
    if (!sourceHasMemberQuestionRelevance(source, message)) return false;
    seen.add(source.id);
    return true;
  });
}
