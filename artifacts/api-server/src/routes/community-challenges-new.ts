import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityChallengesTable, challengeProgressTable, pointsLedgerTable, userAchievementsTable } from "@workspace/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

const router: IRouter = Router();

function uid(req: Request): string | null {
  return (req.user as any)?.id ?? null;
}

function isAdmin(req: Request) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean);
  return adminEmails.includes((req.user as any)?.email ?? "");
}

// ── Seed default challenges (run once) ────────────────────────────────────────
const DEFAULT_CHALLENGES = [
  { title: "Support 5 New Businesses", description: "Check in or review 5 businesses you've never visited before.", icon: "🏪", challengeType: "checkin", targetCount: 5, pointsReward: 100 },
  { title: "Try a New Restaurant", description: "Visit and review a Black-owned restaurant you haven't tried yet.", icon: "🍽️", challengeType: "restaurant_review", targetCount: 1, pointsReward: 40 },
  { title: "Visit a Black Museum or Gallery", description: "Check in to a Black-owned or Black-focused cultural space.", icon: "🎨", challengeType: "cultural_checkin", targetCount: 1, pointsReward: 50 },
  { title: "Write Three Helpful Reviews", description: "Write three detailed reviews this month to help the community.", icon: "✍🏾", challengeType: "review", targetCount: 3, pointsReward: 60 },
  { title: "Meet Someone New", description: "Offer help to 2 community members through I Can Help.", icon: "🤝", challengeType: "help_offer", targetCount: 2, pointsReward: 50 },
  { title: "Complete a Relocation Guide", description: "Help someone relocating by offering neighborhood, school, or community advice.", icon: "🏠", challengeType: "relocation_help", targetCount: 1, pointsReward: 75 },
  { title: "Attend a Local Festival", description: "RSVP or check in to a local community event.", icon: "🎉", challengeType: "event_rsvp", targetCount: 1, pointsReward: 35 },
  { title: "Post a Community Request", description: "Ask for what your community needs. Your voice shapes the platform.", icon: "🙋", challengeType: "community_request", targetCount: 1, pointsReward: 30 },
];

// ── GET active challenges ─────────────────────────────────────────────────────
router.get("/community-challenges", async (req: Request, res: Response) => {
  const user = uid(req);
  try {
    // Seed if empty
    const existing = await db.select({ id: communityChallengesTable.id }).from(communityChallengesTable).limit(1);
    if (existing.length === 0) {
      await db.insert(communityChallengesTable).values(DEFAULT_CHALLENGES.map(c => ({ ...c, isActive: true })));
    }

    const challenges = await db.select().from(communityChallengesTable)
      .where(eq(communityChallengesTable.isActive, true))
      .orderBy(desc(communityChallengesTable.pointsReward));

    if (!user) { res.json({ challenges, progress: {} }); return; }

    const progressRows = await db.select().from(challengeProgressTable)
      .where(eq(challengeProgressTable.userId, user));
    const progress = Object.fromEntries(progressRows.map(p => [p.challengeId, p]));

    res.json({ challenges, progress });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch challenges");
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

// ── POST log progress on a challenge ─────────────────────────────────────────
router.post("/community-challenges/:id/progress", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Sign in to track progress" }); return; }
  const challengeId = String(req.params.id);
  try {
    const [challenge] = await db.select().from(communityChallengesTable).where(eq(communityChallengesTable.id, challengeId)).limit(1);
    if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }

    const [existing] = await db.select().from(challengeProgressTable)
      .where(and(eq(challengeProgressTable.userId, user), eq(challengeProgressTable.challengeId, challengeId)))
      .limit(1);

    if (existing?.completedAt) { res.json({ alreadyCompleted: true, progress: existing }); return; }

    const newProgress = (existing?.progress ?? 0) + 1;
    const completed = newProgress >= challenge.targetCount;

    if (existing) {
      const updates: Record<string, unknown> = { progress: newProgress };
      if (completed) updates.completedAt = new Date();
      await db.update(challengeProgressTable).set(updates).where(eq(challengeProgressTable.id, existing.id));
    } else {
      await db.insert(challengeProgressTable).values({
        userId: user, challengeId,
        progress: newProgress,
        completedAt: completed ? new Date() : null,
      });
    }

    if (completed && !existing?.completedAt) {
      await db.update(communityChallengesTable)
        .set({ completionCount: sql`${communityChallengesTable.completionCount} + 1` })
        .where(eq(communityChallengesTable.id, challengeId));
      await db.insert(pointsLedgerTable).values({ userId: user, action: "challenge_complete", points: challenge.pointsReward, entityId: challengeId });
      // Achievement
      const [ach] = await db.select({ id: userAchievementsTable.id }).from(userAchievementsTable)
        .where(and(eq(userAchievementsTable.userId, user), eq(userAchievementsTable.achievementType, "challenge_complete"))).limit(1);
      if (!ach) await db.insert(userAchievementsTable).values({ userId: user, achievementType: "challenge_complete" });
    }

    res.json({ progress: newProgress, completed, pointsEarned: completed ? challenge.pointsReward : 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to update challenge progress");
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// ── POST admin: create challenge ──────────────────────────────────────────────
router.post("/admin/community-challenges", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { title, description, icon, challengeType, targetCount, pointsReward } = req.body as {
    title?: string; description?: string; icon?: string; challengeType?: string; targetCount?: number; pointsReward?: number;
  };
  if (!title || !description || !challengeType) { res.status(400).json({ error: "Required fields missing" }); return; }
  try {
    const [c] = await db.insert(communityChallengesTable).values({
      title, description, icon: icon ?? "🏆", challengeType, targetCount: targetCount ?? 1, pointsReward: pointsReward ?? 50, isActive: true,
    }).returning();
    res.status(201).json({ challenge: c });
  } catch (err) {
    req.log.error({ err }, "Failed to create challenge");
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

export default router;
