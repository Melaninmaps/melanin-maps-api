/**
 * Kinfolk profile-first query planner.
 *
 * Adapted from the Manus profile-first web search starter.
 * Converts a member's voluntarily saved community lens + their query into a
 * ranked set of search queries: community-primary tracks first, then an
 * authoritative evidence track. The model is never called before this plan runs.
 */

export type LensIntent = "health" | "image" | "entity" | "news" | "local" | "general";

export type Lens = {
  id: string;
  label: string;
  searchTerms: string[];
  priority: number;
};

export type MemberProfile = {
  id: string;
  active: boolean;
  activeLensIds: string[];
  lenses: Lens[];
  preferredDomains: string[];
  blockedDomains: string[];
  locale: string;
};

export type SearchQueryRole = "community_primary" | "evidence" | "general" | "image" | "entity";

export type SearchQuery = {
  text: string;
  role: SearchQueryRole;
  lensId?: string;
  reason: string;
};

export type SearchPlan = {
  intent: LensIntent;
  activeLenses: Lens[];
  queries: SearchQuery[];
  imageRequested: boolean;
  urgentHealthFlag: boolean;
};

// ── Term libraries ─────────────────────────────────────────────────────────────

const HEALTH_TERMS = [
  "eczema", "rash", "dermatitis", "blood pressure", "hypertension",
  "preeclampsia", "pregnan", "postpartum", "diabetes", "asthma",
  "pain", "symptom", "cancer", "depression", "anxiety", "fertility",
  "fibroids", "lupus", "sickle cell", "heart disease", "stroke",
];

const IMAGE_TERMS = ["image", "images", "picture", "pictures", "photo", "photos", "show me", "what does"];

const URGENT_TERMS = [
  "severe headache", "vision changes", "blurry vision", "seeing spots",
  "trouble breathing", "shortness of breath", "chest pain",
  "upper stomach pain", "upper abdominal pain",
  "pregnant and swelling", "postpartum headache",
];

// ── Build MemberProfile from MWM user preferences ────────────────────────────

/**
 * Maps MWM's diasporaCountries + preferences to the lens structure.
 * Only uses voluntarily saved profile fields — never infers race, ethnicity,
 * gender, nationality, religion, pregnancy status, or medical condition.
 */
export function buildMemberProfile(opts: {
  userId: string;
  diasporaCountries?: string[] | null;
  culturalBackground?: string | null;
  preferredOwnershipTypes?: string[] | null;
}): MemberProfile {
  const lenses: Lens[] = [];

  if (opts.diasporaCountries?.length) {
    // Each diaspora country/identity becomes search terms alongside the label
    const labels = opts.diasporaCountries.slice(0, 3); // cap at 3 to avoid query bloat
    lenses.push({
      id: "diaspora-lens",
      label: labels.join(" / "),
      searchTerms: labels.flatMap((label) => [
        label,
        `${label} community`,
        `${label} diaspora`,
      ]),
      priority: 0,
    });
  }

  if (opts.culturalBackground && !opts.diasporaCountries?.length) {
    lenses.push({
      id: "cultural-background",
      label: opts.culturalBackground,
      searchTerms: [opts.culturalBackground, `${opts.culturalBackground} community`],
      priority: 0,
    });
  }

  return {
    id: opts.userId,
    active: lenses.length > 0,
    activeLensIds: lenses.map((l) => l.id),
    lenses,
    preferredDomains: [],
    blockedDomains: [],
    locale: "en-US",
  };
}

// ── Intent detection ──────────────────────────────────────────────────────────

export function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

export function detectLensIntent(query: string, entityIndex: Record<string, unknown>): LensIntent {
  const normalized = normalize(query);
  if (entityIndex[normalized]) return "entity";
  if (HEALTH_TERMS.some((term) => normalized.includes(term))) return "health";
  if (/(news|today|latest|this week)/.test(normalized)) return "news";
  if (/(near me|nearby|in my area|local)/.test(normalized)) return "local";
  if (IMAGE_TERMS.some((term) => normalized.includes(term))) return "image";
  return "general";
}

export function detectImageIntent(query: string): boolean {
  const normalized = normalize(query);
  return IMAGE_TERMS.some((term) => normalized.includes(term));
}

export function isUrgentHealthQuery(query: string): boolean {
  const normalized = normalize(query);
  const pregnancyRelated = /(pregnan|postpartum|preeclampsia)/.test(normalized);
  return pregnancyRelated && URGENT_TERMS.some((term) => normalized.includes(term));
}

function profileTerms(lenses: Lens[]): string[] {
  return lenses.flatMap((lens) => [lens.label, ...lens.searchTerms]).filter(Boolean);
}

// ── Condition-specific community-primary query expansion ──────────────────────

function conditionSpecificQueries(query: string, lenses: Lens[]): string[] {
  const normalized = normalize(query);
  const lensTerms = profileTerms(lenses);
  const primaryLens = lensTerms[0] ?? "diaspora communities";

  if (/(eczema|dermatitis)/.test(normalized)) {
    return [
      "eczema in skin of color clinician reviewed images",
      `eczema ${primaryLens} trusted health resources`,
      `atopic dermatitis ${primaryLens} brown dark skin`,
    ];
  }
  if (/(blood pressure|hypertension)/.test(normalized)) {
    return [
      `high blood pressure ${primaryLens} trusted health resources`,
      `hypertension ${primaryLens} community health`,
      `blood pressure ${primaryLens} population context CDC`,
    ];
  }
  if (/preeclampsia|pregnan|postpartum/.test(normalized)) {
    return [
      `preeclampsia ${primaryLens} maternal health trusted resources`,
      `pregnancy blood pressure ${primaryLens} community health`,
      "preeclampsia urgent warning signs CDC",
    ];
  }
  if (/(fibroids|uterine)/.test(normalized)) {
    return [
      `uterine fibroids ${primaryLens} trusted health resources`,
      `fibroids ${primaryLens} treatment options`,
    ];
  }
  if (/(lupus|sickle cell|sickle-cell)/.test(normalized)) {
    return [
      `${query} ${primaryLens} community health resources`,
      `${query} ${primaryLens} clinical guidance`,
    ];
  }
  if (/(depression|anxiety|mental health)/.test(normalized)) {
    return [
      `mental health ${primaryLens} culturally affirming resources`,
      `${query} ${primaryLens} community support`,
    ];
  }
  return [
    `${query} ${primaryLens} trusted resources`,
    `${query} ${primaryLens} community context`,
  ];
}

function dedupeQueries(queries: SearchQuery[]): SearchQuery[] {
  const seen = new Set<string>();
  return queries.filter((q) => {
    const key = normalize(q.text);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main plan builder ─────────────────────────────────────────────────────────

/**
 * The critical Kinfolk behavior: the active lens is read and converted to
 * search queries BEFORE any call to a web provider or LLM. The evidence query
 * is retained alongside so relevance does not lower the factual quality bar.
 */
export function buildSearchPlan(
  query: string,
  profile: MemberProfile,
  entityIndex: Record<string, { searchQuery: string }[]>,
): SearchPlan {
  const intent = detectLensIntent(query, entityIndex);
  const imageRequested = detectImageIntent(query);
  const urgentHealthFlag = isUrgentHealthQuery(query);
  const activeLenses = profile.active
    ? profile.lenses
        .filter((l) => profile.activeLensIds.includes(l.id))
        .sort((a, b) => a.priority - b.priority)
    : [];

  if (intent === "entity") {
    const candidates = entityIndex[normalize(query)] ?? [];
    const lensText = profileTerms(activeLenses).join(" ");
    return {
      intent,
      activeLenses,
      imageRequested,
      urgentHealthFlag,
      queries: candidates.map((c, i) => ({
        text: c.searchQuery,
        role: i === 0 ? "entity" : "general",
        reason: i === 0
          ? `Entity candidate prioritized by active Kinfolk lens: ${lensText || "none"}.`
          : "Alternate candidate retained to prevent false identity merging.",
      })),
    };
  }

  const queries: SearchQuery[] = [];
  if (activeLenses.length > 0) {
    for (const expansion of conditionSpecificQueries(query, activeLenses)) {
      queries.push({
        text: expansion,
        role: imageRequested && /(eczema|dermatitis|skin)/.test(normalize(query)) ? "image" : "community_primary",
        lensId: activeLenses[0].id,
        reason: `Community-primary expansion using active Kinfolk lens: ${activeLenses.map((l) => l.label).join(", ")}.`,
      });
    }
  }

  queries.push({
    text: intent === "health" ? `${query} official health guidance` : query,
    role: intent === "health" ? "evidence" : "general",
    reason: "Authoritative evidence track retained for accuracy and source verification.",
  });

  if (imageRequested && intent !== "health") {
    queries.push({
      text: `${query} images ${profileTerms(activeLenses).join(" ")}`.trim(),
      role: "image",
      reason: "Image search with the active community lens applied.",
    });
  }

  return { intent, activeLenses, queries: dedupeQueries(queries), imageRequested, urgentHealthFlag };
}

/** Builds the "Searched with your Kinfolk lens" disclosure shown to the member. */
export function activeLensDisclosure(profile: MemberProfile): string {
  const lenses = profile.lenses.filter((l) => profile.activeLensIds.includes(l.id));
  return lenses.length
    ? `Searched with your Kinfolk lens first: ${lenses.map((l) => l.label).join(" + ")}.`
    : "";
}

/** Returns an urgent-care message for pregnancy/postpartum danger language. */
export function urgentHealthMessage(flag: boolean): string | undefined {
  if (!flag) return undefined;
  return "Urgent: if you are pregnant or postpartum and have a severe headache, vision changes, upper-abdominal pain, chest pain, or trouble breathing, seek emergency medical care now. In the U.S., call 9-1-1 or contact your maternity care team immediately.";
}
