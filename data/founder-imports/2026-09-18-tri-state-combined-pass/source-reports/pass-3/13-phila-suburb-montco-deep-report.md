# Philadelphia Suburbs / Montgomery County Deep Dive — Pass 3

## Scope and method

This pass sought additional public Black- and Latino-relevant business sources in Montgomery County and nearby suburban communities, prioritizing Norristown, Ardmore, Cheltenham, Abington, Jenkintown, Glenside, Wyncote, Plymouth Meeting, and surrounding areas. Research used the **Jack and Jill of America, Montgomery County, PA Chapter Business Directory**, the **Montgomery County Black Collective directory**, **Main Line Today’s Black-owned business guide**, and official business websites discovered through those sources or direct web research.

The candidate JSONL preserves exact listing/page URLs. Physical records were retained only where a street address and a business-specific customer destination were available. Health, childcare, beauty/hair, pet-care, and other potentially regulated activities were classified as `regulated_review`; galleries were classified as `cultural_place`. Ownership is not inferred from names, language, neighborhood, or cuisine.

## Sources reviewed

| Source | URL | Result and accessibility notes |
|---|---|---|
| Jack and Jill of America, Montgomery County, PA Chapter — Business Directory | <https://jackandjillmontco.org/business_directory/> | Public, fully readable directory. It explicitly says it is a list of Black-owned businesses and provides mixed-quality business details. Several entries lack address or a business-specific customer destination; those were excluded or retained as manual review rather than map-ready records. |
| Montgomery County Black Collective directory | <https://directory.mocoblackcollective.org/> | Public directory landing page was accessible and states it contains 50+ businesses owned by AMBER graduates and Black/underserved businesses. The rendered landing page exposed featured listings primarily in Maryland, not the requested Montco target communities; no Montco listing with sufficient address-plus-customer-destination evidence was added from this page. |
| Main Line Today — Support These Black-Owned Businesses Around the Philadelphia Suburbs | <https://mainlinetoday.com/life-style/black-owned-main-line/> | Public article, accessible in full. It explicitly identifies the guide as Black-owned businesses and provides multiple Montgomery County-area addresses and official links. It was the main source for Ardmore, Jenkintown, Plymouth Meeting, and nearby suburban candidates. |
| El Primo Produce official website | <https://elprimoproduce.com/> | Public official site, fully accessible. It provides a Norristown address, phones, services, ordering, and official social links. The site describes Mexican cuisine and a family-owned in-store carniceria but does **not** expressly establish Latino ownership; therefore the row is retained with empty ownership designations and a manual-review note. |
| Visit Philadelphia regional guide | <https://www.visitphilly.com/philadelphia-black-latino-aapi-owned-businesses/> | Public landing page accessible, but it did not expose Montgomery County-specific entries in the rendered content. It links to separate Philadelphia-focused guides; no target-scope candidate was added from this page. |

## Candidate summary

The JSONL contains **12 sequential records**: 8 map-ready or near-map-ready physical candidates, 1 cultural-place record, 2 regulated-review records, 1 online-only record, and 1 ownership manual-review candidate. The records cover Ardmore, Norristown, Abington, Glenside, Wyncote, Jenkintown, and Plymouth Meeting. No verified candidate meeting all evidence requirements was found in Cheltenham itself during this pass.

The strongest new suburban leads are **Abiyah Naturals**, **Cork & Candles – Ardmore**, **Eshkol Ethiopian Cuisine & Cafe**, **QueenStylista’s Mane Artistry**, **Moody Jones Gallery**, **BTC Envelopes & Printing**, **DSQ Photography**, and **4 Legged Barber Shop**. These have a published street address and a business-specific website or official business social destination. **Seven Hair Salon** has an address and phone in the Jack and Jill directory but no business-specific customer destination in the accessible listing, so it is retained as a regulated manual-review candidate rather than treated as map-ready.

**El Primo Produce** is a useful Latino-relevant Norristown lead with a strong official website and two phone numbers. Because the official site does not expressly state Latino ownership, the record deliberately leaves `ownershipDesignations` empty and records the limitation in `ownershipEvidence` and `notes`. The record should not be promoted to an ownership-filtered map without additional explicit evidence.

## Exclusions and limitations

The Montgomery County Black Collective landing page was accessible, but the visible featured records were in Maryland and did not provide target-scope Montco candidates with sufficient physical evidence. Generic directory home pages, chamber social accounts, Google Maps links, and personal LinkedIn profiles were not used as customer destinations. The Jack and Jill page includes a broad regional list: Philadelphia, Chester County, Bucks County, and online businesses appear alongside Montgomery County entries. Only records fitting the requested geographic scope or useful nearby suburban scope were selected.

Several source entries were not promoted because they lacked one or more required fields. These include directory listings without a street address, listings with only an organization-owned social account, and online services where the source did not clearly establish an online-only basis. The pass does not infer ownership, ethnicity, language, licensing, insurance, hours, accessibility, current operation, or service availability. All records marked “verify current” require follow-up before publication.

The source material did not yield a sufficiently evidenced Black/Latino business in Cheltenham Township during this pass. Abington coverage is represented by Abington Day School, which is classified as regulated review because childcare is a regulated service. Norristown coverage includes Seven Hair Salon and El Primo Produce; Ardmore coverage includes Abiyah Naturals, Cork & Candles, Eshkol Ethiopian Cuisine & Cafe, QueenStylista’s Mane Artistry, and Holland & Milan Organics.

## Deliverables

- Candidate JSONL: `../source-passes/13-phila-suburb-montco-deep-candidates.jsonl`
- This evidence report: `13-phila-suburb-montco-deep-report.md`
