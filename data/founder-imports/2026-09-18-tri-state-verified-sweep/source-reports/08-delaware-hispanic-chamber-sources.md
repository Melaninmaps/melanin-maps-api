# Delaware Hispanic Chamber Member Directory — Source Pass

## Scope and source access

This pass used the public [Delaware Hispanic Chamber of Commerce member directory](https://www.hchamber.org/member-directory) for Delaware statewide collection. The directory page publicly loads member data through the chamber widget endpoint `https://auth.chamberwidgets.com/cn-api/org/mms/mms_members`, queried with `org_id=DEHC`, blank keyword/city/ZIP/category filters, and `limit=5000`. The response exposed **251 member records**. The directory page itself identifies the chamber and its public directory, while the API response supplied the listing fields used for candidate screening.

Actual source URLs used:

1. `https://www.hchamber.org/` — chamber home page and source-family context.
2. `https://www.hchamber.org/member-directory` — public member-directory page.
3. `https://auth.chamberwidgets.com/cn-api/org/mms/mms_members` — public directory data request with `org_id=DEHC`; all 251 returned records were reviewed for Delaware location, exact address, and a chamber-listed destination.
4. Each retained candidate's chamber-published official website or social destination was independently opened with an HTTP request. The candidate JSONL records preserve the checked destination in `notes.official_destination_checked`.

## Traversal and verification

The member-directory page was opened and its embedded public widget configuration was inspected. The all-record request covered the full returned result set rather than relying on visible first-page snippets. The response contained 251 records; 113 Delaware records had a non-empty exact street-style address and a chamber-listed website or social destination suitable for opening. Each of those 113 destinations was independently requested. **104 candidates** were retained after destination checks returned a live, non-error response and the address was not a PO Box. Eight destination-bearing records were omitted because their official destination did not independently open successfully, and one was omitted because the address was a PO Box. Pennsylvania, Maryland, Texas, and other non-Delaware records were excluded from this Delaware statewide pass.

The chamber's directory includes individual memberships and records with incomplete addresses or no official destination. Those records were not invented or retained as physical map candidates. Coordinates were not used or generated. Chamber ownership/member context was not converted into an inferred ethnic, gender, language, accessibility, licensing, or service claim.

## Candidate counts

| Target kind | Count |
|---|---:|
| `business` | 101 |
| `community_resource` | 2 |
| `cultural_place` | 1 |
| `online_business` | 0 |
| **Total retained** | **104** |

The retained community-resource records are Delmarva Digital Learning Association (education/training) and Corbit-Calloway Memorial Library (library). Club de Danza Quetzalli is retained separately as a cultural place because the chamber-published name/keywords describe Mexican folkloric dance and cultural preservation. Amanecer Counseling & Resource Center was retained as a regulated-review business/service record, not as an inferred community-resource designation; its `regulatedProfession` is `regulated_review`.

Business category counts among the 101 business rows are: professional services (45), other services (30), food and beverage (19), arts, culture, and education (4), home services (2), and business services (1). Community-resource categories are education and training (1) and library (1); the cultural-place category is cultural dance (1). The exact per-row category values are in the JSONL file. No online-only rows were retained.

## Omissions and limitations

The API response exposed many members without a public exact street address, without a current official website/social destination, or both; these were omitted because the requested physical-candidate minimum could not be met. PO Box-only addresses were omitted because they do not provide a physical map pin. A destination was treated as independently checked only when it returned a live non-error response; directory URLs that redirected to access-denied pages or failed were omitted. The chamber directory does not establish license validity, current business operation beyond the checked public destination, ownership identity, ethnicity, language, hours, accessibility, or service claims. Potential duplicate names/addresses were not discarded solely for that possibility; the row-level evidence summaries flag comparison by business/address where relevant.

The source directory is dynamic and may change after this pass. No production system was accessed and no live data was published.

## Output

Candidate JSONL: `../source-passes/08-delaware-hispanic-chamber-candidates.jsonl`

Each line uses exactly the requested keys, unique integer `sourceRow` values, and a JSON-string `notes` object containing `description`, `public_hours`, `languages`, `specialties`, `evidence_summary`, and `official_destination_checked`.
