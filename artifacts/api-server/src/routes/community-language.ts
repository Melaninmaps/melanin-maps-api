import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import {
  validateCommunityLanguageProposal,
  type ApprovedCommunityLanguageTerm,
} from "../kinfolk/community-language";

const router: IRouter = Router();
const MAX_PROPOSALS_PER_DAY = 10;
const REVIEW_STATUSES = new Set(["approved", "rejected"]);

function currentUserId(req: Request): string | null {
  const id = (req as Request & { user?: { id?: unknown } }).user?.id;
  return typeof id === "string" && id.trim() ? id : null;
}

/** Members may propose a local term; it never affects Kinfolk until an admin approves it. */
router.post("/community-language/proposals", async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  if (!userId) return void res.status(401).json({ error: "Authentication required" });
  const parsed = validateCommunityLanguageProposal(req.body ?? {});
  if (!parsed.ok) return void res.status(400).json({ error: parsed.error });

  try {
    const recent = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM community_language_proposals
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId],
    );
    if (Number(recent.rows[0]?.count ?? 0) >= MAX_PROPOSALS_PER_DAY) {
      return void res.status(429).json({ error: "You can submit up to 10 community-language proposals per day." });
    }

    const { term, meaning, city, usageExample } = parsed.value;
    const duplicate = await pool.query<{ id: string; status: string }>(
      `SELECT id, status
       FROM community_language_proposals
       WHERE LOWER(term) = LOWER($1)
         AND COALESCE(LOWER(city), '') = COALESCE(LOWER($2), '')
       ORDER BY CASE status WHEN 'approved' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END, created_at DESC
       LIMIT 1`,
      [term, city],
    );
    const existing = duplicate.rows[0];
    if (existing) {
      return void res.status(409).json({
        error: existing.status === "approved"
          ? "This term is already an approved community-language reference."
          : "This term already has a proposal under review.",
      });
    }

    const result = await pool.query(
      `INSERT INTO community_language_proposals
         (user_id, term, meaning, city, usage_example, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, term, meaning, city, usage_example, status, created_at`,
      [userId, term, meaning, city, usageExample],
    );
    req.log?.info({ proposalId: result.rows[0]?.id, userId }, "Community language proposal submitted");
    return void res.status(201).json({ proposal: result.rows[0] });
  } catch (error) {
    req.log?.error({ error, userId }, "Failed to submit community language proposal");
    return void res.status(500).json({ error: "Could not submit the community-language proposal." });
  }
});

/** A member can see only their own proposal status; no other submitter data is exposed. */
router.get("/community-language/proposals/mine", async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  if (!userId) return void res.status(401).json({ error: "Authentication required" });
  try {
    const { rows } = await pool.query(
      `SELECT id, term, meaning, city, usage_example, status, review_note, created_at, reviewed_at
       FROM community_language_proposals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId],
    );
    return void res.json({ proposals: rows });
  } catch (error) {
    req.log?.error({ error, userId }, "Failed to list member community language proposals");
    return void res.status(500).json({ error: "Could not load community-language proposals." });
  }
});

/** Approved references can be shown to signed-in members without revealing proposal authors. */
router.get("/community-language/approved", async (req: Request, res: Response) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  try {
    const { rows } = await pool.query<ApprovedCommunityLanguageTerm>(
      `SELECT term, meaning, city, usage_example AS "usageExample"
       FROM community_language_proposals
       WHERE status = 'approved'
         AND ($1 = '' OR city IS NULL OR LOWER(city) = LOWER($1))
       ORDER BY CASE WHEN city IS NULL THEN 1 ELSE 0 END, term
       LIMIT 100`,
      [city],
    );
    return void res.json({ terms: rows });
  } catch (error) {
    req.log?.error({ error }, "Failed to list approved community language");
    return void res.status(500).json({ error: "Could not load approved community-language references." });
  }
});

router.get("/admin/community-language/proposals", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
  const requestedStatus = typeof req.query.status === "string" ? req.query.status : "pending";
  const status = ["pending", "approved", "rejected"].includes(requestedStatus) ? requestedStatus : "pending";
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, term, meaning, city, usage_example, status, review_note, created_at, reviewed_at, reviewed_by
       FROM community_language_proposals
       WHERE status = $1
       ORDER BY created_at ASC
       LIMIT 250`,
      [status],
    );
    return void res.json({ proposals: rows });
  } catch (error) {
    req.log?.error({ error }, "Failed to list community language review queue");
    return void res.status(500).json({ error: "Could not load the community-language review queue." });
  }
});

/** An administrator must explicitly approve a proposal before Kinfolk can retrieve it. */
router.patch("/admin/community-language/proposals/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) return void res.status(403).json({ error: "Forbidden" });
  const reviewerId = currentUserId(req);
  const id = String(req.params.id ?? "").trim();
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  const reviewNote = req.body?.reviewNote === undefined || req.body?.reviewNote === null
    ? null
    : typeof req.body.reviewNote === "string"
      ? req.body.reviewNote.normalize("NFKC").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").trim()
      : null;
  if (!id || !REVIEW_STATUSES.has(status)) {
    return void res.status(400).json({ error: "status must be approved or rejected" });
  }
  if (reviewNote !== null && reviewNote.length > 500) {
    return void res.status(400).json({ error: "reviewNote must be at most 500 characters" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE community_language_proposals
       SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING id, term, meaning, city, usage_example, status, review_note, reviewed_at`,
      [status, reviewNote, reviewerId, id],
    );
    if (!rows[0]) return void res.status(404).json({ error: "Pending proposal not found" });
    req.log?.info({ proposalId: id, status, reviewerId }, "Community language proposal reviewed");
    return void res.json({ proposal: rows[0] });
  } catch (error) {
    req.log?.error({ error, id, reviewerId }, "Failed to review community language proposal");
    return void res.status(500).json({ error: "Could not review the community-language proposal." });
  }
});

export default router;
