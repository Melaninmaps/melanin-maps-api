import { getUncachableStripeClient } from "./stripeClient.js";

const OLD_PRODUCTS = [
  { id: "prod_UjFudHRj67iiLs", name: "Enterprise" },
  { id: "prod_UjFunxvf8gO47t", name: "Professional" },
  { id: "prod_UjFu4JXnRiuEQP", name: "Growth" },
  { id: "prod_UjFuxLB3jnQ3XM", name: "Community Pro" },
  { id: "prod_UjFu9Hm61b23yL", name: "Premium Plus" },
];

async function archiveOldProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("Archiving old Mapping with Melanin™ products in Stripe…\n");

  for (const { id, name } of OLD_PRODUCTS) {
    const prices = await stripe.prices.list({ product: id, active: true, limit: 10 });
    for (const price of prices.data) {
      await stripe.prices.update(price.id, { active: false });
      console.log(`  Archived price ${price.id}`);
    }
    await stripe.products.update(id, { active: false });
    console.log(`✓ Archived: ${name} (${id})`);
  }

  console.log("\n✅ Done. Old products archived in Stripe.");
}

archiveOldProducts().catch((err) => { console.error(err); process.exit(1); });
