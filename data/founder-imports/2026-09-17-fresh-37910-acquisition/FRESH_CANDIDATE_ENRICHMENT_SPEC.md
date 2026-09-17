# Fresh business acquisition and enrichment specification

## Objective

Every fresh candidate should contribute enough verified public information for **Map**, **Find a Business**, and **KinfolkAI** to make a useful recommendation. A listing is not a search result simply because it has a name. The record must carry a truthful public identity, location, contact destination, services, and source provenance.

This specification applies to the new 37,910-business target. It does not authorize changes to authentication, waitlist, user accounts, existing business claims, or community-comment functionality.

## Required eligibility fields

A fresh `business` candidate must have all of the following before it can count toward the target:

| Field | Requirement | Search and recommendation use |
|---|---|---|
| Legal/display name | Publicly displayed business name | Exact name and typo-tolerant search |
| Exact public address | Street address, city, region, postal code when published, country | Address review, geocoding, Map pin, nearby ranking |
| Active public destination | A currently operating official website or official attributable public social account | Profile action and ongoing verification |
| Official social presence | At least one attributable Instagram, Facebook, TikTok, YouTube, LinkedIn, or comparable official account | Profile link, current-activity evidence, community sharing |
| Source URL and source name | Public source supporting the candidate facts | Audit trail and review |
| Category and subcategory | Evidence-based category, never inferred from ownership | Directory filters and Kinfolk retrieval |
| Service/search terms | Specific public services, brands, specialties, and natural-language aliases | “Braider near me,” “pediatric dentist,” “late-night vegan food,” and typo search |
| Active-status evidence | A recent official/public destination with no closure evidence | Prevents obsolete map pins |

A business cannot be counted from a historical list, general directory, or social mention alone. A public directory can be a discovery lead, but the row requires a separate attributable destination and an address review.

## Capture when the public source supports it

| Field group | Examples | Kinfolk and UI value |
|---|---|---|
| Contact | Public phone, email, booking URL, official website, verified social links | “Call,” “Book,” website/social actions |
| Operating details | Business hours, holiday hours, appointment-only flag, delivery/pickup, walk-in availability, price range | Answers “open now,” “can I walk in,” “is this affordable” |
| Family and accessibility | Ages served, child care licenses where published, bilingual/multilingual services, wheelchair accessibility, sensory/access needs, family-friendly details | Answers “bilingual day care,” “wheelchair-accessible dentist,” “place for toddlers” |
| Service details | Hair textures/services, cuisine, professional specialties, insurance/payment types where public, emergency service, mobile service flag | Precise recommendation and VIBES matching |
| Location details | Latitude/longitude only after guarded geocoding, neighborhood, parking/transit, service area, location type | Map pin and distance ordering |
| Profile context | Description, photos/video URLs only when permitted, public brand story, languages, locally documented cultural specialty | Helpful profile and grounded recommendation context |
| Trust/provenance | Source URL, source date, official-destination confirmation, regulated-profession flag, licensing evidence URL where public | Review, claims, and transparent safety boundary |

Unknown fields remain blank. The process must not guess a phone number, hours, price, languages, accessibility feature, license, ownership, or service from a name, image, directory category, neighborhood, or review.

## Identity and designation policy

The platform may store and filter **voluntary, self-described, or explicitly documented** ownership and community designations, including intersections where the source supports them. Examples may include Black-owned, Hispanic/Latino-owned, African-owned, Caribbean-owned, woman-owned, veteran-owned, disability-owned, LGBTQIA+-owned, Divine Nine affiliation, or cultural specialties. These are optional attributes with separate evidence URLs.

The platform must **not** apply a blanket default exclusion or removal based solely on ethnicity, race, nationality, gender, disability, religion, or LGBTQIA+ status. Members may use transparent, voluntary, self-described filters to support businesses they choose. A requested combination, such as Black-owned and woman-owned or an explicitly documented Divine Nine affiliation, must be matched only where each designation has source evidence; the app must not infer it.

## Record-type policy

| `target_kind` | Destination |
|---|---|
| `business` | Find a Business, Map after geocoding, Kinfolk business recommendations, business profile |
| `community_resource` | Resources/Library and resource-specific Kinfolk answers; not a commercial business pin |
| `cultural_place` | Discovery/Library cultural layer; not a commercial business pin |
| `manual_review` | Held until a reviewer determines the correct type and evidence |

## Publication gates

1. **Deduplicate first** against the production database by normalized name, street address, city, phone, aliases, and owner claim data.
2. Route an existing match with a newly confirmed address to **address enrichment review**, never a duplicate create.
3. Hold regulated services—medical, dental, child care, legal, financial, construction/HVAC, real estate, and comparable fields—for evidence/credential review.
4. Geocode only a reviewed public business address. Reject low-confidence matches, city centroids, private homes, and zero coordinates.
5. Run source-link health checks, retain social-only listings with an official social destination, and do not show a directory source as the business website.
6. Publish approved businesses to the shared production API so website, iOS, and Android use the same record; publish resources and cultural places only through their designated surfaces.

## Deferred work

Community comments, user-generated business tags, and new commenting permissions are deferred. They should be added only after the business inventory pipeline and abuse/reporting controls are production-tested.
