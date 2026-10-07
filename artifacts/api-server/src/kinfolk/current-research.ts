import { canonicalizeContextualUrl } from "./contextual-url";

// A temporal word tells Kinfolk when a member is thinking or planning, not
// whether a fact outside the conversation has changed. Research is therefore
// a positive classification: it needs a changing external fact, an operating
// status tied to an external entity, or a time-bound request to select one.
const TIME_HORIZON_RE = /\b(?:today|tonight|tomorrow|(?:this|next)\s+weekend|this\s+(?:week|month|year))\b/i;
const INTRINSIC_CHANGING_EXTERNAL_FACT_RE = /\b(?:weather|forecast|temperature|rain|snow|wind|air\s+quality|availability|available|outage|outages|traffic|transit|delay|delays|cancellations?|breaking\s+news|news|election|redistricting|officeholder|law|laws|policy|regulation|regulations?|recall|alert|alerts?|deadline|deadlines?|price|prices|cost|costs|gas\s+prices?|interest\s+rates?|exchange\s+rates?|market\s+price|stock\s+price|showtimes?)\b/i;
const EXPLICIT_CURRENT_STATUS_RE = /\b(?:current|recent|latest|today|live)\s+(?:status|updates?)\b/i;
const CURRENT_NAMED_UPDATE_RE = /\b(?:current|recent|latest|today|live)\s+(?!i\b|we\b|my\b|our\b)[A-Z][\p{L}'’-]{1,}(?:\s+[\p{L}\d'’-]+){0,5}\s+(?:status|updates?)\b/iu;
const OPERATING_STATUS_RE = /\b(?:open|closed|close|closing|opening|hours?|schedule|scheduled|availability|available)\b/i;
const EXTERNAL_ENTITY_RE = /\b(?:business|restaurant|cafe|store|shop|dry\s+cleaner|venue|gallery|location|library|museum|office|service|clinic|school|airport|flight|train|bus|transit|hotel|reservation|trip|travel|vacation|itinerary|event|concert|game|show|movie|site|website|place)\b/i;
const EXTERNAL_DISCOVERY_ACTION_RE = /\b(?:find|search|recommend|give|choose|select|book|reserve|visit|go\s+to|eat\s+at|plan)\b/i;
const WHAT_IS_OPEN_RE = /\bwhat(?:'s|\s+is)\s+open\b/i;
const OPEN_NOW_RE = /\bopen[-\s]?now\b/i;
const LIVE_DISCOVERY_RE = /\b(?:live|real[- ]?time|up[- ]?to[- ]?date)\b/i;

// Official eligibility, filing, renewal, and contribution rules are externally
// maintained facts. Detect the regulated subject plus a rule/action, rather than
// a list of sample questions, so source retrieval is required even when a member
// omits words such as "today" or "latest."
const REGULATED_PUBLIC_SUBJECT_RE = /\b(?:passport|travel documents?|identity documents?|government[-\s]?issued (?:id|identification)|driver'?s? licen[cs]e|permit|immigration|citizenship|tax|irs|roth\s+ira|ira|401\s*\(?k\)?|retirement account|social security|medicare|medicaid)\b/i;
const REGULATED_PUBLIC_ACTION_RE = /\b(?:requirements?|eligibility|renew(?:al)?|replace(?:ment)?|apply|application|fil(?:e|ing)|deadline|contribution(?:\s+limit)?|limit|limits|deduction|credit|threshold|benefit|benefits)\b/i;

function hasChangingExternalFact(message: string): boolean {
  if (
    INTRINSIC_CHANGING_EXTERNAL_FACT_RE.test(message)
    || EXPLICIT_CURRENT_STATUS_RE.test(message)
    || CURRENT_NAMED_UPDATE_RE.test(message)
    || (REGULATED_PUBLIC_SUBJECT_RE.test(message) && REGULATED_PUBLIC_ACTION_RE.test(message))
  ) return true;

  // Operating hours and schedules are current only when they describe a place,
  // service, event, or direct "what is open" query—not a member's own workday.
  if (
    OPERATING_STATUS_RE.test(message)
    && (EXTERNAL_ENTITY_RE.test(message) || WHAT_IS_OPEN_RE.test(message) || OPEN_NOW_RE.test(message))
  ) {
    return true;
  }

  // A time-bound selection of an outside place or trip needs live availability;
  // a personal plan with the same time horizon remains a direct answer.
  return (TIME_HORIZON_RE.test(message) || LIVE_DISCOVERY_RE.test(message))
    && EXTERNAL_DISCOVERY_ACTION_RE.test(message)
    && EXTERNAL_ENTITY_RE.test(message);
}

// Population is a changing public statistic even when the member does not say
// “current.” A yearless answer from model memory is misleading, so it requires
// the same cited-live-research path as an explicit “as of today” request.
const CHANGING_PUBLIC_STATISTIC_RE = /\b(?:how many\s+(?:people|residents)\s+live|(?:current|estimated|estimated\s+total)\s+population|population\s+(?:of|in|is))\b/i;

// Currency values move even when the member does not say “current,” “rate,”
// or “exchange.” Route natural conversion wording through cited live research
// rather than allowing an old Library or model-memory answer. This deliberately
// requires both a recognized currency unit and a conversion request so a stable
// history question about a currency is not over-routed.
const CURRENCY_UNIT_RE = /\b(?:usd|us\s*dollars?|dollars?|eur|euros?|gbp|pounds?|sterling|try|turkish\s*lira|lira|cad|canadian\s*dollars?|aud|australian\s*dollars?|jpy|yen|cny|yuan|rmb|inr|rupees?|mxn|pesos?|brl|reais?|zar|rand|ngn|naira|kes|shillings?)\b/i;
const CURRENCY_CONVERSION_REQUEST_RE = /\b(?:convert(?:ed|ing|s|ion)?|exchange|rate|how\s+much(?:\s+(?:is|are))?|what(?:'s|\s+is)\s+(?:the\s+)?(?:value|equivalent)|what(?:'s|\s+is)\s+(?:[\p{L}\d$,.]+\s+){1,8}in\s+(?:[\p{L}$]+)|(?:value|worth)\s+in|how\s+many\s+(?:[\p{L}$]+\s+){0,3}(?:make|equals?|is))\b/iu;
const HISTORICAL_RATE_RE = /\b(?:historical(?:ly)?|in|during|as\s+of)\s+(?:the\s+)?(?:19|20)\d{2}\b|\b(?:last\s+year|years?\s+ago|at\s+that\s+time)\b/i;
const MERCHANT_PAYMENT_POLICY_RE = /\b(?:accepts?|accepted|take|pay(?:ment)?\s+(?:method|methods|option|options)|can\s+i\s+pay)\b[\s\S]{0,80}\b(?:cash|card|credit|debit|usd|dollars?|eur|euros?|gbp|pounds?|jpy|yen|cny|yuan|rmb|inr|rupees?|mxn|pesos?)\b/i;

export type TemporalEvidencePolicy = Readonly<{
  requestedFact:
    | "currency_conversion"
    | "merchant_payment_policy"
    | "operating_status"
    | "public_estimate"
    | "changing_public_fact"
    | "stable";
  freshness: "current" | "historical" | "stable";
  evidenceStandard:
    | "single_authoritative_or_reliable"
    | "single_authoritative"
    | "independent_corroboration"
    | "none";
  calculationEligible: boolean;
}>;

export function isCurrencyConversionRequest(message: string): boolean {
  return CURRENCY_UNIT_RE.test(message) && CURRENCY_CONVERSION_REQUEST_RE.test(message);
}

/**
 * Separates the requested fact from its freshness and source threshold. A
 * time-sensitive fact is not automatically a consensus question: a directly
 * relevant authoritative or established market source can be enough for a
 * deterministic conversion or a published operating/payment policy.
 */
export function temporalEvidencePolicy(message: string): TemporalEvidencePolicy {
  if (isCurrencyConversionRequest(message)) {
    return {
      requestedFact: "currency_conversion",
      freshness: HISTORICAL_RATE_RE.test(message) ? "historical" : "current",
      evidenceStandard: "single_authoritative_or_reliable",
      calculationEligible: true,
    };
  }
  if (MERCHANT_PAYMENT_POLICY_RE.test(message)) {
    return {
      requestedFact: "merchant_payment_policy",
      freshness: "current",
      evidenceStandard: "single_authoritative",
      calculationEligible: false,
    };
  }
  if (
    OPERATING_STATUS_RE.test(message) &&
    (EXTERNAL_ENTITY_RE.test(message) || WHAT_IS_OPEN_RE.test(message) || OPEN_NOW_RE.test(message))
  ) {
    return {
      requestedFact: "operating_status",
      freshness: "current",
      evidenceStandard: "single_authoritative",
      calculationEligible: false,
    };
  }
  if (isPublicNetWorthEstimateRequest(message)) {
    return {
      requestedFact: "public_estimate",
      freshness: "current",
      evidenceStandard: "single_authoritative_or_reliable",
      calculationEligible: false,
    };
  }
  if (
    hasChangingExternalFact(message) ||
    CHANGING_PUBLIC_STATISTIC_RE.test(message) ||
    NAMED_CUSTODY_STATUS_RE.test(message) ||
    INTRINSIC_CURRENT_FINANCIAL_STATUS_RE.test(message) ||
    INTRINSIC_CURRENT_LEADERSHIP_STATUS_RE.test(message) ||
    INTRINSIC_CURRENT_PUBLIC_EVENT_STATUS_RE.test(message)
  ) {
    return {
      requestedFact: "changing_public_fact",
      freshness: "current",
      evidenceStandard: "independent_corroboration",
      calculationEligible: false,
    };
  }
  return {
    requestedFact: "stable",
    freshness: "stable",
    evidenceStandard: "none",
    calculationEligible: false,
  };
}

export function requiresTimeSpecificResearch(message: string): boolean {
  return temporalEvidencePolicy(message).freshness !== "stable";
}

/**
 * Conversational wording such as “Is Durk coming home?” can be a concise
 * request for the current custody or release status of a named public figure.
 * Treat it as time-sensitive rather than guessing from model memory. Requiring
 * an explicit question form and a capitalized name avoids routing ordinary
 * “my sister is coming home from school” turns into an unnecessary web search.
 */
const NAMED_CUSTODY_STATUS_RE = /\b(?:is|are|will|did|does|when\s+(?:is|will)|can)\s+[A-Z][\p{L}'’-]{1,}(?:\s+[A-Z][\p{L}'’-]{1,}){0,2}\s+(?:(?:come|coming|get|getting|be|being)\s+(?:back\s+)?home|(?:be\s+)?(?:out|released|free|on\s+bail|on\s+bond))\b/iu;

// Net-worth estimates, public-figure earnings, corporate leadership, and
// public-event status change even when the member does not add "current" or
// "today." These concise question forms must use cited evidence rather than
// model recall or a static Library entry.
const INTRINSIC_CURRENT_FINANCIAL_STATUS_RE = /\b(?:net[\s-]?worth|how\s+(?:much|rich)\s+(?:is|are)\s+[\p{L}'’.-]{2,}(?:\s+[\p{L}'’.-]{2,}){0,5}\s+worth|how\s+much\s+does\s+[\p{L}'’.-]{2,}(?:\s+[\p{L}'’.-]{2,}){0,5}\s+(?:make|earn)|(?:current|latest|annual|yearly)\s+(?:earnings?|salary|income|compensation)|(?:stock|share)\s+price|market\s+cap(?:italization)?)\b/iu;

// Public net-worth figures are current estimates, not regulated financial advice.
// They need live, cited evidence, but reputable financial reporting can be the
// sole source when no primary issuer or official record exists.
const PUBLIC_NET_WORTH_ESTIMATE_RE = /\b(?:net[\s-]?worth|how\s+(?:much|rich)\s+(?:is|are)\s+[\p{L}'’.-]{2,}(?:\s+[\p{L}'’.-]{2,}){0,5}\s+worth)\b/iu;
const INTRINSIC_CURRENT_LEADERSHIP_STATUS_RE = /\b(?:who\s+(?:is|are)\s+(?:the\s+)?(?:current\s+)?(?:ceo|chief\s+executive(?:\s+officer)?|president|chair(?:person|man)?|director|governor|mayor|prime\s+minister)|(?:is|are)\s+[\p{L}'’.-]{2,}(?:\s+[\p{L}'’.-]{2,}){0,5}\s+(?:still\s+)?(?:the\s+)?(?:ceo|chief\s+executive(?:\s+officer)?|president|chair(?:person|man)?|director|governor|mayor|prime\s+minister)|who\s+(?:leads?|runs?|heads?)\s+(?:the\s+)?(?:company|organization|organisation|agency|department|administration))\b/iu;
const INTRINSIC_CURRENT_PUBLIC_EVENT_STATUS_RE = /\b(?:is|are|will|when|where|what\s+time)\b[\s\S]{0,90}\b(?:tour(?:ing|\s+dates?)?|concerts?|events?|games?|appearances?|showtimes?|schedule)\b|\b(?:upcoming|next)\s+(?:tour|concert|event|game|appearance|show)\b/iu;

const ARTICLE_SUMMARY_RE = /\b(?:summari[sz]e|summary)\b/i;
const ARTICLE_LINK_CANDIDATE_RE = /(?:https?:\/\/|www\.)[^\s<>'"`]+/i;

export type ArticleSummaryRetrievalState =
  | "not_requested"
  | "available"
  | "unsupported_link"
  | "paywall_or_login"
  | "extraction_failed"
  | "inaccessible"
  | "provider_unavailable";

export type ArticleSummaryRequest = Readonly<{
  state: "not_requested" | "ready" | "unsupported_link";
  url: string | null;
}>;

// A member asking Kinfolk to repeat their own explicitly saved address is a
// first-party memory recall, not a request for a fresh public fact. This stays
// deliberately narrow: ordinary questions containing “today” still require
// current evidence, while “What name should you call me?” can reach the
// consent-gated preferred-name prompt block.
const PREFERRED_NAME_RECALL_RE = /\b(?:what\s+name\s+should\s+you\s+call\s+me|what\s+do\s+you\s+call\s+me|what(?:'s|\s+is)\s+my\s+preferred\s+name|do\s+you\s+remember\s+(?:my|the)\s+(?:preferred\s+)?name|(?:greet|address)\s+me\s+(?:(?:using|by)\s+)?(?:my\s+)?(?:saved\s+)?preferred\s+name|use\s+(?:my\s+)?(?:saved\s+)?preferred\s+name)\b/i;

export function isPreferredNameRecallRequest(message: string): boolean {
  return PREFERRED_NAME_RECALL_RE.test(message);
}

export function isPublicNetWorthEstimateRequest(message: string): boolean {
  return PUBLIC_NET_WORTH_ESTIMATE_RE.test(message)
    && !/\b(?:stock|share)\s+price|market\s+cap(?:italization)?\b/i.test(message);
}

/**
 * Returns an explicitly supplied public article URL only when the member asks
 * for a summary. The server later requires cited retrieval of this same source,
 * so Kinfolk cannot summarize a merely similar story from model recall.
 */
export function requestedArticleSummaryUrl(message: string): string | null {
  return inspectArticleSummaryRequest(message).url;
}

/**
 * Distinguishes an ordinary request to summarize a linked article from a link
 * that must not enter retrieval at all. The route returns a static, clear
 * response for unsupported links before memory, providers, or model work.
 */
export function inspectArticleSummaryRequest(message: string): ArticleSummaryRequest {
  if (!ARTICLE_SUMMARY_RE.test(message)) {
    return { state: "not_requested", url: null };
  }
  const raw = message.match(ARTICLE_LINK_CANDIDATE_RE)?.[0]?.replace(/[),.;!?]+$/, "") ?? "";
  if (!raw) return { state: "not_requested", url: null };
  const url = articleSourceUrlKey(raw);
  return url
    ? { state: "ready", url }
    : { state: "unsupported_link", url: null };
}

/**
 * Normalizes only equivalent transport variants for a member-selected source.
 * Query strings, fragments, and a terminal path slash do not identify a
 * different article; hostname and every non-terminal path segment must still
 * match exactly. This prevents a provider's harmless URL canonicalization from
 * turning an exact article retrieval into a false negative.
 */
function articleSourceUrlKey(value: string): string | null {
  const safeUrl = canonicalizeContextualUrl(value);
  if (!safeUrl) return null;
  const parsed = new URL(safeUrl);
  parsed.search = "";
  parsed.hash = "";
  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }
  return parsed.toString();
}

export function hasRequestedArticleEvidence(
  requestedUrl: string | null,
  sources: ReadonlyArray<{ url: string }>,
): boolean {
  if (!requestedUrl) return true;
  const requestedKey = articleSourceUrlKey(requestedUrl);
  return requestedKey !== null && sources.some(
    (source) => articleSourceUrlKey(source.url) === requestedKey,
  );
}

export function requiresCurrentResearch(message: string): boolean {
  if (isPreferredNameRecallRequest(message)) return false;
  return temporalEvidencePolicy(message).freshness === "current"
    || requestedArticleSummaryUrl(message) !== null;
}
