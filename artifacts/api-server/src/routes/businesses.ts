import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessProfileViewsTable, userSettingsTable, usersTable, docusignEnvelopesTable, businessPromotionsTable } from "@workspace/db";
import { eq, and, or, ilike, desc, sql, gt } from "drizzle-orm";
import { sendAddressUpdateNotifications } from "../lib/pushNotifications";
import { createFoundingAgreementEnvelope } from "../lib/docusign";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

router.get("/businesses", async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    const conditions = [];

    if (category && typeof category === "string" && category !== "All") {
      conditions.push(eq(businessesTable.category, category));
    }

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(businessesTable.name, `%${search}%`),
          ilike(businessesTable.city, `%${search}%`),
          ilike(businessesTable.category, `%${search}%`),
          ilike(businessesTable.description, `%${search}%`),
        ),
      );
    }

    const businesses = await db
      .select()
      .from(businessesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(businessesTable.foundingBusiness),
        desc(businessesTable.confidenceScore),
      )
      .limit(200);

    // Annotate businesses that have active growth-tool promotions as featured.
    // Only businesses that already matched the search criteria are promoted —
    // no injecting off-topic results.
    const now = new Date();
    const activePromos = await db
      .select({ businessId: businessPromotionsTable.businessId, type: businessPromotionsTable.type })
      .from(businessPromotionsTable)
      .where(
        and(
          eq(businessPromotionsTable.status, "active"),
          gt(businessPromotionsTable.endsAt, now),
        ),
      );
    const promotedIdToType = new Map(activePromos.map((p) => [p.businessId, p.type]));

    const annotated = businesses
      .map((b) => ({
        ...b,
        featured: b.featured || promotedIdToType.has(b.id),
        promotionType: promotedIdToType.get(b.id) ?? null,
      }))
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (b.foundingBusiness !== a.foundingBusiness) return b.foundingBusiness ? 1 : -1;
        return (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
      });

    const featuredCount = annotated.filter((b) => b.featured).length;
    res.json({ businesses: annotated, total: annotated.length, featuredCount });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.get("/businesses/founding/stats", async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(businessesTable)
      .where(eq(businessesTable.foundingBusiness, true));
    const count = row?.count ?? 0;
    const spots = 500;
    res.json({ count, spots, remaining: Math.max(0, spots - count), isFull: count >= spots });
  } catch (err) {
    req.log.error({ err }, "Failed to get founding stats");
    res.status(500).json({ error: "Failed to get founding stats" });
  }
});

router.get("/businesses/mine", async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ business: null });
      return;
    }
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);
    res.json({ business: business ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.patch("/businesses/mine/profile", async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const VALID_CATEGORIES = [
    "Food & Beverage", "Shopping & Retail", "Beauty & Personal Care",
    "Health & Wellness", "Professional Services", "Home Services",
    "Automotive", "Real Estate & Housing", "Technology", "Creative Services",
    "Events & Entertainment", "Travel & Hospitality", "Family & Education",
    "Pet Services", "Community & Nonprofit",
  ];

  const { name, category, subcategory, description, phone, website, hours } = req.body as {
    name?: string; category?: string; subcategory?: string; description?: string;
    phone?: string | null; website?: string | null; hours?: string | null;
  };

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: "Invalid category" }); return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name?.trim()) updates.name = name.trim();
  if (category) { updates.category = category; updates.subcategory = subcategory?.trim() || category; }
  if (description !== undefined) updates.description = description.trim();
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (website !== undefined) updates.website = website?.trim() || null;
  if (hours !== undefined) updates.hours = hours?.trim() || null;

  try {
    const [updated] = await db
      .update(businessesTable)
      .set(updates)
      .where(eq(businessesTable.submittedById, String(userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ business: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update business profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/businesses/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const userId = (req as any).user?.id as string | undefined;
    // Fire-and-forget: skip tracking if user has opted out
    void (async () => {
      if (userId) {
        const [settings] = await db
          .select({ profileViewTrackingEnabled: userSettingsTable.profileViewTrackingEnabled })
          .from(userSettingsTable)
          .where(eq(userSettingsTable.userId, userId))
          .limit(1)
          .catch(() => []);
        if (settings?.profileViewTrackingEnabled === false) return;
      }
      db.insert(businessProfileViewsTable)
        .values({ businessId: id, userId: userId ?? null })
        .execute()
        .catch(() => {});
    })();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.post("/businesses", async (req: Request, res: Response) => {
  try {
    const {
      name, category, description, address, city, state,
      phone, website, priceRange, hours, customHours, tags, isBlackOwned,
    } = req.body as Record<string, unknown>;

    if (!name || !category || !address || !city || !state) {
      res.status(400).json({ error: "name, category, address, city, and state are required" });
      return;
    }

    const finalHours =
      hours === "Custom"
        ? (customHours as string | undefined) ?? null
        : (hours as string | undefined) ?? null;
    const tagArray =
      Array.isArray(tags)
        ? (tags as string[])
        : typeof tags === "string"
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const [business] = await db
      .insert(businessesTable)
      .values({
        id,
        name: name as string,
        category: category as string,
        subcategory: category as string,
        description: (description as string | undefined) ?? "",
        address: address as string,
        city: city as string,
        state: state as string,
        latitude: "0",
        longitude: "0",
        tags: tagArray,
        phone: (phone as string | undefined) ?? null,
        website: (website as string | undefined) ?? null,
        hours: finalHours,
        priceRange: (priceRange as string | undefined) ?? null,
        blackOwned: isBlackOwned === true || isBlackOwned === "true",
        status: "pending",
        submittedById: req.user?.id ?? null,
      })
      .returning();

    res.status(201).json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business listing");
    res.status(500).json({ error: "Failed to submit listing" });
  }
});

router.patch("/businesses/:id/status", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const id = String(req.params.id);
    const { status } = req.body as { status?: string };

    const allowed = ["active", "rejected", "pending", "suspended"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
      return;
    }

    const [existing] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const [business] = await db
      .update(businessesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update business status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.post("/businesses/:id/view", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id ?? null;
    await db.insert(businessProfileViewsTable).values({ businessId: id, userId });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to record business view");
    res.status(500).json({ error: "Failed to record view" });
  }
});

router.patch("/businesses/:id/address", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const id = String(req.params.id);
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const isOwner = existing.submittedById === req.user.id;
    if (!isOwner && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const { address, city, state, zip } = req.body as { address?: string; city?: string; state?: string; zip?: string };
    if (!address?.trim() || !city?.trim() || !state?.trim()) {
      res.status(400).json({ error: "address, city, and state are required" }); return;
    }

    const oldAddress = `${existing.address}, ${existing.city}, ${existing.state}`;
    const newAddress = `${address.trim()}, ${city.trim()}, ${state.trim()}${zip ? ` ${zip.trim()}` : ""}`;

    const [business] = await db
      .update(businessesTable)
      .set({ address: address.trim(), city: city.trim(), state: state.trim(), updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    void sendAddressUpdateNotifications(id, existing.name, oldAddress, newAddress);

    res.json({ business, notified: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update business address");
    res.status(500).json({ error: "Failed to update address" });
  }
});

router.patch("/businesses/:id/badges", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }

    const id = String(req.params.id);
    const { currentLocationSince, businessFoundedDate, trustBadges } = req.body as {
      currentLocationSince?: string | null;
      businessFoundedDate?: string | null;
      trustBadges?: string[];
    };

    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const [business] = await db
      .update(businessesTable)
      .set({
        currentLocationSince: currentLocationSince ?? null,
        businessFoundedDate: businessFoundedDate ?? null,
        trustBadges: Array.isArray(trustBadges) ? trustBadges : existing.trustBadges,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update business badges");
    res.status(500).json({ error: "Failed to update badges" });
  }
});

router.post("/businesses/:id/seller-agreement", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const id = String(req.params.id);
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const isOwner = existing.submittedById === req.user.id;
    if (!isOwner && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const acceptedAt = new Date();
    const [business] = await db
      .update(businessesTable)
      .set({ sellerAgreementAcceptedAt: acceptedAt, updatedAt: acceptedAt })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, sellerAgreementAcceptedAt: businessesTable.sellerAgreementAcceptedAt });

    res.json({ acceptedAt: business.sellerAgreementAcceptedAt });
  } catch (err) {
    req.log.error({ err }, "Failed to record seller agreement");
    res.status(500).json({ error: "Failed to record agreement" });
  }
});

router.patch("/businesses/:id/policy", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const id = String(req.params.id);
    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const isOwner = existing.submittedById === req.user.id;
    if (!isOwner && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    const { returnPolicy } = req.body as { returnPolicy?: string };

    const [business] = await db
      .update(businessesTable)
      .set({ returnPolicy: returnPolicy?.trim() ?? null, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update return policy");
    res.status(500).json({ error: "Failed to update policy" });
  }
});

router.patch("/admin/businesses/:id/founding-status", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const id = String(req.params.id);
    const { founding } = req.body as { founding?: boolean };
    if (typeof founding !== "boolean") {
      res.status(400).json({ error: "founding must be true or false" }); return;
    }

    let foundingNumber: number | null = null;
    if (founding) {
      const [maxRow] = await db
        .select({ max: sql<number>`coalesce(max(founding_number), 0)::int` })
        .from(businessesTable);
      foundingNumber = (maxRow?.max ?? 0) + 1;
    }

    const [biz] = await db
      .update(businessesTable)
      .set({
        foundingBusiness: founding,
        foundingNumber: founding ? foundingNumber : null,
        foundingGrantedAt: founding ? new Date() : null,
        marketplaceTier: founding ? "premium" : undefined,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, id))
      .returning({
        id: businessesTable.id,
        name: businessesTable.name,
        foundingBusiness: businessesTable.foundingBusiness,
        foundingNumber: businessesTable.foundingNumber,
        foundingGrantedAt: businessesTable.foundingGrantedAt,
        marketplaceTier: businessesTable.marketplaceTier,
      });

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    res.json(biz);

    // Async: send founding agreement via DocuSign when founding is granted
    if (founding && biz.foundingNumber) {
      void (async () => {
        try {
          const [fullBiz] = await db
            .select({ submittedById: businessesTable.submittedById })
            .from(businessesTable).where(eq(businessesTable.id, biz.id)).limit(1);
          if (!fullBiz?.submittedById) return;
          const [owner] = await db
            .select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
            .from(usersTable).where(eq(usersTable.id, fullBiz.submittedById)).limit(1);
          if (!owner?.email) return;
          const ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(" ") || owner.email;
          const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "";
          const returnUrl = `https://${domain}/api/docusign/signed?type=founding_agreement&businessId=${biz.id}`;
          const { envelopeId } = await createFoundingAgreementEnvelope({
            businessId: biz.id,
            businessName: biz.name,
            ownerName,
            foundingNumber: biz.foundingNumber!,
            signerEmail: owner.email,
            clientUserId: fullBiz.submittedById,
            returnUrl,
          });
          // Persist so webhook and status polling can look it up
          await db.insert(docusignEnvelopesTable).values({
            envelopeId,
            businessId: biz.id,
            userId: fullBiz.submittedById,
            type: "founding_agreement",
            status: "sent",
            signerEmail: owner.email,
            signerName: ownerName,
          }).onConflictDoNothing();
        } catch (dsErr) {
          req.log.error({ dsErr }, "DocuSign founding agreement async trigger failed — non-fatal");
        }
      })();
    }
  } catch (err) {
    req.log.error({ err }, "Failed to update founding status");
    res.status(500).json({ error: "Failed to update founding status" });
  }
});

// Flat-tier fee schedule (matches connect.ts TIER_FEES)
const FEE_SCHEDULE_DISPLAY = [
  { tier: "free",    label: "Free",    rate: 6, note: "standard listing" },
  { tier: "growth",  label: "Growth",  rate: 5, note: "growing businesses" },
  { tier: "premium", label: "Premium", rate: 3, note: "established sellers" },
];
const FOUNDING_RATE_PERCENT = 3;
const FOUNDING_WINDOW_MS = 3 * 365.25 * 24 * 60 * 60 * 1000; // 3 years
const BUSINESS_TRIAL_DAYS = 180; // 6-month business premium trial
const BUSINESS_TRIAL_MS = BUSINESS_TRIAL_DAYS * 24 * 60 * 60 * 1000;
const TIER_LABELS: Record<string, string> = { free: "Free", growth: "Growth", premium: "Premium" };
const VALID_TIERS = ["free", "growth", "premium"];

router.get("/businesses/:id/marketplace-tier", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    const id = String(req.params.id);
    const [biz] = await db
      .select({
        id: businessesTable.id,
        submittedById: businessesTable.submittedById,
        marketplaceTier: businessesTable.marketplaceTier,
        foundingBusiness: businessesTable.foundingBusiness,
        foundingGrantedAt: businessesTable.foundingGrantedAt,
        businessTrialStartedAt: businessesTable.businessTrialStartedAt,
      })
      .from(businessesTable).where(eq(businessesTable.id, id)).limit(1);
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (biz.submittedById !== req.user.id && !isAdmin(req)) { res.status(403).json({ error: "Access denied" }); return; }

    // Auto-start 180-day business premium trial if not yet started
    let trialStartedAt = biz.businessTrialStartedAt;
    if (!trialStartedAt) {
      trialStartedAt = new Date();
      await db.update(businessesTable)
        .set({ businessTrialStartedAt: trialStartedAt, updatedAt: new Date() })
        .where(eq(businessesTable.id, id));
    }
    const trialEndsAt = new Date(trialStartedAt.getTime() + BUSINESS_TRIAL_MS);
    const trialActive = Date.now() < trialEndsAt.getTime();
    const trialDaysLeft = trialActive ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

    const tier = biz.marketplaceTier ?? "free";

    // Check founding status (3-year rate lock)
    let foundingActive = false;
    let foundingExpiresAt: Date | null = null;
    let foundingPremiumUntil: Date | null = null;
    if (biz.foundingBusiness && biz.foundingGrantedAt) {
      const elapsed = Date.now() - new Date(biz.foundingGrantedAt).getTime();
      if (elapsed < FOUNDING_WINDOW_MS) {
        foundingActive = true;
        foundingExpiresAt = new Date(new Date(biz.foundingGrantedAt).getTime() + FOUNDING_WINDOW_MS);
      }
      // Founding businesses get 6 months of premium features from grant date
      const FOUNDING_PREMIUM_MS = 180 * 24 * 60 * 60 * 1000;
      foundingPremiumUntil = new Date(new Date(biz.foundingGrantedAt).getTime() + FOUNDING_PREMIUM_MS);
    }

    res.json({
      tier,
      label: TIER_LABELS[tier] ?? "Free",
      feePercent: foundingActive ? FOUNDING_RATE_PERCENT : null,
      foundingActive,
      foundingExpiresAt: foundingExpiresAt?.toISOString() ?? null,
      foundingPremiumUntil: foundingPremiumUntil?.toISOString() ?? null,
      feeSchedule: FEE_SCHEDULE_DISPLAY,
      trialActive,
      trialEndsAt: trialEndsAt.toISOString(),
      trialDaysLeft,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get marketplace tier");
    res.status(500).json({ error: "Failed to get marketplace tier" });
  }
});

router.patch("/admin/businesses/:id/marketplace-tier", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const id = String(req.params.id);
    const { tier } = req.body as { tier?: string };
    if (!tier || !VALID_TIERS.includes(tier)) {
      res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(", ")}` });
      return;
    }
    const [biz] = await db
      .update(businessesTable)
      .set({ marketplaceTier: tier, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning({ id: businessesTable.id, marketplaceTier: businessesTable.marketplaceTier });
    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    res.json({ id: biz.id, tier: biz.marketplaceTier, feeSchedule: FEE_SCHEDULE_DISPLAY });
  } catch (err) {
    req.log.error({ err }, "Failed to update marketplace tier");
    res.status(500).json({ error: "Failed to update marketplace tier" });
  }
});

export default router;
