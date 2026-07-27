import { Router, type IRouter, type Request, type Response } from "express";
import { db, conversations as conversationsTable, messages as messagesTable, usersTable } from "@workspace/db";
import { scanForFamily } from "../lib/familyFilter";
import { eq, asc, desc, sql, or, ilike } from "drizzle-orm";

const router: IRouter = Router();

// ─── GET /api/users/search — find users for DM compose & @mentions ───────────
router.get("/users/search", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const q = String(req.query["q"] ?? "").trim();
  if (q.length < 2) return void res.json({ users: [] });
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        profileImageUrl: usersTable.profileImageUrl,
        isPrivate: usersTable.isPrivate,
      })
      .from(usersTable)
      .where(
        or(
          ilike(usersTable.username, `%${q}%`),
          ilike(usersTable.firstName, `%${q}%`),
          ilike(usersTable.lastName, `%${q}%`),
        )
      )
      .limit(20);
    res.json({ users: rows.filter((u) => u.id !== req.user!.id) });
  } catch (err) {
    req.log.error({ err }, "users/search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

// ─── GET /api/conversations ───────────────────────────────────────────────────
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
    const convs = await db
      .select()
      .from(conversationsTable)
      .where(sql`${conversationsTable.participantIds}::jsonb @> ${JSON.stringify([req.user.id])}::jsonb`)
      .orderBy(desc(conversationsTable.lastMessageAt))
      .limit(50);
    res.json({ conversations: convs });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch conversations");
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ─── POST /api/conversations ──────────────────────────────────────────────────
router.post("/conversations", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });

    const { title, participantId, businessId, type } = req.body as {
      title?: string;
      participantId?: string;
      businessId?: string;
      type?: string;
    };

    const convType = type === "dm" ? "dm" : "business";
    const participantIds = [req.user.id, ...(participantId ? [participantId] : [])];

    if (convType === "dm" && participantId) {
      const existing = await db
        .select()
        .from(conversationsTable)
        .where(
          sql`${conversationsTable.type} = 'dm'
            AND ${conversationsTable.participantIds}::jsonb @> ${JSON.stringify([req.user.id])}::jsonb
            AND ${conversationsTable.participantIds}::jsonb @> ${JSON.stringify([participantId])}::jsonb`
        )
        .limit(1);
      if (existing.length > 0) return void res.json({ conversation: existing[0] });

      const [recipient] = await db
        .select({ isPrivate: usersTable.isPrivate })
        .from(usersTable)
        .where(eq(usersTable.id, participantId))
        .limit(1);

      const requestStatus: "pending" | "accepted" = recipient?.isPrivate ? "pending" : "accepted";
      const [conv] = await db
        .insert(conversationsTable)
        .values({
          title: title || "Direct Message",
          participantIds,
          businessId: null,
          type: "dm",
          requestStatus,
          requestedBy: req.user.id,
        })
        .returning();
      return void res.status(201).json({ conversation: conv });
    }

    const [conv] = await db
      .insert(conversationsTable)
      .values({
        title: title || "New Conversation",
        participantIds,
        businessId: businessId ?? null,
        type: "business",
      })
      .returning();
    res.status(201).json({ conversation: conv });
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ─── POST /api/conversations/:id/accept — accept a DM message request ─────────
router.post("/conversations/:id/accept", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const convId = parseInt(String(req.params["id"]), 10);
  if (isNaN(convId)) return void res.status(400).json({ error: "Invalid ID" });
  try {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId))
      .limit(1);
    if (!conv) return void res.status(404).json({ error: "Not found" });
    const ids = conv.participantIds as string[];
    if (!ids.includes(req.user.id)) return void res.status(403).json({ error: "Forbidden" });
    if (conv.requestedBy === req.user.id) return void res.status(400).json({ error: "Cannot accept your own request" });
    const [updated] = await db
      .update(conversationsTable)
      .set({ requestStatus: "accepted" })
      .where(eq(conversationsTable.id, convId))
      .returning();
    res.json({ conversation: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to accept message request");
    res.status(500).json({ error: "Failed to accept request" });
  }
});

// ─── POST /api/conversations/:id/decline — decline/delete a DM request ────────
router.post("/conversations/:id/decline", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const convId = parseInt(String(req.params["id"]), 10);
  if (isNaN(convId)) return void res.status(400).json({ error: "Invalid ID" });
  try {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId))
      .limit(1);
    if (!conv) return void res.status(404).json({ error: "Not found" });
    const ids = conv.participantIds as string[];
    if (!ids.includes(req.user.id)) return void res.status(403).json({ error: "Forbidden" });
    if (conv.requestedBy === req.user.id) return void res.status(400).json({ error: "Cannot decline your own request" });
    await db.delete(conversationsTable).where(eq(conversationsTable.id, convId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to decline message request");
    res.status(500).json({ error: "Failed to decline request" });
  }
});

// ─── GET /api/conversations/:id/messages ─────────────────────────────────────
router.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
    const convId = parseInt(req.params["id"] as string, 10);
    if (isNaN(convId)) return void res.status(400).json({ error: "Invalid conversation ID" });
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

// ─── POST /api/conversations/:id/messages ────────────────────────────────────
router.post("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
    const convId = parseInt(req.params["id"] as string, 10);
    if (isNaN(convId)) return void res.status(400).json({ error: "Invalid conversation ID" });
    const { content } = req.body as { content?: string };
    if (!content?.trim()) return void res.status(400).json({ error: "content is required" });

    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId))
      .limit(1);
    if (conv?.requestStatus === "pending" && conv.requestedBy !== req.user.id) {
      return void res.status(403).json({ error: "Message request not yet accepted", code: "REQUEST_PENDING" });
    }

    const scan = await scanForFamily(content.trim(), req.user!.id, "message");
    if (scan.blocked) {
      return void res.status(422).json({ error: "Your message contains content that is not permitted for users under 18.", code: "MINOR_CONTENT_BLOCKED" });
    }
    const [msg] = await db
      .insert(messagesTable)
      .values({ conversationId: convId, role: "user", content: content.trim(), senderId: req.user!.id })
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
