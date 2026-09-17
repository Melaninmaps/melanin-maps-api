# Directory candidate type separation policy

## Purpose

KinfolkAI should help a member find both businesses and community help without presenting a community resource as a commercial business. This policy applies to existing listings, domestic/international research candidates, Map, Find a Business, Resources, Library, and KinfolkAI recommendations.

## Canonical record types

| Record type | Examples | Primary surfaces | Map behavior |
| --- | --- | --- | --- |
| `business` | Restaurant, braider, day care, laundromat, dentist, attorney, HVAC company, pharmacy, grocery, retailer, nightlife venue | Find a Business, Map, KinfolkAI business recommendations, business profile | Address-backed public business pin after review and geocoding |
| `community_resource` | Food pantry, nonprofit referral service, community center, public benefit navigator, free clinic, legal-aid organization, workforce service | Resources, Library, KinfolkAI resource answers | A resource location may be shown only in a dedicated Resource/Community layer, not as a commercial business pin |
| `cultural_place` | Museum, monument, cultural center, historic site, arts institution | Discovery, Library, Cultural Heritage Explorer | Dedicated cultural-place layer |
| `event` | Festival, market, pop-up, performance, temporary gathering | Events or Library Community Updates | Never converted into a permanent business pin |

## Classification requirement

Every research candidate must receive a `target_kind` before staging. A row may be published only to its matching record type. The publication path must not infer type from ownership designation, neighborhood, image, or name.

A child-care center, school, clinic, dentist, law office, laundromat, salon, restaurant, grocery, or trades company is generally a `business` when it has a commercial public listing. A nonprofit, public agency, community center, referral line, or free service is generally a `community_resource`. A nonprofit with a separately operating retail shop must have distinct records only when public sources establish distinct names, addresses, and purposes.

## Search behavior

A general request such as “find a braider near me” searches `business` only. A question such as “where can I get food assistance near me?” searches `community_resource` first, then may offer relevant businesses only after a clear user choice. A member can explicitly select **Businesses**, **Resources**, or **All help** in the search interface. The result card must label the returned record type.

## Safeguards

An address alone does not make a record map-ready. A commercial business requires public-address review, duplicate matching, a current destination, and address-backed geocoding. A resource requires source review and its own display policy. Existing matching businesses with a newly confirmed public address enter an `address_enrichment` review queue; they are not recreated as new listings.

Authentication, waitlist, business claims, existing business routes, and notification delivery are outside this policy and remain unchanged.
