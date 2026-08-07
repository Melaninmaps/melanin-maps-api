/**
 * Seeds all 53 city profiles from attached_assets/4_1786075259920.json
 * into the city_profiles table.
 *
 * Requires: Railway Postgres public URL in /tmp/railway_db_url.txt
 * Usage: tsx artifacts/api-server/src/scripts/seed-city-profiles.ts
 */
import pg from "pg";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CityProfile {
  city_name: string;
  state: string;
  historical_context: string;
  brief_context: string;
  why_mwm_here: string | null;
  key_neighborhoods: string[];
  cultural_anchors: string[];
  cultural_phrases: string[];
  city_key: string;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/,\s*/g, "-")
    .replace(/\.\s*/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const dbUrl = readFileSync("/tmp/railway_db_url.txt", "utf8").trim();
  if (!dbUrl) throw new Error("No DATABASE_URL");

  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

  const profiles: CityProfile[] = JSON.parse(
    readFileSync(
      path.resolve(__dirname, "../../../../attached_assets/4_1786075259920.json"),
      "utf8"
    )
  );

  console.log(`\n🏙️  City Profiles Seeder — ${profiles.length} cities\n`);

  // Ensure FK is dropped and city_name column exists before seeding
  await pool.query(`ALTER TABLE city_profiles DROP CONSTRAINT IF EXISTS city_profiles_city_slug_fkey`);
  await pool.query(`ALTER TABLE city_profiles ADD COLUMN IF NOT EXISTS city_name VARCHAR(200)`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const p of profiles) {
    const slug = p.city_key || toSlug(p.city_name);

    try {
      // Check if already exists
      const existing = await pool.query(
        "SELECT id FROM city_profiles WHERE city_slug = $1",
        [slug]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE city_profiles SET
            city_name = $1,
            historical_context = $2,
            brief_context = $3,
            why_mwm_here = $4,
            key_neighborhoods = $5,
            cultural_anchors = $6,
            updated_at = NOW()
           WHERE city_slug = $7`,
          [
            p.city_name,
            p.historical_context,
            p.brief_context,
            p.why_mwm_here ?? null,
            p.key_neighborhoods,
            p.cultural_anchors,
            slug,
          ]
        );
        updated++;
        process.stdout.write("U");
      } else {
        await pool.query(
          `INSERT INTO city_profiles
            (city_slug, city_name, historical_context, brief_context, why_mwm_here,
             key_neighborhoods, cultural_anchors, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            slug,
            p.city_name,
            p.historical_context,
            p.brief_context,
            p.why_mwm_here ?? null,
            p.key_neighborhoods,
            p.cultural_anchors,
          ]
        );
        inserted++;
        process.stdout.write(".");
      }
    } catch (err: any) {
      errors++;
      process.stdout.write("E");
      console.error(`\n❌ ${p.city_name}: ${err.message}`);
    }
  }

  await pool.end();

  console.log(`\n\n✅ Done.`);
  console.log(`   Inserted: ${inserted}  Updated: ${updated}  Errors: ${errors}`);

  // Verify
  const check = new pg.Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, max: 1 });
  const r = await check.query("SELECT COUNT(*) FROM city_profiles");
  console.log(`   Total in city_profiles: ${r.rows[0].count}`);
  await check.end();
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); });
