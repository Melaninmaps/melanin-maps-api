# Complete All-Business Duplicate Audit

## What this corrected audit answers

The earlier Duke-only output was not sufficient for the requested task. This corrected audit examines the full export of **2,736 business rows** and identifies duplicate groups across the entire file.

## Results

| Classification | Groups/rows | Recommended action |
|---|---:|---|
| High-confidence duplicate groups | **17 groups** | Mark **110 rows** as duplicates and retain one canonical row per group. |
| Same-name records requiring human review | **4 groups / 8 rows** | Do not auto-delete yet; compare sources or verify locations. |
| Rows after automatic deduplication | **2,626 rows** | Use this as the safe, automatically cleaned working file. |

The **110 automatic removals include the 93 excess Duke’s Cafe rows**, plus 17 additional duplicate rows from other businesses. The eight manual-review rows are not included in the automatic removal count because they have the same or very similar names but different addresses or materially different coordinates; they may be separate locations.

## Automatic duplicate groups

| Business/group | Records found | Remove | Keep one |
|---|---:|---:|---:|
| Duke’s Cafe | 94 | 93 | 1 |
| Shiloh Baptist Church | 3 | 2 | 1 |
| Greater Allen A.M.E. Cathedral | 2 | 1 | 1 |
| National Center for Civil and Human Rights | 2 | 1 | 1 |
| CARECEN — Central American Resource Center | 2 | 1 | 1 |
| People’s Community Clinic — Austin | 2 | 1 | 1 |
| Simply Wholesome | 2 | 1 | 1 |
| Masjid Al-Jamia Philadelphia | 2 | 1 | 1 |
| Ethiopian Orthodox Tewahedo Church | 2 | 1 | 1 |
| DuSable Black History Museum and Education Center | 2 | 1 | 1 |
| APEX Museum | 2 | 1 | 1 |
| Legacy Museum — Equal Justice Initiative | 2 | 1 | 1 |
| Harold & Belle’s Restaurant | 2 | 1 | 1 |
| First Baptist Church Montgomery | 2 | 1 | 1 |
| National Civil Rights Museum at the Lorraine Motel | 2 | 1 | 1 |
| National Memorial for Peace and Justice | 2 | 1 | 1 |
| National Museum of African American History and Culture | 2 | 1 | 1 |

The attached `all_duplicate_decisions_final.csv` is the authoritative row-level decision file. Rows marked `REMOVE_DUPLICATE_AUTO` are the 110 records Replit should remove from active results. Rows marked `KEEP_CANONICAL` are the records to retain.

## Manual review cases

These eight rows share a normalized name and city/state but have different location evidence. They should not be blindly merged because they could represent separate locations or inaccurate geocoding.

| Business | Records | Why review is needed |
|---|---:|---|
| Busy Bee Cafe/Café, Atlanta | 2 | Same address text but coordinates differ materially. |
| Mrs. White’s Golden Rule Cafe/Café, Phoenix | 2 | One says Downtown Phoenix; the other gives 808 E Jefferson St, with different coordinates. |
| Roscoe’s House of Chicken & Waffles, Los Angeles | 2 | 1514 N Gower St and 1518 N Gower St may be separate or neighboring listings. |
| Scotchies Jerk Centre, Kingston | 2 | Different addresses and coordinates. |

## Replit instruction

Replit should not claim that all remaining records are verified legitimate; this is a duplicate audit. It should first back up the database, run the duplicate decision file, soft-mark the 110 automatic duplicates with `duplicate_of_id`, exclude them from active search results, and preserve the original IDs for rollback. The eight manual-review rows must remain visible in a review queue until a person confirms whether each pair is one business or multiple locations.

For future searches, Replit must normalize names, accents, punctuation, parenthetical labels, and city suffixes. It must compute a deduplication key before insertion, upsert rather than blind-insert, and catch high-confidence naming variants when the location is identical. It must never merge same-name businesses at different locations without review. It must preserve the source provider, source URL, query, retrieval time, and provider record ID.

## Corrected deliverables

`all_duplicate_decisions_final.csv` contains every affected row across all duplicate groups. `duplicate_group_summary_final.csv` summarizes the automatic groups. `mwm_businesses_auto_deduplicated_final.csv` removes only the 110 high-confidence duplicates. `replit_business_dedup.ts` now includes same-location naming-variant protection. `replit_deduplicate_businesses.sql` provides the database-side soft-deduplication pattern.
