import { getUncachableStripeClient } from "./stripeClient.js";

interface PlanDef {
  name: string;
  description: string;
  audience: string;
  monthly: number;
  annual: number;
}

const PLANS: PlanDef[] = [
  {
    name: "Community Pro",
    description: "AI travel planner, unlimited saves, community features & more",
    audience: "consumer",
    monthly: 999,
    annual: 799,
  },
  {
    name: "Premium Plus",
    description: "Everything in Community Pro plus priority listings, exclusive events & concierge perks",
    audience: "consumer",
    monthly: 1999,
    annual: 1599,
  },
  {
    name: "Growth",
    description: "Business analytics, featured placement, review management & community reach",
    audience: "business",
    monthly: 2999,
    annual: 2399,
  },
  {
    name: "Professional",
    description: "Advanced analytics, verified badge, AI-powered recommendations & priority support",
    audience: "business",
    monthly: 7999,
    annual: 6399,
  },
  {
    name: "Enterprise",
    description: "Full suite: custom integrations, dedicated manager, white-glove onboarding & API access",
    audience: "business",
    monthly: 19999,
    annual: 15999,
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("Seeding Mapping with Melanin™ products in Stripe…\n");

  for (const plan of PLANS) {
    const existing = await stripe.products.search({
      query: `name:'${plan.name}' AND active:'true'`,
    });

    let product: { id: string; name: string };

    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`✓ ${plan.name} already exists (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { audience: plan.audience, app: "mapping-with-melanin" },
      });
      console.log(`+ Created ${plan.name} (${product.id})`);
    }

    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    const hasMonthly = prices.data.some(
      (p) => p.recurring?.interval === "month" && p.unit_amount === plan.monthly,
    );
    const hasAnnual = prices.data.some(
      (p) => p.recurring?.interval === "year" && p.unit_amount === plan.annual * 12,
    );

    if (!hasMonthly) {
      const p = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { billing: "monthly" },
      });
      console.log(`  + Monthly price $${(plan.monthly / 100).toFixed(2)}/mo (${p.id})`);
    } else {
      console.log(`  ✓ Monthly price already exists`);
    }

    if (!hasAnnual) {
      const p = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annual * 12,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { billing: "annual" },
      });
      console.log(`  + Annual price $${((plan.annual * 12) / 100).toFixed(2)}/yr = $${(plan.annual / 100).toFixed(2)}/mo (${p.id})`);
    } else {
      console.log(`  ✓ Annual price already exists`);
    }
  }

  console.log("\n✅ Done. Webhooks will sync these products to your database automatically.");
}

seedProducts().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
