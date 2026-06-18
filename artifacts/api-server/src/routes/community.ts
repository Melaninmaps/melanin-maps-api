import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityPostsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { storage } from "../storage";

const router: IRouter = Router();

router.get("/community/posts", async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const posts = await db
      .select()
      .from(communityPostsTable)
      .orderBy(desc(communityPostsTable.createdAt))
      .limit(50);
    const filtered = category && category !== "all" ? posts.filter((p) => p.category === category) : posts;
    res.json({ posts: filtered });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch community posts");
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.post("/community/posts", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { content, category = "general" } = req.body as { content?: string; category?: string };
    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    const user = await storage.getUser(req.user.id);
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Community Member";
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "CM";
    const colors = ["#3B1F0E", "#2D7A4F", "#C9922B", "#7B4F2E", "#1D4ED8", "#7B2D8B"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const [post] = await db
      .insert(communityPostsTable)
      .values({ authorId: req.user.id, authorName: name, authorInitials: initials, authorColor: color, content: content.trim(), category })
      .returning();
    res.status(201).json({ post });
  } catch (err) {
    req.log.error({ err }, "Failed to create community post");
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.post("/community/posts/:id/vote", async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { direction } = req.body as { direction: "up" | "down" };
    if (!["up", "down"].includes(direction)) {
      res.status(400).json({ error: "direction must be 'up' or 'down'" });
      return;
    }
    const col = direction === "up" ? communityPostsTable.upvotes : communityPostsTable.downvotes;
    const [post] = await db
      .update(communityPostsTable)
      .set({ [direction === "up" ? "upvotes" : "downvotes"]: sql`${col} + 1` })
      .where(eq(communityPostsTable.id, id))
      .returning();
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json({ post });
  } catch (err) {
    req.log.error({ err }, "Failed to vote on post");
    res.status(500).json({ error: "Failed to vote" });
  }
});

export default router;
