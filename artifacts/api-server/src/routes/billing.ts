import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { storage } from "../storage";

const MEMBERSHIP_URL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/$/, "")
  : "https://mappingwithmelanin.com";

const router: IRouter = Router();

const MEMBERSHIP_CHECKOUT_UNAVAILABLE_RESPONSE = {
  error:
    "Membership checkout is temporarily unavailable while the approved catalog and entitlement lifecycle are being reconciled.",
  code: "MEMBERSHIP_CHECKOUT_CATALOG_RECONCILIATION_REQUIRED",
} as const;

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
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const now = new Date();
    const trialActive = user.trialEndsAt ? user.trialEndsAt > now : false;
    const trialDaysLeft =
      trialActive && user.trialEndsAt
        ? Math.ceil(
            (user.trialEndsAt.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
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
 *
 * Enrollment remains fail-closed until the approved catalog and entitlement
 * lifecycle are reconciled. Existing billing management remains available.
 */
router.post("/billing/checkout", (req: any, res): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  res.status(409).json(MEMBERSHIP_CHECKOUT_UNAVAILABLE_RESPONSE);
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
