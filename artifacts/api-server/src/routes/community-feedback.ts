/**
 * Community Feedback — real member-backed vibes + captions
 *
 * Replaces the legacy vibe_tag / endorsement_tap / community_says write paths
 * for the two Community Vibes and Community Says UI controls on the business
 * detail page.  All reads/writes go through business_member_feedback, which
 * has proper status and is_load_test columns so aggregates are always clean.
 *
 * Routes
 *   GET  /api/businesses/:businessId/community-feedback
 *   PUT  /api/businesses/:businessId/community-feedback   (auth required)
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// ── Canonical allowlists ───────────────────────────────────────────────────
const VALID_VIBES = new Set([
  "locals_know",
  "auntie_energy",
  "hood_classic",
  "soft_life",
  "neighborhood_love",
  "history_lives_here",
  "sunday_best",
  "take_somebody_from_out_of_town",
]);

const VALID_CAPTIONS = new Set([
  "sent_the_group_chat",
  "cooks_like_home",
  "worth_the_drive",
  "portions_with_love",
  "grandma_approved",
  "seasoned_right",
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns aggregate counts split by kind for a single business.
 *  Only counts active rows from non-load-test members. */
async function getAggregates(businessId: string): Promise<{
  vibeCounts: Record<string, number>;
  captionCounts: Record<string, number>;
}> {
  const r = await pool.query<{ kind: string; key: string; count: string }>(
    `SELECT kind, key, COUNT(*)::int AS count
     FROM business_member_feedback
     WHERE business_id = $1
       AND status = 'active'
       AND is_load_test = FALSE
     GROUP BY kind, key`,
    [businessId],
  );
  const vibeCounts: Record<string, number> = {};
  const captionCounts: Record<string, number> = {};
  for (const row of r.rows) {
    if (row.kind === "vibe") vibeCounts[row.key] = Number(row.count);
    else if (row.kind === "caption") captionCounts[row.key] = Number(row.count);
  }
  return { vibeCounts, captionCounts };
}

// ── GET /api/businesses/:businessId/community-feedback ────────────────────
// Public for aggregate counts; viewer selections returned only when auth'd.
router.get(
  "/businesses/:businessId/community-feedback",
  async (req: Request, res: Response) => {
    const businessId = String(req.params.businessId);
    const memberId = (req as any).user?.id as string | undefined;

    try {
      const [aggResult, viewerResult] = await Promise.all([
        pool.query<{ kind: string; key: string; count: string }>(
          `SELECT kind, key, COUNT(*)::int AS count
           FROM business_member_feedback
           WHERE business_id = $1
             AND status = 'active'
             AND is_load_test = FALSE
           GROUP BY kind, key`,
          [businessId],
        ),
        memberId
          ? pool.query<{ kind: string; key: string }>(
              `SELECT kind, key
               FROM business_member_feedback
               WHERE business_id = $1
                 AND member_id = $2
                 AND status = 'active'`,
              [businessId, memberId],
            )
          : Promise.resolve({ rows: [] as { kind: string; key: string }[] }),
      ]);

      const vibeCounts: Record<string, number> = {};
      const captionCounts: Record<string, number> = {};
      for (const row of aggResult.rows) {
        if (row.kind === "vibe") vibeCounts[row.key] = Number(row.count);
        else if (row.kind === "caption")
          captionCounts[row.key] = Number(row.count);
      }

      res.json({
        vibeCounts,
        captionCounts,
        viewerFeedbackSelections: viewerResult.rows,
      });
    } catch (err) {
      req.log.error({ err }, "community-feedback GET failed");
      res.status(500).json({ error: "Failed to load community feedback." });
    }
  },
);

// ── PUT /api/businesses/:businessId/community-feedback ────────────────────
// Authenticated. Upserts or soft-removes a member's vibe or caption selection.
router.put(
  "/businesses/:businessId/community-feedback",
  async (req: Request, res: Response) => {
    const memberId = (req as any).user?.id as string | undefined;
    if (!memberId) {
      res
        .status(401)
        .json({ error: "Sign in to interact with this business." });
      return;
    }

    const businessId = String(req.params.businessId);
    const body = req.body as { kind?: string; key?: string; selected?: boolean };
    const { kind, key, selected } = body;

    // Validate kind
    if (kind !== "vibe" && kind !== "caption") {
      res.status(400).json({ error: "kind must be 'vibe' or 'caption'" });
      return;
    }

    // Validate key against canonical allowlist
    const validKeys = kind === "vibe" ? VALID_VIBES : VALID_CAPTIONS;
    if (!key || !validKeys.has(key)) {
      res.status(400).json({ error: `Invalid ${kind} key: ${String(key)}` });
      return;
    }

    if (typeof selected !== "boolean") {
      res.status(400).json({ error: "'selected' must be a boolean" });
      return;
    }

    try {
      // Confirm business exists and is publicly active
      const bizCheck = await pool.query(
        `SELECT id FROM businesses
         WHERE id = $1
           AND listing_status IN ('live', 'live_unclaimed', 'verified', 'active')
         LIMIT 1`,
        [businessId],
      );
      if (bizCheck.rows.length === 0) {
        res
          .status(404)
          .json({ error: "Business not found or not publicly active." });
        return;
      }

      // Check if member is a load-test account
      const memberCheck = await pool.query<{ is_load_test: boolean }>(
        `SELECT is_load_test FROM users WHERE id = $1 LIMIT 1`,
        [memberId],
      );
      const isLoadTest = memberCheck.rows[0]?.is_load_test ?? false;

      if (selected) {
        // Upsert: activate or create the record
        await pool.query(
          `INSERT INTO business_member_feedback
             (id, business_id, member_id, kind, key, status, is_load_test, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'active', $5, NOW(), NOW())
           ON CONFLICT (business_id, member_id, kind, key)
           DO UPDATE SET status = 'active', updated_at = NOW()`,
          [businessId, memberId, kind, key, isLoadTest],
        );
      } else {
        // Soft-remove: preserves audit trail, excluded from all public aggregates
        await pool.query(
          `UPDATE business_member_feedback
           SET status = 'removed', updated_at = NOW()
           WHERE business_id = $1
             AND member_id  = $2
             AND kind       = $3
             AND key        = $4`,
          [businessId, memberId, kind, key],
        );
      }

      const { vibeCounts, captionCounts } = await getAggregates(businessId);

      res.json({
        memberSelection: { kind, key, selected },
        aggregates: { vibeCounts, captionCounts },
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "community-feedback PUT failed");
      res
        .status(500)
        .json({ error: "Failed to save your feedback. Please try again." });
    }
  },
);

export default router;
