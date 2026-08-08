# MWM Community Professional Tier — v1.0
**Status:** Permanent spec — Review Mode only. "Please implement." is the only authorization phrase.
**Priority:** Phase 4 (Post-tour, revenue-dependent) — Design now, build later.

## The Concept

A Community Professional is a minority individual who works AT a non-minority-owned business but deserves community support in their own right. They are not business owners — they are talented professionals whose presence at a location is the reason the community visits.

> "When a Black makeup artist works at Ulta, the community doesn't go to Ulta — they go to HER."

## Four-Tier Model (Updated)

| Tier | Who | Cost | Primary Entity |
|------|-----|------|----------------|
| 1 — Verified Business | Established, registered entities | Subscription | Business name |
| 2 — Community Entrepreneur | Informal businesses (home chefs, braiders) | ALWAYS FREE | Person + offering |
| 3 — Community Professional | Minority individual at non-minority business | ALWAYS FREE | Person + specialty |
| 4 — External Reference | Community-added, unclaimed | N/A | Business name |

## Community Professional Profile Structure

### Person-centered, not location-centered

```
KEISHA M.
Makeup Artist · Color Specialist
──── Community Professional ────
📍 Find her at: Ulta Beauty
   1200 Market St, Philadelphia, PA

"I specialize in deep shades because every woman deserves to see herself in the mirror."

──── THE REAL ────
247 people said: Found My Shade
189 people said: Blessed Hands
156 people said: On Time, Every Time

──── ONE-TAP ENDORSEMENTS ────
312 people said: Book Now
201 people said: Ask For Her By Name

[Book With Keisha] → links to her booking/social
[Her Work] → links to her Instagram/TikTok
```

## Critical Rules (Non-negotiable)

1. **The person is primary, not the location.** Reviews, endorsements, and "The Real" tags attach to the PERSON. If they leave, all endorsements follow them.
2. **The host business does NOT get listed.** Ulta does not get a full MWM page because Keisha works there. The host business appears ONLY as a location reference.
3. **No employer notification.** The host business (Ulta, Chase, franchise shop) is NEVER notified.
4. **Always free.** Community Professionals NEVER pay to be listed.
5. **One-Way Mirror applies.** Kinfolk references BEHAVIOR, never identity.
6. **All history carries forward** on upgrade (Community Professional → CE → Verified Business).

## Search Ordering

1. Verified Minority-Owned Businesses (first)
2. Community Entrepreneurs (second)
3. Community Professionals (third)
4. Allied Businesses (last — never above minority alternatives)

## Map Pin

- Distinct pin type: teal or soft purple person-shaped pin
- Separate from business gold circles
- Tapping opens person-centered profile card (not a business card)

## Growth Pipeline

```
Community Professional → Community Entrepreneur → Verified Business
     (employed)              (side hustle)           (own shop)
         └── All history carries forward at each transition ──┘
```

Kinfolk growth signal threshold: 100+ endorsement taps, 50+ "Ask For [Name] By Name" taps, consistent booking clicks.

## Database Schema (When Authorized to Build)

```json
{
  "listing_type": "verified | community_entrepreneur | community_professional | external_reference",
  "professionalId": "uuid",
  "userId": "uuid",
  "displayName": "Keisha M.",
  "specialty": "Makeup Artist · Color Specialist",
  "bio": "string | null",
  "mainCategory": "Beauty & Personal Care",
  "subcategory": "Makeup Artists",
  "hostBusiness": {
    "name": "Ulta Beauty",
    "address": "1200 Market St",
    "city": "Philadelphia",
    "state": "PA",
    "coordinates": { "lat": 39.952, "lng": -75.165 }
  },
  "socialMedia": { "instagram": "url | null", "tiktok": "url | null", "bookingUrl": "url | null" },
  "schedule": "Tues-Sat, 10am-6pm",
  "visibility": "active | hidden | relocated",
  "communityRecognized": false,
  "dualProfileLink": {
    "communityMemberId": "uuid",
    "communityEntrepreneurId": "uuid | null",
    "verifiedBusinessId": "uuid | null"
  }
}
```

## API Endpoints (When Authorized to Build)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/community-professionals | Create profile |
| GET | /api/community-professionals?category=&city=&state= | Search |
| GET | /api/community-professionals/:id | Get profile |
| PATCH | /api/community-professionals/:id | Update (location, bio) |
| POST | /api/community-professionals/:id/endorse | Tap endorsement tag |
| GET | /api/community-professionals/:id/endorsements | Get tag counts |
| PATCH | /api/community-professionals/:id/relocate | Update host business |
| POST | /api/community-professionals/:id/upgrade | Begin CE transition |

## Real-World Examples

- **Keisha M.** — Makeup Artist at Ulta. 247 "Found My Shade" taps.
- **Marcus T.** — Loan Officer at Chase. 89 "Said Yes When Others Said No" taps.
- **Dr. Amara O.** — OB/GYN at Jefferson Hospital. 312 "This Doctor Listens" taps.
- **Julio R.** — Barber renting a chair. 456 "Sharpest Lineup" taps.

## Founder's Vision Statement

> "A minority makeup artist who works at Ulta — we would still want people to visit her at Ulta to support her because that provides money, and maybe one day she'll make enough to branch out on her own."

This tier exists because the MWM ecosystem doesn't just support business owners — it supports TALENT.

---
*Source: MWM_Community_Professional_Tier_Spec_1786173291728.pdf — August 8, 2026*
*Not to be implemented until "Please implement." authorization phrase is used.*
