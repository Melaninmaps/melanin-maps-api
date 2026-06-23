import { Router, type IRouter, type Request, type Response } from "express";
import { db, neighborhoodSurveysTable, safetyReportsTable, SAFETY_REPORT_CATEGORIES, SAFETY_REPORT_SEVERITIES } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

type ReportCategory = (typeof SAFETY_REPORT_CATEGORIES)[number];
type ReportSeverity = (typeof SAFETY_REPORT_SEVERITIES)[number];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  return !!(user?.email && ADMIN_EMAILS.includes(user.email));
}

const router: IRouter = Router();

router.get("/moderation/reports", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";

    const [reports, surveys] = await Promise.all([
      db
        .select()
        .from(safetyReportsTable)
        .where(status === "all" ? undefined : eq(safetyReportsTable.status, status))
        .orderBy(desc(safetyReportsTable.createdAt))
        .limit(50),
      db
        .select({
          id: neighborhoodSurveysTable.id,
          city: neighborhoodSurveysTable.city,
          neighborhood: neighborhoodSurveysTable.neighborhood,
          comments: neighborhoodSurveysTable.comments,
          safetyScore: neighborhoodSurveysTable.safetyScore,
          status: neighborhoodSurveysTable.status,
          moderatorNotes: neighborhoodSurveysTable.moderatorNotes,
          reviewedAt: neighborhoodSurveysTable.reviewedAt,
          createdAt: neighborhoodSurveysTable.createdAt,
        })
        .from(neighborhoodSurveysTable)
        .where(status === "all" ? undefined : eq(neighborhoodSurveysTable.status, status))
        .orderBy(desc(neighborhoodSurveysTable.createdAt))
        .limit(50),
    ]);

    const normalizedReports = reports.map((r) => ({
      id: r.id,
      kind: "report" as const,
      category: r.category,
      targetName: r.targetName,
      targetType: r.targetType,
      reporterName: r.reporterName,
      description: r.description,
      severity: r.severity,
      status: r.status,
      moderatorNotes: r.moderatorNotes,
      createdAt: r.createdAt,
    }));

    const normalizedSurveys = surveys.map((s) => ({
      id: s.id,
      kind: "survey" as const,
      category: "Safety Survey",
      targetName: s.neighborhood ? `${s.neighborhood}, ${s.city}` : s.city,
      targetType: "neighborhood",
      reporterName: "Community Member",
      description: s.comments ?? `Safety score: ${s.safetyScore}/100`,
      severity: s.safetyScore < 40 ? "high" : s.safetyScore < 70 ? "medium" : "low",
      status: s.status,
      moderatorNotes: s.moderatorNotes,
      createdAt: s.createdAt,
    }));

    const allItems = [...normalizedReports, ...normalizedSurveys].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const pendingCount = allItems.filter((i) => i.status === "pending").length;
    const highCount = allItems.filter((i) => i.severity === "high" && i.status === "pending").length;

    res.json({ items: allItems, pendingCount, highCount });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch moderation queue");
    res.status(500).json({ error: "Failed to fetch moderation queue" });
  }
});

router.patch("/moderation/reports/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const id = req.params["id"] as string;
    const { status, moderatorNotes, kind } = req.body as {
      status: "approved" | "rejected" | "pending";
      moderatorNotes?: string;
      kind: "report" | "survey";
    };

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be approved, rejected, or pending." });
      return;
    }

    const reviewedAt = new Date();
    const reviewedBy = req.user?.id ?? "admin";

    if (kind === "survey") {
      const [updated] = await db
        .update(neighborhoodSurveysTable)
        .set({ status, moderatorNotes: moderatorNotes ?? null, reviewedAt, reviewedBy })
        .where(eq(neighborhoodSurveysTable.id, id))
        .returning({ id: neighborhoodSurveysTable.id, status: neighborhoodSurveysTable.status });

      if (!updated) {
        res.status(404).json({ error: "Survey not found" });
        return;
      }
      res.json({ id: updated.id, status: updated.status });
    } else {
      const [updated] = await db
        .update(safetyReportsTable)
        .set({ status, moderatorNotes: moderatorNotes ?? null, reviewedAt, reviewedBy })
        .where(eq(safetyReportsTable.id, id))
        .returning({ id: safetyReportsTable.id, status: safetyReportsTable.status });

      if (!updated) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      res.json({ id: updated.id, status: updated.status });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to update report status");
    res.status(500).json({ error: "Failed to update report status" });
  }
});

export default router;
