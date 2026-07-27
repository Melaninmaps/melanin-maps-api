import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { storage } from "../storage";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const MEMBERSHIP_URL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, "")
  : "https://mappingwithmelanin.com";

const PLAN_PRICES_CENTS: Record<string, Record<string, number>> = {
  navigator:    { monthly: 799,  annual: 7999  },
  trailblazer:  { monthly: 1499, annual: 14999 },
};
const PLAN_LABELS: Record<string, string> = {
  navigator:   "Navigator — Community Membership",
  trailblazer: "Trailblazer — Premium Membership",
};

router.get("/billing/invoices", async (req: any, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await storage.getUser(req.user.id);
    if (!user?.stripeCustomerId) {
      res.json({ invoices: [] });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 24,
    });
    const mapped = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: inv.amount_paid,
      currency: inv.currency,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      createdAt: inv.created,
      description: inv.lines.data[0]?.description ?? null,
    }));
    res.json({ invoices: mapped });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch invoices");
    res.status(500).json({ error: "Failed to fetch billing history" });
  }
});

router.get("/billing/subscription", async (req: any, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await storage.getUser(req.user.id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const now = new Date();
    const trialActive = user.trialEndsAt ? user.trialEndsAt > now : false;
    const trialDaysLeft = trialActive && user.trialEndsAt
      ? Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      memberType: user.memberType ?? "individual",
      trialEndsAt: user.trialEndsAt ?? null,
      trialActive,
      trialDaysLeft,
      hasSubscription: !!user.stripeSubscriptionId,
      foundingMemberNumber: user.foundingMemberNumber ?? null,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch billing status");
    res.status(500).json({ error: "Failed to fetch billing status" });
  }
});

/**
 * POST /billing/checkout
 * Creates a Stripe Checkout session for a web membership subscription.
 * Returns { checkoutUrl } on success.
 *
 * Body: { plan: "navigator" | "trailblazer", interval: "monthly" | "annual" }
 */
router.post("/billing/checkout", async (req: any, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const plan = req.body?.plan as string | undefined;
    const interval = req.body?.interval as string | undefined;

    if (!plan || !PLAN_PRICES_CENTS[plan]) {
      res.status(400).json({ error: "Invalid plan. Choose navigator or trailblazer." });
      return;
    }
    const billingInterval = interval === "annual" ? "annual" : "monthly";
    const amountCents = PLAN_PRICES_CENTS[plan][billingInterval];

    const user = await storage.getUser(req.user.id);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const stripe = await getUncachableStripeClient();

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(usersTable.id, user.id));
    }

    const successUrl = `${MEMBERSHIP_URL}/membership?subscribed=1&plan=${plan}`;
    const cancelUrl  = `${MEMBERSHIP_URL}/membership?checkout_cancelled=1`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: PLAN_LABELS[plan] ?? plan,
              description: `Mapping With Melanin™ ${PLAN_LABELS[plan] ?? plan} — web subscription. Funds the MWM Scholarship Program and community initiatives.`,
              images: ["https://mappingwithmelanin.com/images/brand/logo.png"],
            },
            recurring: {
              interval: billingInterval === "annual" ? "year" : "month",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        planType: plan,
        interval: billingInterval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planType: plan,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    req.log.info({ userId: user.id, plan, interval: billingInterval }, "Stripe checkout session created");
    res.json({ checkoutUrl: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create Stripe checkout session");
    res.status(500).json({ error: "Could not create checkout session. Please try again." });
  }
});

/**
 * POST /billing/portal
 * Opens the Stripe Customer Portal for managing an existing subscription.
 */
router.post("/billing/portal", async (req: any, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await storage.getUser(req.user.id);
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found." });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${MEMBERSHIP_URL}/membership`,
    });
    res.json({ portalUrl: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create billing portal session");
    res.status(500).json({ error: "Could not open billing portal." });
  }
});

export default router;
