/**
 * Layer 2 — Knowledge Graph Retrieval Engine
 *
 * Routes:
 *   GET /knowledge/graph/:topicId?surface=map|library
 *     Returns a canonical knowledge node with its relationships, connected
 *     entities, and provenance sources.
 *
 *   GET /knowledge/entity/:entityType/:entityId?surface=map|library
 *     Entity-centric lookup — returns which topics an entity is connected to,
 *     with each topic's graph data. Used for surfaces like map sidebar or
 *     cultural-site detail pages.
 *
 * Surface parameter:
 *   Both routes accept ?surface=map|library (default: "library").
 *   The underlying data is always identical; surface changes emphasis_order
 *   in surface_meta so consumers know how to rank the sections in their UI.
 *   "map" emphasises entities (especially those with coordinates).
 *   "library" emphasises sources and cross-topic relationships.
 *
 * Kinfolk injection (Layer 3) is NOT done here.
 * Do not modify this file to inject KinfolkAI context — that belongs in Layer 3.
 */

import { Router } from "express";
import { pool, getPoolStats } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { randomUUID, createHash } from "crypto";

const router = Router();

// ── 5-minute response cache for GET /knowledge/graph/:topicId ─────────────────
// Library graph data is editorial (deploy-time). A 5-min TTL is safe: a new
// article publish is visible within 5 minutes without any DB hit under load.
// Cache errors are NEVER stored — only successful 200 responses are cached.
// Key: "<topicId>:<surface>". Invalidated implicitly by TTL only.
interface GraphCacheEntry {
  data: unknown;
  expiresAt: number;
}
const graphCache = new Map<string, GraphCacheEntry>();
const GRAPH_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of graphCache) if (v.expiresAt <= now) graphCache.delete(k);
}, 60_000).unref();

function logGraphCacheMetric(
  req: { log?: { info?: (obj: object, msg: string) => void }; id?: string; user?: { id?: string } },
  opts: { topicId: string; surface: string; cacheState: "hit" | "miss"; durationMs: number; responseStatus: number }
): void {
  const userId = req.user?.id ?? "anon";
  const userIdHash = createHash("sha256").update(userId).digest("hex").slice(0, 8);
  const ps = getPoolStats();
  req.log?.info?.({
    endpoint: `GET /knowledge/graph/${opts.topicId}`,
    requestId: req.id ?? "unknown",
    userIdHash,
    cacheState: opts.cacheState,
    dbQueryCount: opts.cacheState === "miss" ? 5 : 0,
    durationMs: opts.durationMs,
    surface: opts.surface,
    poolTotal: ps.total,
    poolIdle: ps.idle,
    poolWaiting: ps.waiting,
    responseStatus: opts.responseStatus,
  }, "cache_metric");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface KnowledgeNode {
  id: string;
  topic_name: string;
  node_type: string;
  category: string;
  geography_ref: string | null;
  status: string;
  description: string | null;
}

interface Relationship {
  relationship_type: string;
  weight: number;
  topic: KnowledgeNode;
}

interface ConnectedEntity {
  entity_id: string;
  entity_type: string;
  entity_label: string | null;
  relevance_weight: number;
  entity_data: Record<string, unknown> | null;
}

interface KnowledgeSource {
  id: string;
  authority_tier: string;
  source_name: string;
  source_url: string | null;
  claim: string | null;
  evidence_section: string | null;
  confidence: string | null;
  is_primary: boolean;
  status: string;
  last_verified: string | null;
  /** Derived transport-layer state. "not_checked" = column not yet populated.
   *  "unavailable" = source flagged needs_review, retired, blocked, or invalid.
   *  UI should hide clickable links when this is "unavailable". */
  link_state: "available" | "redirected" | "unavailable" | "not_checked";
  link_checked_at: string | null;
}

interface SurfaceMeta {
  surface: string;
  emphasis_order: string[];
  library_url: string | null;
}

function surfaceMeta(surface: string, topicId: string): SurfaceMeta {
  const isMap = surface === "map";
  return {
    surface,
    // map: show entities first (things with coordinates), then relationships
    // library: show sources + cross-topic depth first
    emphasis_order: isMap
      ? ["connectedEntities", "node", "geography", "relationships", "sources"]
      : ["node", "sources", "relationships", "geography", "connectedEntities"],
    library_url: `/library?topic=${encodeURIComponent(topicId)}`,
  };
}

// ── Shared queries ─────────────────────────────────────────────────────────────

async function fetchNode(topicId: string): Promise<KnowledgeNode | null> {
  const r = await pool.query(
    `SELECT id, topic_name, node_type, category, geography_ref, status, description
     FROM knowledge_topics WHERE id = $1 LIMIT 1`,
    [topicId],
  );
  return r.rows[0] ?? null;
}

async function fetchRelationships(topicId: string): Promise<{
  parents: Relationship[];
  children: Relationship[];
}> {
  const r = await pool.query(
    `SELECT
       tr.relationship_type,
       tr.weight,
       tr.parent_topic_id,
       tr.child_topic_id,
       kt.id            AS related_id,
       kt.topic_name    AS related_name,
       kt.node_type     AS related_node_type,
       kt.category      AS related_category,
       kt.geography_ref AS related_geography_ref,
       kt.status        AS related_status,
       kt.description   AS related_description
     FROM topic_relationships tr
     JOIN knowledge_topics kt ON (
       CASE WHEN tr.parent_topic_id = $1 THEN tr.child_topic_id
            ELSE tr.parent_topic_id
       END = kt.id
     )
     WHERE tr.parent_topic_id = $1 OR tr.child_topic_id = $1
     ORDER BY tr.weight DESC, kt.topic_name`,
    [topicId],
  );

  const parents: Relationship[] = [];
  const children: Relationship[] = [];

  for (const row of r.rows) {
    const relatedTopic: KnowledgeNode = {
      id: row.related_id as string,
      topic_name: row.related_name as string,
      node_type: row.related_node_type as string,
      category: row.related_category as string,
      geography_ref: row.related_geography_ref as string | null,
      status: row.related_status as string,
      description: row.related_description as string | null,
    };
    const rel: Relationship = {
      relationship_type: row.relationship_type as string,
      weight: Number(row.weight),
      topic: relatedTopic,
    };
    // If this topic is the parent, the related node is a child (and vice versa)
    if (row.parent_topic_id === topicId) {
      children.push(rel);
    } else {
      parents.push(rel);
    }
  }

  return { parents, children };
}

async function fetchConnectedEntities(
  topicId: string,
): Promise<ConnectedEntity[]> {
  // Pull entity connections + join entity data for known entity types
  const r = await pool.query(
    `SELECT
       lec.entity_id,
       lec.entity_type,
       lec.entity_label,
       lec.relevance_weight,
       -- Cultural sites
       cs.name       AS cs_name,
       cs.category   AS cs_category,
       cs.city       AS cs_city,
       cs.state      AS cs_state,
       cs.latitude   AS cs_lat,
       cs.longitude  AS cs_lng,
       cs.description AS cs_description,
       -- Businesses
       b.name        AS b_name,
       b.category    AS b_category,
       b.address     AS b_address,
       b.city        AS b_city,
       b.latitude    AS b_lat,
       b.longitude   AS b_lng
     FROM library_entity_connections lec
     LEFT JOIN cultural_sites cs
       ON lec.entity_type = 'cultural_site'
       AND cs.id::text = lec.entity_id::text
     LEFT JOIN businesses b
       ON lec.entity_type = 'business'
       AND b.id::text = lec.entity_id::text
     WHERE lec.topic_id = $1
     ORDER BY lec.relevance_weight DESC, lec.entity_label`,
    [topicId],
  );

  return r.rows.map((row) => {
    let entityData: Record<string, unknown> | null = null;

    if (row.entity_type === "cultural_site" && row.cs_name) {
      entityData = {
        name: row.cs_name,
        category: row.cs_category,
        city: row.cs_city,
        state: row.cs_state,
        latitude: row.cs_lat,
        longitude: row.cs_lng,
        description: row.cs_description,
      };
    } else if (row.entity_type === "business" && row.b_name) {
      entityData = {
        name: row.b_name,
        category: row.b_category,
        address: row.b_address,
        city: row.b_city,
        latitude: row.b_lat,
        longitude: row.b_lng,
      };
    }

    return {
      entity_id: row.entity_id as string,
      entity_type: row.entity_type as string,
      entity_label: row.entity_label as string | null,
      relevance_weight: Number(row.relevance_weight),
      entity_data: entityData,
    };
  });
}

async function fetchSources(topicId: string, includeStatus?: string): Promise<KnowledgeSource[]> {
  const statusFilter = includeStatus
    ? `AND status = '${includeStatus.replace(/'/g, "''")}'`
    : `AND status = 'active'`;
  const r = await pool.query(
    `SELECT id, authority_tier, source_name, source_url, claim,
            evidence_section, confidence, is_primary, status, last_verified,
            COALESCE(link_status, 'unchecked') AS link_status,
            last_checked_at
     FROM knowledge_sources
     WHERE topic_id = $1 ${statusFilter}
     ORDER BY
       CASE authority_tier
         WHEN 'authoritative' THEN 1
         WHEN 'professional'  THEN 2
         WHEN 'community'     THEN 3
         WHEN 'ambassador'    THEN 4
         ELSE 5
       END,
       is_primary DESC`,
    [topicId],
  );
  return r.rows.map((row) => {
    const rawLinkStatus = (row.link_status ?? "unchecked") as string;
    let link_state: KnowledgeSource["link_state"];
    if (rawLinkStatus === "active") link_state = "available";
    else if (rawLinkStatus === "redirected") link_state = "redirected";
    else if (rawLinkStatus === "unchecked") link_state = "not_checked";
    else link_state = "unavailable"; // needs_review | retired | blocked_by_publisher | invalid_url
    return {
      id: row.id as string,
      authority_tier: row.authority_tier as string,
      source_name: row.source_name as string,
      source_url: row.source_url as string | null,
      claim: row.claim as string | null,
      evidence_section: row.evidence_section as string | null,
      confidence: row.confidence as string | null,
      is_primary: Boolean(row.is_primary),
      status: row.status as string,
      last_verified: row.last_verified ? String(row.last_verified) : null,
      link_state,
      link_checked_at: row.last_checked_at ? String(row.last_checked_at) : null,
    };
  });
}

interface TopicArticle {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  tier: string;
  author_name: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
}

async function fetchTopicArticles(topicId: string): Promise<TopicArticle[]> {
  const r = await pool.query(
    `SELECT id, title, summary, category, tier, author_name, read_time_minutes, published_at
     FROM knowledge_articles
     WHERE topic_id = $1 AND status = 'published'
     ORDER BY published_at DESC NULLS LAST
     LIMIT 10`,
    [topicId],
  );
  return r.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string | null,
    category: row.category as string,
    tier: row.tier as string,
    author_name: row.author_name as string | null,
    read_time_minutes: row.read_time_minutes ? Number(row.read_time_minutes) : null,
    published_at: row.published_at ? String(row.published_at) : null,
  }));
}

async function fetchGeographySubtopics(
  geographyRef: string,
  excludeId: string,
): Promise<KnowledgeNode[]> {
  const r = await pool.query(
    `SELECT id, topic_name, node_type, category, geography_ref, status, description
     FROM knowledge_topics
     WHERE geography_ref = $1 AND node_type = 'topic' AND id != $2
     ORDER BY topic_name`,
    [geographyRef, excludeId],
  );
  return r.rows.map((row) => ({
    id: row.id as string,
    topic_name: row.topic_name as string,
    node_type: row.node_type as string,
    category: row.category as string,
    geography_ref: row.geography_ref as string | null,
    status: row.status as string,
    description: row.description as string | null,
  }));
}

// ── GET /knowledge/graph/:topicId ──────────────────────────────────────────────

router.get(
  "/knowledge/graph/:topicId",
  async (req, res): Promise<void> => {
    const { topicId } = req.params;
    const surface = (req.query.surface as string) ?? "library";
    const cacheKey = `${topicId}:${surface}`;
    const t0 = Date.now();

    // Check 5-min cache first (editorial data — safe to serve from memory)
    const now = Date.now();
    const cached = graphCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.json(cached.data);
      logGraphCacheMetric(req as Parameters<typeof logGraphCacheMetric>[0], { topicId, surface, cacheState: "hit", durationMs: Date.now() - t0, responseStatus: 200 });
      return;
    }

    const node = await fetchNode(topicId);
    if (!node) {
      res.status(404).json({ error: "Knowledge node not found", topicId });
      return;
    }

    // Run relationships, entities, sources, and articles in parallel — independent queries
    const [relationships, connectedEntities, sources, articles] = await Promise.all([
      fetchRelationships(topicId),
      fetchConnectedEntities(topicId),
      fetchSources(topicId),
      fetchTopicArticles(topicId),
    ]);

    // Geography subtopics: only if this node IS a geography node
    let geography: {
      ref: string;
      subtopics: KnowledgeNode[];
    } | null = null;

    if (node.node_type === "geography" && node.geography_ref) {
      const subtopics = await fetchGeographySubtopics(
        node.geography_ref,
        topicId,
      );
      geography = { ref: node.geography_ref, subtopics };
    }

    const payload = {
      node,
      relationships,
      connectedEntities,
      sources,
      articles,
      geography,
      surface_meta: surfaceMeta(surface, topicId),
    };

    // Cache only successful responses — never cache errors
    graphCache.set(cacheKey, { data: payload, expiresAt: now + GRAPH_CACHE_TTL_MS });

    res.json(payload);
    logGraphCacheMetric(req as Parameters<typeof logGraphCacheMetric>[0], { topicId, surface, cacheState: "miss", durationMs: Date.now() - t0, responseStatus: 200 });
  },
);

// ── GET /knowledge/entity/:entityType/:entityId ────────────────────────────────

router.get(
  "/knowledge/entity/:entityType/:entityId",
  async (req, res): Promise<void> => {
    const { entityType, entityId } = req.params;
    const surface = (req.query.surface as string) ?? "library";

    // Validate entity type
    const validTypes = [
      "business",
      "cultural_site",
      "event",
      "community_org",
      "community_post",
      "ambassador_content",
      "knowledge_article",
    ];
    if (!validTypes.includes(entityType)) {
      res.status(400).json({
        error: "Invalid entity_type",
        valid: validTypes,
      });
      return;
    }

    // Find all topics this entity is connected to
    const connectionsResult = await pool.query(
      `SELECT
         lec.entity_label,
         lec.relevance_weight,
         kt.id            AS topic_id,
         kt.topic_name,
         kt.node_type,
         kt.category,
         kt.geography_ref,
         kt.status,
         kt.description
       FROM library_entity_connections lec
       JOIN knowledge_topics kt ON kt.id = lec.topic_id
       WHERE lec.entity_id::text = $1 AND lec.entity_type = $2
       ORDER BY lec.relevance_weight DESC, kt.topic_name`,
      [entityId, entityType],
    );

    if (connectionsResult.rows.length === 0) {
      res.status(404).json({
        error: "No knowledge connections found for this entity",
        entityType,
        entityId,
      });
      return;
    }

    // Fetch entity display data
    let entityData: Record<string, unknown> | null = null;
    if (entityType === "cultural_site") {
      const er = await pool.query(
        `SELECT id, name, category, city, state, latitude, longitude, description
         FROM cultural_sites WHERE id::text = $1 LIMIT 1`,
        [entityId],
      );
      if (er.rows[0]) entityData = er.rows[0] as Record<string, unknown>;
    } else if (entityType === "business") {
      const er = await pool.query(
        `SELECT id, name, category, address, city, state, latitude, longitude
         FROM businesses WHERE id::text = $1 LIMIT 1`,
        [entityId],
      );
      if (er.rows[0]) entityData = er.rows[0] as Record<string, unknown>;
    }

    // For each connected topic, fetch its sources in parallel
    const topicIds = connectionsResult.rows.map(
      (r) => r.topic_id as string,
    );
    const sourceMaps = await Promise.all(
      topicIds.map((tid) => fetchSources(tid)),
    );

    const connectedTopics = connectionsResult.rows.map((row, i) => ({
      entity_label: row.entity_label as string | null,
      relevance_weight: Number(row.relevance_weight),
      topic: {
        id: row.topic_id as string,
        topic_name: row.topic_name as string,
        node_type: row.node_type as string,
        category: row.category as string,
        geography_ref: row.geography_ref as string | null,
        status: row.status as string,
        description: row.description as string | null,
      },
      sources: sourceMaps[i],
    }));

    res.json({
      entity: { entity_type: entityType, entity_id: entityId, entity_data: entityData },
      connectedTopics,
      surface_meta: surfaceMeta(surface, entityId),
    });
  },
);

// ── POST /knowledge/contribute ─────────────────────────────────────────────
// Authenticated. Creates a community or ambassador evidence contribution
// with status='pending_review'. Never auto-promotes to 'active'.
// Community/ambassador tiers remain strictly separate from authoritative/professional.
router.post(
  "/knowledge/contribute",
  async (req, res): Promise<void> => {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Authentication required to contribute" });
      return;
    }

    const { topicId, claimText, sourceName, sourceUrl } = req.body as {
      topicId?: string;
      claimText?: string;
      sourceName?: string;
      sourceUrl?: string;
    };

    if (!topicId || !claimText || !sourceName) {
      res.status(400).json({ error: "topicId, claimText, and sourceName are required" });
      return;
    }

    // Verify topic exists
    const topicCheck = await pool.query(
      `SELECT id FROM knowledge_topics WHERE id = $1 LIMIT 1`,
      [topicId],
    );
    if (!topicCheck.rows.length) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO knowledge_sources
         (id, topic_id, authority_tier, source_name, source_url, claim,
          contributor_id, is_primary, status, confidence, created_at)
       VALUES ($1,$2,'community',$3,$4,$5,$6,false,'pending_review','unverified',NOW())`,
      [id, topicId, sourceName, sourceUrl || null, claimText, userId],
    );

    res.json({ success: true, contributionId: id });
  },
);

// ── GET /admin/knowledge/contributions ────────────────────────────────────
// Admin only. Returns pending community/ambassador contributions for review.
router.get(
  "/admin/knowledge/contributions",
  async (req, res): Promise<void> => {
    if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

    const status = (req.query.status as string) || "pending_review";
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);

    const r = await pool.query(
      `SELECT ks.id, ks.topic_id, ks.authority_tier, ks.source_name,
              ks.source_url, ks.claim, ks.status, ks.confidence,
              ks.contributor_id, ks.created_at,
              kt.topic_name, kt.category, kt.geography_ref,
              u.email AS contributor_email
       FROM knowledge_sources ks
       JOIN knowledge_topics kt ON kt.id = ks.topic_id
       LEFT JOIN users u ON u.id = ks.contributor_id
       WHERE ks.status = $1
       ORDER BY ks.created_at DESC
       LIMIT $2`,
      [status, limit],
    );

    res.json({
      contributions: r.rows,
      total: r.rows.length,
      status_filter: status,
    });
  },
);

// ── PATCH /admin/knowledge/contributions/:id ──────────────────────────────
// Admin only. Approve (→ active) or reject (→ removed) a pending contribution.
router.patch(
  "/admin/knowledge/contributions/:id",
  async (req, res): Promise<void> => {
    if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

    const { id } = req.params;
    const { action, notes } = req.body as { action?: string; notes?: string };

    if (!action || !["approve", "reject"].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const newStatus = action === "approve" ? "active" : "removed";
    // On approval, also upgrade confidence to 'medium' (community tier)
    const confidenceUpdate = action === "approve"
      ? ", confidence = 'medium'"
      : "";

    await pool.query(
      `UPDATE knowledge_sources
       SET status = $1${confidenceUpdate}, description = COALESCE($2, description)
       WHERE id = $3`,
      [newStatus, notes || null, id],
    );

    res.json({ success: true, id, action, newStatus });
  },
);

export default router;
