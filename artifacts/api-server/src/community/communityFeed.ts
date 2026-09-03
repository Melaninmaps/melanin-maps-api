import type { Pool } from "pg";

export type CommunityFeedMode = "everyone" | "following" | "foryou";

export type CommunityPostRow = {
  id: string;
  author_id: string | null;
  author_name: string;
  author_initials: string;
  author_color: string;
  content: string;
  category: string;
  post_type: string;
  business_id: string | null;
  business_name: string | null;
  business_link: string | null;
  media_urls: string | null;
  saved_place_id: string | null;
  location_tag: string | null;
  location_venue_name: string | null;
  location_city: string | null;
  location_country: string | null;
  location_place_id: string | null;
  location_type: string | null;
  hashtags: unknown;
  topic_tag: string | null;
  is_private_topic: boolean;
  visibility: string;
  comment_policy: string;
  has_content_warning: boolean;
  content_warning_type: string | null;
  audience_rating: string;
  rating_reason: string | null;
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_domain: string | null;
  link_favicon: string | null;
  repost_id: string | null;
  repost_author_name: string | null;
  repost_author_initials: string | null;
  repost_content: string | null;
  mentioned_business_id: string | null;
  mentioned_business_name: string | null;
  mentioned_business_tag: string | null;
  mentioned_business_rating: number | null;
  upvotes: number;
  downvotes: number;
  comments_count: number;
  thread_id: string | null;
  thread_position: number;
  thread_total: number;
  created_at: Date;
};

export type ActiveCommunityComment = {
  id: string;
  postId: string;
  authorId: string | null;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  createdAt: Date;
};

export type CommunityCommentAccessPost = {
  id: string;
  authorId: string | null;
  visibility: string;
  commentPolicy: string;
};

type Queryable = Pick<Pool, "query">;

type CommunityFeedQueryInput = {
  viewerId: string;
  feedMode: CommunityFeedMode;
  authorId?: string;
  limit: number;
  offset: number;
};

export type CommunitySqlQuery = {
  text: string;
  values: unknown[];
};

// Only the original post shape and safety-critical columns are referenced by
// identifier. Additive display fields are read from the row JSON, so an older
// instance can serve core posts while a safe migration is still rolling out.
// Active comment totals are calculated from retained comment rows rather than
// trusting the denormalized community_posts.comments_count value.
export const COMMUNITY_POST_PROJECTION = `
  cp.id,
  cp.author_id,
  cp.author_name,
  cp.author_initials,
  cp.author_color,
  cp.content,
  cp.category,
  cp.post_type,
  cp.business_id,
  cp.business_name,
  cp.business_link,
  cp.media_urls,
  cp.saved_place_id,
  to_jsonb(cp)->>'location_tag' AS location_tag,
  to_jsonb(cp)->>'location_venue_name' AS location_venue_name,
  to_jsonb(cp)->>'location_city' AS location_city,
  to_jsonb(cp)->>'location_country' AS location_country,
  to_jsonb(cp)->>'location_place_id' AS location_place_id,
  to_jsonb(cp)->>'location_type' AS location_type,
  to_jsonb(cp)->'hashtags' AS hashtags,
  to_jsonb(cp)->>'topic_tag' AS topic_tag,
  COALESCE((to_jsonb(cp)->>'is_private_topic')::boolean, false) AS is_private_topic,
  cp.visibility,
  CASE
    WHEN to_jsonb(cp)->>'comment_policy' IN ('everyone', 'followers', 'off')
      THEN to_jsonb(cp)->>'comment_policy'
    WHEN cp.visibility = 'followers_only' THEN 'followers'
    ELSE 'everyone'
  END AS comment_policy,
  COALESCE((to_jsonb(cp)->>'has_content_warning')::boolean, false) AS has_content_warning,
  to_jsonb(cp)->>'content_warning_type' AS content_warning_type,
  COALESCE(NULLIF(to_jsonb(cp)->>'audience_rating', ''), 'everyone') AS audience_rating,
  to_jsonb(cp)->>'rating_reason' AS rating_reason,
  to_jsonb(cp)->>'link_url' AS link_url,
  to_jsonb(cp)->>'link_title' AS link_title,
  to_jsonb(cp)->>'link_description' AS link_description,
  to_jsonb(cp)->>'link_domain' AS link_domain,
  to_jsonb(cp)->>'link_favicon' AS link_favicon,
  to_jsonb(cp)->>'repost_id' AS repost_id,
  to_jsonb(cp)->>'repost_author_name' AS repost_author_name,
  to_jsonb(cp)->>'repost_author_initials' AS repost_author_initials,
  to_jsonb(cp)->>'repost_content' AS repost_content,
  to_jsonb(cp)->>'mentioned_business_id' AS mentioned_business_id,
  to_jsonb(cp)->>'mentioned_business_name' AS mentioned_business_name,
  to_jsonb(cp)->>'mentioned_business_tag' AS mentioned_business_tag,
  (to_jsonb(cp)->>'mentioned_business_rating')::integer AS mentioned_business_rating,
  cp.upvotes,
  cp.downvotes,
  (
    SELECT COUNT(*)::integer
    FROM community_post_comments c
    WHERE c.post_id = cp.id
      AND COALESCE(NULLIF(to_jsonb(c)->>'status', ''), 'active') = 'active'
  ) AS comments_count,
  to_jsonb(cp)->>'thread_id' AS thread_id,
  COALESCE((to_jsonb(cp)->>'thread_position')::integer, 1) AS thread_position,
  COALESCE((to_jsonb(cp)->>'thread_total')::integer, 1) AS thread_total,
  cp.created_at`;

function acceptedRelationship(viewerPlaceholder: string): string {
  return `(
    EXISTS (
      SELECT 1
      FROM user_follows uf
      WHERE uf.follower_id = ${viewerPlaceholder}
        AND uf.following_id = cp.author_id
        AND uf.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1
      FROM member_connections mc
      WHERE mc.status = 'accepted'
        AND (
          (mc.requester_id = ${viewerPlaceholder} AND mc.recipient_id = cp.author_id)
          OR (mc.recipient_id = ${viewerPlaceholder} AND mc.requester_id = cp.author_id)
        )
    )
  )`;
}

function notBlocked(viewerPlaceholder: string): string {
  return `NOT EXISTS (
    SELECT 1
    FROM user_blocks ub
    WHERE (ub.blocker_id = ${viewerPlaceholder} AND ub.blocked_id = cp.author_id)
       OR (ub.blocker_id = cp.author_id AND ub.blocked_id = ${viewerPlaceholder})
  )`;
}

// Test-content containment cannot depend exclusively on the additive
// internal_test_content column. The fingerprints used by the quarantine job
// remain in every query, so absence of that optional column never exposes known
// reviewer, smoke-test, or load-test content.
const INTERNAL_CONTENT_EXCLUSION = `
  COALESCE(to_jsonb(cp)->>'internal_test_content', 'false') <> 'true'
  AND COALESCE(to_jsonb(u)->>'is_load_test', 'false') <> 'true'
  AND lower(COALESCE(u.email, '')) NOT LIKE 'mwm-loadtest-%@loadtest.mwm.internal'
  AND lower(COALESCE(u.email, '')) NOT IN (
    'apple.reviewer@mappingwithmelanin.com',
    'tester@mwm.com',
    'manus@mappingwithmelanin.com',
    'manus.geo@mappingwithmelanin.com'
  )
  AND lower(COALESCE(cp.author_name, '')) NOT IN (
    'apple reviewer', 'app reviewer', 'smoke test', 'load test'
  )
  AND lower(btrim(COALESCE(cp.content, ''))) NOT IN (
    'smoke test post - ignore',
    'smoke test post — ignore'
  )`;

export function buildCommunityFeedQuery(input: CommunityFeedQueryInput): CommunitySqlQuery {
  if (input.authorId) {
    const relation = acceptedRelationship("$2");
    return {
      text: `SELECT ${COMMUNITY_POST_PROJECTION}
        FROM community_posts cp
        LEFT JOIN users u ON u.id = cp.author_id
        WHERE cp.author_id = $1
          AND (cp.requires_moderation = false OR cp.author_id = $2)
          AND ${INTERNAL_CONTENT_EXCLUSION}
          AND ${notBlocked("$2")}
          AND (
            cp.author_id = $2
            OR (${relation} AND cp.visibility IN ('public', 'followers_only'))
            OR (cp.visibility = 'public' AND (u.is_private = false OR u.id IS NULL))
          )
        ORDER BY cp.created_at DESC
        LIMIT $3 OFFSET $4`,
      values: [input.authorId, input.viewerId, input.limit, input.offset],
    };
  }

  if (input.feedMode === "following") {
    const relation = acceptedRelationship("$1");
    return {
      text: `SELECT ${COMMUNITY_POST_PROJECTION}
        FROM community_posts cp
        LEFT JOIN users u ON u.id = cp.author_id
        WHERE (cp.author_id = $1 OR ${relation})
          AND cp.visibility IN ('public', 'followers_only')
          AND (cp.requires_moderation = false OR cp.author_id = $1)
          AND ${INTERNAL_CONTENT_EXCLUSION}
          AND ${notBlocked("$1")}
        ORDER BY cp.created_at DESC
        LIMIT $2 OFFSET $3`,
      values: [input.viewerId, input.limit, input.offset],
    };
  }

  if (input.feedMode === "foryou") {
    return {
      text: `SELECT ${COMMUNITY_POST_PROJECTION}
        FROM community_posts cp
        LEFT JOIN users u ON u.id = cp.author_id
        WHERE cp.visibility = 'public'
          AND cp.requires_moderation = false
          AND (u.is_private = false OR u.id IS NULL)
          AND ${INTERNAL_CONTENT_EXCLUSION}
          AND ${notBlocked("$1")}
          AND cp.created_at > NOW() - INTERVAL '30 days'
        ORDER BY cp.created_at DESC
        LIMIT $2`,
      values: [input.viewerId, Math.min(input.limit * 4, 300)],
    };
  }

  const relation = acceptedRelationship("$1");
  return {
    text: `SELECT ${COMMUNITY_POST_PROJECTION}
      FROM community_posts cp
      LEFT JOIN users u ON u.id = cp.author_id
      WHERE cp.visibility = 'public'
        AND cp.requires_moderation = false
        AND ${INTERNAL_CONTENT_EXCLUSION}
        AND ${notBlocked("$1")}
        AND (
          u.is_private = false
          OR u.id IS NULL
          OR cp.author_id = $1
          OR ${relation}
        )
      ORDER BY cp.created_at DESC
      LIMIT $2 OFFSET $3`,
    values: [input.viewerId, input.limit, input.offset],
  };
}

function isOptionalSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = String((error as { code?: unknown }).code ?? "");
  return code === "42P01" || code === "42703" || code === "3F000";
}

function stringSet(value: unknown): Set<string> {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase()));
}

async function loadForYouPreferences(queryable: Queryable, viewerId: string) {
  try {
    const { rows } = await queryable.query<{
      favorite_categories: unknown;
      cultural_interests: unknown;
      lifestyle_services: unknown;
      favorite_cities: unknown;
    }>(`
      SELECT
        COALESCE(to_jsonb(up)->'favorite_categories', '[]'::jsonb) AS favorite_categories,
        COALESCE(to_jsonb(up)->'cultural_interests', '[]'::jsonb) AS cultural_interests,
        COALESCE(to_jsonb(up)->'lifestyle_services', '[]'::jsonb) AS lifestyle_services,
        COALESCE(to_jsonb(up)->'favorite_cities', '[]'::jsonb) AS favorite_cities
      FROM user_preferences up
      WHERE up.user_id = $1
      LIMIT 1
    `, [viewerId]);
    const row = rows[0];
    return {
      favoriteCategories: stringSet(row?.favorite_categories),
      culturalInterests: stringSet(row?.cultural_interests),
      lifestyleServices: stringSet(row?.lifestyle_services),
      favoriteCities: stringSet(row?.favorite_cities),
    };
  } catch (error) {
    // Personalization is a non-sensitive enrichment. Missing optional preference
    // storage must not hide otherwise visible posts.
    if (isOptionalSchemaError(error)) {
      return {
        favoriteCategories: new Set<string>(),
        culturalInterests: new Set<string>(),
        lifestyleServices: new Set<string>(),
        favoriteCities: new Set<string>(),
      };
    }
    throw error;
  }
}

async function loadRelatedAuthorIds(queryable: Queryable, viewerId: string): Promise<Set<string>> {
  const { rows } = await queryable.query<{ related_id: string }>(`
    SELECT uf.following_id AS related_id
    FROM user_follows uf
    WHERE uf.follower_id = $1 AND uf.status = 'accepted'
    UNION
    SELECT CASE WHEN mc.requester_id = $1 THEN mc.recipient_id ELSE mc.requester_id END AS related_id
    FROM member_connections mc
    WHERE (mc.requester_id = $1 OR mc.recipient_id = $1)
      AND mc.status = 'accepted'
  `, [viewerId]);
  return new Set(rows.map((row) => row.related_id));
}

export async function fetchCommunityFeedRows(
  queryable: Queryable,
  input: CommunityFeedQueryInput,
): Promise<CommunityPostRow[]> {
  const query = buildCommunityFeedQuery(input);
  const { rows } = await queryable.query<CommunityPostRow>(query.text, query.values);
  if (input.authorId || input.feedMode !== "foryou") return rows;

  const [preferences, relatedIds] = await Promise.all([
    loadForYouPreferences(queryable, input.viewerId),
    loadRelatedAuthorIds(queryable, input.viewerId),
  ]);
  const now = Date.now();
  return rows
    .map((row) => {
      let score = 0;
      if (row.author_id && (relatedIds.has(row.author_id) || row.author_id === input.viewerId)) score += 10;
      const topic = (row.topic_tag ?? "").toLowerCase();
      const category = (row.category ?? "").toLowerCase();
      const location = (row.location_tag ?? "").toLowerCase();
      if (preferences.favoriteCategories.has(category) || preferences.favoriteCategories.has(topic)) score += 5;
      if (preferences.culturalInterests.has(category) || preferences.culturalInterests.has(topic)) score += 4;
      if (preferences.lifestyleServices.has(category) || preferences.lifestyleServices.has(topic)) score += 3;
      if (location && preferences.favoriteCities.has(location)) score += 3;
      if (row.media_urls) score += 1;
      const ageHours = (now - new Date(row.created_at).getTime()) / 3_600_000;
      if (ageHours < 1) score += 8;
      else if (ageHours < 6) score += 6;
      else if (ageHours < 24) score += 4;
      else if (ageHours < 72) score += 2;
      else if (ageHours < 168) score += 1;
      score += Math.log1p((row.upvotes ?? 0) + (row.comments_count ?? 0) * 2) * 2;
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(input.offset, input.offset + input.limit)
    .map(({ row }) => row);
}

export async function fetchCommentAccessPost(
  queryable: Queryable,
  postId: string,
  viewerId: string,
): Promise<CommunityCommentAccessPost | null> {
  const { rows } = await queryable.query<{
    id: string;
    author_id: string | null;
    visibility: string;
    comment_policy: string;
  }>(`
    SELECT
      cp.id,
      cp.author_id,
      cp.visibility,
      CASE
        WHEN to_jsonb(cp)->>'comment_policy' IN ('everyone', 'followers', 'off')
          THEN to_jsonb(cp)->>'comment_policy'
        WHEN cp.visibility = 'followers_only' THEN 'followers'
        ELSE 'everyone'
      END AS comment_policy
    FROM community_posts cp
    LEFT JOIN users u ON u.id = cp.author_id
    WHERE cp.id = $1
      AND (cp.requires_moderation = false OR cp.author_id = $2)
      AND ${INTERNAL_CONTENT_EXCLUSION}
      AND ${notBlocked("$2")}
    LIMIT 1
  `, [postId, viewerId]);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    authorId: row.author_id,
    visibility: row.visibility,
    commentPolicy: row.comment_policy,
  };
}

export async function fetchActiveCommunityComments(
  queryable: Queryable,
  postId: string,
): Promise<ActiveCommunityComment[]> {
  const { rows } = await queryable.query<{
    id: string;
    post_id: string;
    author_id: string | null;
    author_name: string;
    author_initials: string;
    author_color: string;
    content: string;
    created_at: Date;
  }>(`
    SELECT
      c.id,
      c.post_id,
      c.author_id,
      c.author_name,
      c.author_initials,
      c.author_color,
      c.content,
      c.created_at
    FROM community_post_comments c
    WHERE c.post_id = $1
      AND COALESCE(NULLIF(to_jsonb(c)->>'status', ''), 'active') = 'active'
    ORDER BY c.created_at DESC
    LIMIT 100
  `, [postId]);
  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorInitials: row.author_initials,
    authorColor: row.author_color,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export const COMMUNITY_FEED_OPTIONAL_COLUMNS = [
  "internal_test_content",
  "location_tag",
  "location_venue_name",
  "location_city",
  "location_country",
  "location_place_id",
  "location_type",
  "hashtags",
  "topic_tag",
  "is_private_topic",
  "comment_policy",
  "has_content_warning",
  "content_warning_type",
  "audience_rating",
  "rating_reason",
  "link_url",
  "link_title",
  "link_description",
  "link_domain",
  "link_favicon",
  "repost_id",
  "repost_author_name",
  "repost_author_initials",
  "repost_content",
  "mentioned_business_id",
  "mentioned_business_name",
  "mentioned_business_tag",
  "mentioned_business_rating",
  "thread_id",
  "thread_position",
  "thread_total",
  "status",
  "edited_at",
  "deleted_at",
] as const;

export function communityFeedUsesSafeOptionalColumns(sqlText: string): boolean {
  return COMMUNITY_FEED_OPTIONAL_COLUMNS.every((column) => {
    // Require a real alias boundary so an unrelated reference such as
    // mc.status is not falsely interpreted as c.status.
    const directReference = new RegExp(`\\b(?:cp|c)\\.${column}\\b`, "i");
    return !directReference.test(sqlText);
  });
}

export { isOptionalSchemaError };
