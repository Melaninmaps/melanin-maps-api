import { Router, type IRouter, type Request, type Response } from "express";
import { db, userDeliveryPreferencesTable, topicIssuesTable, userIssueFollowsTable, userTopicFollowsTable, knowledgeTopicsTable, happeningNowStoriesTable, storyConfirmationsTable, usersTable } from "@workspace/db";
import { and, eq, inArray, desc, or } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/knowledge/delivery-preferences", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const [prefs] = await db
      .select()
      .from(userDeliveryPreferencesTable)
      .where(eq(userDeliveryPreferencesTable.userId, userId))
      .limit(1);
    res.json({
      preferences: prefs ?? {
        digestMode: "weekly",
        scope: "all",
        includeSavedCities: false,
        includeSavedBusinesses: false,
      },
    });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/delivery-preferences error");
    res.status(500).json({ error: "Failed to fetch delivery preferences." });
  }
});

router.put("/knowledge/delivery-preferences", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { digestMode, scope, includeSavedCities, includeSavedBusinesses } = req.body as {
      digestMode?: string;
      scope?: string;
      includeSavedCities?: boolean;
      includeSavedBusinesses?: boolean;
    };

    const validModes = ["daily", "weekly", "breaking", "immediate"];
    const validScopes = ["local", "national", "global", "all"];

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (digestMode && validModes.includes(digestMode)) values.digestMode = digestMode;
    if (scope && validScopes.includes(scope)) values.scope = scope;
    if (includeSavedCities !== undefined) values.includeSavedCities = includeSavedCities;
    if (includeSavedBusinesses !== undefined) values.includeSavedBusinesses = includeSavedBusinesses;

    const [existing] = await db
      .select({ userId: userDeliveryPreferencesTable.userId })
      .from(userDeliveryPreferencesTable)
      .where(eq(userDeliveryPreferencesTable.userId, userId))
      .limit(1);

    let prefs;
    if (existing) {
      const [updated] = await db
        .update(userDeliveryPreferencesTable)
        .set(values)
        .where(eq(userDeliveryPreferencesTable.userId, userId))
        .returning();
      prefs = updated;
    } else {
      const [inserted] = await db
        .insert(userDeliveryPreferencesTable)
        .values({ userId, ...values } as any)
        .returning();
      prefs = inserted;
    }
    res.json({ preferences: prefs });
  } catch (err) {
    req.log.error({ err }, "PUT /knowledge/delivery-preferences error");
    res.status(500).json({ error: "Failed to save delivery preferences." });
  }
});

router.get("/knowledge/issues", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const issues = await db
      .select()
      .from(topicIssuesTable)
      .where(eq(topicIssuesTable.isActive, true))
      .orderBy(topicIssuesTable.name);

    let followingIds = new Set<string>();
    if (userId) {
      const follows = await db
        .select({ issueId: userIssueFollowsTable.issueId })
        .from(userIssueFollowsTable)
        .where(eq(userIssueFollowsTable.userId, userId));
      followingIds = new Set(follows.map((f) => f.issueId));
    }

    res.json({
      issues: issues.map((i) => ({ ...i, isFollowing: followingIds.has(i.id) })),
    });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/issues error");
    res.status(500).json({ error: "Failed to fetch issues." });
  }
});

router.post("/knowledge/issues/:id/follow", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const issueId = String(req.params.id);
    await db
      .insert(userIssueFollowsTable)
      .values({ userId, issueId })
      .onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/issues/:id/follow error");
    res.status(500).json({ error: "Failed to follow issue." });
  }
});

router.delete("/knowledge/issues/:id/follow", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const issueId = String(req.params.id);
    await db
      .delete(userIssueFollowsTable)
      .where(and(eq(userIssueFollowsTable.userId, userId), eq(userIssueFollowsTable.issueId, issueId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /knowledge/issues/:id/follow error");
    res.status(500).json({ error: "Failed to unfollow issue." });
  }
});

router.patch("/knowledge/topics/:id/follow/pin", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const topicId = String(req.params.id);
    const { pinned } = req.body as { pinned?: boolean };
    if (typeof pinned !== "boolean") { res.status(400).json({ error: "pinned (boolean) required" }); return; }

    const [existing] = await db
      .select({ id: userTopicFollowsTable.id })
      .from(userTopicFollowsTable)
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)))
      .limit(1);

    if (!existing) { res.status(404).json({ error: "You are not following this topic" }); return; }

    await db
      .update(userTopicFollowsTable)
      .set({ isPinnedToProfile: pinned })
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)));

    res.json({ ok: true, topicId, isPinnedToProfile: pinned });
  } catch (err) {
    req.log.error({ err }, "PATCH /knowledge/topics/:id/follow/pin error");
    res.status(500).json({ error: "Failed to update pin." });
  }
});

router.patch("/knowledge/issues/:id/follow/pin", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const issueId = String(req.params.id);
    const { pinned } = req.body as { pinned?: boolean };
    if (typeof pinned !== "boolean") { res.status(400).json({ error: "pinned (boolean) required" }); return; }

    const [existing] = await db
      .select({ id: userIssueFollowsTable.id })
      .from(userIssueFollowsTable)
      .where(and(eq(userIssueFollowsTable.userId, userId), eq(userIssueFollowsTable.issueId, issueId)))
      .limit(1);

    if (!existing) { res.status(404).json({ error: "You are not following this issue" }); return; }

    await db
      .update(userIssueFollowsTable)
      .set({ isPinnedToProfile: pinned })
      .where(and(eq(userIssueFollowsTable.userId, userId), eq(userIssueFollowsTable.issueId, issueId)));

    res.json({ ok: true, issueId, isPinnedToProfile: pinned });
  } catch (err) {
    req.log.error({ err }, "PATCH /knowledge/issues/:id/follow/pin error");
    res.status(500).json({ error: "Failed to update pin." });
  }
});

// ── POST /knowledge/topics/request — member requests a new topic ─────────────
// Creates a knowledge_topics record with category "requested" so admins can review.
// Returns { ok: true, alreadyExists: false } or { ok: true, alreadyExists: true }.
router.post("/knowledge/topics/request", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { topicName } = req.body as { topicName?: string };
    if (!topicName?.trim()) {
      res.status(400).json({ error: "topicName is required" });
      return;
    }
    const name = topicName.trim();
    // Check if topic already exists (case-insensitive)
    const existing = await db.execute(
      `SELECT id FROM knowledge_topics WHERE LOWER(topic_name) = LOWER($1) LIMIT 1` as any,
      [name]
    ).catch(() => null);
    const rows = (existing as any)?.rows ?? [];
    if (rows.length > 0) {
      res.json({ ok: true, alreadyExists: true, message: "This topic is already in the library or pending review." });
      return;
    }
    // Insert as user-requested — admin will review and re-categorize
    await db.execute(
      `INSERT INTO knowledge_topics (id, topic_name, category, description, notification_priority, keywords, trusted_sources, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'requested', $2, 'digest', '{}', '[]', NOW(), NOW())` as any,
      [name, `Community-requested topic submitted by member ${req.user!.id}. Pending admin review.`]
    ).catch(() => null);
    res.json({ ok: true, alreadyExists: false, message: `"${name}" has been submitted for review.` });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/topics/request error");
    res.status(500).json({ error: "Failed to submit topic request." });
  }
});

/* ─── Happening Now ─── */

router.get("/knowledge/happening-now", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const rows = await db
      .select({
        id: happeningNowStoriesTable.id,
        title: happeningNowStoriesTable.title,
        summary: happeningNowStoriesTable.summary,
        category: happeningNowStoriesTable.category,
        sourceUrl: happeningNowStoriesTable.sourceUrl,
        submittedBy: happeningNowStoriesTable.submittedBy,
        submitterName: happeningNowStoriesTable.submitterName,
        status: happeningNowStoriesTable.status,
        confirmCount: happeningNowStoriesTable.confirmCount,
        isAdminPost: happeningNowStoriesTable.isAdminPost,
        createdAt: happeningNowStoriesTable.createdAt,
      })
      .from(happeningNowStoriesTable)
      .where(or(eq(happeningNowStoriesTable.status, "approved"), eq(happeningNowStoriesTable.status, "pending")))
      .orderBy(desc(happeningNowStoriesTable.createdAt))
      .limit(50);

    let confirmedIds = new Set<string>();
    if (userId) {
      const confs = await db
        .select({ storyId: storyConfirmationsTable.storyId })
        .from(storyConfirmationsTable)
        .where(eq(storyConfirmationsTable.userId, userId));
      confirmedIds = new Set(confs.map((c) => c.storyId));
    }

    res.json({
      stories: rows.map((s) => ({
        ...s,
        hasConfirmed: confirmedIds.has(s.id),
        isOwnStory: userId ? s.submittedBy === userId : false,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/happening-now error");
    res.status(500).json({ error: "Failed to fetch stories." });
  }
});

router.post("/knowledge/happening-now", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { title, summary, category, sourceUrl } = req.body as {
      title?: string; summary?: string; category?: string; sourceUrl?: string;
    };

    if (!title?.trim() || !summary?.trim()) {
      res.status(400).json({ error: "Title and summary are required." });
      return;
    }

    const validCategories = ["immigration", "police", "violence", "legislation", "community", "other"];
    const cat = validCategories.includes(category ?? "") ? category! : "other";

    const [user] = await db
      .select({ firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const submitterName = user
      ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email?.split("@")[0] || "Community Member"
      : "Community Member";

    const [story] = await db
      .insert(happeningNowStoriesTable)
      .values({
        title: title.trim(),
        summary: summary.trim(),
        category: cat,
        sourceUrl: sourceUrl?.trim() || null,
        submittedBy: userId,
        submitterName,
        status: "pending",
      })
      .returning();

    res.status(201).json({ story });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/happening-now error");
    res.status(500).json({ error: "Failed to submit story." });
  }
});

router.post("/knowledge/happening-now/:id/confirm", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const storyId = String(req.params.id);

    const [story] = await db
      .select({ id: happeningNowStoriesTable.id, submittedBy: happeningNowStoriesTable.submittedBy, confirmCount: happeningNowStoriesTable.confirmCount })
      .from(happeningNowStoriesTable)
      .where(eq(happeningNowStoriesTable.id, storyId))
      .limit(1);

    if (!story) { res.status(404).json({ error: "Story not found." }); return; }
    if (story.submittedBy === userId) { res.status(400).json({ error: "Cannot confirm your own story." }); return; }

    const [existing] = await db
      .select({ id: storyConfirmationsTable.id })
      .from(storyConfirmationsTable)
      .where(and(eq(storyConfirmationsTable.storyId, storyId), eq(storyConfirmationsTable.userId, userId)))
      .limit(1);

    if (existing) {
      await db.delete(storyConfirmationsTable)
        .where(and(eq(storyConfirmationsTable.storyId, storyId), eq(storyConfirmationsTable.userId, userId)));
      await db.update(happeningNowStoriesTable)
        .set({ confirmCount: Math.max(0, story.confirmCount - 1) })
        .where(eq(happeningNowStoriesTable.id, storyId));
      res.json({ confirmed: false, confirmCount: Math.max(0, story.confirmCount - 1) });
    } else {
      await db.insert(storyConfirmationsTable).values({ storyId, userId }).onConflictDoNothing();
      await db.update(happeningNowStoriesTable)
        .set({ confirmCount: story.confirmCount + 1 })
        .where(eq(happeningNowStoriesTable.id, storyId));
      res.json({ confirmed: true, confirmCount: story.confirmCount + 1 });
    }
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/happening-now/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm story." });
  }
});

router.patch("/knowledge/happening-now/:id/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const storyId = String(req.params.id);
    const { status, adminNote } = req.body as { status?: string; adminNote?: string };
    const validStatuses = ["approved", "rejected", "pending"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: "status must be approved, rejected, or pending." });
      return;
    }

    await db.update(happeningNowStoriesTable)
      .set({ status, adminNote: adminNote ?? null, updatedAt: new Date() })
      .where(eq(happeningNowStoriesTable.id, storyId));

    res.json({ ok: true, storyId, status });
  } catch (err) {
    req.log.error({ err }, "PATCH /knowledge/happening-now/:id/status error");
    res.status(500).json({ error: "Failed to update story status." });
  }
});

router.get("/knowledge/happening-now/pending", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const rows = await db
      .select()
      .from(happeningNowStoriesTable)
      .where(eq(happeningNowStoriesTable.status, "pending"))
      .orderBy(desc(happeningNowStoriesTable.createdAt));
    res.json({ stories: rows });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/happening-now/pending error");
    res.status(500).json({ error: "Failed to fetch pending stories." });
  }
});

router.get("/knowledge/digest", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;

    const [follows, prefs] = await Promise.all([
      db
        .select({ topicId: userTopicFollowsTable.topicId })
        .from(userTopicFollowsTable)
        .where(eq(userTopicFollowsTable.userId, userId)),
      db
        .select()
        .from(userDeliveryPreferencesTable)
        .where(eq(userDeliveryPreferencesTable.userId, userId))
        .limit(1),
    ]);

    if (follows.length === 0) {
      res.json({ digest: null, message: "Follow some topics to get your personalized digest." });
      return;
    }

    const topicIds = follows.map((f) => f.topicId);
    const topics = await db
      .select({ topicName: knowledgeTopicsTable.topicName, category: knowledgeTopicsTable.category })
      .from(knowledgeTopicsTable)
      .where(inArray(knowledgeTopicsTable.id, topicIds));

    const deliveryMode = prefs[0]?.digestMode ?? "weekly";
    const topicList = topics.map((t) => t.topicName).join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are KinfolkAI, a trusted community intelligence assistant for Mapping With Melanin™ — a platform celebrating Black culture, travel, and community. You speak directly to community members in a warm, affirming, informed voice. You do NOT make up news headlines or fabricate specific articles. Instead, you give a brief, intelligent briefing on why each topic area matters right now, written in one flowing summary paragraph. Always reference only general knowledge and current context.`,
        },
        {
          role: "user",
          content: `A member follows these topics: ${topicList}. Their delivery preference is "${deliveryMode}". Write a brief, warm KinfolkAI briefing (2-3 sentences) that acknowledges their interests and teases what kinds of updates they should watch for across these topics. End with an encouraging call to action. Do NOT fabricate specific article titles or news events.`,
        },
      ],
    });

    const digestText = completion.choices[0]?.message?.content ?? "";
    res.json({ digest: digestText, topicCount: follows.length, deliveryMode });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/digest error");
    res.status(500).json({ error: "Failed to generate digest." });
  }
});

export default router;
