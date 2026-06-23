import { Router, type IRouter, type Request, type Response } from "express";
import { db, safetyCheckinsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

router.get("/safety/checkins", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const checkins = await db.select().from(safetyCheckinsTable)
      .where(eq(safetyCheckinsTable.userId, userId))
      .orderBy(desc(safetyCheckinsTable.createdAt))
      .limit(50);
    res.json({ checkins });
  } catch (err) {
    req.log.error({ err }, "GET /safety/checkins error");
    res.status(500).json({ error: "Failed to load check-ins" });
  }
});

router.post("/safety/checkins", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { trustedContactName, trustedContactEmail, scheduledAt, note, location, city } =
      req.body as { trustedContactName?: string; trustedContactEmail?: string; scheduledAt?: string; note?: string; location?: string; city?: string };
    if (!trustedContactName?.trim() || !trustedContactEmail?.includes("@") || !scheduledAt) {
      res.status(400).json({ error: "trustedContactName, trustedContactEmail, and scheduledAt are required" });
      return;
    }
    const [checkin] = await db.insert(safetyCheckinsTable).values({
      userId,
      trustedContactName: trustedContactName.trim(),
      trustedContactEmail: trustedContactEmail.toLowerCase().trim(),
      scheduledAt: new Date(scheduledAt),
      note: note?.trim() ?? null,
      location: location?.trim() ?? null,
      city: city?.trim() ?? null,
      status: "pending",
    }).returning();
    res.status(201).json({ checkin });
  } catch (err) {
    req.log.error({ err }, "POST /safety/checkins error");
    res.status(500).json({ error: "Failed to create check-in" });
  }
});

router.patch("/safety/checkins/:id/confirm", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [checkin] = await db.update(safetyCheckinsTable)
      .set({ status: "checked_in", confirmedAt: new Date() })
      .where(and(eq(safetyCheckinsTable.id, id), eq(safetyCheckinsTable.userId, userId)))
      .returning();
    if (!checkin) { res.status(404).json({ error: "Check-in not found" }); return; }
    res.json({ checkin });
  } catch (err) {
    req.log.error({ err }, "PATCH /safety/checkins/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm check-in" });
  }
});

router.delete("/safety/checkins/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await db.delete(safetyCheckinsTable)
      .where(and(eq(safetyCheckinsTable.id, id), eq(safetyCheckinsTable.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /safety/checkins/:id error");
    res.status(500).json({ error: "Failed to delete check-in" });
  }
});

export default router;
