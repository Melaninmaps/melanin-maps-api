import { Router, type IRouter, type Request, type Response } from "express";
import { requireApprovedMember } from "../middlewares/requireAuth";
import { SubmissionRepository } from "../businessIntake/submissionRepository";
import { validateSubmission } from "../businessIntake/types";

const router: IRouter = Router();
const communitySubmissionRepository = new SubmissionRepository();

// Historical compatibility endpoint. Business proposals are durable review
// records, never contact messages and never canonical/public listings.
router.post("/submit-business", requireApprovedMember, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const input = validateSubmission({
      ...body,
      category: body.category ?? "General",
      ownershipDesignations: body.ownershipDesignations ?? [],
      clientRequestId: body.clientRequestId ?? req.header("idempotency-key"),
      sourceChannel: body.sourceChannel ?? "legacy_submit_business",
    });

    const existing = await communitySubmissionRepository.findPublishedDuplicate(input);
    if (existing) {
      res.status(409).json({
        success: false,
        error: "This business is already listed in the directory.",
        code: "BUSINESS_ALREADY_LISTED",
        businessId: existing.id,
      });
      return;
    }

    const result = await communitySubmissionRepository.create(input, req.user!.id);
    if (result.created) {
      await communitySubmissionRepository
        .logAuditEvent(result.submission.id, req.user!.id, "submitted_via_legacy_form")
        .catch(() => undefined);
    }
    res.status(result.created ? 202 : 200).json({
      success: true,
      submissionId: result.submission.id,
      status: result.submission.status,
      duplicateRetry: !result.created,
      message: result.created
        ? "Your business was submitted for review. It is not public yet."
        : "This submission is already in review. It was not submitted twice.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid submission";
    if (/required|must be|invalid|unsupported|accepts at most|too long|completed business submission uploads/i.test(message)) {
      res.status(400).json({ success: false, error: message, code: "INVALID_SUBMISSION" });
      return;
    }
    req.log.error({ err }, "Failed to queue legacy business submission");
    res.status(500).json({ success: false, error: "Failed to submit business. Please try again." });
  }
});

export default router;
