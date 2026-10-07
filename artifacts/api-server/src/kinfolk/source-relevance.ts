import {
  isCurrencyConversionRequest,
  requiresCurrentResearch,
} from "./current-research";

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

const MEDICAL_DISCUSSION_RE = /\b(?:anemia|anaemia|menopause|perimenopause|fertility|fibroid|endometriosis|pcos|breast\s+cancer|mammogram|medication|medicine|prescription|prescribed|drug|dose|dosage|side\s+effect|pharmacist)\b/i;

function isDirectMedicalDiscussionSource(
  source: MemberFacingSourceCandidate,
  message: string,
): boolean {
  // NIH MedlinePlus links added by the health-retrieval layer are authoritative
  // care-discussion material. A medication name may not appear in a source title,
  // so exact token overlap alone can incorrectly hide the relevant link.
  return MEDICAL_DISCUSSION_RE.test(message) && source.label === "NIH MedlinePlus";
}

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
  // A conversion source can correctly identify the pair with ISO symbols while
  // the member uses local names (for example, a currency unit rather than its
  // three-letter code). This domain-neutral marker prevents a relevant rate
  // source from being discarded solely for that surface-form mismatch.
  if (
    isCurrencyConversionRequest(message) &&
    /\b(?:exchange\s+rate|currency\s+conversion|currency\s+converter|foreign\s+exchange|fx\s+rate)\b/i.test(haystack)
  ) {
    return true;
  }
  const matchingTerms = terms.filter((term) => haystack.includes(term));
  // A changing, multi-part question must have its central terms reflected in
  // the source itself. A fixed two-word floor allowed a generic local alert to
  // appear relevant to a same-city question about tomorrow's availability.
  // Requiring at least half of the substantive terms remains topic-independent
  // while preserving concise entity-only and two-term questions.
  const requiredMatches = Math.max(1, Math.ceil(terms.length / 2));
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
    if (!sourceHasMemberQuestionRelevance(source, message) && !isDirectMedicalDiscussionSource(source, message)) return false;
    seen.add(source.id);
    return true;
  });
}
