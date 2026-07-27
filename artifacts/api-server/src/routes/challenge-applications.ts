import { Router, type IRouter, type Request, type Response } from "express";
import { db, challengeApplications } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/challenges/apply", async (req: Request, res: Response) => {
  const { businessId, businessName, businessCity, businessCategory, challengeId, challengeName, ownerName, ownerEmail, message } = req.body as {
    businessId?: string;
    businessName?: string;
    businessCity?: string;
    businessCategory?: string;
    challengeId?: string;
    challengeName?: string;
    ownerName?: string;
    ownerEmail?: string;
    message?: string;
  };

  if (!businessId || !businessName || !challengeId || !challengeName) {
    res.status(400).json({ error: "businessId, businessName, challengeId, and challengeName are required" });
    return;
  }

  try {
    const existing = await db
      .select({ id: challengeApplications.id, status: challengeApplications.status, challengeId: challengeApplications.challengeId })
      .from(challengeApplications)
      .where(eq(challengeApplications.businessId, String(businessId)))
      .limit(50);

    const alreadyApplied = existing.find(e => e.status !== "rejected" && e.challengeId === challengeId);
    if (alreadyApplied) {
      res.status(409).json({ error: "Already applied", status: alreadyApplied.status });
      return;
    }

    const [app] = await db.insert(challengeApplications).values({
      businessId: String(businessId),
      businessName: String(businessName),
      businessCity: businessCity ?? null,
      businessCategory: businessCategory ?? null,
      challengeId: String(challengeId),
      challengeName: String(challengeName),
      ownerName: ownerName?.trim() ?? null,
      ownerEmail: ownerEmail?.trim() ?? null,
      message: message?.trim() ?? null,
    }).returning();

    res.status(201).json({ application: app });
  } catch (err) {
    req.log.error({ err }, "Failed to submit challenge application");
    res.status(500).json({ error: "Failed to submit application" });
  }
});

router.get("/admin/challenge-applications", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const apps = await db
      .select()
      .from(challengeApplications)
      .orderBy(desc(challengeApplications.appliedAt));
    res.json({ applications: apps });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch challenge applications");
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

router.patch("/admin/challenge-applications/:id", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(String(req.params.id ?? ""), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body as { status?: string };
  const validStatuses = ["pending", "approved", "rejected"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "status must be pending, approved, or rejected" });
    return;
  }
  try {
    const [updated] = await db
      .update(challengeApplications)
      .set({ status, reviewedBy: String(req.user.id), reviewedAt: new Date() })
      .where(eq(challengeApplications.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({ application: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update challenge application");
    res.status(500).json({ error: "Failed to update application" });
  }
});

export default router;
