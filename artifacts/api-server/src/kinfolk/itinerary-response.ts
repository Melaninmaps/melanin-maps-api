import {
  normalizeExactBusinessName,
  type GovernedKinfolkBusiness,
} from "./governedBusinessRepository";

export type KinfolkItineraryActivity = {
  time: string;
  title: string;
  description: string;
  canonicalVenue?: string | null;
};

export type KinfolkItineraryDay = {
  day: number;
  theme: string;
  activities: KinfolkItineraryActivity[];
  safetyNote?: string | null;
  packingTips?: string[] | null;
};

/** This shape intentionally mirrors the reviewed additive web chat contract. */
export type KinfolkItinerary = {
  days: KinfolkItineraryDay[];
  safetyNote?: string | null;
  packingTips?: string[] | null;
};

export type ParsedKinfolkModelPayload = {
  valid: boolean;
  reply: string;
  value: Record<string, unknown> | null;
};

export const SAFE_MODEL_RESPONSE_FALLBACK =
  "I’m having trouble putting that answer together safely right now. Please try again.";

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
};

const ITINERARY_SIGNAL = /\b(itinerary|day[- ]by[- ]day|trip plan|travel plan|plan (?:me |my |our |a )?(?:trip|visit|getaway|weekend|vacation)|what (?:should|can) (?:i|we) do each day)\b/i;
const FENCED_CONTENT = /^\s*```(?:json)?\s*[\s\S]*```\s*$/i;

export function isTravelPlanningPrompt(message: string): boolean {
  return ITINERARY_SIGNAL.test(message);
}

/** Deterministically returns an itinerary length from 1 through 14. */
export function extractItineraryDayCount(message: string): number {
  const numeric = message.match(/\b(\d{1,2})\s*[- ]?(?:day|days|night|nights)\b/i);
  if (numeric) return Math.min(14, Math.max(1, Number(numeric[1])));

  const words = Object.keys(NUMBER_WORDS).join("|");
  const word = message.match(new RegExp(`\\b(${words})\\s*[- ]?(?:day|days|night|nights)\\b`, "i"));
  if (word) return NUMBER_WORDS[word[1].toLowerCase()] ?? 1;
  if (/\bweekend\b/i.test(message)) return 2;
  return 1;
}

function nonempty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const result = value
    .map(nonempty)
    .filter((item): item is string => item !== null)
    .slice(0, 12);
  return result.length > 0 ? result : null;
}

/**
 * Parse a model envelope strictly. Fenced, malformed, non-object, or reply-less
 * content is never reflected to a member as raw provider text.
 */
export function parseKinfolkModelPayload(rawContent: string): ParsedKinfolkModelPayload {
  if (!rawContent.trim() || FENCED_CONTENT.test(rawContent)) {
    return { valid: false, reply: SAFE_MODEL_RESPONSE_FALLBACK, value: null };
  }
  try {
    const parsed: unknown = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { valid: false, reply: SAFE_MODEL_RESPONSE_FALLBACK, value: null };
    }
    const value = parsed as Record<string, unknown>;
    const reply = nonempty(value.reply);
    if (!reply) return { valid: false, reply: SAFE_MODEL_RESPONSE_FALLBACK, value: null };
    return { valid: true, reply, value };
  } catch {
    return { valid: false, reply: SAFE_MODEL_RESPONSE_FALLBACK, value: null };
  }
}

function resolveCanonicalVenue(
  value: unknown,
  byId: ReadonlyMap<string, GovernedKinfolkBusiness>,
  byName: ReadonlyMap<string, GovernedKinfolkBusiness>,
): string | null {
  let proposedId: string | null = null;
  let proposedName: string | null = null;
  if (typeof value === "string") {
    proposedId = value.trim();
    proposedName = value.trim();
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    proposedId = nonempty(row.businessId) ?? nonempty(row.id);
    proposedName = nonempty(row.name);
  }
  const match = (proposedId ? byId.get(proposedId) : undefined)
    ?? (proposedName ? byName.get(normalizeExactBusinessName(proposedName)) : undefined);
  return match?.name ?? null;
}

function genericActivity(day: number): KinfolkItineraryActivity {
  return {
    time: "Flexible",
    title: day === 1 ? "Get oriented" : "Explore at your own pace",
    description: day === 1
      ? "Start with a relaxed walk in a central public area, note transit options, and leave room to adjust after arrival."
      : "Choose a museum, public market, park, or neighborhood walk that fits your energy and current opening hours.",
  };
}

function normalizeActivities(
  value: unknown,
  day: number,
  catalog: GovernedKinfolkBusiness[],
): KinfolkItineraryActivity[] {
  const byId = new Map(catalog.map((business) => [business.id, business]));
  const byName = new Map(catalog.map((business) => [normalizeExactBusinessName(business.name), business]));
  if (!Array.isArray(value)) return [genericActivity(day)];

  const activities: KinfolkItineraryActivity[] = [];
  for (const candidate of value.slice(0, 8)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const row = candidate as Record<string, unknown>;
    const time = nonempty(row.time);
    const title = nonempty(row.title);
    const description = nonempty(row.description);
    if (!time || !title || !description) continue;
    const proposedVenue = row.canonicalVenue ?? row.venue;
    const canonicalVenue = resolveCanonicalVenue(proposedVenue, byId, byName);
    if (proposedVenue !== null && proposedVenue !== undefined && !canonicalVenue) {
      activities.push(genericActivity(day));
      continue;
    }
    activities.push({
      time,
      title,
      description,
      ...(canonicalVenue ? { canonicalVenue } : {}),
    });
  }
  return activities.length > 0 ? activities : [genericActivity(day)];
}

function normalizeDay(
  value: unknown,
  day: number,
  catalog: GovernedKinfolkBusiness[],
): KinfolkItineraryDay {
  const row = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const safetyNote = nonempty(row.safetyNote);
  const packingTips = stringList(row.packingTips);
  return {
    day,
    theme: nonempty(row.theme) ?? `Day ${day} highlights`,
    activities: normalizeActivities(row.activities, day, catalog),
    ...(safetyNote ? { safetyNote } : {}),
    ...(packingTips ? { packingTips } : {}),
  };
}

/** Normalize model itinerary proposals into the exact reviewed web contract. */
export function normalizeKinfolkItinerary(input: {
  message: string;
  modelValue: Record<string, unknown>;
  catalog: GovernedKinfolkBusiness[];
}): KinfolkItinerary {
  const dayCount = extractItineraryDayCount(input.message);
  const itinerary = input.modelValue.itinerary && typeof input.modelValue.itinerary === "object" && !Array.isArray(input.modelValue.itinerary)
    ? input.modelValue.itinerary as Record<string, unknown>
    : {};
  const proposedDays = Array.isArray(itinerary.days) ? itinerary.days : [];
  const safetyNote = nonempty(itinerary.safetyNote);
  const packingTips = stringList(itinerary.packingTips);
  return {
    days: Array.from({ length: dayCount }, (_, index) =>
      normalizeDay(proposedDays[index], index + 1, input.catalog),
    ),
    ...(safetyNote ? { safetyNote } : {}),
    ...(packingTips ? { packingTips } : {}),
  };
}

export function itineraryPromptInstruction(dayCount: number, destination: string): string {
  return [
    "ITINERARY RESPONSE — SERVER VALIDATED:",
    `Return a natural, non-serialized reply plus an itinerary for exactly ${dayCount} day${dayCount === 1 ? "" : "s"} in ${destination}.`,
    `The itinerary.days array must contain exactly ${dayCount} entries. The server will replace day numbers with 1 through ${dayCount}.`,
    "Itinerary shape: {days:[{day,theme,activities:[{time,title,description,canonicalVenue?}],safetyNote?,packingTips?}],safetyNote?,packingTips?}.",
    "For a generic activity, omit canonicalVenue. To name a venue, canonicalVenue must be an exact catalog business name or its catalog ID; never invent or rename a venue.",
    "Set recommendations:null. Return pure JSON without Markdown fences, and always include a concise conversational reply.",
  ].join("\n");
}
