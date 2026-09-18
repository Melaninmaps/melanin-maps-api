# African-American Chamber PA/NJ/DE directory — deep expansion pass 2

## Scope and method

This pass searched the publicly accessible [Active Member Directory](https://membership.aachamber.com/list), including its alphabetic `FindStartsWith` pages and category search pages. I also opened individual GrowthZone member profiles and retained exact profile URLs. The directory exposes alphabetic navigation and categories including Finance, Health Care, Legal, Home Health Care, Restaurants, Shopping & Specialty Retail, Arts/Culture/Entertainment, Construction, and Non-Profit. This is a research expansion and **not a claim that any business is currently live**.

## Included records

The pass produced **4 unique substantiated candidates**. Each retained physical commercial listing has a name, street address, city/state/country, category, exact Chamber profile URL, and an official customer-facing website shown on that profile. Regulated services were classified as `regulated_review`; no ownership identity was inferred from Chamber membership.

| Candidate | Location | Category | Evidence |
|---|---|---|---|
| ComproTax Philadelhia | 1618 Cecil B. Moore Ave, 1st fl, Philadelphia, PA 19121 | Finance / tax preparation | [Chamber profile](https://membership.aachamber.com/list/Details/comprotax-philadelhia-4890688); profile publishes `comprotaxphiladelphia.com` and describes professional tax service. |
| The Smile Aisle Dental Group | 150 Lawrenceville-Pennington Road, Suite 7, Lawrence Township, NJ 08648 | Health Care / dental practice | [Chamber profile](https://membership.aachamber.com/list/Details/the-smile-aisle-dental-group-4885172); profile publishes `smileaisledental.com` and describes a dental practice. |
| Trifecta Comprehensive Care Services LLC | 1515 Market Street, Suite 1200, Philadelphia, PA 19102 | Home Health Care / health care | [Chamber profile](https://membership.aachamber.com/list/Details/trifecta-comprehensive-care-services-llc-4888550); profile publishes HomeWell destination `homewellcares.com/pa199` and describes in-home care. |
| Tucker Law Group, LLC | Ten Penn Center, 1801 Market Street, Suite 2500, Philadelphia, PA 19103 | Legal Services / legal | [Chamber profile](https://membership.aachamber.com/list/Details/tucker-law-group-llc-4888826); profile publishes `tlgattorneys.com`. |

## Sources searched and counts

The starting directory page was searched directly: [membership.aachamber.com/list](https://membership.aachamber.com/list). Alphabetic pages were searched for A–Z member names, and category endpoints were checked for Restaurants, Shopping & Specialty Retail, Business & Professional Services, Arts/Culture/Entertainment, Health & Wellness, and Non-Profit. The crawl surfaced approximately 379 unique member profile URLs across those pages, with repeated links caused by profile-card markup and overlap among alphabetic/category results. A targeted review of Philadelphia and southeastern Pennsylvania-relevant profiles yielded 4 unique records meeting the evidence policy.

## Exclusions and limitations

Most directory members were excluded because they were government agencies, schools, foundations, banks, large corporations, chamber or civic organizations, individuals, or listings lacking a first-party customer-facing website/social destination. Additional exclusions included profiles whose address or destination could not be reliably extracted during the accessible session, and businesses outside the requested Philadelphia/southeastern Pennsylvania emphasis. Houses of worship were not promoted into commercial candidates. Chamber membership alone was not treated as ownership evidence, so every `ownershipDesignations` array is empty and `ownershipEvidence` is null. No database/API was used. The directory and profile pages are dynamic GrowthZone pages; repeated requests intermittently timed out, so this pass may not exhaust every paginated/category result. No claims are made about current operating status, licensing, insurance, availability, hours, accessibility, or ownership.
