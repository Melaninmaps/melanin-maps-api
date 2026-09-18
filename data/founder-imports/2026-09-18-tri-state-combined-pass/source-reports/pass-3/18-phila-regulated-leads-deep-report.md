# Philadelphia Regulated Service Leads — Deep Dive Pass 3

## Scope and method

This pass focused on credible public Philadelphia-area professional, chamber, and community sources for **pediatric and general healthcare/dentistry, law, finance, childcare, and other regulated services**. Every included service candidate is marked `regulated_review`; no license, credential, insurance status, availability, or professional identity was inferred. A candidate was included only when a public source supplied a business name, Philadelphia-area location, and a business-specific customer-facing website or social destination.

## Included candidates

| Row | Candidate | Category | Location | Evidence basis |
|---:|---|---|---|---|
| 1 | [Champion Dentistry](https://championdentistry.org/) | Dentistry | 1170 N. 63rd Street, Philadelphia, PA 19151 | Official site publishes address, phone, dental service descriptions, social links, and explicitly calls the practice Black-owned. |
| 2 | [Philadelphia Pediatric Dentistry](https://www.phillypediatricdental.com/) | Pediatric dentistry | 2000 Hamilton St. Ste 304, Philadelphia, PA 19130 | Official site publishes address, phone, pediatric dental offerings, appointment destination, and social links. |
| 3 | [Reinvestment Fund](https://www.reinvestment.com/) | Finance / childcare business financing | 2005 Market Street, Suite 3000, Philadelphia, PA 19103 | Official impact story describes financing for a West Philadelphia childcare business; official footer publishes Philadelphia office address and phone. |

## Source notes

**Champion Dentistry official website.** The page states that Champion Dentistry is a “black-owned practice in West Philadelphia,” lists dental care for children and adults, describes preventive/general, cosmetic, restorative, orthodontic, periodontal, sleep-apnea, and emergency services, and publishes 1170 N. 63rd Street, Philadelphia, PA 19151 and 215-473-4717. The page links directly to Instagram and Facebook. This is an explicit business self-designation, not an inference from name or neighborhood.

**Philadelphia Pediatric Dentistry official website.** The page identifies the practice as Philadelphia Pediatric Dentistry and publishes 2000 Hamilton St. Ste 304, Philadelphia, PA 19130 and 267-507-1064. It describes pediatric smile care, laser frenectomy, X-ray alternatives, digital impressions, minimally invasive dentistry, SMART Restorations, and a pediatric membership plan. Facebook and Instagram links are published on the same page. No ownership designation is claimed.

**Reinvestment Fund impact story.** The [official impact story](https://www.reinvestment.com/insights/a-thriving-west-philadelphia-childcare-business-is-a-case-study-on-expanding-high-quality-care/) identifies Pee Wee Prep as a West Philadelphia childcare business and states that Reinvestment Fund provided a grant and bridge loan supporting facility expansion and PHLPreK slots. The page’s official footer lists Reinvestment Fund’s Philadelphia office at 2005 Market Street, Suite 3000, Philadelphia, PA 19103 and 215-574-5800. The candidate is the finance provider, not Pee Wee Prep: the linked Pee Wee Prep website could not be independently fetched in this pass, and no street address for Pee Wee Prep was added. Finance is conservatively treated as `regulated_review`; no financial license or credential was inferred.

## Accessibility limits and exclusions

The African-American Chamber legal-services category URL was discovered as a relevant chamber source, but the page returned no extractable content in this environment. It was therefore not used as sole evidence for a candidate, and no legal-firm row was fabricated from a directory snippet. A separate law-firm website search result was not used where a Philadelphia address or Philadelphia-area source could not be confirmed from an accessible page. Search-result snippets, generic directory homepages, Google Maps links, chamber account pages, personal LinkedIn profiles, and shared directory social accounts were not used as customer-facing destinations. No houses of worship were included; if discovered in later passes they should be classified as `cultural_place` or `community_resource`, not as businesses. No candidate was assigned a license, board credential, insurance participation, hours, accessibility status, language, identity, ownership designation, or service not explicitly published by the cited source.

## Deliverables

- Candidate JSONL: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-passes/18-phila-regulated-leads-deep-candidates.jsonl`
- This report: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-reports/18-phila-regulated-leads-deep-report.md`

All three included rows are intentionally `regulated_review` and require downstream review before publication.
