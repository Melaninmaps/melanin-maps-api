/**
 * One-off script: search Google Places for Houston businesses spotted in a TikTok screenshot
 * (Crave Houston, Ador, Dome, Bad Habits) and insert any HIGH/MEDIUM confidence
 * matches into the businesses table.
 *
 * Usage: node scripts/search-houston-businesses.mjs
 * Requires: GOOGLE_MAPS_API_KEY and DATABASE_URL in env
 */
import pg from "pg";

const BUSINESSES_TO_SEARCH = [
  { name: "Crave Houston", city: "Houston", state: "TX", category: "Food & Drink" },
  { name: "Ador Gray Street", city: "Houston", state: "TX", category: "Entertainment & Nightlife" },
  { name: "Ador Houston", city: "Houston", state: "TX", category: "Entertainment & Nightlife" },
  { name: "Dome Houston", city: "Houston", state: "TX", category: "Entertainment & Nightlife" },
  { name: "Bad Habits Houston", city: "Houston", state: "TX", category: "Entertainment & Nightlife" },
  { name: "Bad Habits Bar Houston", city: "Houston", state: "TX", category: "Entertainment & Nightlife" },
];

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const DB_URL = process.env.DATABASE_URL;

if (!API_KEY) { console.error("GOOGLE_MAPS_API_KEY not set"); process.exit(1); }
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false }, max: 2 });

async function searchPlaces(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.status !== "OK" || !data.results.length) return null;
  const r = data.results[0];
  return { placeId: r.place_id, name: r.name, address: r.formatted_address, lat: r.geometry.location.lat, lng: r.geometry.location.lng, status: r.business_status ?? "UNKNOWN" };
}

async function getDetails(placeId) {
  const fields = "name,formatted_address,formatted_phone_number,website,business_status,geometry";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.status !== "OK") return null;
  const r = data.result;
  return { name: r.name, address: r.formatted_address, phone: r.formatted_phone_number, website: r.website, status: r.business_status };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seen = new Set(); // track business names we've already inserted this run

for (const biz of BUSINESSES_TO_SEARCH) {
  const query = `${biz.name} ${biz.city} ${biz.state}`;
  console.log(`\nSearching: "${query}"`);

  const found = await searchPlaces(query);
  if (!found) { console.log("  → Not found on Google Places"); continue; }
  if (found.status === "CLOSED_PERMANENTLY") { console.log(`  → Permanently closed: ${found.name}`); continue; }

  // Dedup — if we already inserted this name in this run, skip
  const nameKey = found.name.toLowerCase().trim();
  if (seen.has(nameKey)) { console.log(`  → Already inserted ${found.name} in this run — skipping duplicate query`); continue; }

  console.log(`  Found: ${found.name}`);
  console.log(`  Address: ${found.address}`);
  console.log(`  Status: ${found.status}`);

  await sleep(500);
  const details = await getDetails(found.placeId);

  // Confidence: name similarity
  const nameLower = biz.name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const foundLower = found.name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const addressLower = found.address.toLowerCase();
  const nameMatch = foundLower.includes(nameLower.split(" ")[0]) || nameLower.includes(foundLower.split(" ")[0]);
  const cityMatch = addressLower.includes("houston") || addressLower.includes("tx");
  const confidence = nameMatch && cityMatch ? "HIGH" : nameMatch || cityMatch ? "MEDIUM" : "LOW";

  console.log(`  Confidence: ${confidence}`);
  console.log(`  Phone: ${details?.phone ?? "none"}`);
  console.log(`  Website: ${details?.website ?? "none"}`);

  if (confidence === "LOW") { console.log("  → Skipping (low confidence)"); continue; }

  // Check if already exists
  const { rows: existing } = await pool.query(
    `SELECT id FROM businesses WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2)`,
    [found.name, biz.city]
  );
  if (existing.length > 0) {
    console.log(`  → Already in DB (id=${existing[0].id})`);
    seen.add(nameKey);
    continue;
  }

  // Insert
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO businesses (
      id, name, address, city, state, category, phone, website,
      latitude, longitude, listing_status, verified, black_owned,
      enrichment_source, enriched_at, enrichment_note, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      'active', false, false,
      'google_places', NOW(), $11, NOW(), NOW()
    )`,
    [
      id,
      found.name,
      found.address,
      biz.city,
      biz.state,
      biz.category,
      details?.phone ?? null,
      details?.website ?? null,
      found.lat,
      found.lng,
      `${confidence} confidence match from Google Places. Added Aug 2026 after founder spotted in TikTok.`,
    ]
  );
  console.log(`  ✅ Inserted: ${found.name} (id=${id})`);
  seen.add(nameKey);
  await sleep(1000);
}

await pool.end();
console.log("\nDone.");
