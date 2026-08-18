import type { Pool } from "pg";

export type FacetedLibraryClassification = {
  /** Durable foundation slugs — e.g. "health-wellness", "family-relationships". Max 6. */
  topicSlugs: string[];
  /** Reusable facet keys — who, goal, where, life-stage, cultural-context, resource, content. Max 12. */
  facetKeys: string[];
  relatedTopicSlugs?: string[];
};

/**
 * Kinfolk writes a source-cited answer once, then links it to every relevant
 * foundation topic and context facet. A Black maternal-health entry can link to
 * Health, Family, Rights, Legal Information, and Community Resources without
 * copying the entry.
 *
 * topicSlugs[0] receives relevance 1.0; subsequent topics receive 0.8.
 */
export async function persistFacetedKinfolkResearch(
  pool: Pool,
  entryId: string,
  classification: FacetedLibraryClassification,
): Promise<void> {
  const topicSlugs = [...new Set(classification.topicSlugs)].slice(0, 6);
  const facetKeys = [...new Set(classification.facetKeys)].slice(0, 12);

  if (topicSlugs.length === 0) {
    throw new Error("KIN_FOLK_RESEARCH_NEEDS_A_TOPIC");
  }

  await pool.query("BEGIN");
  try {
    const { rows: topics } = await pool.query<{ id: string; slug: string }>(
      `SELECT id, slug FROM library_topics WHERE active = true AND slug = ANY($1::text[])`,
      [topicSlugs],
    );
    if (topics.length === 0) throw new Error("NO_VALID_LIBRARY_TOPICS");

    for (const topic of topics) {
      const relevance = topic.slug === topicSlugs[0] ? 1 : 0.8;
      await pool.query(
        `INSERT INTO library_entry_topic_links (entry_id, topic_id, relevance)
         VALUES ($1, $2, $3)
         ON CONFLICT (entry_id, topic_id) DO UPDATE
           SET relevance = greatest(library_entry_topic_links.relevance, EXCLUDED.relevance)`,
        [entryId, topic.id, relevance],
      );
    }

    if (facetKeys.length > 0) {
      await pool.query(
        `INSERT INTO library_entry_facets (entry_id, facet_key)
         SELECT $1, definition.facet_key
         FROM library_facet_definitions definition
         WHERE definition.active = true AND definition.facet_key = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [entryId, facetKeys],
      );
    }

    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

// Kinfolk classification policy:
// - topicSlugs are durable foundations, not one-off subfolders.
// - facetKeys capture who, goal, place, life stage, cultural context, need, experience, resource, content type.
// - content types (guide, professional, event, historic place, story) are facets, never top-level topic replacements.
