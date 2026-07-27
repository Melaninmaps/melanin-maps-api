import { Router, type IRouter, type Request, type Response } from "express";
import { db, eventRsvpsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/events/:id/rsvps", async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await db
      .select({ count: count() })
      .from(eventRsvpsTable)
      .where(eq(eventRsvpsTable.eventId, id));

    let isRsvped = false;
    if (req.user?.id) {
      const rows = await db
        .select()
        .from(eventRsvpsTable)
        .where(
          and(
            eq(eventRsvpsTable.userId, req.user.id),
            eq(eventRsvpsTable.eventId, id),
          ),
        );
      isRsvped = rows.length > 0;
    }

    res.json({ count: result?.count ?? 0, isRsvped });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch RSVPs");
    res.status(500).json({ error: "Failed to fetch RSVPs" });
  }
});

router.post("/events/:id/rsvp", async (req: Request<{ id: string }>, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { id } = req.params;
  try {
    await db
      .insert(eventRsvpsTable)
      .values({ userId: req.user.id, eventId: id })
      .onConflictDoNothing();
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to RSVP");
    res.status(500).json({ error: "Failed to RSVP" });
  }
});

router.delete("/events/:id/rsvp", async (req: Request<{ id: string }>, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { id } = req.params;
  try {
    await db
      .delete(eventRsvpsTable)
      .where(
        and(
          eq(eventRsvpsTable.userId, req.user.id),
          eq(eventRsvpsTable.eventId, id),
        ),
      );
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to un-RSVP");
    res.status(500).json({ error: "Failed to un-RSVP" });
  }
});

export default router;
