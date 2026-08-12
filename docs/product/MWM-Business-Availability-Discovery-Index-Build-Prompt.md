# Copy and paste this prompt to Replit

```text
OWNER-APPROVED NEXT BUILD — BUSINESS AVAILABILITY AND DISCOVERY INDEX

## Product outcome

A verified Mapping With Melanin business owner must be able to publish real current information on their own business page—for example:

“New menu item: Fruity Pebble Waffles. Available Saturday and Sunday, 10 AM–3 PM, while supplies last.”

Kinfolk must be able to find that active business-published offering when a member asks for it and recommend it based on real retrieval, availability, distance when permitted, the member’s own saves, and explicitly permitted preferences. Kinfolk must then send the member directly to the real business page or selected map pin.

This is NOT a badge feature. It is a structured business-content, availability, retrieval, and navigation feature.

## Release sequencing

Build this with the future Kinfolk-to-Map/Library action release, only after current P0 Kinfolk reliability and real business-feedback repairs pass independent verification. Do not merge it into an emergency patch.

## Strict no-touch boundary

Touch only:

- business offering schema/migrations and owner/manager APIs;
- narrowly required business-dashboard offering management UI;
- server-side offering index/outbox/job;
- Kinfolk structured retrieval/ranking and typed actions;
- map/business-page handoff plumbing;
- required tests and monitoring.

Do NOT change login/auth/session behavior, map rendering foundations, existing business identity data, safety score logic, Library evidence design, community feedback design, mobile app UX, Kinfolk voice/model configuration, or unrelated screens.

## Canonical data model

Create a separate `business_offerings` table. Do not overload Vibes, Community Says, reviews, business categories, or badges.

Required fields:

```text
id
business_id (canonical active Mapping With Melanin business ID)
title
offering_type: menu_item | service | event | promotion | availability | announcement
description
search_text (server-generated normalized text)
status: draft | scheduled | active | paused | sold_out | expired | archived
available_from / available_until (timezone-aware)
availability_note
tags
price_context
service_area
review_status
created_by / updated_by
created_at / updated_at
```

Only an authorized business owner/manager can create or update offerings for that business. Every mutation must have an audit record.

## Owner workflow

Add an owner-dashboard section named **What’s New / Available Now**. Owners can:

1. Create a draft.
2. Schedule an offering.
3. Publish an active offering.
4. Edit title, details, tags, price context, and availability.
5. Pause it.
6. Mark it sold out.
7. Archive it.

The public business page displays only active offerings within their availability windows. The page must show factual owner-provided details and availability; it must not display fake popularity, fake reviews, or fabricated availability.

## Index and availability rules

1. An offering enters the Kinfolk retrieval index only after it is public/active and attached to a valid public active business.
2. `sold_out`, `expired`, `paused`, `archived`, removed, inactive, demo, duplicate, or unsupported records cannot be returned as available.
3. A scheduled worker/outbox must expire offerings at `available_until` and remove/reduce their eligibility promptly.
4. Write tests that confirm edit, sold-out, pause, and expiry changes update retrieval correctly.

## Kinfolk retrieval and ranking

Kinfolk must retrieve exact structured offering matches before generic category suggestions.

Rank only eligible candidates using:

```text
text/retrieval relevance
+ current availability confidence
+ distance, only when the member permits location use
+ member’s own saved-business affinity
+ explicitly permitted member preferences
+ real approved community aggregates when available
- stale/near-expiry/low-confidence penalties
```

Never use a business owner’s offering to infer or expose a member’s sensitive personal information. Never disclose a searching member’s identity or raw searches to a business owner.

If no exact active offering exists, clearly say that no listed exact match was found and follow the Legoland rule: offer a useful equivalent, nearby option, save/alert option, or a way to explore the category. Do not invent availability.

## Required Kinfolk response action

For a valid match, return the structured action contract below, alongside a short conversational explanation:

```json
{
  "recommendations": [
    {
      "businessId": "canonical-business-id",
      "offeringId": "canonical-offering-id",
      "title": "Fruity Pebble Waffles",
      "availability": "Saturday–Sunday, 10 AM–3 PM",
      "reason": ["Active now", "Nearby"],
      "actions": [
        {
          "type": "open_business",
          "businessId": "canonical-business-id",
          "offeringId": "canonical-offering-id",
          "label": "View business"
        },
        {
          "type": "open_map_pin",
          "businessId": "canonical-business-id",
          "offeringId": "canonical-offering-id",
          "label": "Show on map"
        }
      ]
    }
  ]
}
```

The web client must use canonical IDs, not a business name string. `open_business` routes to the business page with the offering highlighted. `open_map_pin` pans to the valid canonical pin and opens the matching business preview.

## Privacy and analytics

1. Exclude `is_load_test = true`, bots, internal/staff traffic, and removed accounts from all demand analytics and ranking signals.
2. Do not show businesses raw member search text, individual identities, individual saves, private preferences, or location.
3. Business opportunity analytics require the existing distinct-member privacy threshold and aggregate only.
4. Member preferences must be opt-in and revocable.
5. Do not treat high-consequence queries as business endorsements or source them from business offerings.

## Required tests

1. Owner creates an active Fruity Pebble Waffles offering; it appears on the correct public business page.
2. Kinfolk exact query returns the real active offering and canonical business/map actions.
3. Business action opens the actual business page with offering visible.
4. Map action opens the canonical valid pin.
5. Editing availability refreshes retrieval.
6. Sold-out, paused, and expired offerings are not returned as available.
7. An inactive/demo/removed business cannot be returned.
8. Location-disabled member receives no false distance claim.
9. Saved-business reason is private to the member; owner receives no identity disclosure.
10. No exact match yields a transparent useful alternative rather than a fabricated item.
11. Load-test traffic does not change public offerings, business analytics, demand signals, Library growth candidates, or recommendations.
12. Existing map, Kinfolk, Library, business feedback, login, safety, and mobile tests remain green.

## Required proof back to owner and Manus

Return:

1. exact migration and files changed;
2. owner authorization and audit behavior;
3. index/outbox/expiry behavior;
4. test output for all 12 cases;
5. a real offering lifecycle proof: draft → active → Kinfolk match → map/business handoff → sold out/expired exclusion;
6. privacy/exclusion query output for load-test accounts;
7. new deployment SHA and `stale_bundle: false` proof;
8. browser screenshots/video of the business page offering, Kinfolk result, business-page handoff, and map-pin handoff.

Do not call it done until Manus independently verifies the complete flow.
```
