# Petersburg Local Guides — Evidence Report

## Scope and method

This pass covered credible public Black/Latino business directories, local chambers, community/tourism guides, and first-party customer destinations for **Petersburg, Colonial Heights, Hopewell, Prince George, and nearby Tri-Cities communities**. Research used official chamber, municipal, tourism, and first-party business pages. No database/API was called and nothing was published.

The candidate file contains **6 JSONL records**: three guide/resource records, two verifiable Petersburg businesses, and one Hopewell manual-review record. Ownership was never inferred from names, neighborhood, cuisine, language, or chamber membership.

## Source inventory and findings

| Source | Evidence found | Use in candidate file | Limitation |
|---|---|---|---|
| [Virginia Black Chamber / Virginia Black Business Directory](https://www.vablackchamberofcommerce.org/virginia-black-business-directory/) | Official statewide Black business directory program; links to a searchable member directory. | Guide/resource row 1. | The landing page does not enumerate Petersburg-area listings, so it was not used as proof for individual ownership or pins. |
| [Virginia Hispanic Chamber membership](https://www.vahcc.com/membership) and [directory platform](https://www.docu.team/directory.php?association=292&cname=45914&search=&alpha=b) | Official chamber describes connection with Virginia’s Hispanic business community and links a products/services guide. | Guide/resource row 2. | The fetched directory page rendered mostly platform/privacy text and did not expose a verifiable Petersburg/Tri-Cities listing in this pass. |
| [Hopewell/Prince George Chamber](https://www.hpgchamber.org/) | Official chamber site identifies its Hopewell address, phone, member focus, and links “View All Members.” | Context only; no individual chamber listing imported. | Chamber membership alone is not ownership evidence, and member records were not sufficiently exposed for compliant physical imports. |
| [Southern Virginia Regional Chamber](https://www.sovachamber.com/about-us/) | Official Tri-Cities regional chamber describes Colonial Heights/Petersburg/Dinwiddie coverage and links a member directory. | Context only; no individual chamber listing imported. | Chamber membership alone is not ownership evidence; directory records were not individually verified here. |
| [Visit Hopewell-Prince George](https://www.visithpg.com/attractions/los-tios-taqueria/) and [Manna listing](https://www.visithpg.com/attractions/manna-colombian-bakery/) | Official tourism guide describes family-owned Los Tios and Colombian, family-owned Manna Colombian Bakery; it links customer Facebook destinations. | Regional guide row 3 and Manna manual-review row 6. | Los Tios page reviewed did not expose a street address/phone. Manna states only “East Broadway” and omits a street number/phone, so no map pin was created. |
| [Shut Yo Mouf official site](https://mamasaidshutyomouf.com/) | First-party site publishes Petersburg street address, phone, ordering/catering, and social links; identifies founder/co-owner. | Physical business row 4. | No explicit Black/Latino ownership designation was published on the reviewed page; designation left blank. |
| [Styles & Beyond official site](https://stylesandbeyond.com/) | First-party site publishes Petersburg address, phone, barber services, owner name, and social links. | Physical business row 5. | No explicit Black/Latino ownership designation was published on the reviewed page; designation left blank. |

## Counts

- **Total JSONL candidates:** 6
- **Physical commercial businesses:** 2 (`business`)
- **Community/guide resources:** 3 (`community_resource`)
- **Manual review:** 1 (`manual_review`)
- **Online-only candidates:** 0
- **Regulated-review candidates:** 0
- **Cultural places / houses of worship:** 0
- **Explicit individual Black/Latino ownership designations:** 0 among mapped physical businesses; directory rows describe directory scope only. Manna has Colombian/family-owned wording and remains manual review because its address is incomplete.

## Exclusions and non-imported leads

The official Petersburg, Colonial Heights, and Hopewell chamber resources were retained as source context rather than converted into businesses because membership does not establish Black/Latino ownership and individual records were not sufficiently verified. Generic Yelp, BuyBlack, Patch, and search-result pages were not used as customer destinations. Los Tios Taqueria was not imported because the reviewed tourism page supplied a Facebook destination but no street address or phone. Manna Colombian Bakery was kept for manual review because the tourism page supplied only “East Broadway” rather than a street number. A local-news result about Tacos Chiki’s Fiesta identified family ownership and national backgrounds, but the reviewed article excerpt did not provide a compliant customer-facing website/social destination and therefore was excluded from the JSONL.

## Gaps and accessibility limitations

The Black and Hispanic chamber directories are useful discovery sources, but their searchable records were not fully exposed in the text fetches; local coverage and current listing status require manual follow-up. Chamber and tourism sites may use JavaScript, embedded maps, or directory widgets that do not render completely in text-only extraction. Several guide pages provide descriptive copy and social links without a street address, phone, or hours. Current hours, accessibility, licensing, insurance, availability, and service details were not inferred. The dataset should be treated as a staged research inventory requiring address/status revalidation before publication.

## Source URLs

1. https://www.vablackchamberofcommerce.org/virginia-black-business-directory/
2. https://members.vablackbusinessdirectory.org/directory
3. https://www.vahcc.com/membership
4. https://www.docu.team/directory.php?association=292&cname=45914&search=&alpha=b
5. https://www.hpgchamber.org/
6. https://www.sovachamber.com/about-us/
7. https://www.visithpg.com/attractions/los-tios-taqueria/
8. https://www.visithpg.com/attractions/manna-colombian-bakery/
9. https://mamasaidshutyomouf.com/
10. https://stylesandbeyond.com/
11. https://www.progress-index.com/story/business/2025/05/05/hopewell-new-restaurant-serves-authentic-mexican-central-american-italian-cuisines-family-owned/83385000007/
