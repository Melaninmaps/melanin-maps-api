# Houston, TX Directory Research Wave — Source Report

**Scope.** This is one bounded, non-production research pass for **Houston, Texas and nearby suburbs**. It assembled physical candidates only when the retained row contains a public evidence URL, a numbered street address, city/state/country, a customer-facing official website or official social destination, and a source-supported category. It also separates community resources and cultural places. The output has **66 retained candidates** and **15 held records**.

## Source inventory

The following **40 directly inspected public URLs** were reviewed. Search-result snippets were used only for discovery; they are not included as evidence URLs in the candidate file. URLs below include pages that did not yield retained candidates, to document negative checks and holds.

- <https://business.houstonhispanicchamber.com/hhccmemberdirectory> — Houston Hispanic Chamber member directory landing; no member results exposed in text extraction.
- <https://www.blackbookhouston.com/> — Black Book Houston directory landing.
- <https://midtownhouston.com/celebrate-these-hispanic-owned-businesses-in-midtown-houston-year-round/> — Hispanic-owned business ownership leads.
- <https://houstonbuyblack.com/> — Greater Houston Black Chamber Buy Black directory landing and scope information.
- <https://ghbcc.com/> — Greater Houston Black Chamber official community-resource page.
- <https://www.blackbookhouston.com/directory-listings/ms.-myrtle's-bakery> — Ms. Myrtle’s Bakery address, official destination, social links, and Black-owned claim.
- <https://blackrestaurantweeks.com/houston-black-restaurant-week/> — Houston campaign overview and initial listing review.
- <https://www.visithoustontexas.com/blog/post/supporting-black-owned-business-in-houston/> — Black-owned business roundup, ownership-context leads, and addresses.
- <https://www.houstontx.gov/obo/certification_overview.html> — City OBO certification types and certified-firm directory link.
- <https://hmsdc.org/> — HMSDC MBE definition, resource context, and login-gated finder note.
- <https://gloriascuisine.com/locations/> — Official locations review; held because extracted Midtown location did not show a numbered street address.
- <https://www.thegypsypoet.us/> — Official current location addresses and customer destination.
- <https://www.alshandmadeboots.com/> — Official business description; held due to no street address in extracted content.
- <https://sigslagoon.com/> — Official current Houston address and record-store details.
- <http://bigkatshouston.com/> — Official address and barbershop services.
- <https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/> — Black Restaurant Week listings 1–10.
- <https://lucilleshouston.com/> — Official current restaurant address; record deduplicated from directory-page version.
- <https://gatlinsbbq.com/> — Official current restaurant address, phone, and food category.
- <https://buffalosoldiermuseum.com/> — Official domain check; held because it returned Account Suspended.
- <https://projectrowhouses.org/> — Official visit address, programs, and African-American roots.
- <http://thegitegallery.com/site/> — Official African-art description; held because it did not confirm a street address.
- <https://thebodyshophtx.com/> — Official address and fitness services.
- <https://www.shop3rdeyeview.com/> — Official ecommerce destination review; old source storefront address not confirmed, so held.
- <https://www.houstonlanding.org/latina-owned-retailers-are-selling-more-than-wares-theyre-selling-cultural-education-too/> — Latina-owned retail and coffee-business leads.
- <https://www.houstonhispanicchamber.com/> — Houston Hispanic Chamber official community-resource page.
- <https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/2/> — Black Restaurant Week listings 11–20.
- <https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/3/> — Black Restaurant Week listings 21–30.
- <https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/4/> — Black Restaurant Week listings 31–40.
- <https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/5/> — Black Restaurant Week listings 41–50.
- <https://blackrestaurantweeks.com/brw-campaigns/category/houston-brw/page/6/> — Black Restaurant Week listings 51–55.
- <https://smilesofmidtown.com/> — Official dental practice address and services.
- <https://hendersonandkane.com/> — Official-site extraction failed; candidate held pending address verification.
- <https://kismetboutique.com/> — Official-site extraction failed; candidate held pending address verification.
- <https://lasperrascafe.com/> — Domain review; it resolved to unrelated gambling content, so candidate held.
- <https://www.blackfarmerbox.com/> — Official Fresh Houwse Grocery address, grocery context, and farmer/community ownership wording.
- <https://danielwilliamslaw.com/> — Official Black-owned law-firm claim and service area; held because no Houston street address was shown on inspected page.
- <https://shiningstarkid.ueniweb.com/> — Public business page with childcare address, official website destination, and Black-owned designation.
- <https://thebreakfastklub.com/> — Official address and restaurant contact/services.
- <https://kulturehouston.com/> — Domain check; parked domain. Candidate retained only with the official Instagram destination provided by the current 2026 BRW listing.
- <http://dandelionhouston.com/> — Official current Heights and Bellaire location addresses and cafe description.

## Retained-record composition

| Target kind | Count | Treatment |
|---|---:|---|
| `business` | 59 | Physical commercial/retail/food/fitness/grocery candidates with an official destination. |
| `regulated_review` | 2 | Childcare and dental records held out for regulated review before any downstream use. |
| `community_resource` | 4 | Chambers, minority-business development, and municipal certification resources; these are not represented as merchants. |
| `cultural_place` | 1 | Cultural place retained separately from commercial businesses. |
| **Total retained** | **66** | **No exact name + city + state + address duplicates after normalized in-pass deduplication.** |

## Held-record reasons

| Reason | Count |
|---|---:|
| Missing, private, post-office-box, or locality-incomplete physical address | 11 |
| Official site/domain did not confirm a usable current customer-facing destination or current storefront | 4 |
| **Total held** | **15** |

## Factual limitations and handling

**Ownership is not inferred from chamber membership, names, cuisine, geography, or photos.** The `ownershipDesignations` and `ownershipEvidence` fields identify exactly what each source says. In particular, Black Restaurant Week is used as **directory-context evidence** for the food listings because its Houston campaign page describes the directory as a way to discover Black-owned restaurants and culinary businesses; it is not treated as a government or third-party ownership certification. Visit Houston and Midtown Houston articles supply ownership-context leads, while linked official sites generally supply current customer-facing location/category details. Fresh Houwse Grocery is described only as **farmer-owned, community-operated** because that is the official-site wording; no ownership race is asserted for it.

The pass did not verify hours, ownership control beyond the cited source wording, language ability, licensing, accessibility, availability, quality, services not shown in source material, latitude/longitude, or any professional credential. No data was inferred from map coordinates. Childcare and dental records are explicitly routed to `regulated_review`; no licensing finding is made. The public HMSDC finder required login and was not accessed. The City OBO page was used as a municipal resource description, not as proof that any individual candidate holds certification.

Historical or inconsistent leads were held rather than promoted. Examples include an official domain parked at GoDaddy, a domain that resolved to unrelated gambling content, an account-suspended museum site, and older editorial addresses not confirmed by a current official site. This conservative process limits sector breadth: food candidates are more numerous because one recent public Black Restaurant Week directory supplied the required address/category/official-destination evidence, while many legal, cultural, Latino retail, and childcare leads lacked an address or current official confirmation.

## Publication control

**No production database, API, account, login, publication action
 occurred.** The only output is the local UTF-8 JSONL research package at the requested filesystem paths. No production publication occurred.
