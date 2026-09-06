import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, safetyReportsTable, safetyIncidentsTable, businessesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { reportLimiter } from "../middleware/rateLimiter";
import { sendAdminSafetyReportAlert } from "../lib/email";
import { moderateSafetyReport } from "../safety/moderateSafetyReport";
import {
  getCachedProximityWarnings,
  invalidateProximityWarningCache,
  proximityCacheKey,
  setCachedProximityWarnings,
} from "../safety/proximityWarningCache";
import {
  normalizeIncidentLocation,
  normalizePoliceEncounterType,
  normalizeReportTarget,
  reportMustBeAnonymous,
} from "../safety/reportContract";

const router: IRouter = Router();

const VALID_CATEGORIES = ["safety", "sundown", "discrimination", "business", "resource", "positive", "police"] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;

const REPORT_CATEGORY_ALIASES: Record<string, typeof VALID_CATEGORIES[number]> = {
  "safety concern": "safety",
  "sundown town warning": "sundown",
  discrimination: "discrimination",
  "business update": "business",
  "community resource": "resource",
  "positive safety tip": "positive",
  "police stop/questioning": "police",
  "ice activity": "police",
  "racial profiling": "police",
  "excessive force/misconduct": "police",
  "checkpoint/roadblock": "police",
  "other encounter": "police",
};

export function normalizeReportCategory(category: unknown): typeof VALID_CATEGORIES[number] | null {
  if (typeof category !== "string") return null;
  const normalized = category.trim().toLowerCase();
  if ((VALID_CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as typeof VALID_CATEGORIES[number];
  }
  return REPORT_CATEGORY_ALIASES[normalized] ?? null;
}

export function normalizeReportEncounterType(encounterType: unknown) {
  return normalizePoliceEncounterType(encounterType);
}

// Spoken severity labels from the UI → internal severity values
const SPOKEN_SEVERITY_MAP: Record<string, typeof VALID_SEVERITIES[number]> = {
  // General / business
  "Something felt off": "low",
  "I felt unsafe": "medium",
  "I needed to leave or get help": "high",
  "Someone could be in immediate danger": "critical",
  // Police / ICE
  "The interaction concerned me": "low",
  "I felt targeted or unsafe": "medium",
  "Force, detention, or serious misconduct occurred": "high",
  "There is an immediate safety threat": "critical",
  // Sundown / travel
  "Sharing historical or local context": "low",
  "Recent experiences made me concerned": "medium",
  "I felt targeted or unsafe here": "high",
  "There may be an immediate danger": "critical",
};
const INCIDENT_THRESHOLD = 3;

function publicSafetyReport(report: typeof safetyReportsTable.$inferSelect) {
  const sensitive = reportMustBeAnonymous(report.category);
  const cityRegion = report.incidentCity
    ? [report.incidentCity, report.incidentRegion].filter(Boolean).join(", ")
    : null;
  const safeLocation = sensitive
    ? (cityRegion || "Location withheld")
    : (report.incidentArea && cityRegion
      ? `${report.incidentArea}, ${cityRegion}`
      : cityRegion || report.targetName);
  return {
    id: report.id,
    category: report.category,
    encounterType: report.encounterType,
    targetType: sensitive ? "neighborhood" : report.targetType,
    targetId: sensitive ? null : report.targetId,
    targetName: safeLocation,
    description: sensitive ? null : report.description,
    severity: report.severity,
    status: report.status,
    businessResponseText: report.businessResponseText,
    createdAt: report.createdAt,
  };
}

router.post("/reports", reportLimiter, async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const {
    category,
    targetType,
    targetId,
    description,
    severity,
    isAnonymous,
    businessResponseRequested,
    incidentCategories,
    incidentParties,
    incidentSeverity,
    incidentDescription,
    evidenceLinks,
    encounterType,  // police/ICE sub-type (e.g. "Excessive Force/Misconduct")
  } = body;

  // Build 105 sent the selected Police/ICE subtype in `category`. Accept it as
  // a compatibility adapter, but persist the canonical category and subtype.
  const legacyEncounterType = normalizePoliceEncounterType(category);
  const resolvedCategory = normalizeReportCategory(legacyEncounterType ? "police" : category);

  if (!resolvedCategory) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  const sensitiveReport = reportMustBeAnonymous(resolvedCategory as string);
  const incidentLocation = normalizeIncidentLocation(body, { sensitive: sensitiveReport });
  if (!incidentLocation) {
    res.status(400).json({ error: "Incident city or area is required" });
    return;
  }

  const resolvedEncounterType = resolvedCategory === "police"
    ? (legacyEncounterType ?? normalizeReportEncounterType(encounterType))
    : null;
  if (resolvedCategory === "police" && !resolvedEncounterType) {
    res.status(400).json({ error: "A valid Police/ICE encounter type is required" });
    return;
  }

  // Accept internal severity values OR spoken-language labels from the UI
  const resolvedSeverity: typeof VALID_SEVERITIES[number] =
    typeof severity === "string" && VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number])
      ? (severity as typeof VALID_SEVERITIES[number])
      : typeof severity === "string" && SPOKEN_SEVERITY_MAP[severity]
        ? SPOKEN_SEVERITY_MAP[severity]
        : "medium";

  const {
    targetType: resolvedTargetType,
    targetId: resolvedTargetId,
  } = normalizeReportTarget(targetType, targetId, sensitiveReport);

  const isAnon = sensitiveReport || isAnonymous !== false;
  let reporterName = "Anonymous";
  if (!isAnon && req.user) {
    reporterName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Community Member";
  }

  try {
    const [report] = await db
      .insert(safetyReportsTable)
      .values({
        reporterId: isAnon ? null : (req.user?.id ?? null),
        reporterName,
        category: resolvedCategory as string,
        targetType: resolvedTargetType,
        targetId: resolvedTargetId,
        targetName: incidentLocation.label,
        encounterType: resolvedEncounterType,
        incidentCity: incidentLocation.city,
        incidentRegion: incidentLocation.region,
        incidentArea: incidentLocation.area,
        incidentLocationSource: incidentLocation.source,
        incidentLocationPrecision: incidentLocation.precision,
        description: typeof description === "string" ? description.slice(0, 2000) : null,
        severity: resolvedSeverity,
        routingType:
          // Always priority: safety concern, discrimination, sundown, and police/ICE encounters
          (resolvedCategory === "safety" || resolvedCategory === "discrimination" || resolvedCategory === "sundown" || resolvedCategory === "police")
            ? "priority"
            // Excessive force is doubly prioritized — already covered by police category above
            : businessResponseRequested === true ? "private" : "moderation",
        businessResponseRequested: businessResponseRequested === true,
        businessResponseDeadline: businessResponseRequested === true
          ? new Date(Date.now() + 72 * 60 * 60 * 1000)
          : null,
        incidentCategories: Array.isArray(incidentCategories) ? incidentCategories as string[] : [],
        incidentParties: Array.isArray(incidentParties) ? incidentParties as string[] : [],
        incidentSeverity: typeof incidentSeverity === "string" ? incidentSeverity : null,
        incidentDescription: typeof incidentDescription === "string" ? incidentDescription.slice(0, 2000) : null,
        evidenceLinks: typeof evidenceLinks === "string" ? evidenceLinks : null,
        status: "pending",
      })
      .returning();

    // Look up the targeted business (if any) to determine ownership for rating + email
    let isMinorityOwned: boolean | null = null;
    if (resolvedTargetType === "business" && resolvedTargetId) {
      const [biz] = await db
        .select({ blackOwned: businessesTable.blackOwned })
        .from(businessesTable)
        .where(eq(businessesTable.id, resolvedTargetId))
        .limit(1);
      if (biz) {
        isMinorityOwned = biz.blackOwned;
      }
    }

    // Always email admin on every report
    sendAdminSafetyReportAlert({
      category: resolvedCategory as string,
      targetType: resolvedTargetType,
      targetName: incidentLocation.label,
      severity: resolvedSeverity,
      description: typeof description === "string" ? description.slice(0, 500) : null,
      reporterName,
      isMinorityOwned,
      reportId: report.id,
    }).catch((err) => req.log.warn({ err }, "Failed to send admin safety report alert"));

    res.status(201).json({
      report: publicSafetyReport(report),
      message: "Report submitted. Thank you for keeping the community safe.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit safety report");
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.get("/reports", async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await db
      .select()
      .from(safetyReportsTable)
      .where(eq(safetyReportsTable.status, "approved"))
      .orderBy(desc(safetyReportsTable.createdAt))
      .limit(100);
    res.json({ reports: reports.map(publicSafetyReport) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch safety reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.get("/incidents", async (req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await pool.query(
      `SELECT si.id, si.city, si.region, si.neighborhood, si.category, si.severity,
              approved.report_count::int AS "reportCount",
              si.status, si.notifications_sent AS "notificationsSent",
              si.triggered_at AS "triggeredAt"
       FROM safety_incidents si
       JOIN LATERAL (
         SELECT COUNT(*) AS report_count
         FROM safety_reports sr
         WHERE LOWER(sr.incident_city) = LOWER(si.city)
           AND LOWER(sr.incident_region) = LOWER(si.region)
           AND sr.category = si.category
           AND sr.status = 'approved'
           AND sr.created_at > NOW() - INTERVAL '7 days'
       ) approved ON approved.report_count >= $1
       WHERE si.status = 'active'
         AND si.region IS NOT NULL
         AND si.triggered_at > NOW() - INTERVAL '7 days'
       ORDER BY si.triggered_at DESC
       LIMIT 50`,
      [INCIDENT_THRESHOLD],
    );

    res.json({ incidents: incidents.rows });
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
  const allowed = ["pending", "approved", "rejected"];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  try {
    const result = await moderateSafetyReport({
      id: req.params.id,
      status: status as "pending" | "approved" | "rejected",
      moderatorNotes,
      reviewedBy: req.user.id,
    });

    if (!result) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json({ report: result.report });
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

/**
 * GET /reports/proximity-warnings
 * Returns community danger flags within radius of a lat/lng.
 * Triggers when 3+ reports exist for a business or area in the last 7 days.
 */
router.get("/reports/proximity-warnings", async (req: Request, res: Response): Promise<void> => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = Math.min(parseFloat((req.query.radius as string) || "500"), 5000);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  // Return cached response for identical (or very nearby) coordinates within TTL
  const cacheKey = proximityCacheKey(lat, lng, radius);
  const cached = getCachedProximityWarnings(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    // Business-linked danger reports: join safety_reports → businesses for real coordinates.
    // Groups by business, only surfaces those with 3+ approved reports in the last 7 days.
    const businessWarnings = await pool.query<{
      target_id: string;
      business_name: string;
      category: string;
      severity: string;
      report_count: string;
      latitude: string;
      longitude: string;
      distance_meters: string;
    }>(
      `SELECT
        sr.target_id,
        b.name AS business_name,
        sr.category,
        CASE MAX(CASE sr.severity
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
          ELSE 0
        END)
          WHEN 4 THEN 'critical'
          WHEN 3 THEN 'high'
          WHEN 2 THEN 'medium'
          WHEN 1 THEN 'low'
          ELSE 'medium'
        END AS severity,
        COUNT(*) AS report_count,
        b.latitude::text,
        b.longitude::text,
        (
          6371000 * acos(
            LEAST(1.0,
              cos(radians($1)) * cos(radians(b.latitude::double precision))
              * cos(radians(b.longitude::double precision) - radians($2))
              + sin(radians($1)) * sin(radians(b.latitude::double precision))
            )
          )
        )::numeric(10,1) AS distance_meters
      FROM safety_reports sr
      JOIN businesses b ON sr.target_id = b.id::text
      WHERE
        sr.target_type = 'business'
        AND sr.status = 'approved'
        AND sr.created_at > NOW() - INTERVAL '7 days'
      GROUP BY sr.target_id, b.name, sr.category, b.latitude, b.longitude
      HAVING COUNT(*) >= $3
        AND (
          6371000 * acos(
            LEAST(1.0,
              cos(radians($1)) * cos(radians(b.latitude::double precision))
              * cos(radians(b.longitude::double precision) - radians($2))
              + sin(radians($1)) * sin(radians(b.latitude::double precision))
            )
          )
        ) <= $4
      ORDER BY distance_meters ASC
      LIMIT 20`,
      [lat, lng, INCIDENT_THRESHOLD, radius]
    );

    // Area-level active incidents (city/neighborhood level, no precise coordinates).
    // Returned separately so the client can show a city-wide alert if needed.
    const areaIncidents = await pool.query<{
      id: string;
      city: string;
      region: string;
      neighborhood: string | null;
      category: string;
      severity: string;
      report_count: string;
    }>(
      `SELECT si.id, si.city, si.region, si.neighborhood, si.category, si.severity,
              approved.report_count::text
       FROM safety_incidents si
       JOIN LATERAL (
         SELECT COUNT(*) AS report_count
         FROM safety_reports sr
         WHERE LOWER(sr.incident_city) = LOWER(si.city)
           AND LOWER(sr.incident_region) = LOWER(si.region)
           AND sr.category = si.category
           AND sr.status = 'approved'
           AND sr.created_at > NOW() - INTERVAL '7 days'
       ) approved ON approved.report_count >= $1
       WHERE si.status = 'active'
         AND si.region IS NOT NULL
         AND si.triggered_at > NOW() - INTERVAL '7 days'
       ORDER BY approved.report_count DESC
       LIMIT 10`,
      [INCIDENT_THRESHOLD]
    );

    const warnings = businessWarnings.rows.map((r) => ({
      type: "business" as const,
      targetId: r.target_id,
      name: r.business_name,
      category: r.category,
      severity: r.severity,
      reportCount: parseInt(r.report_count, 10),
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      distanceMeters: parseFloat(r.distance_meters),
    }));

    const responseData = {
      warnings,
      areaIncidents: areaIncidents.rows.map((r) => ({
        id: r.id,
        city: r.city,
        region: r.region,
        neighborhood: r.neighborhood,
        category: r.category,
        severity: r.severity,
        reportCount: parseInt(r.report_count, 10),
      })),
    };

    // Cache the result — community data only, no user-specific fields
    setCachedProximityWarnings(cacheKey, responseData);

    res.json(responseData);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch proximity warnings");
    res.status(500).json({ error: "Failed to fetch proximity warnings" });
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
    invalidateProximityWarningCache();
    res.json({ incident: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to resolve safety incident");
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

export default router;
