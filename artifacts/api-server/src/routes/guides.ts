import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  payItForwardGuidesTable,
  guideSectionsTable,
  guideItemsTable,
  guideFollowsTable,
  usersTable,
} from "@workspace/db";
import { and, eq, desc, asc, sql, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

const STORY_TYPES = ["university", "health", "business", "neighborhood", "career", "travel", "lifestyle", "general"] as const;

// ─── GET /api/guides ──────────────────────────────────────────────────────────
router.get("/guides", async (req: Request, res: Response) => {
  const { storyType, search, limit: qLimit } = req.query as {
    storyType?: string;
    search?: string;
    limit?: string;
  };
  const maxRows = Math.min(parseInt(qLimit ?? "30", 10), 60);

  try {
    const conditions: ReturnType<typeof eq>[] = [eq(payItForwardGuidesTable.isPublic, true)];
    if (storyType && storyType !== "all") {
      conditions.push(eq(payItForwardGuidesTable.storyType, storyType));
    }
    if (search) {
      conditions.push(
        or(
          ilike(payItForwardGuidesTable.title, `%${search}%`),
          ilike(payItForwardGuidesTable.subjectName, `%${search}%`),
        ) as ReturnType<typeof eq>
      );
    }

    const guides = await db
      .select({
        id: payItForwardGuidesTable.id,
        title: payItForwardGuidesTable.title,
        subjectName: payItForwardGuidesTable.subjectName,
        storyType: payItForwardGuidesTable.storyType,
        subjectEmoji: payItForwardGuidesTable.subjectEmoji,
        experienceContext: payItForwardGuidesTable.experienceContext,
        city: payItForwardGuidesTable.city,
        followCount: payItForwardGuidesTable.followCount,
        viewCount: payItForwardGuidesTable.viewCount,
        sectionCount: payItForwardGuidesTable.sectionCount,
        itemCount: payItForwardGuidesTable.itemCount,
        createdAt: payItForwardGuidesTable.createdAt,
        authorFirstName: usersTable.firstName,
        authorLastName: usersTable.lastName,
        authorAvatar: usersTable.profileImageUrl,
        authorCity: usersTable.homeCity,
      })
      .from(payItForwardGuidesTable)
      .innerJoin(usersTable, eq(payItForwardGuidesTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(desc(payItForwardGuidesTable.followCount), desc(payItForwardGuidesTable.createdAt))
      .limit(maxRows);

    res.json({ guides });
  } catch (err) {
    req.log.error({ err }, "get guides error");
    res.status(500).json({ error: "Failed to load guides" });
  }
});

// ─── POST /api/guides ─────────────────────────────────────────────────────────
router.post("/guides", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { title, personalStory, subjectName, storyType, subjectEmoji, experienceContext, city, isPublic } = req.body as {
    title: string;
    personalStory?: string;
    subjectName: string;
    storyType?: string;
    subjectEmoji?: string;
    experienceContext?: string;
    city?: string;
    isPublic?: boolean;
  };

  if (!title?.trim() || !subjectName?.trim()) {
    res.status(400).json({ error: "title and subjectName are required" });
    return;
  }

  try {
    const [guide] = await db
      .insert(payItForwardGuidesTable)
      .values({
        userId,
        title: title.trim(),
        personalStory: personalStory?.trim() ?? null,
        subjectName: subjectName.trim(),
        storyType: STORY_TYPES.includes(storyType as typeof STORY_TYPES[number]) ? storyType! : "general",
        subjectEmoji: subjectEmoji ?? "✨",
        experienceContext: experienceContext?.trim() ?? null,
        city: city?.trim() ?? null,
        isPublic: isPublic ?? true,
      })
      .returning();

    res.status(201).json({ guide });
  } catch (err) {
    req.log.error({ err }, "create guide error");
    res.status(500).json({ error: "Failed to create guide" });
  }
});

// ─── GET /api/guides/:id ──────────────────────────────────────────────────────
router.get("/guides/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const [guide] = await db
      .select({
        id: payItForwardGuidesTable.id,
        userId: payItForwardGuidesTable.userId,
        title: payItForwardGuidesTable.title,
        personalStory: payItForwardGuidesTable.personalStory,
        subjectName: payItForwardGuidesTable.subjectName,
        storyType: payItForwardGuidesTable.storyType,
        subjectEmoji: payItForwardGuidesTable.subjectEmoji,
        experienceContext: payItForwardGuidesTable.experienceContext,
        city: payItForwardGuidesTable.city,
        isPublic: payItForwardGuidesTable.isPublic,
        followCount: payItForwardGuidesTable.followCount,
        viewCount: payItForwardGuidesTable.viewCount,
        sectionCount: payItForwardGuidesTable.sectionCount,
        itemCount: payItForwardGuidesTable.itemCount,
        createdAt: payItForwardGuidesTable.createdAt,
        authorFirstName: usersTable.firstName,
        authorLastName: usersTable.lastName,
        authorAvatar: usersTable.profileImageUrl,
        authorCity: usersTable.homeCity,
      })
      .from(payItForwardGuidesTable)
      .innerJoin(usersTable, eq(payItForwardGuidesTable.userId, usersTable.id))
      .where(eq(payItForwardGuidesTable.id, id))
      .limit(1);

    if (!guide) { res.status(404).json({ error: "Guide not found" }); return; }

    const sections = await db
      .select()
      .from(guideSectionsTable)
      .where(eq(guideSectionsTable.guideId, id))
      .orderBy(asc(guideSectionsTable.displayOrder));

    const items = await db
      .select()
      .from(guideItemsTable)
      .where(eq(guideItemsTable.guideId, id))
      .orderBy(asc(guideItemsTable.sectionId), asc(guideItemsTable.displayOrder));

    // Increment view count (fire and forget)
    db.update(payItForwardGuidesTable)
      .set({ viewCount: sql`view_count + 1` })
      .where(eq(payItForwardGuidesTable.id, id))
      .catch(() => undefined);

    res.json({ guide, sections, items });
  } catch (err) {
    req.log.error({ err }, "get guide error");
    res.status(500).json({ error: "Failed to load guide" });
  }
});

// ─── POST /api/guides/:id/sections ───────────────────────────────────────────
router.post("/guides/:id/sections", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const { title, sectionEmoji, displayOrder } = req.body as {
    title: string;
    sectionEmoji?: string;
    displayOrder?: number;
  };
  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }

  try {
    const [g] = await db.select({ userId: payItForwardGuidesTable.userId }).from(payItForwardGuidesTable).where(eq(payItForwardGuidesTable.id, id)).limit(1);
    if (!g) { res.status(404).json({ error: "Guide not found" }); return; }
    if (g.userId !== userId) { res.status(403).json({ error: "Not your guide" }); return; }

    const [section] = await db
      .insert(guideSectionsTable)
      .values({ guideId: id, title: title.trim(), sectionEmoji: sectionEmoji ?? "📌", displayOrder: displayOrder ?? 0 })
      .returning();

    await db.update(payItForwardGuidesTable)
      .set({ sectionCount: sql`section_count + 1`, updatedAt: new Date() })
      .where(eq(payItForwardGuidesTable.id, id));

    res.status(201).json({ section });
  } catch (err) {
    req.log.error({ err }, "add guide section error");
    res.status(500).json({ error: "Failed to add section" });
  }
});

// ─── DELETE /api/guides/:id/sections/:sectionId ───────────────────────────────
router.delete("/guides/:id/sections/:sectionId", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const sectionId = String(req.params.sectionId);

  try {
    const [g] = await db.select({ userId: payItForwardGuidesTable.userId }).from(payItForwardGuidesTable).where(eq(payItForwardGuidesTable.id, id)).limit(1);
    if (!g || g.userId !== userId) { res.status(403).json({ error: "Not your guide" }); return; }

    await db.delete(guideItemsTable).where(eq(guideItemsTable.sectionId, sectionId));
    await db.delete(guideSectionsTable).where(eq(guideSectionsTable.id, sectionId));
    await db.update(payItForwardGuidesTable)
      .set({ sectionCount: sql`GREATEST(section_count - 1, 0)`, updatedAt: new Date() })
      .where(eq(payItForwardGuidesTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "delete guide section error");
    res.status(500).json({ error: "Failed to delete section" });
  }
});

// ─── POST /api/guides/:id/items ───────────────────────────────────────────────
router.post("/guides/:id/items", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const { sectionId, itemType, title, description, businessId, externalUrl, externalLabel, displayOrder } = req.body as {
    sectionId: string;
    itemType?: string;
    title: string;
    description?: string;
    businessId?: string;
    externalUrl?: string;
    externalLabel?: string;
    displayOrder?: number;
  };
  if (!sectionId || !title?.trim()) { res.status(400).json({ error: "sectionId and title required" }); return; }

  try {
    const [g] = await db.select({ userId: payItForwardGuidesTable.userId }).from(payItForwardGuidesTable).where(eq(payItForwardGuidesTable.id, id)).limit(1);
    if (!g || g.userId !== userId) { res.status(403).json({ error: "Not your guide" }); return; }

    const [item] = await db
      .insert(guideItemsTable)
      .values({
        guideId: id,
        sectionId,
        itemType: itemType ?? "tip",
        title: title.trim(),
        description: description?.trim() ?? null,
        businessId: businessId ?? null,
        externalUrl: externalUrl ?? null,
        externalLabel: externalLabel ?? null,
        displayOrder: displayOrder ?? 0,
      })
      .returning();

    await db.update(payItForwardGuidesTable)
      .set({ itemCount: sql`item_count + 1`, updatedAt: new Date() })
      .where(eq(payItForwardGuidesTable.id, id));

    res.status(201).json({ item });
  } catch (err) {
    req.log.error({ err }, "add guide item error");
    res.status(500).json({ error: "Failed to add item" });
  }
});

// ─── DELETE /api/guides/:id/items/:itemId ─────────────────────────────────────
router.delete("/guides/:id/items/:itemId", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const itemId = String(req.params.itemId);

  try {
    const [g] = await db.select({ userId: payItForwardGuidesTable.userId }).from(payItForwardGuidesTable).where(eq(payItForwardGuidesTable.id, id)).limit(1);
    if (!g || g.userId !== userId) { res.status(403).json({ error: "Not your guide" }); return; }

    await db.delete(guideItemsTable).where(and(eq(guideItemsTable.id, itemId), eq(guideItemsTable.guideId, id)));
    await db.update(payItForwardGuidesTable)
      .set({ itemCount: sql`GREATEST(item_count - 1, 0)`, updatedAt: new Date() })
      .where(eq(payItForwardGuidesTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "delete guide item error");
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// ─── POST /api/guides/:id/follow ──────────────────────────────────────────────
router.post("/guides/:id/follow", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  try {
    await db.insert(guideFollowsTable).values({ userId, guideId: id }).onConflictDoNothing();
    await db.update(payItForwardGuidesTable).set({ followCount: sql`follow_count + 1` }).where(eq(payItForwardGuidesTable.id, id));
    res.json({ following: true });
  } catch (err) {
    req.log.error({ err }, "follow guide error");
    res.status(500).json({ error: "Failed to follow" });
  }
});

// ─── DELETE /api/guides/:id/follow ────────────────────────────────────────────
router.delete("/guides/:id/follow", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  try {
    await db.delete(guideFollowsTable).where(and(eq(guideFollowsTable.userId, userId), eq(guideFollowsTable.guideId, id)));
    await db.update(payItForwardGuidesTable).set({ followCount: sql`GREATEST(follow_count - 1, 0)` }).where(eq(payItForwardGuidesTable.id, id));
    res.json({ following: false });
  } catch (err) {
    req.log.error({ err }, "unfollow guide error");
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

// ─── GET /api/users/:userId/guides ────────────────────────────────────────────
router.get("/users/:userId/guides", async (req: Request, res: Response) => {
  const targetUserId = String(req.params.userId);
  const requesterId = req.user?.id;
  try {
    const conditions: ReturnType<typeof eq>[] = [eq(payItForwardGuidesTable.userId, targetUserId)];
    if (requesterId !== targetUserId) {
      conditions.push(eq(payItForwardGuidesTable.isPublic, true));
    }
    const guides = await db
      .select()
      .from(payItForwardGuidesTable)
      .where(and(...conditions))
      .orderBy(desc(payItForwardGuidesTable.createdAt));
    res.json({ guides });
  } catch (err) {
    req.log.error({ err }, "get user guides error");
    res.status(500).json({ error: "Failed to load guides" });
  }
});

export default router;
