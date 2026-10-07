import { canonicalizeContextualUrl } from "./contextual-url";

// A time horizon alone does not make a member's own plan, draft, or schedule a
// changing public fact. Keep this grammar intentionally about the requested
// task rather than named people, places, or product categories. A separate
// external-status or time-bound travel signal below still preserves live
// research when the answer depends on changing outside conditions.
const SELF_DIRECTED_PLANNING_OR_WRITING_RE = /(?:\b(?:help(?:\s+me)?|can you|could you|please|i\s+(?:need|want|have)\s+to)\s+(?:plan|organize|organise|schedule|prioriti[sz]e|prepare|draft|write|rewrite|revise|edit|brainstorm|outline)\b|\b(?:plan|organize|organise|schedule|prioriti[sz]e|prepare)\s+(?:my|our)\b|\b(?:draft|write|rewrite|revise|edit|brainstorm|outline)\s+(?:a|an|the|my|our|this|that)\b|\b(?:make|create)\s+(?:me\s+)?(?:a\s+)?(?:[\p{L}'’-]+\s+){0,3}(?:plan|schedule|routine|to[- ]?do(?:\s+list)?|task\s+list)\b)/iu;
// Everyday coaching, self-organization, reflection, and explanation requests
// often use a personal time word such as "today" or "tomorrow." Those words
// describe the member's own context, not an external fact for Kinfolk to look
// up. Keep this task-based rather than person/place based so it covers ordinary
// conversation without weakening live evidence for weather, prices, hours, and
// other truly changing claims.
const STABLE_SELF_DIRECTED_SUPPORT_RE = /\b(?:overwhelm(?:ed|ing)?|stress(?:ed|ful)?|anx(?:ious|iety)|busy\s+(?:day|week|schedule|work(?:day)?|workload)|workload|focus|motivat(?:e|ed|ion)|burn(?:ed|out)|self[ -]?care|cope|calm(?:er|ing)?|relationship|partner|friendship|reflect(?:ion)?|communicat(?:e|ion)|conflict|boundar(?:y|ies)|study(?:ing)?|learn(?:ing)?|explain|understand|budget(?:ing)?|organize|organise|prioriti[sz]e|routine|habit|life\s+(?:organization|organising|organizing)|tips?\s+for|advice\s+(?:for|on)|help\s+(?:me\s+)?(?:handle|manage|deal\s+with))\b/iu;
const TIME_HORIZON_RE = /\b(?:today|tonight|tomorrow|(?:this|next)\s+weekend|this\s+(?:week|month|year))\b/i;
const EXTERNAL_STATUS_DEPENDENCY_RE = /\b(?:current(?:ly)?|latest|updates?|availability|available|open|closed|weather|temperature|price|prices|cost|costs|traffic|transit|delay|delays|outage|outages|(?:opening|business|venue|location|site|facility|office|store|service|event)\s+hours?)\b/i;
const EXTERNAL_STATUS_QUESTION_RE = /\b(?:what(?:'s|\s+is|\s+are)|when|where|who|is|are|will|does|do|can)\b[\s\S]{0,90}\b(?:open|closed|availability|available|hours?|schedule|scheduled|weather|temperature|price|prices|cost|costs|traffic|transit|delay|delays|outage|outages)\b/i;
const TIME_BOUND_TRAVEL_RE = /\b(?:trip|travel|vacation|itinerary|flight|flights|hotel|hotels|reservation|reservations)\b/i;
const MATERIAL_CURRENT_FACT_RE = /\b(?:current(?:ly)?|latest|recent|updates?|fresh(?:ness)?|as[- ]of|right now|open[- ]now|availability|available|hours?|weather|temperature|price|prices|cost|costs|traffic|transit|delay|delays|outage|outages|breaking|news|election|redistricting|closing|closed|recall|alert|deadline|law|policy|regulation)\b/i;

function isSelfDirectedPlanningWithOnlyTimeHorizon(message: string): boolean {
  return TIME_HORIZON_RE.test(message)
    && SELF_DIRECTED_PLANNING_OR_WRITING_RE.test(message)
    && !EXTERNAL_STATUS_QUESTION_RE.test(message)
    && !EXTERNAL_STATUS_DEPENDENCY_RE.test(message)
    && !TIME_BOUND_TRAVEL_RE.test(message);
}

function isStableSelfDirectedSupportWithNoCurrentFact(message: string): boolean {
  return STABLE_SELF_DIRECTED_SUPPORT_RE.test(message)
    && !MATERIAL_CURRENT_FACT_RE.test(message)
    && !TIME_BOUND_TRAVEL_RE.test(message);
}

// A bare planning horizon such as "this week" is not itself a changing fact.
// The semantic answer planner decides whether a plan also asks for live status,
// availability, prices, or another external condition. Retaining "this week"
// here would force harmless organizing and drafting requests through research.
const CURRENT_RESEARCH_RE = /\b(today|tonight|tomorrow|current(?:ly)?|latest|recent|updates?|availability|fresh(?:ness)?|(?:this |next )?weekend|this month|this year|right now|as[- ]of|open[- ]now|what(?:'s| is) open|live (?:travel|trip|recommendations?|updates?|availability)|real[- ]time|up[- ]to[- ]date|hours?|breaking|news|election|redistricting|closing|closed|recall|alert|schedule|weather|price|deadline|law|policy|regulation)\b/i;

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
  return articleSourceUrlKey(raw);
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
  if (isSelfDirectedPlanningWithOnlyTimeHorizon(message)) return false;
  if (isStableSelfDirectedSupportWithNoCurrentFact(message)) return false;
  return CURRENT_RESEARCH_RE.test(message)
    || CHANGING_PUBLIC_STATISTIC_RE.test(message)
    || isCurrencyConversionRequest(message)
    || NAMED_CUSTODY_STATUS_RE.test(message)
    || INTRINSIC_CURRENT_FINANCIAL_STATUS_RE.test(message)
    || INTRINSIC_CURRENT_LEADERSHIP_STATUS_RE.test(message)
    || INTRINSIC_CURRENT_PUBLIC_EVENT_STATUS_RE.test(message)
    || requestedArticleSummaryUrl(message) !== null;
}
