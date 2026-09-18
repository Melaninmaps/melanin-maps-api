# SHCCNJ Business Link Member-Profile Verification Report

| Metric | Count |
|---|---:|
| Original profile-derived rows before correction | 301 |
| Retained in current tri-state candidate input | 209 |
| Held in correction ledger | 92 |
| Retained — business | 188 |
| Retained — regulated review | 2 |
| Retained — online business | 0 |

## Correction applied

A source pass audit found that some public SHCCNJ profiles contained a numbered street address and service category but did **not** publish an individual customer-facing website or social destination. Those rows cannot provide the external link the directory promises to members, so they were moved intact to the correction ledger rather than treated as publishable candidates. New York records were also moved from this Philadelphia tri-state batch to the ledger for a future, geographically appropriate New York pass. No candidate was deleted.

| Hold reason | Count |
|---|---:|
| missing direct customer destination | 85 |
| outside tri state scope | 7 |

## Source and coverage

The public source is the [Statewide Hispanic Chamber of Commerce of New Jersey Business Link directory][1]. The earlier collection discovered 385 profile URLs through the public root, alphabetic listings, category listings, and individual member-profile pages under /list/member/. The current candidate file keeps only individually sourced tri-state records with a direct customer destination. The source URL remains the individual member profile for each retained row.

This is **research-only** input. It has not been staged to a database, published to the web or mobile app, placed on a map, or supplied to live Kinfolk recommendations. The correction ledger retains records for a follow-up official-website/social sweep; a held record is not a finding that the organization has closed.

## Files

The corrected candidate file is `04-02-shccnj-member-profiles-verified-candidates.jsonl`. The preserved correction ledger is `04-02-shccnj-member-profiles-verified-held.jsonl`.

## References

[1]: https://business.shccnj.org/list "Statewide Hispanic Chamber of Commerce of New Jersey Business Link Directory"
