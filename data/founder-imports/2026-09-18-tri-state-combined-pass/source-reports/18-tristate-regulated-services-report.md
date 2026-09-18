# Tri-State Regulated Services — Evidence Report

## Scope and method

This pass searched credible public Black/Latino/diaspora business sources and first-party customer destinations for Pennsylvania, New Jersey, and Delaware. Regulated professions and regulated service categories are classified as `regulated_review`; this is research expansion, not a claim that any candidate is live, licensed, insured, available, or currently operating. No database or API was called.

## Sources searched

| Source | Jurisdictional relevance | Result | Limitation |
|---|---|---:|---|
| [Greater Lehigh Valley Chamber of Commerce — Black-Owned Businesses](https://www.lehighvalleychamber.org/black-owned-businesses.html) | PA / Lehigh Valley | 8 included | Static page; inclusion under a Black-owned directory heading was retained as source designation, not independently verified ownership. |
| [Southern Delaware Alliance for Racial Justice — Directory of Black Owned Businesses in Southern Delaware](https://sdarj.org/directory-of-black-owned-businesses-in-southern-delaware/) | DE / southern Delaware | 1 included | Some entries had no official customer-facing website or social URL and were excluded under the evidence policy. |
| [Chamber of Commerce Southern New Jersey — Support & Celebrate Black Businesses](https://www.chambersnj.com/support-and-celebrate-black-businesses/) | NJ / southern New Jersey | 0 included | Accessible page contained spotlight posts but did not expose enough regulated-service listings with street address plus official destination. |
| [Statewide Hispanic Chamber of Commerce of NJ — Business Directory](https://business.shccnj.org/list/) | NJ | 0 included | Directory categories were visible, but the accessible index did not expose individual listing details, addresses, and official destinations needed for substantiation. |
| [Greater Philadelphia Hispanic Chamber — Corporate Membership Directory](https://www.philahispanicchamber.org/membership-directory/corporate) | PA / Greater Philadelphia | 0 included | Accessible page exposed names and “More Info” controls but not the individual profile URLs, street addresses, and official destinations required for physical candidates. |
| [Black Scranton Project — Black Business Directory](https://www.blackscranton.org/blackbusiness) | PA / NEPA | 0 included | Accessible page described the directory but exposed no candidate listings. |

## Record counts

The candidate file contains **9 records**: PA 8 and DE 1; NJ 0. Categories are healthcare (3), childcare (2), law (2), and financial (3), with one home-care record counted under healthcare. All 9 have `targetKind` `regulated_review` and `regulatedProfession: true`. Every physical candidate includes a name, street address, city/state/country, category, exact source URL, and an official customer-facing website or social URL.

## Exclusions and gaps

Entries were excluded when the source supplied only an email address, a PO box, a city without a street address, or no official customer-facing website/social destination. Non-regulated listings, houses of worship, generic chamber pages, and directory entries without enough location evidence were also excluded. NJ source pages were reachable, but their accessible directory views did not provide enough record-level details to meet the physical-listing policy. The Philadelphia Hispanic Chamber page contained many potentially regulated names (including law, accounting, healthcare, counseling, childcare, and finance) but its accessible “More Info” controls did not expose the required profile details.

## Interpretation caveat

“Black” ownership designations are recorded only because the source directory sections explicitly frame the listings as Black-owned businesses; chamber membership or directory placement is not treated as independent ownership evidence. The report and JSONL deliberately do not infer licenses, insurance, availability, language, hours, accessibility, or services beyond the wording published by each source.
