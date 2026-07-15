import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import Stripe from "stripe";
import {
  TIER_LIMITS,
  getAiUsage,
  getFamilyCircleId,
  getFamilyMemberCount,
  getTierFromMemberType,
  formatLimit,
  formatCents,
} from "../constants/membershipTiers";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

const TIER_DISPLAY: Record<string, { name: string; monthlyPrice: number; annualPrice: number; color: string }> = {
  free: { name: "Explorer", monthlyPrice: 0, annualPrice: 0, color: "#A87A40" },
  navigator: { name: "Navigator", monthlyPrice: 7.99, annualPrice: 79.9, color: "#CA922B" },
  trailblazer: { name: "Trailblazer", monthlyPrice: 19.99, annualPrice: 199.9, color: "#1A6B4A" },
  community_builder: { name: "Community Builder", monthlyPrice: 29.99, annualPrice: 299.9, color: "#1A3B8B" },
  legacy_member: { name: "Legacy Member", monthlyPrice: 79.99, annualPrice: 799.9, color: "#6B1A8B" },
};

// ── GET /membership/plan ────────────────────────────────────────────────────
// Returns current plan details with all limits, AI usage, and family members.
router.get("/membership/plan", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;

    // Get user info
    const userRow = await pool.query(
      `SELECT member_type, stripe_subscription_id, trial_ends_at FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = userRow.rows[0] as { member_type: string | null; stripe_subscription_id: string | null; trial_ends_at: Date | null } | undefined;

    const tier = getTierFromMemberType(user?.member_type);
    const limits = TIER_LIMITS[tier];
    const display = TIER_DISPLAY[tier] ?? TIER_DISPLAY.free;

    // AI usage
    const aiUsage = await getAiUsage(userId, tier);

    // Family members
    const circleId = await getFamilyCircleId(userId);
    const familyMemberCount = await getFamilyMemberCount(userId);

    // Family circle info
    const circleRow = await pool.query(
      `SELECT fc.id, fc.name FROM family_circles fc WHERE fc.owner_id = $1 LIMIT 1`,
      [userId]
    );
    const circle = circleRow.rows[0] as { id: string; name: string } | undefined;

    const membersRow = circle
      ? await pool.query(
          `SELECT fcm.id, fcm.user_id, fcm.role, fcm.status, fcm.invite_email,
                  u.first_name, u.last_name, u.profile_image_url
           FROM family_circle_members fcm
           LEFT JOIN users u ON u.id = fcm.user_id
           WHERE fcm.circle_id = $1 AND fcm.role != 'owner'
           ORDER BY fcm.created_at ASC`,
          [circle.id]
        )
      : { rows: [] };

    // Add-on seats purchased
    const addOnRow = await pool.query(
      `SELECT COALESCE(SUM(seats), 0)::int AS total
       FROM family_add_on_seats WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const addOnSeats = (addOnRow.rows[0]?.total as number) ?? 0;

    const totalFamilyCapacity = limits.familySeatsIncluded + addOnSeats;

    res.json({
      tier,
      tierDisplay: display.name,
      monthlyPrice: display.monthlyPrice,
      annualPrice: display.annualPrice,
      color: display.color,
      limits: {
        aiPoolMonthly: limits.aiPoolMonthly,
        aiPoolDisplay: formatLimit(limits.aiPoolMonthly, "requests/mo"),
        savedPlaces: limits.savedPlaces,
        savedPlacesDisplay: formatLimit(limits.savedPlaces),
        savedTopicsMax: limits.savedTopicsMax,
        savedTopicsDisplay: formatLimit(limits.savedTopicsMax),
        familySeatsIncluded: limits.familySeatsIncluded,
        addOnSeatPriceCents: limits.addOnSeatPriceCents,
        addOnSeatPriceDisplay: limits.addOnSeatPriceCents > 0 ? formatCents(limits.addOnSeatPriceCents) + "/mo" : "N/A",
        circlesCreate: limits.circlesCreate,
        circlesCreateDisplay: formatLimit(limits.circlesCreate),
        lifeJourneys: limits.lifeJourneys,
        lifeJourneysDisplay: formatLimit(limits.lifeJourneys),
        showLoveNominationsMonthly: limits.showLoveNominationsMonthly,
        showLoveDisplay: formatLimit(limits.showLoveNominationsMonthly, "/mo"),
        digestFrequencies: limits.digestFrequencies,
        familyMemberAccess: limits.familyMemberAccess,
      },
      aiUsage: {
        used: aiUsage.used,
        limit: aiUsage.limit,
        available: aiUsage.limit === -1 ? -1 : Math.max(0, aiUsage.limit - aiUsage.used),
        percentUsed: aiUsage.limit > 0 ? Math.round((aiUsage.used / aiUsage.limit) * 100) : 0,
        yearMonth: aiUsage.yearMonth,
        circleId,
      },
      family: {
        circleId: circle?.id ?? null,
        circleName: circle?.name ?? null,
        totalCapacity: totalFamilyCapacity,
        seatsUsed: familyMemberCount,
        seatsAvailable: Math.max(0, totalFamilyCapacity - familyMemberCount),
        addOnSeats,
        members: membersRow.rows,
      },
    });
  } catch (err) {
    req.log.error({ err }, "GET /membership/plan error");
    res.status(500).json({ error: "Failed to load membership plan" });
  }
});

// ── GET /membership/family/ai-usage ─────────────────────────────────────────
router.get("/membership/family/ai-usage", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const userRow = await pool.query(
      `SELECT member_type FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const tier = getTierFromMemberType((userRow.rows[0] as { member_type: string | null } | undefined)?.member_type);
    const usage = await getAiUsage(userId, tier);

    res.json({
      used: usage.used,
      limit: usage.limit,
      available: usage.limit === -1 ? -1 : Math.max(0, usage.limit - usage.used),
      percentUsed: usage.limit > 0 ? Math.round((usage.used / usage.limit) * 100) : 0,
      yearMonth: usage.yearMonth,
      tier,
    });
  } catch (err) {
    req.log.error({ err }, "GET /membership/family/ai-usage error");
    res.status(500).json({ error: "Failed to load AI usage" });
  }
});

// ── POST /membership/family/add-seat ─────────────────────────────────────────
// Creates a Stripe checkout session for an additional family seat.
router.post("/membership/family/add-seat", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;

    const userRow = await pool.query(
      `SELECT member_type, email FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = userRow.rows[0] as { member_type: string | null; email: string } | undefined;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const tier = getTierFromMemberType(user.member_type);
    const limits = TIER_LIMITS[tier];

    if (limits.familySeatsIncluded === 0) {
      res.status(403).json({
        error: "Family seats are only available on paid plans. Upgrade to Navigator or above.",
        upgradeUrl: "/membership",
      });
      return;
    }

    if (limits.addOnSeatPriceCents === 0) {
      res.status(403).json({ error: "Additional family seats are not configurable on your current plan." });
      return;
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      res.status(503).json({ error: "Payment service unavailable" });
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-05-27.dahlia" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: limits.addOnSeatPriceCents,
            recurring: { interval: "month" },
            product_data: {
              name: `Family Seat — ${TIER_DISPLAY[tier]?.name ?? tier}`,
              description: limits.familyMemberAccess,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type: "family_add_on_seat",
        tier,
      },
      success_url: `${process.env.APP_URL ?? "https://mappingwithmelanin.com"}/family-plan?seat_added=1`,
      cancel_url: `${process.env.APP_URL ?? "https://mappingwithmelanin.com"}/family-plan`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    req.log.error({ err }, "POST /membership/family/add-seat error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
