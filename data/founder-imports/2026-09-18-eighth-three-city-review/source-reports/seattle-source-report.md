# Seattle and Nearby Puget Sound Communities — Source Report

## Scope and method

This is one **research-only directory wave** for Seattle and nearby Puget Sound communities in Washington. It selected a modest, mixed set across culture, community services, professional services, retail, and food—not a restaurant-heavy list. Every retained record has a public HTTP(S) evidence URL and an official customer-facing website or official social destination. Physical businesses and cultural places have numbered street addresses; the single mapless community-resource record explicitly identifies Kent and has a current public service/contact destination. No coordinates, pins, route links, directions data, or inferred facts were created.

The inclusion basis comes from the Urban League of Metropolitan Seattle’s Black Business Directory and Visit Seattle’s official Latino/a/x community guide, then each retained candidate’s customer-facing first-party destination was opened and checked. Chamber membership and directory listing were used only as inclusion context, not as an ownership certification; designations are recorded only where the publisher or the business supplied them. A feasible exact duplicate check was run against all 2,646 parseable JSONL rows under `/home/ubuntu/directory-research-wave-2026-09-18/` outside this Seattle output directory using normalized name + city + state + address (or name + city + state for the mapless resource); no match was found for any retained candidate. Existing local files had zero malformed JSONL lines.

## Inspected URLs and support

| # | Inspected URL | Source / purpose | Support or result |
|---:|---|---|---|
| 1 | https://urbanleague.org/black-business-directory/ | Urban League of Metropolitan Seattle — Black Business Directory | Opened. Source directory describes more than 150 local Black-owned businesses, says listings are re-vetted annually, and supplies the cited records, category context, many addresses, websites, and/or official social links. It is the inclusion source for Black Heritage Society, Arte Noir, FMS Global Strategies, Ahadu Ethiopian Restaurant, Noir Lux Candle Co., Kent Black Action Commission, and held records Lavender Rights Project and P.31 Label. |
| 2 | http://www.bhswa.org | Black Heritage Society first-party site | Opened. Confirms public heritage/archive purpose, official destination, appointment visit address, phone, and nonprofit status. |
| 3 | https://www.artenoir.org/ | Arte Noir first-party site | Opened. Confirms gallery/gift-shop visitor destination, address, and official Instagram/Facebook links. |
| 4 | https://www.fmsglobalstrategies.com/ | FMS Global Strategies first-party site | Opened. Confirms client-facing public-affairs destination and the business’s Black-owned/woman-led designation. |
| 5 | https://www.ahadu-ethiopian-restaurant.net/ | Ahadu first-party site | Opened. Confirms restaurant customer destination, Seattle street address, dining/takeout/catering pages, and official Instagram/Facebook links. |
| 6 | https://noirluxcandleco.com/ | Noir Lux first-party shop | Opened. Confirms shop/scent-bar destination, Belltown numbered street address, and official Instagram/Facebook links. |
| 7 | https://p31label.com | P.31 Label first-party site attempt | Opened attempt failed because hostname could not be resolved to public IPs; record is held. |
| 8 | https://www.lavenderrightsproject.org/ | Lavender Rights Project first-party site | Opened. Confirms Seattle-based organization, legal advocacy, supportive housing, community work, official social links; held for regulated-service scope/provider sufficiency. |
| 9 | https://visitseattle.org/things-to-do/arts-culture/cultural-heritage/latino/support-for-seattles-latino-a-x-community/ | Visit Seattle official Latino/a/x community guide | Opened. Names Intentionalist business listings and cultural/community organizations used here: Sea Mar Museum, Nepantla Cultural Arts Gallery, Casa Latina, Entre Hermanos, and Seattle Latino Film Festival. |
| 10 | https://seamarmuseum.org/ | Sea Mar Museum first-party site | Opened. Confirms cultural-museum visitor destination, Seattle street address, and public contact. |
| 11 | https://www.nepantlaculturalarts.com/ | Nepantla first-party site | Opened. Confirms gallery/gift-shop visitor destination, Seattle street address, and official social links. |
| 12 | https://kentblackactioncommission.org/ | Kent Black Action Commission first-party site | Opened. Confirms Kent, Washington identification, public mission/contact destination, and official Facebook link; used as mapless community resource because no numbered street address is published. |
| 13 | https://casa-latina.org/ | Casa Latina first-party site | Opened. Confirms nonprofit public-service destination, stated mission, public program pages, and official social links. |
| 14 | https://casa-latina.org/contact/ | Casa Latina first-party contact page | Opened. Directly confirms the 317 17th Avenue South, Seattle, WA 98144 street address and the Day Worker Center phone used in the candidate. |
| 15 | https://casa-latina.org/our-work/ | Casa Latina first-party public program page | Opened. Confirms the employment, education, and community-organizing descriptions used in the candidate. |
| 16 | https://casa-latina.org/wp-content/uploads/2025/08/seattleMembership2025.pdf | Casa Latina first-party membership information | Opened. Confirms a current public membership/service document; it was not used as the address source. |
| 17 | https://entrehermanos.org/ | Entre Hermanos first-party site | Opened. Confirms Seattle public-service destination, street address, phone, stated mission, and official social links. |
| 18 | https://www.slff.org/ | Seattle Latino Film Festival first-party site | Opened. Confirms official festival destination and mission but supplies only a PO Box for the organization; held for missing qualifying permanent street address. |
| 19 | https://intentionalist.com/black-owned-small-businesses/ | Intentionalist directory overview | Opened. Describes its Black-owned small-business directory; background only, no individual record retained from this page. |
| 20 | https://intentionalist.com/map/ | Intentionalist directory overview | Opened. Describes business listings; background only, no individual record retained from this page. |
| 21 | http://www.elcentrodelaraza.org/ | El Centro de la Raza first-party destination attempt | Opened but returned 403 Forbidden. No record created. |
| 22 | https://kreativekonscious.com/ | Kreative Konscious Apparel first-party destination attempt | Opened but no extractable public content was returned. No record created. |
| 23 | https://www.fmsglobalstrategies.com/contact-us | FMS Global Strategies first-party contact page | Opened. Confirms a public client contact destination and Washington location list; its street address in the retained record remains sourced to the Urban League directory. |

## Retained and held counts

| Outcome | Count | Detail |
|---|---:|---|
| Retained candidates | 10 | Written to `candidates.jsonl`; all parse as JSON and use all requested source-pass fields. |
| Held candidates | 3 | Written to `held-candidates.jsonl`; intentionally not promoted. |
| Inspected URLs | 23 | Every URL above was opened/inspected; failed/forbidden attempts are disclosed. |

### Retained counts by target kind

| Target kind | Count |
|---|---:|
| business | 3 |
| community_resource | 3 |
| cultural_place | 4 |

### Retained counts by category

| Category | Count |
|---|---:|
| arts_culture | 4 |
| community_services | 3 |
| food_and_drink | 1 |
| professional_services | 1 |
| retail | 1 |

## Limitations and holds

Public directories and websites can be incomplete, stale, or change after review. This pass does **not** establish current operating status, ownership beyond directly quoted publisher/business designations, eligibility, staff credentials, licensing, availability, price, hours, languages, accessibility, health outcomes, services beyond the cited description, or quality. It does not assert an identity for any business beyond a source’s exact designation. It does not create or provide coordinates, map pins, routing, or directions data.

Lavender Rights Project is held because its legal-advocacy description requires manual review for regulated-service handling. P.31 Label is held because the official site could not resolve during this research, even though an official Instagram URL is present in the directory. Seattle Latino Film Festival is held because its official site supplies a PO Box and event venue rather than the qualifying fixed numbered street address required for a retained cultural place. El Centro de la Raza was not included because its first-party site returned 403 Forbidden during review.

## Publication and systems safeguard

**Research only: not staged and not published.** No repository, application code, database, public API, account, authentication/login system, user record, waitlist, deployment, production system, or external write endpoint was accessed or modified. The only output is these three UTF-8 local files in the requested Seattle directory.
