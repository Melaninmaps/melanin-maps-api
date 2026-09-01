import {
  classifyCulturalClaimMode,
  classifyIntent,
  getEvidencePolicy,
  type Consequence,
  type KinfolkIntent,
} from "./intent-router";

/** How the answer should treat the central claim. */
export type ClaimMode = "factual" | "evaluative";

/** The minimum retrieval step required before a model may answer. */
export type RetrievalRequirement = "none" | "authoritative" | "web_required";

export type AllowedSourceCategory =
  | "official_public_source"
  | "peer_reviewed_research"
  | "recognized_professional_body"
  | "primary_source"
  | "reputable_reference"
  | "reputable_current_reporting"
  | "verified_platform_record";

export interface EvidenceRoute {
  /** Semantic subject of the request. Freshness is represented separately by retrievalRequirement. */
  domain: KinfolkIntent;
  risk: Consequence;
  claimMode: ClaimMode;
  retrievalRequirement: RetrievalRequirement;
  /** When true, the caller must not ask a model to fill an evidence gap from unsupported recall. */
  failClosed: boolean;
  allowedSources: readonly AllowedSourceCategory[];
  sourceGuidance: string;
  /** Evaluative answers do not receive a member-visible provenance slogan. */
  visibleBoilerplate: string | null;
  /** Stable, verified facts about public figures and their work remain answerable. */
  accuratePublicFigureFactsAllowed: true;
}

const LIVE_WEB_SIGNALS = /\b(current|currently|recent|recently|latest|today|today's|right now|this week|this month|tonight|tomorrow|this weekend|breaking|news|new release|as of)\b/i;

const CURRENT_WORDS = /\b(current|currently|recent|recently|latest|today|today's|right now|this week|this month|tonight|tomorrow|this weekend|breaking|news|new release|as of)\b/gi;

// Named works can retain their culture domain even when the turn contains only a title.
const KNOWN_CULTURE_WORK_SIGNALS = /\bSinners\b/i;

const HIGH_STAKES = new Set<KinfolkIntent>([
  "medical_health",
  "legal_regulated",
  "financial_regulated",
  "safety_emergency",
]);

const SOURCE_POLICY: Record<
  "health" | "regulated" | "current" | "culture" | "discovery" | "general",
  { allowedSources: readonly AllowedSourceCategory[]; sourceGuidance: string }
> = {
  health: {
    allowedSources: [
      "official_public_source",
      "peer_reviewed_research",
      "recognized_professional_body",
    ],
    sourceGuidance:
      "Use condition-first guidance from public-health agencies, peer-reviewed research, or recognized clinical bodies. Population evidence is group-level and cannot diagnose an individual.",
  },
  regulated: {
    allowedSources: [
      "official_public_source",
      "primary_source",
      "recognized_professional_body",
    ],
    sourceGuidance:
      "Use controlling official material or a recognized professional body. Do not use community anecdotes as proof for a regulated or emergency claim.",
  },
  current: {
    allowedSources: [
      "official_public_source",
      "primary_source",
      "reputable_current_reporting",
      "verified_platform_record",
    ],
    sourceGuidance:
      "Use live web results with a publication or update date. Prefer official or primary sources and corroborate material current claims with reputable reporting.",
  },
  culture: {
    allowedSources: [
      "primary_source",
      "reputable_reference",
      "reputable_current_reporting",
    ],
    sourceGuidance:
      "Ground biographical, credit, chronology, and influence premises in reliable evidence. An evaluative conclusion must state its criteria or acknowledge multiple defensible views, without adding visible provenance boilerplate.",
  },
  discovery: {
    allowedSources: [
      "official_public_source",
      "primary_source",
      "verified_platform_record",
      "reputable_reference",
    ],
    sourceGuidance:
      "Use verified platform records or current first-party information for availability and location claims; use reputable references for stable background facts.",
  },
  general: {
    allowedSources: ["reputable_reference", "primary_source"],
    sourceGuidance:
      "Stable, low-risk facts may be answered directly. Use a reputable reference or primary source when a material factual premise needs support.",
  },
};

function semanticDomain(message: string, liveWebRequired: boolean): KinfolkIntent {
  if (!liveWebRequired) return classifyIntent(message, false);

  // Preserve the subject domain while treating freshness as an independent evidence requirement.
  const withoutFreshness = message.replace(CURRENT_WORDS, " ").replace(/\s+/g, " ").trim();
  const underlying = classifyIntent(withoutFreshness, false);
  if (underlying === "general_knowledge" && KNOWN_CULTURE_WORK_SIGNALS.test(withoutFreshness)) {
    return "culture_entertainment";
  }
  return underlying === "general_knowledge" ? "current_information" : underlying;
}

function sourcePolicyFor(
  domain: KinfolkIntent,
  liveWebRequired: boolean,
): (typeof SOURCE_POLICY)[keyof typeof SOURCE_POLICY] {
  if (liveWebRequired) return SOURCE_POLICY.current;
  if (domain === "medical_health") return SOURCE_POLICY.health;
  if (domain === "legal_regulated" || domain === "financial_regulated" || domain === "safety_emergency") {
    return SOURCE_POLICY.regulated;
  }
  if (domain === "culture_entertainment" || domain === "hobby_lifestyle") return SOURCE_POLICY.culture;
  if (domain === "business_discovery" || domain === "education_discovery") return SOURCE_POLICY.discovery;
  return SOURCE_POLICY.general;
}

/**
 * Deterministically route a current user turn before any model call.
 * No user profile, name, location history, or stored cultural preference is accepted.
 */
export function routeEvidence(message: string): EvidenceRoute {
  const cleanMessage = message.trim();
  if (!cleanMessage) throw new Error("MESSAGE_REQUIRED");

  const liveWebRequired = LIVE_WEB_SIGNALS.test(cleanMessage);
  const domain = semanticDomain(cleanMessage, liveWebRequired);
  const claimMode = classifyCulturalClaimMode(cleanMessage);
  const baseRisk = getEvidencePolicy(domain).consequence;
  const risk: Consequence = liveWebRequired && baseRisk === "low" ? "medium" : baseRisk;

  let retrievalRequirement: RetrievalRequirement = "none";
  if (liveWebRequired || domain === "business_discovery" || domain === "current_information") {
    retrievalRequirement = "web_required";
  } else if (
    HIGH_STAKES.has(domain) ||
    domain === "culture_entertainment" ||
    domain === "education_discovery"
  ) {
    retrievalRequirement = "authoritative";
  }

  const sourcePolicy = sourcePolicyFor(domain, liveWebRequired);
  return {
    domain,
    risk,
    claimMode,
    retrievalRequirement,
    failClosed: retrievalRequirement !== "none",
    allowedSources: sourcePolicy.allowedSources,
    sourceGuidance: sourcePolicy.sourceGuidance,
    visibleBoilerplate: null,
    accuratePublicFigureFactsAllowed: true,
  };
}

/** Descriptive alias for future route integration. */
export const buildEvidenceRoute = routeEvidence;
