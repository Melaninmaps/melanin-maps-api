/**
 * Kinfolk Entity Resolver — DB-backed (v2)
 *
 * Resolves ambiguous named entities (films, people, groups, works) from the user
 * message using the kinfolk_entities / kinfolk_entity_aliases / kinfolk_source_records
 * tables. Returns a deterministic resolution state — the language model never decides.
 *
 * Three output states (spec §1):
 *   resolved          — one source-backed candidate clearly wins (score ≥ 120, gap ≥ 25)
 *   needs_clarification — two+ candidates tie, OR short-name with no qualifier
 *   unconfirmed       — no active candidate and query pattern indicates named-entity intent
 *
 * Scoring algorithm (spec §5.3):
 *   exactAlias                     * max(alias.confidence) * 100
 *   explicitQualifierMatch                                  +100
 *   explicitRoleMatch                                        +80
 *   explicitYearMatch (match)                                +75
 *   explicitYearMatch (mismatch)                            -150  ← prevents wrong-era answers
 *   explicitCountryOrLanguageMatch                           +50
 *   sourceBackedContemporaryProminence                       +40
 *   explicitOptInPreferenceMatch                             +20
 *   verifiedContextTagMatch                                  +10
 *   ambiguousFirstName guard                         → needs_clarification regardless of score
 *
 * Resolution threshold: top.score ≥ 120 AND top.score − next.score ≥ 25
 *
 * Privacy rules (spec §0):
 *   - NEVER infer ethnicity, culture, nationality, or identity from member name/profile
 *   - optInPreferenceMatch requires member.allowCulturalAffinityRanking === true (explicit)
 *   - Location used only when permitted and present in input (never inferred from IP)
 */

import { pool } from "@workspace/db";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResolutionState = "resolved" | "needs_clarification" | "unconfirmed";

/** Internal scoring record — hoisted to module scope so helper functions can reference it. */
export type ScoredCandidate = {
  entity: EntityRow;
  score: number;
  basis: string[];
  ambiguousFirstName: boolean;
  matchedAlias: string;
  matchedAliasConfidence: number;
  matchedAliasType: string;
  preferencesUsed: string[];
};

export type ResolvedEntity = {
  id: string;
  canonicalName: string;
  entityType: string;
  shortSummary: string;
  contextTags: string[];
  countryCodes: string[];
  eraStart: number | null;
  eraEnd: number | null;
  normalizedAliases: string[];
  activeSourceUrls: string[];
  sourceTiers: string[];
};

export type EntityResolutionResult =
  | {
      state: "resolved";
      entity: ResolvedEntity;
      score: number;
      basis: string;
      preferencesUsed: string[];
      sources: Array<{ title: string; url: string; tier: "A" | "B" | "C" }>;
    }
  | {
      state: "needs_clarification";
      clarificationQuestion: string;
      candidates: Array<{ canonicalName: string; entityType: string }>;
      preferencesUsed: string[];
      sources: never[];
    }
  | {
      state: "unconfirmed";
      unconfirmedReason: string;
      qualifier: string;
      preferencesUsed: string[];
      sources: never[];
    };

export type ExplicitMemberPreferences = {
  allowCulturalAffinityRanking?: boolean;
  diasporaCountries?: string[]; // ISO-3166-1 alpha-2
  supportPriorities?: string[];
  multilingualExpansionMode?: "off" | "ask" | "dual";
};

// ── DB row types ──────────────────────────────────────────────────────────────

type EntityRow = {
  id: string;
  canonical_name: string;
  entity_type: string;
  normalized_name: string;
  short_summary: string | null;
  country_codes: string[];
  language_codes: string[];
  cultural_context_tags: string[];
  era_start: number | null;
  era_end: number | null;
  normalized_aliases: string[];
  alias_confidences: number[];
  alias_types: string[];
  active_source_count: number;
  source_urls: string[];
  source_tiers: string[];
  source_titles: string[];
};

// ── Candidate extraction ──────────────────────────────────────────────────────

function normalizeTerm(s: string): string {
  return s.toLowerCase().replace(/[''`]/g, "'").replace(/[^a-z0-9\s'.-]/g, "").trim();
}

/**
 * Extract candidate search terms from the message.
 * Returns normalized terms ordered from longest to shortest (bigrams before unigrams).
 */
function extractCandidateTerms(message: string): string[] {
  const words = message.trim().split(/\s+/);
  const terms = new Set<string>();

  // Whole message (up to 6 words) — for multi-word entity names
  if (words.length <= 6) terms.add(normalizeTerm(message.trim()));

  // 4-grams
  for (let i = 0; i <= words.length - 4; i++) {
    terms.add(normalizeTerm(words.slice(i, i + 4).join(" ")));
  }
  // Trigrams
  for (let i = 0; i <= words.length - 3; i++) {
    terms.add(normalizeTerm(words.slice(i, i + 3).join(" ")));
  }
  // Bigrams
  for (let i = 0; i <= words.length - 2; i++) {
    terms.add(normalizeTerm(words.slice(i, i + 2).join(" ")));
  }
  // Single words that are capitalized (likely proper nouns)
  for (const w of words) {
    if (/^[A-Z]/.test(w)) terms.add(normalizeTerm(w));
  }

  return [...terms].sort((a, b) => b.length - a.length);
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const ROLE_PATTERNS: Partial<Record<string, RegExp>> = {
  person: /\b(who is|who was|who directed|director|singer|artist|actress|actor|musician|author|tell me about|biography|discography|filmography|member of|sang with|played with|career of|life of)\b/i,
  work: /\b(movie|film|show|series|album|book|song|directed|written by|starring|who made|who wrote|who directed|watch|watched|streaming|saw|loved)\b/i,
  group: /\b(group|band|members|who is in|who are in|member of|trio|duo|lineup)\b/i,
  institution: /\b(university|college|school|campus|hbcu|enroll|apply|admissions|located|based in)\b/i,
};

const COUNTRY_NAME_MAP: Record<string, RegExp> = {
  NG: /\bnigerian?\b/i,
  US: /\bamerican?\b/i,
  GB: /\bbritish\b/i,
  CA: /\bcanadian?\b/i,
  GH: /\bghanaian?\b/i,
  JM: /\bjamaican?\b/i,
  TT: /\btrinidadian?\b/i,
  KE: /\bkenyan?\b/i,
  ZA: /\bsouth african?\b/i,
  BR: /\bbrazilian?\b/i,
};

function scoreCandidate(
  entity: EntityRow,
  message: string,
  normalizedMsg: string,
  matchedAlias: string,
  matchedAliasConfidence: number,
  matchedAliasType: string,
  memberPreferences: ExplicitMemberPreferences | null,
): { score: number; basis: string[]; ambiguousFirstName: boolean } {
  const basis: string[] = [];
  let score = 0;

  // ── exactAlias (weighted by alias confidence) ──────────────────────────────
  // Low-confidence first-name aliases (confidence ≤ 0.5) get proportionally less.
  const aliasScore = Math.round(matchedAliasConfidence * 100);
  score += aliasScore;
  basis.push(`alias match (${matchedAlias}, conf=${matchedAliasConfidence}): +${aliasScore}`);

  // Ambiguous first-name guard — triggers needs_clarification regardless of other scores
  // when only a low-confidence single-word alias matched and no qualifier present
  const isShortName = !matchedAlias.includes(" ");
  const ambiguousFirstName =
    isShortName &&
    matchedAliasConfidence <= 0.5 &&
    matchedAliasType === "stage_name";

  // ── explicitQualifierMatch ─────────────────────────────────────────────────
  // Message explicitly contains one of the entity's context tags or group/country/era signal
  const hasQualifier = entity.cultural_context_tags.some(
    (tag) => normalizedMsg.includes(tag.toLowerCase()),
  );
  if (hasQualifier) {
    score += 100;
    basis.push("+100 explicitQualifierMatch");
  }

  // ── explicitRoleMatch ─────────────────────────────────────────────────────
  const rolePattern = ROLE_PATTERNS[entity.entity_type];
  if (rolePattern && rolePattern.test(message)) {
    score += 80;
    basis.push("+80 explicitRoleMatch");
  }

  // ── explicitYearMatch ─────────────────────────────────────────────────────
  const yearMatch = message.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const queryYear = parseInt(yearMatch[0]);
    const eraStart = entity.era_start;
    const eraEnd = entity.era_end;
    if (eraStart) {
      const inRange = eraEnd
        ? queryYear >= eraStart && queryYear <= eraEnd
        : queryYear === eraStart;
      if (inRange) {
        score += 75;
        basis.push(`+75 explicitYearMatch (${queryYear} in [${eraStart}, ${eraEnd ?? eraStart}])`);
      } else {
        // Wrong-era penalty — prevents the 2025 Sinners answer for a 1969 query
        score -= 150;
        basis.push(`-150 explicitYearMismatch (query=${queryYear}, entity=${eraStart})`);
      }
    }
  }

  // ── explicitCountryOrLanguageMatch ────────────────────────────────────────
  const countryMatch = entity.country_codes.some((cc) => COUNTRY_NAME_MAP[cc]?.test(message) ?? false);
  if (countryMatch) {
    score += 50;
    basis.push("+50 explicitCountryOrLanguageMatch");
  }

  // ── sourceBackedContemporaryProminence ────────────────────────────────────
  if (entity.era_start && entity.era_start >= 2000 && entity.active_source_count > 0) {
    score += 40;
    basis.push("+40 sourceBackedContemporaryProminence");
  }

  // ── explicitOptInPreferenceMatch ──────────────────────────────────────────
  // Requires member.allowCulturalAffinityRanking === true (explicit consent).
  // NEVER inferred from member name, city, or search behavior.
  const preferencesUsed: string[] = [];
  if (
    memberPreferences?.allowCulturalAffinityRanking &&
    Array.isArray(memberPreferences.diasporaCountries) &&
    memberPreferences.diasporaCountries.length > 0
  ) {
    const diasporaMatch = entity.country_codes.some((cc) =>
      memberPreferences.diasporaCountries!.includes(cc),
    );
    if (diasporaMatch) {
      score += 20;
      basis.push("+20 explicitOptInPreferenceMatch (diaspora)");
      preferencesUsed.push("diaspora cultural affinity");
    }
  }

  // ── verifiedContextTagMatch ───────────────────────────────────────────────
  const tagScore = entity.cultural_context_tags.filter((t) =>
    normalizedMsg.includes(t.toLowerCase()),
  ).length;
  if (tagScore > 0) {
    score += 10;
    basis.push(`+10 verifiedContextTagMatch (${tagScore} tags)`);
  }

  return { score, basis, ambiguousFirstName };
}

// ── Named-entity query detection ──────────────────────────────────────────────

function looksLikeNamedEntityQuery(message: string): boolean {
  const named_patterns = [
    /\b(who is|who was|who directed|tell me about|what did .+? do|biography|discography|filmography|member of|sang with|played for|career of)\b/i,
    /\b(movie|film|director|actor|actress|singer|artist|group|team)\b/i,
  ];
  if (named_patterns.some((p) => p.test(message))) return true;
  // Short message that looks like a name (1–3 capitalized-initial words, no verbs)
  const trimmed = message.trim();
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/.test(trimmed) && trimmed.split(/\s+/).length <= 3) {
    return true;
  }
  return false;
}

function looksLikeAmbiguousShortName(message: string): boolean {
  const trimmed = message.trim();
  // Single capitalized word OR "Tell me about [Name]" pattern where Name is one word
  if (/^[A-Z][a-z]+$/.test(trimmed)) return true;
  const aboutMatch = trimmed.match(/\btell me about\s+([A-Z][a-z]+)\s*\.?\s*$/i);
  if (aboutMatch && !aboutMatch[1].match(/\s/)) return true;
  return false;
}

// ── DB query ──────────────────────────────────────────────────────────────────

async function queryEntitiesByAlias(normalizedAlias: string): Promise<EntityRow[]> {
  const result = await pool.query<EntityRow>(
    `SELECT
       e.id,
       e.canonical_name,
       e.entity_type,
       e.normalized_name,
       e.short_summary,
       e.country_codes,
       e.language_codes,
       e.cultural_context_tags,
       e.era_start,
       e.era_end,
       array_agg(DISTINCT a.normalized_alias)                                    AS normalized_aliases,
       array_agg(DISTINCT a.confidence::text)                                    AS alias_confidences,
       array_agg(DISTINCT a.alias_type)                                          AS alias_types,
       COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active')::int       AS active_source_count,
       array_agg(DISTINCT s.canonical_url)
         FILTER (WHERE s.status = 'active')                               AS source_urls,
       array_agg(DISTINCT s.tier)
         FILTER (WHERE s.status = 'active')                               AS source_tiers,
       array_agg(DISTINCT s.title)
         FILTER (WHERE s.status = 'active')                               AS source_titles
     FROM kinfolk_entities e
     JOIN kinfolk_entity_aliases a ON a.entity_id = e.id
     LEFT JOIN kinfolk_entity_source_links esl ON esl.entity_id = e.id
     LEFT JOIN kinfolk_source_records s ON s.id = esl.source_id
     WHERE e.resolution_status = 'active'
       AND a.normalized_alias = $1
     GROUP BY e.id`,
    [normalizedAlias],
  );
  return result.rows;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve the named entity referenced in the message.
 * DB-backed: queries kinfolk_entities + kinfolk_entity_aliases + kinfolk_source_records.
 * Returns a deterministic resolution state — the LLM never decides.
 */
export async function resolveEntity(
  message: string,
  memberPreferences: ExplicitMemberPreferences | null,
): Promise<EntityResolutionResult> {
  const normalizedMsg = normalizeTerm(message);
  const candidateTerms = extractCandidateTerms(message);

  // Gather all entity candidates by alias lookup
  const seenEntityIds = new Set<string>();
  const scoredCandidates: ScoredCandidate[] = [];

  for (const term of candidateTerms) {
    let rows: EntityRow[];
    try {
      rows = await queryEntitiesByAlias(term);
    } catch {
      continue; // kinfolk_entities table may not exist yet — degrade gracefully
    }

    for (const row of rows) {
      if (seenEntityIds.has(row.id)) continue;
      seenEntityIds.add(row.id);

      // Find which alias was matched and its confidence/type
      const aliasIdx = (row.normalized_aliases ?? []).indexOf(term);
      const matchedAliasConfidence =
        aliasIdx >= 0 ? parseFloat(String((row.alias_confidences ?? [])[aliasIdx] ?? "0.7")) : 0.7;
      const matchedAliasType =
        aliasIdx >= 0 ? (String((row.alias_types ?? [])[aliasIdx] ?? "stage_name")) : "stage_name";

      const scored = scoreCandidate(
        row,
        message,
        normalizedMsg,
        term,
        matchedAliasConfidence,
        matchedAliasType,
        memberPreferences,
      );

      // Extract preferencesUsed from basis strings
      const preferencesUsed = scored.basis
        .filter((b) => b.includes("Preference") || b.includes("diaspora"))
        .map(() => "diaspora cultural affinity");

      scoredCandidates.push({
        entity: row,
        score: scored.score,
        basis: scored.basis,
        ambiguousFirstName: scored.ambiguousFirstName,
        matchedAlias: term,
        matchedAliasConfidence,
        matchedAliasType,
        preferencesUsed,
      });
    }
  }

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  const [top, second] = scoredCandidates;
  const hasTop    = top !== undefined;
  const topScore  = top?.score ?? 0;
  const nextScore = second?.score ?? 0;

  // ── Resolution decision ────────────────────────────────────────────────────

  // Ambiguous first-name guard: short first-name with low alias confidence and
  // no explicit qualifier → always needs_clarification regardless of score.
  if (hasTop && top.ambiguousFirstName && !hasExplicitQualifier(message, top.entity)) {
    return {
      state: "needs_clarification",
      clarificationQuestion: buildDisambiguationQuestion(message, top.entity),
      candidates: scoredCandidates.slice(0, 3).map((c) => ({
        canonicalName: c.entity.canonical_name,
        entityType: c.entity.entity_type,
      })),
      preferencesUsed: [],
      sources: [],
    };
  }

  // Standard resolution threshold
  const isResolved = topScore >= 120 && topScore - nextScore >= 25;

  if (isResolved && top) {
    const sources = (top.entity.source_urls ?? [])
      .filter(Boolean)
      .map((url, i) => ({
        title: String((top.entity.source_titles ?? [])[i] ?? url),
        url,
        tier: ((top.entity.source_tiers ?? [])[i] as "A" | "B" | "C") ?? "B",
      }));

    return {
      state: "resolved",
      entity: {
        id: top.entity.id,
        canonicalName: top.entity.canonical_name,
        entityType: top.entity.entity_type,
        shortSummary: top.entity.short_summary ?? "",
        contextTags: top.entity.cultural_context_tags ?? [],
        countryCodes: top.entity.country_codes ?? [],
        eraStart: top.entity.era_start,
        eraEnd: top.entity.era_end,
        normalizedAliases: top.entity.normalized_aliases ?? [],
        activeSourceUrls: top.entity.source_urls ?? [],
        sourceTiers: top.entity.source_tiers ?? [],
      },
      score: topScore,
      basis: top.basis.join("; "),
      preferencesUsed: top.preferencesUsed,
      sources,
    };
  }

  if (scoredCandidates.length >= 2 && topScore >= 50) {
    // Two or more materially plausible candidates — ask which one
    return {
      state: "needs_clarification",
      clarificationQuestion: buildMultiCandidateQuestion(message, scoredCandidates.slice(0, 3)),
      candidates: scoredCandidates.slice(0, 3).map((c) => ({
        canonicalName: c.entity.canonical_name,
        entityType: c.entity.entity_type,
      })),
      preferencesUsed: [],
      sources: [],
    };
  }

  if (scoredCandidates.length === 1 && topScore < 120) {
    // One candidate found but insufficient score — ask for qualifier
    return {
      state: "needs_clarification",
      clarificationQuestion: buildLowScoreQuestion(message, top.entity),
      candidates: [{ canonicalName: top.entity.canonical_name, entityType: top.entity.entity_type }],
      preferencesUsed: [],
      sources: [],
    };
  }

  if (scoredCandidates.length === 0 && looksLikeNamedEntityQuery(message)) {
    const isShortName = looksLikeAmbiguousShortName(message);
    return {
      state: "needs_clarification",
      clarificationQuestion: isShortName
        ? buildNameDisambiguationQuestion(message)
        : buildUnconfirmedQuestion(message),
      candidates: [],
      preferencesUsed: [],
      sources: [],
    };
  }

  // No named entity in this query — not an entity resolution scenario
  return {
    state: "unconfirmed",
    unconfirmedReason: "No active source-backed candidate found for this query.",
    qualifier: "Try adding a qualifier — year, group name, country, or professional role.",
    preferencesUsed: [],
    sources: [],
  };
}

// ── Clarification builders ────────────────────────────────────────────────────

function hasExplicitQualifier(message: string, entity: EntityRow): boolean {
  const qualifiers = [
    ...entity.cultural_context_tags,
    ...entity.country_codes.map((cc) => cc),
    entity.canonical_name,
  ];
  const m = message.toLowerCase();
  return qualifiers.some((q) => m.includes(q.toLowerCase()) && q.toLowerCase() !== entity.entity_type);
}

function buildDisambiguationQuestion(message: string, entity: EntityRow): string {
  const extracted = message.trim().match(/^[A-Z][a-z]+/);
  const name = extracted?.[0] ?? entity.canonical_name;
  return (
    `Which "${name}" are you asking about? ` +
    `Could you add a bit more context — a field (music, film, sports), country, group, show, or song?`
  );
}

function buildMultiCandidateQuestion(message: string, candidates: ScoredCandidate[]): string {
  const options = candidates
    .map((c) => `"${c.entity.canonical_name}" (${c.entity.entity_type})`)
    .join(", or ");
  return `I want to make sure I have the right person or work — are you asking about ${options}?`;
}

function buildLowScoreQuestion(message: string, entity: EntityRow): string {
  return (
    `I have some information about "${entity.canonical_name}" but I want to make sure ` +
    `I'm answering about the right one. Could you confirm — are you asking about ` +
    `${entity.short_summary ? entity.short_summary.split(".")[0] + "?" : "this specific " + entity.entity_type + "?"}`
  );
}

function buildNameDisambiguationQuestion(message: string): string {
  const trimmed = message.trim().replace(/^tell me about\s+/i, "");
  return (
    `Could you tell me a bit more about which "${trimmed}" you mean? ` +
    `A field (music, film, sports, business), country, group, show, or song would help me find the right one.`
  );
}

function buildUnconfirmedQuestion(message: string): string {
  return (
    `I don't have a verified source for that in my knowledge base right now. ` +
    `Could you add more context — like a year, country, group, or role — so I can give you a confirmed answer?`
  );
}

// ── Legacy compatibility exports ───────────────────────────────────────────────
// These are used by the existing kinfolk.ts route handler during the transition
// from the Phase-1 in-memory registry. They degrade gracefully if the DB tables
// are not yet available.

export type LegacyResolvedEntity = {
  canonicalName: string;
  entityType: string;
  summary: string;
  keyFacts: Record<string, string>;
  culturalContext: string[];
  isBiographyMode: boolean;
  sourceNote: string;
};

/**
 * Build a server-authoritative entity context block for injection into the system prompt.
 * The LLM must not contradict any fact in this block.
 */
export function buildEntityContextBlock(
  result: EntityResolutionResult | null,
): string {
  if (!result || result.state !== "resolved") return "";

  const { entity, sources } = result;
  const sourceNote =
    sources.length > 0
      ? `Sources: ${sources.map((s) => `${s.title} [Tier ${s.tier}] — ${s.url}`).join("; ")}`
      : "No active source URLs on record.";

  const lines = [
    "⚡ ENTITY RESOLUTION — SERVER-AUTHORITATIVE (source-verified facts — do not contradict these):",
    ``,
    `• ${entity.canonicalName} [${entity.entityType}]`,
    `  ${entity.shortSummary}`,
    `  Context: ${entity.contextTags.join(", ")}`,
    `  ${sourceNote}`,
    ``,
    `RESOLVED_CONTEXT rule: You may only state factual entity, relationship, location,`,
    `credential, school, and source claims that appear in this RESOLVED_CONTEXT block.`,
    `Do not create recommendations unless RESOLVED_CONTEXT.localResults is non-empty.`,
  ];

  const isBiography = ["person", "group", "work"].includes(entity.entityType);
  if (isBiography) {
    lines.push(
      ``,
      `⚠ BIOGRAPHY MODE: Member asked about a ${entity.entityType}. ` +
        `Set "recommendations": null unless they explicitly ask for a place to visit.`,
    );
  }

  return lines.join("\n");
}
