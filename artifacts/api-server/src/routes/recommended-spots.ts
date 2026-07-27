import { Router, type IRouter, type Request, type Response } from "express";
import { db, profileRecommendedSpotsTable, businessesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

// GET /users/:userId/recommended-spots — public, returns up to 5 spots
router.get("/users/:userId/recommended-spots", async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const spots = await db
      .select()
      .from(profileRecommendedSpotsTable)
      .where(eq(profileRecommendedSpotsTable.userId, req.params.userId))
      .orderBy(profileRecommendedSpotsTable.displayOrder)
      .limit(5);
    res.json({ spots });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recommended spots");
    res.status(500).json({ error: "Failed to fetch recommended spots" });
  }
});

// POST /users/me/recommended-spots — add a spot (auth required, max 5)
router.post("/users/me/recommended-spots", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const { businessId, stance, blurb } = req.body as {
      businessId?: string;
      stance?: string;
      blurb?: string;
    };

    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    // Check current count
    const existing = await db
      .select({ id: profileRecommendedSpotsTable.id })
      .from(profileRecommendedSpotsTable)
      .where(eq(profileRecommendedSpotsTable.userId, req.user.id));

    if (existing.length >= 5) {
      res.status(400).json({ error: "You can have at most 5 Recommended Spots. Remove one to add another.", code: "MAX_SPOTS_REACHED" });
      return;
    }

    // Fetch business details for denormalization
    const [biz] = await db
      .select({ name: businessesTable.name, category: businessesTable.category })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    const VALID_STANCES = ["community_favorite", "hidden_gem", "supporting_local", "visited_loved"];
    const safeStance = stance && VALID_STANCES.includes(stance) ? stance : null;

    const [spot] = await db
      .insert(profileRecommendedSpotsTable)
      .values({
        userId: req.user.id,
        businessId,
        businessName: biz?.name ?? null,
        businessCategory: biz?.category ?? null,
        stance: safeStance,
        blurb: blurb?.trim().slice(0, 200) ?? null,
        displayOrder: existing.length,
      })
      .onConflictDoUpdate({
        target: [profileRecommendedSpotsTable.userId, profileRecommendedSpotsTable.businessId],
        set: {
          stance: safeStance,
          blurb: blurb?.trim().slice(0, 200) ?? null,
        },
      })
      .returning();

    res.status(201).json({ spot });
  } catch (err) {
    req.log.error({ err }, "Failed to add recommended spot");
    res.status(500).json({ error: "Failed to add recommended spot" });
  }
});

// PATCH /users/me/recommended-spots/:businessId — update stance/blurb
router.patch("/users/me/recommended-spots/:businessId", async (req: Request<{ businessId: string }>, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const { stance, blurb } = req.body as { stance?: string; blurb?: string };
    const VALID_STANCES = ["community_favorite", "hidden_gem", "supporting_local", "visited_loved"];
    const safeStance = stance && VALID_STANCES.includes(stance) ? stance : null;

    const [updated] = await db
      .update(profileRecommendedSpotsTable)
      .set({
        stance: safeStance,
        blurb: blurb?.trim().slice(0, 200) ?? null,
      })
      .where(
        and(
          eq(profileRecommendedSpotsTable.userId, req.user.id),
          eq(profileRecommendedSpotsTable.businessId, req.params.businessId),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Spot not found" });
      return;
    }
    res.json({ spot: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update recommended spot");
    res.status(500).json({ error: "Failed to update recommended spot" });
  }
});

// DELETE /users/me/recommended-spots/:businessId
router.delete("/users/me/recommended-spots/:businessId", async (req: Request<{ businessId: string }>, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    await db
      .delete(profileRecommendedSpotsTable)
      .where(
        and(
          eq(profileRecommendedSpotsTable.userId, req.user.id),
          eq(profileRecommendedSpotsTable.businessId, req.params.businessId),
        ),
      );
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to remove recommended spot");
    res.status(500).json({ error: "Failed to remove recommended spot" });
  }
});

export default router;
