# Hampton Roads Black Business Guides — Evidence Report

## Scope and method

This pass covered credible public Hampton Roads Black-business directories, official regional chamber/community-organization pages, and first-party business destinations. Sources reviewed were [Buy Black Hampton Roads](https://www.buyblackhamptonroads.com/), the [Hampton Roads Greenbook](https://hrgreenbook.com/), [Black BRAND](https://blackbrand.biz/), the [Virginia Black Chamber Hampton Roads Regional Council](https://www.vablackchamberofcommerce.org/region-5-hampton-roads/), [Diverse Hampton Roads](https://www.diversehamptonroads.com/blog/shop-local-diverse-hampton-roads-list-of-black-owned-businesses), and the Virginia Tourism listing for the [Virginia Black Business Directory](https://www.virginia.org/listing/virginia-black-business-directory/20069/). No database/API was called and nothing was published.

## Results

The candidate file contains **9 sequential records**. They include **3 community/guide resources, 2 business leads with incomplete addresses requiring manual verification, 1 cultural retail place, 1 online-only business, and 1 regulated financial-services review**. One additional community organization uses a P.O. Box and is intentionally treated as a contact/resource record rather than a physical map pin.

| Source | Evidence and yield |
|---|---|
| Hampton Roads Greenbook | First-party regional guide says it spotlights Black and minority businesses, organizations, and professionals. Its Black-owned results expose 1,821 results, but the reviewed page only rendered 12; 7 records were selected or retained as leads based on explicit labels and published destinations. |
| Buy Black Hampton Roads | First-party directory says it promotes Black-owned businesses and organizations, reports 757 businesses, and names the Hampton Roads cities/areas served. Captured as a guide resource; individual directory pages were not sufficiently exposed in the reviewed page for safe bulk extraction. |
| Black BRAND | First-party site identifies a 501(c)(3) supporting Black-owned businesses in Hampton Roads and publishes a Norfolk street address. Captured as a community resource; chamber affiliation alone was not used as ownership evidence. |
| Virginia Black Chamber Regional Council | Official regional scope page confirms Hampton Roads cities and Black-chamber programming, but it does not provide customer-facing member listings with complete physical addresses. Used as corroborating scope evidence, not as a candidate source of pins. |
| Diverse Hampton Roads | Official member-guide article names 72 Black-owned-business entries, but many profiles lack a street address or official customer destination in the article. It was used for coverage review and exclusions rather than bulk import. |
| Virginia Tourism / VABBD | Credible official tourism listing verifies VABBD as a 501(c)(3) Black-business directory, but its published address is Fredericksburg, outside this Hampton Roads pass. Excluded from candidates. |

## Inclusion and exclusion decisions

Included records have an explicit Black/African-American ownership or representation label from a reviewed source, or are first-party Hampton Roads Black-business guides/community organizations. Online-only Talley & Twine is included with a `null` address because the Greenbook explicitly says “Online Only Store” and “Shop online.” Health, legal, financial, childcare, and similar regulated categories were not treated as ordinary businesses; Advanced Business Systems is marked `regulated_review` and lacks an official customer-facing website in the source output.

Several Greenbook listings were excluded from map-ready business status because they supplied only a ZIP code, city, service area, or P.O. Box rather than a street address. Two such leads—Sustainabili-T by Stretch Couture and Positive Vibes Inc.—are retained with `manualReview` notes but should not be published as physical pins until addresses are confirmed. Kaldima Dezigns was excluded because only a ZIP code was published. The Golden Fold, BlackWallStreet.net, The Marketx, and other listings were excluded where a street address was absent or the destination/ownership evidence was insufficient for this pass. Chamber membership or a chamber social account was not treated as ownership evidence.

## Gaps and accessibility limitations

The reviewed directories are dynamic and expose only a subset of listings per page; therefore the candidate count is not a census of Hampton Roads Black businesses. Many entries rely on directory-hosted profiles rather than first-party websites, and several profile pages publish only ZIP codes, service areas, or mailing addresses. No accessibility, hours, insurance, licensing, current availability, language, or service quality was inferred. Address, operating status, and destination URLs should be rechecked before publication, particularly for the manual-review and regulated-review records.
