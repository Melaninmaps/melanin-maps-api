# Mapping With Melanin — Business Availability and Discovery Index

## Product outcome

A business owner can publish a real, time-bound update on their Mapping With Melanin business page—for example:

> **New menu item: Fruity Pebble Waffles. Available Saturday and Sunday, 10 AM–3 PM, while supplies last.**

Kinfolk can then find that update when a member asks for Fruity Pebble waffles and recommend the best **real, active** match using availability, distance, member saves, and the member’s explicitly permitted preferences. The result must open the actual business page or map pin.

This is an information-and-availability system, **not a badge system**. The business page is the source of truth; Kinfolk retrieves and ranks the structured offering attached to that page.

## Core objects

| Object | Owner | Purpose |
|---|---|---|
| Business offering | Verified business owner or authorized manager | A publishable, searchable item, service, event, promotion, menu update, or availability change |
| Availability window | Business owner | Defines whether the offering is available now, scheduled, paused, sold out, or expired |
| Search document | Server-generated | Normalized text and facets used by Kinfolk retrieval; derived from the offering and business record |
| Member preference signal | Member-controlled | Optional permitted ranking input, such as saved businesses, dietary preference, budget, family-friendly intent, or preferred distance |
| Kinfolk recommendation action | Server-generated | Typed link to the real business page or selected map pin |

## Offering data model

A business offering is distinct from the business itself. One business may have many active and historical offerings.

```text
Business
  ├── Offering: Fruity Pebble Waffles
  ├── Offering: Valentine’s Day Dinner Menu
  ├── Offering: Sunday Gospel Brunch
  └── Offering: Same-day braid appointments
```

### Required fields

| Field | Requirement |
|---|---|
| `business_id` | Canonical active Mapping With Melanin business ID |
| `title` | Human-readable offering title; e.g., “Fruity Pebble Waffles” |
| `offering_type` | `menu_item`, `service`, `event`, `promotion`, `availability`, or `announcement` |
| `description` | Owner-authored factual description; no fabricated Kinfolk copy |
| `search_text` | Server-generated normalized searchable content from title, description, tags, and business context |
| `status` | `draft`, `scheduled`, `active`, `paused`, `sold_out`, `expired`, `archived` |
| `available_from` / `available_until` | Optional timezone-aware availability interval |
| `availability_note` | Optional factual note such as “weekends only” or “while supplies last” |
| `service_area` | Optional geographic qualifier for mobile/pop-up/delivery offerings |
| `tags` | Owner-selected controlled terms plus moderated free-form tags |
| `price_context` | Optional `free`, `budget`, `midrange`, `premium`, or an owner-entered range |
| `created_by` / `updated_by` | Authorized business owner or manager ID |
| `review_status` | `active` only after appropriate business/abuse checks |

### Not allowed

1. Kinfolk must not invent a menu item, availability, price, appointment, stock level, or opening hours.
2. An expired, paused, sold-out, inactive, demo, removed, or unclaimed unsupported record cannot be recommended as available.
3. A business cannot infer sensitive member attributes from a Kinfolk query or receive the identity of people searching an offering.
4. Search demand can inform aggregated business opportunity analytics only under the established privacy threshold; it cannot reveal individual searches.

## Availability lifecycle

```text
Draft → Scheduled → Active → Paused / Sold Out / Expired → Archived
```

Only `active` offerings inside their availability window are eligible for “available now” recommendations. A scheduled item can be returned only when the member asks about future availability, with its date/time displayed.

A scheduled background job must expire offerings automatically at `available_until`. The owner can renew, pause, or mark sold out; each state change updates the search index.

## Ranking principle

Kinfolk begins with factual retrieval, then ranks among valid candidates. It should not return a generic answer when a real matching offering is available on MWM.

```text
eligible candidate score =
  text/retrieval relevance
+ current availability confidence
+ proximity (only if member allows location use)
+ saved-business affinity
+ permitted member preference fit
+ real community support signals
- stale/near-expiry/low-confidence penalties
```

### Ranking inputs

| Input | Allowed use | Not allowed use |
|---|---|---|
| Exact offering match | Match “Fruity Pebble waffles” to a real active menu item | Guess from a restaurant category alone |
| Availability | Favor active, in-window, non-sold-out offerings | State availability without owner data |
| Distance | Rank nearer candidates if member permits location | Reveal the member’s location to the business |
| Saves | Use the member’s own saved businesses as a private affinity signal | Tell a business which member searched or saved it |
| Preferences | Use member-selected food, budget, family, accessibility, or vibe preferences | Infer health, fertility, religion, sexuality, or other sensitive traits |
| Community signals | Use verified aggregate feedback only once the real feedback system supports it | Use demo ratings, fake review counts, or undisclosed private behavior |

The score should be explainable to the member: “This is nearby and active today,” “You saved this business,” or “It matches your selected brunch preference.” It must not expose hidden profiling.

## Kinfolk response contract

When a factual active match exists, Kinfolk returns a short conversational answer plus typed destination actions.

```json
{
  "answer": "The Pink Plate has Fruity Pebble Waffles listed for Saturday brunch, 10 AM–3 PM, while supplies last.",
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
          "label": "View The Pink Plate"
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

If there is no exact active match, Kinfolk follows the Legoland rule: it must provide useful equivalents, nearby category alternatives, or a save/alert option—but clearly say that it did not find a listed exact match. It never pretends that one exists.

## Business page behavior

The business page should include a factual **What’s New / Available Now** section. It displays only active offerings, their availability window, owner-provided details, and an optional “show on map” action. It may coexist with Community Vibes and Community Says, but is not represented as a vibe or badge.

Owners manage offerings from their business dashboard. They can create, edit, pause, mark sold out, schedule, expire, and archive an offering. Every mutation validates business ownership and writes an audit record.

## Map behavior

The map can highlight a selected offering only when its business has valid coordinates and an active public listing. A Kinfolk map action receives `businessId` and optionally `offeringId`; it pans to the canonical pin and opens the business preview with the matching offering shown.

## Privacy and governance

1. No individual search query or identity is shown to a business owner.
2. Owners see only their own offerings and aggregated dashboard analytics after privacy thresholds are met.
3. Load-test, bot, staff, and internal traffic are excluded from business-demand analytics and recommendations.
4. Owner content is subject to the existing moderation and business verification controls.
5. Search indexing is refreshed transactionally or via a reliable outbox; a business must not be recommended before its active offering is indexed.
6. Kinfolk retains normal query safety rules. A business offering does not make a medical, legal, financial, or other high-consequence claim authoritative.

## Required next-build acceptance tests

1. An authorized owner creates an active Fruity Pebble Waffles offering; it appears on the exact business page.
2. A member asks Kinfolk for Fruity Pebble waffles; Kinfolk returns the real active offering and the correct business/map actions.
3. The map action opens the canonical pin and business preview.
4. Editing title, tags, or availability updates the search result after index refresh.
5. Marking sold out/expired removes it from “available now” results.
6. An inactive/demo/removed business cannot be recommended.
7. A member who has location disabled gets relevance-only results and no distance claim.
8. A member who saved the business can receive a private “you saved this” reason; the owner cannot see the member identity.
9. No exact offering returns a truthful alternative/alert route, not a fabricated match.
10. Load-test accounts produce no owner analytics, demand signals, recommendations, or public changes.
11. Existing map, business pages, Kinfolk, Library, safety feedback, login, and mobile tests remain green.

## Release sequencing

This feature should ship with the Kinfolk-to-Map/Library action release **after** the current Kinfolk reliability and real business-feedback work pass independent verification. It needs its own migration, owner dashboard/API, index job, Kinfolk retrieval integration, map handoff, privacy tests, and 30-person canary coverage.
