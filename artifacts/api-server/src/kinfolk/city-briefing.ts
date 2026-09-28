import type { SemanticTurnPlan } from "./semantic-turn-planner";

/**
 * City briefings are deliberately distinct from restaurant searches and travel
 * itineraries. They are current-affairs overviews for a resolved place, with a
 * factual public-information core and only an optional, explicit-interest lens.
 */
const CITY_BRIEFING_PATTERNS = [
  /\bwhat(?:'s| is) (?:going on|happening|trending)\b/i,
  /\bwhat should i know\b/i,
  /\bwhat will i see\b/i,
  /\b(?:what (?:should i|do i|current|practical)|anything).{0,80}\bbefore (?:i|we) (?:go|travel|arrive)\b/i,
  /\bbefore (?:i|we) (?:go|travel|arrive)\b.{0,100}\b(?:what|anything|current|practical|safety|transit|weather|verify)\b/i,
  /\b(?:city|local|neighborhood) (?:news|briefing|update|politics|policy)\b/i,
  /\b(?:brief|catch me) up\b/i,
  /\b(?:anything|what) new\b/i,
];

/**
 * This is a server-authored recovery action shown only after a current city
 * briefing cannot gather enough independent sources. It must resolve as a
 * stable briefing, rather than being treated as an unrelated literal phrase.
 */
const STABLE_CITY_BACKGROUND_PATTERN = /^show me (?:the )?stable background$/i;

const cleanList = (value: unknown, limit = 6): string[] => Array.isArray(value)
  ? value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => item.length >= 2 && item.length <= 80)
    .slice(0, limit)
  : [];

export type CityBriefingPreferenceInput = {
  favoriteCategories?: unknown;
  culturalInterests?: unknown;
  lifestyleServices?: unknown;
  knowBeforeYouGo?: unknown;
} | null | undefined;

export type CityBriefingPurpose = "visiting" | "moving" | "general";

/**
 * A first-class semantic handoff candidate. This deliberately recognizes a
 * resolved place plus an ordinary conversational or travel turn; the bounded
 * classifier below decides whether the person actually wants city readiness.
 * It is not a growing list of member phrases, and it never runs for a
 * high-consequence or explicit local-business request.
 */
export function mayNeedSemanticCityReadiness(input: {
  message: string;
  destination: string | null;
  currentTurnLocation: boolean;
  requestRoute: "business_discovery" | "travel_planning" | "clarification" | "general_knowledge";
  highConsequence: boolean;
}): boolean {
  const message = input.message.trim();
  if (!input.destination || input.highConsequence || message.length < 3 || message.length > 600) return false;
  if (input.requestRoute !== "general_knowledge" && input.requestRoute !== "travel_planning") return false;
  // A travel continuation can use the active conversation's resolved city;
  // otherwise require that the member named a city in the current turn.
  return input.currentTurnLocation || input.requestRoute === "travel_planning";
}

/** The model chooses only whether to activate the existing governed city briefing. */
export function isSemanticCityReadinessDecision(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const result = value as { intent?: unknown; confidence?: unknown };
  return result.intent === "city_readiness"
    && typeof result.confidence === "number"
    && Number.isFinite(result.confidence)
    && result.confidence >= 0.76;
}

export function buildSemanticCityReadinessClassifierPrompt(input: {
  city: string;
  stateCode: string | null;
}): string {
  const place = [input.city, input.stateCode].filter(Boolean).join(", ");
  return [
    "Classify the member's newest message only. Do not answer it.",
    `The active city context is ${place}.`,
    "Return strict JSON only: {\"intent\":\"city_readiness\"|\"not_city_readiness\",\"confidence\":0..1}.",
    "Choose city_readiness when ordinary, incomplete, casual, or slang wording means the member wants help arriving, visiting, moving through, settling into, or getting current practical context for that city. This includes an implied request for a current city update, arrival orientation, local conditions, or what they should be prepared for.",
    "Choose not_city_readiness for a single local business/service search, a narrow weather-only question, a direct fact or history question, a specific event lookup, a regulated medical/legal/financial question, or an unrelated question.",
    "Do not infer identity, profile data, protected traits, immigration status, safety needs, or a hotel. The city name is location context only.",
  ].join("\n");
}

/**
 * A short visit and a prospective move have different practical questions.
 * This uses only words the member supplied in the current turn; it does not
 * infer residency, identity, household, immigration status, or life stage.
 */
export function deriveCityBriefingPurpose(message: string): CityBriefingPurpose {
  if (/\b(?:planning to |going to |want to |may |might |thinking (?:about )?)?(?:move|moving|relocate|relocating)\b|\b(?:live|living|settle|settling) there\b/i.test(message)) {
    return "moving";
  }
  if (/\b(?:visit|visiting|travel|traveling|trip|arriv(?:e|ing)|stay(?:ing)?|heading to|going to)\b/i.test(message)) {
    return "visiting";
  }
  return "general";
}

export function isStableCityBriefingBackgroundRequest(message: string): boolean {
  return STABLE_CITY_BACKGROUND_PATTERN.test(message.trim());
}

/** A city must already be resolved by the existing guarded geography resolver. */
export function isCityBriefingRequest(message: string, destination: string | null): boolean {
  if (!destination) return false;
  const normalized = message.trim();
  if (!normalized || normalized.length > 600) return false;
  if (isStableCityBriefingBackgroundRequest(normalized)) return true;
  const escapedDestination = destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicitlyReferencesPlace = new RegExp(`\\b${escapedDestination}\\b`, "i").test(normalized)
    || /\b(?:this city|the city|there|around town|local(?:ly)?|citywide)\b/i.test(normalized);
  return explicitlyReferencesPlace && CITY_BRIEFING_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function buildCityBriefingPlan(input: {
  message: string;
  city: string;
  stateCode: string | null;
}): SemanticTurnPlan {
  const location = [input.city, input.stateCode].filter(Boolean).join(", ");
  const stableBackground = isStableCityBriefingBackgroundRequest(input.message);
  const purpose = deriveCityBriefingPurpose(input.message);
  const currentQueries = purpose === "moving"
    ? [
        `${location} official resident services housing tenant transit resources current`,
        `${location} official city public notices weather transit current`,
        `${location} official federal immigration enforcement response community practical move`,
      ]
    : purpose === "visiting"
      ? [
          `${location} current visitor travel arrival public safety transit advisories`,
          `${location} official city public notices transit weather current`,
          `${location} official federal immigration enforcement response Black diaspora community practical travel`,
        ]
      : [
          `${location} latest local news public safety travel advisories`,
          `${location} official city public notices transit weather current`,
          `${location} official federal immigration enforcement response Black community practical travel`,
        ];
  return {
    taskMode: "city_briefing",
    primaryDomain: "city_briefing",
    namedEntities: [{ text: input.city, type: "place" }],
    candidateMeanings: [],
    resolvedMeaning: location,
    confidence: 1,
    needsClarification: false,
    clarificationQuestion: null,
    freshness: stableBackground ? "stable" : "current",
    evidenceNeeds: stableBackground
      ? ["reputable_reporting"]
      : ["official_current", "reputable_reporting", "platform_records"],
    retrievalQueries: stableBackground
      ? [
          `${location} official city overview neighborhoods transit`,
          `${location} Black history culture institutions`,
          `${location} visitor guide public transportation`,
        ]
      : currentQueries,
    answerPerspective: "mixed",
    identityContextUsed: [],
  };
}

/**
 * Only explicitly saved, non-sensitive interest labels may shape the optional
 * final section. It must never alter facts, suppress material current events,
 * or infer demographic identity.
 */
export function buildCityBriefingPromptBlock(input: {
  city: string;
  stateCode: string | null;
  preferences: CityBriefingPreferenceInput;
  mode?: "current" | "stable";
  purpose?: CityBriefingPurpose;
}): string {
  const place = [input.city, input.stateCode].filter(Boolean).join(", ");
  const stableBackground = input.mode === "stable";
  const interests = [
    ...cleanList(input.preferences?.favoriteCategories),
    ...cleanList(input.preferences?.culturalInterests),
    ...cleanList(input.preferences?.lifestyleServices),
  ];
  const uniqueInterests = [...new Set(interests.map((item) => item.toLocaleLowerCase()))].slice(0, 8);
  const knowBeforeYouGo = input.preferences?.knowBeforeYouGo !== false;
  const purpose = input.purpose ?? "general";
  const purposeInstruction = purpose === "moving"
    ? "The member said they are planning to move. Distinguish longer-term city-life questions—resident services, housing or tenant resources, transit, civic services, and community orientation—from immediate travel conditions. Do not make housing, legal, or financial decisions for them."
    : purpose === "visiting"
      ? "The member said they are visiting. Prioritize immediate arrival needs: official alerts, weather and transit checks, practical city orientation, and what to verify during the stay. Do not turn this into a relocation plan."
      : "The member did not state whether this is a visit or a move. Give a neutral city overview and ask one concise follow-up only if visit-versus-move would materially change the next answer.";
  const lines = [
    `CITY BRIEFING — ${place}:`,
    "MEMBER VOICE: Speak like a thoughtful, well-connected cousin helping someone get oriented—not like a research report. Lead with what matters in plain language. Do not say source-backed, verified facts, evidence, data, system, or explain the research process. The app shows any available links separately. When a current detail cannot be confirmed, say naturally that you could not confirm a current update and give the next sensible check.",
    "ANSWER QUALITY — A city-arrival question needs a real answer, not travel-brochure filler. Do not say a city is vibrant, has much to offer, has diverse neighborhoods, is known for an arts scene, or make other generic statements that could fit any city. Give 2–4 concrete, useful checks or conditions from the supplied material: weather and packing when current weather is available; transit or airport/road checks when applicable; emergency or city-service updates; and any supported civic or immigration-enforcement context that can affect a visitor or someone they care about. Name uncertainty plainly instead of padding the answer.",
    stableBackground
      ? "Give a stable factual background, not a current-status update. Use clearly labeled sections: City orientation; Civic and practical context; Culture and community; and What to verify closer to travel."
      : "Give a current overview with clear, human section labels: What is happening; Practical heads-up; Culture and community; and What to watch next. A short, natural opening is fine, but put the useful city-specific information immediately after it.",
    stableBackground
      ? "Do not describe a condition as current, active, open, safe, disrupted, or scheduled today. State clearly that current alerts, hours, transit conditions, and events need a fresh check closer to travel."
      : "Start with the material current information. Separate reporting from analysis and never present a rumor, post, or unverified community submission as fact.",
    purposeInstruction,
    "Do not invent local events, crime/safety claims, political positions, statistics, businesses, or community sentiment. If evidence is incomplete, say so plainly.",
    "Do not make a restaurant, nightlife, or business list unless the member separately asks for one. A direct request always overrides any optional interest lens.",
    "The Community perspective is not currently source evidence. Do not claim community-feed findings unless a separately governed, visible Community perspective is supplied by the server.",
    "When a separately governed, public, city-relevant Community perspective is supplied, label it clearly as Community perspective rather than a verified city fact. Do not infer a contributor's nationality, ethnicity, immigration status, or life experience from a name, location, or post; do not generalize an individual post into a whole community's view.",
    "State that a verified alert, travel concern, affected area, event, or event date exists only when the supplied current sources support that specific claim. Never say a member is clear, safe, unaffected, or outside an affected area unless the supplied sources and the member’s actual current plan support it.",
    "Do not imply that a hotel, itinerary, route, planned stop, or travel date is known when the member did not provide it. When a plan or date is needed to assess an alert or an event, say what is not known and ask one concise follow-up.",
    "When the member expressly asks for Black, African, Afro-Latin, or broader diaspora context, use only source-supported cultural events, businesses, and community information. Keep that request separate from an assumption about the member’s identity.",
    "When current official or established reporting identifies a city-level federal immigration-enforcement or public-service response, include it as practical civic context in one calm, clear sentence. Do not infer the member’s immigration status, make an individualized risk prediction, or provide personal legal advice.",
  ];
  if (knowBeforeYouGo) {
    lines.push("Include practical context only when it is supported by the supplied sources, such as public-service changes, civic deadlines, transit disruptions, or confirmed public advisories.");
  }
  if (uniqueInterests.length > 0) {
    lines.push(`The member explicitly saved these optional interests: ${uniqueInterests.join(", ")}. After the general briefing, add at most two clearly labeled optional follow-ups that connect to those interests. These are prompts, not assumptions about identity or needs.`);
  } else {
    lines.push("No optional interest lens is available. End with neutral follow-up questions, such as whether the member wants politics, cultural coverage, family activities, or local business discovery.");
  }
  return lines.join("\n");
}
