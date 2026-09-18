# Philadelphia directories discovery — pass 3

## Scope and method

This pass investigated public Philadelphia-area Black/diaspora business-directory leads and extracted only individual listings with a physical street address and a business-specific customer destination. The principal accessible source was [Visit Philadelphia's guide to Black-owned shops and boutiques](https://www.visitphilly.com/articles/philadelphia/black-owned-shops-and-boutiques-in-philadelphia/), a public editorial directory-style guide. Each extracted record preserves the article URL in `sourceUrl`; the `website` field preserves the customer-facing website or official Instagram supplied by the article.

The article explicitly frames its listings as Black-owned shops and boutiques. That is recorded as published source evidence, not independently inferred ownership. Phone numbers were not published in the extracted listing text and are therefore null. No Google map URL is used as a customer destination.

## Extracted candidates

The JSONL contains 12 candidates: American Grammar, Atomic City Comics, Black and Nobel, The Black Reserve Bookstore, Hakim's Bookstore & Gift Shop, Loomen Labs, Moore Vintage Archive, Senoj Clothing, Urban Art Gallery, Abiyah Naturals, FarmerJawn Produce & Kitchen, and Plant and People. The article supplies name, address, and official destination for each. Lansdale, Ardmore, and West Chester are included because they are in southeast Pennsylvania.

## Additional directory/source leads and access limits

* [Africatown Business Directory](https://businessdirectory.philaafricatown.org/) is publicly reachable and displayed featured listings (including Besco Shippers Inc., Booker's Restaurant Dock & Bar, and Buna Cafe) with addresses and listing URLs. Its visible home page did not expose complete business-specific customer websites or phones for those cards in the accessible text, so those listings were not promoted into this candidate file. Future extraction should open each exact `/listing/.../` page and verify the business destination; the directory is branded as African and Caribbean.
* [Beech Community Services Black Business Directory](https://beechcompanies.com/beech-community-services/black-business-directory) provides a downloadable [2021 PDF](https://beechcompanies.com/files/2021-black-business-directory.pdf). The landing page is accessible, but the individual PDF entries were not safely enumerated in this pass; treat it as a future manual/PDF source lead rather than fabricate rows.
* [African American Chamber active member directory](https://membership.aachamber.com/list) is publicly accessible as a searchable GrowthZone directory, but the landing page exposes category and alphabet controls rather than individual members. Chamber membership alone is not proof of ownership, so no member was promoted without an exact listing-level review.
* [AfroPhilly Black Directory](https://afrophilly.com/black-directory/) is publicly linked and offers category filters and a submission workflow, but the accessible page did not render individual directory records with complete address plus customer destination. It remains a future source lead.

## Exclusions and caveats

Generic directory home pages, directory social accounts, Google map pages, chamber profile pages without listing-level evidence, and records lacking a business-specific customer destination were excluded. Houses of worship, community organizations, and regulated health/legal/finance/childcare services were not included in this extraction. No ownership, language, hours, accessibility, license, insurance, availability, or service detail beyond published source wording is inferred.
