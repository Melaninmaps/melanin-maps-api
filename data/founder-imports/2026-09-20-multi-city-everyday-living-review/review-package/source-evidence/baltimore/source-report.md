# Baltimore, Maryland Everyday-Life Research Source Report

## Scope and research boundary

This is a **research-only** everyday-life inventory for **Baltimore City and directly relevant nearby destinations** (including nearby Dundalk where the official towing source identifies a numbered location). It does not create, alter, geocode, pin, publish, suppress, or connect to any production directory or database. Both JSONL files contain **no coordinates**.

## Count reconciliation

| File / status | Count |
|---|---:|
| `candidates.jsonl` | 49 |
| `held-candidates.jsonl` | 2 |
| Total researched records | 51 |

### Candidate categories

| Category | Candidates |
|---|---:|
| arts_culture | 7 |
| beauty | 5 |
| difficult_day | 2 |
| employment_education | 3 |
| fitness | 1 |
| food | 11 |
| health | 7 |
| household_services | 2 |
| legal_financial | 2 |
| mobility | 3 |
| travel_day_trip | 3 |
| youth_family | 3 |


### Candidate target kinds

| Target kind | Candidates |
|---|---:|
| business | 23 |
| community_resource | 11 |
| cultural_place | 8 |
| online_service | 1 |
| regulated_review | 6 |


## Coverage and evidence notes

The candidate file covers **Black-owned food where directly declared**, diaspora-centered food and Hispanic/Latin American food, museums and cultural venues, live music/nightlife, youth ballet and gymnastics, family attractions, health screening and public-health resources, regulated medical/dental/behavioral and legal destinations, beauty/natural-hair/barber/spa offerings, gym/fitness, dry cleaning, household-repair assistance, auto repair/towing, job training, child-care help, food resources, utility-bill assistance, reentry-aware youth support, travel planning, lodging, and a day-trip historic site.

Food coverage includes official-customer-destination evidence for plant-based vegan soul food, New American/Southern-influenced dining and nightlife, Jamaican/Caribbean cooking, Venezuelan fine dining, Mexican taquerias/mezcal, Salvadoran food and pupusas, and South American/Mexican dining. **No price tier is inferred.** Where an official source provides an explicit price or positioning, it is retained in notes (for example, Alma’s “Fine Dining” label; ZIPS’ posted per-garment price is a household-service price, not a food claim). The inventory deliberately does not infer any owner identity. `ownershipDesignations` is populated only for The Land of Kush, BLK Swan, Alma Cocina Latina, and Clavel because a current source directly states “Black-Owned,” or Visit Baltimore’s named current guide expressly groups them as Black-owned or Latino/Hispanic-owned. All other ownership fields remain `null`.

Medical, dental, behavioral-health, and legal destinations are routed to `regulated_review`; this is an evidence classification, not a clinical, licensing, quality, or suitability finding. Candidate notes identify official eligibility, service, and access statements but do not assert individual provider qualifications. For difficult-day coverage, 211 Maryland is an intentionally unpinned `online_service` with its official free/confidential 24/7 referral statement; the Baltimore City Health Department source separately directs crisis support to 988 for 24/7 mental-health and substance-use help, including emergency counseling, local referrals, and mobile response teams.

## Discovery and official sources read

Discovery used reputable municipal, state, tourism, university/health-system, National Park Service, cultural organization, and official organization sources. Each candidate has a separate `sourceUrl` to an official customer destination or official government/organizational destination read before inclusion. Key source paths include:

| Source / role | URL |
|---|---|
| Baltimore tourism discovery: African American-owned dining | https://baltimore.org/what-to-do/african-american-owned-restaurants-in-baltimore/ |
| Baltimore tourism discovery: Latino & Hispanic-owned dining | https://baltimore.org/what-to-do/where-to-eat/latino-hispanic-owned-restaurants-in-baltimore/ |
| Baltimore museums discovery | https://baltimore.org/what-to-do/museums-attractions/ |
| Baltimore City Youth Opportunity Centers | https://www.baltimorecity.gov/moed/youth-opportunity-centers |
| Baltimore City Health Department | https://www.baltimorecity.gov/health |
| Baltimore City dental/oral-health services | https://www.baltimorecity.gov/health/our-work/health-clinics-services/dental-and-oral-health-services |
| Maryland Department of Labor career-center source | https://labor.maryland.gov/county/bacity/bacitytrainprog.shtml |
| Baltimore City water-bill assistance | https://www.baltimorecity.gov/publicworks/water-bill/water-bill-assistance |
| Baltimore City housing rehabilitation and repairs | https://www.baltimorecity.gov/dhcd/housing-rehabilitation-and-repairs |
| National Park Service Fort McHenry visitor source | https://www.nps.gov/fomc/ |
| 211 Maryland resource navigation | https://211md.org/ |

The `sourceUrl` column is the record-level audit trail and is the authoritative list of the individual official destinations read. The `ownershipEvidence` column retains the specific secondary tourism-guide attribution where a designation is included.

## Holds and limitations

| Held candidate | Reason held |
|---|---|
| La Cuchara | Its own official site says it is undergoing renovations after a fire and gives no reopening timeline. It is not treated as currently available. |
| Baltimore Yoga Village | The former-looking domain displays unrelated gambling content; no current verified official destination or numbered address was found. |

Limitations: Current-day menus, ticket prices, schedules, availability, insurance/eligibility, clinical intake, legal representation, and event age restrictions can change and must be confirmed directly with the named official source. Restaurants and venues may have temporary closures or service changes. The scope is broad rather than exhaustive, and categories with no sufficiently verified direct candidate were not padded. The held file contains leads deliberately excluded from candidates rather than treating ambiguity as evidence.

## Duplicate and overlap review

The Baltimore output folder contained **no pre-existing files** when checked, so no overlap with pre-existing Baltimore city research could be identified. Intra-sweep source overlap exists for a few notable food candidates: The Land of Kush and BLK Swan appear in the Visit Baltimore Black-owned guide and their official sites; Alma Cocina Latina and Clavel appear in the Visit Baltimore Latino/Hispanic guide and their official sites. Each such destination is represented only once in `candidates.jsonl`; the tourism guide is used only for attributed discovery/designation evidence, while the official customer destination remains the candidate source. No duplicate candidate names/addresses were written.

**Research-only statement:** These files are research artifacts only. They have not been used to connect to a database, publish a listing, create map pins, geocode destinations, or alter any repository or production record. They contain no coordinates.
