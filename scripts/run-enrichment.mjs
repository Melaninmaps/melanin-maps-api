/**
 * Run Google Places enrichment directly against the database.
 * Usage: node scripts/run-enrichment.mjs [--limit 500] [--city "Atlanta"]
 *
 * Reads GOOGLE_PLACES_SERVER_KEY + DATABASE_URL from environment.
 * Rate-limited to ~1 req/sec to respect Google Places free tier.
 */

import pg from "pg";

const PLACES_NEW_BASE = "https://places.googleapis.com/v1";
const RATE_LIMIT_MS   = 1100; // 1 req/sec + buffer
const BATCH_LOG_EVERY = 10;   // log progress every N businesses

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const cityArg  = args.indexOf("--city");
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : 500;
const CITY  = cityArg  !== -1 ? args[cityArg + 1] : null;

// ── DB ────────────────────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

// ── API key ───────────────────────────────────────────────────────────────────
const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
if (!apiKey) { console.error("❌  No GOOGLE_PLACES_SERVER_KEY found"); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Places API (New) helpers ──────────────────────────────────────────────────
async function searchPlaces(query) {
  const fieldMask = "places.id,places.displayName,places.formattedAddress,places.location,places.businessStatus";
  try {
    const resp = await fetch(`${PLACES_NEW_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({ textQuery: query }),
    });
    const data = await resp.json();
    if (data.error) { console.warn(`  [places] searchText error: ${data.error.message}`); return null; }
    if (!data.places?.length) return null;
    const r = data.places[0];
    return {
      placeId: r.id,
      name: r.displayName?.text ?? "",
      formattedAddress: r.formattedAddress ?? "",
      lat: r.location?.latitude ?? 0,
      lng: r.location?.longitude ?? 0,
      businessStatus: r.businessStatus ?? "UNKNOWN",
    };
  } catch (e) { console.warn(`  [places] fetch error: ${e.message}`); return null; }
}

async function getPlaceDetails(placeId) {
  const fieldMask = "displayName,formattedAddress,nationalPhoneNumber,websiteUri,regularOpeningHours,businessStatus,location";
  try {
    const resp = await fetch(`${PLACES_NEW_BASE}/places/${encodeURIComponent(placeId)}`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });
    const data = await resp.json();
    if (data.error) { console.warn(`  [places] details error: ${data.error.message}`); return null; }
    if (!data.location) return null;
    return {
      name: data.displayName?.text ?? "",
      formattedAddress: data.formattedAddress ?? "",
      phone: data.nationalPhoneNumber ?? null,
      website: data.websiteUri ?? null,
      hours: data.regularOpeningHours?.weekdayDescriptions ?? null,
      businessStatus: data.businessStatus ?? "UNKNOWN",
      lat: data.location.latitude,
      lng: data.location.longitude,
    };
  } catch (e) { console.warn(`  [places] fetch error: ${e.message}`); return null; }
}

// ── Confidence scoring ────────────────────────────────────────────────────────
function calcConfidence(dbName, dbCity, dbState, placeName, placeAddr) {
  const norm = s => (s ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const dbN = norm(dbName), pN = norm(placeName), pA = norm(placeAddr);
  const cityN = norm(dbCity), stateN = norm(dbState);
  const nameMatch = pN === dbN || pN.includes(dbN) || dbN.includes(pN);
  const locMatch  = pA.includes(cityN) || pA.includes(stateN);
  if (nameMatch && locMatch) return "HIGH";
  if (nameMatch || locMatch) return "MEDIUM";
  return "LOW";
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🗺️  MWM Business Enrichment — Places API (New)`);
  console.log(`   Limit: ${LIMIT} | City filter: ${CITY ?? "all cities"}\n`);

  // Fetch businesses needing enrichment
  const conditions = [
    "listing_status LIKE 'live%'",
    "enriched_at IS NULL",
    "(phone IS NULL OR phone = '' OR website IS NULL OR website = '' OR hours IS NULL OR hours = '')",
  ];
  const params = [];
  if (CITY) { params.push(CITY); conditions.push(`LOWER(city) = LOWER($${params.length})`); }
  params.push(LIMIT);

  const { rows } = await pool.query(
    `SELECT id, name, city, state, address, phone, website, hours, latitude, longitude
     FROM businesses
     WHERE ${conditions.join(" AND ")}
     ORDER BY city, name
     LIMIT $${params.length}`,
    params
  );

  console.log(`📋 Found ${rows.length} businesses to enrich\n`);

  const stats = { total: rows.length, high: 0, medium: 0, low: 0, notFound: 0, errors: 0,
    phonesAdded: 0, websitesAdded: 0, hoursAdded: 0, coordsAdded: 0, closedFlagged: 0 };

  const startTime = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const biz = rows[i];
    const idx = i + 1;

    try {
      await sleep(RATE_LIMIT_MS);

      // Search
      const query = `${biz.name} ${biz.city} ${biz.state}`;
      const found = await searchPlaces(query);

      if (!found) {
        stats.notFound++;
        await pool.query(
          `UPDATE businesses SET enriched_at = NOW(), enrichment_source = 'google_places_new',
           enrichment_note = 'Not found on Google Places', needs_verification = true WHERE id = $1`,
          [biz.id]
        );
        if (idx % BATCH_LOG_EVERY === 0) logProgress(idx, stats, startTime);
        continue;
      }

      if (found.businessStatus === "CLOSED_PERMANENTLY") {
        stats.closedFlagged++;
        await pool.query(
          `UPDATE businesses SET enriched_at = NOW(), enrichment_source = 'google_places_new',
           enrichment_note = 'Google Places: permanently closed', needs_verification = true WHERE id = $1`,
          [biz.id]
        );
        if (idx % BATCH_LOG_EVERY === 0) logProgress(idx, stats, startTime);
        continue;
      }

      const confidence = calcConfidence(biz.name, biz.city, biz.state, found.name, found.formattedAddress);

      if (confidence === "LOW") {
        stats.low++;
        await pool.query(
          `UPDATE businesses SET enriched_at = NOW(), enrichment_source = 'google_places_new',
           enrichment_note = $1 WHERE id = $2`,
          [`Low-confidence match: "${found.name}" — not auto-populated`, biz.id]
        );
        if (idx % BATCH_LOG_EVERY === 0) logProgress(idx, stats, startTime);
        continue;
      }

      // Get full details for HIGH / MEDIUM
      await sleep(RATE_LIMIT_MS);
      const details = await getPlaceDetails(found.placeId);

      if (!details) {
        stats.notFound++;
        await pool.query(
          `UPDATE businesses SET enriched_at = NOW(), enrichment_source = 'google_places_new',
           enrichment_note = 'Found but details unavailable' WHERE id = $1`,
          [biz.id]
        );
        if (idx % BATCH_LOG_EVERY === 0) logProgress(idx, stats, startTime);
        continue;
      }

      // Build update — only fill MISSING fields, never overwrite existing
      const setClauses = [
        "enriched_at = NOW()",
        "enrichment_source = 'google_places_new'",
        `enrichment_note = $1`,
      ];
      const updateParams = [
        `${confidence} match: "${details.name}" @ ${details.formattedAddress}`,
      ];

      const addField = (col, existing, value) => {
        if (!existing && value) {
          updateParams.push(value);
          setClauses.push(`${col} = $${updateParams.length}`);
          return true;
        }
        return false;
      };

      if (addField("phone", biz.phone, details.phone))   stats.phonesAdded++;
      if (addField("website", biz.website, details.website)) stats.websitesAdded++;

      // Hours: convert array to JSON string (column is TEXT — no length limit)
      if ((!biz.hours) && details.hours?.length) {
        const hoursJson = JSON.stringify(details.hours);
        updateParams.push(hoursJson);
        setClauses.push(`hours = $${updateParams.length}`);
        stats.hoursAdded++;
      }

      // Coords: only if missing
      if (!biz.latitude && details.lat) {
        updateParams.push(details.lat);
        setClauses.push(`latitude = $${updateParams.length}`);
        updateParams.push(details.lng);
        setClauses.push(`longitude = $${updateParams.length}`);
        stats.coordsAdded++;
      }

      updateParams.push(biz.id);
      await pool.query(
        `UPDATE businesses SET ${setClauses.join(", ")} WHERE id = $${updateParams.length}`,
        updateParams
      );

      if (confidence === "HIGH") stats.high++;
      else stats.medium++;

    } catch (err) {
      stats.errors++;
      console.error(`  ❌ Error on "${biz.name}" (${biz.city}): ${err.message}`);
    }

    if (idx % BATCH_LOG_EVERY === 0) logProgress(idx, stats, startTime);
  }

  await pool.end();

  // Final report
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n${"─".repeat(60)}`);
  console.log(`✅  Enrichment complete — ${rows.length} businesses processed in ${elapsed}s`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  HIGH confidence matches:   ${stats.high}`);
  console.log(`  MEDIUM confidence matches: ${stats.medium}`);
  console.log(`  LOW confidence (skipped):  ${stats.low}`);
  console.log(`  Not found on Places:       ${stats.notFound}`);
  console.log(`  Permanently closed:        ${stats.closedFlagged}`);
  console.log(`  Errors:                    ${stats.errors}`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  📞 Phone numbers added:    ${stats.phonesAdded}`);
  console.log(`  🌐 Websites added:         ${stats.websitesAdded}`);
  console.log(`  🕐 Hours added:            ${stats.hoursAdded}`);
  console.log(`  📍 Coordinates added:      ${stats.coordsAdded}`);
  console.log(`${"─".repeat(60)}\n`);
}

function logProgress(idx, stats, startTime) {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const pct = Math.round((idx / stats.total) * 100);
  const eta  = elapsed > 0 ? Math.round((elapsed / idx) * (stats.total - idx)) : "?";
  console.log(
    `  [${idx}/${stats.total} ${pct}%] phones:${stats.phonesAdded} web:${stats.websitesAdded} hours:${stats.hoursAdded} | ~${eta}s left`
  );
}

main().catch(err => { console.error(err); process.exit(1); });
