import { Router, type IRouter } from "express";
import { storage } from "../storage";
import { stripeService } from "../stripeService";

const router: IRouter = Router();

router.get("/stripe/subscription", async (req: any, res): Promise<void> => {
  try {
    const user = await storage.getUser(req.user?.id);
    if (!user?.stripeSubscriptionId) {
      res.json({ subscription: null });
      return;
    }
    const subscription = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription });
  } catch (err: any) {
    req.log.error({ err }, "Failed to get subscription");
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

router.post("/stripe/checkout", async (req: any, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { priceId } = req.body as { priceId: string };
    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email ?? "", user.id);
      await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const baseUrl = `https://${domain}`;

    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${baseUrl}/api/stripe/checkout/success`,
      `${baseUrl}/api/stripe/checkout/cancel`,
    );

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Checkout session creation failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/stripe/checkout/success", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Successful</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FDF6EE}
  .card{text-align:center;padding:40px 32px;max-width:380px}
  .icon{font-size:56px;margin-bottom:16px}
  h1{font-size:22px;color:#1A0A00;margin:0 0 10px}
  p{color:#6B4C2A;font-size:15px;margin:0 0 24px;line-height:1.5}
  .btn{display:inline-block;padding:14px 28px;background:#3B1F0E;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600}
</style>
</head>
<body>
<div class="card">
  <div class="icon">🎉</div>
  <h1>Welcome to the community!</h1>
  <p>Your membership is now active. Return to the Mapping with Melanin™ app to start exploring.</p>
  <p style="font-size:13px;color:#9B7B5A">You can close this tab and return to the app.</p>
</div>
</body>
</html>`);
});

router.get("/stripe/checkout/cancel", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Cancelled</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FDF6EE}
  .card{text-align:center;padding:40px 32px;max-width:380px}
  .icon{font-size:56px;margin-bottom:16px}
  h1{font-size:22px;color:#1A0A00;margin:0 0 10px}
  p{color:#6B4C2A;font-size:15px;margin:0 0 24px;line-height:1.5}
</style>
</head>
<body>
<div class="card">
  <div class="icon">↩️</div>
  <h1>No worries</h1>
  <p>Your payment was cancelled. Return to the app and try again whenever you're ready.</p>
  <p style="font-size:13px;color:#9B7B5A">You can close this tab.</p>
</div>
</body>
</html>`);
});

router.post("/stripe/portal", async (req: any, res): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const user = await storage.getUser(req.user.id);
    if (!user?.stripeCustomerId) {
      res.status(404).json({ error: "No Stripe customer found" });
      return;
    }
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const session = await stripeService.createPortalSession(
      user.stripeCustomerId,
      `https://${domain}/api/stripe/checkout/success`,
    );
    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Portal session creation failed");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.get("/stripe/products", async (req: any, res) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const map = new Map<string, any>();
    for (const row of rows) {
      if (!map.has(row.product_id as string)) {
        map.set(row.product_id as string, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata ?? {},
          prices: [],
        });
      }
      if (row.price_id) {
        map.get(row.product_id as string).prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ products: Array.from(map.values()) });
  } catch (err: any) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Failed to list products" });
  }
});

export default router;
