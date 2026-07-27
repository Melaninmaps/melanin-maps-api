import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityBoundariesTable, safeSpacePreferencesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/boundaries", requireAuth, async (req: Request, res: Response) => {
  try {
    const boundaries = await db
      .select()
      .from(communityBoundariesTable)
      .where(eq(communityBoundariesTable.userId, req.user!.id));
    res.json({ boundaries });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch boundaries");
    res.status(500).json({ error: "Failed to fetch boundaries" });
  }
});

router.post("/boundaries", requireAuth, async (req: Request, res: Response) => {
  const { targetType, targetId, targetName, boundaryTypes } = req.body as {
    targetType: string;
    targetId: string;
    targetName?: string;
    boundaryTypes: string[];
  };

  if (!targetType || !targetId || !boundaryTypes?.length) {
    res.status(400).json({ error: "targetType, targetId, and at least one boundaryType are required" });
    return;
  }
  if (!["user", "business"].includes(targetType)) {
    res.status(400).json({ error: "targetType must be 'user' or 'business'" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(communityBoundariesTable)
      .where(
        and(
          eq(communityBoundariesTable.userId, req.user!.id),
          eq(communityBoundariesTable.targetId, targetId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(communityBoundariesTable)
        .set({ boundaryTypes, targetName: targetName ?? null })
        .where(eq(communityBoundariesTable.id, existing[0].id))
        .returning();
      res.json({ boundary: updated });
    } else {
      const [boundary] = await db
        .insert(communityBoundariesTable)
        .values({ userId: req.user!.id, targetType, targetId, targetName: targetName ?? null, boundaryTypes })
        .returning();
      res.status(201).json({ boundary });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to set boundary");
    res.status(500).json({ error: "Failed to set boundary" });
  }
});

router.delete("/boundaries/:targetId", requireAuth, async (req: Request, res: Response) => {
  try {
    await db
      .delete(communityBoundariesTable)
      .where(
        and(
          eq(communityBoundariesTable.userId, req.user!.id),
          eq(communityBoundariesTable.targetId, String(req.params.targetId))
        )
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove boundary");
    res.status(500).json({ error: "Failed to remove boundary" });
  }
});

router.get("/boundaries/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const [prefs] = await db
      .select()
      .from(safeSpacePreferencesTable)
      .where(eq(safeSpacePreferencesTable.userId, req.user!.id))
      .limit(1);
    res.json({ preferences: prefs ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch safe space preferences");
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/boundaries/preferences", requireAuth, async (req: Request, res: Response) => {
  const {
    hideNotInterested, hideUnresolvedAlerts, showWouldReturnAlone, prioritizeMinorityOwned,
    hidePreviouslyReported, safetyAlertsOnlySaved, pauseDMs, requireFollowers,
    disablePromoMessages, verifiedUsersOnly,
  } = req.body as Record<string, boolean | undefined>;

  try {
    const existing = await db
      .select()
      .from(safeSpacePreferencesTable)
      .where(eq(safeSpacePreferencesTable.userId, req.user!.id))
      .limit(1);

    const values = {
      userId: req.user!.id,
      ...(hideNotInterested !== undefined && { hideNotInterested }),
      ...(hideUnresolvedAlerts !== undefined && { hideUnresolvedAlerts }),
      ...(showWouldReturnAlone !== undefined && { showWouldReturnAlone }),
      ...(prioritizeMinorityOwned !== undefined && { prioritizeMinorityOwned }),
      ...(hidePreviouslyReported !== undefined && { hidePreviouslyReported }),
      ...(safetyAlertsOnlySaved !== undefined && { safetyAlertsOnlySaved }),
      ...(pauseDMs !== undefined && { pauseDMs }),
      ...(requireFollowers !== undefined && { requireFollowers }),
      ...(disablePromoMessages !== undefined && { disablePromoMessages }),
      ...(verifiedUsersOnly !== undefined && { verifiedUsersOnly }),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      const [updated] = await db
        .update(safeSpacePreferencesTable)
        .set(values)
        .where(eq(safeSpacePreferencesTable.userId, req.user!.id))
        .returning();
      res.json({ preferences: updated });
    } else {
      const [created] = await db
        .insert(safeSpacePreferencesTable)
        .values(values)
        .returning();
      res.status(201).json({ preferences: created });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to update safe space preferences");
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;
