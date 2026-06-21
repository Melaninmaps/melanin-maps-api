import { Router, type IRouter, type Response } from "express";
import { db, verificationRequestsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: any) { return req.user?.email && ADMIN_EMAILS.includes(req.user.email); }

router.post("/verification/submit", async (req: any, res: Response): Promise<void> => {
  const {
    businessName, businessType, ownerName, websiteUrl,
    instagramHandle, yearsInBusiness, city, state, message, email,
  } = req.body as {
    businessName?: string; businessType?: string; ownerName?: string;
    websiteUrl?: string; instagramHandle?: string; yearsInBusiness?: number;
    city?: string; state?: string; message?: string; email?: string;
  };

  const submitterEmail = email ?? req.user?.email;
  if (!businessName?.trim()) { res.status(400).json({ error: "businessName is required" }); return; }
  if (!ownerName?.trim()) { res.status(400).json({ error: "ownerName is required" }); return; }
  if (!submitterEmail?.trim()) { res.status(400).json({ error: "email is required" }); return; }

  const VALID_TYPES = ["restaurant", "retail", "salon", "health", "professional_services", "entertainment", "tech", "nonprofit", "other"];
  if (!businessType || !VALID_TYPES.includes(businessType)) {
    res.status(400).json({ error: "Invalid businessType" }); return;
  }

  try {
    const [request] = await db.insert(verificationRequestsTable).values({
      submitterId: req.user?.id ?? null,
      businessName: businessName.trim(),
      businessType: businessType as any,
      ownerName: ownerName.trim(),
      websiteUrl: websiteUrl?.trim() || null,
      instagramHandle: instagramHandle?.trim().replace(/^@/, "") || null,
      yearsInBusiness: yearsInBusiness ?? null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      message: message?.slice(0, 2000) || null,
      submitterEmail: submitterEmail.trim(),
    }).returning();
    res.status(201).json({ request });
  } catch (err: any) {
    req.log.error({ err }, "Failed to submit verification request");
    res.status(500).json({ error: "Failed to submit verification request" });
  }
});

router.get("/admin/verification-requests", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const requests = await db.select().from(verificationRequestsTable).orderBy(desc(verificationRequestsTable.createdAt)).limit(200);
    res.json({ requests });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch verification requests");
    res.status(500).json({ error: "Failed to fetch verification requests" });
  }
});

router.patch("/admin/verification-requests/:id", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  const allowed = ["pending", "under_review", "approved", "rejected"];
  if (status && !allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    const [updated] = await db.update(verificationRequestsTable).set(updates).where(eq(verificationRequestsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Request not found" }); return; }
    res.json({ request: updated });
  } catch (err: any) {
    req.log.error({ err }, "Failed to update verification request");
    res.status(500).json({ error: "Failed to update request" });
  }
});

export default router;
