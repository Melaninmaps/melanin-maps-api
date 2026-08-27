/*
 * Library Growth Admin Routes
 *
 * Curator/admin-only endpoints for the governed Library Growth Engine.
 * All routes require isAdmin(req). No member-facing routes here.
 *
 * Routes:
 *   GET  /admin/library-growth/worker-health  — current worker metrics
 *   GET  /admin/library-growth/candidates     — list candidates (filter by status)
 *   GET  /admin/library-growth/candidates/:id — single candidate detail
 *   POST /admin/library-growth/candidates/:id/decide      — approve / reject
 *   POST /admin/library-growth/candidates/:id/materialize — create draft topic node
 *   POST /admin/library-growth/topics/:topicId/publish    — publish when evidence ready
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { isAdmin } from "../lib/adminAuth";
import { pool } from "@workspace/db";
import {
  recordLibraryGrowthDecision,
  materializeApprovedLibraryCandidate,
  publishLibraryNodeWhenEvidenceReady,
} from "../lib/library-growth-engine";
import { getLibraryGrowthWorkerStatus } from "../lib/library-growth-worker";

const router = Router();

// ─── Worker health ────────────────────────────────────────────────────────────

router.get("/admin/library-growth/worker-health", (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(getLibraryGrowthWorkerStatus());
});

// ─── Candidate list ───────────────────────────────────────────────────────────

router.get("/admin/library-growth/candidates", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  const status = typeof req.query.status === "string" ? req.query.status : null;
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10), 200);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const allowedStatuses = ["pending_threshold", "pending_review", "approved", "materialized", "rejected", "expired"];
  if (status && !allowedStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, canonical_subject, category, desired_node_type, parent_topic_id,
              geography_scope, distinct_user_count, signal_count, sensitivity_tier,
              proposed_status, first_seen_at, last_seen_at, rationale, created_at, updated_at
       FROM library_growth_candidates
       ${status ? "WHERE proposed_status = $1" : ""}
       ORDER BY
         CASE proposed_status
           WHEN 'pending_review' THEN 0
           WHEN 'approved' THEN 1
           WHEN 'pending_threshold' THEN 2
           ELSE 3
         END,
         distinct_user_count DESC,
         last_seen_at DESC
       LIMIT $${status ? "2" : "1"} OFFSET $${status ? "3" : "2"}`,
      status ? [status, limit, offset] : [limit, offset],
    );

    const { rows: [{ total }] } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM library_growth_candidates
       ${status ? "WHERE proposed_status = $1" : ""}`,
      status ? [status] : [],
    );

    res.json({ candidates: rows, total, limit, offset });
  } catch (err: unknown) {
    res.status(500).json({ error: "Could not load candidates", detail: String(err) });
  }
});

// ─── Single candidate ─────────────────────────────────────────────────────────

router.get("/admin/library-growth/candidates/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const { rows: [candidate] } = await pool.query(
      `SELECT c.*, 
              json_agg(d ORDER BY d.created_at DESC) FILTER (WHERE d.id IS NOT NULL) AS decisions
       FROM library_growth_candidates c
       LEFT JOIN library_growth_decisions d ON d.candidate_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [req.params.id],
    );
    if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }
    res.json({ candidate });
  } catch (err: unknown) {
    res.status(500).json({ error: "Could not load candidate", detail: String(err) });
  }
});

// ─── Approve / reject ─────────────────────────────────────────────────────────

router.post("/admin/library-growth/candidates/:id/decide", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!req.user?.id) { res.status(401).json({ error: "Sign in required" }); return; }

  const { decision, reason, evidencePlan } = req.body as {
    decision?: string;
    reason?: string;
    evidencePlan?: {
      requiredAuthorityTiers?: string[];
      minimumSources?: number;
      requiresDomainReviewer?: boolean;
    };
  };

  if (!decision || !["approved", "rejected"].includes(decision)) {
    res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
    return;
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    res.status(400).json({ error: "A reason of at least 10 characters is required" });
    return;
  }
  if (decision === "approved" && !evidencePlan) {
    res.status(400).json({ error: "An evidence plan is required when approving a candidate" });
    return;
  }

  try {
    const rawCandidateId = req.params.id;
    const candidateId = Array.isArray(rawCandidateId) ? rawCandidateId[0] ?? "" : rawCandidateId;
    const authorityTiers = evidencePlan?.requiredAuthorityTiers?.filter(
      (tier): tier is "authoritative" | "professional" | "contextual" =>
        tier === "authoritative" || tier === "professional" || tier === "contextual",
    ) ?? ["authoritative"];
    await recordLibraryGrowthDecision({
      candidateId,
      approvedByUserId: req.user.id,
      decision: decision as "approved" | "rejected",
      reason: reason.trim(),
      evidencePlan: {
        requiredAuthorityTiers: authorityTiers,
        minimumSources: evidencePlan?.minimumSources ?? 2,
        requiresDomainReviewer: evidencePlan?.requiresDomainReviewer ?? false,
      },
    });
    res.json({ ok: true, decision, candidateId: req.params.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// ─── Materialize draft node ───────────────────────────────────────────────────

router.post("/admin/library-growth/candidates/:id/materialize", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!req.user?.id) { res.status(401).json({ error: "Sign in required" }); return; }

  try {
    const rawCandidateId = req.params.id;
    const candidateId = Array.isArray(rawCandidateId) ? rawCandidateId[0] ?? "" : rawCandidateId;
    const { topicId } = await materializeApprovedLibraryCandidate(candidateId, req.user.id);
    res.json({ ok: true, topicId, candidateId: req.params.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// ─── Publish with evidence ─────────────────────────────────────────────────────

router.post("/admin/library-growth/topics/:topicId/publish", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!req.user?.id) { res.status(401).json({ error: "Sign in required" }); return; }

  try {
    const rawTopicId = req.params.topicId;
    const topicId = Array.isArray(rawTopicId) ? rawTopicId[0] ?? "" : rawTopicId;
    await publishLibraryNodeWhenEvidenceReady(topicId);
    res.json({ ok: true, topicId: req.params.topicId, status: "published" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

export default router;
