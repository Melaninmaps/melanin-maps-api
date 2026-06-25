import { Router, type IRouter, type Request, type Response } from "express";
import { db, marketplaceFeeConfigTable, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

const VALID_TIERS = ["community", "growth", "premium"] as const;
type Tier = (typeof VALID_TIERS)[number];

const TIER_LABELS: Record<Tier, string> = {
  community: "Community",
  growth: "Growth",
  premium: "Premium",
};

const DEFAULT_CONFIGS: Array<{
  tier: Tier;
  tierLabel: string;
  standardFee: string;
  promotionalFee: string;
  foundingFee: string;
}> = [
  { tier: "community", tierLabel: "Community", standardFee: "0.1000", promotionalFee: "0.0700", foundingFee: "0.0500" },
  { tier: "growth",    tierLabel: "Growth",    standardFee: "0.0800", promotionalFee: "0.0550", foundingFee: "0.0400" },
  { tier: "premium",  tierLabel: "Premium",   standardFee: "0.0600", promotionalFee: "0.0400", foundingFee: "0.0300" },
];

export interface FeeCalculation {
  fee: number;
  feePercent: string;
  source: "founding_program" | "promotional" | "standard";
  reason: string;
  tier: string;
  tierLabel: string;
  isLocked: boolean;
  lockedUntil: string | null;
  promotionEligible: boolean;
  promotionExpirationDate: string | null;
  membershipRenewalDate: string | null;
  promoDescription: string | null;
}

type BizRow = {
  foundingBusiness: boolean;
  marketplaceFeeLocked: boolean;
  lockedFee: string | null;
  lockedUntil: Date | null;
  businessStatus: string;
  promotionEligible: boolean;
  promotionExpirationDate: Date | null;
  membershipRenewalDate: Date | null;
  feeSource: string | null;
};

type ConfigRow = typeof marketplaceFeeConfigTable.$inferSelect;

function computeFee(biz: BizRow, configs: ConfigRow[]): FeeCalculation {
  const tier = (biz.businessStatus || "community") as Tier;
  const config = configs.find((c) => c.tier === tier) ?? null;

  const standardFeeVal = config ? Number(config.standardFee) : 0.10;
  const promotionalFeeVal = config ? Number(config.promotionalFee) : 0.07;

  // Priority 1: Founding business with a locked fee
  if (biz.foundingBusiness && biz.marketplaceFeeLocked && biz.lockedFee != null) {
    const fee = Number(biz.lockedFee);
    return {
      fee,
      feePercent: `${Math.round(fee * 100)}%`,
      source: "founding_program",
      reason: "Founding Business Rate — locked in at program enrollment",
      tier,
      tierLabel: TIER_LABELS[tier] ?? tier,
      isLocked: true,
      lockedUntil: biz.lockedUntil ? biz.lockedUntil.toISOString() : null,
      promotionEligible: false,
      promotionExpirationDate: null,
      membershipRenewalDate: biz.membershipRenewalDate ? biz.membershipRenewalDate.toISOString() : null,
      promoDescription: null,
    };
  }

  // Priority 2: Active promotional rate
  const now = new Date();
  const promoWindowOk =
    config?.promoActive === true &&
    (!config.promoStartDate || now >= new Date(config.promoStartDate)) &&
    (!config.promoEndDate || now <= new Date(config.promoEndDate));
  const bizPromoOk =
    biz.promotionEligible &&
    (!biz.promotionExpirationDate || now <= new Date(biz.promotionExpirationDate));

  if (promoWindowOk && bizPromoOk) {
    return {
      fee: promotionalFeeVal,
      feePercent: `${Math.round(promotionalFeeVal * 100)}%`,
      source: "promotional",
      reason: config?.promoDescription ?? "Promotional Marketplace Rate",
      tier,
      tierLabel: TIER_LABELS[tier] ?? tier,
      isLocked: false,
      lockedUntil: null,
      promotionEligible: true,
      promotionExpirationDate: biz.promotionExpirationDate ? biz.promotionExpirationDate.toISOString() : null,
      membershipRenewalDate: biz.membershipRenewalDate ? biz.membershipRenewalDate.toISOString() : null,
      promoDescription: config?.promoDescription ?? null,
    };
  }

  // Priority 3: Standard rate
  return {
    fee: standardFeeVal,
    feePercent: `${Math.round(standardFeeVal * 100)}%`,
    source: "standard",
    reason: `Standard ${TIER_LABELS[tier] ?? tier} Marketplace Rate`,
    tier,
    tierLabel: TIER_LABELS[tier] ?? tier,
    isLocked: false,
    lockedUntil: null,
    promotionEligible: biz.promotionEligible,
    promotionExpirationDate: biz.promotionExpirationDate ? biz.promotionExpirationDate.toISOString() : null,
    membershipRenewalDate: biz.membershipRenewalDate ? biz.membershipRenewalDate.toISOString() : null,
    promoDescription: null,
  };
}

async function getOrSeedConfigs(): Promise<ConfigRow[]> {
  const existing = await db.select().from(marketplaceFeeConfigTable);
  if (existing.length >= 3) return existing;

  // Seed defaults for any missing tiers
  for (const def of DEFAULT_CONFIGS) {
    const has = existing.find((e) => e.tier === def.tier);
    if (!has) {
      await db.insert(marketplaceFeeConfigTable).values(def).onConflictDoNothing();
    }
  }
  return db.select().from(marketplaceFeeConfigTable);
}

// ── GET /marketplace-fees/config ─────────────────────────────────────────────
// Admin: returns full config. Non-admin: returns summary only (no internal notes).
router.get("/marketplace-fees/config", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    const configs = await getOrSeedConfigs();
    if (isAdmin(req)) {
      res.json({ configs });
    } else {
      res.json({
        configs: configs.map((c) => ({
          tier: c.tier,
          tierLabel: c.tierLabel,
          standardFee: c.standardFee,
          promotionalFee: c.promotionalFee,
          promoActive: c.promoActive,
          promoStartDate: c.promoStartDate,
          promoEndDate: c.promoEndDate,
          promoDescription: c.promoDescription,
        })),
      });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to get marketplace fee configs");
    res.status(500).json({ error: "Failed to get marketplace fee configs" });
  }
});

// ── PUT /marketplace-fees/config/:tier ───────────────────────────────────────
// Update standard + promo settings for a tier. Admin only. Does NOT update founding fee.
router.put("/marketplace-fees/config/:tier", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const tier = String(req.params.tier);
    if (!VALID_TIERS.includes(tier as Tier)) {
      res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(", ")}` }); return;
    }
    const {
      standardFee,
      promotionalFee,
      promoActive,
      promoStartDate,
      promoEndDate,
      promoDescription,
      notes,
    } = req.body as {
      standardFee?: number;
      promotionalFee?: number;
      promoActive?: boolean;
      promoStartDate?: string | null;
      promoEndDate?: string | null;
      promoDescription?: string;
      notes?: string;
    };

    await getOrSeedConfigs();

    const patch: Partial<typeof marketplaceFeeConfigTable.$inferInsert> = {
      updatedBy: req.user?.email ?? "admin",
    };
    if (standardFee != null)    patch.standardFee    = String(standardFee);
    if (promotionalFee != null) patch.promotionalFee = String(promotionalFee);
    if (promoActive != null)    patch.promoActive    = promoActive;
    if (promoStartDate !== undefined) patch.promoStartDate = promoStartDate ? new Date(promoStartDate) : null;
    if (promoEndDate   !== undefined) patch.promoEndDate   = promoEndDate   ? new Date(promoEndDate)   : null;
    if (promoDescription != null) patch.promoDescription = promoDescription;
    if (notes != null) patch.notes = notes;

    const [updated] = await db
      .update(marketplaceFeeConfigTable)
      .set(patch)
      .where(eq(marketplaceFeeConfigTable.tier, tier))
      .returning();

    if (!updated) { res.status(404).json({ error: "Tier config not found" }); return; }
    res.json({ config: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update marketplace fee config");
    res.status(500).json({ error: "Failed to update marketplace fee config" });
  }
});

// ── PUT /marketplace-fees/config/:tier/founding ──────────────────────────────
// Update founding fee for a tier. Requires admin + SUPER_ADMIN_EMAIL env var match.
router.put("/marketplace-fees/config/:tier/founding", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }

    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
      .split(",").map((e) => e.trim()).filter(Boolean);
    const userEmail = (req as any).user?.email ?? "";
    if (superAdminEmails.length > 0 && !superAdminEmails.includes(userEmail)) {
      res.status(403).json({ error: "Founding fee changes require elevated (super-admin) permission" }); return;
    }

    const tier = String(req.params.tier);
    if (!VALID_TIERS.includes(tier as Tier)) {
      res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(", ")}` }); return;
    }
    const { foundingFee } = req.body as { foundingFee?: number };
    if (foundingFee == null || typeof foundingFee !== "number") {
      res.status(400).json({ error: "foundingFee (number) is required" }); return;
    }

    await getOrSeedConfigs();

    const [updated] = await db
      .update(marketplaceFeeConfigTable)
      .set({ foundingFee: String(foundingFee), updatedBy: userEmail })
      .where(eq(marketplaceFeeConfigTable.tier, tier))
      .returning();

    if (!updated) { res.status(404).json({ error: "Tier config not found" }); return; }
    res.json({ config: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update founding fee");
    res.status(500).json({ error: "Failed to update founding fee" });
  }
});

// ── GET /marketplace-fees/my ─────────────────────────────────────────────────
// Returns the calculated fee for the authenticated user's business.
router.get("/marketplace-fees/my", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

    const [biz] = await db
      .select({
        id: businessesTable.id,
        submittedById: businessesTable.submittedById,
        foundingBusiness: businessesTable.foundingBusiness,
        marketplaceFeeLocked: businessesTable.marketplaceFeeLocked,
        lockedFee: businessesTable.lockedFee,
        lockedUntil: businessesTable.lockedUntil,
        businessStatus: businessesTable.businessStatus,
        promotionEligible: businessesTable.promotionEligible,
        promotionExpirationDate: businessesTable.promotionExpirationDate,
        membershipRenewalDate: businessesTable.membershipRenewalDate,
        feeSource: businessesTable.feeSource,
      })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);

    if (!biz) { res.status(404).json({ error: "No business found for this account" }); return; }

    const configs = await getOrSeedConfigs();
    const calc = computeFee(biz, configs);
    res.json({ businessId: biz.id, ...calc });
  } catch (err) {
    req.log.error({ err }, "Failed to get my marketplace fee");
    res.status(500).json({ error: "Failed to get marketplace fee" });
  }
});

// ── GET /marketplace-fees/businesses/:id ────────────────────────────────────
// Returns calculated fee for a specific business (owner or admin only).
router.get("/marketplace-fees/businesses/:id", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    const id = String(req.params.id);

    const [biz] = await db
      .select({
        id: businessesTable.id,
        submittedById: businessesTable.submittedById,
        foundingBusiness: businessesTable.foundingBusiness,
        marketplaceFeeLocked: businessesTable.marketplaceFeeLocked,
        lockedFee: businessesTable.lockedFee,
        lockedUntil: businessesTable.lockedUntil,
        businessStatus: businessesTable.businessStatus,
        promotionEligible: businessesTable.promotionEligible,
        promotionExpirationDate: businessesTable.promotionExpirationDate,
        membershipRenewalDate: businessesTable.membershipRenewalDate,
        feeSource: businessesTable.feeSource,
      })
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
    if (biz.submittedById !== req.user.id && !isAdmin(req)) {
      res.status(403).json({ error: "Access denied" }); return;
    }

    const configs = await getOrSeedConfigs();
    const calc = computeFee(biz, configs);
    res.json({ businessId: biz.id, ...calc });
  } catch (err) {
    req.log.error({ err }, "Failed to get business marketplace fee");
    res.status(500).json({ error: "Failed to get marketplace fee" });
  }
});

// ── PATCH /marketplace-fees/businesses/:id/profile ──────────────────────────
// Admin: update a business's marketplace profile (fee lock, status, promo eligibility).
router.patch("/marketplace-fees/businesses/:id/profile", async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return; }
    const id = String(req.params.id);

    const {
      businessStatus,
      marketplaceFeeLocked,
      lockedFee,
      lockedUntil,
      promotionEligible,
      promotionExpirationDate,
      membershipRenewalDate,
      feeSource,
    } = req.body as {
      businessStatus?: string;
      marketplaceFeeLocked?: boolean;
      lockedFee?: number | null;
      lockedUntil?: string | null;
      promotionEligible?: boolean;
      promotionExpirationDate?: string | null;
      membershipRenewalDate?: string | null;
      feeSource?: string;
    };

    if (businessStatus != null && !VALID_TIERS.includes(businessStatus as Tier)) {
      res.status(400).json({ error: `businessStatus must be one of: ${VALID_TIERS.join(", ")}` }); return;
    }

    const patch: Partial<typeof businessesTable.$inferInsert> = { updatedAt: new Date() };
    if (businessStatus != null)     patch.businessStatus     = businessStatus;
    if (marketplaceFeeLocked != null) patch.marketplaceFeeLocked = marketplaceFeeLocked;
    if (lockedFee !== undefined)    patch.lockedFee          = lockedFee != null ? String(lockedFee) : null;
    if (lockedUntil !== undefined)  patch.lockedUntil        = lockedUntil ? new Date(lockedUntil) : null;
    if (promotionEligible != null)  patch.promotionEligible  = promotionEligible;
    if (promotionExpirationDate !== undefined) patch.promotionExpirationDate = promotionExpirationDate ? new Date(promotionExpirationDate) : null;
    if (membershipRenewalDate !== undefined)   patch.membershipRenewalDate   = membershipRenewalDate   ? new Date(membershipRenewalDate)   : null;
    if (feeSource != null)          patch.feeSource          = feeSource;

    const [updated] = await db
      .update(businessesTable)
      .set(patch)
      .where(eq(businessesTable.id, id))
      .returning({
        id: businessesTable.id,
        businessStatus: businessesTable.businessStatus,
        marketplaceFeeLocked: businessesTable.marketplaceFeeLocked,
        lockedFee: businessesTable.lockedFee,
        lockedUntil: businessesTable.lockedUntil,
        promotionEligible: businessesTable.promotionEligible,
        promotionExpirationDate: businessesTable.promotionExpirationDate,
        membershipRenewalDate: businessesTable.membershipRenewalDate,
        feeSource: businessesTable.feeSource,
      });

    if (!updated) { res.status(404).json({ error: "Business not found" }); return; }

    const configs = await getOrSeedConfigs();
    const bizForCalc: BizRow = {
      foundingBusiness: false,
      ...updated,
      marketplaceFeeLocked: updated.marketplaceFeeLocked ?? false,
      promotionEligible: updated.promotionEligible ?? true,
    };
    const calc = computeFee(bizForCalc, configs);
    res.json({ profile: updated, calculatedFee: calc });
  } catch (err) {
    req.log.error({ err }, "Failed to update business marketplace profile");
    res.status(500).json({ error: "Failed to update business marketplace profile" });
  }
});

export default router;
