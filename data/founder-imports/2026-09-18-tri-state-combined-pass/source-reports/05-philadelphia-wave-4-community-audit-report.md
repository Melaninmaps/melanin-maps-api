# Philadelphia Source Wave 4 Audit

## Result

The source wave collected **1469** public-source records. After enforcing the data contract and removing exact repeated records within this wave, **536** records remain eligible for a later cross-source comparison against the existing tri-state package. This is **not** a publication list. The records have not been written to a database, made visible in the website or mobile app, placed on a map, or sent to Kinfolk.

The audit kept identity claims out of record fields. Community-focused directories provide lead and source context, but the entries do not receive a demographic designation without business-specific, voluntary published evidence.

| Outcome | Count |
|---|---:|
| Public-source records collected | 1469 |
| Structurally eligible before within-wave deduplication | 538 |
| Eligible after within-wave exact deduplication | 536 |
| Exact repeats removed within eligible rows | 2 |
| Held: missing address, source, or direct customer destination | 77 |
| Held: general-directory lead requiring individual community evidence | 854 |

## Quality controls

A physical record requires a numbered address and a direct customer-facing website or official social link. Online-only records require a service geography and direct customer destination but are never assigned fabricated coordinates. Directory homepages, directory social accounts, and Google Maps links are not treated as a business destination. This audit moved records that used those links to a follow-up ledger. It also segregated records found through general supplier or chamber directories, because the directory’s general membership alone does not establish the requested community-specific sourcing.

The next step is deterministic cross-source deduplication against the prior tri-state package, followed by current destination checks for only the new unique customer links. Regulated services stay in their governed review lane.

## Eligible composition

| Target type | Eligible count |
|---|---:|
| business | 453 |
| community_resource | 26 |
| cultural_place | 19 |
| online_business | 2 |
| regulated_review | 36 |

## Files

The candidate input for the next comparison is wave-4-ready-for-cross-source-consolidation.jsonl. The audit also retains separate ledgers for records with incomplete map/customer-destination evidence and records from general directories that need individual community evidence. The eligible-file checksum is 10852c43f565797d156f0a7b5e21ce4b17ab7779e2cab63f23e2b9a279c43f83.
