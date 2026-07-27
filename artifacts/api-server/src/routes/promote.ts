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

export type PromotionToolType =
  | "priority_search"
  | "category_featured"
  | "city_featured"
  | "cultural_spotlight"
  | "event_featured"
  | "grand_opening"
  | "new_location"
  | "anniversary"
  | "product_launch"
  | "hiring"
  | "seasonal_sale"
  | "event_promo"
  | "community_event"
  | "local_cause"
  | "giveaway"
  | "launch_package"
  | "community_spotlight";

export interface ToolConfig {
  type: PromotionToolType;
  category: "announce" | "updates" | "events" | "visibility" | "special";
  name: string;
  description: string;
  priceCents: number;
  priceDisplay: string;
  durationDays: number;
  icon: string;
  tagline: string;
  searchLabel: string;
  highlight?: boolean;
  applicationOnly?: boolean;
}

export const TOOL_CATALOGUE: ToolConfig[] = [
  // ── Announce a Moment ────────────────────────────────────────────────────────
  {
    type: "grand_opening",
    category: "announce",
    name: "Grand Opening",
    description:
      "Celebrate your launch with 30 days of featured placement, a Grand Opening badge on your profile, and a push notification to nearby community members.",
    priceCents: 9900,
    priceDisplay: "$99",
    durationDays: 30,
    icon: "star",
    tagline: "30 days · Badge + featured placement + push notification",
    searchLabel: "Grand Opening",
    highlight: true,
  },
  {
    type: "new_location",
    category: "announce",
    name: "New Location",
    description:
      "Announce your expansion with featured placement in your new city or neighborhood and a New Location badge that builds immediate awareness.",
    priceCents: 7900,
    priceDisplay: "$79",
    durationDays: 30,
    icon: "map-pin",
    tagline: "30 days · New Location badge + city featured placement",
    searchLabel: "New Location",
  },
  {
    type: "anniversary",
    category: "announce",
    name: "Milestone Anniversary",
    description:
      "Celebrate a business anniversary or milestone with featured placement and a badge that signals longevity and community trust.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 14,
    icon: "award",
    tagline: "14 days · Anniversary badge + featured placement",
    searchLabel: "Anniversary",
  },

  // ── Business Updates ─────────────────────────────────────────────────────────
  {
    type: "product_launch",
    category: "updates",
    name: "New Product or Service",
    description:
      "Announce a new menu item, product, or service to your existing customers and new ones browsing your category.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 14,
    icon: "package",
    tagline: "14 days · New offering badge + category visibility",
    searchLabel: "New",
  },
  {
    type: "hiring",
    category: "updates",
    name: "We're Hiring",
    description:
      "Reach community members looking for work. Your listing gets a Hiring badge and appears in job-related searches — connecting you to motivated local talent.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 30,
    icon: "users",
    tagline: "30 days · Hiring badge + job search placement",
    searchLabel: "Hiring",
  },
  {
    type: "seasonal_sale",
    category: "updates",
    name: "Seasonal Sale or Event",
    description:
      "Drive traffic during a sale, holiday, or limited-time offer. Featured placement during the promotion window so buyers find you first.",
    priceCents: 3900,
    priceDisplay: "$39",
    durationDays: 14,
    icon: "tag",
    tagline: "14 days · Sale badge + featured placement",
    searchLabel: "Sale",
  },

  // ── Events & Community ───────────────────────────────────────────────────────
  {
    type: "event_promo",
    category: "events",
    name: "Promote an Event",
    description:
      "Get your event in front of the community events feed. Featured positioning helps you fill seats with community members who are actively looking for things to do.",
    priceCents: 3900,
    priceDisplay: "$39",
    durationDays: 14,
    icon: "calendar",
    tagline: "14 days · Front-row placement in the events feed",
    searchLabel: "Event",
  },
  {
    type: "community_event",
    category: "events",
    name: "Sponsor a Community Event",
    description:
      "Put your business behind a community event — sponsored placement in the events section, sponsor badge on your profile, and visibility in community feeds.",
    priceCents: 9900,
    priceDisplay: "$99",
    durationDays: 30,
    icon: "heart",
    tagline: "30 days · Sponsor badge + event spotlight",
    searchLabel: "Community Sponsor",
  },
  {
    type: "local_cause",
    category: "events",
    name: "Support a Local Cause",
    description:
      "Show your commitment to the community by linking your business to a nonprofit, scholarship, or cause. Builds lasting trust and earns a Community Partner badge.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 30,
    icon: "gift",
    tagline: "30 days · Community Partner badge",
    searchLabel: "Community Partner",
  },
  {
    type: "giveaway",
    category: "events",
    name: "Giveaway or Contest",
    description:
      "Run a community giveaway and get featured placement in the community feed, attracting new followers and turning participants into customers.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 30,
    icon: "gift",
    tagline: "30 days · Giveaway badge + community feed featured",
    searchLabel: "Giveaway",
  },

  // ── Visibility Boosts ────────────────────────────────────────────────────────
  {
    type: "priority_search",
    category: "visibility",
    name: "Priority Search Placement",
    description:
      "Rise to the top of search results when users look for businesses like yours. Your listing ranks above organic results for relevant queries.",
    priceCents: 2900,
    priceDisplay: "$29",
    durationDays: 30,
    icon: "search",
    tagline: "30 days · Rise higher in every relevant search",
    searchLabel: "Sponsored",
  },
  {
    type: "category_featured",
    category: "visibility",
    name: "Category Feature",
    description:
      "Be the first business seen when someone browses your category. Featured position at the top of your category page.",
    priceCents: 4900,
    priceDisplay: "$49",
    durationDays: 30,
    icon: "star",
    tagline: "30 days · Top spot in your category",
    searchLabel: "Sponsored",
  },
  {
    type: "city_featured",
    category: "visibility",
    name: "City & Neighborhood Feature",
    description:
      "Stand out to users searching in your city or neighborhood. Featured placement for location-specific searches.",
    priceCents: 7900,
    priceDisplay: "$79",
    durationDays: 30,
    icon: "map-pin",
    tagline: "30 days · Featured for local searches",
    searchLabel: "Sponsored",
  },
  {
    type: "cultural_spotlight",
    category: "visibility",
    name: "Cultural Spotlight",
    description:
      "Get elevated placement during cultural events, heritage months, and holidays — when community engagement is highest.",
    priceCents: 9900,
    priceDisplay: "$99",
    durationDays: 14,
    icon: "zap",
    tagline: "14 days · Premium placement during peak moments",
    searchLabel: "Featured",
  },
  {
    type: "event_featured",
    category: "visibility",
    name: "Featured Event Listing",
    description:
      "Promote your event to the top of the community events feed. Reach community members actively looking for what's happening.",
    priceCents: 3900,
    priceDisplay: "$39",
    durationDays: 14,
    icon: "calendar",
    tagline: "14 days · Front-row placement in the events feed",
    searchLabel: "Featured",
  },

  // ── Special ──────────────────────────────────────────────────────────────────
  {
    type: "launch_package",
    category: "special",
    name: "New Business Launch Package",
    description:
      "Everything a new business needs to launch with momentum: 30 days of featured placement, Grand Opening badge, push notification to nearby members, featured in the New Businesses section, and a social media feature.",
    priceCents: 9900,
    priceDisplay: "$99",
    durationDays: 30,
    icon: "zap",
    tagline: "30 days · Everything above, bundled for launch",
    searchLabel: "Grand Opening",
    highlight: true,
  },
  {
    type: "community_spotlight",
    category: "special",
    name: "Community Spotlight",
    description:
      "An editorial feature written by our team — your story, your journey, and what makes your business a community landmark. Application-based and free. Selected businesses are featured in-app and across our social channels.",
    priceCents: 0,
    priceDisplay: "Free",
    durationDays: 30,
    icon: "mic",
    tagline: "Application-based · Editorial feature",
    searchLabel: "Community Story",
    applicationOnly: true,
  },
];

// ─── Eligibility check ────────────────────────────────────────────────────────

interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
}

function checkEligibility(business: {
  status: string;
  flagStatus?: string | null;
  verified?: boolean;
}): EligibilityResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (business.status === "suspended") {
    reasons.push("Your listing is currently suspended.");
  }
  if (business.flagStatus === "confirmed_fake") {
    reasons.push("Your listing has been flagged for review.");
  }
  if (business.flagStatus === "under_review") {
    warnings.push("Your listing is under review — some promotion types may be restricted until review is complete.");
  }
  if (!business.verified) {
    warnings.push("Verify your business to unlock all promotion types and earn community trust.");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    warnings,
  };
}

// ─── GET /api/businesses/mine/growth-center/eligibility ──────────────────────

router.get("/businesses/mine/growth-center/eligibility", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const business = await getOwnedBusiness(userId);
    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const eligibility = checkEligibility(business);
    res.json({
      ...eligibility,
      business: {
        id: business.id,
        name: business.name,
        verified: business.verified,
        status: business.status,
        flagStatus: business.flagStatus ?? "none",
      },
    });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/growth-center/eligibility error");
    res.status(500).json({ error: "Failed to fetch eligibility." });
  }
});

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

    const eligibility = checkEligibility(business);

    res.json({
      business: {
        id: business.id,
        name: business.name,
        category: business.category,
        city: business.city,
        verified: business.verified,
      },
      eligibility,
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

    const eligibility = checkEligibility(business);
    if (!eligibility.eligible) {
      res.status(403).json({ error: eligibility.reasons[0] ?? "Your business is not eligible for promotions." });
      return;
    }

    const {
      type,
      targetCategory,
      targetCity,
      targetNeighborhood,
      targetEvent,
      campaignNote,
    } = req.body as {
      type?: PromotionToolType;
      targetCategory?: string;
      targetCity?: string;
      targetNeighborhood?: string;
      targetEvent?: string;
      campaignNote?: string;
    };

    const validTypes: PromotionToolType[] = TOOL_CATALOGUE.map((t) => t.type);
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ error: "Invalid or missing promotion type.", validTypes });
      return;
    }

    const toolConfig = TOOL_CATALOGUE.find((t) => t.type === type)!;

    if (toolConfig.applicationOnly) {
      res.status(400).json({ error: "This promotion type is application-based. Please contact support@mappingwithmelanin.com." });
      return;
    }

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
        campaignLabel: toolConfig.searchLabel,
        campaignNote: campaignNote ?? null,
        durationDays: toolConfig.durationDays,
        priceUsdCents: toolConfig.priceCents,
      })
      .returning();

    const price = await stripe.prices.create({
      unit_amount: toolConfig.priceCents,
      currency: "usd",
      product_data: {
        name: `${toolConfig.name} — ${business.name}`,
        metadata: { category: "business_growth_tool", toolType: type },
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${baseUrl}/business-dashboard?growth_tool_activated=1&tool=${type}`,
      cancel_url: `${baseUrl}/business-growth-center`,
      customer_email: req.user?.email ?? undefined,
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

// ─── POST /api/businesses/mine/growth-center/spotlight ───────────────────────
// Free application for the Community Spotlight editorial feature.

router.post("/businesses/mine/growth-center/spotlight", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const business = await getOwnedBusiness(userId);
    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const { note } = req.body as { note?: string };

    await db
      .insert(businessPromotionsTable)
      .values({
        businessId: business.id,
        type: "community_spotlight",
        status: "pending",
        targetCategory: business.category,
        targetCity: business.city,
        campaignLabel: "Community Story",
        campaignNote: note ?? null,
        priceUsdCents: 0,
        durationDays: 30,
      });

    logger.info({ businessId: business.id }, "[growth-tools] spotlight application submitted");
    res.json({ success: true, message: "Your Community Spotlight application has been submitted. We'll review it within 5 business days." });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/mine/growth-center/spotlight error");
    res.status(500).json({ error: "Failed to submit spotlight application." });
  }
});

// ─── Legacy: POST /api/businesses/mine/promote ───────────────────────────────
// Kept for backward compatibility.

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
        campaignLabel: "Sponsored",
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
