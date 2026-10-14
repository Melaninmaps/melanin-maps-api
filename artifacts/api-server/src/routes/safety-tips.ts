import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, safetyTipsTable, safetyTipConfirmationsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/requireAuth";
import { reportLimiter } from "../middleware/rateLimiter";

const router: IRouter = Router();
router.use(requireAuth);

const CONFIRMATION_THRESHOLD = 3;
const MAX_RADIUS_MILES = 10;

const CATEGORIES = ["violence", "harassment", "discrimination", "theft", "hate_crime", "other"] as const;
type TipCategory = typeof CATEGORIES[number];

function publicSafetyTip<T extends { id: number; businessName?: string | null; city?: string | null; state?: string | null; category?: string | null; confirmationCount?: number | null; status?: string | null }>(tip: T) {
  return { id: tip.id, businessName: tip.businessName ?? null, city: tip.city ?? null, state: tip.state ?? null, category: tip.category ?? null, confirmationCount: tip.confirmationCount ?? 0, status: tip.status ?? "pending", verificationStatus: "private_pending_review" };
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post("/safety-tips", reportLimiter, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { businessName, address, city, state, lat, lng, description, category,
            experienceChip, timeOfDay, whoInvolved, happenedBefore, othersSaw, linkedBusinessId } =
      req.body as {
        businessName?: string;
        address?: string;
        city?: string;
        state?: string;
        lat?: number;
        lng?: number;
        description?: string;
        category?: string;
        experienceChip?: string;
        timeOfDay?: string;
        whoInvolved?: string[];
        happenedBefore?: string;
        othersSaw?: string;
        linkedBusinessId?: string | number;
      };

    // A chip selection alone is a complete, valid submission.
    // At least one of: experienceChip, description, or category must be present.
    const hasMinimum = !!(experienceChip || description?.trim() || category);
    if (!hasMinimum) {
      res.status(400).json({ error: "Select what happened or describe the experience" });
      return;
    }
    if (address?.trim() || lat != null || lng != null) {
      res.status(400).json({ error: "Safety Tips accept only business name, incident city, and report details. Street addresses and coordinates are not collected." });
      return;
    }

    const cat = (CATEGORIES.includes(category as TipCategory) ? category : "violence") as TipCategory;

    const [tip] = await db
      .insert(safetyTipsTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values({
        submittedById: req.user.id,
        businessName: businessName?.trim() || null,
        address: null,
        // DB column is now nullable (migration already ran); Drizzle type hasn't caught up
        city: city?.trim() || "",
        state: state?.trim() || null,
        lat: null,
        lng: null,
        // description is now nullable in DB; use "" as Drizzle placeholder, pool.query corrects to NULL
        description: description?.trim() || "",
        category: cat,
      } as Parameters<typeof db.insert<typeof safetyTipsTable>>[0] extends infer T ? any : never)
      .returning();

    // Persist new chip fields — Drizzle schema doesn't expose these yet so use pool.query
    if (experienceChip || timeOfDay || whoInvolved || happenedBefore || othersSaw || linkedBusinessId) {
      await pool.query(
        `UPDATE safety_tips SET
          experience_chip   = COALESCE($1, experience_chip),
          time_of_day       = COALESCE($2, time_of_day),
          who_involved      = COALESCE($3::text[], who_involved),
          happened_before   = COALESCE($4, happened_before),
          others_saw        = COALESCE($5, others_saw),
          linked_business_id = COALESCE($6::integer, linked_business_id)
         WHERE id = $7`,
        [
          experienceChip ?? null,
          timeOfDay ?? null,
          whoInvolved?.length ? whoInvolved : null,
          happenedBefore ?? null,
          othersSaw ?? null,
          linkedBusinessId ? parseInt(String(linkedBusinessId), 10) : null,
          tip.id,
        ]
      );
    }

    // A new member report stays private pending corroboration and moderation.
    // It must never generate a public/current alert or push merely because it was filed.
    logger.info({ tipId: tip.id, city, category: cat }, "[safety-tips] submitted pending review");
    res.status(201).json({ tip: publicSafetyTip(tip) });
  } catch (err) {
    req.log.error({ err }, "POST /safety-tips error");
    res.status(500).json({ error: "Failed to submit safety tip" });
  }
});

router.get("/safety-tips/nearby", async (req: Request, res: Response) => {
  res.status(410).json({ error: "Nearby Safety Tips have been retired. Safety does not use member location or proximity." });
});

router.get("/safety-tips", async (_req: Request, res: Response) => {
  res.status(410).json({ error: "Individual Safety Tip listings are unavailable. Safety does not show current community activity or report timestamps." });
});

router.post("/safety-tips/:id/confirm", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid tip ID" });
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body.userLat != null || body.userLng != null || body.lat != null || body.lng != null) {
      res.status(400).json({ error: "Safety Tip confirmations do not accept or retain member coordinates." });
      return;
    }

    const [tip] = await db
      .select()
      .from(safetyTipsTable)
      .where(eq(safetyTipsTable.id, id))
      .limit(1);

    if (!tip) {
      res.status(404).json({ error: "Tip not found" });
      return;
    }

    if (tip.status === "dismissed") {
      res.status(410).json({ error: "Safety tip is no longer available" });
      return;
    }
    const [existing] = await db
      .select({ id: safetyTipConfirmationsTable.id })
      .from(safetyTipConfirmationsTable)
      .where(
        and(
          eq(safetyTipConfirmationsTable.tipId, id),
          eq(safetyTipConfirmationsTable.userId, req.user.id),
        ),
      )
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "You have already confirmed this tip." });
      return;
    }

    await db.insert(safetyTipConfirmationsTable).values({
      tipId: id,
      userId: req.user.id,
    });

    const [updated] = await db
      .update(safetyTipsTable)
      .set({
        confirmationCount: sql`${safetyTipsTable.confirmationCount} + 1`,
        status:
          (tip.confirmationCount + 1) >= CONFIRMATION_THRESHOLD ? "confirmed" : tip.status,
      })
      .where(eq(safetyTipsTable.id, id))
      .returning();

    if (updated && updated.confirmationCount >= CONFIRMATION_THRESHOLD && tip.status !== "confirmed") {
      logger.info({ tipId: id, count: updated.confirmationCount }, "[safety-tips] threshold reached — tip confirmed");
    }

    // Confirmation is corroboration, not verification. Notification delivery
    // remains disabled until an approved, privacy-safe recipient policy exists.
    res.json({ tip: updated ? publicSafetyTip(updated) : updated, confirmed: true });
  } catch (err) {
    req.log.error({ err }, "POST /safety-tips/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm tip" });
  }
});

// ─── PATCH /safety-tips/:id ─────────────────────────────────────────────────
// Lets the submitter add context to a Tier 1 chip-only report later.
router.patch("/safety-tips/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { description, timeOfDay, whoInvolved, happenedBefore, othersSaw } = req.body as {
    description?: string;
    timeOfDay?: string;
    whoInvolved?: string[];
    happenedBefore?: string;
    othersSaw?: string;
  };
  try {
    await pool.query(
      `UPDATE safety_tips SET
         description    = COALESCE($1, description),
         time_of_day    = COALESCE($2, time_of_day),
         who_involved   = COALESCE($3::text[], who_involved),
         happened_before= COALESCE($4, happened_before),
         others_saw     = COALESCE($5, others_saw)
       WHERE id = $6 AND submitted_by_id = $7`,
      [
        description?.trim() ?? null,
        timeOfDay ?? null,
        whoInvolved?.length ? whoInvolved : null,
        happenedBefore ?? null,
        othersSaw ?? null,
        id,
        req.user.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /safety-tips/:id error");
    res.status(500).json({ error: "Failed to update" });
  }
});

export default router;
