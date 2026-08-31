/**
 * KinfolkAI Request Pre-Classifier
 *
 * Runs BEFORE the generic classifyIntent() to enforce routing precedence for
 * brunch, food, nightlife, and travel discovery. Key invariants:
 *
 *   1. "Brunch" is NEVER pop culture — it always routes to business_discovery
 *      (with location) or clarification (without location).
 *   2. Clarification decisions must short-circuit before the LLM is called.
 *   3. When location is missing for any discovery intent, ask for it explicitly
 *      instead of guessing or hallucinating.
 *   4. Pure cultural questions ("Tell me about brunch as a tradition") fall
 *      through to general_knowledge so the existing LLM handles them.
 */

export type DiscoveryKind =
  | "food"
  | "brunch"
  | "nightlife"
  | "business"
  | "travel"
  | "general";

export type KinfolkRequestDecision = {
  route:
    | "business_discovery"
    | "travel_planning"
    | "clarification"
    | "general_knowledge";
  discoveryKind: DiscoveryKind;
  location: string | null;
  ownershipPreference: string | null;
  culturalContext: string[];
  clarification: string | null;
  reason: string;
};

// "to DC for the weekend" — add "to" with a negative lookahead that skips
// articles and common verbs so "to the", "to do", "to see" don't parse as locations.
const LOCATION_RE =
  /\b(?:in|near|around|at|for|to)\s+(?!(?:the|a|an|do|see|find|get|go|be|make|visit|use|take|have|my|your|our|their|his|her|me|us|you|them|it)\b)([A-Za-z][A-Za-z .'-]{1,50}?)(?=\s+(?:this weekend|tonight|tomorrow|for|with|that|and|the)\b|[?.!,]|$)/i;
const OWNERSHIP_RE =
  /\b(black|african[- ]american|minority|women|woman|veteran|immigrant|lgbtq|indigenous|latino|disability|family)[- ]owned\b/i;
const BRUNCH_RE =
  /\bbrunch\b|post[- ]church\s+(?:brunch|meal)|after\s+(?:church|service)\s+(?:brunch|meal)|sunday\s+(?:brunch|dining|food)/i;
const FOOD_RE =
  /\b(food|restaurant|restaurants|eat|eating|dining|dinner|lunch|breakfast|cafe|caf[eé]|coffee|bakery|meal|spots?)\b/i;
const NIGHTLIFE_RE =
  /\b(nightlife|night life|bars?|clubs?|lounge|late[- ]night|entertainment|concert|music|party)\b/i;
const TRAVEL_RE =
  /\b(heading|going|traveling|travelling|visit|visiting|trip|weekend|getaway|staying|hotel|spots? in|things to do)\b/i;
// "brunch" is intentionally excluded — handled by the brunch-specific block above.
const BUSINESS_RE =
  /\b(find|recommend|locate|where|businesses?|laundromats?|laundry|grocer(?:y|ies)|salons?|hotels?|restaurants?)\b/i;

// Pure cultural/informational brunch phrases that should fall through to general_knowledge.
// "Tell me about brunch as a cultural tradition" should NOT become a discovery request.
const BRUNCH_CULTURAL_RE =
  /\b(brunch as a|history of brunch|origin of brunch|brunch tradition|cultural.*brunch|brunch.*culture|tell me about brunch|meaning of brunch|what is brunch)\b/i;

function cleanLocation(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.replace(/[?.,!]+$/g, "").trim();
  return value.length >= 2 && value.length <= 60 ? value : null;
}

/**
 * @param resolvedDestination — pass the already-resolved city from
 * `extractCityFromUserMessage` / `sessionDestination` so alias lookups
 * ("Philly" → "Philadelphia") take priority over the regex-only LOCATION_RE.
 * When provided, it replaces the regex extraction as the canonical location.
 */
export function classifyKinfolkRequest(
  message: string,
  resolvedDestination?: string | null,
): KinfolkRequestDecision {
  const text = message.trim();
  const lower = text.toLowerCase();
  // Use server-resolved city (alias-aware) when available; fall back to regex.
  const location = resolvedDestination
    ? resolvedDestination
    : cleanLocation(text.match(LOCATION_RE)?.[1]);
  const ownershipPreference =
    text.match(OWNERSHIP_RE)?.[1]?.toLowerCase() ?? null;
  const culturalContext: string[] = [];

  // Pure cultural/informational brunch queries short-circuit to general_knowledge
  // BEFORE any discovery routing so they never fall into the clarification branch.
  if (BRUNCH_CULTURAL_RE.test(lower)) {
    return {
      route: "general_knowledge",
      discoveryKind: "general",
      location: null,
      ownershipPreference,
      culturalContext,
      clarification: null,
      reason: "brunch_cultural_question_routes_to_general_knowledge",
    };
  }

  // Brunch is intentionally high precedence. It must never fall through to
  // culture/pop-culture classification merely because the word is ambiguous.
  if (BRUNCH_RE.test(lower)) {
    culturalContext.push("diaspora_brunch", "post_church_social_meal");
    if (location) {
      return {
        route: "business_discovery",
        discoveryKind: "brunch",
        location,
        ownershipPreference,
        culturalContext,
        clarification: null,
        reason: "brunch_with_location_routes_to_food_discovery",
      };
    }
    return {
      route: "clarification",
      discoveryKind: "brunch",
      location: null,
      ownershipPreference,
      culturalContext,
      clarification:
        "I can help find brunch spots. Which city or neighborhood should I search, and are you looking for a post-church Sunday brunch, a specific cuisine, or a particular budget?",
      reason: "brunch_missing_location",
    };
  }

  // Food/travel/business phrases outrank general knowledge and pop culture.
  if ((FOOD_RE.test(lower) || BUSINESS_RE.test(lower)) && location) {
    return {
      route: "business_discovery",
      discoveryKind: "food",
      location,
      ownershipPreference,
      culturalContext,
      clarification: null,
      reason: "food_or_business_with_location_routes_to_catalog_search",
    };
  }

  if (NIGHTLIFE_RE.test(lower) && location) {
    return {
      route: "business_discovery",
      discoveryKind: "nightlife",
      location,
      ownershipPreference,
      culturalContext,
      clarification: null,
      reason: "nightlife_with_location_routes_to_discovery",
    };
  }

  if (TRAVEL_RE.test(lower) && location) {
    return {
      route: "travel_planning",
      discoveryKind: "travel",
      location,
      ownershipPreference,
      culturalContext,
      clarification: null,
      reason: "travel_with_location_routes_to_travel_discovery",
    };
  }

  // Never answer an under-specified discovery request as though it were clear.
  if (
    (FOOD_RE.test(lower) ||
      NIGHTLIFE_RE.test(lower) ||
      BUSINESS_RE.test(lower) ||
      TRAVEL_RE.test(lower)) &&
    !location
  ) {
    return {
      route: "clarification",
      discoveryKind: FOOD_RE.test(lower)
        ? "food"
        : NIGHTLIFE_RE.test(lower)
          ? "nightlife"
          : "business",
      location: null,
      ownershipPreference,
      culturalContext,
      clarification:
        "I can search real businesses, but I need a location first. What city, neighborhood, or metro area should I use? You can also tell me the cuisine, budget, date, and whether you want minority-owned or other community preferences.",
      reason: "discovery_request_missing_location",
    };
  }

  return {
    route: "general_knowledge",
    discoveryKind: "general",
    // Preserve server-resolved geography for city overview, heritage, and history
    // questions. Downstream context resolution treats this as authoritative and
    // bypasses person/work heuristics without turning the request into discovery.
    location,
    ownershipPreference,
    culturalContext,
    clarification: null,
    reason: location ? "resolved_city_context" : "no_discovery_signal",
  };
}

export function buildDiscoveryInstruction(
  decision: KinfolkRequestDecision,
): string {
  if (decision.route === "clarification")
    return decision.clarification ?? "Ask for the missing location.";
  if (
    decision.route !== "business_discovery" &&
    decision.route !== "travel_planning"
  )
    return "";
  const context = decision.culturalContext.includes("diaspora_brunch")
    ? "Brunch may be a post-church Sunday social meal in the diaspora; treat it as a food/discovery request, not pop culture."
    : "";
  const ownership = decision.ownershipPreference
    ? `Ownership preference requested: ${decision.ownershipPreference}-owned. Do not infer ownership; use only verified evidence.`
    : "No ownership preference was supplied; do not infer one.";
  return [
    `Use the governed business discovery search for ${decision.discoveryKind} in ${decision.location}.`,
    context,
    ownership,
    "Return only businesses found in the catalog or by configured web/maps providers. Never invent a listing to reach a requested count.",
    "If fewer verified results exist, say how many were found and why; offer manual review for unresolved candidates.",
  ]
    .filter(Boolean)
    .join(" ");
}
