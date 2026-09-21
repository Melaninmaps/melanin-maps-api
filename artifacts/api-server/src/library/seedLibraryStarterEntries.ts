import type { Pool } from "pg";
import { getResearchPolicy, type ResearchDomain, type SourceTier } from "./researchPolicy";
import { LIBRARY_STARTER_TOPICS, type LibraryStarterTopic } from "./libraryStarterTopicSeed";

const STARTER_ENTRY_SEED_VERSION = "2026-09-20-starter-guides-v1";
const STARTER_ENTRY_PREFIX = "starter-guide:";

type StarterSource = Readonly<{
  url: string;
  title: string;
  publisher: string;
  excerpt: string;
  whyItMatters: string;
  sourceTier: SourceTier;
}>;

export type LibraryStarterEntry = Readonly<{
  normalizedQuestion: string;
  title: string;
  summary: string;
  body: string;
  domain: ResearchDomain;
  disclaimer: string | null;
  relatedQuestions: string[];
  sources: StarterSource[];
}>;

function researchDomain(value: string): ResearchDomain {
  const supported: readonly ResearchDomain[] = [
    "medical",
    "legal",
    "financial",
    "education",
    "stem",
    "history",
    "general",
  ];
  return supported.includes(value as ResearchDomain)
    ? (value as ResearchDomain)
    : "general";
}

function sourceTitle(topic: LibraryStarterTopic, publisher: string): string {
  return `${publisher}: ${topic.title}`;
}

function readerFacingSourcePurpose(purpose: string): string {
  // Catalog notes use "candidate source" to distinguish research curation from
  // personalized advice. Once a source-linked starter guide is published, show
  // the reader the accurate role of the selected source without implying that
  // the source itself offers individualized guidance or guarantees.
  return purpose.replace(/\bcandidate source\b/gi, "source");
}

/**
 * Builds a source-linked orientation guide from reviewed editorial metadata.
 * It deliberately never adds facts that are not in the starter catalog, and it
 * never turns a reader's question into medical, legal, financial, or eligibility advice.
 */
export function buildLibraryStarterEntry(topic: LibraryStarterTopic): LibraryStarterEntry {
  const domain = researchDomain(topic.domain);
  const policy = getResearchPolicy(topic.title);
  const sources = topic.candidateSources.map((source) => ({
    url: source.url,
    title: sourceTitle(topic, source.publisher),
    publisher: source.publisher,
    excerpt: readerFacingSourcePurpose(source.purpose),
    whyItMatters: readerFacingSourcePurpose(source.purpose),
    sourceTier: "primary" as const,
  }));
  const nextBricks = topic.nextBricks.map((brick) => `- **${brick.title}** — ${brick.reason}`).join("\n");
  const sourceList = sources.map((source) => `- **${source.publisher}** — ${source.whyItMatters}`).join("\n");

  return {
    normalizedQuestion: `${STARTER_ENTRY_PREFIX}${topic.slug}`,
    title: `${topic.title}: a source-guided starting point`,
    summary: topic.summary,
    body: [
      "## What this guide is for",
      topic.summary,
      "",
      "## How to use it",
      "Use this page to understand the scope of the topic, open the underlying official sources, and choose the next question that fits your situation. It does not make a personal determination, replace a licensed professional, promise an outcome, or assume anything about the reader.",
      "",
      "## Source standard",
      topic.sourceStandard,
      "",
      "## Start with these sources",
      sourceList,
      "",
      "## Build the next question",
      nextBricks,
      "",
      "## Important boundary",
      topic.safetyNotes,
      "",
      "For a current, more specific question, use **Research the Library**. That research is required to return source-linked material and is governed by the same high-stakes safeguards.",
    ].join("\n"),
    domain,
    disclaimer: policy.disclaimer,
    relatedQuestions: topic.nextBricks.map((brick) => brick.title).slice(0, 5),
    sources,
  };
}

/**
 * Makes the 100 reviewed starter guides visible on both web and mobile.
 * Idempotence is per topic and seed key: curator-authored articles are never
 * overwritten, and every supplied source remains separately linked.
 */
export async function seedLibraryStarterEntries(pool: Pool): Promise<number> {
  let inserted = 0;
  await pool.query("BEGIN");
  try {
    for (const topic of LIBRARY_STARTER_TOPICS) {
      const entry = buildLibraryStarterEntry(topic);
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO library_entries (
           topic_id, question, normalized_question, title, summary, body, domain,
           community_lens, location_label, disclaimer, source_count,
           publication_status, related_questions, provider_name
         )
         SELECT library_topic.id, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10,
                'published', $11::jsonb, 'internal'
         FROM library_topics AS library_topic
         WHERE library_topic.slug = $1
           AND NOT EXISTS (
             SELECT 1
             FROM library_entries AS existing
             WHERE existing.topic_id = library_topic.id
               AND existing.normalized_question = $3
           )
         RETURNING id`,
        [
          topic.slug,
          `Starter guide: ${topic.title}`,
          entry.normalizedQuestion,
          entry.title,
          entry.summary,
          entry.body,
          entry.domain,
          "Diaspora-wide, source-governed everyday-life research",
          entry.disclaimer,
          entry.sources.length,
          JSON.stringify(entry.relatedQuestions),
        ],
      );
      if (rows[0]?.id) inserted += 1;

      const { rows: activeEntryRows } = await pool.query<{ id: string }>(
        `SELECT entry.id
         FROM library_entries AS entry
         JOIN library_topics AS library_topic ON library_topic.id = entry.topic_id
         WHERE library_topic.slug = $1
           AND entry.normalized_question = $2
         LIMIT 1`,
        [topic.slug, entry.normalizedQuestion],
      );
      const entryId = activeEntryRows[0]?.id;
      if (!entryId) continue;
      await pool.query(
        `INSERT INTO library_entry_facets (entry_id, facet_key)
         VALUES ($1, 'research-lens:diaspora')
         ON CONFLICT (entry_id, facet_key) DO NOTHING`,
        [entryId],
      );

      for (const source of entry.sources) {
        await pool.query(
          `INSERT INTO library_entry_sources (
             entry_id, url, title, publisher, excerpt, why_it_matters, source_tier, published_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
           ON CONFLICT (entry_id, url) DO NOTHING`,
          [
            entryId,
            source.url,
            source.title,
            source.publisher,
            source.excerpt,
            source.whyItMatters,
            source.sourceTier,
          ],
        );
      }
    }
    await pool.query(
      `CREATE TABLE IF NOT EXISTS library_seed_state (
         seed_name text PRIMARY KEY,
         seed_version text NOT NULL,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    await pool.query(
      `INSERT INTO library_seed_state (seed_name, seed_version)
       VALUES ('living-library-starter-guides', $1)
       ON CONFLICT (seed_name) DO UPDATE
         SET seed_version = EXCLUDED.seed_version, applied_at = now()`,
      [STARTER_ENTRY_SEED_VERSION],
    );
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
  return inserted;
}
