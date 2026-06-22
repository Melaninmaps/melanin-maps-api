import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessStoriesTable } from "@workspace/db";
import { eq, desc, gt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stories/:businessId", async (req: Request, res: Response) => {
  const { businessId } = req.params as { businessId: string };
  try {
    const now = new Date();
    const stories = await db
      .select()
      .from(businessStoriesTable)
      .where(eq(businessStoriesTable.businessId, businessId))
      .orderBy(desc(businessStoriesTable.createdAt))
      .limit(10);
    const active = stories.filter((s) => !s.expiresAt || s.expiresAt > now);
    res.json({ stories: active });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stories");
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

router.post("/stories", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { businessId, content, imageUrl, storyType, expiresAt } = req.body as {
    businessId?: string;
    content?: string;
    imageUrl?: string;
    storyType?: string;
    expiresAt?: string;
  };
  if (!businessId || !content?.trim()) {
    res.status(400).json({ error: "businessId and content required" });
    return;
  }
  const validTypes = ["update", "offer", "event", "milestone"];
  const type = validTypes.includes(storyType ?? "") ? storyType! : "update";
  try {
    const [story] = await db
      .insert(businessStoriesTable)
      .values({
        businessId,
        authorId: req.user.id,
        authorName: [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Business Owner",
        content: content.trim(),
        imageUrl: imageUrl ?? null,
        storyType: type,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();
    res.status(201).json({ story });
  } catch (err) {
    req.log.error({ err }, "Failed to create story");
    res.status(500).json({ error: "Failed to create story" });
  }
});

export default router;
