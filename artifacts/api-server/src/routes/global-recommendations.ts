import { Router, type IRouter, type Request, type Response } from "express";
import { db, globalRecommendationsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_TYPES = [
  "restaurant", "hotel", "cafe", "guide", "market", "salon",
  "attraction", "healthcare", "transportation", "other",
];

function isAdmin(req: Request): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!(req.user?.email && adminEmails.includes(req.user.email.toLowerCase()));
}

function computeBadge(count: number): string {
  if (count >= 10) return "global_guide";
  if (count >= 5) return "community_ambassador";
  return "local_insider";
}

router.post("/global-recommendations", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { country, city, businessName, website, socialMedia, type, reason, personalConnection, communities } = req.body as {
    country?: string; city?: string; businessName?: string; website?: string;
    socialMedia?: string; type?: string; reason?: string;
    personalConnection?: string; communities?: string[];
  };

  if (!country?.trim()) { res.status(400).json({ error: "Country is required" }); return; }
  if (!businessName?.trim()) { res.status(400).json({ error: "Business name is required" }); return; }
  if (type && !ALLOWED_TYPES.includes(type)) { res.status(400).json({ error: "Invalid recommendation type" }); return; }

  try {
    const [row] = await db.insert(globalRecommendationsTable).values({
      userId: req.user.id,
      country: country.trim(),
      city: city?.trim() ?? null,
      businessName: businessName.trim(),
      website: website?.trim() ?? null,
      socialMedia: socialMedia?.trim() ?? null,
      type: type ?? "other",
      reason: reason?.trim() ?? null,
      personalConnection: personalConnection?.trim() ?? null,
      communities: Array.isArray(communities) ? communities : [],
      status: "pending",
    }).returning();

    const allApproved = await db.select({ id: globalRecommendationsTable.id })
      .from(globalRecommendationsTable)
      .where(and(eq(globalRecommendationsTable.userId, req.user.id), eq(globalRecommendationsTable.status, "approved")));
    const badge = computeBadge(allApproved.length + 1);

    res.status(201).json({ recommendation: row, badge, message: "Thank you! Your recommendation is under review." });
  } catch (err) {
    req.log.error({ err }, "Failed to create global recommendation");
    res.status(500).json({ error: "Failed to submit recommendation" });
  }
});

router.get("/global-recommendations", async (req: Request, res: Response) => {
  const { country, limit } = req.query as { country?: string; limit?: string };
  const take = Math.min(parseInt(limit ?? "50", 10), 100);

  try {
    const whereClause = country
      ? and(eq(globalRecommendationsTable.status, "approved"), eq(globalRecommendationsTable.country, country))
      : eq(globalRecommendationsTable.status, "approved");

    const rows = await db
      .select({
        id: globalRecommendationsTable.id,
        country: globalRecommendationsTable.country,
        city: globalRecommendationsTable.city,
        businessName: globalRecommendationsTable.businessName,
        website: globalRecommendationsTable.website,
        socialMedia: globalRecommendationsTable.socialMedia,
        type: globalRecommendationsTable.type,
        reason: globalRecommendationsTable.reason,
        personalConnection: globalRecommendationsTable.personalConnection,
        communities: globalRecommendationsTable.communities,
        badge: globalRecommendationsTable.badge,
        createdAt: globalRecommendationsTable.createdAt,
        contributorFirstName: usersTable.firstName,
        contributorHomeCity: usersTable.homeCity,
      })
      .from(globalRecommendationsTable)
      .leftJoin(usersTable, eq(globalRecommendationsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(globalRecommendationsTable.createdAt))
      .limit(take);

    res.json({ recommendations: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch global recommendations");
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

router.get("/global-recommendations/mine", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const rows = await db
      .select()
      .from(globalRecommendationsTable)
      .where(eq(globalRecommendationsTable.userId, req.user.id))
      .orderBy(desc(globalRecommendationsTable.createdAt));

    const approvedCount = rows.filter((r) => r.status === "approved").length;
    const badge = approvedCount > 0 ? computeBadge(approvedCount) : null;

    res.json({ recommendations: rows, badge, approvedCount });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user global recommendations");
    res.status(500).json({ error: "Failed to fetch your recommendations" });
  }
});

router.patch("/global-recommendations/:id/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin only" }); return; }

  const { status, badge } = req.body as { status?: string; badge?: string };
  if (!status || !["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ error: "status must be approved, rejected, or pending" });
    return;
  }

  try {
    const [updated] = await db
      .update(globalRecommendationsTable)
      .set({ status, badge: badge ?? null, updatedAt: new Date() })
      .where(eq(globalRecommendationsTable.id, String(req.params.id)))
      .returning();

    if (!updated) { res.status(404).json({ error: "Recommendation not found" }); return; }
    res.json({ recommendation: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update recommendation status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.get("/global-recommendations/pending", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin only" }); return; }

  try {
    const rows = await db
      .select({
        id: globalRecommendationsTable.id,
        country: globalRecommendationsTable.country,
        city: globalRecommendationsTable.city,
        businessName: globalRecommendationsTable.businessName,
        website: globalRecommendationsTable.website,
        type: globalRecommendationsTable.type,
        reason: globalRecommendationsTable.reason,
        communities: globalRecommendationsTable.communities,
        status: globalRecommendationsTable.status,
        createdAt: globalRecommendationsTable.createdAt,
        contributorFirstName: usersTable.firstName,
        contributorEmail: usersTable.email,
      })
      .from(globalRecommendationsTable)
      .leftJoin(usersTable, eq(globalRecommendationsTable.userId, usersTable.id))
      .where(eq(globalRecommendationsTable.status, "pending"))
      .orderBy(desc(globalRecommendationsTable.createdAt));

    res.json({ recommendations: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pending recommendations");
    res.status(500).json({ error: "Failed to fetch pending recommendations" });
  }
});

export default router;
