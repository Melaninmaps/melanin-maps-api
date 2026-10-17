import {
  extractStreamingServices,
  isIncludedWithoutExtraCost,
  normalizeStreamingService,
  type EntertainmentCostPolicy,
} from "./entertainment-personalization";

export type EntertainmentMode = "streaming" | "showtimes" | "event";
export type EntertainmentAvailabilityStatus =
  | "provider_not_configured"
  | "location_required"
  | "title_required"
  | "needs_subscription_preference"
  | "invalid_request"
  | "available"
  | "web_availability_verified"
  | "web_results_available"
  | "web_search_unavailable"
  | "unavailable"
  | "provider_error";
export type EntertainmentMonetizationType =
  | "flatrate"
  | "free"
  | "ads"
  | "rent"
  | "buy";

export type EntertainmentAvailabilityRequest = Readonly<{
  mode: EntertainmentMode;
  title: string | null;
  countryCode: string | null;
  city: string | null;
  requestedDate: string | null;
}>;

export type EntertainmentOffer = Readonly<{
  providerId: string;
  providerName: string;
  monetizationType: EntertainmentMonetizationType;
  url: string;
  price?: number;
  currency?: string;
}>;

export type EntertainmentShowtime = Readonly<{
  cinemaId: string;
  cinemaName: string;
  startsAt: string;
  format: string | null;
  ticketUrl: string;
}>;

export type EntertainmentAttribution = Readonly<{ label: string; url: string }>;
export type EntertainmentProviderResponse = Readonly<{
  status: "available" | "unavailable" | "provider_error";
  provider: string;
  attribution: EntertainmentAttribution | null;
  retrievedAt: string;
  offers: readonly EntertainmentOffer[];
  showtimes: readonly EntertainmentShowtime[];
}>;

export interface EntertainmentAvailabilityProvider {
  readonly id: string;
  resolve(
    request: EntertainmentAvailabilityRequest,
  ): Promise<EntertainmentProviderResponse>;
}

export type EntertainmentMemberPreferences = Readonly<{
  streamingServices: readonly string[];
  entertainmentCostPolicy: EntertainmentCostPolicy;
}>;

export type EntertainmentAvailabilityResult = Readonly<{
  status: EntertainmentAvailabilityStatus;
  mode: EntertainmentMode;
  title: string | null;
  countryCode: string | null;
  city: string | null;
  requestedDate: string | null;
  offers: readonly EntertainmentOffer[];
  showtimes: readonly EntertainmentShowtime[];
  attribution: EntertainmentAttribution | null;
  retrievedAt: string | null;
  message: string;
}>;

const CURRENT_AVAILABILITY =
  /\b(where\s+(?:can|do)\s+i\s+(?:watch|see)|where\s+is\s+.+?\s+(?:streaming|playing)|is\s+.+?\s+on\s+(?:netflix|hulu|prime|max|disney\+?)|stream(?:ing)?\s+(?:on|options)|rent|buy|showtimes?|theat(?:er|re)|cinema|playing\s+near\s+me|showing\s+tonight|tickets?\s+(?:for|to)|(?:concert|live\s+event|tour)\s+(?:dates?|tickets?|near\s+me))\b/i;
const SHOWTIMES =
  /\b(showtimes?|theat(?:er|re)s?|cinemas?|playing\s+near\s+me|showing\s+tonight|in\s+theaters?)\b/i;
const LIVE_EVENT =
  /\b(?:concert|live\s+event|tour|tickets?\s+(?:for|to)|where\s+can\s+i\s+see)\b/i;

function cleanText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 && cleaned.length <= maximum ? cleaned : null;
}

function specificEntertainmentTitle(value: string | null): string | null {
  if (!value) return null;
  // Generic references cannot identify a source query. This avoids both an
  // ungrounded query and any implicit use of previous conversation context.
  if (
    /^(?:this|that|the|a)?\s*(?:movie|film|show|series|event|concert|tour|one|it)$/i.test(
      value,
    )
  ) {
    return null;
  }
  return value;
}

export function normalizeEntertainmentCountry(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" && /^[A-Za-z]{2}$/.test(value.trim())
    ? value.trim().toUpperCase()
    : null;
}

function inferredTitle(message: string): string | null {
  return cleanText(
    message.match(/\bwhere\s+(?:can|do)\s+i\s+watch\s+(.+?)(?:\?|$)/i)?.[1] ??
      message.match(
        /\bis\s+(.+?)\s+on\s+(?:netflix|hulu|prime|max|disney\+?|peacock|paramount\+?)(?:\?|$)/i,
      )?.[1] ??
      message.match(/\bshowtimes?\s+(?:for|of)\s+(.+?)(?:\?|$)/i)?.[1] ??
      message.match(
        /\b(?:tickets?\s+for|where\s+can\s+i\s+see)\s+(.+?)(?:\?|$)/i,
      )?.[1],
    180,
  );
}

export type EntertainmentConversationMessage = Readonly<{
  role: "user" | "assistant";
  content: string;
}>;

function quotedEntertainmentTitle(message: string): string | null {
  return specificEntertainmentTitle(
    cleanText(message.match(/["“]([^"”]{2,180})["”]/)?.[1], 180),
  );
}

function mentionedEntertainmentTitle(message: string): string | null {
  const direct = parseEntertainmentAvailabilityRequest({ message })?.title;
  if (direct) return direct;
  const quoted = quotedEntertainmentTitle(message);
  if (quoted) return quoted;
  const watched = message.match(
    /\b(?:watching|watched|watch|about)\s+(?:the\s+)?([A-Z][A-Za-z0-9'’:-]*(?:\s+[A-Z][A-Za-z0-9'’:-]*){1,5})\b/,
  )?.[1];
  return specificEntertainmentTitle(cleanText(watched, 180));
}

/**
 * Resolves “it” only from the current private session and only if exactly one
 * explicit or prior availability title is present. It never reaches into a
 * member's other sessions or long-term memory.
 */
export function resolveUnambiguousEntertainmentFollowUpTitle(input: {
  message: string;
  sessionMessages: readonly EntertainmentConversationMessage[];
}): string | null {
  if (!/\b(?:it|that|this)\b/i.test(input.message)) return null;
  const candidates = new Map<string, string>();
  for (const turn of input.sessionMessages.slice(-12)) {
    const title = mentionedEntertainmentTitle(turn.content);
    if (title) candidates.set(normalizedTitle(title), title);
  }
  return candidates.size === 1 ? [...candidates.values()][0] : null;
}

function normalizedTitle(value: string): string {
  return value
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Only explicit current-data questions enter this path. A title-less theatre
 * discovery question remains valid so Kinfolk can request the city/title rather
 * than letting a model invent a cinema, showtime, or local result.
 */
export function parseEntertainmentAvailabilityRequest(input: {
  message: unknown;
  title?: unknown;
  countryCode?: unknown;
  city?: unknown;
  requestedDate?: unknown;
}): EntertainmentAvailabilityRequest | null {
  const message = cleanText(input.message, 1_200);
  if (!message || !CURRENT_AVAILABILITY.test(message)) return null;
  const mode: EntertainmentMode = SHOWTIMES.test(message)
    ? "showtimes"
    : LIVE_EVENT.test(message)
      ? "event"
      : "streaming";
  const title = specificEntertainmentTitle(
    cleanText(input.title, 180) ??
      cleanText(message.match(/["“]([^"”]{2,180})["”]/)?.[1], 180) ??
      inferredTitle(message),
  );
  return {
    mode,
    title,
    countryCode: normalizeEntertainmentCountry(input.countryCode),
    city: cleanText(input.city, 120),
    requestedDate: cleanText(input.requestedDate, 40),
  };
}

export function isSafeEntertainmentDestination(
  value: unknown,
): value is string {
  if (typeof value !== "string" || value.length > 2_048) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.hostname.endsWith(".local") &&
      url.hostname !== "localhost"
    );
  } catch {
    return false;
  }
}

function safeProviderResponse(
  response: EntertainmentProviderResponse,
): EntertainmentProviderResponse {
  const offers = response.offers.filter(
    (offer) =>
      isSafeEntertainmentDestination(offer.url) &&
      typeof offer.providerId === "string" &&
      typeof offer.providerName === "string",
  );
  const showtimes = response.showtimes.filter(
    (showtime) =>
      isSafeEntertainmentDestination(showtime.ticketUrl) &&
      !Number.isNaN(Date.parse(showtime.startsAt)) &&
      Boolean(showtime.cinemaId.trim()) &&
      Boolean(showtime.cinemaName.trim()),
  );
  const attribution =
    response.attribution &&
    isSafeEntertainmentDestination(response.attribution.url)
      ? response.attribution
      : null;
  return { ...response, offers, showtimes, attribution };
}

export function filterEntertainmentOffers(
  offers: readonly EntertainmentOffer[],
  preferences: EntertainmentMemberPreferences,
): EntertainmentOffer[] {
  const saved = new Set(
    preferences.streamingServices
      .map(normalizeStreamingService)
      .filter((service): service is string => Boolean(service)),
  );
  return offers.filter((offer) => {
    if (preferences.entertainmentCostPolicy !== "included_only") return true;
    if (!isIncludedWithoutExtraCost(offer.monetizationType)) return false;
    return (
      saved.size === 0 ||
      saved.has(normalizeStreamingService(offer.providerName) ?? "")
    );
  });
}

export function createOfflineEntertainmentProvider(
  response: EntertainmentProviderResponse,
): EntertainmentAvailabilityProvider {
  return {
    id: "offline_fixture",
    async resolve() {
      return response;
    },
  };
}

const disabledProvider: EntertainmentAvailabilityProvider = {
  id: "disabled",
  async resolve() {
    return {
      status: "provider_error",
      provider: "disabled",
      attribution: null,
      retrievedAt: new Date(0).toISOString(),
      offers: [],
      showtimes: [],
    };
  },
};

/**
 * The default resolver never uses the network. A live provider is injected only
 * after a separate contract, key, and non-production authorization.
 */
export async function resolveEntertainmentAvailability(
  request: EntertainmentAvailabilityRequest,
  preferences: EntertainmentMemberPreferences = {
    streamingServices: [],
    entertainmentCostPolicy: "any",
  },
  provider: EntertainmentAvailabilityProvider | null = null,
): Promise<EntertainmentAvailabilityResult> {
  const base = {
    ...request,
    offers: [],
    showtimes: [],
    attribution: null,
    retrievedAt: null,
  } as const;
  if (!request.countryCode) {
    return {
      status: "location_required",
      ...base,
      message:
        "Choose a country before Kinfolk can check availability. Availability differs by country, and Kinfolk will not guess.",
    };
  }
  if (
    (request.mode === "showtimes" || request.mode === "event") &&
    !request.city
  ) {
    return {
      status: "location_required",
      ...base,
      message:
        "Choose a city or allow a request-scoped location before Kinfolk can look for current showtimes or event availability. Kinfolk does not collect background location.",
    };
  }
  if (!request.title) {
    return {
      status: "title_required",
      ...base,
      message:
        "Tell Kinfolk the exact title before it can check current availability. Kinfolk will not guess what “this movie,” “that show,” or an unnamed event means.",
    };
  }
  if (
    preferences.entertainmentCostPolicy === "included_only" &&
    preferences.streamingServices.length === 0 &&
    request.mode === "streaming"
  ) {
    return {
      status: "needs_subscription_preference",
      ...base,
      message:
        "Choose at least one streaming service before asking Kinfolk to limit options to titles included with your subscriptions.",
    };
  }
  if (!provider) {
    return {
      status: "provider_not_configured",
      ...base,
      message:
        "Live entertainment availability is not connected yet. Kinfolk can discuss this title, but will not guess streaming services, rentals, purchases, theatres, prices, or showtimes.",
    };
  }
  try {
    const response = safeProviderResponse(await provider.resolve(request));
    if (response.status === "provider_error") {
      return {
        status: "provider_error",
        ...base,
        message:
          "Kinfolk could not verify current entertainment availability right now. It will not guess.",
      };
    }
    if (response.status === "unavailable") {
      return {
        status: "unavailable",
        ...base,
        message:
          "No verified result is available for that title and location right now.",
        attribution: response.attribution,
        retrievedAt: response.retrievedAt,
      };
    }
    const offers = filterEntertainmentOffers(response.offers, preferences);
    return {
      status: "available",
      ...request,
      offers,
      showtimes: response.showtimes,
      attribution: response.attribution,
      retrievedAt: response.retrievedAt,
      message:
        offers.length || response.showtimes.length
          ? "Verified provider data is available."
          : preferences.entertainmentCostPolicy === "included_only"
            ? "No verified option matches your saved services without an extra rental or purchase."
            : "No verified current option is available.",
    };
  } catch {
    return {
      status: "provider_error",
      ...base,
      message:
        "Kinfolk could not verify current entertainment availability right now. It will not guess.",
    };
  }
}

export function isCurrentEntertainmentAvailabilityQuestion(
  value: unknown,
): boolean {
  return typeof value === "string" && CURRENT_AVAILABILITY.test(value);
}

/** Generic settings question fallback when no specific service operation was recognized. */
export function isEntertainmentPreferenceStatement(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (extractStreamingServices(value).length > 0 ||
      /\b(?:streaming\s+(?:services?|subscriptions?)|my\s+(?:services?|subscriptions?)|entertainment\s+preferences?)\b/i.test(
        value,
      ))
  );
}
