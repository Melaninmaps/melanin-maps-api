import { canonicalizeContextualUrl } from "./contextual-url";

const CURRENT_RESEARCH_RE = /\b(today|tonight|tomorrow|current(?:ly)?|latest|recent|updates?|availability|fresh(?:ness)?|this week|(?:this |next )?weekend|this month|this year|right now|as[- ]of|open[- ]now|what(?:'s| is) open|live (?:travel|trip|recommendations?|updates?|availability)|real[- ]time|up[- ]to[- ]date|hours?|breaking|news|election|redistricting|closing|closed|recall|alert|schedule|weather|price|deadline|law|policy|regulation)\b/i;

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
const CURRENCY_CONVERSION_REQUEST_RE = /\b(?:convert(?:ed|ing|s|ion)?|exchange|rate|how\s+much(?:\s+(?:is|are))?|what(?:'s|\s+is)\s+(?:the\s+)?(?:value|equivalent)|(?:value|worth)\s+in|how\s+many\s+(?:[\p{L}$]+\s+){0,3}(?:make|equals?|is))\b/iu;

function isCurrencyConversionRequest(message: string): boolean {
  return CURRENCY_UNIT_RE.test(message) && CURRENCY_CONVERSION_REQUEST_RE.test(message);
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
const HTTPS_URL_RE = /https:\/\/[^\s<>'"`]+/i;

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
  if (!ARTICLE_SUMMARY_RE.test(message)) return null;
  const raw = message.match(HTTPS_URL_RE)?.[0]?.replace(/[),.;!?]+$/, "") ?? "";
  const safeUrl = canonicalizeContextualUrl(raw);
  return safeUrl ? safeUrl.replace(/[?#].*$/, "") : null;
}

export function hasRequestedArticleEvidence(
  requestedUrl: string | null,
  sources: ReadonlyArray<{ url: string }>,
): boolean {
  if (!requestedUrl) return true;
  return sources.some((source) => canonicalizeContextualUrl(source.url)?.replace(/[?#].*$/, "") === requestedUrl);
}

export function requiresCurrentResearch(message: string): boolean {
  if (isPreferredNameRecallRequest(message)) return false;
  return CURRENT_RESEARCH_RE.test(message)
    || CHANGING_PUBLIC_STATISTIC_RE.test(message)
    || isCurrencyConversionRequest(message)
    || NAMED_CUSTODY_STATUS_RE.test(message)
    || INTRINSIC_CURRENT_FINANCIAL_STATUS_RE.test(message)
    || INTRINSIC_CURRENT_LEADERSHIP_STATUS_RE.test(message)
    || INTRINSIC_CURRENT_PUBLIC_EVENT_STATUS_RE.test(message)
    || requestedArticleSummaryUrl(message) !== null;
}
