import { Router, type IRouter, type Request, type Response } from "express";
import { db, meetupVerificationsTable, usersTable } from "@workspace/db";
import { and, desc, eq, or } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

router.get("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const verifications = await db
      .select({
        id: meetupVerificationsTable.id,
        initiatorId: meetupVerificationsTable.initiatorId,
        partnerId: meetupVerificationsTable.partnerId,
        connectionId: meetupVerificationsTable.connectionId,
        location: meetupVerificationsTable.location,
        note: meetupVerificationsTable.note,
        status: meetupVerificationsTable.status,
        initiatedAt: meetupVerificationsTable.initiatedAt,
        confirmedAt: meetupVerificationsTable.confirmedAt,
        expiresAt: meetupVerificationsTable.expiresAt,
        partnerFirstName: usersTable.firstName,
        partnerLastName: usersTable.lastName,
      })
      .from(meetupVerificationsTable)
      .leftJoin(usersTable, eq(usersTable.id, meetupVerificationsTable.partnerId))
      .where(or(
        eq(meetupVerificationsTable.initiatorId, userId),
        eq(meetupVerificationsTable.partnerId, userId),
      ))
      .orderBy(desc(meetupVerificationsTable.initiatedAt))
      .limit(50);
    res.json({ verifications });
  } catch (err) {
    req.log.error({ err }, "GET /meetups error");
    res.status(500).json({ error: "Failed to load meetups" });
  }
});

router.post("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { partnerId, connectionId, location, note } =
      req.body as { partnerId?: string; connectionId?: number; location?: string; note?: string };
    if (!partnerId) { res.status(400).json({ error: "partnerId is required" }); return; }
    if (partnerId === userId) { res.status(400).json({ error: "Cannot verify meetup with yourself" }); return; }
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const [v] = await db.insert(meetupVerificationsTable).values({
      initiatorId: userId,
      partnerId,
      connectionId: connectionId ?? null,
      location: location?.trim() ?? null,
      note: note?.trim() ?? null,
      status: "pending",
      expiresAt,
    }).returning();
    res.status(201).json({ verification: v });
  } catch (err) {
    req.log.error({ err }, "POST /meetups error");
    res.status(500).json({ error: "Failed to create meetup verification" });
  }
});

router.patch("/meetups/:id/confirm", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [v] = await db.select().from(meetupVerificationsTable)
      .where(and(eq(meetupVerificationsTable.id, id), eq(meetupVerificationsTable.partnerId, userId)))
      .limit(1);
    if (!v) { res.status(404).json({ error: "Verification not found" }); return; }
    if (v.status !== "pending") { res.status(409).json({ error: "Already responded" }); return; }
    if (new Date() > v.expiresAt) { res.status(410).json({ error: "Verification has expired" }); return; }
    const [updated] = await db.update(meetupVerificationsTable)
      .set({ status: "confirmed", confirmedAt: new Date() })
      .where(eq(meetupVerificationsTable.id, id))
      .returning();
    res.json({ verification: updated });
  } catch (err) {
    req.log.error({ err }, "PATCH /meetups/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm meetup" });
  }
});

export default router;
