/**
 * Google Places Business Enrichment Service
 *
 * Uses the Google Places Text Search and Place Details APIs to enrich
 * existing business records with phone numbers, websites, hours, and
 * coordinates. Also verifies that seeded businesses actually exist.
 *
 * Priority: tour cities first (Philadelphia, DC, Atlanta, Houston, etc.)
 * Rate limiting: 1 request/second to stay within free tier.
 *
 * DO NOT:
 * - Fabricate or guess any data
 * - Override data where source = 'founder'
 * - Use a phone/website from a different business with a similar name
 * - Assume two businesses with the same name in different cities are the same
 */

import { pool } from "@workspace/db";

// Places API (New) — https://places.googleapis.com/v1/
// Uses X-Goog-Api-Key header + X-Goog-FieldMask instead of legacy ?key= params
const PLACES_NEW_BASE = "https://places.googleapis.com/v1";

export type EnrichmentConfidence = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  businessStatus: string; // OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY
  rating?: number;
}

export interface PlaceDetails {
  name: string;
  formattedAddress: string;
  phone?: string;
  website?: string;
  hours?: string[];
  priceLevel?: number; // 0-4
  businessStatus: string;
  lat: number;
  lng: number;
}

export interface EnrichmentResult {
  businessId: string;
  confidence: EnrichmentConfidence;
  placeId?: string;
  enrichedFields: Partial<{
    phone: string;
    website: string;
    hours: string;
    latitude: number;
    longitude: number;
    businessStatus: string;
    enrichment_note: string;
    enrichment_source: string;
    enriched_at: Date;
    needs_verification: boolean;
  }>;
  note: string;
}

const apiKey = () => process.env.GOOGLE_PLACES_SERVER_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";

/** Sleep for ms milliseconds — used for rate limiting */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Search Google Places (New API) by text query.
 * POST https://places.googleapis.com/v1/places:searchText
 * Returns the top result or null if nothing found.
 */
export async function searchPlaces(query: string): Promise<PlaceSearchResult | null> {
  const key = apiKey();
  if (!key) return null;

  const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.businessStatus,places.rating";
  try {
    const resp = await fetch(`${PLACES_NEW_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({ textQuery: query }),
    });
    const data = await resp.json() as {
      places?: Array<{
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        businessStatus?: string;
        rating?: number;
      }>;
      error?: { message: string };
    };

    if (data.error) {
      console.warn("[places-new] searchText error:", data.error.message);
      return null;
    }
    if (!data.places?.length) return null;

    const r = data.places[0];
    return {
      placeId: r.id,
      name: r.displayName?.text ?? "",
      formattedAddress: r.formattedAddress ?? "",
      lat: r.location?.latitude ?? 0,
      lng: r.location?.longitude ?? 0,
      businessStatus: r.businessStatus ?? "UNKNOWN",
      rating: r.rating,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch full details for a known place_id via Places API (New).
 * GET https://places.googleapis.com/v1/places/{place_id}
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const key = apiKey();
  if (!key) return null;

  const fieldMask = "displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,priceLevel,businessStatus,location";
  try {
    const resp = await fetch(`${PLACES_NEW_BASE}/places/${encodeURIComponent(placeId)}`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fieldMask,
      },
    });
    const data = await resp.json() as {
      displayName?: { text: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
      regularOpeningHours?: { weekdayDescriptions: string[] };
      priceLevel?: string; // e.g. "PRICE_LEVEL_MODERATE"
      businessStatus?: string;
      location?: { latitude: number; longitude: number };
      error?: { message: string };
    };

    if (data.error) {
      console.warn("[places-new] getDetails error:", data.error.message);
      return null;
    }
    if (!data.location) return null;

    // Map priceLevel string to 0-4 number
    const priceLevelMap: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };

    return {
      name: data.displayName?.text ?? "",
      formattedAddress: data.formattedAddress ?? "",
      phone: data.nationalPhoneNumber,
      website: data.websiteUri,
      hours: data.regularOpeningHours?.weekdayDescriptions,
      priceLevel: data.priceLevel ? priceLevelMap[data.priceLevel] : undefined,
      businessStatus: data.businessStatus ?? "UNKNOWN",
      lat: data.location.latitude,
      lng: data.location.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate enrichment confidence based on name/address similarity.
 */
function calcConfidence(
  dbName: string,
  dbCity: string,
  dbState: string,
  placeName: string,
  placeAddress: string,
): EnrichmentConfidence {
  const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const dbNameN = normalizeStr(dbName);
  const placeNameN = normalizeStr(placeName);
  const placeAddrN = normalizeStr(placeAddress);
  const cityN = normalizeStr(dbCity);
  const stateN = normalizeStr(dbState);

  // Exact name match
  const nameMatch = placeNameN === dbNameN || placeNameN.includes(dbNameN) || dbNameN.includes(placeNameN);
  // City appears in address
  const cityMatch = placeAddrN.includes(cityN) || placeAddrN.includes(stateN);

  if (nameMatch && cityMatch) return "HIGH";
  if (nameMatch || cityMatch) return "MEDIUM";
  return "LOW";
}

/**
 * Enrich a single business by searching Google Places.
 * Returns the enrichment result — does NOT write to DB directly.
 */
export async function enrichBusiness(business: {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<EnrichmentResult> {
  const today = new Date().toISOString().slice(0, 10);

  // Build search query — name + city + state for best precision
  const query = `${business.name} ${business.city} ${business.state}`;
  const searchResult = await searchPlaces(query);

  if (!searchResult) {
    return {
      businessId: business.id,
      confidence: "NONE",
      note: `Could not find online as of ${today}`,
      enrichedFields: {
        needs_verification: true,
        enriched_at: new Date(),
        enrichment_note: `Could not find on Google Places as of ${today}`,
        enrichment_source: "google_places",
      },
    };
  }

  // Check if permanently closed
  if (searchResult.businessStatus === "CLOSED_PERMANENTLY") {
    return {
      businessId: business.id,
      confidence: "HIGH",
      placeId: searchResult.placeId,
      note: `Permanently closed as of ${today}`,
      enrichedFields: {
        needs_verification: true,
        enriched_at: new Date(),
        enrichment_note: `Google Places reports permanently closed as of ${today}`,
        enrichment_source: "google_places",
      },
    };
  }

  const confidence = calcConfidence(
    business.name, business.city, business.state,
    searchResult.name, searchResult.formattedAddress,
  );

  if (confidence === "LOW") {
    return {
      businessId: business.id,
      confidence: "LOW",
      note: `Found a similar business but confidence too low to auto-populate`,
      enrichedFields: {
        enriched_at: new Date(),
        enrichment_note: `Low-confidence match found: "${searchResult.name}" — not auto-populated`,
        enrichment_source: "google_places",
      },
    };
  }

  // Fetch full details for HIGH or MEDIUM confidence matches
  const details = await getPlaceDetails(searchResult.placeId);
  if (!details) {
    return {
      businessId: business.id,
      confidence,
      placeId: searchResult.placeId,
      note: "Found on Places but details unavailable",
      enrichedFields: {
        enriched_at: new Date(),
        enrichment_note: `Found on Google Places (${confidence} confidence) but details unavailable`,
        enrichment_source: "google_places",
      },
    };
  }

  // Build the enriched fields — only fill in MISSING data, never overwrite existing
  const enrichedFields: EnrichmentResult["enrichedFields"] = {
    enriched_at: new Date(),
    enrichment_source: "google_places",
    enrichment_note: `${confidence} confidence match: "${details.name}" at ${details.formattedAddress}`,
    needs_verification: false,
  };

  // Only fill in data the business is missing
  if (!business.phone && details.phone) enrichedFields.phone = details.phone;
  if (!business.website && details.website) enrichedFields.website = details.website;
  if (!business.latitude && details.lat) enrichedFields.latitude = details.lat;
  if (!business.longitude && details.lng) enrichedFields.longitude = details.lng;

  return {
    businessId: business.id,
    confidence,
    placeId: searchResult.placeId,
    note: `${confidence}: found "${details.name}" — phone=${details.phone ?? "none"}, website=${details.website ?? "none"}`,
    enrichedFields,
  };
}

/**
 * Run enrichment on a batch of businesses.
 * Rate-limited to 1 request/second to stay within Google Places free tier.
 * Only processes businesses missing phone OR website (the biggest gaps).
 *
 * @param options.city   Only enrich businesses in this city (e.g. "Houston")
 * @param options.limit  Max number of businesses to process in this run
 * @param options.onProgress  Called after each business with current stats
 */
export async function runEnrichmentBatch(options: {
  city?: string;
  limit?: number;
  skipAlreadyEnriched?: boolean;
  onProgress?: (stats: EnrichmentStats) => void;
}): Promise<EnrichmentStats> {
  const limit = options.limit ?? 50;
  const skipEnriched = options.skipAlreadyEnriched ?? true;

  // Build query to find businesses that need enrichment
  const conditions: string[] = [
    "listing_status = 'active'",
    "(phone IS NULL OR phone = '' OR website IS NULL OR website = '')",
  ];
  const params: unknown[] = [];

  if (options.city) {
    params.push(options.city);
    conditions.push(`LOWER(city) = LOWER($${params.length})`);
  }
  if (skipEnriched) {
    conditions.push("enriched_at IS NULL");
  }

  params.push(limit);
  const query = `
    SELECT id, name, city, state, address, phone, website, latitude, longitude
    FROM businesses
    WHERE ${conditions.join(" AND ")}
    ORDER BY city, name
    LIMIT $${params.length}
  `;

  const { rows } = await pool.query<{
    id: string; name: string; city: string; state: string;
    address: string | null; phone: string | null; website: string | null;
    latitude: number | null; longitude: number | null;
  }>(query, params);

  const stats: EnrichmentStats = {
    total: rows.length,
    enrichedHigh: 0,
    enrichedMedium: 0,
    lowConfidence: 0,
    notFound: 0,
    alreadyComplete: 0,
    errors: 0,
    phonesAdded: 0,
    websitesAdded: 0,
    coordsAdded: 0,
    flaggedForVerification: 0,
  };

  for (const biz of rows) {
    try {
      await sleep(1100); // ~1 req/sec rate limit
      const result = await enrichBusiness(biz);

      // Apply enrichment to DB
      const fields = result.enrichedFields;
      const setClauses: string[] = [];
      const updateParams: unknown[] = [];

      const addField = (col: string, val: unknown) => {
        if (val === undefined) return;
        updateParams.push(val);
        setClauses.push(`${col} = $${updateParams.length}`);
      };

      addField("enriched_at", fields.enriched_at);
      addField("enrichment_note", fields.enrichment_note);
      addField("enrichment_source", fields.enrichment_source);
      addField("needs_verification", fields.needs_verification);
      if (fields.phone) { addField("phone", fields.phone); stats.phonesAdded++; }
      if (fields.website) { addField("website", fields.website); stats.websitesAdded++; }
      if (fields.latitude) { addField("latitude", fields.latitude); }
      if (fields.longitude) { addField("longitude", fields.longitude); stats.coordsAdded++; }

      if (setClauses.length > 0) {
        updateParams.push(biz.id);
        await pool.query(
          `UPDATE businesses SET ${setClauses.join(", ")} WHERE id = $${updateParams.length}`,
          updateParams,
        );
      }

      // Update stats
      if (result.confidence === "HIGH") stats.enrichedHigh++;
      else if (result.confidence === "MEDIUM") stats.enrichedMedium++;
      else if (result.confidence === "LOW") stats.lowConfidence++;
      else stats.notFound++;

      if (fields.needs_verification) stats.flaggedForVerification++;
      options.onProgress?.(stats);
    } catch (err) {
      stats.errors++;
      console.error(`[enrichment] failed for business ${biz.id} (${biz.name}):`, err instanceof Error ? err.message : err);
    }
  }

  return stats;
}

export interface EnrichmentStats {
  total: number;
  enrichedHigh: number;
  enrichedMedium: number;
  lowConfidence: number;
  notFound: number;
  alreadyComplete: number;
  errors: number;
  phonesAdded: number;
  websitesAdded: number;
  coordsAdded: number;
  flaggedForVerification: number;
}
