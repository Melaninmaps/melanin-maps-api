/**
 * Migration: Real vs Demo listing_status
 *
 * Per MWM_Replit_Real_vs_Demo_Data_Instructions:
 *  - tour_guide_businesses: all real data from Cultural Guide
 *      → Philadelphia (live city) = live_unclaimed
 *      → all other cities         = staged
 *      → data_source              = manus_cultural_guide
 *  - businesses (main table): original dev seed data
 *      → listing_status = demo
 *      → data_source    = demo_seed
 *
 * Safe to re-run — uses IF NOT EXISTS / idempotent UPDATEs.
 */
import { pool } from "@workspace/db";

async function run() {
  console.log("🔧  Listing-status migration\n");

  // ── 1. Add listing_status + data_source to main businesses table ──────────
  await pool.query(`
    ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS listing_status VARCHAR(32) DEFAULT 'demo',
      ADD COLUMN IF NOT EXISTS data_source    VARCHAR(64) DEFAULT 'demo_seed'
  `);
  console.log("  ✓ businesses: listing_status + data_source columns added");

  // ── 2. Mark ALL main-table businesses as demo (dev seed data) ─────────────
  const demoBefore = await pool.query(
    `SELECT COUNT(*) FROM businesses WHERE listing_status != 'demo'`
  );
  await pool.query(`
    UPDATE businesses
    SET listing_status = 'demo',
        data_source    = 'demo_seed'
    WHERE listing_status IS DISTINCT FROM 'demo'
       OR data_source    IS DISTINCT FROM 'demo_seed'
  `);
  const demoTotal = await pool.query(
    `SELECT COUNT(*) FROM businesses WHERE listing_status = 'demo'`
  );
  console.log(
    `  ✓ businesses: ${demoTotal.rows[0].count} rows marked demo / demo_seed ` +
    `(${demoBefore.rows[0].count} were previously different)`
  );

  // ── 3. tour_guide_businesses: Philadelphia → live_unclaimed ───────────────
  const phillyResult = await pool.query(`
    UPDATE tour_guide_businesses
    SET listing_status = 'live_unclaimed',
        data_source    = 'manus_cultural_guide'
    WHERE city = 'Philadelphia' AND state = 'PA'
    RETURNING id
  `);
  console.log(`  ✓ tour_guide_businesses: ${phillyResult.rowCount} Philadelphia rows → live_unclaimed`);

  // ── 4. tour_guide_businesses: all other cities → staged ───────────────────
  const stagedResult = await pool.query(`
    UPDATE tour_guide_businesses
    SET listing_status = 'staged',
        data_source    = 'manus_cultural_guide'
    WHERE NOT (city = 'Philadelphia' AND state = 'PA')
    RETURNING id
  `);
  console.log(`  ✓ tour_guide_businesses: ${stagedResult.rowCount} other-city rows → staged`);

  // ── 5. Report ──────────────────────────────────────────────────────────────
  console.log("\n📊  Final counts:\n");

  const tgbBreakdown = await pool.query(`
    SELECT listing_status, COUNT(*) as count
    FROM tour_guide_businesses
    GROUP BY listing_status
    ORDER BY listing_status
  `);
  console.log("  tour_guide_businesses:");
  tgbBreakdown.rows.forEach((r) =>
    console.log(`    ${r.listing_status.padEnd(16)} ${r.count}`)
  );

  const bizBreakdown = await pool.query(`
    SELECT listing_status, COUNT(*) as count
    FROM businesses
    GROUP BY listing_status
    ORDER BY listing_status
  `);
  console.log("\n  businesses (main table):");
  bizBreakdown.rows.forEach((r) =>
    console.log(`    ${r.listing_status.padEnd(16)} ${r.count}`)
  );

  const cityBreakdown = await pool.query(`
    SELECT city, state, listing_status, COUNT(*) as count
    FROM tour_guide_businesses
    GROUP BY city, state, listing_status
    ORDER BY listing_status DESC, state, city
    LIMIT 60
  `);
  console.log("\n  tour_guide_businesses by city:");
  cityBreakdown.rows.forEach((r) =>
    console.log(`    [${r.listing_status}] ${r.city}, ${r.state} — ${r.count}`)
  );

  await pool.end();
  console.log("\n✅  Migration complete.");
}

run().catch((e) => {
  console.error("Migration failed:", e.message);
  pool.end();
  process.exit(1);
});
