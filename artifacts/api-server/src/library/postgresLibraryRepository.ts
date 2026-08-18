import type { ResearchDomain } from "./researchPolicy";
import type {
  KnowledgeSource,
  LibraryEntry,
  LibraryRepository,
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
          community_lens, location_label, disclaimer, source_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
         LEFT JOIN library_entries le ON le.topic_id = lt.id
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
         LEFT JOIN library_entries le ON le.topic_id = lt.id
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
