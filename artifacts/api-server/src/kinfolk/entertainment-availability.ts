export type EntertainmentMode = "streaming" | "showtimes";
export type EntertainmentAvailabilityStatus =
  | "provider_not_configured"
  | "location_required"
  | "invalid_request";

export type EntertainmentAvailabilityRequest = Readonly<{
  mode: EntertainmentMode;
  title: string;
  countryCode: string | null;
  city: string | null;
}>;

export type EntertainmentAvailabilityResult = Readonly<{
  status: EntertainmentAvailabilityStatus;
  mode: EntertainmentMode;
  title: string;
  countryCode: string | null;
  city: string | null;
  offers: readonly [];
  showtimes: readonly [];
  attribution: null;
  retrievedAt: null;
  message: string;
}>;

const CURRENT_AVAILABILITY = /\b(where\s+(?:can|do)\s+i\s+watch|where\s+is\s+.+?\s+(?:streaming|playing)|is\s+.+?\s+on\s+(?:netflix|hulu|prime|max|disney\+?)|stream(?:ing)?\s+(?:on|options)|rent|buy|showtimes?|theat(?:er|re)|cinema)\b/i;
const SHOWTIMES = /\b(showtimes?|theat(?:er|re)s?|cinemas?|playing\s+near\s+me)\b/i;
const ENTERTAINMENT_PREFERENCE = /\b(?:i\s+(?:have|subscribe\s+to)|my\s+(?:streaming\s+)?services?\s+(?:are|include)|my\s+favorite\s+(?:movie|film|show|series|genre|artist|book|game)\s+is)\b/i;

function cleanText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 && cleaned.length <= maximum ? cleaned : null;
}

export function normalizeEntertainmentCountry(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value.trim())
    ? value.trim().toUpperCase()
    : null;
}

/**
 * Detects a member's explicit request for current availability. This does not
 * classify a general film, music, book, sport, or culture conversation as a
 * live-data request, and it never asks a model to invent a title.
 */
export function parseEntertainmentAvailabilityRequest(input: {
  message: unknown;
  title?: unknown;
  countryCode?: unknown;
  city?: unknown;
}): EntertainmentAvailabilityRequest | null {
  const message = cleanText(input.message, 1_200);
  if (!message || !CURRENT_AVAILABILITY.test(message)) return null;
  const inferredTitle =
    message.match(/\bwhere\s+(?:can|do)\s+i\s+watch\s+(.+?)(?:\?|$)/i)?.[1] ??
    message.match(
      /\bis\s+(.+?)\s+on\s+(?:netflix|hulu|prime|max|disney\+?|peacock|paramount\+?)(?:\?|$)/i,
    )?.[1] ??
    message.match(/\bshowtimes?\s+(?:for|of)\s+(.+?)(?:\?|$)/i)?.[1];
  const title =
    cleanText(input.title, 180) ??
    cleanText(message.match(/["“]([^"”]{2,180})["”]/)?.[1], 180) ??
    cleanText(inferredTitle, 180);
  if (!title) return null;
  return {
    mode: SHOWTIMES.test(message) ? "showtimes" : "streaming",
    title,
    countryCode: normalizeEntertainmentCountry(input.countryCode),
    city: cleanText(input.city, 120),
  };
}

/**
 * The source candidate intentionally makes no remote request. Current offers
 * and showtimes must originate in a separately authorized, attributed provider
 * response; model memory, static metadata, and scraper output are prohibited.
 */
export async function resolveEntertainmentAvailability(
  request: EntertainmentAvailabilityRequest,
): Promise<EntertainmentAvailabilityResult> {
  if (request.mode === "showtimes" && !request.city) {
    return {
      status: "location_required",
      ...request,
      offers: [],
      showtimes: [],
      attribution: null,
      retrievedAt: null,
      message:
        "Choose a city or allow a request-scoped location before Kinfolk can look for showtimes. Kinfolk does not collect background location.",
    };
  }
  if (!request.countryCode) {
    return {
      status: "location_required",
      ...request,
      offers: [],
      showtimes: [],
      attribution: null,
      retrievedAt: null,
      message:
        "Choose a country before Kinfolk can check availability. Availability differs by country, and Kinfolk will not guess.",
    };
  }
  return {
    status: "provider_not_configured",
    ...request,
    offers: [],
    showtimes: [],
    attribution: null,
    retrievedAt: null,
    message:
      "Live entertainment availability is not connected yet. Kinfolk can discuss this title, but will not guess streaming services, rentals, purchases, theatres, prices, or showtimes.",
  };
}

export function isCurrentEntertainmentAvailabilityQuestion(value: unknown): boolean {
  return typeof value === "string" && CURRENT_AVAILABILITY.test(value);
}

/** Ordinary chat never writes this preference; it only earns a consent prompt. */
export function isEntertainmentPreferenceStatement(value: unknown): boolean {
  return typeof value === "string" && ENTERTAINMENT_PREFERENCE.test(value);
}
