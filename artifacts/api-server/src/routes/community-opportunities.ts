import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { communityNeedTopicLabel } from "../kinfolk/community-need-feedback";

const router: IRouter = Router();

const MAX_TOPICS = 12;
const MAX_TOPIC_LENGTH = 64;
let schemaReady: Promise<void> | null = null;

type OpportunityRow = {
  id: string;
  topic_key: string;
  status: "open" | "accepted" | "fulfilled" | "closed";
  created_at: string;
  fulfillment_post_id: string | null;
};

/**
 * The opportunity cycle intentionally stores only an already-thresholded broad
 * topic. It never copies a member name, message, session, private-memory value,
 * demographic field, or feedback note into any creator/business-facing table.
 * These additive, idempotent tables are installed only when this isolated route
 * is used; they do not alter existing Community content or business records.
 */
async function ensureCommunityOpportunitySchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = Promise.all([
      pool.query(`
        CREATE TABLE IF NOT EXISTS community_opportunity_participation (
          user_id VARCHAR(255) PRIMARY KEY,
          role VARCHAR(16) NOT NULL CHECK (role IN ('creator', 'business')),
          topic_keys TEXT[] NOT NULL DEFAULT '{}',
          notification_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`),
      pool.query(`
        CREATE TABLE IF NOT EXISTS community_opportunities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          need_insight_id UUID NOT NULL UNIQUE,
          business_id VARCHAR(255) NOT NULL,
          topic_key VARCHAR(64) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'open'
            CHECK (status IN ('open', 'accepted', 'fulfilled', 'closed')),
          created_by_user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`),
      pool.query(`
        CREATE TABLE IF NOT EXISTS community_opportunity_matches (
          opportunity_id UUID NOT NULL REFERENCES community_opportunities(id) ON DELETE CASCADE,
          participant_user_id VARCHAR(255) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'prepared'
            CHECK (status IN ('prepared', 'accepted', 'declined', 'revoked')),
          prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          accepted_at TIMESTAMPTZ,
          PRIMARY KEY (opportunity_id, participant_user_id)
        )`),
      pool.query(`
        CREATE TABLE IF NOT EXISTS community_opportunity_fulfillments (
          opportunity_id UUID PRIMARY KEY REFERENCES community_opportunities(id) ON DELETE CASCADE,
          participant_user_id VARCHAR(255) NOT NULL,
          community_post_id VARCHAR(255) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'published'
            CHECK (status IN ('published', 'withdrawn')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          withdrawn_at TIMESTAMPTZ
        )`),
      pool.query(`CREATE INDEX IF NOT EXISTS community_opportunity_participation_topics_idx
        ON community_opportunity_participation USING GIN (topic_keys)`),
      pool.query(`CREATE INDEX IF NOT EXISTS community_opportunity_open_topic_idx
        ON community_opportunities (topic_key, status, created_at DESC)`),
    ]).then(() => undefined);
  }
  try {
    await schemaReady;
  } catch (error) {
    schemaReady = null;
    throw error;
  }
}

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function normalizeTopicKeys(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_TOPICS) return null;
  const values = [...new Set(input.map((value) => typeof value === "string" ? value.trim().toLowerCase() : "").filter(Boolean))];
  if (values.length === 0 || values.some((value) => value.length > MAX_TOPIC_LENGTH || !communityNeedTopicLabel(value))) return null;
  return values;
}

async function hasApprovedOwnerLink(userId: string, businessId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM business_owner_links
      WHERE business_id = $1 AND user_id = $2 AND role = 'owner'
        AND status = 'approved' AND revoked_at IS NULL LIMIT 1`,
    [businessId, userId],
  );
  return Boolean(result.rows[0]);
}

/** Member-controlled creator/business participation. No notification is sent. */
router.put("/community-opportunities/participation", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { role, topicKeys, notificationOptIn, active = true } = req.body as Record<string, unknown>;
  const normalizedTopics = normalizeTopicKeys(topicKeys);
  if ((role !== "creator" && role !== "business") || !normalizedTopics || typeof notificationOptIn !== "boolean" || typeof active !== "boolean") {
    return void res.status(400).json({ error: "Choose a role, one or more supported broad topics, and explicit notification consent." });
  }
  try {
    await ensureCommunityOpportunitySchema();
    await pool.query(
      `INSERT INTO community_opportunity_participation
        (user_id, role, topic_keys, notification_opt_in, active, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         role = EXCLUDED.role, topic_keys = EXCLUDED.topic_keys,
         notification_opt_in = EXCLUDED.notification_opt_in, active = EXCLUDED.active,
         updated_at = NOW()`,
      [userId, role, normalizedTopics, notificationOptIn, active],
    );
    res.json({ ok: true, notificationPrepared: false, privacy: "Only broad topics are used for matching; member conversations are never shared." });
  } catch (error) {
    req.log.error({ error }, "Failed to save community opportunity participation");
    res.status(500).json({ error: "Could not save opportunity participation" });
  }
});

/** An approved owner may turn an existing thresholded aggregate insight into one opportunity. */
router.post("/businesses/:businessId/kinfolk-community-needs/:insightId/opportunities", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const businessId = String(req.params.businessId ?? "").trim();
  const insightId = String(req.params.insightId ?? "").trim();
  if (!businessId || !insightId) return void res.status(400).json({ error: "businessId and insightId are required" });
  try {
    await ensureCommunityOpportunitySchema();
    if (!(await hasApprovedOwnerLink(userId, businessId))) {
      return void res.status(403).json({ error: "Approved business owner access is required" });
    }
    const insight = await pool.query<{ id: string; topic_key: string }>(
      `SELECT id, topic_key FROM kinfolk_community_need_insights
        WHERE id = $1 AND business_id = $2 AND status = 'active' LIMIT 1`,
      [insightId, businessId],
    );
    if (!insight.rows[0] || !communityNeedTopicLabel(insight.rows[0].topic_key)) {
      return void res.status(404).json({ error: "Active aggregate need not found" });
    }
    const created = await pool.query<OpportunityRow>(
      `INSERT INTO community_opportunities (need_insight_id, business_id, topic_key, created_by_user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (need_insight_id) DO UPDATE SET updated_at = NOW()
       RETURNING id, topic_key, status, created_at, NULL::varchar AS fulfillment_post_id`,
      [insightId, businessId, insight.rows[0].topic_key, userId],
    );
    res.status(201).json({
      opportunity: serializeOpportunity(created.rows[0]),
      matching: "Prepared only for opted-in participants with the same broad topic. No notification has been sent.",
    });
  } catch (error) {
    req.log.error({ error }, "Failed to create community opportunity");
    res.status(500).json({ error: "Could not create community opportunity" });
  }
});

/** Returns only the caller's prepared matches; no participant directory is exposed. */
router.get("/community-opportunities/me", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await ensureCommunityOpportunitySchema();
    const participation = await pool.query<{ role: string; topic_keys: string[]; notification_opt_in: boolean; active: boolean }>(
      `SELECT role, topic_keys, notification_opt_in, active
         FROM community_opportunity_participation WHERE user_id = $1 LIMIT 1`, [userId],
    );
    const participant = participation.rows[0];
    if (!participant?.active || !participant.notification_opt_in) {
      return void res.json({ participation: participant ? { role: participant.role, active: participant.active, notificationOptIn: participant.notification_opt_in } : null, opportunities: [] });
    }
    const matches = await pool.query<OpportunityRow>(
      `SELECT o.id, o.topic_key, o.status, o.created_at,
              f.community_post_id AS fulfillment_post_id
         FROM community_opportunities o
         LEFT JOIN community_opportunity_fulfillments f ON f.opportunity_id = o.id AND f.status = 'published'
        WHERE o.status IN ('open', 'accepted', 'fulfilled')
          AND o.topic_key = ANY($1::text[])
        ORDER BY o.created_at DESC`,
      [participant.topic_keys],
    );
    for (const opportunity of matches.rows) {
      await pool.query(
        `INSERT INTO community_opportunity_matches (opportunity_id, participant_user_id)
         VALUES ($1, $2) ON CONFLICT (opportunity_id, participant_user_id) DO NOTHING`,
        [opportunity.id, userId],
      );
    }
    res.json({
      participation: { role: participant.role, active: participant.active, notificationOptIn: participant.notification_opt_in },
      opportunities: matches.rows.map(serializeOpportunity),
      notificationDelivery: "not_sent",
    });
  } catch (error) {
    req.log.error({ error }, "Failed to list community opportunities");
    res.status(500).json({ error: "Could not load community opportunities" });
  }
});

router.post("/community-opportunities/:opportunityId/accept", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const opportunityId = String(req.params.opportunityId ?? "").trim();
  try {
    await ensureCommunityOpportunitySchema();
    const accepted = await pool.query(
      `UPDATE community_opportunity_matches match
          SET status = 'accepted', accepted_at = NOW()
         FROM community_opportunity_participation participant
        WHERE match.opportunity_id = $1 AND match.participant_user_id = $2
          AND participant.user_id = $2 AND participant.active = TRUE
          AND participant.notification_opt_in = TRUE
        RETURNING match.opportunity_id`,
      [opportunityId, userId],
    );
    if (!accepted.rows[0]) return void res.status(404).json({ error: "Prepared opportunity match not found" });
    await pool.query(`UPDATE community_opportunities SET status = 'accepted', updated_at = NOW() WHERE id = $1 AND status = 'open'`, [opportunityId]);
    res.json({ ok: true, status: "accepted", nextStep: "Publish a public Community post or video to fulfill this opportunity." });
  } catch (error) {
    req.log.error({ error }, "Failed to accept community opportunity");
    res.status(500).json({ error: "Could not accept community opportunity" });
  }
});

/** Links fulfillment only to the participant's own public Community post; private drafts never enter Kinfolk retrieval. */
router.post("/community-opportunities/:opportunityId/fulfill", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const opportunityId = String(req.params.opportunityId ?? "").trim();
  const communityPostId = typeof req.body?.communityPostId === "string" ? req.body.communityPostId.trim() : "";
  if (!communityPostId) return void res.status(400).json({ error: "A published Community post is required" });
  try {
    await ensureCommunityOpportunitySchema();
    const allowed = await pool.query(
      `SELECT 1 FROM community_opportunity_matches
        WHERE opportunity_id = $1 AND participant_user_id = $2 AND status = 'accepted' LIMIT 1`,
      [opportunityId, userId],
    );
    if (!allowed.rows[0]) return void res.status(403).json({ error: "Accepted opportunity participation is required" });
    const post = await pool.query(
      `SELECT 1 FROM community_posts WHERE id = $1 AND author_id = $2 AND visibility = 'public' LIMIT 1`,
      [communityPostId, userId],
    );
    if (!post.rows[0]) return void res.status(400).json({ error: "Only your own public Community post or video may fulfill an opportunity" });
    await pool.query(
      `INSERT INTO community_opportunity_fulfillments (opportunity_id, participant_user_id, community_post_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (opportunity_id) DO UPDATE SET
         participant_user_id = EXCLUDED.participant_user_id,
         community_post_id = EXCLUDED.community_post_id,
         status = 'published', withdrawn_at = NULL`,
      [opportunityId, userId, communityPostId],
    );
    await pool.query(`UPDATE community_opportunities SET status = 'fulfilled', updated_at = NOW() WHERE id = $1`, [opportunityId]);
    res.json({ ok: true, status: "fulfilled", retrievalEligibility: "public_community_content_only" });
  } catch (error) {
    req.log.error({ error }, "Failed to fulfill community opportunity");
    res.status(500).json({ error: "Could not record opportunity fulfillment" });
  }
});

/** Public posts can be withdrawn from the opportunity index by their fulfillment participant. */
router.delete("/community-opportunities/:opportunityId/fulfillment", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await ensureCommunityOpportunitySchema();
    const removed = await pool.query(
      `UPDATE community_opportunity_fulfillments
          SET status = 'withdrawn', withdrawn_at = NOW()
        WHERE opportunity_id = $1 AND participant_user_id = $2 AND status = 'published'
        RETURNING opportunity_id`,
      [String(req.params.opportunityId ?? ""), userId],
    );
    if (!removed.rows[0]) return void res.status(404).json({ error: "Published fulfillment not found" });
    res.json({ ok: true, retrievalEligibility: "withdrawn" });
  } catch (error) {
    req.log.error({ error }, "Failed to withdraw opportunity fulfillment");
    res.status(500).json({ error: "Could not withdraw opportunity fulfillment" });
  }
});

function serializeOpportunity(row: OpportunityRow) {
  return {
    id: row.id,
    topicKey: row.topic_key,
    topicLabel: communityNeedTopicLabel(row.topic_key),
    status: row.status,
    createdAt: row.created_at,
    fulfillmentPostId: row.fulfillment_post_id,
    privacy: "Aggregate topic only; no member conversations, identities, notes, or private memory are shared.",
  };
}

export default router;
