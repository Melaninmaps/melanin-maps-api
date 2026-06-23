import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, safetyReportsTable, safetyIncidentsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { reportLimiter } from "../middleware/rateLimiter";
import { sendPushToBusinessOwnersByCity } from "../lib/pushNotifications";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VALID_CATEGORIES = ["safety", "sundown", "discrimination", "business", "resource", "positive"] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;
const VALID_TARGET_TYPES = ["neighborhood", "business", "area"] as const;

const INCIDENT_THRESHOLD = 3;
const INCIDENT_WINDOW_DAYS = 7;

const CATEGORY_LABELS: Record<string, string> = {
  safety: "Safety Concern",
  sundown: "Sundown Town Warning",
  discrimination: "Discrimination Incident",
  business: "Business Safety Update",
  resource: "Community Resource",
  positive: "Positive Safety Tip",
};

async function checkAndTriggerIncident(
  city: string,
  category: string,
  severity: string,
  neighborhood: string | null,
): Promise<void> {
  try {
    const sinceDate = new Date(Date.now() - INCIDENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const pattern = `%${city}%`;

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM safety_reports
       WHERE target_name ILIKE $1 AND category = $2 AND created_at >= $3`,
      [pattern, category, sinceDate],
    );
    const reportCount = parseInt(countResult.rows[0]?.count ?? "0", 10);

    logger.info({ city, category, reportCount, threshold: INCIDENT_THRESHOLD }, "[safety] threshold check");

    if (reportCount < INCIDENT_THRESHOLD) return;

    const existingResult = await pool.query<{ id: string }>(
      `SELECT id FROM safety_incidents
       WHERE city ILIKE $1 AND category = $2 AND status = 'active' AND triggered_at >= $3
       LIMIT 1`,
      [pattern, category, sinceDate],
    );

    const categoryLabel = CATEGORY_LABELS[category] ?? category;

    if (existingResult.rows.length > 0) {
      const existingId = existingResult.rows[0].id;
      await pool.query(
        `UPDATE safety_incidents SET report_count = $1, severity = $2 WHERE id = $3`,
        [reportCount, severity, existingId],
      );
      logger.info({ incidentId: existingId, reportCount }, "[safety] incident updated");
      return;
    }

    const insertResult = await pool.query<{ id: string }>(
      `INSERT INTO safety_incidents (city, neighborhood, category, severity, report_count, status, notifications_sent, triggered_at)
       VALUES ($1, $2, $3, $4, $5, 'active', false, NOW()) RETURNING id`,
      [city, neighborhood, category, severity, reportCount],
    );
    const incidentId = insertResult.rows[0]?.id;
    if (!incidentId) return;

    logger.info({ incidentId, city, category, reportCount }, "[safety] incident triggered — notifying business owners");

    const locationLabel = neighborhood ? `${neighborhood}, ${city}` : city;
    await sendPushToBusinessOwnersByCity(city, {
      title: `⚠️ Safety Alert Near Your Business`,
      body: `A ${categoryLabel} has been reported in ${locationLabel} by ${reportCount} community members. Review your safety status.`,
      data: { screen: "safety", incidentId, city, category },
    });

    await pool.query(`UPDATE safety_incidents SET notifications_sent = true WHERE id = $1`, [incidentId]);
  } catch (err: unknown) {
    logger.error({ err }, "[safety] incident check failed");
  }
}

router.post("/reports", reportLimiter, async (req: Request, res: Response): Promise<void> => {
  const {
    category,
    targetType,
    targetId,
    targetName,
    description,
    severity,
    isAnonymous,
  } = req.body as Record<string, unknown>;

  if (!category || !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  if (!targetName || typeof targetName !== "string" || targetName.trim().length === 0) {
    res.status(400).json({ error: "targetName (location) is required" });
    return;
  }

  const resolvedSeverity =
    typeof severity === "string" && VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number])
      ? (severity as typeof VALID_SEVERITIES[number])
      : "medium";

  const resolvedTargetType =
    typeof targetType === "string" && VALID_TARGET_TYPES.includes(targetType as typeof VALID_TARGET_TYPES[number])
      ? (targetType as typeof VALID_TARGET_TYPES[number])
      : "neighborhood";

  const isAnon = isAnonymous !== false;
  let reporterName = "Anonymous";
  if (!isAnon && req.user) {
    reporterName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member";
  }

  try {
    const [report] = await db
      .insert(safetyReportsTable)
      .values({
        reporterId: req.user?.id ?? null,
        reporterName,
        category: category as string,
        targetType: resolvedTargetType,
        targetId: typeof targetId === "string" ? targetId : null,
        targetName: (targetName as string).trim(),
        description: typeof description === "string" ? description.slice(0, 2000) : null,
        severity: resolvedSeverity,
        status: "pending",
      })
      .returning();

    const nameParts = (targetName as string).trim().split(",");
    const city = nameParts[nameParts.length - 1]?.trim() ?? (targetName as string).trim();
    const neighborhood = nameParts.length > 1 ? nameParts[0].trim() : null;

    await checkAndTriggerIncident(city, category as string, resolvedSeverity, neighborhood);

    res.status(201).json({
      report,
      message: "Report submitted. Thank you for keeping the community safe.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit safety report");
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.get("/reports", async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, category, status } = req.query;

    let query = db
      .select()
      .from(safetyReportsTable)
      .orderBy(desc(safetyReportsTable.createdAt))
      .limit(100)
      .$dynamic();

    if (typeof status === "string") {
      query = query.where(eq(safetyReportsTable.status, status));
    }

    const reports = await query;
    res.json({ reports });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch safety reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.get("/incidents", async (req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await db
      .select()
      .from(safetyIncidentsTable)
      .where(eq(safetyIncidentsTable.status, "active"))
      .orderBy(desc(safetyIncidentsTable.triggeredAt))
      .limit(50);

    res.json({ incidents });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch safety incidents");
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.get("/admin/safety-reports", async (req: any, res: Response): Promise<void> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (!req.user?.email || !ADMIN_EMAILS.includes(req.user.email)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const reports = await db
      .select()
      .from(safetyReportsTable)
      .orderBy(desc(safetyReportsTable.createdAt))
      .limit(200);
    res.json({ reports });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin safety reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.patch("/admin/safety-reports/:id", async (req: any, res: Response): Promise<void> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (!req.user?.email || !ADMIN_EMAILS.includes(req.user.email)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { status, moderatorNotes } = req.body as { status?: string; moderatorNotes?: string };
  const allowed = ["pending", "reviewed", "dismissed", "actioned"];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  try {
    const [updated] = await db
      .update(safetyReportsTable)
      .set({
        status: status as string,
        moderatorNotes: moderatorNotes ?? null,
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      })
      .where(eq(safetyReportsTable.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    res.json({ report: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update safety report");
    res.status(500).json({ error: "Failed to update report" });
  }
});

router.get("/admin/safety-incidents", async (req: any, res: Response): Promise<void> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (!req.user?.email || !ADMIN_EMAILS.includes(req.user.email)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const incidents = await db
      .select()
      .from(safetyIncidentsTable)
      .orderBy(desc(safetyIncidentsTable.triggeredAt))
      .limit(200);
    res.json({ incidents });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin safety incidents");
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.patch("/admin/safety-incidents/:id/resolve", async (req: any, res: Response): Promise<void> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e: string) => e.trim()).filter(Boolean);
  if (!req.user?.email || !ADMIN_EMAILS.includes(req.user.email)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const [updated] = await db
      .update(safetyIncidentsTable)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(safetyIncidentsTable.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }
    res.json({ incident: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to resolve safety incident");
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

export default router;
