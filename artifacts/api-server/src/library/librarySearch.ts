import type {
  LibraryRepository,
  LibrarySearchPage,
} from "./types";

export type LibrarySearchRepository = LibraryRepository;

export type LibraryIntentChoice = {
  label: string;
  query: string;
};

export type LibrarySearchResponse = LibrarySearchPage & {
  query: string;
  nextCursor: string | null;
  clarification: {
    prompt: string;
    choices: LibraryIntentChoice[];
  } | null;
  webResearch: {
    status: "unavailable" | "degraded";
    message: string;
  };
};

export type ParsedLibrarySearch = {
  query: string;
  normalizedQuery: string;
  limit: number;
  offset: number;
};

export type LibrarySearchParseResult =
  | { ok: true; value: ParsedLibrarySearch }
  | { ok: false; error: string };

type VocabularyGroup = {
  topicSlug: string;
  terms: readonly string[];
};

/**
 * Deliberate internal vocabulary, not generated web keywords. These aliases
 * keep common language attached to durable Library foundations.
 */
export const LIBRARY_TOPIC_VOCABULARY: readonly VocabularyGroup[] = [
  {
    topicSlug: "trades-skills-certifications",
    terms: [
      "hvac",
      "hvacr",
      "heating",
      "ventilation",
      "air conditioning",
      "refrigeration",
      "skilled trades",
      "apprenticeship",
      "apprenticeships",
      "licensing",
      "license",
      "licenses",
      "certification",
      "certifications",
      "technician",
      "technicians",
    ],
  },
  {
    topicSlug: "education-learning",
    terms: ["education", "training", "learning", "school", "classes"],
  },
  {
    topicSlug: "careers-professional-life",
    terms: ["career", "careers", "jobs", "employment", "workforce"],
  },
  {
    topicSlug: "community-connection",
    terms: ["organizations", "professional organizations", "networks"],
  },
] as const;

const HVAC_RESEARCH_TERMS = [
  "hvac",
  "hvacr",
  "heating",
  "ventilation",
  "air conditioning",
  "refrigeration",
] as const;

const HVAC_INTENT_CHOICES: LibraryIntentChoice[] = [
  { label: "Training and education", query: "HVAC training education" },
  { label: "Licenses and certifications", query: "HVAC licenses certifications" },
  { label: "Apprenticeships and jobs", query: "HVAC apprenticeships jobs" },
  { label: "Studies and workforce", query: "HVAC studies workforce" },
  { label: "Organizations and professionals", query: "HVAC organizations professionals" },
];

function singleQueryValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function decodeCursor(rawCursor: string): number | null {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(rawCursor)) return null;
    const decoded = Buffer.from(rawCursor, "base64url").toString("utf8");
    if (!/^(0|[1-9]\d{0,5})$/.test(decoded)) return null;
    const offset = Number(decoded);
    return Number.isSafeInteger(offset) && offset >= 0 ? offset : null;
  } catch {
    return null;
  }
}

export function encodeLibrarySearchCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export function normalizeLibrarySearchQuery(query: string): string {
  return query
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function parseLibrarySearchQuery(query: Record<string, unknown>): LibrarySearchParseResult {
  const rawQuery = singleQueryValue(query["q"]);
  if (rawQuery === null) {
    return { ok: false, error: 'Library search requires one text query in "q".' };
  }

  const displayQuery = rawQuery.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!displayQuery) {
    return { ok: false, error: "Enter a Library search term." };
  }
  if (displayQuery.length > 120) {
    return { ok: false, error: "Library search terms must be 120 characters or fewer." };
  }

  const rawLimit = query["limit"];
  let limit = 6;
  if (rawLimit !== undefined) {
    const limitText = singleQueryValue(rawLimit);
    if (!limitText || !/^\d+$/.test(limitText)) {
      return { ok: false, error: "Search limit must be a whole number from 1 through 20." };
    }
    limit = Number(limitText);
    if (limit < 1 || limit > 20) {
      return { ok: false, error: "Search limit must be a whole number from 1 through 20." };
    }
  }

  const rawCursor = query["cursor"];
  let offset = 0;
  if (rawCursor !== undefined) {
    const cursorText = singleQueryValue(rawCursor);
    const decoded = cursorText ? decodeCursor(cursorText) : null;
    if (decoded === null) {
      return { ok: false, error: "Search cursor is invalid or expired." };
    }
    offset = decoded;
  }

  return {
    ok: true,
    value: {
      query: displayQuery,
      normalizedQuery: normalizeLibrarySearchQuery(displayQuery),
      limit,
      offset,
    },
  };
}

function containsVocabularyTerm(query: string, term: string): boolean {
  return query === term || query.includes(term);
}

function escapeLikeTerm(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function resolveLibrarySearchVocabulary(normalizedQuery: string): {
  searchTerms: string[];
  patterns: string[];
  preferredTopicSlugs: string[];
} {
  const preferredTopicSlugs = LIBRARY_TOPIC_VOCABULARY
    .filter((group) => group.terms.some((term) => containsVocabularyTerm(normalizedQuery, term)))
    .map((group) => group.topicSlug);

  const expandedTerms = normalizedQuery === "hvac"
    ? HVAC_RESEARCH_TERMS
    : [normalizedQuery];
  const searchTerms = [...new Set(expandedTerms)];

  return {
    searchTerms,
    patterns: searchTerms.map((term) => `%${escapeLikeTerm(term)}%`),
    preferredTopicSlugs: [...new Set(preferredTopicSlugs)],
  };
}

export async function searchLivingLibrary(
  repository: LibrarySearchRepository,
  parsed: ParsedLibrarySearch,
): Promise<LibrarySearchResponse> {
  const { searchTerms, patterns, preferredTopicSlugs } = resolveLibrarySearchVocabulary(
    parsed.normalizedQuery,
  );
  const page = await repository.searchPublishedContent({
    normalizedQuery: parsed.normalizedQuery,
    searchTerms,
    patterns,
    preferredTopicSlugs,
    limit: parsed.limit,
    offset: parsed.offset,
  });
  const nextOffset = parsed.offset + page.results.length;

  return {
    ...page,
    query: parsed.query,
    nextCursor:
      page.results.length > 0 && nextOffset < page.total
        ? encodeLibrarySearchCursor(nextOffset)
        : null,
    clarification:
      parsed.normalizedQuery === "hvac"
        ? {
            prompt: "What kind of HVAC information would help most?",
            choices: HVAC_INTENT_CHOICES,
          }
        : null,
    webResearch: {
      status: "unavailable",
      message:
        "Live-web research is unavailable for this search. Results shown here come only from governed internal Library content.",
    },
  };
}
