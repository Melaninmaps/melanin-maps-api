# University City Businesses — Source Evidence Report

## Scope and method

This pass targeted University City / Drexel campus-area businesses appearing in a university-maintained vendor directory, with the goal of producing individual candidate records for later Mapping with Melanin ownership review. The primary source was Drexel University’s **Dining and Retail Directory**. Each included record preserves the exact source page URL and the merchant’s customer-facing website linked from that page. Addresses are copied from the directory; no ownership, language, hours, accessibility, licensing, or service claims were inferred.

## Source

- [Drexel University Dining and Retail Directory](https://drexel.edu/business-services/dining-retail/directory) — accessible page; it states that local businesses on and near campus are open, lists merchant names and street addresses, and links individual merchant sites. Drexel also warns that hours may vary and that directory information can change without notice.

## Included candidates

The JSONL contains 12 physical commercial candidates: Brooklyn Dumpling Shop; Ed’s Buffalo Wings and Pizza; Gather Food Hall; Greek From Greece; Landmark Americana; LaScala’s Fire; New Delhi Indian Restaurant; Oh Brother; Old Nelson Food Company; Sabrina’s University City; Sava’s Brick Oven Pizza; and The Board and Brew. All have the minimum physical-record evidence required here: name, street address, Philadelphia/PA/United States location, category, exact source URL, and a business-specific customer-facing website.

These are **candidate records, not verified ownership matches**. The university directory does not establish Black, Latino, or diaspora ownership, and no designation was added merely from a business name or cuisine. `ownershipDesignations` is therefore empty for every row, and `ownershipEvidence` explicitly records the gap. They should be enriched only when a credible business-specific source or owner statement verifies the relevant designation.

## Accessibility limits and exclusions

The University City District interactive business guide was discoverable at [universitycity.org/businessguide](https://www.universitycity.org/businessguide/) but its listing data did not render in the text extraction available for this pass, so it was not used to invent records. Penn Today’s article about local vendors was also identified, including a search result naming Win Coffee as a Black-owned Penn vendor, but the article returned no extractable page content; no Win Coffee record was created without an address and a fully verifiable University City location. Visit Philadelphia’s broad Black/Latino/AAPI landing page rendered only links to thematic guides, not individual University City records with complete evidence.

Directory entries lacking a customer-facing business website were excluded. Generic directory pages, Google map pages, university social accounts, and chamber membership pages were not used as customer destinations. No database/API was called and nothing was published.
