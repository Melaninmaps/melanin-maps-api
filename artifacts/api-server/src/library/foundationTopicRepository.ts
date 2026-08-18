import type { Pool } from "pg";

export type FoundationTopic = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconKey: string;
  isFeatured: boolean;
  sortOrder: number;
  entryCount: number;
};

export class FoundationTopicRepository {
  constructor(private readonly pool: Pool) {}

  async list(options: { featuredOnly?: boolean; query?: string } = {}): Promise<FoundationTopic[]> {
    const query = options.query?.trim() ?? "";
    const { rows } = await this.pool.query<FoundationTopic>(
      `SELECT
         topic.id,
         topic.slug,
         topic.title,
         topic.summary,
         topic.icon_key       AS "iconKey",
         topic.is_featured    AS "isFeatured",
         topic.sort_order     AS "sortOrder",
         count(link.entry_id)::int AS "entryCount"
       FROM library_topics topic
       LEFT JOIN library_entry_topic_links link ON link.topic_id = topic.id
       WHERE topic.active = true
         AND ($1::boolean = false OR topic.is_featured = true)
         AND ($2 = '' OR topic.title ILIKE '%' || $2 || '%'
                       OR topic.summary ILIKE '%' || $2 || '%')
       GROUP BY topic.id
       ORDER BY topic.is_featured DESC, topic.sort_order ASC, topic.title ASC`,
      [options.featuredOnly ?? false, query],
    );
    return rows;
  }
}
