import { Router, type IRouter, type Request, type Response } from "express";
import { db, meetupVerificationsTable, usersTable } from "@workspace/db";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendMeetupSafetyWatcherEmail } from "../lib/email";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

const initiatorUser = alias(usersTable, "initiator_user");
const partnerUser = alias(usersTable, "partner_user");
const watcherUser = alias(usersTable, "watcher_user");

// GET /meetups — list all non-cleared meetup verifications for the current user
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
        safetyWatcherEmail: meetupVerificationsTable.safetyWatcherEmail,
        safetyWatcherId: meetupVerificationsTable.safetyWatcherId,
        hasClearCode: meetupVerificationsTable.clearCode,
        // Initiator identity
        initiatorFirstName: initiatorUser.firstName,
        initiatorLastName: initiatorUser.lastName,
        initiatorUsername: initiatorUser.username,
        // Partner identity
        partnerFirstName: partnerUser.firstName,
        partnerLastName: partnerUser.lastName,
        partnerUsername: partnerUser.username,
        // Watcher identity (in-app)
        watcherFirstName: watcherUser.firstName,
        watcherLastName: watcherUser.lastName,
        watcherUsername: watcherUser.username,
      })
      .from(meetupVerificationsTable)
      .leftJoin(initiatorUser, eq(initiatorUser.id, meetupVerificationsTable.initiatorId))
      .leftJoin(partnerUser, eq(partnerUser.id, meetupVerificationsTable.partnerId))
      .leftJoin(watcherUser, eq(watcherUser.id, meetupVerificationsTable.safetyWatcherId))
      .where(and(
        or(
          eq(meetupVerificationsTable.initiatorId, userId),
          eq(meetupVerificationsTable.partnerId, userId),
        ),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .orderBy(desc(meetupVerificationsTable.initiatedAt))
      .limit(50);

    // Mask clearCode: only expose whether one is set, not the value itself
    const sanitized = verifications.map((v) => ({
      ...v,
      hasClearCode: !!v.hasClearCode,
    }));

    res.json({ verifications: sanitized });
  } catch (err) {
    req.log.error({ err }, "GET /meetups error");
    res.status(500).json({ error: "Failed to load meetups" });
  }
});

// POST /meetups — create a meetup verification request
router.post("/meetups", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const {
      partnerId,
      connectionId,
      location,
      note,
      clearCode,
      safetyWatcherId,
      safetyWatcherEmail,
    } = req.body as {
      partnerId?: string;
      connectionId?: number;
      location?: string;
      note?: string;
      clearCode?: string;
      safetyWatcherId?: string;
      safetyWatcherEmail?: string;
    };

    if (!partnerId) { res.status(400).json({ error: "partnerId is required" }); return; }
    if (partnerId === userId) { res.status(400).json({ error: "Cannot verify meetup with yourself" }); return; }
    if (safetyWatcherId && safetyWatcherId === userId) { res.status(400).json({ error: "You cannot be your own safety watcher" }); return; }
    if (safetyWatcherId && safetyWatcherId === partnerId) { res.status(400).json({ error: "Your meetup partner cannot also be your safety watcher" }); return; }

    const cleanClearCode = clearCode?.trim() || null;
    const cleanWatcherEmail = safetyWatcherEmail?.trim().toLowerCase() || null;
    const cleanWatcherId = safetyWatcherId?.trim() || null;

    // Set expiry far in the future — records persist until manually cleared
    const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

    const [v] = await db.insert(meetupVerificationsTable).values({
      initiatorId: userId,
      partnerId,
      connectionId: connectionId ?? null,
      location: location?.trim() ?? null,
      note: note?.trim() ?? null,
      status: "pending",
      expiresAt,
      clearCode: cleanClearCode,
      safetyWatcherId: cleanWatcherId,
      safetyWatcherEmail: cleanWatcherEmail,
    }).returning();

    // Notify the safety watcher via email if provided
    if (cleanWatcherEmail) {
      const [initiator] = await db.select({ username: usersTable.username, firstName: usersTable.firstName })
        .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      const [partner] = await db.select({ username: usersTable.username, firstName: usersTable.firstName })
        .from(usersTable).where(eq(usersTable.id, partnerId)).limit(1);

      sendMeetupSafetyWatcherEmail(
        cleanWatcherEmail,
        null,
        initiator?.username ?? initiator?.firstName ?? "Someone",
        partner?.username ?? partner?.firstName ?? "someone",
        location?.trim() ?? null,
        note?.trim() ?? null,
        v.id,
      ).catch(() => {/* fire-and-forget */});
    }

    res.status(201).json({ verification: { ...v, hasClearCode: !!v.clearCode, clearCode: undefined } });
  } catch (err) {
    req.log.error({ err }, "POST /meetups error");
    res.status(500).json({ error: "Failed to create meetup verification" });
  }
});

// PATCH /meetups/:id/confirm — partner confirms the meetup
router.patch("/meetups/:id/confirm", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid verification ID" }); return; }

    const [v] = await db.select().from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        eq(meetupVerificationsTable.partnerId, userId),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);

    if (!v) { res.status(404).json({ error: "Verification not found or already cleared" }); return; }
    if (v.status === "confirmed") { res.status(409).json({ error: "Already confirmed" }); return; }
    if (v.status === "cleared") { res.status(409).json({ error: "This meetup record has been cleared" }); return; }

    const [updated] = await db.update(meetupVerificationsTable)
      .set({ status: "confirmed", confirmedAt: new Date() })
      .where(eq(meetupVerificationsTable.id, id))
      .returning();

    res.json({ verification: { ...updated, hasClearCode: !!updated.clearCode, clearCode: undefined } });
  } catch (err) {
    req.log.error({ err }, "PATCH /meetups/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm meetup" });
  }
});

// DELETE /meetups/:id — clear a meetup record (requires clearCode if one was set)
router.delete("/meetups/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid verification ID" }); return; }

    const { clearCode } = req.body as { clearCode?: string };

    const [v] = await db.select().from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);

    if (!v) { res.status(404).json({ error: "Meetup record not found or already cleared" }); return; }

    // Only the initiator can clear a meetup record
    if (v.initiatorId !== userId) {
      res.status(403).json({ error: "Only the person who created this meetup verification can clear it" });
      return;
    }

    // If a clearCode was set, verify it
    if (v.clearCode) {
      if (!clearCode?.trim()) {
        res.status(400).json({ error: "A clear code is required to remove this meetup record" });
        return;
      }
      if (clearCode.trim() !== v.clearCode) {
        res.status(401).json({ error: "Incorrect clear code" });
        return;
      }
    }

    await db.update(meetupVerificationsTable)
      .set({ clearedAt: new Date(), status: "cleared" })
      .where(eq(meetupVerificationsTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /meetups/:id error");
    res.status(500).json({ error: "Failed to clear meetup record" });
  }
});

// POST /meetups/:id/share — re-send safety watcher notification
router.post("/meetups/:id/share", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid verification ID" }); return; }

    const { email } = req.body as { email?: string };

    const [v] = await db.select().from(meetupVerificationsTable)
      .where(and(
        eq(meetupVerificationsTable.id, id),
        eq(meetupVerificationsTable.initiatorId, userId),
        isNull(meetupVerificationsTable.clearedAt),
      ))
      .limit(1);

    if (!v) { res.status(404).json({ error: "Meetup record not found" }); return; }

    const targetEmail = email?.trim().toLowerCase() || v.safetyWatcherEmail;
    if (!targetEmail) { res.status(400).json({ error: "No email address to share with" }); return; }

    const [initiator] = await db.select({ username: usersTable.username, firstName: usersTable.firstName })
      .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const [partner] = await db.select({ username: usersTable.username, firstName: usersTable.firstName })
      .from(usersTable).where(eq(usersTable.id, v.partnerId)).limit(1);

    await sendMeetupSafetyWatcherEmail(
      targetEmail,
      null,
      initiator?.username ?? initiator?.firstName ?? "Someone",
      partner?.username ?? partner?.firstName ?? "someone",
      v.location,
      v.note,
      v.id,
    );

    // Update safetyWatcherEmail if a new one was provided
    if (email?.trim().toLowerCase() && email.trim().toLowerCase() !== v.safetyWatcherEmail) {
      await db.update(meetupVerificationsTable)
        .set({ safetyWatcherEmail: email.trim().toLowerCase() })
        .where(eq(meetupVerificationsTable.id, id));
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "POST /meetups/:id/share error");
    res.status(500).json({ error: "Failed to share meetup details" });
  }
});

export default router;
