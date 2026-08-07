/**
 * Seeds 509 content opportunities from attached_assets/5_1786075268328.json
 * into cultural_sites as map pins.
 *
 * Requires: Railway Postgres public URL in /tmp/railway_db_url.txt
 * Usage: tsx artifacts/api-server/src/scripts/seed-content-opportunities.ts
 */
import pg from "pg";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ContentOpportunity {
  city: string;
  state: string;
  name: string;
  opportunity_description: string;
  timing: string;
  type: string;
  source_city_key: string;
}

function toCategory(type: string): string {
  switch (type) {
    case "festival":      return "festival";
    case "event":         return "event";
    case "farmers_market":return "market";
    case "pop_up_market": return "market";
    case "market":        return "market";
    case "recurring":     return "community_event";
    case "ongoing":       return "community_event";
    case "seasonal":      return "community_event";
    case "community_org": return "cultural_organization";
    default:              return "community_event";
  }
}

function toPinType(type: string): string {
  switch (type) {
    case "festival":      return "festival_or_event";
    case "event":         return "festival_or_event";
    case "farmers_market":return "farmers_market";
    case "pop_up_market": return "pop_up_market";
    case "market":        return "market";
    case "recurring":     return "festival_or_event";
    case "ongoing":       return "community_org";
    case "seasonal":      return "festival_or_event";
    case "community_org": return "community_org";
    default:              return "festival_or_event";
  }
}

const LIVE_UNCLAIMED_CITIES = new Set(["philadelphia"]);

async function main() {
  const dbUrl = readFileSync("/tmp/railway_db_url.txt", "utf8").trim();
  if (!dbUrl) throw new Error("No DATABASE_URL");

  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  const opportunities: ContentOpportunity[] = JSON.parse(
    readFileSync(
      path.resolve(__dirname, "../../../../attached_assets/5_1786075268328.json"),
      "utf8"
    )
  );

  console.log(`\n🎉  Content Opportunities Seeder — ${opportunities.length} entries\n`);

  // Load existing keys to avoid duplicates
  const existingRes = await pool.query(
    "SELECT LOWER(name)||'||'||LOWER(city) AS key FROM cultural_sites"
  );
  const existingKeys = new Set<string>(existingRes.rows.map((r: any) => r.key));
  console.log(`Existing cultural_sites: ${existingKeys.size}`);

  const toInsert = opportunities.filter(
    (o) => !existingKeys.has(o.name.toLowerCase() + "||" + o.city.toLowerCase())
  );
  console.log(`New to insert: ${toInsert.length}\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH = 50;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);

    const promises = batch.map(async (o) => {
      const listing_status = LIVE_UNCLAIMED_CITIES.has(o.city.toLowerCase())
        ? "live_unclaimed"
        : "staged";
      const category = toCategory(o.type);
      const pin_type = toPinType(o.type);
      // Timing info → visit_tip so users know when to go
      const visit_tip = o.timing || null;
      const description = o.opportunity_description || o.name;

      try {
        await pool.query(
          `INSERT INTO cultural_sites
            (name, description, category, city, state, pin_type,
             visit_tip, listing_status, data_source,
             is_verified, approximate_location, created_at, country)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'manus_content_opportunity',false,true,NOW(),'US')`,
          [o.name, description, category, o.city, o.state, pin_type,
           visit_tip, listing_status]
        );
        inserted++;
        process.stdout.write(".");
      } catch (err: any) {
        errors++;
        process.stdout.write("E");
        console.error(`\n❌ "${o.name}" (${o.city}): ${err.message}`);
      }
    });

    await Promise.all(promises);
  }

  await pool.end();

  console.log(`\n\n✅ Done.`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (already existed): ${toInsert.length - inserted - errors}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Total cultural_sites now: ${existingKeys.size + inserted}`);
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
