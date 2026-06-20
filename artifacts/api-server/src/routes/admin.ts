import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessInvitesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/invites", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const invites = await db
      .select()
      .from(businessInvitesTable)
      .orderBy(desc(businessInvitesTable.createdAt))
      .limit(200);
    res.json({ invites });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch invites");
    res.status(500).json({ error: "Failed to fetch invites" });
  }
});

router.patch("/admin/invites/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const id = String(req.params.id);
  const { status, notes } = req.body as { status?: string; notes?: string };
  const allowed = ["pending", "contacted", "accepted", "declined", "expired"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    const [updated] = await db
      .update(businessInvitesTable)
      .set(updates)
      .where(eq(businessInvitesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }
    res.json({ invite: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update invite");
    res.status(500).json({ error: "Failed to update invite" });
  }
});

export default router;
