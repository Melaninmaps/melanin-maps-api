# Source pass 09 — Mapping with Melanin: Delaware Alliance of Latino Entrepreneurs directory

**Territory:** Delaware statewide
**Source family:** Delaware Alliance of Latino Entrepreneurs (DALE), operated through La Plaza Delaware
**Collection date:** 2026-09-18
**Result:** 0 retained candidates

## Actual source URLs used

1. [DALE English homepage](https://daledelaware.org/en/home/) — confirmed that DALE presents a public business-directory link and describes the directory as member listings.
2. [DALE public directory](https://daledelaware.org/directory/) — primary listing source. The static extraction exposed a directory interface with “Search,” “Search by category,” an initial alphabetical slice, and a **More** control. The visible slice included listings from “1st State Concrete LLC” through “Calderon Market LLC,” with public fragment IDs such as `#!biz/id/6499c105f6c2832b3234a646`.
3. [DALE directory WordPress REST page record](https://daledelaware.org/wp-json/wp/v2/pages/786) — verified that the directory page is a WordPress page whose content invokes the dynamic `[mw open="!directory"]` interface; it did not expose listing records, addresses, or official destinations.
4. [Representative public detail fragment](https://daledelaware.org/directory/#!biz/id/6499c105f6c2832b3234a646) — opened through the public URL and the English variant. Both returned the directory shell/listing slice rather than a server-rendered detail record.
5. [DALE English directory/detail fragment](https://daledelaware.org/en/directory/#!biz/id/6499c105f6c2832b3234a646) — opened as a cross-check; same shell/listing response.

## Pages and ranges traversed

The homepage was opened first, followed by the public directory page. The directory’s initial alphabetical range was traversed in the extracted page content from **1st State Concrete LLC** through **Calderon Market LLC** (approximately 60 visible listing names). A representative detail fragment was then opened, including the fragment ID for 1st State Concrete LLC, and the English-language equivalent was tested. The WordPress REST representation of page 786 was also opened to identify the dynamic-directory implementation. The browser navigation loaded the directory shell and displayed “Loading…”, but a subsequent stateful browser view reset to `about:blank`; no dynamic detail payload became available for verification. No pagination range beyond the initial visible slice could be reliably traversed, and no category-filter results could be reliably opened.

## Candidate counts

| Target kind | Count | Notes |
|---|---:|---|
| `business` | 0 | The directory exposed names and fragment links, but not verifiable exact street addresses plus independently opened current official websites/social destinations in the accessible pass. |
| `community_resource` | 0 | No houses of worship, community centers, libraries, mutual-aid, food-support, family/parent, elder/disability, education/training, funeral, shelter, civic-support, or local-nonprofit records were exposed with the required address and official-destination evidence. |
| `cultural_place` | 0 | No qualifying cultural/heritage records were exposed with the required evidence. |
| `online_business` | 0 | No online-only candidate was retained because no official customer destination was independently opened. |
| **Total** | **0** | Empty JSONL is intentional; no data was invented. |

## Omissions and blocks

The public directory is a JavaScript/dynamic interface. Static fetches and text extraction exposed only the directory shell and an initial alphabetical listing slice; the WordPress REST endpoint exposed only the shortcode, not the underlying records. The representative `#!biz/id/...` links did not server-render the selected business detail in the available browser/fetch path. The stateful browser initially showed the dynamic directory loading, but the follow-up browser view returned `about:blank`, so the listing data and detail fields could not be inspected reliably. Consequently, the pass could not establish exact public street addresses, current official websites or official social destinations, phones, hours, or category details for any displayed listing. Search-result snippets were not used as evidence, and no coordinates were inferred. The visible names were not promoted into candidate rows because doing so would violate the required address and independently opened official-destination criteria.

The source homepage describes DALE membership as a network of local Latino-owned and operated businesses. This supports only the source-specific voluntary designation and was not used to infer any individual identity, ethnicity, language, ownership beyond the source’s own designation, licensing, accessibility, hours, or service claims.

The required candidate file is intentionally empty: `09-dale-candidates.jsonl`.
