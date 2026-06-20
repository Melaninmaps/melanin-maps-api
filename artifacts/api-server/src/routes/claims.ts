import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessClaimsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/businesses/:id/claim", async (req: Request, res: Response) => {
  const businessId = req.params.id;
  const { businessName, ownerName, email, phone, role, website, instagramHandle, additionalInfo } = req.body as Record<string, unknown>;
  if (!ownerName || !email || typeof ownerName !== "string" || typeof email !== "string") {
    res.status(400).json({ error: "ownerName and email are required" }); return;
  }
  try {
    const [claim] = await db.insert(businessClaimsTable).values({
      businessId,
      businessName: typeof businessName === "string" ? businessName : null,
      userId: req.user?.id ?? null,
      ownerName,
      email,
      phone: typeof phone === "string" ? phone : null,
      role: typeof role === "string" ? role : "owner",
      website: typeof website === "string" ? website : null,
      instagramHandle: typeof instagramHandle === "string" ? instagramHandle : null,
      additionalInfo: typeof additionalInfo === "string" ? additionalInfo : null,
      status: "pending",
    }).returning();
    res.status(201).json({ claim });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business claim");
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

router.get("/admin/claims", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const claims = await db
      .select()
      .from(businessClaimsTable)
      .orderBy(desc(businessClaimsTable.createdAt));
    res.json({ claims });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch claims");
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

router.patch("/admin/claims/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  const validStatuses = ["pending", "approved", "rejected", "needs_info"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const [claim] = await db
      .update(businessClaimsTable)
      .set({
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        updatedAt: new Date(),
      })
      .where(eq(businessClaimsTable.id, req.params.id))
      .returning();
    if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }
    res.json({ claim });
  } catch (err) {
    req.log.error({ err }, "Failed to update claim");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

export default router;
