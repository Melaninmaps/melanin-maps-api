import { Router, type IRouter, type Request, type Response } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { scanForFamily } from "../lib/familyFilter";
import { eq, asc, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/conversations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const convs = await db
      .select()
      .from(conversationsTable)
      .where(sql`${conversationsTable.participantIds}::jsonb @> ${JSON.stringify([req.user.id])}::jsonb`)
      .orderBy(desc(conversationsTable.lastMessageAt))
      .limit(30);
    res.json({ conversations: convs });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch conversations");
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/conversations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { title, participantId, businessId } = req.body as { title?: string; participantId?: string; businessId?: string };
    const participantIds = [req.user.id, ...(participantId ? [participantId] : [])];
    const [conv] = await db
      .insert(conversationsTable)
      .values({ title: title || "New Conversation", participantIds, businessId: businessId ?? null })
      .returning();
    res.status(201).json({ conversation: conv });
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const convId = parseInt(req.params["id"] as string, 10);
    if (isNaN(convId)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, convId))
      .orderBy(asc(messagesTable.createdAt))
      .limit(100);
    res.json({ messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch messages");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const convId = parseInt(req.params["id"] as string, 10);
    if (isNaN(convId)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }
    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    const scan = await scanForFamily(content.trim(), req.user!.id, "message");
    if (scan.blocked) {
      res.status(422).json({ error: "Your message was blocked by your guardian's content filter.", code: "FAMILY_FILTER_BLOCKED" });
      return;
    }
    const [msg] = await db
      .insert(messagesTable)
      .values({ conversationId: convId, role: "user", content: content.trim() })
      .returning();
    await db
      .update(conversationsTable)
      .set({ lastMessageAt: new Date(), lastMessagePreview: content.trim().slice(0, 100) })
      .where(eq(conversationsTable.id, convId));
    res.status(201).json({ message: msg });
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
