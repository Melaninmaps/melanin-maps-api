# Richmond Hispanic Chamber source pass

## Scope and method

This pass used the public **Virginia Hispanic Chamber (VAHCC) member directory** as the starting source, filtered to Richmond with the directory’s 75-mile default. Candidate facts were retained only when the public chamber card, the linked VAHCC Products & Services Guide, or a first-party customer-facing site published the required destination and location details. No database/API was used and nothing was published.

## Results

| Count | Result |
|---:|---|
| 4 | Candidate records written |
| 2 | Business records |
| 1 | Regulated-review record (dental) |
| 1 | Business record with explicit self-published ownership designation |
| 0 | Online-only candidates |
| 0 | Houses of worship/cultural places found in the inspected Richmond-filtered result set |

The JSONL contains **A Healthy Smile**, **ABConductores Hispano LLC**, **ARAZ Systems, LLC.**, and **ARAZ Fuel Systems**. A Healthy Smile is classified as `regulated_review` because it is a dental practice. The other three are physical businesses with published street addresses and customer-facing websites.

## Evidence and sources

The chamber directory page is [VAHCC Member Directory](https://www.vahcc.com/member-directory?cname=&search=&things_to_do=&city=Richmond&zip=&alpha=). The directory’s Richmond-filtered cards supplied the member context and, for several entries, descriptions and website/detail links. The linked public guide supplied the detailed ABConductores listing at [ABConductores Hispano LLC](https://docu.team/mtiodew/index.php?store=142858&v=lp), including 7206 Hull Street Road, phone 804-528-9200, official site, Facebook, and published driver-education services.

First-party verification came from [A Healthy Smile contact](https://ahealthysmile.dental/contact/), which publishes 2803 McRae Rd B2, North Chesterfield, VA 23235 and 804-320-2496; [ARAZ Systems computers page](https://arazsystems.com/computers-made-in-the-usa), which publishes 11 S. 12th Street Suite 117, Richmond, VA 23219 and 804-884-2729; and [ARAZ Fuel Systems](https://arazfuelsystems.com/), which publishes 11 S 12th St, Richmond, VA 23219, 804-884-2729, and its fueling services.

## Ownership and regulated-service handling

Chamber membership was not treated as ownership evidence. Only ARAZ Fuel Systems received an ownership designation, because its own site explicitly states that Caroline Caylor is a Hispanic women-owned business in fuel logistics. This is preserved as **self-published, not independently verified**. ABConductores’ Spanish-language service description was not converted into an ownership or identity claim. A Healthy Smile was not assigned an ownership designation.

## Exclusions, gaps, and accessibility limitations

The directory is dynamically loaded and its public text extraction initially exposed a loading state; browser rendering was required to inspect the cards. Detail-page requests from the chamber organizer domain returned a 406 response in this environment, so the report relied on the rendered public directory cards and accessible first-party/member-guide pages. The Richmond filter uses a 75-mile distance setting and therefore may include Greater Richmond-area entries beyond city limits; only entries with a clearly published Richmond-area location or explicit local description were retained. Members with no public street address and no accessible official customer destination were excluded. Generic chamber and chamber social pages were not used as customer destinations. Hours, licenses, insurance, availability, accessibility, and service breadth were not inferred beyond the cited published pages.
