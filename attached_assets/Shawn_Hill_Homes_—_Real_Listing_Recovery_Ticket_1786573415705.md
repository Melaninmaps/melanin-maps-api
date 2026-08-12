# Shawn Hill Homes — Real Listing Recovery Ticket

**Priority:** P1 launch-content correction.  
**Current production finding:** The real Los Angeles-area realtor **Shawn Hill / Shawn Hill Homes** is absent from both the authenticated Business directory and the Map. Exact and location-constrained searches returned only unrelated fuzzy matches. A claim workflow cannot repair a business that has no listing.

> This ticket adds one real, owner-confirmed listing only. It must not create a placeholder, estimate an address, copy unverified contact data, add a rating, invent community feedback, or modify any existing business.

## 1. Required source-of-truth packet

Before inserting, obtain **one owner-confirmed public packet** from Shawn or the founder. The packet must contain:

| Required field | Acceptable source |
| --- | --- |
| Public display name | Owner-confirmed business name, e.g., `Shawn Hill Homes` if that is his active public brand. |
| Business category | `Professional Services` → `Real Estate Agent` / `Residential Real Estate`. |
| Service city or office address | A public service area may be shown only if a public street address is not owner-approved. Do not infer a home address. |
| City, state, country | Owner-confirmed public operating area. |
| Owner-approved website or public Instagram | Official public URL only. |
| Public business email or phone | Optional; only with owner approval. |
| California license number | Optional; include only if Shawn confirms the public license he wants displayed. |
| Short business description | Owner-approved, factual, no superlatives or invented testimonials. |
| Latitude and longitude | Derived only from the approved public office/service-area location and retained with source/provenance. |

**Do not use:** personal address, scraped personal phone number, guessed brokerage affiliation, inferred postcode, fabricated description, fake ratings, fake reviews, fake image, or unapproved bio.

## 2. Surgical insert contract

Use the existing real-business submission/admin insertion flow. Do not alter database schema or seed scripts. Create exactly one record with the following state:

```text
status                 = active
listing_status         = live_unclaimed
profile_status         = community_listed
submitted_by_id        = NULL
verified               = false
rating                 = 0
review_count           = 0
community feedback     = empty
```

The listing must be future-claimable but **must not be claimed today**.

### Required fields after source confirmation

```text
name                   = owner-confirmed public business name
category               = Professional Services
subcategory            = Real Estate Agent / Residential Real Estate
address OR serviceArea = owner-confirmed public value only
city                   = owner-confirmed
state                  = CA
country                = US
website                = owner-confirmed public canonical URL
instagram              = owner-confirmed public handle/URL, optional
latitude / longitude   = verified approved public location only
description            = owner-approved factual copy
```

## 3. Search and map requirements

The inserted record must be returned by all of the following, with no unrelated fallback needed:

```text
GET /api/businesses?search=Shawn%20Hill
GET /api/businesses?search=Shawn%20Hill%20Homes
GET /api/businesses?city=<confirmed_city>&search=Shawn%20Hill
GET /api/maps/discoverability-pins  (only if a verified public coordinate is approved)
```

The listing must also be visible in the website directory and, if coordinates are approved, on the map pin layer. The map pin must open the same business detail record.

## 4. Future owner claim requirement

After the universal claim process is implemented, opening this record while signed in must return:

```json
{
  "eligibility": "claimable"
}
```

The **“Is this your business?”** action must begin a free pending claim. It must not auto-link Shawn’s tester account, charge a fee, or publish owner-only content until an authorized administrator approves the claim.

## 5. Required proof before calling this complete

Replit must provide one proof package containing:

1. The owner-confirmed source packet, with private contact fields redacted.
2. The exact inserted business ID and non-sensitive final field set.
3. Exact API response excerpts for the three named search queries, each containing the new record.
4. Authenticated directory screenshot showing Shawn’s correct listing.
5. Authenticated map screenshot showing the real pin **only if** the owner approved a public mappable location.
6. Business detail screenshot showing no fake ratings, no fake community feedback, and `live_unclaimed`/claimable state.
7. Confirmation that no other business rows, data seeds, search logic, map logic, authentication, Kinfolk, or Library files were changed.

## 6. Rollback

If the owner rejects any public field, deactivate only this new record and remove its map pin. Do not touch any other listing or claim data.

## Definition of done

Shawn Hill’s real, owner-confirmed real-estate listing is present in directory search; appears on the map only with an approved public location; has no invented community data; and is ready for a **future free owner claim** after the universal claim workflow passes independent verification.
