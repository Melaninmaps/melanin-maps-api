/**
 * An itinerary is an active planning action, not an inference from a destination
 * mentioned in ordinary conversation. Keep this policy deliberately narrower
 * than travel-topic detection so future, hypothetical, or contextual place
 * mentions never load a directory itinerary.
 */
export function isExplicitCurrentItineraryRequest(message: string): boolean {
  const normalized = message
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return false;

  const asksForItinerary = /\b(?:itinerary|day[- ]by[- ]day|weekend plan|trip plan)\b/.test(normalized);
  const activePlanningVerb = /\b(?:build|make|create|plan|put together|help me plan|show me)\b/.test(normalized);
  const currentTiming = /\b(?:now|today|tonight|tomorrow|this weekend|this (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/.test(normalized);
  const statedPlace = /\b(?:in|near|around|at|to|for)\s+(?!the\b|a\b|an\b|my\b|me\b|this\b|that\b)[a-z]+(?:[\s,-]+[a-z]+){0,3}\b/.test(normalized)
    || /\b\d{5}(?:-\d{4})?\b/.test(normalized)
    || /\b(?:near me|my current location)\b/.test(normalized);
  const requestedActivity = asksForItinerary
    || /\b(?:trip|visit|day|weekend|dinner|brunch|breakfast|lunch|drinks|concert|show|museum|restaurant|coffee|bar|outing|things to do|activity)\b/.test(normalized);

  // "Plan my Atlanta itinerary" and "show me a weekend plan for Detroit"
  // are direct current requests. A bare "I plan to go" or "when I visit"
  // is deliberately not enough to activate the governed directory.
  return activePlanningVerb && requestedActivity && currentTiming && statedPlace;
}
