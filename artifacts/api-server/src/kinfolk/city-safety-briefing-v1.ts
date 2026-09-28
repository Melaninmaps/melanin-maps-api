import type { QueryPool } from "./governedBusinessRepository";

/**
 * Current city safety evidence is intentionally separate from the business
 * directory. This module has no access to listings, member memory, prompts, or
 * community reports. A malformed or absent value preserves the existing reply.
 */
export function isCitySafetyBriefingV1Enabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.CITY_SAFETY_BRIEFING_V1 === "true";
}

/**
 * Keep a city-level safety or transit question out of the directory and model
 * recommendation paths. This detects the member's explicit current-turn
 * request only; it does not infer a risk profile, a route, or a neighborhood.
 */
export function requestsCurrentCitySafetyBriefing(message: string): boolean {
  const asksForSafety = /\b(?:safety|safe(?:ty)?|unsafe|crime|danger|emergency|travel advis(?:ory|ories)|weather alert)\b/i.test(message);
  const asksForTransit = /\b(?:transit|public transport(?:ation)?|rider alerts?|service alerts?|service disruption|detours?|subway|metro|septa|bus(?:es)?|train(?:s)?)\b/i.test(message);
  const currentOrTravelContext = /\b(?:current|today|right now|before (?:i|we) go|travel(?:ing)?|trip|visit(?:ing)?|heading to|going to)\b/i.test(message);
  return asksForSafety || (asksForTransit && currentOrTravelContext);
}

export type CitySafetyTopic =
  | "official_alert"
  | "transit"
  | "weather"
  | "road"
  | "event_advisory";

export type CitySafetyPublisherClass =
  | "official_city"
  | "official_transit"
  | "official_weather"
  | "official_emergency";

export type CitySafetyCityId = string;

type SafetySourceNormalizer = "nws_alerts" | "oem_activation" | "none";

export type CitySafetySourceRecord = Readonly<{
  id: string;
  cityId: CitySafetyCityId;
  topic: CitySafetyTopic;
  displayName: string;
  url: string;
  publisherClass: CitySafetyPublisherClass;
  freshnessMinutes: number;
  enabled: boolean;
  normalizer: SafetySourceNormalizer;
}>;


/**
 * Representative city centers support only the official weather-source point
 * selection below. They are reviewed static geography, never member location,
 * device coordinates, a routing origin, or an ownership/identity signal.
 */
export const CITY_SAFETY_CITY_CENTERS = [
  { cityId: "toronto-on", city: "Toronto", stateCode: "ON", countryCode: "CA", latitude: 43.6534817, longitude: -79.3839347 },
  { cityId: "philadelphia-pa", city: "Philadelphia", stateCode: "PA", countryCode: "US", latitude: 39.9527237, longitude: -75.1635262 },
  { cityId: "allentown-pa", city: "Allentown", stateCode: "PA", countryCode: "US", latitude: 40.6022552, longitude: -75.4716115 },
  { cityId: "doylestown-pa", city: "Doylestown", stateCode: "PA", countryCode: "US", latitude: 40.3100446, longitude: -75.1304588 },
  { cityId: "new-york-ny", city: "New York", stateCode: "NY", countryCode: "US", latitude: 40.7127281, longitude: -74.0060152 },
  { cityId: "washington-dc", city: "Washington", stateCode: "DC", countryCode: "US", latitude: 38.8950982, longitude: -77.0363849 },
  { cityId: "los-angeles-ca", city: "Los Angeles", stateCode: "CA", countryCode: "US", latitude: 34.0536909, longitude: -118.242766 },
  { cityId: "chicago-il", city: "Chicago", stateCode: "IL", countryCode: "US", latitude: 41.8755616, longitude: -87.6244212 },
  { cityId: "houston-tx", city: "Houston", stateCode: "TX", countryCode: "US", latitude: 29.7589382, longitude: -95.3676974 },
  { cityId: "new-orleans-la", city: "New Orleans", stateCode: "LA", countryCode: "US", latitude: 29.9561422, longitude: -90.0733934 },
  { cityId: "baltimore-md", city: "Baltimore", stateCode: "MD", countryCode: "US", latitude: 39.2908816, longitude: -76.610759 },
  { cityId: "detroit-mi", city: "Detroit", stateCode: "MI", countryCode: "US", latitude: 42.3315509, longitude: -83.0466403 },
  { cityId: "oakland-ca", city: "Oakland", stateCode: "CA", countryCode: "US", latitude: 37.8044557, longitude: -122.271356 },
  { cityId: "nashville-tn", city: "Nashville", stateCode: "TN", countryCode: "US", latitude: 36.1622767, longitude: -86.7742984 },
  { cityId: "memphis-tn", city: "Memphis", stateCode: "TN", countryCode: "US", latitude: 35.146026, longitude: -90.0517786 },
  { cityId: "jackson-ms", city: "Jackson", stateCode: "MS", countryCode: "US", latitude: 32.2998686, longitude: -90.1830408 },
  { cityId: "richmond-va", city: "Richmond", stateCode: "VA", countryCode: "US", latitude: 37.5385087, longitude: -77.43428 },
  { cityId: "charlotte-nc", city: "Charlotte", stateCode: "NC", countryCode: "US", latitude: 35.2272086, longitude: -80.8430827 },
  { cityId: "birmingham-al", city: "Birmingham", stateCode: "AL", countryCode: "US", latitude: 33.5206824, longitude: -86.8024326 },
  { cityId: "atlanta-ga", city: "Atlanta", stateCode: "GA", countryCode: "US", latitude: 33.7544657, longitude: -84.3898151 },
  { cityId: "miami-fl", city: "Miami", stateCode: "FL", countryCode: "US", latitude: 25.7741566, longitude: -80.1935973 },
  { cityId: "dallas-tx", city: "Dallas", stateCode: "TX", countryCode: "US", latitude: 32.7762719, longitude: -96.7968559 },
  { cityId: "san-antonio-tx", city: "San Antonio", stateCode: "TX", countryCode: "US", latitude: 29.4246002, longitude: -98.4951405 },
  { cityId: "denver-co", city: "Denver", stateCode: "CO", countryCode: "US", latitude: 39.7392364, longitude: -104.984862 },
  { cityId: "seattle-wa", city: "Seattle", stateCode: "WA", countryCode: "US", latitude: 47.6038321, longitude: -122.330062 },
  { cityId: "portland-or", city: "Portland", stateCode: "OR", countryCode: "US", latitude: 45.5202471, longitude: -122.674194 },
  { cityId: "minneapolis-mn", city: "Minneapolis", stateCode: "MN", countryCode: "US", latitude: 44.9772995, longitude: -93.2654692 },
  { cityId: "cleveland-oh", city: "Cleveland", stateCode: "OH", countryCode: "US", latitude: 41.4996574, longitude: -81.6936772 },
  { cityId: "cincinnati-oh", city: "Cincinnati", stateCode: "OH", countryCode: "US", latitude: 39.1012809, longitude: -84.5127405 },
  { cityId: "columbus-oh", city: "Columbus", stateCode: "OH", countryCode: "US", latitude: 39.9622601, longitude: -83.0007065 },
  { cityId: "pittsburgh-pa", city: "Pittsburgh", stateCode: "PA", countryCode: "US", latitude: 40.4406968, longitude: -80.0025666 },
  { cityId: "indianapolis-in", city: "Indianapolis", stateCode: "IN", countryCode: "US", latitude: 39.7683331, longitude: -86.1583502 },
  { cityId: "kansas-city-mo", city: "Kansas City", stateCode: "MO", countryCode: "US", latitude: 39.100105, longitude: -94.5781416 },
  { cityId: "st-louis-mo", city: "St. Louis", stateCode: "MO", countryCode: "US", latitude: 38.6254063, longitude: -90.190009 },
  { cityId: "milwaukee-wi", city: "Milwaukee", stateCode: "WI", countryCode: "US", latitude: 43.0386475, longitude: -87.9090751 },
  { cityId: "louisville-ky", city: "Louisville", stateCode: "KY", countryCode: "US", latitude: 38.2542376, longitude: -85.759407 },
  { cityId: "tampa-fl", city: "Tampa", stateCode: "FL", countryCode: "US", latitude: 27.9449854, longitude: -82.4583107 },
  { cityId: "orlando-fl", city: "Orlando", stateCode: "FL", countryCode: "US", latitude: 28.5421218, longitude: -81.379045 },
  { cityId: "jacksonville-fl", city: "Jacksonville", stateCode: "FL", countryCode: "US", latitude: 30.3262247, longitude: -81.6579179 },
  { cityId: "raleigh-nc", city: "Raleigh", stateCode: "NC", countryCode: "US", latitude: 35.7803977, longitude: -78.6390989 },
  { cityId: "durham-nc", city: "Durham", stateCode: "NC", countryCode: "US", latitude: 35.996653, longitude: -78.9018053 },
  { cityId: "greensboro-nc", city: "Greensboro", stateCode: "NC", countryCode: "US", latitude: 36.0726355, longitude: -79.7919754 },
  { cityId: "columbia-sc", city: "Columbia", stateCode: "SC", countryCode: "US", latitude: 34.000754, longitude: -81.0352313 },
  { cityId: "charleston-sc", city: "Charleston", stateCode: "SC", countryCode: "US", latitude: 32.7884363, longitude: -79.9399309 },
  { cityId: "savannah-ga", city: "Savannah", stateCode: "GA", countryCode: "US", latitude: 32.0790074, longitude: -81.0921335 },
  { cityId: "montgomery-al", city: "Montgomery", stateCode: "AL", countryCode: "US", latitude: 32.3777111, longitude: -86.3090775 },
  { cityId: "mobile-al", city: "Mobile", stateCode: "AL", countryCode: "US", latitude: 30.6913462, longitude: -88.0437509 },
  { cityId: "baton-rouge-la", city: "Baton Rouge", stateCode: "LA", countryCode: "US", latitude: 30.4494155, longitude: -91.1869659 },
  { cityId: "shreveport-la", city: "Shreveport", stateCode: "LA", countryCode: "US", latitude: 32.5135356, longitude: -93.7477839 },
  { cityId: "little-rock-ar", city: "Little Rock", stateCode: "AR", countryCode: "US", latitude: 34.7465071, longitude: -92.2896267 },
  { cityId: "oklahoma-city-ok", city: "Oklahoma City", stateCode: "OK", countryCode: "US", latitude: 35.4729886, longitude: -97.5170536 },
  { cityId: "tulsa-ok", city: "Tulsa", stateCode: "OK", countryCode: "US", latitude: 36.1563122, longitude: -95.9927516 },
  { cityId: "las-vegas-nv", city: "Las Vegas", stateCode: "NV", countryCode: "US", latitude: 36.1674263, longitude: -115.1484131 },
  { cityId: "phoenix-az", city: "Phoenix", stateCode: "AZ", countryCode: "US", latitude: 33.4484367, longitude: -112.074141 },
  { cityId: "tucson-az", city: "Tucson", stateCode: "AZ", countryCode: "US", latitude: 32.2228765, longitude: -110.974847 },
  { cityId: "albuquerque-nm", city: "Albuquerque", stateCode: "NM", countryCode: "US", latitude: 35.0841034, longitude: -106.650985 },
  { cityId: "el-paso-tx", city: "El Paso", stateCode: "TX", countryCode: "US", latitude: 31.7601001, longitude: -106.4870476 },
  { cityId: "san-francisco-ca", city: "San Francisco", stateCode: "CA", countryCode: "US", latitude: 37.7879363, longitude: -122.4075201 },
] as const satisfies readonly Readonly<{
  cityId: string;
  city: string;
  stateCode: string;
  countryCode: "US" | "CA";
  latitude: number;
  longitude: number;
}>[];

function weatherSourceId(cityId: string): string {
  // Retain the original database/audit identifiers for the initial three
  // cities while keeping later city source IDs self-describing.
  const legacy: Readonly<Record<string, string>> = {
    "minneapolis-mn": "minneapolis-nws-alerts",
    "philadelphia-pa": "philadelphia-nws-alerts",
    "houston-tx": "houston-nws-alerts",
  };
  return legacy[cityId] ?? `${cityId}-nws-alerts`;
}

const NATIONAL_WEATHER_SERVICE_CITY_SOURCES: readonly CitySafetySourceRecord[] =
  CITY_SAFETY_CITY_CENTERS
    .filter((city) => city.countryCode === "US")
    .map((city) => ({
      id: weatherSourceId(city.cityId),
      cityId: city.cityId,
      topic: "weather",
      displayName: `National Weather Service — ${city.city}`,
      url: `https://api.weather.gov/alerts/active?point=${city.latitude},${city.longitude}`,
      publisherClass: "official_weather",
      freshnessMinutes: 15,
      enabled: true,
      normalizer: "nws_alerts",
    }));

const CANADIAN_OFFICIAL_WEATHER_CITY_SOURCES: readonly CitySafetySourceRecord[] =
  CITY_SAFETY_CITY_CENTERS
    .filter((city) => city.countryCode === "CA")
    .map((city) => ({
      id: `${city.cityId}-eccc-weather-alerts`,
      cityId: city.cityId,
      topic: "weather",
      displayName: `Environment and Climate Change Canada — ${city.city}`,
      url: "https://weather.gc.ca/warnings/index_e.html",
      publisherClass: "official_weather",
      freshnessMinutes: 30,
      enabled: true,
      // The Canadian page remains an official link only until a city-bound
      // normalizer is separately reviewed; it cannot create an alert claim.
      normalizer: "none",
    }));

/**
 * Curated, versioned source allowlist. The exact city id, topic, publisher,
 * retrieval method, and freshness are code-reviewed rather than model output.
 * A source is not treated as a live condition unless its named normalizer can
 * produce a bounded, current source excerpt.
 */
export const CITY_SAFETY_SOURCE_REGISTRY: readonly CitySafetySourceRecord[] = [
  ...NATIONAL_WEATHER_SERVICE_CITY_SOURCES,
  ...CANADIAN_OFFICIAL_WEATHER_CITY_SOURCES,
  {
    id: "minneapolis-metro-transit-alerts",
    cityId: "minneapolis-mn",
    topic: "transit",
    displayName: "Metro Transit rider alerts",
    url: "https://www.metrotransit.org/rider-alerts",
    publisherClass: "official_transit",
    freshnessMinutes: 30,
    enabled: true,
    normalizer: "none",
  },
  {
    id: "minneapolis-city-emergency-management",
    cityId: "minneapolis-mn",
    topic: "official_alert",
    displayName: "City of Minneapolis Emergency Management",
    url: "https://www.minneapolismn.gov/government/departments/emergency-management/",
    publisherClass: "official_city",
    freshnessMinutes: 30,
    enabled: true,
    normalizer: "none",
  },
  {
    id: "philadelphia-septa-alerts",
    cityId: "philadelphia-pa",
    topic: "transit",
    displayName: "SEPTA service alerts",
    url: "https://www.septa.org/alerts",
    publisherClass: "official_transit",
    freshnessMinutes: 30,
    enabled: true,
    normalizer: "none",
  },
  {
    id: "philadelphia-oem-alerts",
    cityId: "philadelphia-pa",
    topic: "official_alert",
    displayName: "Philadelphia Office of Emergency Management",
    url: "https://www.phila.gov/departments/office-of-emergency-management/",
    publisherClass: "official_emergency",
    freshnessMinutes: 30,
    enabled: true,
    normalizer: "none",
  },
  {
    id: "houston-oem-activation",
    cityId: "houston-tx",
    topic: "official_alert",
    displayName: "Houston Office of Emergency Management",
    url: "https://houstonoem.org/",
    publisherClass: "official_emergency",
    freshnessMinutes: 30,
    enabled: true,
    normalizer: "oem_activation",
  },
  {
    id: "houston-metro-alerts",
    cityId: "houston-tx",
    topic: "transit",
    displayName: "METRO Houston service alerts",
    url: "https://www.ridemetro.org/alerts/service-alerts-and-detours",
    publisherClass: "official_transit",
    freshnessMinutes: 30,
    enabled: true,
    normalizer: "none",
  },
] as const;

export type CurrentSafetyEvidence = Readonly<{
  sourceId: string;
  cityId: CitySafetyCityId;
  topic: CitySafetyTopic;
  publisherClass: CitySafetyPublisherClass;
  /** True only for a named, active official emergency condition. */
  activeOfficialAlert: boolean;
  title: string;
  url: string;
  summary: string;
  retrievedAt: string;
  expiresAt: string;
}>;

export type CitySafetyBriefing = Readonly<{
  cityId: CitySafetyCityId;
  evidence: readonly CurrentSafetyEvidence[];
  officialLinks: readonly Pick<CitySafetySourceRecord, "id" | "displayName" | "url" | "topic">[];
  unavailable: boolean;
}>;

type SafetyAuditOutcome = "current" | "unavailable" | "stale" | "fetch_failed" | "city_mismatch";

type SafetyAuditEvent = Readonly<{
  sourceId: string;
  cityId: CitySafetyCityId;
  topic: CitySafetyTopic;
  outcome: SafetyAuditOutcome;
  retrievedAt: string;
  expiresAt: string | null;
  reasonCode: string;
}>;

type SafetyAuditPool = Pick<QueryPool, "query">;

type FetchResponse = Readonly<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

type SafetyFetch = (input: string, init?: RequestInit) => Promise<FetchResponse>;

type SafetyFetchInput = Readonly<{
  source: CitySafetySourceRecord;
  now: Date;
  fetchImpl: SafetyFetch;
}>;

type CachedSource = Readonly<{
  expiresAtMs: number;
  result: readonly CurrentSafetyEvidence[];
}>;

const sourceCache = new Map<string, CachedSource>();
const MAX_SOURCE_CACHE_ENTRIES = 120;

function sourceCacheKey(source: CitySafetySourceRecord): string {
  return `${source.cityId}:${source.id}:${source.topic}`;
}

function cacheSourceResult(source: CitySafetySourceRecord, now: Date, result: readonly CurrentSafetyEvidence[]) {
  if (sourceCache.size >= MAX_SOURCE_CACHE_ENTRIES && !sourceCache.has(sourceCacheKey(source))) {
    const oldest = sourceCache.keys().next().value;
    if (typeof oldest === "string") sourceCache.delete(oldest);
  }
  sourceCache.set(sourceCacheKey(source), {
    expiresAtMs: now.getTime() + source.freshnessMinutes * 60_000,
    result,
  });
}

function boundedText(value: unknown, limit: number): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, limit)
    : "";
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function sourceExpiry(source: CitySafetySourceRecord, retrievedAt: Date): string {
  return new Date(retrievedAt.getTime() + source.freshnessMinutes * 60_000).toISOString();
}

function officialAlertCanStandAlone(evidence: CurrentSafetyEvidence): boolean {
  return evidence.topic === "official_alert"
    && evidence.publisherClass === "official_emergency"
    && evidence.activeOfficialAlert;
}

function stripMarkup(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#x2B;/gi, "+")
    .replace(/\s+/g, " ")
    .trim();
}

function nwsEvidence(source: CitySafetySourceRecord, payload: unknown, retrievedAt: Date): CurrentSafetyEvidence[] {
  const features = payload && typeof payload === "object" && Array.isArray((payload as { features?: unknown }).features)
    ? (payload as { features: unknown[] }).features
    : [];
  return features.slice(0, 4).flatMap((feature) => {
    const properties = feature && typeof feature === "object"
      ? (feature as { properties?: Record<string, unknown> }).properties
      : null;
    if (!properties) return [];
    const expiresAt = isoOrNull(properties.expires) ?? sourceExpiry(source, retrievedAt);
    if (Date.parse(expiresAt) <= retrievedAt.getTime()) return [];
    const headline = boundedText(properties.headline, 180);
    const description = boundedText(properties.description, 420);
    const title = headline || boundedText(properties.event, 120);
    if (!title) return [];
    return [{
      sourceId: source.id,
      cityId: source.cityId,
      topic: source.topic,
      publisherClass: source.publisherClass,
      activeOfficialAlert: source.topic === "official_alert",
      title,
      url: source.url,
      summary: description || title,
      retrievedAt: retrievedAt.toISOString(),
      expiresAt,
    }];
  });
}

function houstonOemEvidence(source: CitySafetySourceRecord, html: string, retrievedAt: Date): CurrentSafetyEvidence[] {
  const text = stripMarkup(html);
  const match = text.match(/Emergency Operations Center Activation Level\s+([^.!?]{2,180})/i);
  const activation = boundedText(match?.[1], 180);
  // A normal-operations status is helpful only as an official link. It is not
  // an active condition and must not be turned into a city-safety conclusion.
  if (!activation || /\bnormal operations?\b/i.test(activation)) return [];
  return [{
    sourceId: source.id,
    cityId: source.cityId,
    topic: source.topic,
    publisherClass: source.publisherClass,
    activeOfficialAlert: true,
    title: "Houston OEM Emergency Operations Center status",
    url: source.url,
    summary: `Emergency Operations Center activation level: ${activation}.`,
    retrievedAt: retrievedAt.toISOString(),
    expiresAt: sourceExpiry(source, retrievedAt),
  }];
}

function sourceRecordsFor(cityId: CitySafetyCityId): readonly CitySafetySourceRecord[] {
  return CITY_SAFETY_SOURCE_REGISTRY.filter((source) => source.enabled && source.cityId === cityId);
}

function citySafetySourceRecord(value: Record<string, unknown>): CitySafetySourceRecord | null {
  const cityId = value.city_id;
  const topic = value.topic;
  const publisherClass = value.publisher_class;
  const normalizer = value.normalizer;
  const id = boundedText(value.id, 100);
  const displayName = boundedText(value.display_name, 180);
  const url = boundedText(value.url, 2048);
  const freshnessMinutes = Number(value.freshness_minutes);
  if (
    !id || !displayName || !url.startsWith("https://") ||
    !CITY_SAFETY_CITY_CENTERS.some((city) => city.cityId === String(cityId)) ||
    !["official_alert", "transit", "weather", "road", "event_advisory"].includes(String(topic)) ||
    !["official_city", "official_transit", "official_weather", "official_emergency"].includes(String(publisherClass)) ||
    !["nws_alerts", "oem_activation", "none"].includes(String(normalizer)) ||
    !Number.isInteger(freshnessMinutes) || freshnessMinutes < 5 || freshnessMinutes > 180
  ) return null;
  return {
    id,
    cityId: cityId as CitySafetyCityId,
    topic: topic as CitySafetyTopic,
    displayName,
    url,
    publisherClass: publisherClass as CitySafetyPublisherClass,
    freshnessMinutes,
    enabled: value.enabled === true,
    normalizer: normalizer as SafetySourceNormalizer,
  };
}

async function managedSourceRecordsFor(
  cityId: CitySafetyCityId,
  pool: SafetyAuditPool | undefined,
): Promise<readonly CitySafetySourceRecord[]> {
  if (!pool) return sourceRecordsFor(cityId);
  try {
    const result = await pool.query<Record<string, unknown>>(
      `SELECT id, city_id, topic, display_name, url, publisher_class,
              freshness_minutes, enabled, normalizer
         FROM kinfolk_city_safety_sources
        WHERE city_id = $1
        ORDER BY id ASC`,
      [cityId],
    );
    const configured = result.rows
      .flatMap((row) => {
        const source = citySafetySourceRecord(row);
        return source?.enabled && source.cityId === cityId ? [source] : [];
      });
    return configured.length > 0 ? configured : sourceRecordsFor(cityId);
  } catch {
    // Startup migration ordering or an optional database issue must never
    // change a safety claim; use the reviewed built-in defaults and fail closed.
    return sourceRecordsFor(cityId);
  }
}

export function citySafetyCityId(scope: Readonly<{ city: string; stateCode: string }>): CitySafetyCityId | null {
  const normalizedCity = scope.city.trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedState = scope.stateCode.trim().toUpperCase();
  return CITY_SAFETY_CITY_CENTERS.find(
    (city) => city.city.toLowerCase() === normalizedCity && city.stateCode === normalizedState,
  )?.cityId ?? null;
}

export async function fetchAndNormalizeSafetySource(input: SafetyFetchInput): Promise<readonly CurrentSafetyEvidence[]> {
  const cached = sourceCache.get(sourceCacheKey(input.source));
  if (cached && cached.expiresAtMs > input.now.getTime()) return cached.result;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await input.fetchImpl(input.source.url, {
      headers: { Accept: "application/json, text/html;q=0.8", "User-Agent": "MappingWithMelanin-KinfolkSafety/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const result = input.source.normalizer === "nws_alerts"
      ? nwsEvidence(input.source, await response.json(), input.now)
      : input.source.normalizer === "oem_activation"
        ? houstonOemEvidence(input.source, await response.text(), input.now)
        : [];
    cacheSourceResult(input.source, input.now, result);
    return result;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function recordSafetyAuditEvent(pool: SafetyAuditPool | undefined, event: SafetyAuditEvent): Promise<void> {
  if (!pool) return;
  // No member id, prompt, conversation id, address, raw response, or free-form
  // evidence is stored. Source records themselves are versioned in the registry.
  await pool.query(
    `INSERT INTO kinfolk_city_safety_retrieval_audit_events
       (source_id, city_id, topic, outcome, retrieved_at, expires_at, reason_code)
     VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7)`,
    [event.sourceId, event.cityId, event.topic, event.outcome, event.retrievedAt, event.expiresAt, event.reasonCode],
  ).catch(() => undefined);
}

export async function currentCitySafetyBriefing(input: Readonly<{
  cityId: CitySafetyCityId;
  now?: Date;
  fetchImpl?: SafetyFetch;
  auditPool?: SafetyAuditPool;
}>): Promise<CitySafetyBriefing> {
  const now = input.now ?? new Date();
  const fetchImpl = input.fetchImpl ?? (globalThis.fetch as unknown as SafetyFetch);
  const sources = await managedSourceRecordsFor(input.cityId, input.auditPool);
  const settled = await Promise.allSettled(sources.map(async (source) => ({
    source,
    evidence: await fetchAndNormalizeSafetySource({ source, now, fetchImpl }),
  })));

  const evidence: CurrentSafetyEvidence[] = [];
  await Promise.all(settled.map(async (result) => {
    if (result.status !== "fulfilled") return;
    const { source, evidence: rawEvidence } = result.value;
    const valid = rawEvidence.filter((item) =>
      item.cityId === input.cityId && Date.parse(item.expiresAt) > now.getTime(),
    );
    const outcome: SafetyAuditOutcome = valid.length > 0
      ? "current"
      : rawEvidence.some((item) => item.cityId !== input.cityId)
        ? "city_mismatch"
        : "unavailable";
    await recordSafetyAuditEvent(input.auditPool, {
      sourceId: source.id,
      cityId: input.cityId,
      topic: source.topic,
      outcome,
      retrievedAt: now.toISOString(),
      expiresAt: valid[0]?.expiresAt ?? null,
      reasonCode: valid.length > 0 ? "source_current" : "source_no_current_extractable_evidence",
    });
    evidence.push(...valid);
  }));

  // A named official emergency source can stand on its own. Other active claims
  // require an independent source with the same topic before rendering.
  const corroborated = evidence.filter((item) =>
    officialAlertCanStandAlone(item) || evidence.some((other) =>
      other.sourceId !== item.sourceId && other.topic === item.topic,
    ),
  );
  return {
    cityId: input.cityId,
    evidence: corroborated,
    officialLinks: sources.map(({ id, displayName, url, topic }) => ({ id, displayName, url, topic })),
    unavailable: corroborated.length === 0,
  };
}

export function renderCitySafetyBriefing(result: CitySafetyBriefing): string {
  if (result.evidence.some((item) => item.cityId !== result.cityId)) {
    throw new Error("CITATION_GEO_MISMATCH");
  }
  if (result.unavailable) {
    return "Safety note: I could not verify a current city-specific safety condition from the approved official sources right now. Check the linked official local alerts and transportation sources before you go; for immediate danger, contact local emergency services.";
  }
  const evidenceCopy = result.evidence
    .slice(0, 2)
    .map((item) => `${item.title}: ${item.summary}`)
    .join(" ");
  return `Current official information for this city: ${evidenceCopy} This is source-attributed current information, not a determination that an area is safe.`;
}

export function renderDirectCitySafetyBriefing(
  city: string,
  result: CitySafetyBriefing,
): string {
  return [
    `For ${city}, I can provide only the current information supported by approved official sources.`,
    renderCitySafetyBriefing(result),
    "I will not turn this into a business recommendation, infer a personal risk level, or make a neighborhood safety determination. For immediate danger, contact local emergency services.",
  ].join("\n\n");
}

export function citySafetySourcesForResponse(result: CitySafetyBriefing): Array<{ title: string; url: string }> {
  const current = result.evidence.map((item) => ({
    title: `${item.title} — official current source`,
    url: item.url,
  }));
  if (current.length > 0) return current;
  return result.officialLinks.map((source) => ({
    title: `${source.displayName} — official ${source.topic.replace(/_/g, " ")} source`,
    url: source.url,
  }));
}

export function clearCitySafetyBriefingCacheForTests(): void {
  sourceCache.clear();
}
