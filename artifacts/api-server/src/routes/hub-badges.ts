import { Router, type IRouter, type Request, type Response } from "express";
import { db, userBadgesTable, badgeHelpfulVotesTable, usersTable, knowledgeTopicsTable } from "@workspace/db";
import { and, eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ─── GET /api/knowledge/hubs/:topicId/experts ─────────────────────────────────
router.get("/knowledge/hubs/:topicId/experts", async (req: Request, res: Response) => {
  const topicId = String(req.params.topicId);
  try {
    const experts = await db
      .select({
        id: userBadgesTable.id,
        userId: userBadgesTable.userId,
        badgeName: userBadgesTable.badgeName,
        badgeEmoji: userBadgesTable.badgeEmoji,
        badgeType: userBadgesTable.badgeType,
        isVerified: userBadgesTable.isVerified,
        yearsOfExperience: userBadgesTable.yearsOfExperience,
        experienceNote: userBadgesTable.experienceNote,
        earnedAt: userBadgesTable.earnedAt,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        avatarUrl: usersTable.profileImageUrl,
        city: usersTable.homeCity,
        helpfulVotes: sql<number>`(
          SELECT COUNT(*) FROM badge_helpful_votes WHERE badge_id = ${userBadgesTable.id}
        )`.mapWith(Number),
      })
      .from(userBadgesTable)
      .innerJoin(usersTable, eq(userBadgesTable.userId, usersTable.id))
      .where(
        and(
          eq(userBadgesTable.topicId, topicId),
          eq(userBadgesTable.isPublic, true),
        )
      )
      .orderBy(desc(userBadgesTable.isVerified), desc(userBadgesTable.earnedAt))
      .limit(20);

    res.json({ experts });
  } catch (err) {
    req.log.error({ err }, "get hub experts error");
    res.status(500).json({ error: "Failed to load experts" });
  }
});

// ─── POST /api/knowledge/hubs/:topicId/volunteer-expert ───────────────────────
router.post("/knowledge/hubs/:topicId/volunteer-expert", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const topicId = String(req.params.topicId);
  const { yearsOfExperience, experienceNote, badgeName } = req.body as {
    yearsOfExperience?: number;
    experienceNote?: string;
    badgeName?: string;
  };

  try {
    const topic = await db
      .select({ canonicalName: knowledgeTopicsTable.canonicalName, topicName: knowledgeTopicsTable.topicName })
      .from(knowledgeTopicsTable)
      .where(eq(knowledgeTopicsTable.id, topicId))
      .limit(1);

    const topicName = topic[0]?.canonicalName ?? topic[0]?.topicName ?? "Unknown";
    const finalBadgeName = badgeName ?? `${topicName} Expert`;

    const existing = await db
      .select({ id: userBadgesTable.id })
      .from(userBadgesTable)
      .where(and(eq(userBadgesTable.userId, userId), eq(userBadgesTable.topicId, topicId)))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "You already have an expert badge for this hub" });
      return;
    }

    const [badge] = await db
      .insert(userBadgesTable)
      .values({
        userId,
        topicId,
        badgeType: "hub_expert",
        badgeName: finalBadgeName,
        badgeEmoji: "✦",
        isVolunteered: true,
        isVerified: false,
        yearsOfExperience: yearsOfExperience ?? null,
        experienceNote: experienceNote ?? null,
      })
      .returning();

    res.status(201).json({ badge });
  } catch (err) {
    req.log.error({ err }, "volunteer expert error");
    res.status(500).json({ error: "Failed to register as expert" });
  }
});

// ─── GET /api/users/:userId/badges ────────────────────────────────────────────
router.get("/users/:userId/badges", async (req: Request, res: Response) => {
  const targetUserId = String(req.params.userId);
  try {
    const badges = await db
      .select({
        id: userBadgesTable.id,
        badgeName: userBadgesTable.badgeName,
        badgeEmoji: userBadgesTable.badgeEmoji,
        badgeType: userBadgesTable.badgeType,
        topicId: userBadgesTable.topicId,
        isVerified: userBadgesTable.isVerified,
        yearsOfExperience: userBadgesTable.yearsOfExperience,
        experienceNote: userBadgesTable.experienceNote,
        earnedAt: userBadgesTable.earnedAt,
        helpfulVotes: sql<number>`(
          SELECT COUNT(*) FROM badge_helpful_votes WHERE badge_id = ${userBadgesTable.id}
        )`.mapWith(Number),
      })
      .from(userBadgesTable)
      .where(and(eq(userBadgesTable.userId, targetUserId), eq(userBadgesTable.isPublic, true)))
      .orderBy(desc(userBadgesTable.earnedAt));

    res.json({ badges });
  } catch (err) {
    req.log.error({ err }, "get user badges error");
    res.status(500).json({ error: "Failed to load badges" });
  }
});

// ─── POST /api/badges/:badgeId/vote ───────────────────────────────────────────
router.post("/badges/:badgeId/vote", async (req: Request, res: Response) => {
  const voterId = req.user?.id;
  if (!voterId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const badgeId = String(req.params.badgeId);
  try {
    await db.insert(badgeHelpfulVotesTable).values({ badgeId, voterId }).onConflictDoNothing();
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "vote badge error");
    res.status(500).json({ error: "Failed to vote" });
  }
});

export default router;
