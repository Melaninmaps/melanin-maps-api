# MWM Database Seeding Instructions: Tour Guides 1, 2, and 3

**Source:** Founder seeding specification — Aug 7, 2026  
**Status:** ACTIVE — This defines exactly how all guide content becomes map pins.

---

## Section 1: Scope and Scale

Seeding from three cultural guide documents covering 53 cities:

| Guide Document | Cities | Min. Addressed Entries | Min. Total Named Entities |
|---|---|---|---|
| Part 1 (Tour — East Coast) | 5 | 82 | 242+ |
| Part 2 (Tour — South + Satellites) | 12 | 189 | 478+ |
| Part 3 (Expansion) | 36 | 258 | 597+ |
| **Total** | **53** | **529** | **1,317+** |

**Rule: If it is in the guide, it gets a pin. No exceptions.**

The 1,317 figure is a conservative floor. Many businesses are embedded in prose paragraphs and will not be captured by a simple address-line scan. Both structured and prose-format entries must be parsed.

---

## Section 2: Entity Types to Seed

1. **Cultural Sites & Heritage Landmarks** — museums, historic homes, monuments, civil rights landmarks, historic churches
2. **Diaspora-Owned Businesses** — restaurants, cafes, bookstores, salons, markets, distilleries, galleries, retail shops (both prose and table format)
3. **Farmers Markets, Flea Markets, Community Markets** — each weekly location gets its own pin
4. **HBCUs** — at minimum: Tuskegee, Howard, Spelman, Morehouse, Clark Atlanta, Dillard, Fisk, Tennessee State, Texas Southern, Southern University, Shaw, Johnson C. Smith, Virginia Union, Benedict, Allen, NC Central, Saint Augustine's, Norfolk State, Morgan State, Alabama State, Miles, Bishop State Community, LeMoyne-Owen, Jackson State, Tougaloo, Paul Quinn, St. Philip's, Meharry Medical
5. **Heritage Districts and Historic Neighborhoods** — use central coordinate or intersection; seed as heritage_district
6. **Murals and Public Art** — any named mural or public artwork
7. **Community Organizations** — chambers of commerce, cultural centers, NAACP/Urban League chapters

---

## Section 3: Data Schema

```json
{
  "name": "String — exact name as written in guide",
  "description": "String — exact description from guide (default until owner claims)",
  "address": "String — see Section 4 address resolution rules",
  "approximate_location": "Boolean — true if neighborhood/district, false if street address/intersection",
  "city": "String — from city section header",
  "state": "String — two-letter state code",
  "pin_type": "Enum — see Section 5",
  "culturalCommunity": "String — see Section 5 for valid tags",
  "externalUrl": "String (optional)",
  "visit_tip": "String (required for churches, markets, HBCUs, barbershops, beauty salons, soul food restaurants, community bookstores, cultural gathering spots)",
  "listing_status": "Enum — live_unclaimed (Philadelphia only) | staged (all other cities)",
  "data_source": "MUST be exactly 'manus_tour_guide' for every record"
}
```

---

## Section 4: Address Resolution Rules

| Situation | Address Value | approximate_location |
|---|---|---|
| Full street address provided | Use exactly as written | false |
| Neighborhood name only | Use neighborhood name | true |
| District with boundaries | Use most recognizable intersection or central point | true |
| Intersection (e.g., "6th and Market Streets") | Use intersection exactly | false |
| Online/By Appointment business | Use city + neighborhood | true (+ note in description) |
| Farmers market with multiple locations | Create SEPARATE pin for each location | per above |

---

## Section 5: Pin Types and Cultural Community Tags

### pin_type values (exactly one per pin):
| pin_type | Applies To |
|---|---|
| `cultural_site` | Museums, historic sites, monuments, civil rights landmarks |
| `heritage_landmark` | Historic churches, cemeteries, historic buildings |
| `business` | Restaurants, cafes, shops, salons, distilleries, galleries |
| `market` | Farmers markets, flea markets, cultural markets, night markets |
| `HBCU` | University campuses |
| `heritage_district` | Historic neighborhoods, cultural corridors, named districts |
| `mural_or_public_art` | Murals, sculptures, public monuments |
| `park_or_outdoor` | Parks, gardens, waterfront areas, outdoor landmarks |

### culturalCommunity valid tags:
`"Black-owned"`, `"Ethiopian-owned"`, `"Somali-owned"`, `"West African-owned"`, `"Ghanaian-owned"`, `"Nigerian-owned"`, `"Senegalese-owned"`, `"Hispanic-owned"`, `"Mexican-owned"`, `"Colombian-owned"`, `"Puerto Rican-owned"`, `"Venezuelan-owned"`, `"Trinidadian-owned"`, `"Jamaican-owned"`, `"Caribbean-owned"`, `"Brazilian-owned"`, `"Filipino-owned"`, `"Vietnamese-owned"`, `"Korean-owned"`, `"Cambodian-owned"`, `"Lebanese-owned"`, `"Palestinian-owned"`, `"Yemeni-owned"`, `"Indigenous-owned"`, `"Dominican-owned"`, `"Haitian-owned"`

For cultural sites, HBCUs, heritage landmarks that are not businesses: use `"Black cultural heritage"`

---

## Section 6: Visit Tip — Kinfolk Voice

Required for: all `heritage_landmark` (especially churches), all `market`, all `HBCU`, barbershops, beauty salons, soul food restaurants, community bookstores, cultural gathering spots.

**Voice:** Direct, warm, specific. Never Yelp-style. One or two sentences. Reference time of day/week when cultural energy is highest.

| Venue Type | Template |
|---|---|
| Historic Black church | "Sunday mornings are when this community comes alive — arrive early and you'll feel the spirit before the service starts." |
| Farmers market / community market | "Saturday mornings are the heartbeat — get there by 9am before the best produce is gone." |
| Barbershop / beauty salon | "Saturday mornings are community gathering time — the conversations are as good as the cuts." |
| Soul food restaurant | "The lunch rush (11:30am-1pm) is when you see the real community. Come at 2pm if you want to talk to the owner." |
| Coffee shop near HBCU | "Best visited weekday mornings 8-10am when students and creatives gather before class." |
| Historic district / mural | "Walk it in the morning when the light hits the murals just right." |
| HBCU campus | "Come during the school year and walk the yard — the energy of a historically Black campus on a weekday morning is something you have to feel." |
| Civil rights museum / memorial | "Give yourself more time than you think you need — this history will stop you in your tracks." |

**Do NOT:** write operating hours, use generic tourism language ("A must-see for history buffs"), reference prices.

---

## Section 7: Phased Seeding by City Status

| City Group | Cities | listing_status |
|---|---|---|
| Live | Philadelphia, PA | `live_unclaimed` |
| Tour Cities (Part 1) | Washington DC, Richmond VA, Raleigh/Durham NC, Charlotte NC | `staged` |
| Tour Cities (Part 2) | Columbia SC, Atlanta GA, Montgomery AL, Birmingham AL, Mobile AL, Baton Rouge LA, New Orleans LA, Houston TX | `staged` |
| Satellite Cities | Allentown PA, Abington/Willow Grove PA, Harrisburg PA, Chicopee MA | `staged` |
| Expansion Cities (Net-New) | Newark NJ, Boston MA, Hartford CT, Orlando FL, Milwaukee WI, Minneapolis/St. Paul MN, San Antonio TX, Denver CO, Phoenix AZ, Las Vegas NV, Seattle WA, Portland OR | `staged` |
| Expansion Cities (Enhance mode) | NYC, Baltimore, Jacksonville, Miami, Savannah, Nashville, Memphis, Chicago, Detroit, Cleveland, St. Louis, Indianapolis, Dallas/Fort Worth, Los Angeles, Oakland/Bay Area, Kansas City, Tulsa, Jackson MS, Tampa, Charleston, Tuskegee, Columbus, Cincinnati, Norfolk | Deduplicate first, then seed net-new as `staged` |

---

## Section 8: Deduplication Rules

- Cross-reference against existing 151 cultural sites before inserting
- Match by: **name + city** (case-insensitive)
- If match found: **do NOT duplicate** — instead update description (if guide's is richer), add `visit_tip`, verify `culturalCommunity`, append `"manus_tour_guide"` to `data_source`
- Part 3 "ALREADY IN CODEBASE" cities carry highest duplicate risk — treat all entities as potential duplicates first

---

## Section 9: Per-City Minimum Targets

### Part 1 — East Coast Tour:
| City | Min. Addressed | Min. Total Named |
|---|---|---|
| Philadelphia, PA | 10 | 55 |
| Washington, DC | 12 | 55 |
| Richmond, VA | 10 | 37 |
| Raleigh/Durham, NC | 25 | 54 |
| Charlotte, NC | 25 | 41 |

### Part 2 — Southern Tour + Satellites:
| City | Min. Addressed | Min. Total Named |
|---|---|---|
| Columbia, SC | 12 | 48 |
| Atlanta, GA | 32 | 46 |
| Montgomery, AL | 12 | 57 |
| Birmingham, AL | 14 | 56 |
| Mobile, AL | 25 | 44 |
| Baton Rouge, LA | 27 | 40 |
| New Orleans, LA | 28 | 61 |
| Houston, TX | 27 | 39 |
| Allentown, PA | 12 | 28 |
| Abington/Willow Grove, PA | 0 | 16 |
| Harrisburg, PA | 0 | 16 |
| Chicopee, MA | 0 | 27 |

### Part 3 — Expansion (selected):
| City | Status | Min. Addressed | Min. Total Named |
|---|---|---|---|
| New York City, NY | Enhance | 8 | 18 |
| Newark, NJ | Net-new | 6 | 14 |
| Baltimore, MD | Enhance | 8 | 17 |
| Boston, MA | Net-new | 6 | 14 |
| Nashville, TN | Enhance | 8 | 18 |
| Memphis, TN | Enhance | 8 | 18 |
| Chicago, IL | Enhance | 6 | 14 |
| New Orleans, LA | Enhance | 28 | 61 |
| Los Angeles, CA | Enhance | 8 | 18 |
| Las Vegas, NV | Net-new | 8 | 20 |
| Seattle, WA | Net-new | 8 | 18 |

---

## Section 10: Example Records

### Cultural Site (Philadelphia, live):
```json
{
  "name": "The African American Museum in Philadelphia (AAMP)",
  "description": "Founded in 1976, AAMP is the first major museum of Black history built by a municipality in the United States...",
  "address": "701 Arch St, Philadelphia, PA 19106",
  "approximate_location": false,
  "city": "Philadelphia",
  "state": "PA",
  "pin_type": "cultural_site",
  "culturalCommunity": "Black cultural heritage",
  "externalUrl": null,
  "visit_tip": "Give yourself more time than you think you need — this history will stop you in your tracks.",
  "listing_status": "live_unclaimed",
  "data_source": "manus_tour_guide"
}
```

### Heritage Landmark / Church (Columbia SC, staged):
```json
{
  "name": "Zion Baptist Church",
  "description": "A historic church where Dr. Matilda Evans opened a free clinic for Black residents...",
  "address": "801 Washington St, Columbia, SC 29201",
  "approximate_location": false,
  "city": "Columbia",
  "state": "SC",
  "pin_type": "heritage_landmark",
  "culturalCommunity": "Black cultural heritage",
  "externalUrl": null,
  "visit_tip": "Sunday mornings are when this community comes alive — arrive early and you'll feel the spirit before the service starts.",
  "listing_status": "staged",
  "data_source": "manus_tour_guide"
}
```

### HBCU (Columbia SC, staged):
```json
{
  "name": "Benedict College",
  "description": "Founded in 1870 originally to train Black teachers and ministers...",
  "address": "1600 Harden St, Columbia, SC 29204",
  "approximate_location": false,
  "city": "Columbia",
  "state": "SC",
  "pin_type": "HBCU",
  "culturalCommunity": "Black cultural heritage",
  "externalUrl": null,
  "visit_tip": "Come during the school year and walk the yard — the energy of a historically Black campus on a weekday morning is something you have to feel.",
  "listing_status": "staged",
  "data_source": "manus_tour_guide"
}
```

---

## Section 11: Verification Report Requirements

After seeding, report must include:
1. Total new pins added — broken down by city (overall ≥ 1,317)
2. Exact number identified as duplicates of existing 151 — skipped or merged
3. Count of pins flagged `approximate_location: true`
4. Sample of 5 generated `visit_tip` values from different cities/venue types
5. Full JSON of 5 diverse pins: one HBCU, one church, one restaurant, one market, one mural — from 5 different cities
6. If count falls >15% below per-city targets → flag discrepancy + identify missed sections

---

## Section 12: Special Cases

- **Sisterfriend Jewelry (Philadelphia):** `address: "West Philadelphia, PA"`, `approximate_location: true`, note online/by appointment in description
- **Crescent City Farmers Market (New Orleans):** 3 separate pins — Uptown (Tuesdays), Mid-City (Thursdays), City Park (Sundays)
- **Atlanta University Center:** One `heritage_district` pin + separate `HBCU` pins for Morehouse, Spelman, Clark Atlanta, Morehouse School of Medicine
- **President's House (Philadelphia):** "6th and Market Streets" is intersection → `approximate_location: false`
- **Historic Eden Cemetery:** City = "Collingdale", State = "PA" — NOT assigned to Philadelphia
- **Part 3 Cultural Phrases Taxonomy section:** Contains NO seedable pins — do not extract entities from it
- **Community orgs without storefronts:** Seed as `cultural_site` with city as address if no address provided
