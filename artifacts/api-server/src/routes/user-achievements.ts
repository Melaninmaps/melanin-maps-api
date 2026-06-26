import { Router, type IRouter, type Request, type Response } from "express";
import { db, userAchievementsTable, ACHIEVEMENT_DEFINITIONS } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/me/achievements", async (req: Request, res: Response) => {
  const user = (req.user as any)?.id;
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const rows = await db.select().from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, user))
      .orderBy(desc(userAchievementsTable.earnedAt));
    const enriched = rows.map(r => ({
      ...r,
      ...(ACHIEVEMENT_DEFINITIONS[r.achievementType as keyof typeof ACHIEVEMENT_DEFINITIONS] ?? { title: r.achievementType, icon: "🏆", desc: "" }),
    }));
    res.json({ achievements: enriched });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch achievements");
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

router.get("/users/:id/achievements", async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  try {
    const rows = await db.select().from(userAchievementsTable)
      .where(eq(userAchievementsTable.userId, userId))
      .orderBy(desc(userAchievementsTable.earnedAt));
    const enriched = rows.map(r => ({
      ...r,
      ...(ACHIEVEMENT_DEFINITIONS[r.achievementType as keyof typeof ACHIEVEMENT_DEFINITIONS] ?? { title: r.achievementType, icon: "🏆", desc: "" }),
    }));
    res.json({ achievements: enriched });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch achievements");
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

export default router;
