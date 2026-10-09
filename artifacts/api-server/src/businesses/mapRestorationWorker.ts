import { createHash, randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import type { Pool, PoolClient } from "pg";
import { isAdmin } from "../lib/adminAuth";

export const FOUNDER_MAP_RESTORATION_POLICY_VERSION =
  "founder-map-restoration-v2" as const;
export const FOUNDER_MAP_RESTORATION_ACTOR =
  "founder-authorized-map-restoration-2026-10-09" as const;

/**
 * The Census geocoder is an approved public geocoding source. Its address-range
 * result is accepted only when every map-identifying component exactly matches
 * the pre-existing canonical stored address; it is never a city-centre fallback.
 */
const CENSUS_GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
const CENSUS_GEOCODER_SOURCE_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json";
const MIN_REQUEST_INTERVAL_MS = 300;

export type MapRestorationOutcome =
  | "published"
  | "missing_complete_stored_address"
  | "geocoder_unavailable"
  | "geocoder_no_exact_match"
  | "geocoder_error"
  | "candidate_changed"
  | "reconciliation_ledger_missing";

export type MapRestorationCandidate = Readonly<{
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}>;

type PhysicalAddress = Readonly<{
  queryAddress: string;
  fingerprint: string;
  houseNumber: string;
  directional: string | null;
  streetName: string;
  streetType: string;
  city: string;
  state: string;
  postalCode: string;
}>;

type CensusGeocodeResult = Readonly<{
  matchedAddress?: string;
  coordinates?: Readonly<{ x?: number; y?: number }>;
  addressComponents?: Readonly<{
    fromAddress?: string;
    preDirection?: string;
    streetName?: string;
    suffixType?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>;
}>;

type GeocodedLocation = Readonly<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
  locationType: string;
  components: Readonly<{
    houseNumber: string;
    directional: string | null;
    streetName: string;
    streetType: string;
    city: string;
    state: string;
    postalCode: string;
  }>;
}>;

type WorkerLogger = Readonly<{
  info: (data: Record<string, unknown>, message?: string) => void;
  warn: (data: Record<string, unknown>, message?: string) => void;
  error: (data: Record<string, unknown>, message?: string) => void;
}>;

const STATE_NAMES: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
  DC: "district of columbia",
};

const DIRECTIONALS: Record<string, string> = {
  n: "north",
  north: "north",
  s: "south",
  south: "south",
  e: "east",
  east: "east",
  w: "west",
  west: "west",
};

const STREET_TYPES: Record<string, string> = {
  st: "street",
  street: "street",
  ave: "avenue",
  avenue: "avenue",
  rd: "road",
  road: "road",
  blvd: "boulevard",
  boulevard: "boulevard",
  dr: "drive",
  drive: "drive",
  ln: "lane",
  lane: "lane",
  ct: "court",
  court: "court",
  pl: "place",
  place: "place",
  pkwy: "parkway",
  parkway: "parkway",
  ter: "terrace",
  terrace: "terrace",
  hwy: "highway",
  highway: "highway",
  cir: "circle",
  circle: "circle",
};

let geocoderTurn: Promise<void> = Promise.resolve();
let lastGeocoderRequestAt = 0;

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalState(value: string | null | undefined): string | null {
  const raw = normalized(value);
  if (!raw) return null;
  const direct = Object.entries(STATE_NAMES).find(
    ([abbreviation]) => abbreviation.toLocaleLowerCase("en-US") === raw,
  );
  if (direct) return direct[1];
  return Object.values(STATE_NAMES).includes(raw) ? raw : null;
}

function canonicalStreetType(value: string | null | undefined): string | null {
  return STREET_TYPES[normalized(value)] ?? null;
}

function canonicalDirectional(value: string | null | undefined): string | null {
  const result = normalized(value);
  return result ? (DIRECTIONALS[result] ?? null) : null;
}

function normalizePostalCode(value: string | null | undefined): string | null {
  const result = (value ?? "").replace(/\s/g, "").trim();
  return /^\d{5}(?:-\d{4})?$/.test(result) ? result : null;
}

function addressFingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function completeStoredAddress(
  candidate: MapRestorationCandidate,
): string | null {
  const address = candidate.address?.trim().replace(/\s+/g, " ");
  if (!address || !/\d/.test(address)) return null;
  const withoutCountry = address.replace(
    /,?\s*(?:USA|US|United States(?: of America)?)\.?$/i,
    "",
  );
  // Some import sources store the complete street, city, state, and ZIP in a
  // single address field. Preserve that exact stored form rather than requiring
  // duplicate city/state/postal columns.
  if (
    /,[^,]+,\s*(?:[A-Za-z]{2}|[A-Za-z ]+)\s*,?\s*\d{5}(?:-\d{4})?\s*$/i.test(
      withoutCountry,
    )
  ) {
    return withoutCountry.replace(
      /,?\s*([A-Z]{2})\s*,\s*(\d{5}(?:-\d{4})?)/i,
      ", $1 $2",
    );
  }
  const city = candidate.city?.trim().replace(/\s+/g, " ");
  const state = candidate.state?.trim();
  const postalCode = normalizePostalCode(candidate.postalCode);
  if (!city || !state || !postalCode) return null;
  const hasCity = normalized(withoutCountry).includes(normalized(city));
  const hasStatePostal =
    new RegExp(
      `${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*${postalCode.slice(0, 5)}`,
      "i",
    ).test(withoutCountry) ||
    new RegExp(
      `${(canonicalState(state) ?? state).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*${postalCode.slice(0, 5)}`,
      "i",
    ).test(withoutCountry);
  return hasCity && hasStatePostal
    ? withoutCountry.replace(
        /,?\s*([A-Z]{2})\s*,\s*(\d{5}(?:-\d{4})?)/i,
        ", $1 $2",
      )
    : `${withoutCountry}, ${city}, ${state} ${postalCode}`;
}

/** Strictly parses a complete U.S. street address. Unit labels are retained in the query but not used as map identity. */
export function parseCompleteStoredPhysicalAddress(
  candidate: MapRestorationCandidate,
): PhysicalAddress | null {
  const queryAddress = completeStoredAddress(candidate);
  if (!queryAddress) return null;
  const normalizedQuery = queryAddress.replace(
    /,\s*([A-Za-z]{2})\s*,\s*(\d{5}(?:-\d{4})?)/,
    ", $1 $2",
  );
  const match = normalizedQuery.match(
    /^\s*(\d+[A-Za-z]?)\s+(?:(N(?:orth)?|S(?:outh)?|E(?:ast)?|W(?:est)?)\.?\s+)?(.+?)\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Parkway|Pkwy|Terrace|Ter|Highway|Hwy|Circle|Cir)\.?\s*(?:(?:,|-)\s*(?:Suite|Ste|Unit|Apt|Apartment|Floor|Fl|#)\s*[^,]+)?\s*,\s*([^,]+?)\s*,\s*([A-Za-z]{2}|[A-Za-z ]+)\s+(\d{5}(?:-\d{4})?)\s*$/i,
  );
  if (!match) return null;
  const houseNumber = normalized(match[1]);
  const directional = canonicalDirectional(match[2] ?? null);
  const streetName = normalized(match[3]);
  const streetType = canonicalStreetType(match[4]);
  const city = normalized(match[5]);
  const state = canonicalState(match[6]);
  const postalCode = normalizePostalCode(match[7]);
  if (
    !houseNumber ||
    !streetName ||
    !streetType ||
    !city ||
    !state ||
    !postalCode
  )
    return null;
  return {
    queryAddress: normalizedQuery,
    fingerprint: addressFingerprint(normalizedQuery),
    houseNumber,
    directional,
    streetName,
    streetType,
    city,
    state,
    postalCode,
  };
}

export function matchingCensusLocation(
  expected: PhysicalAddress,
  result: CensusGeocodeResult,
): GeocodedLocation | null {
  const latitude = Number(result.coordinates?.y);
  const longitude = Number(result.coordinates?.x);
  const components = result.addressComponents;
  const houseNumber = normalized(components?.fromAddress ?? null);
  const directional = canonicalDirectional(components?.preDirection ?? null);
  const streetName = normalized(components?.streetName ?? null);
  const streetType = canonicalStreetType(components?.suffixType ?? null);
  const city = normalized(components?.city ?? null);
  const state = canonicalState(components?.state ?? null);
  const postalCode = normalizePostalCode(components?.zip ?? null);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    houseNumber !== expected.houseNumber ||
    directional !== expected.directional ||
    streetName !== expected.streetName ||
    streetType !== expected.streetType ||
    city !== expected.city ||
    state !== expected.state ||
    postalCode?.slice(0, 5) !== expected.postalCode.slice(0, 5) ||
    !result.matchedAddress
  ) return null;
  return {
    latitude,
    longitude,
    formattedAddress: result.matchedAddress,
    locationType: "CENSUS_ADDRESS_RANGE_INTERPOLATED",
    components: {
      houseNumber,
      directional,
      streetName,
      streetType,
      city,
      state,
      postalCode,
    },
  };
}

async function waitForGeocoderTurn(): Promise<void> {
  const turn = geocoderTurn.then(async () => {
    const wait = Math.max(
      0,
      MIN_REQUEST_INTERVAL_MS - (Date.now() - lastGeocoderRequestAt),
    );
    if (wait) await new Promise<void>((resolve) => setTimeout(resolve, wait));
    lastGeocoderRequestAt = Date.now();
  });
  geocoderTurn = turn.catch(() => undefined);
  await turn;
}

async function geocodeExactAddress(expected: PhysicalAddress): Promise<{
  location: GeocodedLocation | null;
  outcome: MapRestorationOutcome;
  reason: string;
}> {
  try {
    await waitForGeocoderTurn();
    const url = `${CENSUS_GEOCODER_URL}?address=${encodeURIComponent(expected.queryAddress)}&benchmark=Public_AR_Current&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(9_000) });
    if (!response.ok)
      return {
        location: null,
        outcome: "geocoder_error",
        reason: `Census Geocoder returned HTTP ${response.status}.`,
      };
    const payload = (await response.json()) as {
      result?: { addressMatches?: CensusGeocodeResult[] };
    };
    for (const result of payload.result?.addressMatches ?? []) {
      const location = matchingCensusLocation(expected, result);
      if (location)
        return {
          location,
          outcome: "published",
          reason: "Exact Census address-component match.",
        };
    }
    return {
      location: null,
      outcome: "geocoder_no_exact_match",
      reason:
        "No Census result matched the complete stored street, city, state, and ZIP components.",
    };
  } catch (error) {
    return {
      location: null,
      outcome: "geocoder_error",
      reason:
        error instanceof Error
          ? `Census Geocoder request failed: ${error.message}`
          : "Census Geocoder request failed.",
    };
  }
}

async function recordOutcome(
  pool: Pool,
  candidate: MapRestorationCandidate,
  fingerprint: string | null,
  outcome: Exclude<MapRestorationOutcome, "published">,
  reason: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  await pool.query(
    `INSERT INTO business_map_restoration_outcomes
       (business_id, policy_version, address_fingerprint, outcome, reason, details, attempt_count, last_attempt_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, 1, now(), now())
     ON CONFLICT (business_id) DO UPDATE SET
      policy_version = EXCLUDED.policy_version,
      address_fingerprint = EXCLUDED.address_fingerprint,
      outcome = EXCLUDED.outcome,
      reason = EXCLUDED.reason,
      details = EXCLUDED.details,
      attempt_count = business_map_restoration_outcomes.attempt_count + 1,
      last_attempt_at = now(),
       updated_at = now()
     WHERE business_map_restoration_outcomes.outcome <> 'published'`,
    [
      candidate.id,
      FOUNDER_MAP_RESTORATION_POLICY_VERSION,
      fingerprint,
      outcome,
      reason.slice(0, 1600),
      JSON.stringify(details),
    ],
  );
}

async function loadPendingCandidates(
  pool: Pool,
  limit: number,
): Promise<MapRestorationCandidate[]> {
  const { rows } = await pool.query<MapRestorationCandidate>(
    `SELECT b.id, b.name, b.address, b.city, b.state, b.country, b.postal_code AS "postalCode"
       FROM public.public_businesses b
       JOIN public.business_discovery_eligibility e ON e.business_id::text = b.id::text
       LEFT JOIN public.business_map_restoration_outcomes o ON o.business_id::text = b.id::text
      WHERE e.eligibility_status = 'qualified'
        AND e.policy_version = 'documented_diaspora_discovery_v1'
        AND e.identity_evidence_id IS NOT NULL
        AND e.ownership_evidence_id IS NOT NULL
        AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
        AND e.ownership_source_expires_at > CURRENT_TIMESTAMP
        AND e.review_after > CURRENT_TIMESTAMP
       AND e.map_pin_evidence_id IS NULL
       AND NOT EXISTS (
         SELECT 1
           FROM public.business_legacy_map_location_attestations AS legacy_location
          WHERE legacy_location.business_id::text = b.id::text
            AND COALESCE((
              SELECT legacy_event.action
                FROM public.business_legacy_map_location_attestation_events AS legacy_event
               WHERE legacy_event.attestation_id = legacy_location.id
               ORDER BY legacy_event.created_at DESC, legacy_event.id DESC
               LIMIT 1
            ), 'active') <> 'revoked'
       )
       AND (
          o.business_id IS NULL
          OR o.policy_version <> $2
          -- A profile edit changes businesses.updated_at, which makes a prior
          -- exception eligible for a fresh exact-geocode attempt without
          -- relying on an optional database hashing extension.
          OR o.updated_at < b.updated_at
       )
      ORDER BY b.id ASC
      LIMIT $1`,
    [limit, FOUNDER_MAP_RESTORATION_POLICY_VERSION],
  );
  return rows;
}

function responseFingerprint(
  candidate: MapRestorationCandidate,
  parsed: PhysicalAddress | null,
): string | null {
  return (
    parsed?.fingerprint ??
    (candidate.address ||
    candidate.city ||
    candidate.state ||
    candidate.postalCode
      ? addressFingerprint(
          [
            candidate.address,
            candidate.city,
            candidate.state,
            candidate.postalCode,
          ]
            .map((value) => value ?? "")
            .join("|"),
        )
      : null)
  );
}

async function persistMapEvidence(
  client: PoolClient,
  candidate: MapRestorationCandidate,
  expected: PhysicalAddress,
  location: GeocodedLocation,
): Promise<
  "published" | "candidate_changed" | "reconciliation_ledger_missing"
> {
  const current = await client.query<{
    id: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    eligibility: Record<string, unknown>;
    ledger: Record<string, unknown> | null;
  }>(
    `SELECT b.id, b.address, b.city, b.state, b.postal_code,
            to_jsonb(e) AS eligibility, to_jsonb(ledger) AS ledger
       FROM public.businesses b
       JOIN public.public_businesses visible ON visible.id::text = b.id::text
       JOIN public.business_discovery_eligibility e ON e.business_id::text = b.id::text
       LEFT JOIN public.business_directory_reconciliation_ledger ledger ON ledger.business_id::text = b.id::text
      WHERE b.id = $1
        AND e.eligibility_status = 'qualified'
        AND e.policy_version = 'documented_diaspora_discovery_v1'
        AND e.identity_evidence_id IS NOT NULL
        AND e.ownership_evidence_id IS NOT NULL
        AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
        AND e.ownership_source_expires_at > CURRENT_TIMESTAMP
        AND e.review_after > CURRENT_TIMESTAMP
        AND e.map_pin_evidence_id IS NULL
      FOR UPDATE OF b, e`,
    [candidate.id],
  );
  const row = current.rows[0];
  if (!row) return "candidate_changed";
  const currentAddress = parseCompleteStoredPhysicalAddress({
    id: candidate.id,
    name: candidate.name,
    address: row.address,
    city: row.city,
    state: row.state,
    country: candidate.country,
    postalCode: row.postal_code,
  });
  if (!currentAddress || currentAddress.fingerprint !== expected.fingerprint)
    return "candidate_changed";
  if (!row.ledger) return "reconciliation_ledger_missing";

  const addressEvidenceId = randomUUID();
  const mapEvidenceId = randomUUID();
  const observedAt = new Date().toISOString();
  const addressEvidence = {
    address: expected.queryAddress,
    addressType: "physical",
    isServiceArea: false,
    identityMatch: true,
    matchingSignals: ["address"],
    verificationMethod: "existing_stored_address_exact_census_component_match",
  };
  const mapEvidence = {
    queryAddress: expected.queryAddress,
    formattedAddress: location.formattedAddress,
    addressComponents: location.components,
    latitude: location.latitude,
    longitude: location.longitude,
    locationType: location.locationType,
    addressMatch: true,
  };
  const addressHash = addressFingerprint(
    `${FOUNDER_MAP_RESTORATION_POLICY_VERSION}|${candidate.id}|address|${JSON.stringify(addressEvidence)}`,
  );
  const mapHash = addressFingerprint(
    `${FOUNDER_MAP_RESTORATION_POLICY_VERSION}|${candidate.id}|map_pin|${JSON.stringify(mapEvidence)}`,
  );
  const reason =
    "Founder-authorized map restoration: an existing complete stored physical address exactly matched Census Geocoder address components. Existing documented identity, ownership, official-presence eligibility, business fields, and lifecycle were retained.";

  await client.query(
    `INSERT INTO business_profile_evidence_receipts
       (id, business_id, field_name, source_kind, source_url, source_label, observed_at, confidence, observed_value, source_sha256, captured_by)
     VALUES
       ($1, $2, 'address', 'official_geocoder', $3, $4, $5::timestamptz, 'high', $6::jsonb, $7, $8),
       ($9, $2, 'map_pin', 'official_geocoder', $3, $10, $5::timestamptz, 'high', $11::jsonb, $12, $8)`,
    [
      addressEvidenceId,
      candidate.id,
      CENSUS_GEOCODER_SOURCE_URL,
      "Census Geocoder exact match for stored physical address",
      observedAt,
      JSON.stringify(addressEvidence),
      addressHash,
      FOUNDER_MAP_RESTORATION_ACTOR,
      mapEvidenceId,
      "Census Geocoder audited map coordinate",
      JSON.stringify(mapEvidence),
      mapHash,
    ],
  );
  await client.query(
    `UPDATE businesses
        SET latitude = $2::numeric, longitude = $3::numeric, updated_at = now()
      WHERE id = $1`,
    [candidate.id, String(location.latitude), String(location.longitude)],
  );
  const nextEligibility = await client.query<{
    state: Record<string, unknown>;
  }>(
    `UPDATE business_discovery_eligibility
        SET address_evidence_id = $2::uuid, map_pin_evidence_id = $3::uuid, updated_at = now()
      WHERE business_id = $1
      RETURNING to_jsonb(business_discovery_eligibility) AS state`,
    [candidate.id, addressEvidenceId, mapEvidenceId],
  );
  await client.query(
    `INSERT INTO business_discovery_eligibility_audit_events
       (id, business_id, action, actor_id, reason, before_state, after_state)
     VALUES ($1, $2, 'map_pin_attached', $3, $4, $5::jsonb, $6::jsonb)`,
    [
      randomUUID(),
      candidate.id,
      FOUNDER_MAP_RESTORATION_ACTOR,
      reason,
      JSON.stringify(row.eligibility),
      JSON.stringify(nextEligibility.rows[0]?.state ?? {}),
    ],
  );
  const nextLedger = await client.query<{ state: Record<string, unknown> }>(
    `UPDATE business_directory_reconciliation_ledger
        SET evidence_receipt_ids = COALESCE(evidence_receipt_ids, '[]'::jsonb) || $2::jsonb,
            updated_at = now()
      WHERE business_id = $1
      RETURNING to_jsonb(business_directory_reconciliation_ledger) AS state`,
    [candidate.id, JSON.stringify([addressEvidenceId, mapEvidenceId])],
  );
  await client.query(
    `INSERT INTO business_directory_reconciliation_audit_events
       (id, business_id, action, actor_user_id, reason_code, reason, evidence_receipt_ids, before_state, after_state)
     VALUES ($1, $2, 'review', $3, 'source_ownership_and_official_presence_verified', $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
    [
      randomUUID(),
      candidate.id,
      FOUNDER_MAP_RESTORATION_ACTOR,
      reason,
      JSON.stringify([addressEvidenceId, mapEvidenceId]),
      JSON.stringify(row.ledger),
      JSON.stringify(nextLedger.rows[0]?.state ?? {}),
    ],
  );
  await client.query(
    `INSERT INTO business_map_restoration_outcomes
       (business_id, policy_version, address_fingerprint, outcome, reason, details, attempt_count, last_attempt_at, updated_at)
     VALUES ($1, $2, $3, 'published', $4, $5::jsonb, 1, now(), now())
     ON CONFLICT (business_id) DO UPDATE SET
       policy_version = EXCLUDED.policy_version,
       address_fingerprint = EXCLUDED.address_fingerprint,
       outcome = EXCLUDED.outcome,
       reason = EXCLUDED.reason,
       details = EXCLUDED.details,
       attempt_count = business_map_restoration_outcomes.attempt_count + 1,
       last_attempt_at = now(),
       updated_at = now()`,
    [
      candidate.id,
      FOUNDER_MAP_RESTORATION_POLICY_VERSION,
      expected.fingerprint,
      reason,
      JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        locationType: location.locationType,
      }),
    ],
  );
  return "published";
}

async function processCandidate(
  pool: Pool,
  candidate: MapRestorationCandidate,
  environment: NodeJS.ProcessEnv,
): Promise<MapRestorationOutcome> {
  const expected = parseCompleteStoredPhysicalAddress(candidate);
  const fingerprint = responseFingerprint(candidate, expected);
  if (!expected) {
    await recordOutcome(
      pool,
      candidate,
      fingerprint,
      "missing_complete_stored_address",
      "No complete U.S. stored street address with city, state, and ZIP was available for exact geocoding.",
    );
    return "missing_complete_stored_address";
  }
  const geocoded = await geocodeExactAddress(expected);
  if (!geocoded.location) {
    const outcome =
      geocoded.outcome === "published" ? "geocoder_error" : geocoded.outcome;
    await recordOutcome(
      pool,
      candidate,
      expected.fingerprint,
      outcome,
      geocoded.reason,
      { queryAddress: expected.queryAddress },
    );
    return outcome;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await persistMapEvidence(
      client,
      candidate,
      expected,
      geocoded.location,
    );
    if (result === "published") {
      await client.query("COMMIT");
      return "published";
    }
    await client.query("ROLLBACK");
    await recordOutcome(
      pool,
      candidate,
      expected.fingerprint,
      result,
      result === "candidate_changed"
        ? "The business record or its current Kinfolk eligibility changed while this map pin was being prepared."
        : "A reconciliation ledger row was not available for this current Kinfolk record.",
    );
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    await recordOutcome(
      pool,
      candidate,
      expected.fingerprint,
      "geocoder_error",
      error instanceof Error
        ? `Map evidence transaction failed: ${error.message}`
        : "Map evidence transaction failed.",
    );
    return "geocoder_error";
  } finally {
    client.release();
  }
}

export async function processFounderMapRestorationBatch(
  pool: Pool,
  environment: NodeJS.ProcessEnv = process.env,
  requestedLimit = 25,
): Promise<Record<MapRestorationOutcome | "processed", number>> {
  const limit = Math.max(1, Math.min(100, Math.trunc(requestedLimit) || 25));
  const candidates = await loadPendingCandidates(pool, limit);
  const results: Record<MapRestorationOutcome | "processed", number> = {
    processed: 0,
    published: 0,
    missing_complete_stored_address: 0,
    geocoder_unavailable: 0,
    geocoder_no_exact_match: 0,
    geocoder_error: 0,
    candidate_changed: 0,
    reconciliation_ledger_missing: 0,
  };
  for (const candidate of candidates) {
    const outcome = await processCandidate(pool, candidate, environment);
    results.processed += 1;
    results[outcome] += 1;
  }
  return results;
}

export function startFounderMapRestorationWorker(
  pool: Pool,
  logger: WorkerLogger,
  environment: NodeJS.ProcessEnv = process.env,
): (() => void) | null {
  if (environment.MAP_RESTORATION_WORKER_ENABLED !== "1") return null;
  const batchSize = Math.max(
    1,
    Math.min(
      100,
      Number.parseInt(environment.MAP_RESTORATION_BATCH_SIZE ?? "25", 10) || 25,
    ),
  );
  let stopped = false;
  let active = false;
  const run = async () => {
    if (stopped || active) return;
    active = true;
    try {
      const result = await processFounderMapRestorationBatch(
        pool,
        environment,
        batchSize,
      );
      if (result.processed > 0)
        logger.info(
          { ...result, policyVersion: FOUNDER_MAP_RESTORATION_POLICY_VERSION },
          "Founder map restoration batch completed",
        );
    } catch (error) {
      logger.error({ error }, "Founder map restoration batch failed");
    } finally {
      active = false;
    }
  };
  void run();
  const timer = setInterval(() => {
    void run();
  }, 3_000);
  timer.unref();
  logger.info(
    { batchSize, policyVersion: FOUNDER_MAP_RESTORATION_POLICY_VERSION },
    "Founder map restoration worker started",
  );
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

function requireAdmin(req: Request, res: Response): boolean {
  if (isAdmin(req)) return true;
  res
    .status((req as any).user?.id ? 403 : 401)
    .json({ error: "Administrator access required" });
  return false;
}

export function registerFounderMapRestorationRoutes(
  app: Express,
  pool: Pool,
): void {
  app.get("/api/admin/map-restoration/status", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const [catalog, outcomes] = await Promise.all([
        pool.query<{
          total: string;
          mapped: string;
          awaitingMapEvidence: string;
        }>(
          `SELECT COUNT(*)::text AS total,
                  COUNT(*) FILTER (WHERE e.map_pin_evidence_id IS NOT NULL)::text AS mapped,
                  COUNT(*) FILTER (WHERE e.map_pin_evidence_id IS NULL)::text AS "awaitingMapEvidence"
             FROM public.public_businesses b
             JOIN public.business_discovery_eligibility e ON e.business_id::text = b.id::text
            WHERE e.eligibility_status = 'qualified'
              AND e.policy_version = 'documented_diaspora_discovery_v1'
              AND e.identity_evidence_id IS NOT NULL
              AND e.ownership_evidence_id IS NOT NULL
              AND (e.official_website_evidence_id IS NOT NULL OR e.official_social_evidence_id IS NOT NULL)
              AND e.ownership_source_expires_at > CURRENT_TIMESTAMP
              AND e.review_after > CURRENT_TIMESTAMP`,
        ),
        pool.query<{ outcome: MapRestorationOutcome; total: string }>(
          `SELECT outcome, COUNT(*)::text AS total
             FROM business_map_restoration_outcomes
            WHERE policy_version = $1
            GROUP BY outcome
            ORDER BY outcome`,
          [FOUNDER_MAP_RESTORATION_POLICY_VERSION],
        ),
      ]);
      res.json({
        policyVersion: FOUNDER_MAP_RESTORATION_POLICY_VERSION,
        catalog: catalog.rows[0] ?? {
          total: "0",
          mapped: "0",
          awaitingMapEvidence: "0",
        },
        outcomes: outcomes.rows.map((row) => ({
          outcome: row.outcome,
          total: Number(row.total),
        })),
      });
    } catch (error) {
      req.log.error({ error }, "Failed to read founder map restoration status");
      res.status(500).json({ error: "Failed to read map restoration status" });
    }
  });
}
