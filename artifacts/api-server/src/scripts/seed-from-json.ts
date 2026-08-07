/**
 * Seeds cultural_sites from the Manus JSON extraction diff result.
 * Reads /tmp/missing_entities.json (Python diff output — entities not yet in DB).
 * Uses SELECT-first dedup (matches existing seed pattern), batch of 50 per cycle.
 *
 * Usage: tsx artifacts/api-server/src/scripts/seed-from-json.ts
 */
import pg from "pg";
import { readFileSync } from "fs";

interface JsonEntity {
  name: string;
  city: string;
  state: string;
  address?: string;
  description?: string;
  pin_type: string;
  culturalCommunity?: string;
  visit_tip?: string;
  source_city_key: string;
}

/** Map pin_type → category (NOT NULL in schema) */
function toCategory(pinType: string): string {
  switch (pinType) {
    case "business":         return "business";
    case "cultural_site":   return "museum";
    case "community_org":   return "cultural_organization";
    case "festival_or_event": return "festival";
    case "heritage_district": return "neighborhood";
    case "market":          return "market";
    case "farmers_market":  return "market";
    case "pop_up_market":   return "market";
    case "church":          return "religious";
    case "HBCU":            return "education";
    case "university":      return "education";
    case "mural_or_public_art": return "public_art";
    case "park_or_outdoor": return "park";
    default:                return "cultural_site";
  }
}

const LIVE_UNCLAIMED_CITIES = new Set(["philadelphia"]);

async function main() {
  const dbUrl = readFileSync("/tmp/railway_db_url.txt", "utf8").trim();
  if (!dbUrl) throw new Error("No DATABASE_URL in /tmp/railway_db_url.txt");

  const payload = JSON.parse(
    readFileSync("/tmp/missing_entities.json", "utf8")
  ) as { entities: JsonEntity[] };

  const entities = payload.entities;
  console.log(`\n🌍 Manus JSON Seeder — ${entities.length} entities\n`);

  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  // Ensure new columns exist (idempotent)
  await pool.query(`
    ALTER TABLE cultural_sites
      ADD COLUMN IF NOT EXISTS content_note TEXT,
      ADD COLUMN IF NOT EXISTS practical_tips TEXT
  `);

  // Load all existing (lower(name)||lower(city)) keys in one query
  const existingResult = await pool.query(
    "SELECT LOWER(name)||'||'||LOWER(city) AS key FROM cultural_sites"
  );
  const existingKeys = new Set<string>(existingResult.rows.map((r: any) => r.key));
  console.log(`Existing in DB: ${existingKeys.size}`);

  // Filter to truly-new entities only
  const toInsert = entities.filter((e) =>
    !existingKeys.has(e.name.toLowerCase() + "||" + e.city.toLowerCase())
  );
  console.log(`Truly new to insert: ${toInsert.length}\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH = 50;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);

    // Build parallel inserts for the batch
    const promises = batch.map(async (e) => {
      const listing_status = LIVE_UNCLAIMED_CITIES.has(e.city.toLowerCase())
        ? "live_unclaimed"
        : "staged";

      const category = toCategory(e.pin_type);
      const description = e.description || e.name; // fallback to name if empty
      const content_note = e.culturalCommunity
        ? `Cultural community: ${e.culturalCommunity}`
        : null;

      try {
        await pool.query(
          `INSERT INTO cultural_sites (
            name, description, category, city, state, address,
            pin_type, visit_tip, listing_status, data_source,
            is_verified, approximate_location, content_note, created_at, country
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,false,$11,NOW(),'US')`,
          [
            e.name, description, category, e.city, e.state,
            e.address ?? null, e.pin_type, e.visit_tip ?? null,
            listing_status, "manus_json_extraction",
            content_note,
          ]
        );
        inserted++;
        process.stdout.write(".");
      } catch (err: any) {
        errors++;
        process.stdout.write("E");
        console.error(`\n❌ "${e.name}" (${e.city}): ${err.message}`);
      }
    });

    await Promise.all(promises);

    // Progress checkpoint every batch
    if ((i + BATCH) % 200 === 0 || i + BATCH >= toInsert.length) {
      console.log(`\n  [${i + Math.min(BATCH, toInsert.length - i)}/${toInsert.length}] +${inserted} inserted, ${errors} errors`);
    }
  }

  await pool.end();

  console.log(`\n\n✅ Done.`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (already existed): ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Total processed: ${toInsert.length}`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
