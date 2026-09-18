# Tri-State Everyday Services — Source Pass 19 Evidence Report

## Scope and method
This expansion pass searched credible public community and business sources for Black/diaspora everyday-service leads across Pennsylvania, New Jersey, and Delaware. Records were retained only where a source page named the business and an official customer-facing website or social destination was available. Ownership was not inferred from names, neighborhoods, or chamber membership.

## Sources searched
| Source | Coverage and result |
|---|---|
| [Southern Delaware Alliance for Racial Justice directory](https://sdarj.org/directory-of-black-owned-businesses-in-southern-delaware/) | Primary extraction source; a page explicitly titled “Directory of Black Owned Businesses in Southern Delaware,” with categories including daycare, food, home services, and shopping/beauty. |
| [PIDC Shop PHL Black-Owned Businesses](https://pidcphila.com/blog/shop-phl-black-owned-businesses/) | First-party/municipal economic-development roundup; supplied Philadelphia food, childcare, beauty, electrical, and construction leads and official links. |
| [DelawareBlack childcare directory](https://www.delawareblack.com/black-directory/categories/childcare) and [main directory](https://delawareblack.com/black-directory/) | Reviewed category counts and listings. Most relevant fetched entries lacked a street address and/or official customer destination, so they were excluded rather than guessed. |
| [African American Chamber PA/NJ/DE directory](https://membership.aachamber.com/list) | Reviewed categories including cleaning, construction, education, fashion/beauty, health/home health, and retail. The fetched index exposed categories but not listing-level records/addresses, so no unsupported rows were added. |
| [Statewide Hispanic Chamber of Commerce of NJ directory](https://business.shccnj.org/list) | Reviewed Latino/Hispanic chamber categories including childcare, beauty, cleaning, contractors, grocery, assisted living, and home care. The fetched page exposed taxonomy but not listing-level records, so no unsupported rows were added. |
| [Beech Community Services Philadelphia Black Business Directory](https://beechcompanies.com/beech-community-services/black-business-directory) | Directory landing page and downloadable 2021 PDF were identified; listing-level extraction was not accessible in the fetched HTML and was excluded from this pass. |

## Record counts
**18 JSONL candidates** were written. Of these, 13 came from SDARJ and 5 from PIDC. Categories represented are food/grocery (9), home services (6), beauty (1), childcare (1), and construction/electrical (1). The file separates commercial leads from regulated/manual-review leads using `targetKind`; all childcare, real-estate, barbering, transportation, and licensed electrical entries are flagged for review.

## Exclusions and limitations
Daycare listings such as Bright Beginnings and Christa’s Home Day Care were excluded because the directory supplied only email/phone and no official customer-facing website or social destination. Many SDARJ home-service listings had no official URL; they were excluded. Several retained SDARJ leads have a PO Box or service-area-only address; these are explicitly marked in `notes` for manual review and do not claim a storefront. PIDC entries were retained only as manual-review leads because the fetched roundup supplied official links but generally did not publish street addresses. DelawareBlack and chamber directories were useful discovery sources, but their accessible pages did not expose enough listing-level evidence to satisfy the physical-listing contract. No Google pages, database/API calls, licenses, hours, language, accessibility, insurance, or availability were inferred.

This is research expansion, not a claim that any business is currently live or accepting customers.
