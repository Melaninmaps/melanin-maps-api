/**
 * Conservative spelling clarification for catalog search surfaces.
 *
 * This utility never creates an entity or expands a query semantically. A caller
 * must supply terms that came from its governed catalog; the returned suggestion
 * is only a possible spelling correction for one of those terms.
 */
export type CatalogSearchTerm = Readonly<{ value: string }>;

export type SafeSearchClarification = Readonly<{
  kind: "possible_spelling";
  /** The complete query to retry. It retains surrounding location/context words. */
  suggestedQuery: string;
  /** The governed catalog term that supported the possible correction. */
  catalogTerm: string;
  /** Fixed hedged copy: this is deliberately not a claim that the term is correct. */
  prompt: string;
  source: "returned_catalog_term";
}>;

const MAX_QUERY_LENGTH = 120;
const MIN_COMPARABLE_LENGTH = 4;

function cleanDisplayText(value: string, maximum = MAX_QUERY_LENGTH): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum)
    .trim();
}

function fold(value: string): string {
  return cleanDisplayText(value, MAX_QUERY_LENGTH)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Adjacent character transpositions (for example, "hvca") count as one edit. */
function damerauLevenshtein(left: string, right: string): number {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row]![0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0]![column] = column;

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitution = matrix[row - 1]![column - 1]!
        + Number(left[row - 1] !== right[column - 1]);
      const deletion = matrix[row - 1]![column]! + 1;
      const insertion = matrix[row]![column - 1]! + 1;
      let distance = Math.min(substitution, deletion, insertion);
      if (
        row > 1 &&
        column > 1 &&
        left[row - 1] === right[column - 2] &&
        left[row - 2] === right[column - 1]
      ) {
        distance = Math.min(distance, matrix[row - 2]![column - 2]! + 1);
      }
      matrix[row]![column] = distance;
    }
  }
  return matrix[rows - 1]![columns - 1]!;
}

function maximumEdits(length: number): number {
  if (length <= 5) return 1;
  if (length <= 8) return 2;
  if (length <= 16) return 3;
  return 4;
}

function isConservativeMisspelling(input: string, candidate: string): boolean {
  if (
    input.length < MIN_COMPARABLE_LENGTH ||
    candidate.length < MIN_COMPARABLE_LENGTH ||
    input === candidate ||
    input[0] !== candidate[0]
  ) {
    return false;
  }
  const distance = damerauLevenshtein(input, candidate);
  return distance <= maximumEdits(Math.max(input.length, candidate.length))
    && 1 - distance / Math.max(input.length, candidate.length) >= 0.72;
}

type QueryToken = Readonly<{ value: string; start: number; end: number }>;

function queryTokens(query: string): QueryToken[] {
  const tokens: QueryToken[] = [];
  const matcher = /[\p{L}\p{N}]+/gu;
  for (const match of query.matchAll(matcher)) {
    const value = match[0];
    const start = match.index;
    if (value && start !== undefined) {
      tokens.push({ value, start, end: start + value.length });
    }
  }
  return tokens;
}

function catalogCandidates(terms: readonly CatalogSearchTerm[]): Array<{
  display: string;
  folded: string;
}> {
  const unique = new Map<string, string>();
  for (const term of terms) {
    const display = cleanDisplayText(term.value, 80);
    const folded = fold(display);
    if (display && folded && !unique.has(folded)) unique.set(folded, display);
    // A misspelled service word can be clarified from a longer business name
    // without suggesting that the longer name itself is the intended business.
    for (const word of display.split(/[^\p{L}\p{N}]+/u)) {
      const wordFolded = fold(word);
      if (word && wordFolded && !unique.has(wordFolded)) unique.set(wordFolded, word);
    }
  }
  return [...unique].map(([folded, display]) => ({ folded, display }));
}

/**
 * Return a possible spelling correction only when a supplied catalog term is a
 * close edit-distance match. The complete suggestion retains the rest of the
 * original query so location and other explicit constraints are not discarded.
 */
export function findSafeSearchClarification(input: {
  query: string;
  catalogTerms: readonly CatalogSearchTerm[];
}): SafeSearchClarification | null {
  const query = cleanDisplayText(input.query);
  if (query.length < MIN_COMPARABLE_LENGTH) return null;
  const candidates = catalogCandidates(input.catalogTerms);
  if (candidates.length === 0) return null;

  let best: { suggestedQuery: string; catalogTerm: string; distance: number } | null = null;
  for (const token of queryTokens(query)) {
    const foldedToken = fold(token.value);
    if (foldedToken.length < MIN_COMPARABLE_LENGTH) continue;
    for (const candidate of candidates) {
      if (!isConservativeMisspelling(foldedToken, candidate.folded)) continue;
      const suggestedQuery = `${query.slice(0, token.start)}${candidate.display}${query.slice(token.end)}`;
      if (!suggestedQuery || suggestedQuery.length > MAX_QUERY_LENGTH) continue;
      const distance = damerauLevenshtein(foldedToken, candidate.folded);
      if (
        !best ||
        distance < best.distance ||
        (distance === best.distance && candidate.display.length < best.catalogTerm.length) ||
        (distance === best.distance && candidate.display.length === best.catalogTerm.length
          && candidate.display.localeCompare(best.catalogTerm) < 0)
      ) {
        best = { suggestedQuery, catalogTerm: candidate.display, distance };
      }
    }
  }

  if (!best) return null;
  return {
    kind: "possible_spelling",
    suggestedQuery: best.suggestedQuery,
    catalogTerm: best.catalogTerm,
    prompt: `Did you mean “${best.suggestedQuery}”?`,
    source: "returned_catalog_term",
  };
}

/** Runtime guard for API clients; reject malformed or overlong suggestion payloads. */
export function isSafeSearchClarification(value: unknown): value is SafeSearchClarification {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SafeSearchClarification>;
  return candidate.kind === "possible_spelling"
    && candidate.source === "returned_catalog_term"
    && typeof candidate.suggestedQuery === "string"
    && Boolean(cleanDisplayText(candidate.suggestedQuery))
    && candidate.suggestedQuery === cleanDisplayText(candidate.suggestedQuery)
    && typeof candidate.catalogTerm === "string"
    && Boolean(cleanDisplayText(candidate.catalogTerm, 80))
    && candidate.catalogTerm === cleanDisplayText(candidate.catalogTerm, 80)
    && candidate.prompt === `Did you mean “${candidate.suggestedQuery}”?`;
}
