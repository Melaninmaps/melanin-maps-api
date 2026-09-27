import type { SemanticTurnPlan } from "./semantic-turn-planner";

/**
 * City briefings are deliberately distinct from restaurant searches and travel
 * itineraries. They are current-affairs overviews for a resolved place, with a
 * factual public-information core and only an optional, explicit-interest lens.
 */
const CITY_BRIEFING_PATTERNS = [
  /\bwhat(?:'s| is) (?:going on|happening|trending)\b/i,
  /\bwhat should i know\b/i,
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
      : [
          `${location} latest local news public safety travel advisories`,
          `${location} official city public notices transit weather current`,
          `${location} Black community culture current local reporting`,
        ],
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
  const lines = [
    `CITY BRIEFING — ${place}:`,
    stableBackground
      ? "Give a stable factual background, not a current-status update. Use clearly labeled sections: City orientation; Civic and practical context; Culture and community; and What to verify closer to travel."
      : "Give a current, source-cited overview with clearly labeled sections: What is happening in current news and reporting; Civic and practical updates; Culture and community; and What to watch next.",
    stableBackground
      ? "Do not describe a condition as current, active, open, safe, disrupted, or scheduled today. State clearly that current alerts, hours, transit conditions, and events need a fresh check closer to travel."
      : "Start with material verified facts. Separate reporting from analysis and never present a rumor, post, or unverified community submission as fact.",
    "Do not invent local events, crime/safety claims, political positions, statistics, businesses, or community sentiment. If evidence is incomplete, say so plainly.",
    "Do not make a restaurant, nightlife, or business list unless the member separately asks for one. A direct request always overrides any optional interest lens.",
    "The Community perspective is not currently source evidence. Do not claim community-feed findings unless a separately governed, visible Community perspective is supplied by the server.",
    "State that a verified alert, travel concern, affected area, event, or event date exists only when the supplied current sources support that specific claim. Never say a member is clear, safe, unaffected, or outside an affected area unless the supplied sources and the member’s actual current plan support it.",
    "Do not imply that a hotel, itinerary, route, planned stop, or travel date is known when the member did not provide it. When a plan or date is needed to assess an alert or an event, say what is not known and ask one concise follow-up.",
    "When the member expressly asks for Black, African, Afro-Latin, or broader diaspora context, use only source-supported cultural events, businesses, and community information. Keep that request separate from an assumption about the member’s identity.",
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
