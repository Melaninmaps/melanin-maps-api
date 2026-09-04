import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, safetyReportsTable, safetyIncidentsTable, businessesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { reportLimiter } from "../middleware/rateLimiter";
import { sendPushToBusinessOwnersByCity } from "../lib/pushNotifications";
import { sendAdminSafetyReportAlert } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VALID_CATEGORIES = ["safety", "sundown", "discrimination", "business", "resource", "positive", "police"] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;
const VALID_ENCOUNTER_TYPES = [
  "police_stop",
  "ice_activity",
  "racial_profiling",
  "excessive_force",
  "checkpoint",
  "other_encounter",
] as const;

/**
 * Keep the API's persisted category vocabulary stable even when an older
 * client submits the label it displays to a person. New clients send the
 * canonical values directly.
 */
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

const ENCOUNTER_TYPE_ALIASES: Record<string, typeof VALID_ENCOUNTER_TYPES[number]> = {
  "police stop/questioning": "police_stop",
  "police stop / questioning": "police_stop",
  "ice activity": "ice_activity",
  "racial profiling": "racial_profiling",
  "excessive force/misconduct": "excessive_force",
  "excessive force / misconduct": "excessive_force",
  "checkpoint/roadblock": "checkpoint",
  "checkpoint / roadblock": "checkpoint",
  "other encounter": "other_encounter",
};

export function normalizeReportEncounterType(
  encounterType: unknown,
): typeof VALID_ENCOUNTER_TYPES[number] | null {
  if (typeof encounterType !== "string") return null;
  const normalized = encounterType.trim().toLowerCase();
  if ((VALID_ENCOUNTER_TYPES as readonly string[]).includes(normalized)) {
    return normalized as typeof VALID_ENCOUNTER_TYPES[number];
  }
  return ENCOUNTER_TYPE_ALIASES[normalized] ?? null;
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
const VALID_TARGET_TYPES = ["neighborhood", "business", "area"] as const;

const INCIDENT_THRESHOLD = 3;
const INCIDENT_WINDOW_DAYS = 7;
const SAFETY_RATING_THRESHOLD = 3;

const SEVERITY_WEIGHTS: Record<string, number> = { low: 0.2, medium: 0.5, high: 1.0, critical: 2.0 };

function publicSafetyReport(report: typeof safetyReportsTable.$inferSelect) {
  return {
    id: report.id,
    category: report.category,
    encounterType: report.encounterType,
    targetType: report.targetType,
    targetId: report.targetId,
    targetName: report.targetName,
    description: report.description,
    severity: report.severity,
    status: report.status,
    businessResponseText: report.businessResponseText,
    createdAt: report.createdAt,
  };
}

// Short-lived coordinate-keyed cache for proximity-warnings.
// Rounds to 3 decimal places (~111 m) so nearby poll ticks share a cache entry.
// Community safety data only — no user-specific fields in the cached payload.
const PROXIMITY_CACHE_TTL_MS = 60_000;
interface ProximityCacheEntry {
  data: { warnings: unknown[]; areaIncidents: unknown[] };
  expiresAt: number;
}
const proximityCache = new Map<string, ProximityCacheEntry>();

function proximityCacheKey(lat: number, lng: number, radius: number): string {
  return `${Math.round(lat * 1000) / 1000}:${Math.round(lng * 1000) / 1000}:${radius}`;
}

/**
 * Recomputes and saves a business's safetyRating.
 * countAllPending=true  → non-minority: every non-dismissed report counts immediately
 * countAllPending=false → minority: only admin-reviewed ("reviewed"|"actioned") reports count
 * In both cases the rating only changes once 3+ qualifying reports exist.
 */
async function updateBusinessSafetyRating(businessId: string, countAllPending: boolean): Promise<void> {
  try {
    const statusFilter = countAllPending
      ? `target_id = $1 AND target_type = 'business' AND status != 'dismissed'`
      : `target_id = $1 AND target_type = 'business' AND status IN ('reviewed', 'actioned')`;

    const result = await pool.query<{ severity: string; count: string }>(
      `SELECT severity, COUNT(*)::text AS count FROM safety_reports WHERE ${statusFilter} GROUP BY severity`,
      [businessId],
    );

    let totalReports = 0;
    let totalWeight = 0;
    for (const row of result.rows) {
      const n = parseInt(row.count, 10);
      totalReports += n;
      totalWeight += (SEVERITY_WEIGHTS[row.severity] ?? 0.5) * n;
    }

    if (totalReports < SAFETY_RATING_THRESHOLD) return;

    const safetyRating = Math.max(0, 5.0 - totalWeight).toFixed(1);
    await pool.query(`UPDATE businesses SET safety_rating = $1 WHERE id = $2`, [safetyRating, businessId]);
    logger.info({ businessId, safetyRating, totalReports, countAllPending }, "[safety] business safety rating updated");
  } catch (err) {
    logger.error({ err }, "[safety] failed to update business safety rating");
  }
}

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
    businessResponseRequested,
    incidentCategories,
    incidentParties,
    incidentSeverity,
    incidentDescription,
    evidenceLinks,
    encounterType,  // police/ICE sub-type (e.g. "Excessive Force/Misconduct")
  } = req.body as Record<string, unknown>;

  const resolvedCategory = normalizeReportCategory(category);
  if (!resolvedCategory) {
    res.status(400).json({ error: "Invalid category" });
    return;
  }

  const resolvedEncounterType = resolvedCategory === "police"
    ? normalizeReportEncounterType(encounterType)
    : null;
  if (resolvedCategory === "police" && encounterType != null && !resolvedEncounterType) {
    res.status(400).json({ error: "Invalid encounterType" });
    return;
  }

  if (!targetName || typeof targetName !== "string" || targetName.trim().length === 0) {
    res.status(400).json({ error: "targetName (location) is required" });
    return;
  }

  // Accept internal severity values OR spoken-language labels from the UI
  const resolvedSeverity: typeof VALID_SEVERITIES[number] =
    typeof severity === "string" && VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number])
      ? (severity as typeof VALID_SEVERITIES[number])
      : typeof severity === "string" && SPOKEN_SEVERITY_MAP[severity]
        ? SPOKEN_SEVERITY_MAP[severity]
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
        reporterId: isAnon ? null : (req.user?.id ?? null),
        reporterName,
        category: resolvedCategory,
        encounterType: resolvedEncounterType,
        targetType: resolvedTargetType,
        targetId: typeof targetId === "string" ? targetId : null,
        targetName: (targetName as string).trim(),
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

    const nameParts = (targetName as string).trim().split(",");
    const city = nameParts[nameParts.length - 1]?.trim() ?? (targetName as string).trim();
    const neighborhood = nameParts.length > 1 ? nameParts[0].trim() : null;

    await checkAndTriggerIncident(city, resolvedCategory, resolvedSeverity, neighborhood);

    // Look up the targeted business (if any) to determine ownership for rating + email
    let isMinorityOwned: boolean | null = null;
    const resolvedTargetId = typeof targetId === "string" ? targetId : null;
    if (resolvedTargetType === "business" && resolvedTargetId) {
      const [biz] = await db
        .select({ blackOwned: businessesTable.blackOwned })
        .from(businessesTable)
        .where(eq(businessesTable.id, resolvedTargetId))
        .limit(1);
      if (biz) {
        isMinorityOwned = biz.blackOwned;
        // Non-minority-owned: all reports count immediately — update rating if 3+ reached
        if (!biz.blackOwned) {
          await updateBusinessSafetyRating(resolvedTargetId, true);
        }
        // Minority-owned: rating only updated after admin review — no auto-update here
      }
    }

    // Always email admin on every report
    sendAdminSafetyReportAlert({
      category: resolvedCategory,
      targetType: resolvedTargetType,
      targetName: (targetName as string).trim(),
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
    res.json({ reports: reports.map(publicSafetyReport) });
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

    // When a report targeting a minority-owned business is reviewed or actioned,
    // recalculate their safety rating using only reviewed reports.
    if ((status === "reviewed" || status === "actioned") && updated.targetType === "business" && updated.targetId) {
      const [biz] = await db
        .select({ blackOwned: businessesTable.blackOwned })
        .from(businessesTable)
        .where(eq(businessesTable.id, updated.targetId))
        .limit(1);
      if (biz?.blackOwned) {
        await updateBusinessSafetyRating(updated.targetId, false);
      }
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
  const cached = proximityCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.json(cached.data);
    return;
  }

  try {
    // Business-linked danger reports: join safety_reports → businesses for real coordinates.
    // Groups by business, only surfaces those with 3+ non-dismissed reports in the last 7 days.
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
        MAX(sr.severity) AS severity,
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
        AND sr.status != 'dismissed'
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
      neighborhood: string | null;
      category: string;
      severity: string;
      report_count: string;
    }>(
      `SELECT id, city, neighborhood, category, severity, report_count::text
       FROM safety_incidents
       WHERE status = 'active'
         AND report_count >= $1
         AND triggered_at > NOW() - INTERVAL '7 days'
       ORDER BY report_count DESC
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
        neighborhood: r.neighborhood,
        category: r.category,
        severity: r.severity,
        reportCount: parseInt(r.report_count, 10),
      })),
    };

    // Cache the result — community data only, no user-specific fields
    proximityCache.set(cacheKey, { data: responseData, expiresAt: Date.now() + PROXIMITY_CACHE_TTL_MS });

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
    res.json({ incident: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to resolve safety incident");
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

export default router;
