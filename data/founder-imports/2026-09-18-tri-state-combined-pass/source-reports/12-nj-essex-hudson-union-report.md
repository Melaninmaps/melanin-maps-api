# North Jersey urban corridor expansion pass 2: Essex, Hudson, Union

**Scope and status.** This is a research expansion, not a claim that any business is live, open, available, insured, licensed, accessible, or currently operating. The file preserves exact public source pages and first-party customer destinations where available. Chamber membership is not treated as ownership evidence.

## Sources searched

| Source | Exact page | Result |
|---|---|---|
| Greater Union Township Chamber member directory | [https://unionchamber.com/member-directory/char/T/](https://unionchamber.com/member-directory/char/T/) | Public directory; the T page exposed 19 entries, of which 10 met the address/official-destination threshold or were retained for clearly flagged manual review. |
| Essex County Latino American Chamber of Commerce business directory | [https://eclacc.org/businesses/](https://eclacc.org/businesses/) | Six visible businesses, with linked detail pages. Four were retained as `manual_review` because the public pages did not publish a street address; individual Latino ownership was not inferred. |
| ECLACC homepage | [https://eclacc.org/](https://eclacc.org/) | Confirms the chamber mission and public business-directory link; not used as a customer destination. |
| North Jersey Alumnae Chapter Delta Sigma Theta Black-Owned Business Directory | [https://www.northjerseydeltas.org/black-owned-business-directory](https://www.northjerseydeltas.org/black-owned-business-directory) | 15 businesses reported by the page, but the accessible listing exposed no street addresses and only business websites. Not imported as physical candidates; online-only import was not justified without explicit online-retail/service basis. |
| NewarkHappening Newark Black-Owned Business Guide | [https://www.newarkhappening.com/things-to-do/newark-black-owned-business-guide/](https://www.newarkhappening.com/things-to-do/newark-black-owned-business-guide/) | Guide page was accessible, but the rendered page did not expose a reliable set of named businesses with street addresses and official destinations. No records imported. |
| NJ In Color BIPOC directory | [https://njincolor.com/bipoc-business-directory](https://njincolor.com/bipoc-business-directory) | Public BIPOC directory was reviewed. Accessible entries were largely outside the four-county target or lacked street-level addresses; no defensible in-scope physical records imported. |
| Hudson County Chamber / Jersey City directory | [https://www.hudsonchamber.org/jersey-city-business-directory/](https://www.hudsonchamber.org/jersey-city-business-directory/) | Page rendered only a marathon directory shell, not usable member records. No Hudson candidates imported. |

## Candidate counts

The JSONL contains **14 records**: 5 `business`, 5 `regulated_review`, and 4 `manual_review`.

Machine count: **14 total**: Union chamber rows 1–10 plus ECLACC rows 11–14. Union rows include 5 regulated-review and 5 business; ECLACC rows are 4 manual-review. Ownership arrays are empty for Union chamber records. ECLACC rows carry a chamber-context designation only with an explicit caveat that it is not individual ownership evidence.

## Exclusions and gaps

The Delta directory’s “Load More” control did not expose additional rows through the accessible page extraction, and its visible records lacked addresses. NewarkHappening’s guide was editorial and dynamically rendered; the extracted page did not provide a dependable address-and-official-destination pair for named businesses. The Hudson chamber page was a marketing shell rather than a usable directory export. ECLACC detail pages often contained only a name, category, and external link (and in one case a phone), so those entries remain manual review rather than physical listings. Union chamber entries are valid public directory candidates but contain no Black/Latino ownership claim; no identity, language, or ethnicity was inferred from names or contacts.

## Data handling notes

No database, API, map coordinates, or generic Google page was used. Official customer destinations are first-party websites or the official Instagram URL explicitly linked by the chamber. The unusual `The Halal Guys` address is retained exactly as published (“2317 Halal Guys”) and flagged for verification. ECLACC’s chamber-context language is not sufficient to establish ownership for any particular business.
