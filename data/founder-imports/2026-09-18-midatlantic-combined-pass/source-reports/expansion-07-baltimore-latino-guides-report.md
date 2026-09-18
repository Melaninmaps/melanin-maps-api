# Baltimore Latino Business Guides and Chambers — Evidence Report

**Research scope.** This pass covered credible Baltimore-area Latino business guides, chambers, and official public guides beginning with Baltimore City’s Mayor’s Office of Immigrant Affairs business-services guide. Research was limited to public pages available on 2026-09-18. No database/API was called and no records were published.

## Sources reviewed

| Source | What it contributed | Assessment |
|---|---|---|
| [Baltimore City — Welcome to Baltimore: Business Services](https://www.baltimorecity.gov/mima/welcome-to-baltimore-guide/business-services) | Official addresses, phone numbers, websites, and service descriptions for LEDC and Maryland Hispanic Chamber of Commerce, among other business-support organizations | Strong primary governmental source for community resources; it is not a directory of individual Latino-owned businesses |
| [Maryland Hispanic Chamber membership directory](https://maryland-hispanic-chamber-of-commerce.org/membership-directory/corporate) | First-party member names, industry filters, chamber address/contact details | Credible chamber source, but membership does not prove Latino ownership; rendered page does not reliably expose Baltimore street addresses or customer destinations for individual members |
| [Colado Latino Network Latino Business Directory](https://www.coladonetwork.com/latino-business-directory/) | First-party community directory with 10 screened listings and descriptions; directory states Latino-owned and community-vetted | Useful attribution source, but many rendered records lack a customer-facing official website/social URL and/or street address; no individual records were imported in this pass under the physical-listing requirements |
| [Latin Opinion Baltimore — Directorio de Negocios Latinos](https://latinopinionbaltimore.com/directorio-de-negocios-latinos-en-baltimore/) | Spanish-language 2018 directory article with names, categories, some addresses and phones | Useful historical lead source, but stale (dated 2018-06-04), generally lacks official customer destinations, and includes regulated categories needing separate verification |
| [LEDC Business Directory Magazine 2024](https://www.ledcmetro.org/ledc_s_business_directory_magazine_2024) | Confirms LEDC’s 2024 directory magazine and Baltimore office; links to an Issuu publication | Directory is an embedded external magazine and the landing page did not expose individual listings sufficiently for safe import |

## Candidate counts

The JSONL contains **5 candidates**: **2 community resources** from the official city guide, **1 community resource** for the Colado directory, **1 community resource** for the Latin Opinion guide, and **1 community resource** for the Maryland Hispanic Chamber membership directory. There are **0 individual business pins** in this pass. This is intentional: the scope requires an official customer-facing website or social destination for physical commercial candidates, and ownership/attribution must not be inferred from chamber membership alone.

## Included records and evidence

1. **Latino Economic Development Center (LEDC) Baltimore Office** — Baltimore City’s guide gives 3500 Boston Street, Suite 227, Baltimore, MD 21224, phone 443-708-7035, and `ledcmetro.org`; LEDC’s own page gives the Baltimore office and phone 202-540-7400. It is retained as a community resource supporting Latino entrepreneurs, not as a commercial business.
2. **Maryland Hispanic Chamber of Commerce** — Baltimore City’s guide gives 11 West Mount Vernon Place, Suite 304, Baltimore, MD 21201, phone 443-620-0165, and the chamber website. It is retained as a community resource/chamber, not as evidence that members are Latino-owned.
3. **Colado Latino Network — Latino Business Directory** — The first-party page states that its directory is Latino-owned, community-vetted, screened, and focused on Baltimore City/County first. It is retained as a directory/community resource. The network’s own Latino-owned description is not propagated to every listed company.
4. **Latin Opinion Baltimore — Directorio de Negocios Latinos** — The article is retained as a historical guide/community resource because it publishes a categorized list of Latino-oriented businesses. Its date and lack of current customer destinations make it unsuitable for direct business imports without verification.
5. **Maryland Hispanic Chamber — Membership Directory** — The first-party directory is retained as a research resource. The page lists many members and categories, but membership is not ownership evidence and the visible page does not provide enough Baltimore-specific business detail for safe individual import.

## Exclusions and non-imports

The Latin Opinion article lists businesses such as law offices, a pharmacy, insurance/financial services, a salon, restaurants, cleaners, and other services. They were **not** imported because the page is from 2018 and usually does not provide an official customer-facing website or social destination; several are regulated services and require current license/identity verification. No address, ownership, language, hours, accessibility, insurance, availability, or service claims were inferred.

The Colado directory displays businesses including Another Monday, TLC Nails & Esthetics, OpenDoors360, Amy M Photography, Jessica J Events, Rise & Prime Painting, Financial Growth Partners, BMORE Good Co, Chipelo | Calle Cuatro Entertainment, and Aprende con Peguero. They were not imported as individual candidates because the rendered directory provides incomplete customer destinations and/or no street address for most records. TLC Nails & Esthetics is shown with a street address, but the page excerpt does not provide a distinct official customer-facing website/social URL for the business; it therefore did not meet the physical-commercial inclusion rule. Financial Growth Partners was not classified as a regulated financial provider solely from its description; it was excluded for destination/address sufficiency, not because ownership was inferred.

The chamber’s member directory includes corporate and individual members such as Allstate - Jorge Chaverri, American Hearth Bakery, Barrientos and Sons LLC, Ideas Consulting, Little Bites Catering LLC, Machado & Associates Insurance Agency Co., and many others. These were not imported: chamber membership is not ownership evidence, and the rendered directory did not expose adequate Baltimore-specific address and official customer-destination fields. Regulated members were additionally held out for review.

LEDC’s 2024 magazine landing page was not used to create individual records because the landing page only links to an embedded Issuu publication; individual listing details were not reliably exposed in the fetched page. The Baltimore office itself is already captured through the official city guide and LEDC first-party site.

## Gaps and accessibility limitations

The source set contains no consistently structured, current Baltimore Latino business directory with all of the required fields: attributable ownership evidence, street address, current official customer destination, category, and current status. The most promising source for future work is Colado’s first-party directory, but each listing should be opened individually and verified for destination and address. The chamber directory may support future leads if individual member detail pages can be accessed and independently verified. The Latin Opinion guide is valuable for historical discovery but should be treated as stale until each business is rechecked.

Accessibility information was not published in the cited source pages beyond ordinary web links, telephone numbers, and (for LEDC) a bilingual Spanish/English service description. No source established physical accessibility, interpreter availability beyond that description, hours, appointment requirements, license/insurance status, or current availability. The report and JSONL preserve those limitations rather than filling gaps by inference.

## Reproducibility

All source URLs are preserved in the JSONL `sourceUrl` fields. The output intentionally contains only research resources and no unverified commercial pins.
