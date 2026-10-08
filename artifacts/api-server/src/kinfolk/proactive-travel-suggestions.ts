export type ProactiveTravelSuggestionDecision =
  | Readonly<{
      kind: "offer";
      city: string;
      reply: string;
      followUpSuggestions: readonly string[];
    }>
  | Readonly<{
      kind: "decline";
      reply: string;
      followUpSuggestions: readonly [];
    }>
  | Readonly<{ kind: "none" }>;

const TRAVEL_MOMENT_RE = /\b(?:heading\s+to|going\s+to|travel(?:ing|ling)?\s+to|visit(?:ing)?|(?:i(?:['’]m| am)|i(?:['’]ll| will) be)\s+in|what\s+should\s+(?:i|we)\s+do\s+in|things?\s+to\s+do\s+in)\b/i;
const EXPLICIT_ITINERARY_RE = /\b(?:itinerary|day[- ]by[- ]day|trip plan|travel plan|plan (?:me |my |our |a )?(?:trip|visit|getaway|weekend|vacation))\b/i;
const EXPLICIT_PLACE_CATEGORY_RE = /\b(?:food|restaurants?|dining|breakfast|brunch|lunch|dinner|caf[eé]s?|coffee|book[ -]?stores?|bookshops?|booksellers?|entertainment|activities|museums?|galleries|nightlife|bars?|clubs?|lounges?|shops?|businesses?)\b/i;
const CURRENT_EVENT_RE = /\b(?:current|today(?:'s)?|tonight(?:'s)?|this\s+week(?:end)?|next\s+week(?:end)?|upcoming)\s+(?:events?|concerts?|shows?|festivals?)\b|\b(?:events?|concerts?|shows?|festivals?)\s+(?:today|tonight|this\s+week(?:end)?|next\s+week(?:end)?)\b/i;
const DECLINE_RE = /^\s*(?:no\s+suggestions\s+for\s+now|no\s+thanks|not\s+right\s+now)\s*[.!]?\s*$/i;

/**
 * A destination mention is not consent to search or recommend places. This
 * helper offers member-controlled, category-specific next steps before any
 * catalog is read. The selected chip repeats the city in the current turn, so
 * it never needs a private address, saved trip, or hidden travel memory.
 */
export function inspectProactiveTravelSuggestion(input: {
  message: string;
  destination: string | null;
  requiresCurrentEvidence: boolean;
}): ProactiveTravelSuggestionDecision {
  const message = input.message.trim();

  if (DECLINE_RE.test(message)) {
    return {
      kind: "decline",
      reply: "No problem — I’ll keep it general. Tell me what you’d like help with whenever you’re ready.",
      followUpSuggestions: [],
    };
  }

  if (
    !input.destination ||
    input.requiresCurrentEvidence ||
    !TRAVEL_MOMENT_RE.test(message) ||
    EXPLICIT_ITINERARY_RE.test(message) ||
    EXPLICIT_PLACE_CATEGORY_RE.test(message) ||
    CURRENT_EVENT_RE.test(message)
  ) {
    return { kind: "none" };
  }

  const city = input.destination;
  return {
    kind: "offer",
    city,
    reply: `I can help you get oriented in ${city} without assuming what you want to do. Want me to suggest food, bookstores, entertainment, or other eligible places while you’re there?`,
    followUpSuggestions: [
      `Suggest food in ${city}`,
      `Suggest bookstores in ${city}`,
      `Suggest entertainment in ${city}`,
      `Check current events in ${city}`,
      "No suggestions for now",
    ],
  };
}
