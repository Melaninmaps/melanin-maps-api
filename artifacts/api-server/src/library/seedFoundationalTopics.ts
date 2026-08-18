import type { Pool } from "pg";
import {
  FOUNDATION_SEED_VERSION,
  FOUNDATIONAL_TOPICS,
  REQUIRED_FEATURED_SLUGS,
} from "../seed/foundationalTopics";

/**
 * Idempotent: restores/updates the 28 canonical foundation topics without touching
 * Kinfolk's source-cited entries. Safe to run on every deploy and after any reset.
 */
export async function seedFoundationalTopics(pool: Pool) {
  await pool.query("BEGIN");
  try {
    for (const topic of FOUNDATIONAL_TOPICS) {
      await pool.query(
        `INSERT INTO library_topics
           (id, slug, title, domain, summary, icon_key, is_foundational, is_featured, sort_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, true)
         ON CONFLICT (slug) DO UPDATE SET
           title           = EXCLUDED.title,
           domain          = EXCLUDED.domain,
           summary         = EXCLUDED.summary,
           icon_key        = EXCLUDED.icon_key,
           is_foundational = true,
           is_featured     = EXCLUDED.is_featured,
           sort_order      = EXCLUDED.sort_order,
           active          = true,
           updated_at      = now()`,
        [
          topic.id,
          topic.slug,
          topic.title,
          topic.domain,
          topic.summary,
          topic.iconKey,
          topic.featured,
          topic.sortOrder,
        ],
      );
    }

    await pool.query(
      `CREATE TABLE IF NOT EXISTS library_seed_state (
         seed_name    text PRIMARY KEY,
         seed_version text NOT NULL,
         applied_at   timestamptz NOT NULL DEFAULT now()
       )`,
    );
    await pool.query(
      `INSERT INTO library_seed_state (seed_name, seed_version)
       VALUES ('living-library-foundation', $1)
       ON CONFLICT (seed_name) DO UPDATE
         SET seed_version = EXCLUDED.seed_version, applied_at = now()`,
      [FOUNDATION_SEED_VERSION],
    );

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }

  return verifyFoundationalTopics(pool);
}

export async function verifyFoundationalTopics(pool: Pool) {
  const { rows } = await pool.query<{ slug: string; title: string; isFeatured: boolean }>(
    `SELECT slug, title, is_featured AS "isFeatured"
     FROM library_topics
     WHERE active = true AND is_foundational = true
     ORDER BY sort_order`,
  );
  const slugs = new Set(rows.map((r) => r.slug));
  const missing = FOUNDATIONAL_TOPICS.filter((t) => !slugs.has(t.slug)).map((t) => t.slug);
  const missingFeatured = REQUIRED_FEATURED_SLUGS.filter(
    (slug) => !rows.some((r) => r.slug === slug && r.isFeatured),
  );
  return {
    ok: missing.length === 0 && missingFeatured.length === 0,
    seedVersion: FOUNDATION_SEED_VERSION,
    expectedTopicCount: FOUNDATIONAL_TOPICS.length,
    actualTopicCount: rows.length,
    missing,
    missingFeatured,
  };
}
