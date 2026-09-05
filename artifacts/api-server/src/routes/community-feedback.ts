/**
 * Unified Business Experience
 *
 * Positive, allowlisted quick feedback is published immediately. It is not a
 * verification claim and never changes business ownership or verified status.
 * Free-text reviews, safety reports, photos, and videos retain their existing
 * moderation rules.
 */
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  getBusinessExperiencePolicy,
  isExperienceChoiceAllowed,
  normalizeBusinessExperiencePriceKey,
  normalizeOwnerExperienceKey,
  type BusinessExperienceKind,
} from "@workspace/constants";

const router = Router();

type StoredKind = "vibe" | "caption";
type AggregateRow = { kind: StoredKind; key: string; count: number | string };

const MAX_SELECTIONS: Record<BusinessExperienceKind, number> = {
  vibe: 2,
  reaction: 2,
  price: 1,
};

function storageIdentity(kind: BusinessExperienceKind, key: string): { kind: StoredKind; key: string } {
  if (kind === "vibe") return { kind: "vibe", key };
  if (kind === "price") return { kind: "caption", key: `price:${key}` };
  return { kind: "caption", key };
}

function responseIdentity(kind: StoredKind, key: string): { kind: BusinessExperienceKind; key: string } {
  if (kind === "vibe") return { kind: "vibe", key };
  if (key.startsWith("price:")) return { kind: "price", key: key.slice("price:".length) };
  return { kind: "reaction", key };
}

function collectAggregates(rows: AggregateRow[]) {
  const vibeCounts: Record<string, number> = {};
  const reactionCounts: Record<string, number> = {};
  const priceCounts: Record<string, number> = {};

  for (const row of rows) {
    const identity = responseIdentity(row.kind, row.key);
    const count = Number(row.count);
    if (identity.kind === "vibe") vibeCounts[identity.key] = count;
    else if (identity.kind === "price") priceCounts[identity.key] = count;
    else reactionCounts[identity.key] = count;
  }

  return {
    vibeCounts,
    reactionCounts,
    priceCounts,
    // Legacy name retained while old clients transition to reactionCounts.
    captionCounts: reactionCounts,
  };
}

async function getBusinessPolicy(businessId: string) {
  const result = await pool.query<{
    category: string;
    subcategory: string | null;
    vibes: string[] | null;
    price_range: string | null;
  }>(
    `SELECT category, subcategory, vibes, price_range
       FROM businesses
      WHERE id = $1
        AND listing_status IN ('live', 'live_unclaimed', 'verified', 'active')
        AND status = 'active'
      LIMIT 1`,
    [businessId],
  );
  const business = result.rows[0];
  if (!business) return null;
  const policy = getBusinessExperiencePolicy(business.category, business.subcategory);

  return {
    policy,
    ownerChoices: {
      vibes: Array.isArray(business.vibes)
        ? business.vibes.map(normalizeOwnerExperienceKey).slice(0, 2)
        : [],
      price: normalizeBusinessExperiencePriceKey(policy, business.price_range),
    },
  };
}

async function readExperience(businessId: string, memberId?: string) {
  const [aggregateResult, viewerResult] = await Promise.all([
    pool.query<AggregateRow>(
      `SELECT kind, key, COUNT(*)::int AS count
         FROM business_member_feedback
        WHERE business_id = $1
          AND status = 'active'
          AND is_load_test = FALSE
        GROUP BY kind, key`,
      [businessId],
    ),
    memberId
      ? pool.query<{ kind: StoredKind; key: string }>(
          `SELECT kind, key
             FROM business_member_feedback
            WHERE business_id = $1
              AND member_id = $2
              AND status = 'active'`,
          [businessId, memberId],
        )
      : Promise.resolve({ rows: [] as { kind: StoredKind; key: string }[] }),
  ]);

  return {
    aggregates: collectAggregates(aggregateResult.rows),
    viewerSelections: viewerResult.rows.map((row) => responseIdentity(row.kind, row.key)),
  };
}

router.get(
  "/businesses/:businessId/community-feedback",
  async (req: Request, res: Response) => {
    const businessId = String(req.params.businessId);
    const memberId = req.user?.id;

    try {
      const businessPolicy = await getBusinessPolicy(businessId);
      if (!businessPolicy) {
        res.status(404).json({ error: "Business not found or not publicly active." });
        return;
      }
      const experience = await readExperience(businessId, memberId);
      res.json({
        policy: businessPolicy.policy,
        ownerChoices: businessPolicy.ownerChoices,
        aggregates: experience.aggregates,
        viewerSelections: experience.viewerSelections,
        // Backward compatibility for the production website during rollout.
        ...experience.aggregates,
        viewerFeedbackSelections: experience.viewerSelections.map((selection) => ({
          kind: selection.kind === "reaction" ? "caption" : selection.kind,
          key: selection.key,
        })),
        moderation: {
          quickPositiveFeedback: "immediate",
          verificationEffect: "none",
        },
      });
    } catch (err) {
      req.log.error({ err }, "community-feedback GET failed");
      res.status(500).json({ error: "Failed to load community feedback." });
    }
  },
);

router.put(
  "/businesses/:businessId/community-feedback",
  async (req: Request, res: Response) => {
    const memberId = req.user?.id;
    if (!memberId) {
      res.status(401).json({ error: "Sign in to share your experience." });
      return;
    }

    const businessId = String(req.params.businessId);
    const body = req.body as { kind?: string; key?: string; selected?: boolean };
    const kind = body.kind as BusinessExperienceKind | undefined;
    const key = typeof body.key === "string" ? body.key.trim() : "";

    if (!kind || !(["vibe", "reaction", "price"] as string[]).includes(kind)) {
      res.status(400).json({ error: "kind must be vibe, reaction, or price." });
      return;
    }
    if (typeof body.selected !== "boolean") {
      res.status(400).json({ error: "selected must be a boolean." });
      return;
    }

    try {
      const businessPolicy = await getBusinessPolicy(businessId);
      if (!businessPolicy) {
        res.status(404).json({ error: "Business not found or not publicly active." });
        return;
      }
      if (!key || !isExperienceChoiceAllowed(businessPolicy.policy, kind, key)) {
        res.status(400).json({ error: "That quick tag is not available for this business type." });
        return;
      }

      const memberResult = await pool.query<{ is_load_test: boolean }>(
        "SELECT is_load_test FROM users WHERE id = $1 LIMIT 1",
        [memberId],
      );
      const isLoadTest = memberResult.rows[0]?.is_load_test ?? false;
      const stored = storageIdentity(kind, key);
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
          `${businessId}:${memberId}:${kind}`,
        ]);

        if (body.selected) {
          const activeResult = await client.query<{ count: number | string }>(
            `SELECT COUNT(*)::int AS count
               FROM business_member_feedback
              WHERE business_id = $1
                AND member_id = $2
                AND status = 'active'
                AND CASE
                  WHEN $3 = 'vibe' THEN kind = 'vibe'
                  WHEN $3 = 'price' THEN kind = 'caption' AND key LIKE 'price:%'
                  ELSE kind = 'caption' AND key NOT LIKE 'price:%'
                END`,
            [businessId, memberId, kind],
          );
          const existingResult = await client.query(
            `SELECT 1 FROM business_member_feedback
              WHERE business_id = $1 AND member_id = $2 AND kind = $3 AND key = $4 AND status = 'active'`,
            [businessId, memberId, stored.kind, stored.key],
          );
          if (existingResult.rows.length === 0 && Number(activeResult.rows[0]?.count ?? 0) >= MAX_SELECTIONS[kind]) {
            await client.query("ROLLBACK");
            res.status(409).json({
              error: kind === "price"
                ? "Choose one price point."
                : `Choose up to ${MAX_SELECTIONS[kind]} ${kind === "vibe" ? "vibes" : "quick reviews"}.`,
              code: "SELECTION_LIMIT",
            });
            return;
          }

          if (kind === "price") {
            await client.query(
              `UPDATE business_member_feedback
                  SET status = 'removed', updated_at = NOW()
                WHERE business_id = $1 AND member_id = $2
                  AND kind = 'caption' AND key LIKE 'price:%'`,
              [businessId, memberId],
            );
          }

          await client.query(
            `INSERT INTO business_member_feedback
               (id, business_id, member_id, kind, key, status, is_load_test, created_at, updated_at)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'active', $5, NOW(), NOW())
             ON CONFLICT (business_id, member_id, kind, key)
             DO UPDATE SET status = 'active', is_load_test = EXCLUDED.is_load_test, updated_at = NOW()`,
            [businessId, memberId, stored.kind, stored.key, isLoadTest],
          );
        } else {
          await client.query(
            `UPDATE business_member_feedback
                SET status = 'removed', updated_at = NOW()
              WHERE business_id = $1 AND member_id = $2 AND kind = $3 AND key = $4`,
            [businessId, memberId, stored.kind, stored.key],
          );
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      const experience = await readExperience(businessId, memberId);
      res.json({
        memberSelection: { kind, key, selected: body.selected },
        aggregates: experience.aggregates,
        viewerSelections: experience.viewerSelections,
        updatedAt: new Date().toISOString(),
        moderation: {
          status: "published_immediately",
          reason: "Allowlisted positive quick feedback",
          verificationEffect: "none",
        },
      });
    } catch (err) {
      req.log.error({ err }, "community-feedback PUT failed");
      res.status(500).json({ error: "Failed to save your feedback. Please try again." });
    }
  },
);

export default router;
