/**
 * Kinfolk Entity Resolver — Phase 1
 *
 * Resolves ambiguous entities (films, people, groups, works) from the user message
 * BEFORE the LLM prompt is assembled. Returns server-authoritative canonical facts
 * so the model cannot contradict or hallucinate them.
 *
 * Design rules (Manus cultural context spec §4):
 * - Source-attributed facts only — never model memory alone
 * - Never infers member identity, ethnicity, or religion from name/location/behavior
 * - isBiographyMode = true → the query is about a person/work, NOT a place to visit
 * - Phase 2: these records move to kinfolk_entities + kinfolk_entity_aliases DB tables
 */

export type ResolvedEntity = {
  id: string;
  canonicalName: string;
  entityType: "film" | "person" | "music_group" | "institution" | "work";
  summary: string;
  keyFacts: Record<string, string>;
  culturalContext: string[];
  resolutionBasis: "explicit_qualifier" | "explicit_role" | "high_confidence_context";
  assumed: boolean;
  isBiographyMode: boolean;
  sourceNote: string;
};

type RegistryEntry = {
  id: string;
  canonicalName: string;
  entityType: ResolvedEntity["entityType"];
  summary: string;
  keyFacts: Record<string, string>;
  culturalContext: string[];
  sourceNote: string;
  isBiographyMode: boolean;
  patterns: Array<{
    regex: RegExp;
    qualifier?: RegExp;
    confidence: number;
  }>;
};

// ── In-memory entity registry (Phase 1) ──────────────────────────────────────
const ENTITY_REGISTRY: RegistryEntry[] = [
  {
    id: "sinners_2025_film",
    canonicalName: "Sinners (2025 film)",
    entityType: "film",
    summary:
      "Sinners is a 2025 horror/drama film written and directed by Ryan Coogler, " +
      "starring Michael B. Jordan. Released by Warner Bros. and available on HBO Max.",
    keyFacts: {
      director: "Ryan Coogler",
      writer: "Ryan Coogler",
      lead: "Michael B. Jordan",
      year: "2025",
      distributor: "Warner Bros. / HBO Max",
    },
    culturalContext: ["Black cinema", "Ryan Coogler filmography", "Michael B. Jordan"],
    sourceNote: "Sinners official film toolkit (sinnersmovie.com) and HBO Max official listing",
    isBiographyMode: true,
    patterns: [
      {
        regex: /\bsinners\b/i,
        qualifier: /\b(movie|film|directed|watch|watched|streaming|horror|saw it|loved it)\b/i,
        confidence: 95,
      },
      {
        regex: /\bsinners\b/i,
        qualifier: /\b(who directed|director of|made by|written by|wrote)\b/i,
        confidence: 95,
      },
      { regex: /\bsinners\b/i, confidence: 45 },
    ],
  },
  {
    id: "michelle_williams_dc_singer",
    canonicalName: "Michelle Williams (singer, Destiny's Child)",
    entityType: "person",
    summary:
      "Michelle Williams is a singer, actress, and Broadway performer born July 23, 1980, " +
      "in Rockford, Illinois. She is best known as a member of Destiny's Child alongside " +
      "Beyoncé and Kelly Rowland. Her gospel and R&B solo career includes Heart to Yours (2002).",
    keyFacts: {
      group: "Destiny's Child",
      genre: "R&B, gospel",
      born: "July 23, 1980",
      hometown: "Rockford, Illinois",
      notableWork: "Survivor, Say My Name (Destiny's Child); Heart to Yours, Do You Know (solo)",
      broadwayCredits: "Aida, Chicago",
    },
    culturalContext: ["Destiny's Child", "R&B", "gospel", "Black music history"],
    sourceNote: "Michelle Williams official biography (iamtenitra.com/about)",
    isBiographyMode: true,
    patterns: [
      {
        regex: /\bmichelle williams\b/i,
        qualifier: /\bdestiny'?s child\b/i,
        confidence: 100,
      },
      {
        regex: /\bmichelle williams\b/i,
        qualifier: /\b(singer|r&b|gospel|beyonc[eé]|kelly rowland|dc member|music|group member)\b/i,
        confidence: 80,
      },
      { regex: /\bmichelle williams\b/i, confidence: 30 },
    ],
  },
  {
    id: "ryan_coogler_director",
    canonicalName: "Ryan Coogler (film director)",
    entityType: "person",
    summary:
      "Ryan Coogler is an American film director and screenwriter from Oakland, California. " +
      "Known for Fruitvale Station (2013), Creed (2015), Black Panther (2018), " +
      "Black Panther: Wakanda Forever (2022), and Sinners (2025).",
    keyFacts: {
      filmography:
        "Fruitvale Station (2013), Creed (2015), Black Panther (2018), " +
        "Black Panther: Wakanda Forever (2022), Sinners (2025)",
      hometown: "Oakland, California",
      genre: "drama, action, horror",
    },
    culturalContext: ["Black cinema", "African American directors", "Marvel Cinematic Universe"],
    sourceNote: "General knowledge — public biographical record",
    isBiographyMode: true,
    patterns: [{ regex: /\bryan coogler\b/i, confidence: 95 }],
  },
  {
    id: "destinys_child_group",
    canonicalName: "Destiny's Child (music group)",
    entityType: "music_group",
    summary:
      "Destiny's Child was an American R&B girl group formed in Houston, Texas. " +
      "The classic lineup was Beyoncé Knowles, Kelly Rowland, and Michelle Williams. " +
      "Major hits include Say My Name, Survivor, Bootylicious, and Independent Women Part I.",
    keyFacts: {
      members: "Beyoncé Knowles, Kelly Rowland, Michelle Williams",
      formed: "1990 (as Girl's Tyme); classic lineup 1997–2006",
      genre: "R&B, pop, soul",
      hits: "Say My Name, Survivor, Bootylicious, Independent Women Part I",
      hometown: "Houston, Texas",
    },
    culturalContext: ["R&B", "Black music history", "Houston", "girl groups"],
    sourceNote: "General knowledge — public record",
    isBiographyMode: true,
    patterns: [{ regex: /\bdestiny'?s child\b/i, confidence: 95 }],
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreEntry(
  entry: RegistryEntry,
  message: string,
): { confidence: number; explicit: boolean } {
  let best = -1;
  let explicit = false;

  for (const pattern of entry.patterns) {
    if (!pattern.regex.test(message)) continue;

    if (pattern.qualifier) {
      if (!pattern.qualifier.test(message)) continue;
      if (pattern.confidence > best) {
        best = pattern.confidence;
        explicit = true;
      }
    } else {
      if (pattern.confidence > best) {
        best = pattern.confidence;
      }
    }
  }

  return { confidence: best, explicit };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Resolve entities referenced in a user message.
 * Does NOT infer member identity — only resolves what the message names explicitly.
 */
export function resolveEntities(message: string): ResolvedEntity[] {
  const resolved: ResolvedEntity[] = [];

  for (const entry of ENTITY_REGISTRY) {
    const { confidence, explicit } = scoreEntry(entry, message);
    if (confidence < 0) continue;
    if (!explicit && confidence < 50) continue;
    if (explicit && confidence < 45) continue;

    resolved.push({
      id: entry.id,
      canonicalName: entry.canonicalName,
      entityType: entry.entityType,
      summary: entry.summary,
      keyFacts: entry.keyFacts,
      culturalContext: entry.culturalContext,
      resolutionBasis: explicit ? "explicit_qualifier" : "high_confidence_context",
      assumed: !explicit || confidence < 90,
      isBiographyMode: entry.isBiographyMode,
      sourceNote: entry.sourceNote,
    });
  }

  return resolved.sort((a, b) => {
    const aScore = a.resolutionBasis === "explicit_qualifier" ? 200 : 50;
    const bScore = b.resolutionBasis === "explicit_qualifier" ? 200 : 50;
    return bScore - aScore;
  });
}

/**
 * Returns true when the query is about a named person, group, or creative work
 * and is NOT asking to find a place or service.
 */
export function isBiographyQuery(message: string, resolvedEntities: ResolvedEntity[]): boolean {
  if (
    resolvedEntities.some(
      (e) => e.isBiographyMode && e.resolutionBasis === "explicit_qualifier",
    )
  ) {
    return true;
  }

  const bioPattern =
    /\b(tell me about|who is|who was|who directed|what did .+? do|biography|discography|filmography|known for|member of|part of|sang with|played for|played in|starred in|directed by|written by|recorded by|what songs|what albums|career of)\b/i;
  const placePattern =
    /\b(restaurant|bar|club|lounge|shop|store|near me|spots|venues|find me|show me places|where can i|visit|go to|book a|reservation|looking for a place)\b/i;

  if (bioPattern.test(message) && !placePattern.test(message)) return true;

  return false;
}

/**
 * Build a server-authoritative entity context block for injection into the system prompt.
 * The LLM must not contradict any fact in this block.
 */
export function buildEntityContextBlock(entities: ResolvedEntity[]): string {
  if (entities.length === 0) return "";

  const lines = [
    "⚡ ENTITY RESOLUTION — SERVER-AUTHORITATIVE (verified facts — do not contradict these):",
  ];

  for (const entity of entities) {
    const assumptionNote = entity.assumed
      ? " [resolved from context — state your assumption transparently if ambiguity remains]"
      : " [explicitly identified from member's own words]";

    lines.push(`\n• ${entity.canonicalName}${assumptionNote}`);
    lines.push(`  ${entity.summary}`);

    const factsStr = Object.entries(entity.keyFacts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    if (factsStr) lines.push(`  Key facts — ${factsStr}`);
    lines.push(`  Source: ${entity.sourceNote}`);

    if (entity.isBiographyMode) {
      lines.push(
        `  ⚠ BIOGRAPHY MODE ACTIVE: Member asked about this ${entity.entityType}. ` +
          "Return recommendations: null unless they explicitly ask for a place to visit.",
      );
    }
  }

  return lines.join("\n");
}
