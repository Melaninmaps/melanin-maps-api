import type { ResearchDomain } from "./researchPolicy";
import type {
  KnowledgeSource,
  LibraryEntry,
  LibraryRepository,
  LibrarySearchResult,
  LibraryTopic,
} from "./types";

type Queryable = {
  query<T>(sql: string, parameters?: unknown[]): Promise<{ rows: T[] }>;
};

type EntryRow = {
  id: string;
  topic_id: string;
  question: string;
  normalized_question: string;
  title: string;
  summary: string;
  body: string;
  domain: ResearchDomain;
  community_lens: string;
  location_label: string | null;
  disclaimer: string | null;
  source_count: number;
  created_at: Date;
  refreshed_at: Date;
};

type SourceRow = {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  excerpt: string;
  source_tier: KnowledgeSource["sourceTier"];
  published_at: Date | null;
  retrieved_at: Date;
};

function mapSource(row: SourceRow): KnowledgeSource {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    publisher: row.publisher,
    excerpt: row.excerpt,
    sourceTier: row.source_tier,
    publishedAt: row.published_at,
    retrievedAt: row.retrieved_at,
  };
}

async function attachSources(db: Queryable, entries: EntryRow[]): Promise<LibraryEntry[]> {
  if (!entries.length) return [];
  const entryIds = entries.map((e) => e.id);
  const { rows: sourceRows } = await db.query<SourceRow & { entry_id: string }>(
    `SELECT id, entry_id, url, title, publisher, excerpt, source_tier, published_at, retrieved_at
     FROM library_entry_sources
     WHERE entry_id = ANY($1::uuid[])
     ORDER BY retrieved_at DESC`,
    [entryIds],
  );
  const sourceMap = new Map<string, KnowledgeSource[]>();
  for (const row of sourceRows) {
    sourceMap.set(row.entry_id, [...(sourceMap.get(row.entry_id) ?? []), mapSource(row)]);
  }
  return entries.map((row) => ({
    id: row.id,
    topicId: row.topic_id,
    question: row.question,
    normalizedQuestion: row.normalized_question,
    title: row.title,
    summary: row.summary,
    body: row.body,
    domain: row.domain,
    communityLens: row.community_lens,
    locationLabel: row.location_label,
    disclaimer: row.disclaimer,
    sourceCount: row.source_count,
    sources: sourceMap.get(row.id) ?? [],
    createdAt: row.created_at,
    refreshedAt: row.refreshed_at,
  }));
}

export function createPostgresLibraryRepository(db: Queryable): LibraryRepository {
  return {
    async findReusableEntry(input) {
      const { rows } = await db.query<EntryRow>(
        `SELECT le.*
         FROM library_entries le
         WHERE le.normalized_question = $1
           AND le.domain = $2
           AND le.community_lens = $3
           AND le.location_label IS NOT DISTINCT FROM $4
           AND le.refreshed_at >= $5
         ORDER BY le.refreshed_at DESC
         LIMIT 1`,
        [
          input.normalizedQuestion,
          input.domain,
          input.communityLens,
          input.locationLabel,
          input.currentAfter,
        ],
      );
      return (await attachSources(db, rows))[0] ?? null;
    },

    async saveEntry(input) {
      const { rows: topicRows } = await db.query<{ id: string }>(
        `SELECT id FROM library_topics WHERE slug = $1 LIMIT 1`,
        [input.topicSlug],
      );
      if (!topicRows[0]) throw new Error(`Missing Library topic: ${input.topicSlug}`);

      const { rows } = await db.query<EntryRow>(
        `INSERT INTO library_entries (
          topic_id, question, normalized_question, title, summary, body, domain,
          community_lens, location_label, disclaimer, source_count, publication_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *`,
        [
          topicRows[0].id,
          input.question,
          input.normalizedQuestion,
          input.title,
          input.summary,
          input.body,
          input.domain,
          input.communityLens,
          input.locationLabel,
          input.disclaimer,
          input.sourceCount,
        ],
      );
      const entry = rows[0];

      // Save sources one-by-one (no FK batch insert; URL is the natural key)
      for (const source of input.sources) {
        await db.query(
          `INSERT INTO library_entry_sources
             (entry_id, url, title, publisher, excerpt, source_tier, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (entry_id, url) DO NOTHING`,
          [
            entry.id,
            source.url,
            source.title,
            source.publisher,
            source.excerpt,
            source.sourceTier,
            source.publishedAt,
          ],
        );
      }
      return (await attachSources(db, [entry]))[0];
    },

    async listTopics({ search, domain, memberId }) {
      const { rows } = await db.query<{
        id: string;
        slug: string;
        title: string;
        domain: ResearchDomain;
        community_lens: string;
        is_followed: boolean;
        entry_count: string;
        newest_entry_at: Date | null;
      }>(
        `SELECT lt.id, lt.slug, lt.title, lt.domain, lt.community_lens,
                EXISTS(
                  SELECT 1 FROM library_topic_follows ltf
                  WHERE ltf.topic_id = lt.id AND ltf.member_id = $1
                ) AS is_followed,
                COUNT(le.id)::bigint AS entry_count,
                MAX(le.refreshed_at) AS newest_entry_at
         FROM library_topics lt
         LEFT JOIN library_entries le
           ON le.topic_id = lt.id
          AND le.publication_status = 'published'
         WHERE ($2::text IS NULL OR lt.domain = $2)
           AND ($3::text IS NULL OR lt.title ILIKE '%' || $3 || '%')
         GROUP BY lt.id
         ORDER BY COUNT(le.id) DESC, lt.title ASC`,
        [memberId, domain, search],
      );
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        domain: row.domain,
        communityLens: row.community_lens,
        locationLabel: null,
        isFollowed: Boolean(row.is_followed),
        entryCount: Number(row.entry_count),
        newestEntryAt: row.newest_entry_at,
      }));
    },

    async searchPublishedContent({
      normalizedQuery,
      searchTerms,
      patterns,
      preferredTopicSlugs,
      limit,
      offset,
    }) {
      type TopicSearchRow = {
        kind: "topic";
        id: string;
        slug: string;
        title: string;
        summary: string;
        icon_key: string | null;
        entry_count: number;
        body: null;
        topic_slug: null;
        topic_title: null;
        source_count: null;
        refreshed_at: null;
        total_count: number;
      };
      type EntrySearchRow = {
        kind: "entry";
        id: string;
        slug: null;
        title: string;
        summary: string;
        icon_key: null;
        entry_count: null;
        body: string;
        topic_slug: string;
        topic_title: string;
        source_count: number;
        refreshed_at: Date;
        total_count: number;
      };
      type SearchSentinelRow = {
        kind: null;
        id: null;
        slug: null;
        title: null;
        summary: null;
        icon_key: null;
        entry_count: null;
        body: null;
        topic_slug: null;
        topic_title: null;
        source_count: null;
        refreshed_at: null;
        total_count: number;
      };
      type SearchRow = TopicSearchRow | EntrySearchRow | SearchSentinelRow;
      const { rows } = await db.query<SearchRow>(
        `WITH topic_matches AS (
           SELECT
             'topic'::text AS kind,
             topic.id,
             topic.slug,
             topic.title,
             COALESCE(topic.summary, '') AS summary,
             topic.icon_key,
             COUNT(DISTINCT direct_entry.id)::int AS entry_count,
             NULL::text AS body,
             NULL::text AS topic_slug,
             NULL::text AS topic_title,
             NULL::int AS source_count,
             NULL::timestamptz AS refreshed_at,
             CASE
               WHEN topic.slug = ANY($3::text[]) THEN 400
               WHEN lower(topic.title) = $1 THEN 300
               ELSE 200
             END AS rank
           FROM library_topics topic
           LEFT JOIN library_entries direct_entry
             ON direct_entry.topic_id = topic.id
            AND direct_entry.publication_status = 'published'
           WHERE topic.active = true
             AND topic.is_foundational = true
             AND (
               topic.slug = ANY($3::text[])
               OR lower(topic.title) LIKE ANY($2::text[])
               OR lower(COALESCE(topic.summary, '')) LIKE ANY($2::text[])
             )
           GROUP BY topic.id
         ),
         entry_matches AS (
           SELECT DISTINCT ON (entry.id)
             'entry'::text AS kind,
             entry.id,
             NULL::text AS slug,
             entry.title,
             entry.summary,
             NULL::text AS icon_key,
             NULL::int AS entry_count,
             entry.body,
             COALESCE(linked_topic.slug, owner_topic.slug) AS topic_slug,
             COALESCE(linked_topic.title, owner_topic.title) AS topic_title,
             entry.source_count,
             entry.refreshed_at,
             CASE
               WHEN COALESCE(linked_topic.slug, owner_topic.slug) = ANY($3::text[]) THEN 150
               WHEN lower(entry.title) = $1 THEN 140
               ELSE 100
             END AS rank
           FROM library_entries entry
           JOIN library_topics owner_topic
             ON owner_topic.id = entry.topic_id
            AND owner_topic.active = true
           LEFT JOIN library_entry_topic_links topic_link
             ON topic_link.entry_id = entry.id
           LEFT JOIN library_topics linked_topic
             ON linked_topic.id = topic_link.topic_id
            AND linked_topic.active = true
           LEFT JOIN library_entry_facets facet
             ON facet.entry_id = entry.id
           WHERE entry.publication_status = 'published'
             AND (
               lower(entry.title) LIKE ANY($2::text[])
               OR lower(entry.summary) LIKE ANY($2::text[])
               OR lower(entry.body) LIKE ANY($2::text[])
               OR lower(entry.question) LIKE ANY($2::text[])
               OR lower(facet.facet_key) = ANY($4::text[])
               OR COALESCE(linked_topic.slug, owner_topic.slug) = ANY($3::text[])
             )
           ORDER BY entry.id,
                    (COALESCE(linked_topic.slug, owner_topic.slug) = ANY($3::text[])) DESC,
                    topic_link.relevance DESC NULLS LAST
         ),
         ranked AS (
           SELECT * FROM topic_matches
           UNION ALL
           SELECT * FROM entry_matches
         ),
         counted AS (
           SELECT ranked.*, COUNT(*) OVER()::int AS total_count
           FROM ranked
         ),
         page AS (
           SELECT counted.*,
                  ROW_NUMBER() OVER (ORDER BY rank DESC, title ASC, id ASC)::int AS result_order
           FROM counted
           ORDER BY rank DESC, title ASC, id ASC
           LIMIT $5 OFFSET $6
         )
         SELECT kind, id, slug, title, summary, icon_key, entry_count, body,
                topic_slug, topic_title, source_count, refreshed_at, total_count,
                result_order
         FROM page
         UNION ALL
         SELECT NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                NULL, NULL, COUNT(*)::int, NULL
         FROM ranked
         WHERE NOT EXISTS (SELECT 1 FROM page)
         ORDER BY result_order ASC NULLS LAST`,
        [
          normalizedQuery,
          patterns,
          preferredTopicSlugs,
          searchTerms,
          limit,
          offset,
        ],
      );

      const results: LibrarySearchResult[] = [];
      for (const row of rows) {
        if (row.kind === null) continue;
        if (row.kind === "topic") {
          results.push({
            kind: "topic",
            id: row.id,
            slug: row.slug,
            title: row.title,
            summary: row.summary,
            iconKey: row.icon_key,
            entryCount: Number(row.entry_count),
          });
          continue;
        }
        results.push({
          kind: "entry",
          id: row.id,
          title: row.title,
          summary: row.summary,
          body: row.body,
          topicSlug: row.topic_slug,
          topicTitle: row.topic_title,
          sourceCount: Number(row.source_count),
          refreshedAt: row.refreshed_at,
        });
      }
      return { results, total: rows[0]?.total_count ?? 0 };
    },

    async findTopicBySlug(slug) {
      const { rows } = await db.query<{
        id: string;
        slug: string;
        title: string;
        domain: ResearchDomain;
        community_lens: string;
        entry_count: string;
        newest_entry_at: Date | null;
      }>(
        `SELECT lt.id, lt.slug, lt.title, lt.domain, lt.community_lens,
                COUNT(le.id)::bigint AS entry_count,
                MAX(le.refreshed_at) AS newest_entry_at
         FROM library_topics lt
         LEFT JOIN library_entries le
           ON le.topic_id = lt.id
          AND le.publication_status = 'published'
         WHERE lt.slug = $1
         GROUP BY lt.id`,
        [slug],
      );
      const row = rows[0];
      return row
        ? {
            id: row.id,
            slug: row.slug,
            title: row.title,
            domain: row.domain,
            communityLens: row.community_lens,
            locationLabel: null,
            isFollowed: false,
            entryCount: Number(row.entry_count),
            newestEntryAt: row.newest_entry_at,
          }
        : null;
    },

    async listTopicEntries({ topicId, limit, cursor }) {
      const { rows } = await db.query<EntryRow>(
        `SELECT * FROM library_entries
         WHERE topic_id = $1
           AND publication_status = 'published'
           AND ($2::timestamptz IS NULL OR refreshed_at < $2)
         ORDER BY refreshed_at DESC
         LIMIT $3`,
        [topicId, cursor, Math.min(Math.max(limit, 1), 50)],
      );
      return attachSources(db, rows);
    },

    async setTopicFollow({ topicId, memberId, following }) {
      if (following) {
        await db.query(
          `INSERT INTO library_topic_follows (topic_id, member_id)
           VALUES ($1, $2)
           ON CONFLICT (topic_id, member_id) DO NOTHING`,
          [topicId, memberId],
        );
      } else {
        await db.query(
          `DELETE FROM library_topic_follows WHERE topic_id = $1 AND member_id = $2`,
          [topicId, memberId],
        );
      }
    },
  };
}
