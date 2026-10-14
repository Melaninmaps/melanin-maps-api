import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, safetyReportsTable, safetyIncidentsTable, businessesTable } from "@workspace/db";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { reportLimiter } from "../middleware/rateLimiter";
import { sendAdminSafetyReportAlert } from "../lib/email";
import { isNamedAdmin } from "../lib/adminAuth";
import { moderateSafetyReport } from "../safety/moderateSafetyReport";
import { invalidateProximityWarningCache } from "../safety/proximityWarningCache";
import {
  normalizeIncidentLocation,
  normalizePoliceEncounterType,
  normalizeReportTarget,
  reportMustBeAnonymous,
  type IncidentLocation,
} from "../safety/reportContract";
import {
  hasPoliceIceReportingConsent,
  POLICE_ICE_REPORTING_CONSENT_VERSION,
} from "../safety/policeIceAlertPolicy";
import {
  calculateSafetyReportDisplayExpiry,
  normalizeLifecycleText,
  parseLifecycleExpiry,
} from "../safety/safetyHubLifecycle";

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
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function canonicalSensitiveIncidentLocation(
  queryable: Pick<typeof pool, "query">,
  body: Record<string, unknown>,
  fallback: IncidentLocation,
): Promise<IncidentLocation> {
  const raw = body.incidentLocation;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const locationId = typeof (raw as Record<string, unknown>).locationId === "string"
    ? String((raw as Record<string, unknown>).locationId).trim()
    : "";
  if (!UUID_PATTERN.test(locationId)) return fallback;

  const { rows } = await queryable.query<{
    city_name: string;
    state_code: string | null;
    neighborhood_name: string | null;
  }>(
    `SELECT city_name, state_code, neighborhood_name
     FROM community_locations
     WHERE id = $1::uuid
     LIMIT 1`,
    [locationId],
  );
  const area = rows[0];
  if (!area) return fallback;
  const cityRegion = [area.city_name, area.state_code].filter(Boolean).join(", ");
  return {
    city: area.city_name,
    region: area.state_code,
    area: area.neighborhood_name,
    source: fallback.source,
    precision: area.neighborhood_name ? "neighborhood" : "city",
    label: area.neighborhood_name ? `${area.neighborhood_name}, ${cityRegion}` : cityRegion,
  };
}

function publicSafetyReport(report: typeof safetyReportsTable.$inferSelect) {
  const sensitive = reportMustBeAnonymous(report.category);
  const cityRegion = report.incidentCity
    ? [report.incidentCity, report.incidentRegion].filter(Boolean).join(", ")
    : null;
  const safeLocation = sensitive
    ? (report.incidentArea && cityRegion
      ? `${report.incidentArea}, ${cityRegion}`
      : cityRegion || "Location withheld")
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
    displayExpiresAt: report.displayExpiresAt,
    correctedAt: report.correctedAt,
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
    reportingConsent,
    reportingConsentVersion,
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
  if (resolvedCategory === "police" && !hasPoliceIceReportingConsent({
    reportingConsent,
    reportingConsentVersion,
  })) {
    res.status(400).json({
      error: "Explicit consent is required before submitting a Police/ICE observation",
      requiredConsentVersion: POLICE_ICE_REPORTING_CONSENT_VERSION,
    });
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
    // Police/ICE intake is city-only even when a canonical location ID is
    // supplied. A member observation must never become a street, neighborhood,
    // or device-location record before moderation/corroboration.
    const storedIncidentLocation = resolvedCategory === "police"
      ? incidentLocation
      : sensitiveReport
      ? await canonicalSensitiveIncidentLocation(pool, body, incidentLocation)
      : incidentLocation;
    const [report] = await db
      .insert(safetyReportsTable)
      .values({
        reporterId: isAnon ? null : (req.user?.id ?? null),
        reporterName,
        category: resolvedCategory as string,
        targetType: resolvedTargetType,
        targetId: resolvedTargetId,
        targetName: storedIncidentLocation.label,
        encounterType: resolvedEncounterType,
        incidentCity: storedIncidentLocation.city,
        incidentRegion: storedIncidentLocation.region,
        incidentArea: storedIncidentLocation.area,
        incidentLocationSource: storedIncidentLocation.source,
        incidentLocationPrecision: storedIncidentLocation.precision,
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
        // Expiry controls display only; safety evidence remains available for
        // review and audit after the public-current window ends.
        displayExpiresAt: calculateSafetyReportDisplayExpiry(),
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

router.get("/reports", async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({ error: "Individual Safety report listings are unavailable. Choose a city for consented aggregate Community Intelligence instead." });
});

router.get("/incidents", async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({ error: "Individual incident listings are unavailable. Safety does not publish current report activity or location overlays." });
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

/**
 * Source-preserving Safety Hub lifecycle control. This endpoint never deletes
 * or overwrites report evidence; it records an auditable withdrawal or
 * correction, or changes only the current display expiry.
 */
router.patch("/admin/safety-reports/:id/lifecycle", async (req: Request, res: Response): Promise<void> => {
  if (!isNamedAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const action = typeof req.body?.action === "string" ? req.body.action : "";
  const reason = normalizeLifecycleText(req.body?.reason, 500);
  const correctionNote = normalizeLifecycleText(req.body?.correctionNote, 2000);
  const displayExpiresAt = parseLifecycleExpiry(req.body?.displayExpiresAt);
  const now = new Date();

  if (action !== "withdraw" && action !== "correct" && action !== "set_expiration") {
    res.status(400).json({ error: "Invalid lifecycle action" });
    return;
  }
  if (action === "withdraw" && !reason) {
    res.status(400).json({ error: "A withdrawal reason is required" });
    return;
  }
  if (action === "correct" && !correctionNote) {
    res.status(400).json({ error: "A correction note is required" });
    return;
  }
  if (action === "set_expiration" && !displayExpiresAt) {
    res.status(400).json({ error: "A valid displayExpiresAt timestamp is required" });
    return;
  }

  try {
    const lifecycleUpdate = action === "withdraw"
      ? {
          withdrawnAt: now,
          withdrawnBy: req.user!.id,
          withdrawalReason: reason,
        }
      : action === "correct"
        ? {
            correctedAt: now,
            correctedBy: req.user!.id,
            correctionNote,
            // A correction records source metadata and immediately ends only
            // the current display window; the original report is retained.
            displayExpiresAt: now,
          }
        : { displayExpiresAt: displayExpiresAt! };
    // A withdrawal or correction must preserve its first audit record. A
    // withdrawn/corrected source row can never be reactivated by merely moving
    // its display expiry.
    const lifecycleWhere = action === "withdraw"
      ? and(
          eq(safetyReportsTable.id, String(req.params.id)),
          isNull(safetyReportsTable.withdrawnAt),
        )
      : action === "correct"
        ? and(
            eq(safetyReportsTable.id, String(req.params.id)),
            isNull(safetyReportsTable.correctedAt),
          )
        : and(
            eq(safetyReportsTable.id, String(req.params.id)),
            isNull(safetyReportsTable.withdrawnAt),
            isNull(safetyReportsTable.correctedAt),
          );
    const [report] = await db
      .update(safetyReportsTable)
      .set(lifecycleUpdate)
      .where(lifecycleWhere)
      .returning();

    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    invalidateProximityWarningCache("report_lifecycle_changed");
    res.json({
      report: {
        id: report.id,
        status: report.status,
        displayExpiresAt: report.displayExpiresAt,
        withdrawnAt: report.withdrawnAt,
        correctedAt: report.correctedAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update safety report lifecycle");
    res.status(500).json({ error: "Failed to update report lifecycle" });
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
 * Coordinate-based Safety warnings are intentionally unavailable. Safety does
 * not receive route or device coordinates to rank reports, assess proximity,
 * or show member-facing activity overlays.
 */
router.get("/reports/proximity-warnings", async (_req: Request, res: Response): Promise<void> => {
  res.status(410).json({
    error: "Coordinate-based Safety warnings have been retired. Choose a city for consented aggregate Community Intelligence instead.",
  });
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
