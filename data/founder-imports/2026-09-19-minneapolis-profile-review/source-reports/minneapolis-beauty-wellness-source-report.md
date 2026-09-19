# Minneapolis–St. Paul Beauty & Wellness — Research Report

## Scope and approach

This research covers **one category only: Minneapolis beauty and wellness**. The work focused on premium-oriented hair care, scalp and natural-hair services, salons, nail services, spas, skincare, massage, and related wellness offerings within Minneapolis, Saint Paul, and clearly Minneapolis–St. Paul metro locations. The stated voluntary discovery preference was used only to prioritize useful beauty and wellness service categories and public source leads. No further identity, health, financial, quality, accessibility, price, licensing, language, or offering assumptions were made about any person or business.

A record was accepted only when the review located both (1) explicit Black, Latino, or diaspora-related evidence from a credible public directory or a business’s own public statement, and (2) a working customer-facing official website, booking page, or official social profile. Candidate addresses favor an official-site confirmation when it differs from a directory profile. All entries are research leads, not endorsements.

## Results

The candidate file contains **11** source-backed records. The held file contains **17** incomplete or conflicting leads that were intentionally excluded from candidates. `#FACE Facial Bar & Lounge` is marked `regulated_review` because its official site expressly describes licensed AP Estheticians; the package does not independently validate credentials. Other service businesses were not elevated to regulated-review status unless the opened source stated such a credential.

## Public sources opened and used

| Source | Role in research | URL |
|---|---|---|
| Sadiaa Black Beauty Guide | Explicit Black-owned beauty directory evidence; service, address, contact, and linked official destinations for many salon, natural-hair, and product leads | [Minnesota index](https://www.sadiaa.com/minnesota) |
| Minnesota Black-Owned Business Directory | Explicit Black-owner evidence and local wellness/scalp-care leads | [Health & beauty index](https://mnblackbusiness.com/listing-category/health-beauty/) |
| ClassPass public studio listing | Public Black-owned and woman-owned designations plus address/contact for MŌV SKYN | [MŌV SKYN listing](https://classpass.com/studios/mv-skyn-minneapolis) |
| MN Latinos directory | Explicit Latina-woman-owned spa-and-salon lead; retained in held because the linked official domain was parked | [Ambiance Spa & Salón](https://mnlatinos.com/latino-businesses/united-states/minnesota/burnsville/personal-care/ambiance-spa-salon/) |
| Latino Chamber of Commerce Minnesota | Chamber directory lead for a Minneapolis salon; retained in held for lack of a business-owned customer destination and no direct ownership statement | [Latino Beauty Salon](http://latinochambermn.chambermaster.com/list/member/latino-beauty-salon-minneapolis-428) |
| Business-owned public sites and booking pages | Customer-facing confirmation of services, contact points, social profiles, and/or addresses | Examples include [FACE](https://www.faceoflelas.com/), [Dimensions In Hair](https://dimensionsinhairsalon.com/), [Hayat Beauty Salon](https://www.hayatbeautysalon.com/), [Healing by Lauryn](https://www.healingbylauryn.com/), and [Nature’s Syrup Beauty](https://www.naturessyrupbeauty.com/). |

Each accepted JSONL row preserves its specific directory or official source in `sourceUrl`. Its usable customer destination appears in `website` and/or one of the social fields. Source pages and, where available, official customer destinations were opened and read; search-result snippets alone were not used as support for accepted records.

## Dedupe and normalization checks

Names were deduplicated case-insensitively within the category, and each candidate `sourceRow` is consecutive from 1 through 11. The review merged neither distinct businesses sharing a building nor similarly branded listings without matching official customer destinations. Potential duplicate/stale representations were handled conservatively: `VIP Hair & Nail Salon` was retained once even though it appears in multiple Black-business sources; `Nature’s Syrup Skin and Hair Care` was normalized to the current official-shop branding, **Nature’s Syrup Beauty**; and Malobe’s official Midtown Global Market address was preferred over the different address shown on its directory profile. Earth’s Beauty Supply was held rather than treated as an unverified duplicate of its separately listed branch locations.

## Limitations and held-lead rationale

Public directory data can be stale. Several otherwise relevant leads were held because an official site would not resolve, the directory lacked an official website or social destination, an official site did not confirm a location/service representation, or an address conflicted with other public information. The held file records the source-supported details and precise neutral reason for exclusion so that a later reviewer can recheck them. Being held does **not** mean a business is closed, unqualified, unsafe, unlicensed, or not owned by the identity designation shown in its source.

This package does not infer ownership, demographic identity, hours, quality, accessibility, pricing, licensing, language, or offerings from a business name, imagery, or other unsupported cue. Addresses are sourced public business locations only; no coordinates were produced and no geocoding was performed.

## Research-only statement

This was **research only**. No production database, API, map pin, geocoding, deployment, authentication, users, sessions, payments, or waitlist records were changed.

## Files

| File | Contents |
|---|---|
| `candidates-beauty-wellness.jsonl` | 11 accepted, source-backed candidate records with exactly 23 fields in prescribed order |
| `held-beauty-wellness.jsonl` | 17 incomplete, conflicting, or unsupported leads retained for follow-up rather than candidate inclusion |
| `report-beauty-wellness.md` | This methodology, source, validation, limitation, and change-control report |
