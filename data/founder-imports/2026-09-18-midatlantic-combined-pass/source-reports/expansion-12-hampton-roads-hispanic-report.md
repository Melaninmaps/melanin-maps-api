# Hampton Roads Hispanic candidate source pass

## Scope and method

This pass covered the Virginia Hispanic Chamber directory, the Hispanic Chamber of Coastal Virginia, and the Hispanic Progress Latino Business Directory in Hampton Roads. The usable candidate set below is limited to listings whose published facts support a customer destination and a city in Norfolk, Hampton, Newport News, Virginia Beach, or Chesapeake. No ownership, language, licensing, hours, accessibility, insurance, availability, or services were inferred beyond the cited listing text.

## Sources

| Source | Use |
|---|---|
| [Hispanic Progress Latino Business Directory](https://www.hispanicprogress.org/directory) | Individual Hampton Roads listings, addresses, phones, categories, descriptions, and customer URLs. |
| [Virginia Hispanic Chamber member directory](https://www.vahcc.com/member-directory) | Scope check; live directory rendered mostly Central Virginia entries in this fetch and did not yield a verified Hampton Roads individual listing for import. |
| [Hispanic Chamber of Coastal Virginia](https://hcccova.org/) | Mission and regional context. |
| [Innovate Hampton Roads directory entry](https://www.innovate757.org/hampton-roads-business-directory/business-listing/hispanic-chamber-of-commerce-of-coastal-virginia/) | Chamber address, phone, website; imported as community resource, not a business ownership claim. |

## Counts

**Total imported candidates: 16.** By target kind: business=7, community_resource=1, regulated_review=8. By city: Chesapeake=2, Newport News=2, Norfolk=4, Virginia Beach=8. Regulated-review rows: 8.

All JSONL rows use sequential `sourceRow` values and preserve the directory’s published spelling and uncertainty. Entries without a street address remain service-area listings and are not presented as storefront map pins; they retain a customer website or social destination.

## Exclusions and gaps

The source directory contained additional entries that were excluded because they had no customer destination, lacked a target-city match, had an out-of-region address, or did not provide enough address detail for a physical map listing. Examples include Julieta Molina Insurance, Life Insurance & Investments, A&J Real Estate Group, HealthNex, Magalli Ledesma Real Estate, Realty of America, and Jazmin Baez (city-only entries with no customer URL or insufficient physical address); Four Sails Resort, Marcos Uriel Cleaning Services, Paleteria La Huerta, YMCA of South Hampton Roads, and other entries whose published address was outside the target geography; and Sentara Healthcare, which is a large health system rather than a Hispanic-specific individual candidate and was not imported. The Virginia Hispanic Chamber page exposed pagination and category filters but did not expose a reliable Hampton Roads subset in the fetched content, so it was used as a scope source rather than a direct import source.

## Accessibility limitations

The evidence is based on publicly rendered web pages. Some customer destinations are Facebook, Instagram, Beacons, or Linktree-style pages and may require login, scripting, or mobile rendering. Several directory records publish only a city and no street address; these are explicitly retained as service-area records and should not be assigned a physical pin without later verification. The source pages do not establish licensing, insurance, accessibility features, current hours, current availability, or legal ownership status.
