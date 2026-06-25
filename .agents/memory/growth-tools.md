---
name: Business Growth Tools
description: Paid placement system for Black-owned businesses — promotion types, checkout flow, search curation, and mobile dashboard tab.
---

## What was built

`business_promotions` table (`lib/db/src/schema/business-promotions.ts`) with fields: businessId, type enum, status enum, targetCategory/City/Neighborhood/Event, startsAt/endsAt, stripeSessionId, priceUsdCents, durationDays.

Five promotion types:
- `priority_search` — $29/30d — general search ranking boost
- `category_featured` — $49/30d — top of category page
- `city_featured` — $79/30d — top of city/neighborhood search
- `cultural_spotlight` — $99/14d — during cultural events/holidays
- `event_featured` — $39/14d — top of events feed

## Key decisions

**Dynamic Stripe pricing** — No pre-configured Stripe price IDs needed. `POST /api/businesses/mine/growth-tools/checkout` calls `stripe.prices.create()` with a unit_amount at runtime, then creates a checkout session. Works day one without any Stripe dashboard setup.

**Pending record before checkout** — A `business_promotions` row is inserted with status=`pending` before the Stripe session is created, then the `stripeSessionId` is backfilled. Webhook activates on `checkout.session.completed` with `metadata.type === "business_growth_tool"` by updating status to `active`, setting startsAt/endsAt, and also updating `businesses.promotedUntil` for backward compat.

**Search curation rule** — Active promotions are fetched in `GET /api/businesses` after the main query runs. Only businesses already in the result set (matching the search) get annotated as `featured: true` and `promotionType`. Never injects off-topic businesses. Featured businesses sort to the top client-side.

**Legacy route preserved** — `POST /api/businesses/mine/promote` still works but now internally creates a `priority_search` promotion and uses dynamic pricing (not `STRIPE_PROMOTED_LISTING_PRICE_ID` env var).

## Routes added

- `GET /api/businesses/mine/growth-tools` — returns activePromotions, pendingPromotions, catalogue
- `POST /api/businesses/mine/growth-tools/checkout` — body: `{ type, targetCategory?, targetCity?, targetNeighborhood?, targetEvent? }`

## Mobile dashboard

- New "Grow" tab added (tab order: overview, reviews, products, grow, insights)
- Grow tab loads on first activation via `loadGrowthTools()`
- Shows: active/pending promotion status cards → tool catalogue with pricing/descriptions/checkout buttons → AI tools (link to KinfolkAI in insights tab) → Analytics (link to insights tab)
- Overview tab "Promote My Listing" card replaced with "Growth Tools" teaser that navigates to the Grow tab
