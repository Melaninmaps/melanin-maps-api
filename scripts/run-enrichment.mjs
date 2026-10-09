/**
 * Google Places research runner — immutable candidate output only.
 *
 * Usage:
 *   node scripts/run-enrichment.mjs [--limit 500] [--city "Atlanta"] [--output ./candidates.jsonl]
 *
 * This script deliberately does not mutate businesses. Google Places data is a
 * third-party research lead; any directory correction requires a fresh profile
 * read, field-level receipt, identity review, and the audited admin path.
 */
import fs from "node:fs";
import pg from "pg";
import {
  assessGooglePlacesIdentity,
  mayAutoApplyGooglePlacesFacts,
} from "./google-places-enrichment-policy.mjs";

const PLACES_NEW_BASE = "https://places.googleapis.com/v1";
const RATE_LIMIT_MS = 1100;
const BATCH_LOG_EVERY = 10;
const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const cityArg = args.indexOf("--city");
const outputArg = args.indexOf("--output");
const LIMIT = limitArg !== -1 ? Number.parseInt(args[limitArg + 1], 10) : 500;
const CITY = cityArg !== -1 ? args[cityArg + 1] : null;
const OUTPUT = outputArg !== -1 ? args[outputArg + 1] : "google-places-enrichment-candidates.jsonl";

if (args.includes("--apply")) {
  console.error("Refusing --apply: Google Places observations are research-only and cannot change directory fields automatically.");
  process.exit(2);
}
if (mayAutoApplyGooglePlacesFacts()) {
  throw new Error("Policy violation: Google Places automatic writes must remain disabled.");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
if (!apiKey) {
  console.error("No GOOGLE_PLACES_SERVER_KEY found");
  process.exit(1);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function searchPlaces(query) {
  try {
    const response = await fetch(`${PLACES_NEW_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.businessStatus",
      },
      body: JSON.stringify({ textQuery: query }),
    });
    const data = await response.json();
    const place = data.places?.[0];
    if (!response.ok || !place) return null;
    return {
      placeId: place.id,
      name: place.displayName?.text ?? "",
      formattedAddress: place.formattedAddress ?? "",
      businessStatus: place.businessStatus ?? "UNKNOWN",
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
    };
  } catch (error) {
    console.warn(`[places] search error: ${error.message}`);
    return null;
  }
}

async function getPlaceDetails(placeId) {
  try {
    const response = await fetch(`${PLACES_NEW_BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,businessStatus,location",
      },
    });
    const data = await response.json();
    if (!response.ok || !data.location) return null;
    return {
      name: data.displayName?.text ?? "",
      formattedAddress: data.formattedAddress ?? "",
      phone: data.nationalPhoneNumber ?? null,
      website: data.websiteUri ?? null,
      hours: data.regularOpeningHours?.weekdayDescriptions ?? null,
      businessStatus: data.businessStatus ?? "UNKNOWN",
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    };
  } catch (error) {
    console.warn(`[places] detail error: ${error.message}`);
    return null;
  }
}

function appendCandidate(stream, candidate) {
  stream.write(`${JSON.stringify(candidate)}\n`);
}

async function main() {
  console.log(`Google Places research-only enrichment — limit=${LIMIT}, city=${CITY ?? "all"}`);
  console.log(`Writing immutable candidates to ${OUTPUT}; automatic mutation is disabled.`);
  const conditions = [
    "listing_status LIKE 'live%'",
    "(phone IS NULL OR phone = '' OR website IS NULL OR website = '' OR hours IS NULL OR hours = '')",
  ];
  const parameters = [];
  if (CITY) {
    parameters.push(CITY);
    conditions.push(`LOWER(city) = LOWER($${parameters.length})`);
  }
  parameters.push(LIMIT);
  const { rows } = await pool.query(
    `SELECT id, name, city, state, address, phone, website, hours, latitude, longitude
       FROM businesses
      WHERE ${conditions.join(" AND ")}
      ORDER BY city, name
      LIMIT $${parameters.length}`,
    parameters,
  );

  const stream = fs.createWriteStream(OUTPUT, { flags: "w" });
  const stats = { total: rows.length, high: 0, review: 0, reject: 0, notFound: 0, closedLead: 0, detailUnavailable: 0, errors: 0 };
  for (let index = 0; index < rows.length; index += 1) {
    const business = rows[index];
    try {
      await sleep(RATE_LIMIT_MS);
      const search = await searchPlaces(`${business.name} ${business.city} ${business.state}`);
      if (!search) {
        stats.notFound += 1;
        appendCandidate(stream, {
          immutableRecordId: business.id,
          observedAt: new Date().toISOString(),
          disposition: "HOLD_NO_GOOGLE_PLACES_MATCH",
          current: business,
          source: null,
          proposed: {},
          policy: "research_only_no_directory_write",
        });
        continue;
      }
      await sleep(RATE_LIMIT_MS);
      const details = await getPlaceDetails(search.placeId);
      if (!details) {
        stats.detailUnavailable += 1;
        appendCandidate(stream, {
          immutableRecordId: business.id,
          observedAt: new Date().toISOString(),
          disposition: "HOLD_GOOGLE_DETAILS_UNAVAILABLE",
          current: business,
          source: { placeId: search.placeId, mapsUrl: `https://maps.google.com/?place_id=${search.placeId}`, search },
          proposed: {},
          policy: "research_only_no_directory_write",
        });
        continue;
      }
      const assessment = assessGooglePlacesIdentity({
        businessName: business.name,
        businessAddress: business.address,
        businessCity: business.city,
        businessState: business.state,
        placeName: details.name,
        placeAddress: details.formattedAddress,
      });
      if (assessment === "HIGH") stats.high += 1;
      else if (assessment === "REVIEW") stats.review += 1;
      else stats.reject += 1;
      if (details.businessStatus === "CLOSED_PERMANENTLY") stats.closedLead += 1;
      appendCandidate(stream, {
        immutableRecordId: business.id,
        observedAt: new Date().toISOString(),
        disposition: details.businessStatus === "CLOSED_PERMANENTLY"
          ? "HOLD_CLOSURE_LEAD_REQUIRES_FIRST_PARTY_REVIEW"
          : assessment === "HIGH"
            ? "REVIEW_WITH_FIRST_PARTY_RECEIPTS"
            : "HOLD_IDENTITY_OR_CONTACT_CONFLICT",
        identityAssessment: assessment,
        current: business,
        source: {
          provider: "google_places",
          placeId: search.placeId,
          mapsUrl: `https://maps.google.com/?place_id=${search.placeId}`,
          search,
          details,
        },
        proposed: {
          phone: details.phone,
          website: details.website,
          hours: details.hours,
          address: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
        },
        policy: "research_only_no_directory_write",
      });
    } catch (error) {
      stats.errors += 1;
      console.error(`Research error on ${business.id}: ${error.message}`);
    }
    if ((index + 1) % BATCH_LOG_EVERY === 0) console.log(`Research progress ${index + 1}/${rows.length}`);
  }
  await new Promise((resolve) => stream.end(resolve));
  await pool.end();
  console.log(JSON.stringify({ ...stats, output: OUTPUT }, null, 2));
}

main().catch(async (error) => {
  console.error(error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
