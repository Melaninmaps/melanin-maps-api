import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityListsTable, communityListItemsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/lists", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: communityListsTable.id,
        title: communityListsTable.title,
        description: communityListsTable.description,
        category: communityListsTable.category,
        coverEmoji: communityListsTable.coverEmoji,
        savedCount: communityListsTable.savedCount,
        createdAt: communityListsTable.createdAt,
        authorFirstName: usersTable.firstName,
        authorLastName: usersTable.lastName,
      })
      .from(communityListsTable)
      .leftJoin(usersTable, eq(communityListsTable.userId, usersTable.id))
      .where(eq(communityListsTable.isPublic, true))
      .orderBy(desc(communityListsTable.createdAt))
      .limit(50);
    res.json({ lists: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch lists");
    res.status(500).json({ error: "Failed to fetch lists" });
  }
});

router.post("/lists", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { title, description, category, coverEmoji, isPublic } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    coverEmoji?: string;
    isPublic?: boolean;
  };
  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  try {
    const [list] = await db.insert(communityListsTable).values({
      userId: String(req.user.id),
      title: title.trim(),
      description: description?.trim() ?? null,
      category: category ?? null,
      coverEmoji: coverEmoji ?? "📍",
      isPublic: isPublic !== false,
    }).returning();
    res.status(201).json({ list });
  } catch (err) {
    req.log.error({ err }, "Failed to create list");
    res.status(500).json({ error: "Failed to create list" });
  }
});

router.post("/lists/:id/save", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const listId = parseInt(String(req.params.id ?? ""), 10);
  if (isNaN(listId)) { res.status(400).json({ error: "Invalid list id" }); return; }
  try {
    const [existing] = await db.select({ savedCount: communityListsTable.savedCount }).from(communityListsTable).where(eq(communityListsTable.id, listId)).limit(1);
    if (!existing) { res.status(404).json({ error: "List not found" }); return; }
    const [updated] = await db.update(communityListsTable).set({ savedCount: (existing.savedCount ?? 0) + 1 }).where(eq(communityListsTable.id, listId)).returning({ savedCount: communityListsTable.savedCount });
    res.json({ savedCount: updated?.savedCount });
  } catch (err) {
    req.log.error({ err }, "Failed to save list");
    res.status(500).json({ error: "Failed to save list" });
  }
});

export default router;
