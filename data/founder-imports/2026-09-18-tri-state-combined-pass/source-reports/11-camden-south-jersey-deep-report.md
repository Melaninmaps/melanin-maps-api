# Camden and South Jersey Deep Candidate Expansion — Source Pass 11

## Scope and method

This pass expanded the first-pass inventory for **Camden, Burlington, Gloucester, Atlantic, and Salem Counties**, emphasizing everyday services beyond restaurant-only listings. Research used publicly accessible county, chamber, downtown, and community directory pages, plus first-party customer-facing business destinations linked from those sources. No database or API was called. Ownership was recorded only where the source itself made a designation; chamber membership alone was not treated as ownership evidence.

## Sources searched

| Source | URL | Result |
|---|---|---|
| Camden County National Black Business Month spotlight | [camdencounty.com/service/national-black-business-month](https://www.camdencounty.com/service/national-black-business-month/) | Most productive source. Named Black-owned or minority-business candidates and, for many, street address, phone, and first-party destination. |
| Camden Black Business Project | [camdenblackbusinessproject.com](https://camdenblackbusinessproject.com/) | Accessible page displayed only Kings Bay Mail And More and a Georgia mailing address, so it was not used as a Camden County physical candidate. |
| Downtown Camden Business Directory | [mydowntowncamden.com/business-directory](https://mydowntowncamden.com/business-directory/) | Categories and pagination were visible, but the accessible listings did not substantiate Black/Latino ownership. It was therefore used for discovery/context, not ownership-tagged imports. |
| Burlington County Hispanic/Latino map announcement | [burlingtoncountynj.gov/CivicAlerts.asp?AID=1717&ARC=3551](https://www.burlingtoncountynj.gov/CivicAlerts.asp?AID=1717&ARC=3551) | County confirms an interactive map sourced from the Statewide Hispanic Chamber directory and other sources; the map itself was not reliably extractable in the available text interface, so no unsupported Burlington records were invented. |
| Gloucester County Business and Industrial Directory (2024 PDF) | [gloucestercountynj.gov PDF](https://www.gloucestercountynj.gov/DocumentCenter/View/10941/2024-Business-Industrial-Directory-2024-Final-pdf) | Broad county directory with names and addresses, but no Black/Latino designation or official customer-facing links for the candidate rows. Used to identify a gap, not to infer ownership. |
| Salem County Chamber Business Directory | [salemcountychamber.com/business-directory-shoppers-guide](https://salemcountychamber.com/business-directory-shoppers-guide/) | Directory page loaded chamber overview and advertising information, but the accessible page did not expose member rows with ownership designations and official destinations. No imports made. |
| Chamber of Commerce Southern New Jersey listing for LAEDA | [business.chambersnj.com/directory/Details/latin-american-economic-development-association-inc-891335](https://business.chambersnj.com/directory/Details/latin-american-economic-development-association-inc-891335) | Substantiated LAEDA as a Latino-serving economic development/community resource; not a commercial ownership claim. |

## Candidate counts

The JSONL contains **13 sequential records**. Of these, **9 are commercial physical candidates with a street address and first-party destination**, **3 are regulated-review candidates**, and **1 is a community resource**. The records intentionally include several non-restaurant everyday services: agriculture/CSA, fashion education, boutique retail, tea retail, stationery/calligraphy, art/framing, mental health, notary/signing, accounting, and security.

The Camden County spotlight itself is ownership-designated at the source level, but its wording and detail vary by listing. The `ownershipEvidence` field preserves that limitation rather than claiming certification not published by the source. The county page identifies Holmes & Company as a certified Minority Business Enterprise, while other entries are presented in a Black-owned-business-month feature without formal certification details.

## Exclusions and gaps

Restaurant-only entries from the Camden County page were excluded to keep this pass focused on everyday services. Other named entries were excluded where they lacked a street address, had no official customer-facing website/social destination, or could not be tied to one of the requested counties. Holmes & Company, We See You Security, and SLK Signings remain in the file only as manual/regulated review-style records because the accessible source did not publish enough locality/address information for a physical map listing. The accounting, counseling, and notary/signing records are marked `regulated_review` rather than ordinary business listings.

The Burlington County announcement verifies that a county-created Latino/Hispanic map exists and links to the ArcGIS viewer, but the interactive layer was not text-extractable in this environment. The Gloucester County directory is comprehensive in business coverage but does not publish ethnicity/ownership designations; converting its rows into Black/Latino candidates would violate the no-inference rule. The Salem Chamber page similarly exposed the chamber framework but not qualifying ownership evidence. Atlantic County yielded public discovery pages and event material, but no accessible page in this pass simultaneously supplied a qualifying Black/Latino designation, street address, and official customer destination. These are source-access and substantiation gaps, not claims that no such businesses exist.

## Caveat

This is a research expansion and **not a claim that any business is currently live, open, licensed, insured, available, or accepting customers**. Addresses, services, and designations are limited to what the cited public pages stated at research time; regulated-profession records require downstream verification before publication.
