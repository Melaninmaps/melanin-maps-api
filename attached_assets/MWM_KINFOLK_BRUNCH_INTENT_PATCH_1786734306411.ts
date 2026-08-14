// MWM KinfolkAI surgical patch: brunch/travel intent precedence and clarification.
// Insert this module in the backend and call classifyKinfolkRequest(message)
// BEFORE the existing generic classifyIntent()/LLM classification.

export type DiscoveryKind =
  | "food"
  | "brunch"
  | "nightlife"
  | "business"
  | "travel"
  | "general";

export type KinfolkRequestDecision = {
  route: "business_discovery" | "travel_planning" | "clarification" | "general_knowledge";
  discoveryKind: DiscoveryKind;
  location: string | null;
  ownershipPreference: string | null;
  culturalContext: string[];
  clarification: string | null;
  reason: string;
};

const LOCATION_RE = /\b(?:in|near|around|at|for)\s+([A-Za-z][A-Za-z .'-]{1,50}?)(?=\s+(?:this weekend|tonight|tomorrow|for|with|that|and)\b|[?.!,]|$)/i;
const OWNERSHIP_RE = /\b(black|african[- ]american|minority|women|woman|veteran|immigrant|lgbtq|indigenous|latino|disability|family)[- ]owned\b/i;
const BRUNCH_RE = /\bbrunch\b|post[- ]church\s+(?:brunch|meal)|after\s+(?:church|service)\s+(?:brunch|meal)|sunday\s+(?:brunch|dining|food)/i;
const FOOD_RE = /\b(food|restaurant|restaurants|eat|eating|dining|dinner|lunch|breakfast|cafe|café|coffee|bakery|meal|spots?)\b/i;
const NIGHTLIFE_RE = /\b(nightlife|night life|bars?|clubs?|lounge|late[- ]night|entertainment|concert|music|party)\b/i;
const TRAVEL_RE = /\b(heading|going|traveling|travelling|visit|visiting|trip|weekend|getaway|staying|hotel|spots? in|things to do)\b/i;
const BUSINESS_RE = /\b(find|recommend|locate|where|businesses?|laundromats?|laundry|grocer(?:y|ies)|salons?|hotels?|restaurants?|brunch)\b/i;

function cleanLocation(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.replace(/[?.,!]+$/g, "").trim();
  return value.length >= 2 && value.length <= 60 ? value : null;
}

export function classifyKinfolkRequest(message: string): KinfolkRequestDecision {
  const text = message.trim();
  const lower = text.toLowerCase();
  const location = cleanLocation(text.match(LOCATION_RE)?.[1]);
  const ownershipPreference = text.match(OWNERSHIP_RE)?.[1]?.toLowerCase() ?? null;
  const culturalContext: string[] = [];

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
      clarification: "I can help find brunch spots. Which city or neighborhood should I search, and are you looking for a post-church Sunday brunch, a specific cuisine, or a particular budget?",
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
  if ((FOOD_RE.test(lower) || NIGHTLIFE_RE.test(lower) || BUSINESS_RE.test(lower) || TRAVEL_RE.test(lower)) && !location) {
    return {
      route: "clarification",
      discoveryKind: FOOD_RE.test(lower) ? "food" : NIGHTLIFE_RE.test(lower) ? "nightlife" : "business",
      location: null,
      ownershipPreference,
      culturalContext,
      clarification: "I can search real businesses, but I need a location first. What city, neighborhood, or metro area should I use? You can also tell me the cuisine, budget, date, and whether you want minority-owned or other community preferences.",
      reason: "discovery_request_missing_location",
    };
  }

  return {
    route: "general_knowledge",
    discoveryKind: "general",
    location: null,
    ownershipPreference,
    culturalContext,
    clarification: null,
    reason: "no_discovery_signal",
  };
}

export function buildDiscoveryInstruction(decision: KinfolkRequestDecision): string {
  if (decision.route === "clarification") return decision.clarification ?? "Ask for the missing location.";
  if (decision.route !== "business_discovery" && decision.route !== "travel_planning") return "";
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
  ].filter(Boolean).join(" ");
}

/* Integration in routes/kinfolk.ts, immediately after message extraction and
   before the existing generic intent classifier:

const earlyDecision = classifyKinfolkRequest(message);
if (earlyDecision.route === "clarification") {
  return void res.json({
    response: earlyDecision.clarification,
    intent: "clarification",
    discoveryKind: earlyDecision.discoveryKind,
    needsClarification: true,
    sources: [],
  });
}
const discoveryInstruction = buildDiscoveryInstruction(earlyDecision);
// Pass earlyDecision.route/discoveryKind/location into the existing resolver.
// Prepend discoveryInstruction to the governed prompt. Do not let a later LLM
// classifier overwrite an explicit brunch/business/travel route.
*/

export const KINFOLK_BRUNCH_REGRESSION_CASES = [
  { input: "Brunch in DC", route: "business_discovery", kind: "brunch", location: "DC" },
  { input: "Heading to DC for the weekend, any brunch spots?", route: "business_discovery", kind: "brunch", location: "DC" },
  { input: "After early church service, where can we brunch in Atlanta?", route: "business_discovery", kind: "brunch", location: "Atlanta" },
  { input: "Any Black-owned brunch spots in Washington DC?", route: "business_discovery", kind: "brunch", location: "Washington DC" },
  { input: "Brunch spots?", route: "clarification", kind: "brunch", location: null },
  { input: "Tell me about brunch as a cultural tradition", route: "general_knowledge", kind: "general", location: null },
] as const;

export default classifyKinfolkRequest;
