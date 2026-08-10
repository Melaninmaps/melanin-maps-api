/**
 * ensureDiasporaFaithSites — startup guard
 *
 * Inserts all historically significant diaspora houses of faith from
 * DIASPORA_FAITH_SITES_SEED into cultural_sites on every boot.
 * Dedup key: LOWER(name) || '|' || LOWER(state)  (matches loadCulturalSiteKeys).
 * All records are inserted as live_unclaimed with pin_type = church_faith_landmark.
 */
import { randomUUID } from "crypto";
import { pool } from "@workspace/db";
import { DIASPORA_FAITH_SITES_SEED } from "../data/diaspora-faith-sites-seed";

export async function ensureDiasporaFaithSites(
  log: (msg: string) => void,
  warn: (msg: string) => void
): Promise<void> {
  try {
    // Load existing name|state keys
    const r = await pool.query(
      `SELECT LOWER(name)||'|'||LOWER(state) AS k FROM cultural_sites`
    );
    const existing = new Set<string>(
      r.rows.map((row: { k: string }) => row.k)
    );

    const missing = DIASPORA_FAITH_SITES_SEED.filter(
      (s) => !existing.has(`${s.name.toLowerCase()}|${s.state.toLowerCase()}`)
    );

    if (missing.length === 0) {
      log(
        `Diaspora faith sites guard: 0 inserted, ${DIASPORA_FAITH_SITES_SEED.length} already present`
      );
      return;
    }

    // Insert one-by-one (dataset is ~60 rows; avoids mega-parameter-count issues)
    let inserted = 0;
    for (const s of missing) {
      try {
        await pool.query(
          `INSERT INTO cultural_sites
             (id, name, city, state, latitude, longitude,
              description, significance,
              category, subcategory, heritage_category, pin_type,
              external_url, founded_year, status, source, is_featured)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false)`,
          [
            randomUUID(),
            s.name,
            s.city,
            s.state,
            parseFloat(s.latitude),
            parseFloat(s.longitude),
            s.description,
            s.significance,
            "Historic Church",           // category
            s.faithTradition,            // subcategory = faith tradition
            "church_faith_landmark",     // heritage_category
            "church_faith_landmark",     // pin_type
            s.externalUrl ?? null,
            s.yearEstablished ?? null,
            "live_unclaimed",
            s.verifiedSource,
          ]
        );
        inserted++;
      } catch (err: unknown) {
        warn(
          `  Diaspora faith guard: failed to insert ${s.name} (${s.city}, ${s.state}): ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    log(
      `Diaspora faith sites guard: ${inserted} inserted, ${
        existing.size
      } already present (seed: ${DIASPORA_FAITH_SITES_SEED.length})`
    );
  } catch (err: unknown) {
    warn(
      `Diaspora faith sites guard failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
