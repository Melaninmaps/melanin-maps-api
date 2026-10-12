/**
 * Kinfolk evidence query planner.
 *
 * Health retrieval is condition-first and authority-first. Demographic context may
 * shape a supplemental evidence query only when it is explicit in the current turn.
 * Stored cultural profiles remain disabled until a purpose-consent ledger exists.
 */

import { permittedIdentityContext } from "./permitted-identity-context";

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
  /** A retrieval preference, never a claim about the member's identity. */
  representationMode: "none" | "diaspora_first_default" | "explicit_current_turn" | "consented_identity" | "explicit_override";
  queries: SearchQuery[];
  imageRequested: boolean;
  urgentHealthFlag: boolean;
};

export type RepresentationPlanningContext = Readonly<{
  /**
   * A separately consented, sensitive profile-context memory selected by the
   * server for this relevant health turn. It is never inferred from account
   * data, a name, a location, or an ordinary preference.
   */
  consentedHealthPopulationLabel?: string | null;
}>;

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

const SKIN_REPRESENTATION_RE = /\b(?:eczema|dermatitis|rash|skin|psoriasis|acne|hyperpigment(?:ation)?|melasma)\b/i;
const REPRESENTATION_RELEVANT_HEALTH_RE = /\b(?:eczema|dermatitis|rash|skin|psoriasis|acne|hyperpigment(?:ation)?|melasma|hair(?:\s+care)?|scalp|hypertension|blood\s+pressure|heart\s+(?:attack|disease|failure)|stroke|maternal|pregnan(?:cy|t)|postpartum|preeclampsia|fibroids?|lupus|sickle\s+cell|diabetes|asthma)\b/i;
const LIGHTER_SKIN_OVERRIDE_RE = /\b(?:lighter|light)[-\s]+skin(?:\s+(?:examples|images|pictures|photos))?\b/i;
const BROAD_SKIN_TONE_OVERRIDE_RE = /\b(?:all|different|multiple|varied)\s+skin\s+tones?\b|\bskin[-\s]+tone\s+comparison\b/i;

// ── Build MemberProfile from MWM user preferences ────────────────────────────

/**
 * Compatibility adapter for route callers. Saved diaspora, cultural-background,
 * country-origin, and business-preference values are intentionally ignored by the
 * immediate policy; none may establish a retrieval lens without purpose consent.
 */
export function buildMemberProfile(opts: {
  userId: string;
  diasporaCountries?: string[] | null;
  culturalBackground?: string | null;
  preferredOwnershipTypes?: string[] | null;
}): MemberProfile {
  return {
    id: opts.userId,
    active: false,
    activeLensIds: [],
    lenses: [],
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

// ── Explicit current-turn population evidence ─────────────────────────────────

function currentTurnLens(query: string): Lens | null {
  const identity = permittedIdentityContext(query);
  if (!identity.demographicQualifier) return null;
  return {
    id: "explicit-current-turn",
    label: identity.demographicQualifier,
    searchTerms: [identity.demographicQualifier],
    priority: 0,
  };
}

function explicitRepresentationOverrideLens(query: string): Lens | null {
  if (LIGHTER_SKIN_OVERRIDE_RE.test(query)) {
    return {
      id: "explicit-lighter-skin-request",
      label: "lighter skin representation",
      searchTerms: ["lighter skin", "light skin"],
      priority: 0,
    };
  }
  if (BROAD_SKIN_TONE_OVERRIDE_RE.test(query)) {
    return {
      id: "explicit-broad-skin-tone-request",
      label: "broad skin-tone representation",
      searchTerms: ["all skin tones", "skin tone comparison"],
      priority: 0,
    };
  }
  return null;
}

function defaultDiasporaFirstHealthLens(query: string): Lens | null {
  if (!REPRESENTATION_RELEVANT_HEALTH_RE.test(query)) return null;
  return {
    id: "diaspora-first-representation-default",
    label: "Black and Brown representation",
    searchTerms: ["Black", "Brown", "skin of color", "darker skin"],
    priority: 1,
  };
}

function resolveRepresentationLens(
  query: string,
  intent: LensIntent,
  context: RepresentationPlanningContext,
): { lens: Lens | null; mode: SearchPlan["representationMode"] } {
  if (intent !== "health") return { lens: null, mode: "none" };

  const explicitPopulation = currentTurnLens(query);
  if (explicitPopulation) return { lens: explicitPopulation, mode: "explicit_current_turn" };

  const explicitOverride = explicitRepresentationOverrideLens(query);
  if (explicitOverride) return { lens: explicitOverride, mode: "explicit_override" };

  const consentedLabel = context.consentedHealthPopulationLabel?.trim();
  if (consentedLabel) {
    return {
      lens: {
        id: "consented-health-representation",
        label: consentedLabel,
        searchTerms: [consentedLabel],
        priority: 0,
      },
      mode: "consented_identity",
    };
  }

  const defaultLens = defaultDiasporaFirstHealthLens(query);
  return defaultLens
    ? { lens: defaultLens, mode: "diaspora_first_default" }
    : { lens: null, mode: "none" };
}

function healthSubject(query: string): string {
  return normalize(query)
    .replace(/\b(?:i am|i'm|i’m|i identify as|as)\s+(?:a|an)?\s*/i, "")
    .replace(/\b(?:black|african american|latina|latino|latinx|hispanic|indigenous|native american|asian american|south asian|east asian|middle eastern|arab|white|biracial|multiracial)\s+(?:woman|women|man|men|people|community)?\b/gi, "")
    .replace(/\b(?:female|male|intersex)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || normalize(query);
}

function representationHealthQueries(
  query: string,
  lens: Lens,
  mode: SearchPlan["representationMode"],
  imageRequested: boolean,
): SearchQuery[] {
  const subject = healthSubject(query);
  const skinTopic = SKIN_REPRESENTATION_RE.test(query);
  const defaultMode = mode === "diaspora_first_default";
  const explicitOverride = mode === "explicit_override";
  const queryLabel = defaultMode
    ? (skinTopic ? "skin of color" : "Black and Brown health equity")
    : lens.label;
  const reason = defaultMode
    ? "Diaspora-first representation default for a relevant health topic; it improves source coverage without identifying the member or changing condition-first evidence."
    : explicitOverride
      ? "Member explicitly requested a different representation for this turn; it overrides the default retrieval preference."
      : mode === "consented_identity"
        ? "Supplemental group-level evidence from a separately consented identity memory; do not disclose the saved note or diagnose the member."
        : "Supplemental population evidence requested by explicit current-turn wording; treat it as group-level and non-diagnostic.";
  const queries: SearchQuery[] = [{
    text: `${subject} ${queryLabel} ${skinTopic ? "clinical guidance" : "population evidence"}`,
    role: "community_primary",
    lensId: lens.id,
    reason,
  }];

  if (skinTopic && (imageRequested || defaultMode || explicitOverride)) {
    queries.push({
      text: `${subject} ${queryLabel} clinician reviewed images`,
      role: "image",
      lensId: lens.id,
      reason: `${reason} Images must be clinically reviewed and sourced; they are educational, not diagnostic.`,
    });
  }
  return queries;
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
  representationContext: RepresentationPlanningContext = {},
): SearchPlan {
  const intent = detectLensIntent(query, entityIndex);
  const imageRequested = detectImageIntent(query);
  const urgentHealthFlag = isUrgentHealthQuery(query);
  const representation = resolveRepresentationLens(query, intent, representationContext);
  const activeLenses = representation.lens ? [representation.lens] : [];

  if (intent === "entity") {
    const candidates = entityIndex[normalize(query)] ?? [];
    const lensText = profileTerms(activeLenses).join(" ");
    return {
      intent,
      activeLenses,
      representationMode: representation.mode,
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

  if (intent === "health") {
    const subject = healthSubject(query);
    queries.push({
      text: `${subject} official clinical guidance`,
      role: "evidence",
      reason: "Condition-first authoritative evidence is required before any population context.",
    });
    if (representation.lens) {
      queries.push(...representationHealthQueries(
        query,
        representation.lens,
        representation.mode,
        imageRequested,
      ));
    }
    if (imageRequested && SKIN_REPRESENTATION_RE.test(query) && !representation.lens) {
      queries.push({
        text: `${subject} clinician reviewed images`,
        role: "image",
        reason: "Clinician-reviewed images supplement, but do not replace, authoritative health guidance.",
      });
    }
  } else {
    queries.push({
      text: query,
      role: "general",
      reason: "General evidence query retained for accuracy and source verification.",
    });
    if (imageRequested) {
      queries.push({
        text: `${query} images`,
        role: "image",
        reason: "Image search follows the explicit request without a stored demographic qualifier.",
      });
    }
  }

  return {
    intent,
    activeLenses,
    representationMode: representation.mode,
    queries: dedupeQueries(queries),
    imageRequested,
    urgentHealthFlag,
  };
}

/** Stored-profile lens disclosure is disabled until purpose-consent is implemented. */
export function activeLensDisclosure(_profile: MemberProfile): string {
  return "";
}

/** Returns an urgent-care message for pregnancy/postpartum danger language. */
export function urgentHealthMessage(flag: boolean): string | undefined {
  if (!flag) return undefined;
  return "Urgent: if you are pregnant or postpartum and have a severe headache, vision changes, upper-abdominal pain, chest pain, or trouble breathing, seek emergency medical care now. In the U.S., call 9-1-1 or contact your maternity care team immediately.";
}
