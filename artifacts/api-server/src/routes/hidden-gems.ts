import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, hiddenGemNominationsTable } from "@workspace/db";
import { eq, sql, and, gt, isNotNull } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  return !!(user?.email && ADMIN_EMAILS.includes(user.email));
}

const router: IRouter = Router();

// ── Constants ────────────────────────────────────────────────────────────────

const AUTO_AWARD_MIN_NOMINATIONS = 10;
const AUTO_AWARD_MIN_RATING = 4.3;
const GEM_EXPIRY_DAYS = 90;

const GEM_TAGLINES = [
  "People keep telling us about this place.",
  "Locals are keeping this one close.",
  "Recommended again and again by the community.",
  "A neighborhood treasure waiting to be found.",
  "The community knows. Now you do too.",
  "Word travels fast when the experience is this good.",
  "Hidden in plain sight — and worth every visit.",
];

const REASON_LABELS: Record<string, string> = {
  amazing_service: "Amazing customer service",
  exceptional_food: "Exceptional food",
  community_impact: "Community impact",
  welcoming_atmosphere: "Welcoming atmosphere",
  unique_products: "Unique products",
  family_owned: "Family-owned",
  great_value: "Great value",
  cultural_significance: "Cultural significance",
  hidden_location: "Hidden location",
  other: "Other",
};

// Map business category → gem category label
function resolveCategoryLabel(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("coffee") || c.includes("cafe")) return "Coffee";
  if (c.includes("restaurant") || c.includes("food") || c.includes("soul") || c.includes("bbq")) return "Restaurant";
  if (c.includes("barber")) return "Barber";
  if (c.includes("salon") || c.includes("hair") || c.includes("nail") || c.includes("beauty")) return "Salon";
  if (c.includes("boutique") || c.includes("retail") || c.includes("clothing") || c.includes("apparel")) return "Boutique";
  if (c.includes("art") || c.includes("gallery") || c.includes("culture") || c.includes("museum")) return "Arts";
  if (c.includes("entertainment") || c.includes("nightlife") || c.includes("bar") || c.includes("lounge")) return "Entertainment";
  if (c.includes("wellness") || c.includes("spa") || c.includes("yoga") || c.includes("fitness")) return "Wellness";
  if (c.includes("book")) return "Bookstore";
  if (c.includes("food truck") || c.includes("truck")) return "Food Truck";
  if (c.includes("legal") || c.includes("finance") || c.includes("accounting") || c.includes("consulting")) return "Professional";
  return "Neighborhood";
}

function pickTagline(businessName: string): string {
  const idx = businessName.charCodeAt(0) % GEM_TAGLINES.length;
  return GEM_TAGLINES[idx];
}

// ── POST /hidden-gems/:businessId/nominate ───────────────────────────────────

router.post("/:businessId/nominate", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const businessId = String(req.params.businessId);
  const { reason, comment, audienceTypes } = req.body as {
    reason?: string;
    comment?: string;
    audienceTypes?: string[];
  };

  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }

  const validReasons = ["amazing_service","exceptional_food","community_impact","welcoming_atmosphere","unique_products","family_owned","great_value","cultural_significance","hidden_location","other"];
  if (!validReasons.includes(reason)) { res.status(400).json({ error: "Invalid reason" }); return; }

  try {
    // Check business exists
    const [biz] = await db
      .select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category, rating: businessesTable.rating, hiddenGemLabel: businessesTable.hiddenGemLabel, hiddenGemExpiresAt: businessesTable.hiddenGemExpiresAt, hiddenGemNominations: businessesTable.hiddenGemNominations })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

    // Check if user already nominated this business
    const [existing] = await db
      .select({ id: hiddenGemNominationsTable.id })
      .from(hiddenGemNominationsTable)
      .where(and(eq(hiddenGemNominationsTable.userId, req.user.id), eq(hiddenGemNominationsTable.businessId, businessId)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "You have already nominated this business as a Hidden Gem.", code: "ALREADY_NOMINATED" });
      return;
    }

    // Insert nomination
    await db.insert(hiddenGemNominationsTable).values({
      userId: req.user.id,
      businessId,
      reason,
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
      audienceTypes: Array.isArray(audienceTypes) ? audienceTypes.filter((a) => typeof a === "string") : null,
    });

    // Update nomination count on business
    const newNominations = (biz.hiddenGemNominations ?? 0) + 1;
    await db.update(businessesTable).set({ hiddenGemNominations: newNominations }).where(eq(businessesTable.id, businessId));

    // Check auto-award criteria
    const rating = parseFloat(String(biz.rating ?? "0"));
    const isAlreadyActive = biz.hiddenGemLabel && biz.hiddenGemExpiresAt && new Date(biz.hiddenGemExpiresAt) > new Date();
    let awarded = false;

    if (!isAlreadyActive && newNominations >= AUTO_AWARD_MIN_NOMINATIONS && rating >= AUTO_AWARD_MIN_RATING) {
      const catLabel = resolveCategoryLabel(biz.category);
      const tagline = pickTagline(biz.name);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + GEM_EXPIRY_DAYS * 86_400_000);
      await db.update(businessesTable).set({
        hiddenGemLabel: "Hidden Gem",
        hiddenGemCategory: catLabel,
        hiddenGemTagline: tagline,
        hiddenGemSince: now,
        hiddenGemExpiresAt: expiresAt,
      }).where(eq(businessesTable.id, businessId));
      awarded = true;
    }

    res.json({
      nominated: true,
      totalNominations: newNominations,
      awarded,
      reasonLabel: REASON_LABELS[reason] ?? reason,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit Hidden Gem nomination");
    res.status(500).json({ error: "Failed to submit nomination" });
  }
});

// ── GET /hidden-gems/:businessId/status ─────────────────────────────────────

router.get("/:businessId/status", async (req: Request, res: Response) => {
  const businessId = String(req.params.businessId);
  try {
    const [biz] = await db
      .select({
        hiddenGemLabel: businessesTable.hiddenGemLabel,
        hiddenGemCategory: businessesTable.hiddenGemCategory,
        hiddenGemTagline: businessesTable.hiddenGemTagline,
        hiddenGemSince: businessesTable.hiddenGemSince,
        hiddenGemExpiresAt: businessesTable.hiddenGemExpiresAt,
        hiddenGemNominations: businessesTable.hiddenGemNominations,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

    let hasNominated = false;
    if (req.user?.id) {
      const [nom] = await db
        .select({ id: hiddenGemNominationsTable.id })
        .from(hiddenGemNominationsTable)
        .where(and(eq(hiddenGemNominationsTable.userId, req.user.id), eq(hiddenGemNominationsTable.businessId, businessId)))
        .limit(1);
      hasNominated = !!nom;
    }

    const isActive = !!(biz.hiddenGemLabel && biz.hiddenGemExpiresAt && new Date(biz.hiddenGemExpiresAt) > new Date());

    res.json({
      hasNominated,
      totalNominations: biz.hiddenGemNominations ?? 0,
      isActive,
      label: isActive ? biz.hiddenGemLabel : null,
      category: isActive ? biz.hiddenGemCategory : null,
      tagline: isActive ? biz.hiddenGemTagline : null,
      since: isActive ? biz.hiddenGemSince : null,
      expiresAt: isActive ? biz.hiddenGemExpiresAt : null,
      nextThreshold: AUTO_AWARD_MIN_NOMINATIONS,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Hidden Gem status");
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// ── GET /hidden-gems (list active gems by city/category) ─────────────────────

router.get("/", async (req: Request, res: Response) => {
  const { city, state, category, limit: limitStr } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(limitStr ?? "12", 10), 50);
  try {
    const now = new Date();
    const conditions = [
      isNotNull(businessesTable.hiddenGemLabel),
      gt(businessesTable.hiddenGemExpiresAt, now),
    ];
    if (city) {
      conditions.push(sql`LOWER(${businessesTable.city}) ILIKE ${`%${city.toLowerCase()}%`}`);
    }
    if (state) {
      conditions.push(sql`LOWER(${businessesTable.state}) ILIKE ${`%${state.toLowerCase()}%`}`);
    }
    if (category) {
      conditions.push(sql`LOWER(${businessesTable.hiddenGemCategory}) = ${category.toLowerCase()}`);
    }

    const gems = await db
      .select({
        id: businessesTable.id,
        name: businessesTable.name,
        category: businessesTable.category,
        city: businessesTable.city,
        state: businessesTable.state,
        rating: businessesTable.rating,
        reviewCount: businessesTable.reviewCount,
        imageUrl: businessesTable.imageUrl,
        blackOwned: businessesTable.blackOwned,
        hiddenGemLabel: businessesTable.hiddenGemLabel,
        hiddenGemCategory: businessesTable.hiddenGemCategory,
        hiddenGemTagline: businessesTable.hiddenGemTagline,
        hiddenGemSince: businessesTable.hiddenGemSince,
        hiddenGemNominations: businessesTable.hiddenGemNominations,
        hiddenGemExpiresAt: businessesTable.hiddenGemExpiresAt,
        verified: businessesTable.verified,
        priceRange: businessesTable.priceRange,
        description: businessesTable.description,
        confidenceScore: businessesTable.confidenceScore,
      })
      .from(businessesTable)
      .where(and(...conditions))
      .orderBy(sql`${businessesTable.hiddenGemNominations} DESC`)
      .limit(limit);

    res.json({ gems });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Hidden Gems");
    res.status(500).json({ error: "Failed to fetch Hidden Gems" });
  }
});

// ── POST /hidden-gems/admin/:businessId/award (admin only) ───────────────────

router.post("/admin/:businessId/award", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }

  const businessId = String(req.params.businessId);
  const { label, category, tagline } = req.body as { label?: string; category?: string; tagline?: string };

  const validLabels = ["Hidden Gem", "Community Favorite", "Rising Star", "Neighborhood Staple", "First-Timer Pick", "Family Favorite", "Late Night Favorite"];
  if (!label || !validLabels.includes(label)) {
    res.status(400).json({ error: `label must be one of: ${validLabels.join(", ")}` }); return;
  }

  try {
    const [biz] = await db.select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category }).from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + GEM_EXPIRY_DAYS * 86_400_000);

    await db.update(businessesTable).set({
      hiddenGemLabel: label,
      hiddenGemCategory: category ?? resolveCategoryLabel(biz.category),
      hiddenGemTagline: tagline ?? pickTagline(biz.name),
      hiddenGemSince: now,
      hiddenGemExpiresAt: expiresAt,
    }).where(eq(businessesTable.id, businessId));

    res.json({ success: true, label, expiresAt });
  } catch (err) {
    req.log.error({ err }, "Failed to award Hidden Gem status");
    res.status(500).json({ error: "Failed to award status" });
  }
});

// ── POST /hidden-gems/admin/:businessId/revoke (admin only) ─────────────────

router.post("/admin/:businessId/revoke", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }
  const businessId = String(req.params.businessId);
  try {
    await db.update(businessesTable).set({
      hiddenGemLabel: null,
      hiddenGemCategory: null,
      hiddenGemTagline: null,
      hiddenGemSince: null,
      hiddenGemExpiresAt: null,
    }).where(eq(businessesTable.id, businessId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to revoke Hidden Gem status");
    res.status(500).json({ error: "Failed to revoke status" });
  }
});

export default router;
