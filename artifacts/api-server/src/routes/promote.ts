import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PROMOTED_DURATION_DAYS = 30;

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" }); return null; }
  return req.user.id;
}

router.post("/businesses/mine/promote", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);

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

    const priceId = process.env.STRIPE_PROMOTED_LISTING_PRICE_ID;
    if (!priceId) {
      res.status(503).json({
        error: "Promoted listing checkout is not yet configured. Contact support.",
        code: "NOT_CONFIGURED",
      });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const domains = (process.env.REPLIT_DOMAINS ?? "localhost:80").split(",");
    const baseUrl = `https://${domains[0]}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/business-dashboard?promoted=1`,
      cancel_url: `${baseUrl}/business-dashboard`,
      metadata: {
        type: "promoted_listing",
        businessId: business.id,
        userId,
        durationDays: String(PROMOTED_DURATION_DAYS),
      },
    });

    logger.info({ businessId: business.id, sessionId: session.id }, "[promote] checkout session created");
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
    const [business] = await db
      .select({ id: businessesTable.id, promotedUntil: businessesTable.promotedUntil })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);

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
