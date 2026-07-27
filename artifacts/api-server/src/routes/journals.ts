import { Router, type IRouter, type Request, type Response } from "express";
import { db, tripJournalsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/journals", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: tripJournalsTable.id,
        title: tripJournalsTable.title,
        description: tripJournalsTable.description,
        cities: tripJournalsTable.cities,
        coverEmoji: tripJournalsTable.coverEmoji,
        savedCount: tripJournalsTable.savedCount,
        createdAt: tripJournalsTable.createdAt,
        authorFirstName: usersTable.firstName,
        authorLastName: usersTable.lastName,
      })
      .from(tripJournalsTable)
      .leftJoin(usersTable, eq(tripJournalsTable.userId, usersTable.id))
      .where(eq(tripJournalsTable.isPublic, true))
      .orderBy(desc(tripJournalsTable.createdAt))
      .limit(50);
    res.json({ journals: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch journals");
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

router.post("/journals", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { title, description, cities, coverEmoji, isPublic } = req.body as {
    title?: string;
    description?: string;
    cities?: string[];
    coverEmoji?: string;
    isPublic?: boolean;
  };
  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  try {
    const [journal] = await db
      .insert(tripJournalsTable)
      .values({
        userId: req.user.id,
        title: title.trim(),
        description: description?.trim() ?? null,
        cities: cities ?? [],
        coverEmoji: coverEmoji ?? "✈️",
        isPublic: isPublic !== false,
      })
      .returning();
    res.status(201).json({ journal });
  } catch (err) {
    req.log.error({ err }, "Failed to create journal");
    res.status(500).json({ error: "Failed to create journal" });
  }
});

router.post("/journals/:id/save", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const journalId = parseInt(String(req.params.id ?? ""), 10);
  if (isNaN(journalId)) {
    res.status(400).json({ error: "Invalid journal id" });
    return;
  }
  try {
    const [existing] = await db
      .select({ savedCount: tripJournalsTable.savedCount })
      .from(tripJournalsTable)
      .where(eq(tripJournalsTable.id, journalId))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Journal not found" });
      return;
    }
    const [updated] = await db
      .update(tripJournalsTable)
      .set({ savedCount: (existing.savedCount ?? 0) + 1 })
      .where(eq(tripJournalsTable.id, journalId))
      .returning({ savedCount: tripJournalsTable.savedCount });
    res.json({ savedCount: updated?.savedCount });
  } catch (err) {
    req.log.error({ err }, "Failed to save journal");
    res.status(500).json({ error: "Failed to save journal" });
  }
});

export default router;
