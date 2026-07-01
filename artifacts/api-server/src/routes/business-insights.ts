import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { businessInsightSurveysTable } from "@workspace/db/schema";
import { eq, and, avg, count } from "drizzle-orm";

const router = Router();

router.post("/business-insights", async (req: Request, res: Response) => {
  try {
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

    const submittedByUserId = (req as any).user?.id ?? null;

    const [inserted] = await db.insert(businessInsightSurveysTable).values({
      businessId: businessId ?? null,
      businessName: businessName.trim(),
      businessCity: businessCity?.trim() ?? null,
      businessCategory: businessCategory?.trim() ?? null,
      businessAddress: businessAddress?.trim() ?? null,
      isMinorityOwned: false,
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
    const { businessId } = req.params;
    const rows = await db
      .select({
        surveyType: businessInsightSurveysTable.surveyType,
        responses: businessInsightSurveysTable.responses,
      })
      .from(businessInsightSurveysTable)
      .where(eq(businessInsightSurveysTable.businessId, String(businessId)));

    const safety = rows.filter(r => r.surveyType === "safety");
    const employee = rows.filter(r => r.surveyType === "employee");

    const avgSafetyRating = safety.length
      ? Math.round((safety.reduce((s, r) => s + ((r.responses as any)?.overallRating ?? 0), 0) / safety.length) * 10) / 10
      : null;
    const avgEmployeeRating = employee.length
      ? Math.round((employee.reduce((s, r) => s + ((r.responses as any)?.overallRating ?? 0), 0) / employee.length) * 10) / 10
      : null;

    res.json({
      total: rows.length,
      safetyCount: safety.length,
      employeeCount: employee.length,
      avgSafetyRating,
      avgEmployeeRating,
    });
  } catch (err) {
    (req as any).log.error({ err }, "GET /business-insights/summary error");
    res.status(500).json({ error: "Failed to load insights" });
  }
});

export default router;
