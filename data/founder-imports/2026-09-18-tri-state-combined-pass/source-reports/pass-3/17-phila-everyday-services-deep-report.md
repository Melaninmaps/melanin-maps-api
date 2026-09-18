# Philadelphia Everyday Services — Deep Dive Pass 3

## Scope and method

This pass focused on credible public Philadelphia-area sources for everyday services, prioritizing official City of Philadelphia pages, Philadelphia County service hubs, Philadelphia Corporation for Aging, Family Promise of Philadelphia, and the official City-funded DBHIDS provider directory. The candidate file preserves exact listing/page URLs and uses customer-facing websites when a provider-specific destination was published. Research was limited to publicly accessible pages; no database, API, or publication workflow was used.

The resulting inventory contains **12 JSONL candidates**. Categories represented are childcare, elder support, disability services, schools/early-childhood navigation, and broad community resources. The DBHIDS directory was particularly useful because it publishes provider-specific name, address, phone, service population/type, and a provider website for many entries.

## Evidence table

| Source | What the page establishes | Candidate rows |
|---|---|---:|
| [ELRC 18 Philadelphia County](https://www.elrc-phmc.org/18) | ELRC 18 is the Philadelphia County child-care information hub, provides personalized referrals and Child Care Works assistance, and publishes Philadelphia office addresses and telephone numbers. | 1 |
| [Philadelphia Corporation for Aging contact page](https://pcacares.org/contact-us/) | PCA publishes its headquarters, helpline, assistance form, social links, and older-adult/disability support mission. | 2 |
| [City-funded DBHIDS Providers](https://dbhids.org/about/organization/commissioners-office/systems-integration/city-funded-dbhids-providers/) | Official directory of city-funded behavioral-health and intellectual-disability providers; entries include provider-specific websites, service type/population, addresses, and phones. | 3–8, 10–11 |
| [Family Promise of Philadelphia Resource Directory](https://www.familypromisephl.org/resource-directory) | Local nonprofit referral directory linking named organizations across children/youth, food/material support, utilities, housing, wellness, education, and legal categories; its own Philadelphia address and phone are published. | 9 |
| [City of Philadelphia child-care page](https://www.phila.gov/services/education-learning/find-child-care-and-early-childhood-education/) | Official City page directs families to PHLpreK, School District pre-K/kindergarten, and ELRC child-care navigation. It does not publish a storefront address for the page contact. | 12 |

## Classification and verification notes

Health, behavioral-health, disability, and childcare records were marked `regulated_review` rather than treated as ordinary businesses. The PCA and Family Promise records were treated as community-serving organizations, with PCA kept under regulated review because its published mission includes assistance to older Philadelphians and people with disabilities. No ownership, race/ethnicity, language, licensing, insurance, accessibility, availability, hours beyond the source text, or service capabilities were inferred. The `ownershipDesignations` arrays are empty unless a source explicitly supported a designation; none did in this pass.

Row 9 is a referral directory rather than a claim that all linked organizations are physical Philadelphia businesses. Row 12 is a service-navigation page without a published street address and should not be mapped as a storefront until a physical destination is independently verified. The DBHIDS table occasionally contains multiple service entries for the same organization or address. Row 11 is explicitly flagged in its JSON notes as a possible duplicate of row 6 and should be deduplicated during downstream review if the importer requires one pin per organization/location.

## Accessibility limits and exclusions

Several pages were accessible only as directory-level or program-level pages and did not expose all requested everyday-service categories. The public sources reviewed did not yield sufficiently evidenced, provider-specific candidates for laundry, HVAC, beauty/braiding, grocery stores, or general home services while satisfying the requirement for an exact listing URL plus a business-specific customer destination. Generic directory home pages, Google map pages, chamber profiles, personal LinkedIn pages, and shared directory social accounts were not used as business customer destinations.

The City emergency-home-repair page did not return extractable page content in this environment and was excluded rather than inferred. Search snippets and generic commercial aggregators were also excluded where they did not provide a reliable provider-specific listing and official customer destination. No houses of worship were added; if later sourced, they must be classified as `cultural_place` or `community_resource`.

## Recommended downstream review

Before import, verify current operating status and addresses, especially DBHIDS intake hours and the ELRC office details. Deduplicate the CFAR rows if a single physical location is preferred. Keep row 12 as a non-map service-navigation lead or obtain a verified physical address before mapping. A subsequent pass should target official provider rosters or municipal permit/licensing pages for laundry, HVAC, beauty/braiding, groceries, schools, and home-repair businesses, while retaining the same evidence standards.

## Files

- Candidate JSONL: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-passes/17-phila-everyday-services-deep-candidates.jsonl`
- This report: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-philadelphia-deep-dive-pass-3/source-reports/17-phila-everyday-services-deep-report.md`

## Source URLs

1. https://www.elrc-phmc.org/18
2. https://pcacares.org/contact-us/
3. https://dbhids.org/about/organization/commissioners-office/systems-integration/city-funded-dbhids-providers/
4. https://www.familypromisephl.org/resource-directory
5. https://www.phila.gov/services/education-learning/find-child-care-and-early-childhood-education/
6. https://www.phila.gov/services/property-lots-housing/home-repairs/get-emergency-home-repairs/

The sixth URL is included as an attempted source and documented exclusion because extraction returned no page content.
