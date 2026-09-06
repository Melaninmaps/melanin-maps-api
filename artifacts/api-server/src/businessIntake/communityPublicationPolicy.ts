import { isProvenDemoBusiness } from "../businesses/businessDemoContainment";
import type { Submission } from "./submissionRepository";
import type {
  CommunityBusinessSubmissionInput,
  SubmissionLocationSource,
  SubmissionSocialProfiles,
} from "./types";

export type AutomaticPublicationOutcome =
  | "eligible"
  | "needs_location"
  | "needs_evidence"
  | "regulated_review"
  | "resource_review"
  | "prohibited";

export type LocationEvidenceSource =
  | "google_geocoder"
  | "nominatim_exact_address";

export interface ResolvedBusinessLocation {
  lat: string;
  lng: string;
  source: LocationEvidenceSource;
  formattedAddress: string | null;
}

export interface PublicationAssessment {
  outcome: AutomaticPublicationOutcome;
  submissionStatus: "pending_review" | "needs_info";
  publicMessage: string;
  auditNote: string;
}

interface CommunityPublicationCandidate {
  name: string;
  category: string;
  subcategory?: string | null;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  website?: string | null;
  socialProfiles?: SubmissionSocialProfiles | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  providerPlaceId?: string | null;
  locationSource?: SubmissionLocationSource | string | null;
}

const RESOURCE_TERMS = [
  "government",
  "public resource",
  "workforce development",
  "small business resource",
  "community resource",
  "public park",
  "visitor center",
  "non-profit",
  "nonprofit",
  "community organization",
  "advocacy organization",
  "library",
];

const REGULATED_TERMS = [
  "physician",
  "doctor",
  "dentist",
  "medical",
  "mental health",
  "therapist",
  "chiropractor",
  "physical therapy",
  "optometrist",
  "nutritionist",
  "veterinarian",
  "attorney",
  "lawyer",
  "legal service",
  "accountant",
  "cpa",
  "financial service",
  "financial advisor",
  "insurance",
  "insurance agent",
  "mortgage lender",
  "real estate agent",
  "childcare",
  "preschool",
  "private school",
  "cannabis",
  "dispensary",
  "electrician",
  "plumber",
  "hvac",
  "roofing",
  "general contractor",
];

const US_STATE_NAMES: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california",
  CO: "colorado", CT: "connecticut", DE: "delaware", FL: "florida", GA: "georgia",
  HI: "hawaii", ID: "idaho", IL: "illinois", IN: "indiana", IA: "iowa",
  KS: "kansas", KY: "kentucky", LA: "louisiana", ME: "maine", MD: "maryland",
  MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi", MO: "missouri",
  MT: "montana", NE: "nebraska", NV: "nevada", NH: "new hampshire", NJ: "new jersey",
  NM: "new mexico", NY: "new york", NC: "north carolina", ND: "north dakota", OH: "ohio",
  OK: "oklahoma", OR: "oregon", PA: "pennsylvania", RI: "rhode island", SC: "south carolina",
  SD: "south dakota", TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont",
  VA: "virginia", WA: "washington", WV: "west virginia", WI: "wisconsin", WY: "wyoming",
  DC: "district of columbia",
};

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsAny(value: string, terms: readonly string[]): boolean {
  const searchable = ` ${value} `;
  return terms.some((term) => {
    const canonicalTerm = normalized(term);
    const forms = [canonicalTerm, `${canonicalTerm}s`];
    if (canonicalTerm.endsWith("y")) forms.push(`${canonicalTerm.slice(0, -1)}ies`);
    return forms.some((form) => searchable.includes(` ${form} `));
  });
}

export function isValidPinCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180
    && !(lat === 0 && lng === 0);
}

export function assessCommunityPublication(
  submission: CommunityPublicationCandidate,
): PublicationAssessment {
  if (isProvenDemoBusiness(submission)) {
    return {
      outcome: "prohibited",
      submissionStatus: "pending_review",
      publicMessage: "This submission was saved privately because it matches a protected test/demo signal.",
      auditNote: "Automatic publication held: protected test/demo signal.",
    };
  }

  const destinationText = normalized([
    submission.name,
    submission.category,
    submission.subcategory,
    submission.description,
  ].filter(Boolean).join(" "));
  const regulatedText = normalized([
    submission.name,
    submission.category,
    submission.subcategory,
    submission.description,
  ].filter(Boolean).join(" "));

  if (containsAny(destinationText, RESOURCE_TERMS)) {
    return {
      outcome: "resource_review",
      submissionStatus: "pending_review",
      publicMessage: "Saved privately while we route this to Community Resources instead of publishing it as a business.",
      auditNote: "Automatic publication held for business-versus-resource routing.",
    };
  }

  if (containsAny(regulatedText, REGULATED_TERMS)) {
    return {
      outcome: "regulated_review",
      submissionStatus: "pending_review",
      publicMessage: "Saved privately for the required licensed/regulated-service evidence check.",
      auditNote: "Automatic publication held for regulated-service evidence.",
    };
  }

  if (!submission.address?.trim() || !/\d/.test(submission.address) || (!submission.state?.trim() && !submission.country?.trim())) {
    return {
      outcome: "needs_location",
      submissionStatus: "needs_info",
      publicMessage: "Saved, but we need a complete street address plus a state/region or country before we can place a truthful map pin.",
      auditNote: "Automatic publication needs a street-number address plus state/region or country.",
    };
  }

  const hasPublicEvidence = Boolean(
    submission.website
    || Object.keys(submission.socialProfiles ?? {}).length > 0,
  );
  if (!hasPublicEvidence) {
    return {
      outcome: "needs_evidence",
      submissionStatus: "needs_info",
      publicMessage: "Saved, but please add the business website or a public social profile before it goes live.",
      auditNote: "Automatic publication needs a validated public website or social profile.",
    };
  }

  return {
    outcome: "eligible",
    submissionStatus: "pending_review",
    publicMessage: "Eligible for immediate community publication after precise location confirmation.",
    auditNote: "Ordinary business passed automatic classification checks.",
  };
}

function locationMatches(value: string | null | undefined, expected: string): boolean {
  const actual = normalized(value);
  const target = normalized(expected);
  return Boolean(actual && target && actual === target);
}

function stateMatches(address: Record<string, string | undefined>, expected: string): boolean {
  const state = normalized(expected);
  const abbreviation = expected.trim().toUpperCase();
  const fullName = US_STATE_NAMES[abbreviation];
  const iso = Object.entries(address)
    .filter(([key]) => key.toLocaleLowerCase("en-US").startsWith("iso3166-2"))
    .map(([, value]) => value?.toUpperCase() ?? "");
  return locationMatches(address.state, expected)
    || Boolean(fullName && locationMatches(address.state, fullName))
    || iso.some((value) => value === abbreviation || value.endsWith(`-${abbreviation}`))
    || state === normalized(address.state_code);
}

function countryMatches(address: Record<string, string | undefined>, expected: string): boolean {
  const aliases: Record<string, string> = {
    us: "united states",
    usa: "united states",
    "united states of america": "united states",
    uk: "united kingdom",
    gb: "united kingdom",
    uae: "united arab emirates",
  };
  const canonical = (value: string | null | undefined) => {
    const key = normalized(value);
    return aliases[key] ?? key;
  };
  const target = canonical(expected);
  return Boolean(target && [address.country, address.country_code].some((value) => canonical(value) === target));
}

function postalCodeMatches(value: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected?.trim()) return true;
  const actual = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const target = expected.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!actual || !target) return false;
  return actual === target || (target.length === 5 && actual.startsWith(target));
}

function streetIdentity(address: string | null | undefined): { house: string; tokens: string[] } {
  const firstLine = normalized(address?.split(",")[0]);
  const house = firstLine.match(/^\d+[a-z]?/)?.[0] ?? "";
  const aliases: Record<string, string> = {
    n: "north", s: "south", e: "east", w: "west",
    ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
    st: "street", rd: "road", ave: "avenue", av: "avenue", dr: "drive",
    ln: "lane", blvd: "boulevard", hwy: "highway", ct: "court", pl: "place",
    pkwy: "parkway", cir: "circle", ter: "terrace", trl: "trail",
  };
  const rawTokens = firstLine.split(" ").filter((token) => token && token !== house);
  const unitIndex = rawTokens.findIndex((token) => ["suite", "ste", "unit", "floor", "fl", "apt", "apartment"].includes(token));
  const routeTokens = unitIndex >= 0 ? rawTokens.slice(0, unitIndex) : rawTokens;
  const tokens = routeTokens.map((token) => aliases[token] ?? token);
  return { house, tokens };
}

function roadMatches(
  submittedAddress: string | null | undefined,
  returnedHouse: string | null | undefined,
  returnedRoad: string | null | undefined,
): boolean {
  const expected = streetIdentity(submittedAddress);
  const actualHouse = normalized(returnedHouse);
  const actual = streetIdentity(returnedRoad);
  return Boolean(
    expected.house
    && actualHouse
    && expected.house === actualHouse
    && expected.tokens.length > 0
    && expected.tokens.length === actual.tokens.length
    && expected.tokens.every((token, index) => token === actual.tokens[index]),
  );
}

interface GoogleGeocodePayload {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: Array<{
      long_name?: string;
      short_name?: string;
      types?: string[];
    }>;
    geometry?: {
      location?: { lat?: number; lng?: number };
      location_type?: string;
    };
  }>;
}

let googleQueue: Promise<void> = Promise.resolve();
let lastGoogleRequestAt = 0;
let pendingGoogleRequests = 0;
const MAX_GOOGLE_QUEUE = 25;

async function waitForGoogleRateLimit(): Promise<void> {
  const turn = googleQueue.then(async () => {
    const waitMs = Math.max(0, 100 - (Date.now() - lastGoogleRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastGoogleRequestAt = Date.now();
  });
  googleQueue = turn.catch(() => undefined);
  await turn;
}

function googleComponent(
  result: NonNullable<GoogleGeocodePayload["results"]>[number],
  type: string,
): { long?: string; short?: string } {
  const component = result.address_components?.find((item) => item.types?.includes(type));
  return { long: component?.long_name, short: component?.short_name };
}

async function googleGeocode(
  submission: CommunityPublicationCandidate,
  apiKey: string,
): Promise<ResolvedBusinessLocation | null> {
  const query = [
    submission.address,
    submission.city,
    submission.state,
    submission.postalCode,
    submission.country,
  ].filter(Boolean).join(", ");
  if (pendingGoogleRequests >= MAX_GOOGLE_QUEUE) return null;
  pendingGoogleRequests += 1;
  try {
    await waitForGoogleRateLimit();
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
      { signal: AbortSignal.timeout(6_000) },
    );
    if (!response.ok) return null;
    const payload = await response.json() as GoogleGeocodePayload;
    if (payload.status !== "OK") return null;
    for (const result of payload.results ?? []) {
      const location = result.geometry?.location;
      const precision = result.geometry?.location_type;
      const city = googleComponent(result, "locality").long
        ?? googleComponent(result, "postal_town").long
        ?? googleComponent(result, "administrative_area_level_2").long;
      const region = googleComponent(result, "administrative_area_level_1");
      const country = googleComponent(result, "country");
      const streetNumber = googleComponent(result, "street_number");
      const route = googleComponent(result, "route");
      const postalCode = googleComponent(result, "postal_code");
      if (
        !isValidPinCoordinates(location?.lat, location?.lng)
        || !["ROOFTOP", "RANGE_INTERPOLATED"].includes(precision ?? "")
        || !locationMatches(city, submission.city)
        || !roadMatches(submission.address, streetNumber.long ?? streetNumber.short, route.long ?? route.short)
        || !postalCodeMatches(postalCode.long ?? postalCode.short, submission.postalCode)
        || Boolean(submission.state
          && !(locationMatches(region.short, submission.state) || locationMatches(region.long, submission.state)))
        || Boolean(submission.country
          && !countryMatches({ country: country.long, country_code: country.short }, submission.country))
      ) continue;
      return {
        lat: String(location!.lat),
        lng: String(location!.lng),
        source: "google_geocoder",
        formattedAddress: result.formatted_address ?? null,
      };
    }
    return null;
  } finally {
    pendingGoogleRequests -= 1;
  }
}

interface NominatimHit {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
}

let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimRequestAt = 0;
let pendingNominatimRequests = 0;
const MAX_NOMINATIM_QUEUE = 25;
const LOCATION_CACHE_LIMIT = 1_000;
const locationCache = new Map<string, { expiresAt: number; value: ResolvedBusinessLocation | null }>();
const inFlightLocations = new Map<string, Promise<ResolvedBusinessLocation | null>>();

function locationCacheKey(submission: CommunityPublicationCandidate): string {
  return normalized([
    submission.address,
    submission.city,
    submission.state,
    submission.postalCode,
    submission.country ?? "United States",
  ].filter(Boolean).join("|"));
}

function cacheLocation(key: string, value: ResolvedBusinessLocation | null): void {
  if (locationCache.size >= LOCATION_CACHE_LIMIT) {
    const oldest = locationCache.keys().next().value as string | undefined;
    if (oldest) locationCache.delete(oldest);
  }
  locationCache.set(key, {
    expiresAt: Date.now() + (value ? 30 * 24 * 60 * 60 * 1_000 : 5 * 60 * 1_000),
    value,
  });
}

async function waitForNominatimRateLimit(): Promise<void> {
  const turn = nominatimQueue.then(async () => {
    const waitMs = Math.max(0, 1_100 - (Date.now() - lastNominatimRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastNominatimRequestAt = Date.now();
  });
  nominatimQueue = turn.catch(() => undefined);
  await turn;
}

async function nominatimGeocode(submission: CommunityPublicationCandidate): Promise<ResolvedBusinessLocation | null> {
  const query = [
    submission.address,
    submission.city,
    submission.state,
    submission.postalCode,
    submission.country ?? "United States",
  ].filter(Boolean).join(", ");
  if (pendingNominatimRequests >= MAX_NOMINATIM_QUEUE) return null;
  pendingNominatimRequests += 1;
  try {
    await waitForNominatimRateLimit();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=5&addressdetails=1`,
      {
        headers: {
          "User-Agent": "MappingWithMelanin/1.0 (contact@mappingwithmelanin.com)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(7_000),
      },
    );
    if (!response.ok) return null;
    const hits = await response.json() as NominatimHit[];
    for (const hit of hits ?? []) {
      const address = hit.address ?? {};
      const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.city_district;
      const road = address.road ?? address.pedestrian ?? address.residential ?? address.footway;
      if (
        !isValidPinCoordinates(hit.lat, hit.lon)
        || !locationMatches(city, submission.city)
        || !roadMatches(submission.address, address.house_number, road)
        || !postalCodeMatches(address.postcode, submission.postalCode)
        || Boolean(submission.state && !stateMatches(address, submission.state))
        || Boolean(submission.country && !countryMatches(address, submission.country))
      ) continue;
      return {
        lat: String(hit.lat),
        lng: String(hit.lon),
        source: "nominatim_exact_address",
        formattedAddress: hit.display_name ?? null,
      };
    }
    return null;
  } finally {
    pendingNominatimRequests -= 1;
  }
}

async function resolveUncachedLocation(
  submission: CommunityPublicationCandidate,
  cacheKey: string,
): Promise<ResolvedBusinessLocation | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const google = await googleGeocode(submission, apiKey);
      if (google) {
        cacheLocation(cacheKey, google);
        return google;
      }
    } catch {
      // Fall through to the no-key public geocoder. Failure never creates a pin.
    }
  }

  try {
    const resolved = await nominatimGeocode(submission);
    cacheLocation(cacheKey, resolved);
    return resolved;
  } catch {
    cacheLocation(cacheKey, null);
    return null;
  }
}

export async function resolvePreciseBusinessLocation(
  submission: CommunityPublicationCandidate,
): Promise<ResolvedBusinessLocation | null> {
  const cacheKey = locationCacheKey(submission);
  const cached = locationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) locationCache.delete(cacheKey);

  const inFlight = inFlightLocations.get(cacheKey);
  if (inFlight) return inFlight;

  const resolution = resolveUncachedLocation(submission, cacheKey)
    .finally(() => inFlightLocations.delete(cacheKey));
  inFlightLocations.set(cacheKey, resolution);
  return resolution;
}

export function ownershipClaimValue(submission: Pick<Submission, "community_reported_ownership">): string {
  return `community_reported_${submission.community_reported_ownership}`;
}

export function publicationCandidateFromSubmission(
  submission: Submission,
): CommunityPublicationCandidate {
  return {
    name: submission.name,
    category: submission.category,
    subcategory: submission.subcategory,
    description: submission.description,
    phone: submission.phone,
    address: submission.address,
    city: submission.city,
    state: submission.state,
    postalCode: submission.postal_code,
    country: submission.country,
    website: submission.website,
    socialProfiles: submission.social_profiles,
    latitude: submission.latitude,
    longitude: submission.longitude,
    providerPlaceId: submission.provider_place_id,
    locationSource: submission.location_source,
  };
}

export function publicationCandidateFromInput(
  input: CommunityBusinessSubmissionInput,
): CommunityPublicationCandidate {
  return input;
}

export function automaticPublicationReviewNote(location: ResolvedBusinessLocation): string {
  return `Published immediately by objective community-listing checks with ${location.source} location evidence; unclaimed and not verified.`;
}

export function locationNeedsInformationAssessment(): PublicationAssessment {
  return {
    outcome: "needs_location",
    submissionStatus: "needs_info",
    publicMessage: "Saved, but the address could not be confirmed precisely enough for a truthful map pin. Please check the street address, city, state/region, and postal code.",
    auditNote: "Automatic publication needs a precise non-zero address geocode; no fallback or city-center pin was created.",
  };
}
