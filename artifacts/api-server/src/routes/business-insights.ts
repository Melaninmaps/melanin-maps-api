import { Router, type Request, type Response } from "express";
import { db, businessesTable, pool } from "@workspace/db";
import { businessInsightSurveysTable } from "@workspace/db/schema";
import { eq, and, avg, count } from "drizzle-orm";
import {
  isVerifiedMinorityFlywheelEligible,
  resolveVerifiedMinorityFlywheelOwner,
  VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR,
} from "../businesses/verifiedMinorityFlywheelEligibility";

const router = Router();
const BUSINESS_INSIGHT_MINIMUM_DISTINCT_MEMBERS = 5;

router.post("/business-insights", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const {
      businessId,
      businessName,
      businessCity,
      businessCategory,
      businessAddress,
      surveyType,
      responses,
    } = req.body as {
      businessId?: string;
      businessName: string;
      businessCity?: string;
      businessCategory?: string;
      businessAddress?: string;
      surveyType: string;
      responses: Record<string, unknown>;
    };

    if (!businessName?.trim()) {
      res.status(400).json({ error: "businessName is required" });
      return;
    }
    if (!["safety", "employee"].includes(surveyType)) {
      res.status(400).json({ error: "surveyType must be 'safety' or 'employee'" });
      return;
    }
    if (!responses || typeof responses !== "object") {
      res.status(400).json({ error: "responses is required" });
      return;
    }

    const submittedByUserId = req.user.id;
    let isMinorityOwned = false;
    if (businessId) {
      const [business] = await db
        .select({
          status: businessesTable.status,
          verified: businessesTable.verified,
          verifiedDesignations: businessesTable.verifiedDesignations,
        })
        .from(businessesTable)
        .where(eq(businessesTable.id, businessId))
        .limit(1);
      // The submitter cannot label a survey as minority-owned. This field is
      // derived from the same controlled designation used for later delivery.
      isMinorityOwned = Boolean(business && isVerifiedMinorityFlywheelEligible(business));
    }

    const [inserted] = await db.insert(businessInsightSurveysTable).values({
      businessId: businessId ?? null,
      businessName: businessName.trim(),
      businessCity: businessCity?.trim() ?? null,
      businessCategory: businessCategory?.trim() ?? null,
      businessAddress: businessAddress?.trim() ?? null,
      isMinorityOwned: isMinorityOwned ?? false,
      surveyType,
      submittedByUserId,
      responses: responses as any,
    }).returning({ id: businessInsightSurveysTable.id });

    res.status(201).json({ id: inserted.id, submitted: true });
  } catch (err) {
    (req as any).log.error({ err }, "POST /business-insights error");
    res.status(500).json({ error: "Failed to submit insight" });
  }
});

router.get("/business-insights/summary/:businessId", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { businessId } = req.params;
    const access = await resolveVerifiedMinorityFlywheelOwner(pool, {
      businessId: String(businessId),
      userId: req.user.id,
    });
    if (access.kind === "not_owner") {
      res.status(403).json({ error: "Approved business owner access is required" });
      return;
    }
    if (access.kind === "ineligible") {
      res.status(403).json({
        error: VERIFIED_MINORITY_FLYWHEEL_ACCESS_ERROR,
        code: "VERIFIED_MINORITY_FLYWHEEL_ELIGIBILITY_REQUIRED",
      });
      return;
    }
    const rows = await db
      .select({
        surveyType: businessInsightSurveysTable.surveyType,
        responses: businessInsightSurveysTable.responses,
        submittedByUserId: businessInsightSurveysTable.submittedByUserId,
        createdAt: businessInsightSurveysTable.createdAt,
      })
      .from(businessInsightSurveysTable)
      .where(and(
        eq(businessInsightSurveysTable.businessId, String(businessId)),
        eq(businessInsightSurveysTable.status, "approved"),
      ));

    // Use one approved response per member and survey type. This keeps a
    // repeat submitter from creating the appearance of a community trend.
    const latestByMemberAndType = new Map<string, typeof rows[number]>();
    for (const row of rows) {
      if (!row.submittedByUserId) continue;
      const key = `${row.submittedByUserId}:${row.surveyType}`;
      const existing = latestByMemberAndType.get(key);
      if (!existing || row.createdAt > existing.createdAt) {
        latestByMemberAndType.set(key, row);
      }
    }
    const approvedDistinctResponses = [...latestByMemberAndType.values()];
    const safety = approvedDistinctResponses.filter(r => r.surveyType === "safety");
    const employee = approvedDistinctResponses.filter(r => r.surveyType === "employee");
    const safetyAvailable = safety.length >= BUSINESS_INSIGHT_MINIMUM_DISTINCT_MEMBERS;
    const employeeAvailable = employee.length >= BUSINESS_INSIGHT_MINIMUM_DISTINCT_MEMBERS;

    const avgSafetyRating = safetyAvailable
      ? Math.round((safety.reduce((s, r) => s + ((r.responses as any)?.overallRating ?? 0), 0) / safety.length) * 10) / 10
      : null;
    const avgEmployeeRating = employeeAvailable
      ? Math.round((employee.reduce((s, r) => s + ((r.responses as any)?.overallRating ?? 0), 0) / employee.length) * 10) / 10
      : null;

    res.json({
      available: safetyAvailable || employeeAvailable,
      minimumDistinctMembers: BUSINESS_INSIGHT_MINIMUM_DISTINCT_MEMBERS,
      total: approvedDistinctResponses.length,
      safetyCount: safetyAvailable ? safety.length : null,
      employeeCount: employeeAvailable ? employee.length : null,
      avgSafetyRating,
      avgEmployeeRating,
    });
  } catch (err) {
    (req as any).log.error({ err }, "GET /business-insights/summary error");
    res.status(500).json({ error: "Failed to load insights" });
  }
});

export default router;
