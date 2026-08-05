/**
 * Migration: Tour Guide v2
 * - Adds new columns to tour_guide_businesses (cultural_community, category,
 *   pin_designations, primary_designation, listing_status, data_source)
 * - Creates city_dialect_profiles table
 *
 * Safe to run multiple times — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 */
import { pool } from "@workspace/db";

async function run() {
  console.log("🔧  Tour Guide v2 migration…\n");

  // ── 1. Add columns to tour_guide_businesses ──────────────────────────────
  const alterCols = [
    `ALTER TABLE tour_guide_businesses ADD COLUMN IF NOT EXISTS cultural_community VARCHAR(200)`,
    `ALTER TABLE tour_guide_businesses ADD COLUMN IF NOT EXISTS category VARCHAR(100)`,
    `ALTER TABLE tour_guide_businesses ADD COLUMN IF NOT EXISTS pin_designations VARCHAR(500) DEFAULT 'business'`,
    `ALTER TABLE tour_guide_businesses ADD COLUMN IF NOT EXISTS primary_designation VARCHAR(50) DEFAULT 'business'`,
    `ALTER TABLE tour_guide_businesses ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'unclaimed'`,
    `ALTER TABLE tour_guide_businesses ADD COLUMN IF NOT EXISTS data_source VARCHAR(100) DEFAULT 'mwm_research'`,
  ];

  for (const sql of alterCols) {
    await pool.query(sql);
    const col = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1];
    console.log(`  ✓ tour_guide_businesses.${col}`);
  }

  // Backfill data_source for existing rows
  await pool.query(
    `UPDATE tour_guide_businesses SET data_source = 'mwm_research' WHERE data_source IS NULL`
  );
  await pool.query(
    `UPDATE tour_guide_businesses SET listing_status = 'unclaimed' WHERE listing_status IS NULL`
  );
  await pool.query(
    `UPDATE tour_guide_businesses SET primary_designation = 'business' WHERE primary_designation IS NULL`
  );
  await pool.query(
    `UPDATE tour_guide_businesses SET pin_designations = 'business' WHERE pin_designations IS NULL`
  );
  // Map diaspora_community → cultural_community for existing rows
  await pool.query(
    `UPDATE tour_guide_businesses SET cultural_community = diaspora_community WHERE cultural_community IS NULL AND diaspora_community IS NOT NULL`
  );
  console.log("  ✓ Backfilled new columns on existing 227 rows\n");

  // ── 2. Create city_dialect_profiles table ─────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS city_dialect_profiles (
      id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      city        VARCHAR(100) NOT NULL,
      state       VARCHAR(50)  NOT NULL,
      phrases     TEXT         NOT NULL,
      kinfolk_context TEXT,
      created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
      UNIQUE (city, state)
    )
  `);
  console.log("  ✓ city_dialect_profiles table ready\n");

  const final = await pool.query("SELECT COUNT(*) FROM tour_guide_businesses");
  console.log(`✅  Migration complete. tour_guide_businesses has ${final.rows[0].count} rows.`);
  await pool.end();
}

run().catch((e) => {
  console.error("Migration failed:", e.message);
  pool.end();
  process.exit(1);
});
