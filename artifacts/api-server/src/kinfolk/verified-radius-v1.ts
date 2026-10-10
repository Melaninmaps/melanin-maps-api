import { createHash } from "node:crypto";

/**
 * Exact-distance discovery is intentionally separate from ordinary city search.
 * It accepts only a member-supplied public starting point for the current turn,
 * geocodes it transiently, and never writes the text, coordinates, or result to
 * Kinfolk memory, analytics, or a session record.
 */
export function isVerifiedRadiusV1Enabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.KINFOLK_VERIFIED_RADIUS_V1_ENABLED === "true";
}

export type VerifiedRadiusOrigin = Readonly<{
  latitude: number;
  longitude: number;
  radiusMiles: number;
  resolvedCity: string;
  resolvedStateCode: string;
}>;

type GeocoderResponse = Readonly<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

type GeocoderFetch = (input: string, init?: RequestInit) => Promise<GeocoderResponse>;

type OriginCacheEntry = Readonly<{
  expiresAtMs: number;
  origin: Omit<VerifiedRadiusOrigin, "radiusMiles">;
}>;

const ORIGIN_CACHE_TTL_MS = 10 * 60_000;
const ORIGIN_CACHE_LIMIT = 150;
const NOMINATIM_MIN_INTERVAL_MS = 1_100;
const originCache = new Map<string, OriginCacheEntry>();
let nextNominatimRequestAtMs = 0;

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function originCacheKey(value: string): string {
  // The current public-origin text is not retained as the cache key.
  return createHash("sha256").update(normalized(value)).digest("hex");
}

function boundedPublicOrigin(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 3 || trimmed.length > 220) return null;
  return trimmed;
}

/**
 * Finds an explicitly named public lodging, venue, transit, or landmark origin
 * in the current request. This is deliberately narrow: a city by itself, a
 * private address, or an ambiguous "my place" never becomes an exact-radius
 * origin. The caller uses the returned public origin only for one response and redacts it before any
 * conversation persistence.
 */
export function extractCurrentTurnPublicOrigin(message: unknown): string | null {
  if (typeof message !== "string") return null;
  const patterns = [
    /\b(?:within|under|inside|less than|no more than|up to)\s+\d{1,3}\s*(?:mi|miles?)\s+(?:of|from)\s+(?<origin>[^,.!?;]{3,160}?)(?=\s*(?:,|\.|!|\?|;|\b(?:in|for|and|but|so|with)\b|$))/i,
    /\b(?:i(?:'m| am)|we(?:'re| are))?\s*(?:staying|stay|booked)\s+(?:at\s+)?(?<origin>[^,.!?;]{3,160}?)(?=\s*(?:,|\.|!|\?|;|\b(?:in|for|and|but|so|with|within)\b|$))/i,
    /\b(?:my|our)\s+(?:hotel|venue|station|landmark)\s+(?:is|will be)\s+(?<origin>[^,.!?;]{3,160}?)(?=\s*(?:,|\.|!|\?|;|\b(?:in|for|and|but|so|with|within)\b|$))/i,
  ];
  const match = patterns
    .map((pattern) => pattern.exec(message)?.groups?.origin)
    .find((candidate): candidate is string => Boolean(candidate));
  const candidate = boundedPublicOrigin(match);
  if (!candidate) return null;
  const normalizedCandidate = normalized(candidate.replace(/^the\s+/i, ""));
  const hasPublicOriginSignal = /\b(?:hotel|inn|suites|resort|sonesta|marriott|hilton|hyatt|sheraton|westin|radisson|loews|doubletree|holiday\s+inn|motel|hostel|station|venue|landmark|monument|memorial|museum|park|stadium|arena|convention\s+cent(?:er|re))\b/i.test(candidate);
  if (!hasPublicOriginSignal || /^(?:my|our|a|an|the)?\s*(?:hotel|place|home|house|address)$/i.test(normalizedCandidate)) {
    return null;
  }
  return candidate;
}

/** Replaces only the supplied public-origin substring for persisted chat text. */
export function redactCurrentTurnPublicOrigin(message: string, publicOrigin: string | null): string {
  if (!publicOrigin) return message;
  const originStart = message.toLocaleLowerCase("en-US").indexOf(publicOrigin.toLocaleLowerCase("en-US"));
  if (originStart < 0) return message;
  const redaction = /\b(?:hotel|inn|suites|resort|sonesta|marriott|hilton|hyatt|sheraton|westin|radisson|loews|doubletree|holiday\s+inn|motel|hostel)\b/i.test(publicOrigin)
    ? "your hotel"
    : "your public origin";
  return `${message.slice(0, originStart)}${redaction}${message.slice(originStart + publicOrigin.length)}`;
}

export function requestedRadiusMiles(message: string): number | null {
  const match = message.match(
    /\b(?:within|under|inside|less than|no more than|up to)\s+(\d{1,3})\s*(?:mi|miles?)\b|\b(\d{1,3})[ -]?mile\s+radius\b/i,
  );
  const value = Number(match?.[1] ?? match?.[2]);
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : null;
}

function rowText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readOriginResult(row: unknown): Omit<VerifiedRadiusOrigin, "radiusMiles"> | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const latitude = Number(record.lat);
  const longitude = Number(record.lon);
  const address = record.address && typeof record.address === "object"
    ? record.address as Record<string, unknown>
    : null;
  const city = address
    ? [address.city, address.town, address.village, address.municipality]
      .map(rowText)
      .find((value): value is string => Boolean(value))
    : null;
  const stateCode = address
    ? Object.entries(address)
      .find(([key]) => key.toLowerCase().startsWith("iso3166-2"))?.[1]
    : null;
  const normalizedStateCode = rowText(stateCode)
    ?.replace(/^[A-Z]{2}-/i, "")
    .toUpperCase() ?? null;
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    (latitude === 0 && longitude === 0) || !city || !normalizedStateCode
  ) return null;
  return { latitude, longitude, resolvedCity: city, resolvedStateCode: normalizedStateCode };
}

async function waitForNominatimSlot(now: () => number): Promise<void> {
  const waitMs = Math.max(0, nextNominatimRequestAtMs - now());
  nextNominatimRequestAtMs = Math.max(nextNominatimRequestAtMs, now()) + NOMINATIM_MIN_INTERVAL_MS;
  if (waitMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
}

/**
 * Resolves an explicitly supplied public origin for a single exact-radius turn.
 * The matching city/state is validated against the directory scope so a similarly
 * named location in another city cannot quietly drive the radius result.
 */
export async function resolveVerifiedPublicOrigin(input: Readonly<{
  publicOrigin: unknown;
  city: string;
  stateCode: string;
  radiusMiles: number;
  fetchImpl?: GeocoderFetch;
  now?: () => number;
}>): Promise<VerifiedRadiusOrigin | null> {
  const publicOrigin = boundedPublicOrigin(input.publicOrigin);
  if (!publicOrigin || !Number.isFinite(input.radiusMiles) || input.radiusMiles <= 0 || input.radiusMiles > 100) {
    return null;
  }
  const now = input.now ?? Date.now;
  const cacheKey = originCacheKey(publicOrigin);
  const cached = originCache.get(cacheKey);
  const candidate = cached && cached.expiresAtMs > now() ? cached.origin : null;
  const expectedCity = normalized(input.city);
  const expectedState = input.stateCode.trim().toUpperCase();
  const cityAndStateMatch = (value: Omit<VerifiedRadiusOrigin, "radiusMiles">) =>
    normalized(value.resolvedCity) === expectedCity && value.resolvedStateCode === expectedState;

  if (candidate && cityAndStateMatch(candidate)) {
    return { ...candidate, radiusMiles: input.radiusMiles };
  }
  const fetchImpl = input.fetchImpl ?? (globalThis.fetch as unknown as GeocoderFetch);
  const params = new URLSearchParams({
    q: publicOrigin,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
  });
  try {
    await waitForNominatimSlot(now);
    const response = await fetchImpl(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "MappingWithMelanin-VerifiedRadius/1.0 (https://mappingwithmelanin.com)",
        },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const resolved = Array.isArray(payload) ? readOriginResult(payload[0]) : null;
    if (!resolved || !cityAndStateMatch(resolved)) return null;
    if (originCache.size >= ORIGIN_CACHE_LIMIT && !originCache.has(cacheKey)) {
      const oldest = originCache.keys().next().value;
      if (typeof oldest === "string") originCache.delete(oldest);
    }
    originCache.set(cacheKey, { expiresAtMs: now() + ORIGIN_CACHE_TTL_MS, origin: resolved });
    return { ...resolved, radiusMiles: input.radiusMiles };
  } catch {
    return null;
  }
}

export function clearVerifiedRadiusOriginCacheForTest(): void {
  originCache.clear();
  nextNominatimRequestAtMs = 0;
}

export const VERIFIED_RADIUS_ORIGIN_REQUIRED_REPLY =
  "I can apply the requested exact radius when you enter a geocodable public starting point—such as a hotel, landmark, venue, or transit station—in the Exact-radius origin field. I will use it only for this response, not save it to your Kinfolk memory, and show only listings with verified coordinates inside the requested straight-line distance.";
