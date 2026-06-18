import { Router, type IRouter, type Request, type Response } from "express";
import { storage } from "../storage";
import { stripeService } from "../stripeService";

const router: IRouter = Router();

router.get("/stripe/products", async (req: Request, res: Response) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const map = new Map<string, { id: string; name: string; description: string | null; metadata: Record<string, string>; prices: unknown[] }>();
    for (const row of rows as Record<string, unknown>[]) {
      const pid = row["product_id"] as string;
      if (!map.has(pid)) {
        map.set(pid, {
          id: pid,
          name: row["product_name"] as string,
          description: row["product_description"] as string | null,
          metadata: (row["product_metadata"] as Record<string, string>) ?? {},
          prices: [],
        });
      }
      if (row["price_id"]) {
        map.get(pid)!.prices.push({
          id: row["price_id"],
          unitAmount: row["unit_amount"],
          currency: row["currency"],
          recurring: row["recurring"],
        });
      }
    }
    res.json({ products: Array.from(map.values()) });
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/stripe/subscription", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await storage.getUser(req.user.id);
    if (!user?.stripeSubscriptionId) {
      res.json({ subscription: null });
      return;
    }
    const subscription = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription });
  } catch (err) {
    req.log.error({ err }, "Failed to get subscription");
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

router.post("/stripe/checkout", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { priceId } = req.body as { priceId: string };
    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const user = await storage.getUser(req.user.id);
    let customerId = user?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripeService.createCustomer(
        user?.email ?? `user_${req.user.id}@melaninmaps.app`,
        req.user.id,
      );
      await storage.updateUserStripeInfo(req.user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? req.get("host") ?? "";
    const base = `https://${domain}`;

    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${base}/checkout/success`,
      `${base}/checkout/cancel`,
    );

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/stripe/portal", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await storage.getUser(req.user.id);
    if (!user?.stripeCustomerId) {
      res.status(404).json({ error: "No billing account found" });
      return;
    }
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? req.get("host") ?? "";
    const session = await stripeService.createPortalSession(
      user.stripeCustomerId,
      `https://${domain}`,
    );
    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create portal session");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
