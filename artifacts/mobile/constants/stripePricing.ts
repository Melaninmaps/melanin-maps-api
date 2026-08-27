export type BillingInterval = "monthly" | "annual";

interface PriceIds {
  monthly: string | null;
  annual: string | null;
}

// ─── Test-mode price IDs (Stripe sandbox) ─────────────────────────────────────
// Products: prod_UjLv... series  (livemode: false)
const TEST: Record<string, PriceIds> = {
  "Navigator":         { monthly: "price_1TjtDm2dZMKVG0ZHGFvoZDsY", annual: "price_1TjtDm2dZMKVG0ZHVK4hSp9f" },
  "Trailblazer":       { monthly: "price_1TjtDm2dZMKVG0ZHRKoADHXF", annual: "price_1TjtDm2dZMKVG0ZHkEY7tkdC" },
  "Growth Partner":    { monthly: "price_1TjtDn2dZMKVG0ZHId1CscBo", annual: "price_1TjtDn2dZMKVG0ZH4qrSLKIR" },
  "Community Leader":  { monthly: "price_1TjtDn2dZMKVG0ZHkO7CbANL", annual: "price_1TjtDo2dZMKVG0ZHeNpNYjRF" },
  "Legacy Partner":    { monthly: "price_1TjtDo2dZMKVG0ZHaNUsfX4Q", annual: "price_1TjtDo2dZMKVG0ZHKqTvJ07s" },
  // No sandbox equivalents created yet — create in Stripe test dashboard before enabling:
  "Growth Business":   { monthly: null, annual: null },
  "Premium Business":  { monthly: null, annual: null },
  "Founding Business": { monthly: null, annual: null },
  "Community Builder": { monthly: null, annual: null },
  "Legacy Member":     { monthly: null, annual: null },
};

// ─── Live-mode price IDs (Stripe production) ──────────────────────────────────
// Products: prod_Uk8... / prod_Uls... series  (livemode: true)
const LIVE: Record<string, PriceIds> = {
  "Navigator":         { monthly: "price_1Tke1hR7a2LX3tSdgawXvNDE", annual: "price_1Tke1hR7a2LX3tSdKlbUX22n" },
  "Trailblazer":       { monthly: "price_1Tke1iR7a2LX3tSdcuSlyzIX", annual: "price_1Tke1iR7a2LX3tSdIXgZTqDc" },
  "Growth Partner":    { monthly: "price_1Tke1jR7a2LX3tSdKYzkdDe2", annual: "price_1Tke1jR7a2LX3tSdedWr9mZ5" },
  "Community Leader":  { monthly: "price_1Tke1jR7a2LX3tSd8fW4jlNh", annual: "price_1Tke1kR7a2LX3tSdg8aC2thQ" },
  "Legacy Partner":    { monthly: "price_1Tke1kR7a2LX3tSdUh6RZILl", annual: "price_1Tke1lR7a2LX3tSdxhQOuiDr" },
  "Growth Business":   { monthly: "price_1TmKpQR7a2LX3tSdopSyXnXW", annual: "price_1TmKpQR7a2LX3tSdGlw5VthW" },
  "Premium Business":  { monthly: "price_1TmKpQR7a2LX3tSdyqnWP7vE", annual: "price_1TmKpRR7a2LX3tSdpJaNsqVU" },
  // Not yet created in live Stripe — add price IDs here once created:
  "Founding Business": { monthly: null, annual: null },
  "Community Builder": { monthly: null, annual: null },
  "Legacy Member":     { monthly: null, annual: null },
};

// ─── Active environment ────────────────────────────────────────────────────────
// To switch to production: change "test" → "live". No other file needs changing.
// This is an OTA-safe change — no App Store resubmission required.
export const STRIPE_ENV: "test" | "live" = process.env.EXPO_PUBLIC_STRIPE_ENV === "live" ? "live" : "test";

const PRICES = STRIPE_ENV === "live" ? LIVE : TEST;

/**
 * Returns the Stripe Price ID for the given plan key and billing interval,
 * or null if the plan is not yet configured in the active environment.
 *
 * planKey — the plan's stripeKey field, or plan.name if stripeKey is absent
 * billing — "monthly" | "annual"
 */
export function getPriceId(planKey: string, billing: BillingInterval): string | null {
  return PRICES[planKey]?.[billing] ?? null;
}
