# Source report: Virginia Hispanic Chamber member directory

## Source and scope

**Source family:** Virginia Hispanic Chamber member directory, powered by Chamber Nation/DocuTeam. The chamber's public directory landing page is [https://www.vahcc.com/member-directory](https://www.vahcc.com/member-directory). The chamber homepage [https://www.vahcc.com/](https://www.vahcc.com/) was also inspected to confirm the directory link and Central Virginia context. The embedded public directory configuration identifies organization `VHCC` and exposes member data through the public Chamber Nation member-directory service. Individual listing/profile destinations were represented by the public Chamber Nation member profile URL pattern `https://www.chamberorganizer.com/members/directory/membershow.php?mid={member_id}&org_id=VHCC`; the directory API records were inspected for every returned member and profile URLs were retained per record.

The collection targeted Richmond metro and Central Virginia cities/suburbs published by the directory. The unfiltered public member request returned 167 records, including records outside the target geography and non-business/community entries. No guessed pages or hidden pagination were used: the directory's embedded JavaScript was inspected, and its documented `limit=5000` alphabetical/all-member request was used to retrieve the available returned set in one public request. The directory landing page itself states “Member Directory” and the chamber footer identifies Central Virginia, Northern Virginia & Hampton Roads.

## Processing and outputs

A total of **58 candidate rows** were retained in `source-passes/10-va-hispanic-chamber-candidates.jsonl`. A total of **109 held rows** were written to `held/10-va-hispanic-chamber-held.jsonl`. Held records include missing numbered street address, missing direct official website, regulated-service classification, and/or community/nonprofit/education/government classification. The candidate file retains only records with a published business name, target-area Virginia city, numbered street address, and a direct official website URL supplied in the member record. Directory URLs and chamber social accounts were not used as customer destinations. No ownership designation was inferred from chamber membership or the directory's Hispanic focus.

Candidate rows use the contract's `business` target kind. The directory category is retained as the factual category/subcategory, and published service/category terms are placed in `servicesSearchTerms`. Regulated services such as legal, insurance, financial, health, and real-estate/housing entries were held for regulated review rather than treated as ordinary business candidates. Community organizations, schools, museums, nonprofits, government entities, and similar records were held rather than mapped as ordinary businesses.

## Public evidence and limitations

The source provides member-entered business names, addresses, phones, categories, descriptions, and in many cases website URLs. The public directory is evidence of a chamber member listing, not proof of business ownership, Hispanic/Latino ownership, operating status, service quality, or customer destination validity. The directory's member profile endpoint was technically inaccessible to the text fetcher in this environment (the public API and embedded directory code remained accessible), so profile URLs are retained as the specific individual listing destinations while fields were sourced from the same public directory service. Official destinations were not independently verified beyond being published as URLs in the public member records; later reconciliation should verify reachability and ownership of each destination. No production database was written, no form was submitted, and nothing was published.

## Exact source URLs

- [https://www.vahcc.com/](https://www.vahcc.com/)
- [https://www.vahcc.com/member-directory](https://www.vahcc.com/member-directory)
- Public directory service: `https://auth.chamberwidgets.com/cn-api/org/mms/mms_members` with public `org_id=VHCC` request parameters.
- Individual profile URL pattern: `https://www.chamberorganizer.com/members/directory/membershow.php?mid={member_id}&org_id=VHCC`.

**Counts:** candidates 58; held 109.

**Limitation:** The directory is a lead source only; its public API returned mixed geographies and community/regulated records, and the text fetcher could not render individual Chamber Nation profile pages, so all candidates require downstream destination, duplicate, and business-status verification.

## Files

- Candidate JSONL: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-midatlantic-source-wave-2/source-passes/10-va-hispanic-chamber-candidates.jsonl`
- Held JSONL: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-midatlantic-source-wave-2/held/10-va-hispanic-chamber-held.jsonl`
- This report: `/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-18-midatlantic-source-wave-2/source-reports/10-va-hispanic-chamber-report.md`

## Collection note

The directory was inspected at collection time on 2026-09-18. The API response is a time-sensitive public snapshot; member records, URLs, categories, and availability may change.
