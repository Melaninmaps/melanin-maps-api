import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  buildCommunityFeedQuery,
  communityFeedUsesSafeOptionalColumns,
  fetchActiveCommunityComments,
  fetchCommentAccessPost,
  fetchCommunityFeedRows,
} from "../community/communityFeed";

const startupMigrationSource = readFileSync(
  fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
  "utf8",
);
const communityRouteSource = readFileSync(
  fileURLToPath(new URL("../routes/community.ts", import.meta.url)),
  "utf8",
);
const routesIndexSource = readFileSync(
  fileURLToPath(new URL("../routes/index.ts", import.meta.url)),
  "utf8",
);

const injectedViewerId = "member-' OR true --";

function queryFor(feedMode: "everyone" | "following" | "foryou") {
  return buildCommunityFeedQuery({
    viewerId: injectedViewerId,
    feedMode,
    limit: 25,
    offset: 5,
  });
}

function outerFeedSql(sqlText: string): string {
  const start = sqlText.lastIndexOf("FROM community_posts cp");
  expect(start).toBeGreaterThan(-1);
  return sqlText.slice(start).replace(/\s+/g, " ");
}

function migrationBlock(name: string, nextName: string): string {
  const start = startupMigrationSource.indexOf(`name: "${name}"`);
  const end = startupMigrationSource.indexOf(`name: "${nextName}"`, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return startupMigrationSource.slice(start, end);
}

function samplePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    author_id: "member-2",
    author_name: "Member Two",
    author_initials: "MT",
    author_color: "#CA922B",
    content: "Community discussion",
    category: "culture",
    post_type: "community",
    business_id: null,
    business_name: null,
    business_link: null,
    media_urls: null,
    saved_place_id: null,
    location_tag: null,
    location_venue_name: null,
    location_city: null,
    location_country: null,
    location_place_id: null,
    location_type: null,
    hashtags: null,
    topic_tag: null,
    is_private_topic: false,
    visibility: "public",
    comment_policy: "everyone",
    has_content_warning: false,
    content_warning_type: null,
    audience_rating: "everyone",
    rating_reason: null,
    link_url: null,
    link_title: null,
    link_description: null,
    link_domain: null,
    link_favicon: null,
    repost_id: null,
    repost_author_name: null,
    repost_author_initials: null,
    repost_content: null,
    mentioned_business_id: null,
    mentioned_business_name: null,
    mentioned_business_tag: null,
    mentioned_business_rating: null,
    upvotes: 0,
    downvotes: 0,
    comments_count: 0,
    thread_id: null,
    thread_position: 1,
    thread_total: 1,
    created_at: new Date(),
    ...overrides,
  };
}

describe("Community feed SQL safety and visibility", () => {
  it.each([
    ["everyone", [injectedViewerId, 25, 5]],
    ["following", [injectedViewerId, 25, 5]],
    ["foryou", [injectedViewerId, 100]],
  ] as const)("uses an explicit rolling-safe shape and parameters for %s", (feedMode, expectedValues) => {
    const query = queryFor(feedMode);

    expect(query.text).not.toMatch(/SELECT\s+cp\.\*/i);
    expect(query.text).not.toContain(injectedViewerId);
    expect(query.values).toEqual(expectedValues);
    expect(communityFeedUsesSafeOptionalColumns(query.text)).toBe(true);
    expect(query.text).toContain("to_jsonb(cp)->>'comment_policy'");
    expect(query.text).toContain("to_jsonb(c)->>'status'");
    expect(query.text).toContain("COUNT(*)::integer");

    const outer = outerFeedSql(query.text);
    expect(outer).toContain("cp.requires_moderation = false");
    expect(outer).toContain("FROM user_blocks ub");
    expect(outer).toContain("to_jsonb(u)->>'is_load_test'");
    expect(outer).toContain("to_jsonb(cp)->>'internal_test_content'");
  });

  it("applies each feed mode's intended privacy predicate", () => {
    const everyone = outerFeedSql(queryFor("everyone").text);
    const following = outerFeedSql(queryFor("following").text);
    const forYou = outerFeedSql(queryFor("foryou").text);

    expect(everyone).toContain("WHERE cp.visibility = 'public'");
    expect(everyone).toContain("u.is_private = false");
    expect(everyone).toContain("uf.status = 'accepted'");
    expect(everyone).toContain("mc.status = 'accepted'");

    expect(following).toContain("WHERE (cp.author_id = $1 OR");
    expect(following).toContain("cp.visibility IN ('public', 'followers_only')");
    expect(following).toContain("uf.status = 'accepted'");

    expect(forYou).toContain("WHERE cp.visibility = 'public'");
    expect(forYou).toContain("AND (u.is_private = false OR u.id IS NULL)");
    expect(forYou).not.toContain("cp.visibility IN ('public', 'followers_only')");
  });

  it("applies privacy, moderation, blocking, and test containment to profile feeds", () => {
    const query = buildCommunityFeedQuery({
      viewerId: "viewer-1",
      authorId: "author-1",
      feedMode: "everyone",
      limit: 10,
      offset: 0,
    });
    const outer = outerFeedSql(query.text);

    expect(query.values).toEqual(["author-1", "viewer-1", 10, 0]);
    expect(outer).toContain("WHERE cp.author_id = $1");
    expect(outer).toContain("cp.requires_moderation = false OR cp.author_id = $2");
    expect(outer).toContain("cp.visibility IN ('public', 'followers_only')");
    expect(outer).toContain("u.is_private = false OR u.id IS NULL");
    expect(outer).toContain("FROM user_blocks ub");
    expect(outer).toContain("internal_test_content");
  });

  it("recognizes response aliases without mistaking relationship aliases for optional columns", () => {
    expect(communityFeedUsesSafeOptionalColumns("SELECT mc.status FROM member_connections mc")).toBe(true);
    expect(communityFeedUsesSafeOptionalColumns("SELECT cp.status FROM community_posts cp")).toBe(false);
    expect(communityFeedUsesSafeOptionalColumns("SELECT c.deleted_at FROM community_post_comments c")).toBe(false);
  });

  it("keeps Community behind the global authenticated-member wall", () => {
    const authWall = routesIndexSource.indexOf("router.use(requireAuth)");
    const communityMount = routesIndexSource.indexOf("router.use(communityRouter)");
    expect(authWall).toBeGreaterThan(-1);
    expect(communityMount).toBeGreaterThan(authWall);
    expect(communityRouteSource).toContain('res.status(401).json({ error: "Authentication required." })');
  });
});

describe("For You optional enrichment behavior", () => {
  it("fails open only when optional preference storage is absent", async () => {
    const olderRelated = samplePost({
      id: "older-related",
      author_id: "followed-member",
      comments_count: 12,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
    const newerUnrelated = samplePost({ id: "newer-unrelated", created_at: new Date() });
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [newerUnrelated, olderRelated] })
      .mockRejectedValueOnce(Object.assign(new Error("optional preferences not deployed"), { code: "42P01" }))
      .mockResolvedValueOnce({ rows: [{ related_id: "followed-member" }] });

    const rows = await fetchCommunityFeedRows({ query } as never, {
      viewerId: "viewer-1",
      feedMode: "foryou",
      limit: 2,
      offset: 0,
    });

    expect(rows.map((row) => row.id)).toEqual(["older-related", "newer-unrelated"]);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("fails closed when relationship/privacy loading fails", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [samplePost()] })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(Object.assign(new Error("relationship query failed"), { code: "57P01" }));

    await expect(fetchCommunityFeedRows({ query } as never, {
      viewerId: "viewer-1",
      feedMode: "foryou",
      limit: 1,
      offset: 0,
    })).rejects.toThrow("relationship query failed");
  });

  it("does not swallow non-schema preference failures", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [samplePost()] })
      .mockRejectedValueOnce(Object.assign(new Error("preference timeout"), { code: "57014" }))
      .mockResolvedValueOnce({ rows: [] });

    await expect(fetchCommunityFeedRows({ query } as never, {
      viewerId: "viewer-1",
      feedMode: "foryou",
      limit: 1,
      offset: 0,
    })).rejects.toThrow("preference timeout");
  });
});

describe("Community comments and count reconciliation", () => {
  it("loads the parent with parameterized moderation, block, and test-content safeguards", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    await expect(fetchCommentAccessPost({ query } as never, "post-1", "viewer-1")).resolves.toBeNull();

    const [sqlText, values] = query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual(["post-1", "viewer-1"]);
    expect(sqlText).toContain("cp.requires_moderation = false OR cp.author_id = $2");
    expect(sqlText).toContain("FROM user_blocks ub");
    expect(sqlText).toContain("internal_test_content");
    expect(sqlText).not.toContain("viewer-1");
  });

  it("returns active retained comments with a stable core shape when status metadata is absent", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{
        id: "comment-1",
        post_id: "post-1",
        author_id: "member-2",
        author_name: "Member Two",
        author_initials: "MT",
        author_color: "#CA922B",
        content: "Still here",
        created_at: new Date("2026-09-03T12:00:00.000Z"),
      }],
    });

    const comments = await fetchActiveCommunityComments({ query } as never, "post-1");

    expect(comments).toEqual([expect.objectContaining({ id: "comment-1", postId: "post-1", content: "Still here" })]);
    const [sqlText, values] = query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual(["post-1"]);
    expect(sqlText).toContain("to_jsonb(c)->>'status'");
    expect(sqlText).not.toMatch(/SELECT\s+c\.\*/i);
  });

  it("soft-deletes authorized comments and reconciles counts from active rows", () => {
    const commentRoutes = communityRouteSource.slice(
      communityRouteSource.indexOf('// POST /community/posts/:id/comments'),
      communityRouteSource.indexOf('// POST /community/posts/:postId/comments/:commentId/report'),
    );

    expect(commentRoutes).toContain('.set({ status: "deleted", deletedAt: new Date() })');
    expect(commentRoutes).toContain("const mayDelete = comment.authorId === req.user.id || access.post.authorId === req.user.id || isAdmin");
    expect(commentRoutes).not.toContain(".delete(communityPostCommentsTable)");
    expect(commentRoutes.match(/SELECT COUNT\(\*\)::integer/g)).toHaveLength(2);
    expect(commentRoutes).toContain("communityPostCommentsTable.status} = 'active'");
    expect(commentRoutes).not.toContain("commentsCount} + 1");
    expect(commentRoutes).not.toContain("commentsCount} - 1");
  });
});

describe("Community additive migration and quarantine", () => {
  it.each([
    "location_venue_name",
    "hashtags",
    "comment_policy",
    "thread_id",
    "status varchar(20) NOT NULL DEFAULT 'active'",
    "deleted_at timestamptz",
  ])("idempotently repairs %s", (column) => {
    expect(startupMigrationSource).toContain("ADD COLUMN IF NOT EXISTS");
    expect(startupMigrationSource).toContain(column);
  });

  it("audits and excludes internal test posts without deleting or mutating source rows", () => {
    const quarantine = migrationBlock("quarantine_test_reviewer_posts_v1", "deactivate_expired_recurring_events_v1");

    expect(quarantine).toContain("INSERT INTO community_post_internal_quarantine");
    expect(quarantine).toContain("ON CONFLICT (post_id) DO NOTHING");
    expect(quarantine).toContain("mwm-loadtest-%@loadtest.mwm.internal");
    expect(quarantine).toContain("apple.reviewer@mappingwithmelanin.com");
    expect(quarantine).not.toMatch(/DELETE\s+FROM\s+community_/i);
    expect(quarantine).not.toMatch(/UPDATE\s+community_posts/i);
    expect(startupMigrationSource).not.toMatch(/DELETE\s+FROM\s+community_post_comments/i);
    expect(startupMigrationSource).not.toMatch(/DELETE\s+FROM\s+community_posts/i);
  });
});
