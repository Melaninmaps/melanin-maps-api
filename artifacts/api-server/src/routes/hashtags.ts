import { Router, type IRouter, type Request, type Response } from "express";
import { db, hashtagsTable, userHashtagFollowsTable } from "@workspace/db";
import { desc, eq, ilike, and, sql } from "drizzle-orm";

const router: IRouter = Router();

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z][a-zA-Z0-9_]{0,49}/g) ?? [];
  return [...new Set(matches.map((t) => t.toLowerCase()))];
}

export async function upsertHashtags(tags: string[]): Promise<void> {
  if (!tags.length) return;
  for (const tag of tags) {
    const bare = tag.startsWith("#") ? tag.slice(1) : tag;
    await db
      .insert(hashtagsTable)
      .values({ tag: bare, postCount: 1, weeklyPostCount: 1, lastPostAt: new Date() })
      .onConflictDoUpdate({
        target: hashtagsTable.tag,
        set: {
          postCount: sql`${hashtagsTable.postCount} + 1`,
          weeklyPostCount: sql`${hashtagsTable.weeklyPostCount} + 1`,
          lastPostAt: new Date(),
        },
      });
  }
}

// GET /hashtags/trending — top 20 by weekly post count
router.get("/hashtags/trending", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(hashtagsTable)
      .orderBy(desc(hashtagsTable.weeklyPostCount), desc(hashtagsTable.postCount))
      .limit(20);
    res.json({ trending: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch trending hashtags");
    res.status(500).json({ error: "Failed to fetch trending hashtags" });
  }
});

// GET /hashtags/search?q=travel
router.get("/hashtags/search", async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) { res.json({ results: [] }); return; }
  try {
    const bare = q.startsWith("#") ? q.slice(1) : q;
    const rows = await db
      .select()
      .from(hashtagsTable)
      .where(ilike(hashtagsTable.tag, `${bare}%`))
      .orderBy(desc(hashtagsTable.postCount))
      .limit(15);
    res.json({ results: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to search hashtags");
    res.status(500).json({ error: "Failed to search hashtags" });
  }
});

// GET /hashtags/following — my followed hashtags (auth required)
router.get("/hashtags/following", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const rows = await db
      .select({ hashtag: userHashtagFollowsTable.hashtag, createdAt: userHashtagFollowsTable.createdAt })
      .from(userHashtagFollowsTable)
      .where(eq(userHashtagFollowsTable.userId, req.user.id))
      .orderBy(desc(userHashtagFollowsTable.createdAt));
    res.json({ following: rows.map((r) => r.hashtag) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch followed hashtags");
    res.status(500).json({ error: "Failed to fetch followed hashtags" });
  }
});

// POST /hashtags/:tag/follow
router.post("/hashtags/:tag/follow", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const tag = (String(req.params.tag ?? "")).toLowerCase().replace(/^#/, "");
  if (!tag) { res.status(400).json({ error: "Invalid tag" }); return; }
  try {
    await db
      .insert(userHashtagFollowsTable)
      .values({ userId: req.user.id, hashtag: tag })
      .onConflictDoNothing();
    res.json({ ok: true, following: true, hashtag: tag });
  } catch (err) {
    req.log.error({ err }, "Failed to follow hashtag");
    res.status(500).json({ error: "Failed to follow hashtag" });
  }
});

// DELETE /hashtags/:tag/follow
router.delete("/hashtags/:tag/follow", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const tag = (String(req.params.tag ?? "")).toLowerCase().replace(/^#/, "");
  try {
    await db
      .delete(userHashtagFollowsTable)
      .where(and(eq(userHashtagFollowsTable.userId, req.user.id), eq(userHashtagFollowsTable.hashtag, tag)));
    res.json({ ok: true, following: false, hashtag: tag });
  } catch (err) {
    req.log.error({ err }, "Failed to unfollow hashtag");
    res.status(500).json({ error: "Failed to unfollow hashtag" });
  }
});

export default router;
