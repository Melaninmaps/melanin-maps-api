import {
  classifyCulturalClaimMode,
  classifyIntent,
  getEvidencePolicy,
  type Consequence,
  type KinfolkIntent,
} from "./intent-router";
import { requiresCurrentResearch } from "./current-research";

/** How the answer should treat the central claim. */
export type ClaimMode = "factual" | "evaluative";

/** The minimum retrieval step required before a model may answer. */
export type RetrievalRequirement = "none" | "authoritative" | "web_required";

/** A bounded stable educational component within a member turn. */
export type StableEducationalScope = "none" | "full" | "partial";

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
  /**
   * `full` can be answered with stable knowledge. `partial` has an additional
   * current component that still needs cited evidence.
   */
  stableEducationalScope: StableEducationalScope;
}

const CURRENT_WORDS = /\b(current|currently|recent|recently|latest|today|today's|right now|this week|this month|tonight|tomorrow|this weekend|breaking|news|new release|as of)\b/gi;

// Named works can retain their culture domain even when the turn contains only a title.
const KNOWN_CULTURE_WORK_SIGNALS = /\bSinners\b/i;
// A member organizing their own household budget is asking for general life
// organization, not a regulated investment, credit, tax, or price claim. This
// remains intentionally narrow; financial advice and any current price/rate
// request continue to use the protected financial evidence route.
const PERSONAL_BUDGET_ORGANIZATION_RE = /\b(?:help(?:\s+me)?|can you|could you|should\s+i|do\s+i\s+need\s+to|please|i\s+(?:need|want))?\s*(?:organize|organise|plan|create|make|set\s+up|track|review|manage)\s+(?:my|our|a|the)?\s*(?:household\s+|personal\s+)?budget\b/i;
// This is a work-request boundary, not a topic list: explaining a general
// concept is different from choosing, changing, buying, selling, filing, or
// acting on a member's particular financial situation.
const STABLE_EDUCATION_FRAMING_RE = /\b(?:explain|define|describe|teach\s+me(?:\s+about)?|help\s+me\s+understand|what(?:'s|\s+is)\s+(?:a|an|the)?\s*|how\s+does|how\s+do(?:es)?|in\s+plain\s+(?:language|english))\b/i;
const PERSONALIZED_OR_TRANSACTIONAL_FINANCIAL_RE = /\b(?:should|can|do)\s+(?:i|we)\b|\b(?:my|our)\s+(?:loan|mortgage|portfolio|investment(?:s)?|retirement|credit|debt|tax(?:es)?|insurance\s+(?:plan|policy))\b|\b(?:choose|recommend|buy|sell|apply|file|renew|refinance|invest|borrow|pay\s+off|contribute)\b/i;
const INSURANCE_TERMINOLOGY_RE = /\b(?:premium|deductible|copay|co-pay|coinsurance|out[-\s]?of[-\s]?pocket|coverage\s+limit)\b/i;
const STABLE_FINANCIAL_CONCEPT_RE = /\b(?:inflation|grocery\s+(?:price|prices|budget)|price\s+(?:changes?|increases?)|percentage(?:\s+change)?|compound\s+interest)\b/i;

function resolveStableEducationalScope(
  message: string,
  domain: KinfolkIntent,
  liveWebRequired: boolean,
): StableEducationalScope {
  if (
    !STABLE_EDUCATION_FRAMING_RE.test(message) ||
    PERSONALIZED_OR_TRANSACTIONAL_FINANCIAL_RE.test(message)
  ) {
    return "none";
  }

  // Acute health, legal, emergency, and individual decision turns keep their
  // established evidence requirements. This exception is only for conceptual
  // finance or plain insurance terminology with no member-specific action.
  const eligible =
    domain === "financial_regulated"
    || INSURANCE_TERMINOLOGY_RE.test(message)
    || STABLE_FINANCIAL_CONCEPT_RE.test(message);
  if (!eligible) return "none";

  return liveWebRequired ? "partial" : "full";
}

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
      "Use live web results with a publication or update date. Prefer official or primary sources and corroborate material current claims with reputable reporting. For public affairs, separate verified facts, the speaker's claim or interpretation, and material facts that cannot yet be confirmed. Do not create false balance or treat a politician's claim as a fact. If the member explicitly asks for perspectives from a named community or public-facing group, include a compact range of directly attributed on-record perspectives where reliable sources support them; do not claim that any community has one view or infer a speaker's identity.",
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

  // Keep the evidence route aligned with the chat-route freshness guard,
  // including concise named-person custody or release questions.
  const liveWebRequired = requiresCurrentResearch(cleanMessage);
  const classifiedDomain = semanticDomain(cleanMessage, liveWebRequired);
  const stableEducationalScope = resolveStableEducationalScope(
    cleanMessage,
    classifiedDomain,
    liveWebRequired,
  );
  const domain =
    (PERSONAL_BUDGET_ORGANIZATION_RE.test(cleanMessage) ||
      stableEducationalScope === "full") &&
    !liveWebRequired
      ? "general_knowledge"
      : classifiedDomain;
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
    stableEducationalScope,
  };
}

/** Descriptive alias for future route integration. */
export const buildEvidenceRoute = routeEvidence;
