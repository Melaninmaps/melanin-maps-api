import { Router, type IRouter, type Request, type Response } from "express";
import { db, communitySaysTable, loveNotesTable, COMMUNITY_SAYS_TAGS } from "@workspace/db";
import { and, count, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function uid(req: Request): string | null {
  return (req.user as any)?.id ?? null;
}

// ── GET community says + love notes for a business ────────────────────────────
router.get("/businesses/:id/community-says", async (req: Request, res: Response) => {
  const businessId = String(req.params.id);
  try {
    const tags = await db.select({ tag: communitySaysTable.tag, total: count() })
      .from(communitySaysTable)
      .where(eq(communitySaysTable.businessId, businessId))
      .groupBy(communitySaysTable.tag)
      .orderBy(desc(count()));

    const enrichedTags = tags.map(t => ({
      ...t,
      total: Number(t.total),
      ...(COMMUNITY_SAYS_TAGS.find(d => d.id === t.tag) ?? { label: t.tag, emoji: "🤎" }),
    }));

    const notes = await db.select().from(loveNotesTable)
      .where(eq(loveNotesTable.businessId, businessId))
      .orderBy(desc(loveNotesTable.upvotes), desc(loveNotesTable.createdAt))
      .limit(20);

    res.json({ tags: enrichedTags, loveNotes: notes });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch community says");
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// ── POST tag a business (Community Says) ─────────────────────────────────────
router.post("/businesses/:id/community-says", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Sign in to tag this business" }); return; }
  const businessId = String(req.params.id);
  const { tag } = req.body as { tag?: string };
  const validTags = COMMUNITY_SAYS_TAGS.map(t => t.id);
  if (!tag || !validTags.includes(tag as any)) {
    res.status(400).json({ error: "Invalid tag" }); return;
  }
  try {
    const existing = await db.select({ id: communitySaysTable.id })
      .from(communitySaysTable)
      .where(and(eq(communitySaysTable.businessId, businessId), eq(communitySaysTable.userId, user), eq(communitySaysTable.tag, tag)))
      .limit(1);
    if (existing.length > 0) {
      // Toggle off
      await db.delete(communitySaysTable).where(eq(communitySaysTable.id, existing[0].id));
      res.json({ removed: true });
      return;
    }
    await db.insert(communitySaysTable).values({ businessId, userId: user, tag });
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to tag business");
    res.status(500).json({ error: "Failed to tag" });
  }
});

// ── POST add a love note ──────────────────────────────────────────────────────
router.post("/businesses/:id/love-note", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Sign in to leave a love note" }); return; }
  const businessId = String(req.params.id);
  const { note, contentLink } = req.body as { note?: string; contentLink?: string | null };
  const trimmedNote = note?.trim() ?? "";
  const wordCount = trimmedNote.split(/\s+/).filter(Boolean).length;
  if (!trimmedNote || wordCount < 2) {
    res.status(400).json({ error: "Write at least a couple of words." }); return;
  }
  if (wordCount > 200) {
    res.status(400).json({ error: "Keep your comment under 200 words." }); return;
  }
  const cleanLink = contentLink?.trim() || null;
  if (cleanLink && !/^https?:\/\/.+\..+/i.test(cleanLink)) {
    res.status(400).json({ error: "Content link must be a valid URL" }); return;
  }
  try {
    const [entry] = await db.insert(loveNotesTable).values({
      businessId, userId: user, note: note.trim(), contentLink: cleanLink,
    }).returning();
    res.status(201).json({ loveNote: entry });
  } catch (err) {
    req.log.error({ err }, "Failed to save love note");
    res.status(500).json({ error: "Failed to save note" });
  }
});

// ── POST upvote a love note ───────────────────────────────────────────────────
router.post("/love-notes/:id/upvote", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { sql } = await import("drizzle-orm");
  try {
    await db.update(loveNotesTable).set({ upvotes: sql`${loveNotesTable.upvotes} + 1` }).where(eq(loveNotesTable.id, String(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to upvote love note");
    res.status(500).json({ error: "Failed to upvote" });
  }
});

// ── DELETE un-select a love note (decrement, floor 0) ────────────────────────
router.delete("/love-notes/:id/upvote", async (req: Request, res: Response) => {
  const user = uid(req);
  if (!user) { res.status(401).json({ error: "Authentication required" }); return; }
  const { sql } = await import("drizzle-orm");
  try {
    await db.update(loveNotesTable)
      .set({ upvotes: sql`GREATEST(${loveNotesTable.upvotes} - 1, 0)` })
      .where(eq(loveNotesTable.id, String(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove upvote");
    res.status(500).json({ error: "Failed to remove selection" });
  }
});

export default router;
