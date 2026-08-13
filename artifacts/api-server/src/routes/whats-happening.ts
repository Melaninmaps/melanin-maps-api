/**
 * What's Happening — Article submission, source validation, topic management
 *
 * Spec §H, §I: Governed pipeline for member-submitted current-events links.
 *
 * Routes:
 *   POST /api/whats-happening/submit           — member submits a URL
 *   GET  /api/whats-happening/topics           — active/context_ready topics (authenticated)
 *   GET  /api/whats-happening/topics/:id       — single topic
 *   POST /api/admin/whats-happening/:id/review — curator approve/hold/archive
 *   GET  /api/admin/whats-happening/queue      — curator review queue
 *
 * Privacy rules (spec §H.6):
 *   - No external notification, push, email, DM, Circle event, or business alert in this release
 *   - Member note is never used for profile inference
 *   - Suggested geography is member-supplied; IP is never used to infer location
 *   - Load-test accounts produce no public case or delivery event
 */

import { Router } from "express";
import { pool } from "@workspace/db";
import { validatePublicUrl, findExistingSource } from "../lib/url-safety-validator";
import { isAdmin } from "../lib/adminAuth";

export const whatshappeningRouter = Router();

// ── Rate-limit helpers ────────────────────────────────────────────────────────
// Simple in-process rate limit (per-user, 10 submissions per 24h)
const submissionCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = submissionCounts.get(userId);
  if (!bucket || now > bucket.resetAt) {
    submissionCounts.set(userId, { count: 1, resetAt: now + 86_400_000 });
    return true;
  }
  if (bucket.count >= 10) return false;
  bucket.count++;
  return true;
}

// ── Source tier classifier ────────────────────────────────────────────────────
// Deterministic — no LLM call. Based on publisher hostname patterns.
const TIER_A_PATTERNS = [
  /\.(gov|mil)$/i,
  /^(www\.)?(fema|cdc|doj|state|hhs|phe|ready|emergency\.cdc|niaid|nasa|epa|fbi|cia|dhs|fda|cms|ssa)\.gov$/i,
  /^(www\.)?who\.int$/i,
  /^(www\.)?un\.org$/i,
  /^(www\.)?reuters\.com$/i,
  /^(www\.)?apnews\.com$/i,
];

const TIER_B_PATTERNS = [
  /^(www\.)?(nytimes|washingtonpost|theguardian|bbc|npr|pbs|propublica|theatlantic|vox|axios|politico)\.com$/i,
  /^(www\.)?(theroot|essence|blavity|afrotech|colorlines|ebony|jet|blackenterprise)\.com$/i,
  /^(www\.)?nollywire\.com$/i,
  /^(www\.)?(nbcnews|abcnews|cbsnews|cnn|foxnews|msnbc|usatoday)\.com$/i,
];

function classifySourceTier(hostname: string): "A" | "B" | "C" | "D" {
  const h = hostname.toLowerCase();
  if (TIER_A_PATTERNS.some((p) => p.test(h))) return "A";
  if (TIER_B_PATTERNS.some((p) => p.test(h))) return "B";
  // C = identifiable publisher; D = unknown/social
  if (h.includes(".") && !h.includes("twitter") && !h.includes("facebook") && !h.includes("tiktok")) return "C";
  return "D";
}

// ── POST /api/whats-happening/submit ─────────────────────────────────────────

whatshappeningRouter.post(
  "/api/whats-happening/submit",
  async (req, res): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const userId = req.user.id;

    // Load-test accounts: silent no-op (spec §H.1)
    const isLoadTest = req.user.email?.startsWith("load-test-") ?? false;

    // Rate limit
    if (!isLoadTest && !checkRateLimit(userId)) {
      res.status(429).json({ error: "Submission limit reached. You may submit up to 10 links per 24 hours." });
      return;
    }

    const { articleUrl, memberNote, suggestedGeography, suggestedTopic } = req.body as {
      articleUrl?: string;
      memberNote?: string;
      suggestedGeography?: string;
      suggestedTopic?: string;
    };

    if (!articleUrl || typeof articleUrl !== "string") {
      res.status(400).json({ error: "articleUrl is required." });
      return;
    }
    if (articleUrl.length > 2048) {
      res.status(400).json({ error: "URL is too long (max 2048 characters)." });
      return;
    }
    if (memberNote && memberNote.length > 280) {
      res.status(400).json({ error: "Member note must be 280 characters or fewer." });
      return;
    }

    // 1. URL safety check (pre-fetch validation)
    const safetyResult = await validatePublicUrl(articleUrl, { maxRedirects: 3, timeoutMs: 10_000 });
    if (!safetyResult.safe) {
      res.status(422).json({
        error: "URL did not pass safety validation.",
        reason: safetyResult.reason,
        status: "rejected",
      });
      return;
    }

    const { canonicalUrl, finalUrl, httpStatus, contentHash, publisher } = safetyResult;

    // 2. Dedup: check if this canonical URL already has a source record
    const existingSourceId = await findExistingSource(canonicalUrl);

    // 3. Insert submission record
    let submissionId: string;
    try {
      const subResult = await pool.query<{ id: string }>(
        `INSERT INTO happening_submissions
           (submitted_by_user_id, submitted_url, canonical_url, member_note,
            suggested_geography, suggested_topic, status, is_load_test)
         VALUES ($1, $2, $3, $4, $5, $6, 'member_submitted', $7)
         RETURNING id`,
        [
          userId,
          articleUrl,
          canonicalUrl,
          memberNote?.trim() || null,
          suggestedGeography?.trim().slice(0, 160) || null,
          suggestedTopic?.trim().slice(0, 100) || null,
          isLoadTest,
        ],
      );
      submissionId = subResult.rows[0].id;
    } catch (err) {
      req.log?.error({ err }, "whats-happening: failed to insert submission");
      res.status(500).json({ error: "Failed to record submission." });
      return;
    }

    // 4. If no existing source, create one in 'held' state pending curator review
    let sourceId = existingSourceId;
    if (!sourceId) {
      try {
        const hostname = new URL(canonicalUrl).hostname;
        const tier = classifySourceTier(hostname);
        const sourceResult = await pool.query<{ id: string }>(
          `INSERT INTO happening_sources
             (submission_id, canonical_url, publisher, source_tier, http_status,
              redirect_url, content_hash, source_status, checked_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'held', now())
           ON CONFLICT (canonical_url) DO UPDATE
             SET checked_at = now(), http_status = EXCLUDED.http_status
           RETURNING id`,
          [submissionId, canonicalUrl, publisher, tier, httpStatus,
           finalUrl !== canonicalUrl ? finalUrl : null, contentHash],
        );
        sourceId = sourceResult.rows[0].id;
      } catch (err) {
        req.log?.error({ err }, "whats-happening: failed to upsert source");
        // Non-fatal: submission exists, source can be created by worker
      }
    }

    res.status(201).json({
      status: "member_submitted",
      submissionId,
      sourceId,
      message: "Member-shared link · Source review pending.",
      duplicate: !!existingSourceId,
    });
  },
);

// ── GET /api/whats-happening/topics ──────────────────────────────────────────

whatshappeningRouter.get(
  "/api/whats-happening/topics",
  async (req, res): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { category, geography, limit = "20" } = req.query as Record<string, string>;
    const limitN = Math.min(Number(limit) || 20, 50);

    try {
      const params: unknown[] = ["context_ready", "active"];
      let where = `WHERE ht.status = ANY($1::text[])
                     AND ht.sensitivity_tier IN ('standard', 'public_interest')`;
      let paramIdx = 2;

      if (category) {
        where += ` AND ht.category = $${paramIdx++}`;
        params.push(category);
      }

      const res2 = await pool.query(
        `SELECT ht.id, ht.canonical_title, ht.canonical_key, ht.category,
                ht.geography_scope, ht.language_codes, ht.sensitivity_tier,
                ht.status, ht.current_summary, ht.summary_source_count,
                ht.last_updated_at, ht.expires_at,
                (SELECT json_agg(json_build_object('title', hs.source_title, 'publisher', hs.publisher, 'tier', hs.source_tier, 'url', hs.canonical_url))
                 FROM happening_topic_sources hts
                 JOIN happening_sources hs ON hs.id = hts.source_id
                 WHERE hts.topic_id = ht.id AND hs.source_status = 'active') AS sources
         FROM happening_topics ht
         ${where}
         ORDER BY ht.last_updated_at DESC
         LIMIT $${paramIdx}`,
        [...params, limitN],
      );

      res.json({ topics: res2.rows });
    } catch (err) {
      req.log?.error({ err }, "whats-happening: failed to fetch topics");
      res.status(500).json({ error: "Failed to fetch topics." });
    }
  },
);

// ── GET /api/whats-happening/topics/:id ──────────────────────────────────────

whatshappeningRouter.get(
  "/api/whats-happening/topics/:id",
  async (req, res): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const topicRes = await pool.query(
        `SELECT ht.*,
                (SELECT json_agg(json_build_object(
                  'title', hs.source_title, 'publisher', hs.publisher,
                  'tier', hs.source_tier, 'url', hs.canonical_url,
                  'relationship', hts.relationship_type))
                 FROM happening_topic_sources hts
                 JOIN happening_sources hs ON hs.id = hts.source_id
                 WHERE hts.topic_id = ht.id AND hs.source_status = 'active') AS sources,
                (SELECT json_agg(json_build_object(
                  'library_topic_id', htl.library_topic_id,
                  'relationship', htl.relationship_type))
                 FROM happening_topic_library_links htl
                 WHERE htl.topic_id = ht.id) AS library_links,
                (SELECT row_to_json(smc) FROM safety_monitoring_cases smc
                 WHERE smc.happening_topic_id = ht.id LIMIT 1) AS safety_case
         FROM happening_topics ht
         WHERE ht.id = $1
           AND ht.status IN ('context_ready', 'active')
           AND ht.sensitivity_tier IN ('standard', 'public_interest')`,
        [req.params.id],
      );

      if (!topicRes.rows[0]) {
        res.status(404).json({ error: "Topic not found." });
        return;
      }
      res.json(topicRes.rows[0]);
    } catch (err) {
      req.log?.error({ err }, "whats-happening: failed to fetch topic");
      res.status(500).json({ error: "Failed to fetch topic." });
    }
  },
);

// ── GET /api/admin/whats-happening/queue ─────────────────────────────────────

whatshappeningRouter.get(
  "/api/admin/whats-happening/queue",
  async (req, res): Promise<void> => {
    if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
    try {
      const queueRes = await pool.query(
        `SELECT hs.id, hs.canonical_url, hs.publisher, hs.source_tier,
                hs.source_status, hs.checked_at, hs.http_status,
                hs.attribution_excerpt,
                hsub.member_note, hsub.suggested_geography, hsub.suggested_topic,
                hsub.submitted_by_user_id, hsub.created_at AS submitted_at
         FROM happening_sources hs
         LEFT JOIN happening_submissions hsub ON hsub.id = hs.submission_id
         WHERE hs.source_status = 'held'
         ORDER BY hs.created_at DESC
         LIMIT 50`,
      );
      res.json({ queue: queueRes.rows });
    } catch (err) {
      req.log?.error({ err }, "whats-happening: failed to fetch queue");
      res.status(500).json({ error: "Failed to fetch review queue." });
    }
  },
);

// ── POST /api/admin/whats-happening/:id/review ───────────────────────────────
// Curator approves (activates source), holds, or archives with a written reason.

whatshappeningRouter.post(
  "/api/admin/whats-happening/:id/review",
  async (req, res): Promise<void> => {
    if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
    const { action, reason, topicId } = req.body as {
      action: "approve" | "hold" | "archive";
      reason?: string;
      topicId?: string;
    };

    if (!["approve", "hold", "archive"].includes(action)) {
      res.status(400).json({ error: "action must be 'approve', 'hold', or 'archive'." });
      return;
    }
    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ error: "A written reason of at least 10 characters is required." });
      return;
    }

    const newSourceStatus = action === "approve" ? "active" : action === "archive" ? "deprecated" : "held";

    try {
      await pool.query(
        `UPDATE happening_sources SET source_status = $1, updated_at = now() WHERE id = $2`,
        [newSourceStatus, req.params.id],
      );

      // If approving + topicId provided, link source to topic and activate topic if context_ready
      if (action === "approve" && topicId) {
        await pool.query(
          `UPDATE happening_topics
           SET status = CASE WHEN status = 'pending_review' THEN 'context_ready' ELSE status END,
               last_updated_at = now(), summary_source_count = summary_source_count + 1
           WHERE id = $1`,
          [topicId],
        );
      }

      req.log?.info({ sourceId: req.params.id, action, curatorId: req.user!.id, reason: reason.trim() },
        "whats-happening: curator review");

      res.json({ success: true, sourceId: req.params.id, action, newSourceStatus });
    } catch (err) {
      req.log?.error({ err }, "whats-happening: review update failed");
      res.status(500).json({ error: "Failed to update source status." });
    }
  },
);

// ── POST /api/admin/whats-happening/:topicId/safety ──────────────────────────
// Creates or updates a safety monitoring case for a topic.

whatshappeningRouter.post(
  "/api/admin/whats-happening/:topicId/safety",
  async (req, res): Promise<void> => {
    if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
    const {
      caseClass, status, severity, canonicalTitle,
      geography, officialActionText, officialActionSourceId,
    } = req.body as {
      caseClass: string;
      status: string;
      severity: string;
      canonicalTitle: string;
      geography: Record<string, unknown>;
      officialActionText?: string;
      officialActionSourceId?: string;
    };

    const VALID_CLASSES = ["civil_unrest","armed_conflict_or_terrorism","violent_incident",
      "natural_disaster_or_severe_weather","public_health_disruption",
      "transport_or_infrastructure_disruption","travel_advisory","evacuation_or_shelter"];
    const VALID_STATUSES = ["candidate_received","source_checked","needs_corroboration",
      "active_monitoring","official_imminent","resolved_or_archived","held_or_rejected"];
    const VALID_SEVERITIES = ["info","elevated","urgent"];

    if (!VALID_CLASSES.includes(caseClass) || !VALID_STATUSES.includes(status) || !VALID_SEVERITIES.includes(severity)) {
      res.status(400).json({ error: "Invalid case_class, status, or severity." });
      return;
    }

    try {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO safety_monitoring_cases
           (happening_topic_id, case_class, status, severity, canonical_title,
            geography, official_action_text, official_action_source_id, requires_curator_review)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, true)
         ON CONFLICT (happening_topic_id) DO UPDATE
           SET status = EXCLUDED.status, severity = EXCLUDED.severity,
               official_action_text = EXCLUDED.official_action_text,
               updated_at = now()
         RETURNING id`,
        [req.params.topicId, caseClass, status, severity, canonicalTitle,
         JSON.stringify(geography), officialActionText ?? null, officialActionSourceId ?? null],
      );

      req.log?.info({ caseId: result.rows[0].id, status, curatorId: req.user!.id },
        "whats-happening: safety case updated");

      res.json({ success: true, caseId: result.rows[0].id });
    } catch (err) {
      req.log?.error({ err }, "whats-happening: safety case update failed");
      res.status(500).json({ error: "Failed to update safety case." });
    }
  },
);
