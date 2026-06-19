import { getUncachableStripeClient } from "./stripeClient.js";

interface PlanDef {
  name: string;
  description: string;
  audience: string;
  monthly: number;
  annualTotal: number;
}

const PLANS: PlanDef[] = [
  {
    name: "Navigator",
    description: "Unlimited favorites, advanced filters, enhanced safety insights & personalized recommendations",
    audience: "consumer",
    monthly: 799,
    annualTotal: 7900,
  },
  {
    name: "Trailblazer",
    description: "Everything in Navigator plus Cultural Compass™ AI, relocation tools, premium itineraries & priority support",
    audience: "consumer",
    monthly: 1499,
    annualTotal: 14900,
  },
  {
    name: "Growth Partner",
    description: "Verification eligibility, enhanced profile, business analytics, event creation & referral tracking",
    audience: "business",
    monthly: 2499,
    annualTotal: 24900,
  },
  {
    name: "Community Leader",
    description: "Everything in Growth Partner plus featured placement, enhanced analytics, lead generation & priority support",
    audience: "business",
    monthly: 6999,
    annualTotal: 69900,
  },
  {
    name: "Legacy Partner",
    description: "Full suite: multi-location management, advanced reporting, sponsorship opportunities & dedicated support",
    audience: "business",
    monthly: 19999,
    annualTotal: 199900,
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
      (p) => p.recurring?.interval === "year" && p.unit_amount === plan.annualTotal,
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
        unit_amount: plan.annualTotal,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { billing: "annual" },
      });
      console.log(`  + Annual price $${(plan.annualTotal / 100).toFixed(2)}/yr = $${(plan.annualTotal / 100 / 12).toFixed(2)}/mo (${p.id})`);
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
