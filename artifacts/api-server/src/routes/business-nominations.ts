import { Router, type Request, type Response } from "express";
import { db, businessNominationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireApprovedMember } from "../middlewares/requireAuth";
import { SubmissionRepository } from "../businessIntake/submissionRepository";
import { validateSubmission } from "../businessIntake/types";

const communitySubmissionRepository = new SubmissionRepository();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

const router = Router();

router.post("/business-nominations", requireApprovedMember, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const body = req.body as Record<string, unknown>;
    const input = validateSubmission({
      ...body,
      name: body.businessName ?? body.name,
      category: body.category ?? "General",
      postalCode: body.postalCode ?? body.zip,
      latitude: body.latitude ?? body.lat,
      longitude: body.longitude ?? body.lng,
      ownershipDesignations: body.ownershipDesignations ?? [],
      locationSource: body.locationSource ?? "member_entered",
      submitterNote: body.submitterNote ?? body.notes,
      clientRequestId: body.clientRequestId ?? req.header("idempotency-key"),
      sourceChannel: body.sourceChannel ?? "legacy_mobile_nomination",
    });

    const existing = await communitySubmissionRepository.findPublishedDuplicate(input);
    if (existing) {
      res.status(409).json({
        isDuplicate: true,
        type: "already_listed",
        businessId: existing.id,
        code: "BUSINESS_ALREADY_LISTED",
        message: "This business is already in the Mapping With Melanin directory.",
      });
      return;
    }

    const result = await communitySubmissionRepository.create(input, userId);
    if (!result.created) {
      res.json({
        isDuplicate: true,
        type: "already_nominated",
        submissionId: result.submission.id,
        status: result.submission.status,
        message: "This business is already in your review queue. It was not submitted twice.",
      });
      return;
    }

    await communitySubmissionRepository
      .logAuditEvent(result.submission.id, userId, "submitted_via_nomination")
      .catch(() => undefined);
    res.status(201).json({
      isDuplicate: false,
      submissionId: result.submission.id,
      status: result.submission.status,
      message: "Business submitted for review. It is not public yet.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid submission";
    if (/required|must be|invalid|unsupported|accepts at most|too long/i.test(message)) {
      res.status(400).json({ error: message, code: "INVALID_SUBMISSION" });
      return;
    }
    req.log.error({ err }, "Failed to queue business nomination");
    res.status(500).json({ error: "Failed to submit business for review" });
  }
});

router.get("/business-nominations/mine", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const nominations = await db
      .select()
      .from(businessNominationsTable)
      .where(eq(businessNominationsTable.nominatedByUserId, userId))
      .orderBy(desc(businessNominationsTable.createdAt));
    const submissions = await communitySubmissionRepository.listBySubmitter(userId);
    const safeSubmissions = submissions.map((submission) => {
      const {
        reviewed_by_id: _reviewedById,
        submitted_by_id: _submittedById,
        client_request_id: _clientRequestId,
        ...safe
      } = submission;
      return safe;
    });
    res.json({ nominations, submissions: safeSubmissions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch your nominations");
    res.status(500).json({ error: "Failed to fetch nominations" });
  }
});

router.get("/admin/business-nominations", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const nominations = await db
      .select()
      .from(businessNominationsTable)
      .orderBy(desc(businessNominationsTable.createdAt))
      .limit(500);
    res.json({ nominations });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch nominations");
    res.status(500).json({ error: "Failed to fetch nominations" });
  }
});

router.patch("/admin/business-nominations/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const { status, matchedBusinessId, referralCredited } = req.body as {
    status?: string; matchedBusinessId?: string; referralCredited?: boolean;
  };
  const allowed = ["pending", "verified", "joined", "duplicate", "declined"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (matchedBusinessId !== undefined) updates.matchedBusinessId = matchedBusinessId;
    if (referralCredited !== undefined) updates.referralCredited = referralCredited;
    const [updated] = await db
      .update(businessNominationsTable)
      .set(updates)
      .where(eq(businessNominationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Nomination not found" }); return; }
    res.json({ nomination: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update nomination");
    res.status(500).json({ error: "Failed to update nomination" });
  }
});

export default router;
