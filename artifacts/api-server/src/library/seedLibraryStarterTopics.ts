import type { Pool } from "pg";
import { LIBRARY_STARTER_TOPICS } from "./libraryStarterTopicSeed";

/**
 * Makes the reviewed 100-topic navigation catalog available without creating
 * articles or personal advice. `ON CONFLICT DO NOTHING` deliberately preserves
 * any existing curator edits and makes this startup operation idempotent.
 */
export async function seedLibraryStarterTopics(pool: Pool): Promise<number> {
  if (!LIBRARY_STARTER_TOPICS.length) return 0;

  const values: unknown[] = [];
  const rows = LIBRARY_STARTER_TOPICS.map((topic, index) => {
    const base = index * 8;
    values.push(
      topic.slug,
      topic.title,
      topic.domain,
      "Diaspora-wide, source-governed everyday-life research",
      topic.summary,
      topic.iconKey,
      topic.isFeatured,
      topic.sortOrder,
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, true)`;
  });

  const result = await pool.query(
    `INSERT INTO library_topics (
       slug, title, domain, community_lens, summary, icon_key,
       is_featured, sort_order, active
     ) VALUES ${rows.join(", ")}
     ON CONFLICT (slug) DO NOTHING`,
    values,
  );

  return result.rowCount ?? 0;
}
