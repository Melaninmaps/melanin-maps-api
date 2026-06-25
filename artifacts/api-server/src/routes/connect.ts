import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessListingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

/**
 * Founding Member Advantage — tiered marketplace fee based on business plan:
 *   free    → 6%  (default)
 *   growth  → 5%
 *   premium → 3%
 *
 * totalCents — full transaction total (unit price × quantity) in cents
 * tier       — marketplaceTier from the businesses table
 * returns the fee amount in cents, rounded to the nearest cent
 */
export const MARKETPLACE_FEE_RATES: Record<string, number> = {
  free: 0.06,
  growth: 0.05,
  premium: 0.03,
};

function platformFee(totalCents: number, tier: string): number {
  const rate = MARKETPLACE_FEE_RATES[tier] ?? MARKETPLACE_FEE_RATES.free;
  return Math.round(totalCents * rate);
}

async function requireBusinessOwner(req: Request, res: Response, businessId: string): Promise<typeof businessesTable.$inferSelect | null> {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  const [biz] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId)).limit(1);
  if (!biz) {
    res.status(404).json({ error: "Business not found" });
    return null;
  }
  const isAdmin = (req.user as any).role === "admin";
  if (biz.submittedById !== req.user.id && !isAdmin) {
    res.status(403).json({ error: "You do not own this business" });
    return null;
  }
  return biz;
}

router.post("/connect/onboard", async (req: Request, res: Response) => {
  const { businessId, returnUrl } = req.body as { businessId?: string; returnUrl?: string };
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }

  const biz = await requireBusinessOwner(req, res, businessId);
  if (!biz) return;

  try {
    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const finalReturn = returnUrl ?? `${baseUrl}/api/connect/callback`;

    let accountId = biz.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { businessId, businessName: biz.name },
      });
      accountId = account.id;
      await db.update(businessesTable).set({ stripeConnectAccountId: accountId }).where(eq(businessesTable.id, businessId));
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/connect/onboard-refresh?businessId=${businessId}`,
      return_url: finalReturn,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url, accountId });
  } catch (err) {
    req.log.error({ err }, "Failed to create Connect onboarding link");
    res.status(500).json({ error: "Failed to start onboarding" });
  }
});

router.get("/connect/status/:businessId", async (req: Request, res: Response) => {
  const businessId = String(req.params.businessId);
  const [biz] = await db
    .select({ stripeConnectAccountId: businessesTable.stripeConnectAccountId })
    .from(businessesTable)
    .where(eq(businessesTable.id, businessId))
    .limit(1);

  if (!biz) { res.status(404).json({ error: "Business not found" }); return; }
  if (!biz.stripeConnectAccountId) {
    res.json({ connected: false, onboarded: false });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const account = await stripe.accounts.retrieve(biz.stripeConnectAccountId);
    res.json({
      connected: true,
      onboarded: account.details_submitted && !account.requirements?.currently_due?.length,
      accountId: biz.stripeConnectAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to retrieve Connect account");
    res.json({ connected: true, onboarded: false, accountId: biz.stripeConnectAccountId });
  }
});

router.get("/connect/onboard-refresh", async (req: Request, res: Response) => {
  const { businessId } = req.query as { businessId?: string };
  if (!businessId) { res.status(400).send("Missing businessId"); return; }
  res.redirect(`mappingwithmelanin://connect/onboard-refresh?businessId=${businessId}`);
});

const VALID_LISTING_TYPES = ["physical", "digital", "event_ticket", "gift_card", "service"] as const;
type ListingType = typeof VALID_LISTING_TYPES[number];

router.post("/connect/listings", async (req: Request, res: Response) => {
  const { businessId, name, description, priceInCents, imageUrl, category, listingType } =
    req.body as { businessId?: string; name?: string; description?: string; priceInCents?: number; imageUrl?: string; category?: string; listingType?: string };

  if (!businessId || !name || !priceInCents) {
    res.status(400).json({ error: "businessId, name, and priceInCents are required" });
    return;
  }
  if (!listingType || !VALID_LISTING_TYPES.includes(listingType as ListingType)) {
    res.status(400).json({ error: "listingType is required. Valid values: physical, digital, event_ticket, gift_card, service" });
    return;
  }

  const biz = await requireBusinessOwner(req, res, businessId);
  if (!biz) return;

  if (!biz.stripeConnectAccountId) {
    res.status(402).json({ error: "Business must complete Stripe onboarding before creating listings", code: "NOT_ONBOARDED" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    const product = await stripe.products.create(
      {
        name,
        description: description ?? undefined,
        images: imageUrl ? [imageUrl] : undefined,
        metadata: { businessId, businessName: biz.name, category: category ?? "", listingType: listingType ?? "" },
      },
      { stripeAccount: biz.stripeConnectAccountId },
    );

    const price = await stripe.prices.create(
      { product: product.id, unit_amount: priceInCents, currency: "usd" },
      { stripeAccount: biz.stripeConnectAccountId },
    );

    const [listing] = await db
      .insert(businessListingsTable)
      .values({
        businessId,
        stripeProductId: product.id,
        stripePriceId: price.id,
        name,
        description: description ?? null,
        priceInCents,
        currency: "usd",
        imageUrl: imageUrl ?? null,
        category: category ?? null,
        listingType: (listingType as ListingType) ?? null,
        active: true,
      })
      .returning();

    res.status(201).json({ listing });
  } catch (err) {
    req.log.error({ err }, "Failed to create listing");
    res.status(500).json({ error: "Failed to create listing" });
  }
});

router.get("/businesses/:id/listings", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const listings = await db
      .select()
      .from(businessListingsTable)
      .where(and(eq(businessListingsTable.businessId, id), eq(businessListingsTable.active, true)));
    res.json({ listings });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch listings");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

router.get("/connect/listings", async (req: Request, res: Response) => {
  const { businessId } = req.query as { businessId?: string };
  if (!businessId) { res.status(400).json({ error: "businessId required" }); return; }
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const biz = await requireBusinessOwner(req, res, businessId);
  if (!biz) return;

  try {
    const listings = await db.select().from(businessListingsTable).where(eq(businessListingsTable.businessId, businessId));
    res.json({ listings });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch listings");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

router.patch("/connect/listings/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [existing] = await db.select().from(businessListingsTable).where(eq(businessListingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }

  const biz = await requireBusinessOwner(req, res, existing.businessId);
  if (!biz) return;

  const { name, description, priceInCents, imageUrl, category, active, listingType } =
    req.body as { name?: string; description?: string; priceInCents?: number; imageUrl?: string; category?: string; active?: boolean; listingType?: string };

  try {
    const stripe = await getUncachableStripeClient();

    if ((name || description !== undefined || imageUrl !== undefined) && existing.stripeProductId && biz.stripeConnectAccountId) {
      await stripe.products.update(
        existing.stripeProductId,
        {
          name: name ?? existing.name,
          description: description ?? existing.description ?? undefined,
          images: imageUrl ? [imageUrl] : undefined,
        },
        { stripeAccount: biz.stripeConnectAccountId },
      );
    }

    let newPriceId = existing.stripePriceId;
    if (priceInCents && priceInCents !== existing.priceInCents && existing.stripeProductId && biz.stripeConnectAccountId) {
      const newPrice = await stripe.prices.create(
        { product: existing.stripeProductId, unit_amount: priceInCents, currency: "usd" },
        { stripeAccount: biz.stripeConnectAccountId },
      );
      newPriceId = newPrice.id;
      if (existing.stripePriceId) {
        await stripe.prices.update(existing.stripePriceId, { active: false }, { stripeAccount: biz.stripeConnectAccountId });
      }
    }

    const updates: Partial<typeof businessListingsTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (priceInCents !== undefined) updates.priceInCents = priceInCents;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (category !== undefined) updates.category = category;
    if (active !== undefined) updates.active = active;
    if (listingType !== undefined && VALID_LISTING_TYPES.includes(listingType as ListingType)) updates.listingType = listingType as ListingType;
    if (newPriceId !== existing.stripePriceId) updates.stripePriceId = newPriceId ?? undefined;

    const [updated] = await db.update(businessListingsTable).set(updates).where(eq(businessListingsTable.id, id)).returning();
    res.json({ listing: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update listing");
    res.status(500).json({ error: "Failed to update listing" });
  }
});

router.delete("/connect/listings/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [existing] = await db.select().from(businessListingsTable).where(eq(businessListingsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Listing not found" }); return; }

  const biz = await requireBusinessOwner(req, res, existing.businessId);
  if (!biz) return;

  try {
    const stripe = await getUncachableStripeClient();
    if (existing.stripeProductId && biz.stripeConnectAccountId) {
      await stripe.products.update(existing.stripeProductId, { active: false }, { stripeAccount: biz.stripeConnectAccountId });
    }
    await db.update(businessListingsTable).set({ active: false }).where(eq(businessListingsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete listing");
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

router.post("/connect/listings/:id/checkout", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { quantity = 1, successUrl, cancelUrl } = req.body as { quantity?: number; successUrl?: string; cancelUrl?: string };

  const [listing] = await db.select().from(businessListingsTable).where(eq(businessListingsTable.id, id)).limit(1);
  if (!listing || !listing.active) { res.status(404).json({ error: "Listing not found" }); return; }
  if (!listing.stripePriceId) { res.status(400).json({ error: "Listing has no price configured" }); return; }

  const [biz] = await db
    .select({
      stripeConnectAccountId: businessesTable.stripeConnectAccountId,
      name: businessesTable.name,
      marketplaceTier: businessesTable.marketplaceTier,
    })
    .from(businessesTable)
    .where(eq(businessesTable.id, listing.businessId))
    .limit(1);

  if (!biz?.stripeConnectAccountId) {
    res.status(400).json({ error: "Business is not set up to receive payments" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const applicationFeeAmount = platformFee(listing.priceInCents * quantity, biz.marketplaceTier ?? "free");

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price: listing.stripePriceId, quantity }],
        payment_intent_data: { application_fee_amount: applicationFeeAmount },
        success_url: successUrl ?? `${baseUrl}/checkout/success`,
        cancel_url: cancelUrl ?? `${baseUrl}/checkout/cancel`,
        metadata: { listingId: id, businessId: listing.businessId },
      },
      { stripeAccount: biz.stripeConnectAccountId },
    );

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
