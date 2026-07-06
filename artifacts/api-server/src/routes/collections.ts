import { Router, type IRouter, type Request, type Response } from "express";
import { db, collectionsTable, collectionItemsTable, collectionFollowsTable, usersTable } from "@workspace/db";
import { and, eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ─── GET /api/collections ─────────────────────────────────────────────────────
router.get("/collections", async (req: Request, res: Response) => {
  const { topicId, userId: filterUserId } = req.query as { topicId?: string; userId?: string };
  try {
    const conditions: ReturnType<typeof eq>[] = [eq(collectionsTable.isPublic, true)];
    if (topicId) conditions.push(eq(collectionsTable.topicId, topicId));
    if (filterUserId) conditions.push(eq(collectionsTable.userId, filterUserId));

    const collections = await db
      .select({
        id: collectionsTable.id,
        title: collectionsTable.title,
        description: collectionsTable.description,
        coverEmoji: collectionsTable.coverEmoji,
        topicId: collectionsTable.topicId,
        followCount: collectionsTable.followCount,
        itemCount: collectionsTable.itemCount,
        createdAt: collectionsTable.createdAt,
        userId: collectionsTable.userId,
        creatorFirstName: usersTable.firstName,
        creatorLastName: usersTable.lastName,
        creatorAvatar: usersTable.profileImageUrl,
        creatorCity: usersTable.homeCity,
      })
      .from(collectionsTable)
      .innerJoin(usersTable, eq(collectionsTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(desc(collectionsTable.followCount), desc(collectionsTable.createdAt))
      .limit(30);

    res.json({ collections });
  } catch (err) {
    req.log.error({ err }, "get collections error");
    res.status(500).json({ error: "Failed to load collections" });
  }
});

// ─── POST /api/collections ────────────────────────────────────────────────────
router.post("/collections", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { title, description, coverEmoji, topicId, isPublic } = req.body as {
    title: string;
    description?: string;
    coverEmoji?: string;
    topicId?: string;
    isPublic?: boolean;
  };
  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }

  try {
    const [collection] = await db
      .insert(collectionsTable)
      .values({
        userId,
        title: title.trim(),
        description,
        coverEmoji: coverEmoji ?? "📌",
        topicId,
        isPublic: isPublic ?? true,
      })
      .returning();

    res.status(201).json({ collection });
  } catch (err) {
    req.log.error({ err }, "create collection error");
    res.status(500).json({ error: "Failed to create collection" });
  }
});

// ─── GET /api/collections/:id ─────────────────────────────────────────────────
router.get("/collections/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const [collection] = await db
      .select({
        id: collectionsTable.id,
        title: collectionsTable.title,
        description: collectionsTable.description,
        coverEmoji: collectionsTable.coverEmoji,
        topicId: collectionsTable.topicId,
        isPublic: collectionsTable.isPublic,
        followCount: collectionsTable.followCount,
        itemCount: collectionsTable.itemCount,
        createdAt: collectionsTable.createdAt,
        userId: collectionsTable.userId,
        creatorFirstName: usersTable.firstName,
        creatorLastName: usersTable.lastName,
        creatorAvatar: usersTable.profileImageUrl,
        creatorCity: usersTable.homeCity,
      })
      .from(collectionsTable)
      .innerJoin(usersTable, eq(collectionsTable.userId, usersTable.id))
      .where(eq(collectionsTable.id, id))
      .limit(1);

    if (!collection) { res.status(404).json({ error: "Collection not found" }); return; }

    const items = await db
      .select()
      .from(collectionItemsTable)
      .where(eq(collectionItemsTable.collectionId, id))
      .orderBy(collectionItemsTable.displayOrder, collectionItemsTable.addedAt);

    res.json({ collection, items });
  } catch (err) {
    req.log.error({ err }, "get collection error");
    res.status(500).json({ error: "Failed to load collection" });
  }
});

// ─── POST /api/collections/:id/items ──────────────────────────────────────────
router.post("/collections/:id/items", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const { itemType, itemId, itemName, itemEmoji, note } = req.body as {
    itemType: string; itemId: string; itemName?: string; itemEmoji?: string; note?: string;
  };
  if (!itemType || !itemId) { res.status(400).json({ error: "itemType and itemId required" }); return; }

  try {
    const [col] = await db.select({ userId: collectionsTable.userId }).from(collectionsTable).where(eq(collectionsTable.id, id)).limit(1);
    if (!col) { res.status(404).json({ error: "Collection not found" }); return; }
    if (col.userId !== userId) { res.status(403).json({ error: "Not your collection" }); return; }

    const [item] = await db
      .insert(collectionItemsTable)
      .values({ collectionId: id, itemType, itemId, itemName, itemEmoji, note })
      .onConflictDoNothing()
      .returning();

    await db
      .update(collectionsTable)
      .set({ itemCount: sql`item_count + 1`, updatedAt: new Date() })
      .where(eq(collectionsTable.id, id));

    res.status(201).json({ item });
  } catch (err) {
    req.log.error({ err }, "add collection item error");
    res.status(500).json({ error: "Failed to add item" });
  }
});

// ─── DELETE /api/collections/:id/items/:itemId ────────────────────────────────
router.delete("/collections/:id/items/:itemId", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  const itemId = String(req.params.itemId);
  try {
    const [col] = await db.select({ userId: collectionsTable.userId }).from(collectionsTable).where(eq(collectionsTable.id, id)).limit(1);
    if (!col || col.userId !== userId) { res.status(403).json({ error: "Not your collection" }); return; }

    await db.delete(collectionItemsTable).where(and(eq(collectionItemsTable.id, itemId), eq(collectionItemsTable.collectionId, id)));
    await db.update(collectionsTable).set({ itemCount: sql`GREATEST(item_count - 1, 0)`, updatedAt: new Date() }).where(eq(collectionsTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "remove collection item error");
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// ─── POST /api/collections/:id/follow ─────────────────────────────────────────
router.post("/collections/:id/follow", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  try {
    await db.insert(collectionFollowsTable).values({ userId, collectionId: id }).onConflictDoNothing();
    await db.update(collectionsTable).set({ followCount: sql`follow_count + 1` }).where(eq(collectionsTable.id, id));
    res.json({ following: true });
  } catch (err) {
    req.log.error({ err }, "follow collection error");
    res.status(500).json({ error: "Failed to follow" });
  }
});

// ─── DELETE /api/collections/:id/follow ───────────────────────────────────────
router.delete("/collections/:id/follow", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = String(req.params.id);
  try {
    await db.delete(collectionFollowsTable).where(and(eq(collectionFollowsTable.userId, userId), eq(collectionFollowsTable.collectionId, id)));
    await db.update(collectionsTable).set({ followCount: sql`GREATEST(follow_count - 1, 0)` }).where(eq(collectionsTable.id, id));
    res.json({ following: false });
  } catch (err) {
    req.log.error({ err }, "unfollow collection error");
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

export default router;
