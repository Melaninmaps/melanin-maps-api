import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessPromotionsTable } from "@workspace/db";
import { and, desc, eq, gt } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  return req.user.id;
}

async function getOwnedBusiness(userId: string) {
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.submittedById, userId))
    .limit(1);
  return business ?? null;
}

// ─── Tool catalogue ───────────────────────────────────────────────────────────

type PromotionToolType =
  | "priority_search"
  | "category_featured"
  | "city_featured"
  | "cultural_spotlight"
  | "event_featured";

interface ToolConfig {
  type: PromotionToolType;
  name: string;
  description: string;
  priceCents: number;
  priceDisplay: string;
  durationDays: number;
  icon: string;
  tagline: string;
}

const TOOL_CATALOGUE: ToolConfig[] = [
  {
    type: "priority_search",
    name: "Priority Search Placement",
    description:
      "Rise to the top of search results when users look for businesses like yours. Your listing ranks above organic results for relevant queries.",
    priceCents: 2900,
    priceDisplay: "$29",
    durationDays: 30,
    icon: "search",
    tagline: "30 days · Rise higher in every relevant search",
  },
  {
    type: "category_featured",
    name: "Category Feature",
    description:
      "Be the first business seen when someone browses your category. Featured position at the top of your category page.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 30,
    icon: "star",
    tagline: "30 days · Top spot in your category",
  },
  {
    type: "city_featured",
    name: "City & Neighborhood Feature",
    description:
      "Stand out to users searching in your city or neighborhood. Featured placement for location-specific searches.",
    priceCents: 7900,
    priceDisplay: "$79",
    durationDays: 30,
    icon: "map-pin",
    tagline: "30 days · Featured for local searches",
  },
  {
    type: "cultural_spotlight",
    name: "Cultural Spotlight",
    description:
      "Get elevated placement during Black cultural events, heritage months, and holidays — when community engagement is highest.",
    priceCents: 9900,
    priceDisplay: "$99",
    durationDays: 14,
    icon: "zap",
    tagline: "14 days · Premium placement during peak moments",
  },
  {
    type: "event_featured",
    name: "Featured Event Listing",
    description:
      "Promote your event to the top of the community events feed. Reach community members actively looking for what's happening.",
    priceCents: 3900,
    priceDisplay: "$39",
    durationDays: 14,
    icon: "calendar",
    tagline: "14 days · Front-row placement in the events feed",
  },
];

// ─── GET /api/businesses/mine/growth-tools ────────────────────────────────────

router.get("/businesses/mine/growth-tools", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const business = await getOwnedBusiness(userId);
    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const now = new Date();
    const activePromotions = await db
      .select()
      .from(businessPromotionsTable)
      .where(
        and(
          eq(businessPromotionsTable.businessId, business.id),
          eq(businessPromotionsTable.status, "active"),
          gt(businessPromotionsTable.endsAt, now),
        ),
      )
      .orderBy(desc(businessPromotionsTable.createdAt));

    const pendingPromotions = await db
      .select()
      .from(businessPromotionsTable)
      .where(
        and(
          eq(businessPromotionsTable.businessId, business.id),
          eq(businessPromotionsTable.status, "pending"),
        ),
      )
      .orderBy(desc(businessPromotionsTable.createdAt));

    res.json({
      business: {
        id: business.id,
        name: business.name,
        category: business.category,
        city: business.city,
      },
      activePromotions,
      pendingPromotions,
      catalogue: TOOL_CATALOGUE,
    });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/growth-tools error");
    res.status(500).json({ error: "Failed to fetch growth tools status." });
  }
});

// ─── POST /api/businesses/mine/growth-tools/checkout ─────────────────────────

router.post("/businesses/mine/growth-tools/checkout", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const business = await getOwnedBusiness(userId);
    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const {
      type,
      targetCategory,
      targetCity,
      targetNeighborhood,
      targetEvent,
    } = req.body as {
      type?: PromotionToolType;
      targetCategory?: string;
      targetCity?: string;
      targetNeighborhood?: string;
      targetEvent?: string;
    };

    const validTypes: PromotionToolType[] = [
      "priority_search",
      "category_featured",
      "city_featured",
      "cultural_spotlight",
      "event_featured",
    ];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ error: "Invalid or missing promotion type.", validTypes });
      return;
    }

    const toolConfig = TOOL_CATALOGUE.find((t) => t.type === type)!;

    const stripe = await getUncachableStripeClient();
    const domains = (process.env.REPLIT_DOMAINS ?? "localhost:80").split(",");
    const baseUrl = `https://${domains[0]}`;

    const [pendingPromotion] = await db
      .insert(businessPromotionsTable)
      .values({
        businessId: business.id,
        type,
        status: "pending",
        targetCategory: targetCategory ?? business.category,
        targetCity: targetCity ?? business.city,
        targetNeighborhood: targetNeighborhood ?? null,
        targetEvent: targetEvent ?? null,
        durationDays: toolConfig.durationDays,
        priceUsdCents: toolConfig.priceCents,
      })
      .returning();

    const price = await stripe.prices.create({
      unit_amount: toolConfig.priceCents,
      currency: "usd",
      product_data: {
        name: toolConfig.name,
        metadata: { category: "business_growth_tool", toolType: type },
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${baseUrl}/business-dashboard?growth_tool_activated=1&tool=${type}`,
      cancel_url: `${baseUrl}/business-dashboard`,
      metadata: {
        type: "business_growth_tool",
        promotionId: pendingPromotion.id,
        businessId: business.id,
        userId,
        toolType: type,
        durationDays: String(toolConfig.durationDays),
      },
    });

    await db
      .update(businessPromotionsTable)
      .set({ stripeSessionId: session.id })
      .where(eq(businessPromotionsTable.id, pendingPromotion.id));

    logger.info(
      { businessId: business.id, type, sessionId: session.id },
      "[growth-tools] checkout session created",
    );

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/mine/growth-tools/checkout error");
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

// ─── Legacy: POST /api/businesses/mine/promote ───────────────────────────────
// Kept for backward compatibility. Internally routes to priority_search.

router.post("/businesses/mine/promote", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const business = await getOwnedBusiness(userId);
    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const alreadyPromoted = business.promotedUntil && business.promotedUntil > new Date();
    if (alreadyPromoted) {
      res.json({
        alreadyPromoted: true,
        promotedUntil: business.promotedUntil,
        message: `Your listing is already promoted until ${business.promotedUntil!.toLocaleDateString()}.`,
      });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const domains = (process.env.REPLIT_DOMAINS ?? "localhost:80").split(",");
    const baseUrl = `https://${domains[0]}`;

    const [pendingPromotion] = await db
      .insert(businessPromotionsTable)
      .values({
        businessId: business.id,
        type: "priority_search",
        status: "pending",
        targetCategory: business.category,
        targetCity: business.city,
        durationDays: 30,
        priceUsdCents: 2900,
      })
      .returning();

    const price = await stripe.prices.create({
      unit_amount: 2900,
      currency: "usd",
      product_data: { name: "Priority Search Placement — 30 days" },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${baseUrl}/business-dashboard?promoted=1`,
      cancel_url: `${baseUrl}/business-dashboard`,
      metadata: {
        type: "business_growth_tool",
        promotionId: pendingPromotion.id,
        businessId: business.id,
        userId,
        toolType: "priority_search",
        durationDays: "30",
      },
    });

    await db
      .update(businessPromotionsTable)
      .set({ stripeSessionId: session.id })
      .where(eq(businessPromotionsTable.id, pendingPromotion.id));

    logger.info({ businessId: business.id, sessionId: session.id }, "[promote] legacy checkout created");
    res.json({ checkoutUrl: session.url });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/mine/promote error");
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

router.get("/businesses/mine/promote/status", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const business = await getOwnedBusiness(userId);
    if (!business) {
      res.status(404).json({ error: "No business found." });
      return;
    }

    const isActive = !!(business.promotedUntil && business.promotedUntil > new Date());
    res.json({ isPromoted: isActive, promotedUntil: business.promotedUntil ?? null });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/promote/status error");
    res.status(500).json({ error: "Failed to fetch promotion status." });
  }
});

export default router;
