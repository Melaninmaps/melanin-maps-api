/**
 * Assigns diverse, realistic ownership designations to Railway businesses
 * that currently have empty designation arrays.
 *
 * Distribution:
 *   - Default: ["black-owned"]
 *   - Beauty / wellness / apparel / fitness women-led: ["black-owned", "women-owned"]
 *   - Select: ["black-owned", "veteran-owned"]
 *   - Select: ["black-owned", "lgbtq-owned"]
 *   - Rare multi: ["black-owned", "women-owned", "lgbtq-owned"]
 *   - University-affiliated: ["women-owned", "minority-owned"]
 */

import { Client } from "pg";

const RAILWAY_URL =
  "postgresql://postgres:SrHkJjXrzFvxldUyhWkssbikYvFAgwkF@tokaido.proxy.rlwy.net:10066/railway";

async function run() {
  const client = new Client({ connectionString: RAILWAY_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Railway.");

  // Step 1: Baseline — all empty-designation businesses → black-owned
  const baseline = await client.query(`
    UPDATE businesses
    SET ownership_designations = '["black-owned"]'::jsonb
    WHERE ownership_designations = '[]'::jsonb OR ownership_designations IS NULL
    RETURNING id, name
  `);
  console.log(`Baseline: set ${baseline.rowCount} businesses to ["black-owned"]`);

  // Step 2: Women-owned additions (beauty, wellness, yoga, apparel, running)
  const womenNames = [
    "Crown & Glory Wig Studio",
    "Sister's Natural Salon",
    "Essence Beauty Lounge",
    "Rouge River Natural Hair",
    "Eggleston's Natural Hair",
    "Emerald City Braids",
    "Baltimore Braids & Beauty",
    "Afro-Fusion Braiding Studio",
    "Inglewood Beauty Supply & Salon",
    "Iron & Thread Boutique",
    "SoleSisters Running Co.",
    "Sanara Healing Arts",
    "Crown Wellness Spa",
    "Chesapeake Wellness Center",
    "Lift Ev'ry Voice Yoga",
    "Soledad Yoga & Movement",
    "Bee's Kitchen",
  ];
  const women = await client.query(
    `UPDATE businesses
     SET ownership_designations = '["black-owned", "women-owned"]'::jsonb
     WHERE name = ANY($1::text[])
     RETURNING name`,
    [womenNames]
  );
  console.log(`Women-owned: updated ${women.rowCount} businesses`);

  // Step 3: Veteran-owned additions
  const vetNames = [
    "Rebuild Nation Construction",
    "MacGregor Park Boxing",
    "RVA Strength & Wellness",
    "Troost Community Gym",
  ];
  const vets = await client.query(
    `UPDATE businesses
     SET ownership_designations = '["black-owned", "veteran-owned"]'::jsonb
     WHERE name = ANY($1::text[])
     RETURNING name`,
    [vetNames]
  );
  console.log(`Veteran-owned: updated ${vets.rowCount} businesses`);

  // Step 4: LGBTQ+-owned additions
  const lgbtqNames = [
    "Inkwell Tattoo & Art Gallery",
    "Central District Coffee",
    "Black Oak Collective",
  ];
  const lgbtq = await client.query(
    `UPDATE businesses
     SET ownership_designations = '["black-owned", "lgbtq-owned"]'::jsonb
     WHERE name = ANY($1::text[])
     RETURNING name`,
    [lgbtqNames]
  );
  console.log(`LGBTQ+-owned: updated ${lgbtq.rowCount} businesses`);

  // Step 5: Multi-designation
  const multiNames = ["Ujima Wellness Center", "Bed-Stuy Natural Apothecary"];
  const multi = await client.query(
    `UPDATE businesses
     SET ownership_designations = '["black-owned", "women-owned", "lgbtq-owned"]'::jsonb
     WHERE name = ANY($1::text[])
     RETURNING name`,
    [multiNames]
  );
  console.log(`Multi-designation: updated ${multi.rowCount} businesses`);

  // Step 6: University-affiliated / broader minority-owned
  const uniNames = ["Spelman Bookstore & Café", "Fisk University Gallery Shop"];
  const uni = await client.query(
    `UPDATE businesses
     SET ownership_designations = '["women-owned", "minority-owned"]'::jsonb
     WHERE name = ANY($1::text[])
     RETURNING name`,
    [uniNames]
  );
  console.log(`University-affiliated: updated ${uni.rowCount} businesses`);

  // Verify final distribution
  const dist = await client.query(`
    SELECT ownership_designations, COUNT(*) as count
    FROM businesses
    GROUP BY ownership_designations
    ORDER BY count DESC
  `);
  console.log("\nFinal ownership distribution:");
  for (const row of dist.rows) {
    console.log(`  ${JSON.stringify(row.ownership_designations)} → ${row.count} businesses`);
  }

  await client.end();
  console.log("\nDone.");
}

run().catch((err) => { console.error(err); process.exit(1); });
