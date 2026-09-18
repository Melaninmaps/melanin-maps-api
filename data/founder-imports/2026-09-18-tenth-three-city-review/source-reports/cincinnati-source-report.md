# Cincinnati and Nearby Southwest Ohio Source Report

## Scope and disposition

This is **research only** for Cincinnati and nearby Southwest Ohio communities. It was **not staged, not published, and no external write was made**. The retained file contains six source-backed records with a public source URL, a specific official customer-facing website, and—where physical—a numbered street address. The held file records seven leads that were not promoted because a destination, address, locality, or contact detail could not be responsibly resolved.

A feasible exact duplicate check was run across every existing local JSONL file under `/home/ubuntu/directory-research-wave-2026-09-18/`, using normalized `name + city + state + address`. It returned **zero full-key matches** for the six retained rows. The check did not use geocoding, create coordinates, create pins, or generate directions data.

## Counts

| File / disposition | Count by target kind | Count by category |
| --- | ---: | --- |
| Retained candidates | business: 2; cultural_place: 1; regulated_review: 1; community_resource: 2 | personal_care: 1; arts_and_culture: 1; retail: 1; family_services: 1; community_and_civic: 2 |
| Held candidates | manual_review: 7 | food_and_drink: 1; professional_services: 1; arts_and_culture: 2; event_services: 1; education: 1; youth_services: 1 |
| Inspected unique URLs | 25 | 25 URLs enumerated below |

## Inspected sources and support

| # | Inspected URL | What was inspected and how it was used |
| ---: | --- | --- |
| 1 | https://www.cincinnati-oh.gov/noncms/council/businessdirectory/index.cfm | **Used.** City of Cincinnati’s public Black Business Directory. It supplied public listings and, for this pass, the street/contact/website leads for Originalitees and Red Brick Childcare; it also surfaced the held address/destination conflicts for Blush, The STEM Lab, and Winton Place Youth Center. Directory listing was treated as source basis, **not** ownership certification. |
| 2 | https://theaachamber.com/thedirectory/ | Inspected; a cookie/security interstitial blocked directory contents in this environment. Not used for a member record. |
| 3 | https://business.hispanicchambercincinnati.com/list/ | Inspected; public directory landing page displayed local Hispanic Chamber category structure but no individual record was extracted. Used as chamber-directory context only. |
| 4 | https://thevoiceofblackcincinnati.com/black-owned-businesses/ | **Used for directory context.** The publisher describes this as a Greater Cincinnati local Black-owned-business database. It was not used alone for a retained row. |
| 5 | https://theaachamber.com/ | Inspected; a cookie/security interstitial blocked the home-page contents. The chamber record instead relies on the official State of Ohio page below. |
| 6 | https://thevoiceofblackcincinnati.com/black-owned-business/1-smokin-ash-hole/ | **Used for held lead.** Supplied address/phone and publisher-described Black-owned designation, but no working official customer destination was established. |
| 7 | https://thevoiceofblackcincinnati.com/black-owned-business/1st-choice-print/ | **Used for held lead.** Supplied publisher-described Black-owned designation, address, and older phone; the phone conflicts with the official site. |
| 8 | https://thevoiceofblackcincinnati.com/black-owned-business/a-mirage-beauty-salon/ | **Used.** Supplied A Mirage’s address, phone, hair-salon category, official website, and publisher-described Black-owned designation. |
| 9 | https://thevoiceofblackcincinnati.com/black-owned-business/a-r-t-art-resource-team/ | **Used for held lead.** Supplied direct publisher designation and contact information, but its Wyoming locality wording conflicts with the official site’s Cincinnati locality label. |
| 10 | https://thevoiceofblackcincinnati.com/black-owned-business/cincinnati-black-theatre-company/ | **Used.** Supplied theatre address, phone, official website, and publisher-described Black-owned designation. |
| 11 | https://www.1stchoiceprint.com/ | Inspected official commerce site; confirmed the Carthage Avenue location and a customer ordering destination, but its phone differs from the community listing. |
| 12 | https://amiragebeautysalon.com/ | **Used as first-party confirmation.** Confirmed a customer-facing salon destination and the listed phone; supplied no address on the inspected page. |
| 13 | https://www.artresourceteam.com/ | Inspected official gallery/commerce site; supplied the same street address and phone but labeled it Cincinnati, unlike the community listing’s Wyoming wording. Held rather than resolving that discrepancy. |
| 14 | https://cincinnatiblacktheatre.org/ | **Used as first-party confirmation.** Confirmed public theatre programs and the retained street address/phone. |
| 15 | https://www.instagram.com/2smokinashholes/ | Inspected; rendered “Profile isn't available.” This is why 1 Smokin Ash Hole remains held. |
| 16 | https://development.ohio.gov/wps/portal/gov/development/business/minority-business/mbac/hamilton | **Used.** Official State of Ohio listing for Greater Cincinnati African American Chamber of Commerce; supplied its street address, phone, official website, and business-advocacy context. |
| 17 | https://www.sucasa.org/ | Inspected after discovery but excluded: it identifies a Chicagoland real-estate developer and is outside the assigned locale. |
| 18 | https://cincy-cinco.com/ | **Used for held lead.** First-party festival site identifies the cultural event and Fountain Square as the place, but no numbered street address is supplied for the actual venue. |
| 19 | https://hccusa.us/ | **Used.** First-party Hispanic Chamber Cincinnati USA site; supplied street address, phone, member-directory destination, and its stated Hispanic/Latino business-community mission. |
| 20 | https://www.originalitees.com/ | **Used as first-party confirmation.** Public retail store was inspected for a specific customer shopping destination and links to its official Facebook and Instagram pages. |
| 21 | https://www.blushcincy.com/ | **Used for held lead.** Official venue site reports 815 Race St., conflicting with the municipal directory’s 345 West Fourth Street. |
| 22 | https://blossomsfloristinc.com/ | Inspected; hostname did not resolve to public IP addresses in this environment. No record retained from this source. |
| 23 | https://www.cincystemlab.com/ | **Used for held lead.** Official site gives its current Woodburn Avenue contact and public programs, conflicting with the municipal directory’s Sharonville address. |
| 24 | https://www.redbrickchildcare.com/ | **Used as first-party confirmation.** Confirmed Red Brick’s same street address/phone, public enrollment destination, Facebook link, and business-described Ohio licensure statement with an ODJFS link. It is classified `regulated_review`; no independent license-status conclusion was made. |
| 25 | https://www.facebook.com/CincyCinco/ | Inspected official festival social destination; it rendered only a minimal “See more from Cincy-Cinco” response and did not resolve the official-site venue-address gap. |

## Limitations and handling rules applied

This pass relies on public web content opened and inspected on September 18, 2026. Public directories can contain stale submissions; first-party websites can also change. Accordingly, the data does **not** assert current hours, availability, prices, accessibility, language capability, licensing status, health outcomes, ownership beyond direct publisher/business wording, or operational status. Black Business Directory placement is not treated as ownership certification. No protected trait or service detail was inferred.

Where sources conflicted, the lead was held rather than selecting a value by inference. The Cincy-Cinco organizer contact address was not substituted for its Festival venue; the A.R.T. locality was left null; and no non-numbered, postal, or inferred addresses were promoted. The source security interstitials and unresolved domains described above limit independent destination verification. This is a small, mixed-category **source pass**, not an exhaustive Cincinnati directory.
