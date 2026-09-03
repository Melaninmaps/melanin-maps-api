import { describe, expect, it, vi } from "vitest";
import { createPostgresLibraryRepository } from "../postgresLibraryRepository";

type RecordedQuery = { sql: string; parameters?: unknown[] };
type Queryable = Parameters<typeof createPostgresLibraryRepository>[0];

function databaseWithRows(rows: unknown[] = []) {
  const calls: RecordedQuery[] = [];
  const query = vi.fn(async (_sql: string, _parameters?: unknown[]) => ({ rows }));
  return {
    calls,
    database: {
      query: async <T>(sql: string, parameters?: unknown[]) => {
        calls.push({ sql, parameters });
        return query(sql, parameters) as Promise<{ rows: T[] }>;
      },
    } satisfies Queryable,
  };
}

describe("Postgres Living Library publication boundaries", () => {
  it("searches aliases and entry facets but only returns published entries in rank order", async () => {
    const { database, calls } = databaseWithRows();
    const repository = createPostgresLibraryRepository(database);

    await repository.searchPublishedContent({
      normalizedQuery: "hvac",
      searchTerms: ["hvac", "heating", "air conditioning"],
      patterns: ["%hvac%", "%heating%", "%air conditioning%"],
      preferredTopicSlugs: ["trades-skills-certifications"],
      limit: 6,
      offset: 0,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("entry.publication_status = 'published'");
    expect(calls[0].sql).toContain("direct_entry.publication_status = 'published'");
    expect(calls[0].sql).toContain("LEFT JOIN library_entry_facets");
    expect(calls[0].sql).toContain("facet.facet_key");
    expect(calls[0].sql).toContain("topic.is_foundational = true");
    expect(calls[0].sql).not.toContain("LIKE ANY($2::text[]) ESCAPE");
    expect(calls[0].sql).toContain("ROW_NUMBER() OVER (ORDER BY rank DESC, title ASC, id ASC)");
    expect(calls[0].sql).toContain("ORDER BY result_order ASC NULLS LAST");
    expect(calls[0].sql).not.toContain("pending");
    expect(calls[0].parameters).toEqual([
      "hvac",
      ["%hvac%", "%heating%", "%air conditioning%"],
      ["trades-skills-certifications"],
      ["hvac", "heating", "air conditioning"],
      6,
      0,
    ]);
  });

  it("returns the sentinel total for an empty page without manufacturing a result", async () => {
    const { database } = databaseWithRows([{
      kind: null,
      id: null,
      slug: null,
      title: null,
      summary: null,
      icon_key: null,
      entry_count: null,
      body: null,
      topic_slug: null,
      topic_title: null,
      source_count: null,
      refreshed_at: null,
      total_count: 9,
    }]);
    const repository = createPostgresLibraryRepository(database);

    const page = await repository.searchPublishedContent({
      normalizedQuery: "hvac",
      searchTerms: ["hvac"],
      patterns: ["%hvac%"],
      preferredTopicSlugs: ["trades-skills-certifications"],
      limit: 6,
      offset: 12,
    });

    expect(page).toEqual({ results: [], total: 9 });
  });

  it("records only aggregate coverage fields without raw question or member identity", async () => {
    const { database, calls } = databaseWithRows();
    const repository = createPostgresLibraryRepository(database);
    await repository.recordCoverageSignal({
      queryFingerprint: "a".repeat(64),
      domain: "history",
      topicSlug: "culture-heritage",
      internalResultCount: 0,
      usedLiveResearch: true,
      outcome: "researched",
    });
    expect(calls[0].sql).toContain("library_search_coverage_aggregates");
    expect(calls[0].parameters).toEqual(["a".repeat(64), "history", "culture-heritage", 0, 1, "researched"]);
    expect(calls[0].sql).not.toMatch(/member_id|raw_question|profile/i);
  });

  it("writes all newly synthesized entries as pending", async () => {
    const calls: RecordedQuery[] = [];
    const database = {
      query: async <T>(sql: string, parameters?: unknown[]) => {
        calls.push({ sql, parameters });
        if (sql.includes("SELECT id FROM library_topics")) return { rows: [{ id: "topic-1" }] as T[] };
        if (sql.includes("INSERT INTO library_entries")) {
          return {
            rows: [{
              id: "entry-1",
              topic_id: "topic-1",
              question: "question",
              normalized_question: "question",
              title: "title",
              summary: "summary",
              body: "body",
              domain: "education",
              community_lens: "community",
              location_label: null,
              disclaimer: null,
              source_count: 0,
              created_at: new Date(0),
              refreshed_at: new Date(0),
            }] as T[],
          };
        }
        return { rows: [] as T[] };
      },
    } satisfies Queryable;
    const repository = createPostgresLibraryRepository(database);

    await repository.saveEntry({
      topicSlug: "education",
      question: "question",
      normalizedQuestion: "question",
      title: "title",
      summary: "summary",
      body: "body",
      domain: "education",
      communityLens: "community",
      locationLabel: null,
      disclaimer: null,
      sourceCount: 0,
      sources: [],
      relatedQuestions: [],
      provider: "openai",
    });

    const insert = calls.find((call) => call.sql.includes("INSERT INTO library_entries"));
    expect(insert?.sql).toContain("publication_status");
    expect(insert?.sql).toContain("'pending'");
  });
});
