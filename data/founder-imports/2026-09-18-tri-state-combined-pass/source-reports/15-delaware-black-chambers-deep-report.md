# Delaware Black Chambers and Community Directories Deep Research Report

**Pass:** 15 — Delaware Black chambers, Wilmington-area Black business, and statewide community directories. This is research expansion, not a claim that any candidate is currently live.

## Sources searched

1. [Delaware Black Chamber of Commerce](https://debcc.org/) — reviewed the public home page, contact information, mission, news, and navigation. The public pages describe the chamber and its support role but did not expose a usable public member directory with individual customer destinations; chamber membership alone was not treated as ownership evidence.
2. [Southern Delaware Alliance for Racial Justice Black-Owned Business Directory](https://sdarj.org/directory-of-black-owned-businesses-in-southern-delaware/) — reviewed the full rendered directory and linked first-party destinations. The page publishes category sections and a downloadable PDF/XLSX, but only entries with a usable street address plus official website/social destination were accepted as physical candidates.
3. [DelawareBlack.com Black Directory](https://delawareblack.com/black-directory) — reviewed category counts, first rendered page, pagination links, and listing cards. The directory reports 202 listings across categories and 11 pages. Only listings with an explicit official customer destination were retained; listings lacking address were treated as online/service or community candidates, not mapped physical businesses.
4. [Delaware Today Black-owned business roundup](https://delawaretoday.com/life-style/black-owned-businesses/) — reviewed all named businesses and linked first-party sites/social posts. The article explicitly frames the businesses as Black-owned and supplies addresses for most entries.

## Results

The candidate file contains **32 JSONL records**. Counts by target kind: **business 20; online_business 5; regulated_review 4; community_resource 1; cultural_place 2**. No map coordinates were created.

Ownership evidence is source-based only: Delaware Today explicitly labels the roundup as Black-owned businesses; SDARJ labels its page a directory of Black-owned businesses; DelawareBlack.com is a Black-business/community directory and its individual listing pages supply the category and destination. No ownership was inferred from names, neighborhoods, or chamber membership.

## Exclusions and limitations

Many SDARJ entries were excluded because they had no street address and no official customer-facing website/social destination, or only a PO box/email. Several DelawareBlack listings were excluded because the first rendered page provided no address or official destination, or because the listing was an event, generic organization, or duplicate. Health, medical, cosmetology/cosmetic-procedure, youth instruction, and similar regulated or potentially regulated services were routed to `regulated_review`; no license, insurance, availability, or service scope was inferred. Churches and museums were treated as `cultural_place` or `community_resource`, not ordinary businesses.

The Delaware Black Chamber public site was accessible, but its public pages did not provide a browsable member directory in the retrieved content. DelawareBlack pagination links were visible, but the fetch returned the first page; deeper pages were not machine-retrieved in this pass, so the resulting list is conservative rather than exhaustive. Some directory links are third-party ordering/profile destinations (for example Clover or MDVIP); they were retained only where the source page clearly tied the destination to the named listing.
