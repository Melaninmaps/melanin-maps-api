import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessSkipFeedbackTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  isVerifiedMinorityFlywheelEligible,
  resolveVerifiedMinorityFlywheelOwner,
  VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR,
} from "../businesses/verifiedMinorityFlywheelEligibility";
import {
  aggregatePrivateSkipFeedbackSignals,
  normalizePrivateSkipFeedbackReason,
  PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS,
} from "../businesses/privateSkipFeedback";

const router: IRouter = Router();

function denyIneligibleFlywheelAccess(res: Response): void {
  res.status(403).json({
    error: VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR,
    code: "VERIFIED_MINORITY_FLYWHEEL_ELIGIBILITY_REQUIRED",
  });
}

async function requireVerifiedMinorityFlywheelOwner(
  req: Request,
  res: Response,
  businessId: string,
): Promise<boolean> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return false;
  }

  const access = await resolveVerifiedMinorityFlywheelOwner(pool, {
    businessId,
    userId,
  });
  if (access.kind === "not_owner") {
    res.status(403).json({ error: "Approved business owner access is required." });
    return false;
  }
  if (access.kind === "ineligible") {
    denyIneligibleFlywheelAccess(res);
    return false;
  }
  return true;
}

/**
 * A member can share one reviewed category after passing on a listing. The
 * server never stores the member's free-text explanation, opens an owner
 * conversation, or sends a direct owner notification. The signal becomes
 * visible only through thresholded, distinct-member aggregates.
 */
router.post("/businesses/:id/skip-feedback", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const businessId = String(req.params["id"] ?? "").trim();
    const reasonCode = normalizePrivateSkipFeedbackReason(
      (req.body as { reasonCode?: unknown }).reasonCode,
    );
    if (!businessId) {
      res.status(400).json({ error: "Business ID is required." });
      return;
    }
    if (!reasonCode) {
      res.status(400).json({
        error: "Select a privacy-protected feedback category.",
        code: "PRIVATE_SKIP_FEEDBACK_REASON_REQUIRED",
      });
      return;
    }

    const [business] = await db
      .select({
        id: businessesTable.id,
        status: businessesTable.status,
        verified: businessesTable.verified,
        verifiedDesignations: businessesTable.verifiedDesignations,
        feedbackOptIn: businessesTable.feedbackOptIn,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "Business not found." });
      return;
    }
    if (!isVerifiedMinorityFlywheelEligible(business)) {
      denyIneligibleFlywheelAccess(res);
      return;
    }
    if (!business.feedbackOptIn) {
      res.status(403).json({
        error: "This business has not enabled privacy-protected community feedback.",
        code: "PRIVATE_SKIP_FEEDBACK_NOT_ENABLED",
      });
      return;
    }

    await db.insert(businessSkipFeedbackTable).values({
      businessId,
      submittedById: req.user.id,
      // The existing column now carries only the reviewed reason code. It is
      // intentionally not a free-text message field for new submissions.
      message: reasonCode,
      wasFiltered: false,
    });

    logger.info({ businessId, reasonCode }, "[skip-feedback] aggregate-only signal recorded");
    res.status(201).json({
      success: true,
      delivery: "aggregate_only",
      minimumDistinctMembers: PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS,
    });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/:id/skip-feedback error");
    res.status(500).json({ error: "Failed to submit feedback." });
  }
});

router.patch("/businesses/mine/feedback-opt-in", async (req: Request, res: Response) => {
  try {
    const businessId = String(req.query["businessId"] ?? "").trim();
    const { enabled } = req.body as { enabled?: boolean };
    if (!businessId) {
      res.status(400).json({ error: "businessId is required." });
      return;
    }
    if (typeof enabled !== "boolean") {
      res.status(400).json({ error: "enabled (boolean) is required." });
      return;
    }
    if (!await requireVerifiedMinorityFlywheelOwner(req, res, businessId)) return;

    await db
      .update(businessesTable)
      .set({ feedbackOptIn: enabled })
      .where(eq(businessesTable.id, businessId));

    logger.info({ businessId, enabled }, "[skip-feedback] aggregate feedback opt-in toggled");
    res.json({ success: true, feedbackOptIn: enabled });
  } catch (err) {
    req.log.error({ err }, "PATCH /businesses/mine/feedback-opt-in error");
    res.status(500).json({ error: "Failed to update setting." });
  }
});

/**
 * Retains the legacy route name for clients that have not moved to the Kinfolk
 * namespace, but makes the contract business-scoped and aggregate-only.
 */
router.get("/businesses/mine/skip-feedback", async (req: Request, res: Response) => {
  try {
    const businessId = String(req.query["businessId"] ?? "").trim();
    if (!businessId) {
      res.status(400).json({ error: "businessId is required." });
      return;
    }
    if (!await requireVerifiedMinorityFlywheelOwner(req, res, businessId)) return;

    const rows = await db
      .select({
        message: businessSkipFeedbackTable.message,
        submittedById: businessSkipFeedbackTable.submittedById,
      })
      .from(businessSkipFeedbackTable)
      .where(eq(businessSkipFeedbackTable.businessId, businessId));

    res.json({
      businessId,
      ...aggregatePrivateSkipFeedbackSignals(rows),
      minimumDistinctMembers: PRIVATE_SKIP_FEEDBACK_MINIMUM_DISTINCT_MEMBERS,
    });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/skip-feedback error");
    res.status(500).json({ error: "Failed to fetch feedback." });
  }
});

export default router;
