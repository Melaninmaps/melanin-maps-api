import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { memberConnections, trustedContactShares, usersTable } from "@workspace/db/schema";
import { eq, and, or } from "drizzle-orm";

const router = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/connections", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const rows = await db
      .select({
        id: memberConnections.id,
        status: memberConnections.status,
        groupId: memberConnections.groupId,
        createdAt: memberConnections.createdAt,
        respondedAt: memberConnections.respondedAt,
        requesterId: memberConnections.requesterId,
        recipientId: memberConnections.recipientId,
        otherFirstName: usersTable.firstName,
        otherLastName: usersTable.lastName,
        otherProfileImageUrl: usersTable.profileImageUrl,
        otherId: usersTable.id,
      })
      .from(memberConnections)
      .leftJoin(
        usersTable,
        or(
          and(eq(memberConnections.requesterId, userId), eq(usersTable.id, memberConnections.recipientId)),
          and(eq(memberConnections.recipientId, userId), eq(usersTable.id, memberConnections.requesterId)),
        ),
      )
      .where(or(eq(memberConnections.requesterId, userId), eq(memberConnections.recipientId, userId)));

    res.json({ connections: rows });
  } catch (err) {
    req.log.error({ err }, "GET /api/connections error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/connections/request", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const requesterId = req.user!.id;
    const { recipientId, groupId } = req.body as { recipientId?: string; groupId?: number };
    if (!recipientId) { res.status(400).json({ error: "recipientId required" }); return; }
    if (recipientId === requesterId) { res.status(400).json({ error: "Cannot connect with yourself" }); return; }

    const [existing] = await db
      .select()
      .from(memberConnections)
      .where(
        or(
          and(eq(memberConnections.requesterId, requesterId), eq(memberConnections.recipientId, recipientId)),
          and(eq(memberConnections.requesterId, recipientId), eq(memberConnections.recipientId, requesterId)),
        ),
      )
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "Connection already exists", connection: existing });
      return;
    }

    const [connection] = await db
      .insert(memberConnections)
      .values({ requesterId, recipientId, groupId: groupId ?? null, status: "pending" })
      .returning();

    res.status(201).json({ connection });
  } catch (err) {
    req.log.error({ err }, "POST /api/connections/request error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/connections/:id/respond", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const connId = parseInt(String(req.params.id), 10);
    if (isNaN(connId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { action } = req.body as { action?: "accept" | "decline" };
    if (action !== "accept" && action !== "decline") {
      res.status(400).json({ error: "action must be accept or decline" });
      return;
    }

    const [conn] = await db.select().from(memberConnections).where(eq(memberConnections.id, connId)).limit(1);
    if (!conn) { res.status(404).json({ error: "Connection not found" }); return; }
    if (conn.recipientId !== userId) { res.status(403).json({ error: "Not your connection request" }); return; }
    if (conn.status !== "pending") { res.status(409).json({ error: "Already responded" }); return; }

    const [updated] = await db
      .update(memberConnections)
      .set({ status: action === "accept" ? "accepted" : "declined", respondedAt: new Date() })
      .where(eq(memberConnections.id, connId))
      .returning();

    res.json({ connection: updated });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/connections/:id/respond error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/connections/:id/safety-share", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const connId = parseInt(String(req.params.id), 10);
    if (isNaN(connId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const { trustedContactName, trustedContactEmail, trustedContactPhone } = req.body as {
      trustedContactName?: string;
      trustedContactEmail?: string;
      trustedContactPhone?: string;
    };
    if (!trustedContactName) { res.status(400).json({ error: "trustedContactName required" }); return; }
    if (!trustedContactEmail && !trustedContactPhone) {
      res.status(400).json({ error: "At least one of trustedContactEmail or trustedContactPhone required" });
      return;
    }

    const [conn] = await db.select().from(memberConnections).where(eq(memberConnections.id, connId)).limit(1);
    if (!conn) { res.status(404).json({ error: "Connection not found" }); return; }
    if (conn.status !== "accepted") { res.status(400).json({ error: "Connection must be accepted first" }); return; }
    if (conn.requesterId !== userId && conn.recipientId !== userId) {
      res.status(403).json({ error: "Not your connection" });
      return;
    }

    const partnerId = conn.requesterId === userId ? conn.recipientId : conn.requesterId;

    const [existing] = await db
      .select()
      .from(trustedContactShares)
      .where(
        and(
          eq(trustedContactShares.connectionId, connId),
          eq(trustedContactShares.initiatorId, userId),
        ),
      )
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Safety share already initiated" });
      return;
    }

    const [share] = await db
      .insert(trustedContactShares)
      .values({
        connectionId: connId,
        initiatorId: userId,
        partnerId,
        trustedContactName: trustedContactName.trim(),
        trustedContactEmail: trustedContactEmail?.trim() ?? null,
        trustedContactPhone: trustedContactPhone?.trim() ?? null,
        initiatorConsented: true,
        partnerConsented: false,
        status: "pending_consent",
      })
      .returning();

    res.status(201).json({ share });
  } catch (err) {
    req.log.error({ err }, "POST /api/connections/:id/safety-share error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/connections/:id/safety-share/consent", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const connId = parseInt(String(req.params.id), 10);
    if (isNaN(connId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { shareId, consent } = req.body as { shareId?: number; consent?: boolean };
    if (shareId === undefined || consent === undefined) {
      res.status(400).json({ error: "shareId and consent required" });
      return;
    }

    const [share] = await db.select().from(trustedContactShares).where(eq(trustedContactShares.id, shareId)).limit(1);
    if (!share) { res.status(404).json({ error: "Safety share not found" }); return; }
    if (share.connectionId !== connId) { res.status(400).json({ error: "Share does not belong to this connection" }); return; }
    if (share.partnerId !== userId) { res.status(403).json({ error: "Not your consent to give" }); return; }
    if (share.status !== "pending_consent") { res.status(409).json({ error: "Share already resolved" }); return; }

    const newStatus = consent ? "active" : "declined";
    const [updated] = await db
      .update(trustedContactShares)
      .set({
        partnerConsented: consent,
        status: newStatus,
        activatedAt: consent ? new Date() : null,
      })
      .where(eq(trustedContactShares.id, shareId))
      .returning();

    res.json({ share: updated });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/connections/:id/safety-share/consent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/connections/:id/safety-shares", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const connId = parseInt(String(req.params.id), 10);
    if (isNaN(connId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const shares = await db
      .select()
      .from(trustedContactShares)
      .where(
        and(
          eq(trustedContactShares.connectionId, connId),
          or(eq(trustedContactShares.initiatorId, userId), eq(trustedContactShares.partnerId, userId)),
        ),
      );

    res.json({ shares });
  } catch (err) {
    req.log.error({ err }, "GET /api/connections/:id/safety-shares error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/connections/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const connId = parseInt(String(req.params.id), 10);
    if (isNaN(connId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [conn] = await db.select().from(memberConnections).where(eq(memberConnections.id, connId)).limit(1);
    if (!conn) { res.status(404).json({ error: "Connection not found" }); return; }
    if (conn.requesterId !== userId && conn.recipientId !== userId) {
      res.status(403).json({ error: "Not your connection" }); return;
    }

    await db.delete(memberConnections).where(eq(memberConnections.id, connId));
    res.json({ removed: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/connections/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/connections/:id/safety-share/:shareId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const shareId = parseInt(String(req.params.shareId), 10);
    if (isNaN(shareId)) { res.status(400).json({ error: "Invalid shareId" }); return; }

    const [share] = await db.select().from(trustedContactShares).where(eq(trustedContactShares.id, shareId)).limit(1);
    if (!share) { res.status(404).json({ error: "Share not found" }); return; }
    if (share.initiatorId !== userId && share.partnerId !== userId) {
      res.status(403).json({ error: "Not your safety share" });
      return;
    }

    const [updated] = await db
      .update(trustedContactShares)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(trustedContactShares.id, shareId))
      .returning();

    res.json({ share: updated });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/connections/:id/safety-share/:shareId error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
