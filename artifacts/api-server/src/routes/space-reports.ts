import { Router, type IRouter, type Request, type Response } from "express";
import { db, spaceReportsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { reportLimiter } from "../middleware/rateLimiter";
import { requireTrust } from "../middleware/requireTrust";
import { isAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

const VALID_CATEGORIES = ["restaurant", "store", "venue", "entertainment", "hotel", "workplace", "other"] as const;
const VALID_CONCERNS = ["racial_profiling", "hostile_staff", "unsafe_environment", "discrimination", "workplace_discrimination", "price_gouging", "retaliation", "harassment", "other"] as const;
const WARNING_THRESHOLD = 3;

// Concern types where reporter identity is ALWAYS hidden — even if the client
// passes isAnonymous=false. Protects employees from employer retracing.
// #80 — Permanent policy; never loosen without a legal/product review.
const FORCE_ANONYMOUS_CONCERNS = new Set(["discrimination", "workplace_discrimination", "retaliation", "harassment"]);

router.post("/space-reports", reportLimiter, requireTrust, async (req: any, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }

  const { spaceName, address, city, category, concernTypes, description, isAnonymous } = req.body as {
    spaceName?: string;
    address?: string;
    city?: string;
    category?: string;
    concernTypes?: string[];
    description?: string;
    isAnonymous?: boolean;
  };

  if (!spaceName?.trim()) { res.status(400).json({ error: "spaceName is required" }); return; }
  if (!city?.trim()) { res.status(400).json({ error: "city is required" }); return; }
  if (!category || !VALID_CATEGORIES.includes(category as any)) {
    res.status(400).json({ error: "Invalid category" }); return;
  }
  if (!Array.isArray(concernTypes) || concernTypes.length === 0) {
    res.status(400).json({ error: "At least one concern type is required" }); return;
  }
  const invalidConcern = concernTypes.find((c) => !VALID_CONCERNS.includes(c as any));
  if (invalidConcern) { res.status(400).json({ error: `Invalid concern type: ${invalidConcern}` }); return; }
  if (!description?.trim() || description.trim().length < 10) {
    res.status(400).json({ error: "Description must be at least 10 characters" }); return;
  }

  // #80 — Force anonymous when any concern type requires reporter protection.
  // This prevents employers from tracing back discrimination reporters even if
  // the client accidentally passes isAnonymous=false.
  const requiresForceAnonymous = concernTypes.some((c) => FORCE_ANONYMOUS_CONCERNS.has(c));
  const effectivelyAnonymous = requiresForceAnonymous || isAnonymous !== false;

  try {
    const [report] = await db.insert(spaceReportsTable).values({
      reporterId: effectivelyAnonymous ? null : req.user.id,
      spaceName: spaceName.trim().slice(0, 200),
      address: address?.trim().slice(0, 300) || null,
      city: city.trim().slice(0, 100),
      category: category === "workplace" ? "other" : category as Exclude<typeof VALID_CATEGORIES[number], "workplace">,
      concernTypes: JSON.stringify(concernTypes),
      description: description.trim().slice(0, 2000),
      isAnonymous: effectivelyAnonymous,
    }).returning();

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(spaceReportsTable)
      .where(sql`lower(space_name) = lower(${spaceName.trim()}) and lower(city) = lower(${city.trim()}) and status != 'dismissed'`);

    const totalReports = countResult[0]?.count ?? 0;
    const hasWarning = totalReports >= WARNING_THRESHOLD;

    // Never echo back reporterId — admins see it in the admin endpoint only.
    const { reporterId: _hidden, ...safeReport } = report;
    res.status(201).json({ report: { ...safeReport, forceAnonymous: requiresForceAnonymous }, hasWarning, totalReports });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create space report");
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.get("/space-reports/warnings", async (req: Request, res: Response): Promise<void> => {
  try {
    const warnings = await db
      .select({
        spaceName: spaceReportsTable.spaceName,
        city: spaceReportsTable.city,
        category: spaceReportsTable.category,
        reportCount: sql<number>`count(*)::int`,
        concernTypes: sql<string>`string_agg(concern_types, ',')`,
      })
      .from(spaceReportsTable)
      .where(sql`status != 'dismissed'`)
      .groupBy(
        sql`lower(space_name), lower(city), space_name, city, category`,
      )
      .having(sql`count(*) >= ${WARNING_THRESHOLD}`)
      .orderBy(sql`count(*) desc`)
      .limit(100);

    res.json({ warnings });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch warnings" });
  }
});

router.get("/admin/space-reports", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const reports = await db.select().from(spaceReportsTable).orderBy(desc(spaceReportsTable.createdAt)).limit(300);
    // Strip reporterId before sending — admins can see count and identity status but
    // reporter IDs should not be displayed in the admin dashboard.
    // POLICY: Reporter identity must NEVER be shared with the reported business owner.
    const sanitized = reports.map(({ reporterId, ...r }) => ({
      ...r,
      hasReporterId: !!reporterId,  // lets admin know if identity was captured (legacy non-anon reports)
    }));
    res.json({ reports: sanitized });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch space reports");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.patch("/admin/space-reports/:id", async (req: any, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const { status } = req.body as { status?: string };
  const allowed = ["pending", "reviewed", "dismissed", "actioned"];
  if (!status || !allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  try {
    const [updated] = await db
      .update(spaceReportsTable)
      .set({ status: status as any })
      .where(eq(spaceReportsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Report not found" }); return; }
    res.json({ report: updated });
  } catch (err: any) {
    req.log.error({ err }, "Failed to update space report");
    res.status(500).json({ error: "Failed to update report" });
  }
});

export default router;
