import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { storage } from "../storage";

const router: IRouter = Router();

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

export default router;
