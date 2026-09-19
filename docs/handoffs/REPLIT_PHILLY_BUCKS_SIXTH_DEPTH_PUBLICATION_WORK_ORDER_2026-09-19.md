# Replit Work Order: Publish the Philadelphia and Bucks County Sixth-Depth Directory Batch

**Author:** Manus AI
**Date:** 2026-09-19
**Status:** Ready for checksum-pinned staging and automated publication after the isolated review and publisher components are deployed. This document does **not** claim that any record is live yet.

## Required result

Replit must publish the eligible portion of this **Philadelphia and Bucks County** batch through the isolated review database and production publisher. The founder must **not** approve rows one by one. The system must automatically deduplicate, link exact existing listings, create only policy-qualified new listings, and show only exceptions to the founder.

This data release does **not** require an Android or iOS build. Once the protected publisher has written the eligible records to production and the public API confirms them, current web and mobile clients can search them, show eligible physical listings on the map, open official links, and make them available to Kinfolk’s existing business retrieval. A later native build is needed only for separate app-code changes, not for ordinary directory data publication.

> **Publication boundary:** A GitHub merge means the source package is available to the application team. It does not mean that a website has deployed, records have been staged, or businesses have been published. Replit must produce production receipts before describing any count as live.

## Exact package to stage

| Item | Value |
|---|---|
| Package root | `data/founder-imports/2026-09-19-philly-bucks-sixth-depth-review/` |
| Review manifest | `review-package/philly-bucks-sixth-depth-combined-review-only-candidates.jsonl` |
| Manifest SHA-256 | `2a5ffcbe9f9470fc602b0f916127801e9099cbcb4a41323b76bd2bdab288ba88` |
| Review candidates | 80 |
| Raw research leads | 85 candidates plus 7 held leads |
| Cross-pass duplicates removed | 3 |
| Incomplete raw rows held | 2 |
| Address-backed candidates | 75 |
| Unique official customer destinations checked | 100 |
| Destination-health outcomes | 95 reachable, 2 network errors, 2 review-required, 1 timeout |

The manifest has passed JSONL parsing, checksum, dedupe-key uniqueness, target-routing, PA/United States scope, coordinate exclusion, literal-`"null"` exclusion, commercial-address eligibility, online-maplessness, provenance, and stale-label checks. The validation command is:

```bash
node scripts/validate-philly-bucks-sixth-depth-review-package.mjs \
  data/founder-imports/2026-09-19-philly-bucks-sixth-depth-review
```

## Automated routing required

| Route | Batch count | Required automated action |
|---|---:|---|
| `business` | 17 | Reconcile against production by exact normalized identity. If no exact existing listing is found, verify the numbered address and active official customer destination, then create one unclaimed, unverified business. Geocode only after that address check passes. |
| `online_business` | 1 | Create or link only if its official customer destination remains valid. Preserve `address = null` and create **no map pin**. |
| `community_resource` | 27 | Send only through the resource route. Do not insert these into `businesses` and do not make a map pin unless the resource policy later permits a separately reviewed physical location. |
| `cultural_place` | 27 | Hold as exceptions for the cultural-place route. Do not bulk-create them as ordinary businesses. |
| `regulated_review` | 8 | Hold as exceptions. Do not bulk-create alcohol, firearms-related, or any other regulated records without the required authority or licensing review. |
| Destination-health exceptions | 5 candidates | Hold for recheck. The 2 network errors, 2 review-required responses, and 1 timeout are review signals, not evidence that a business closed. |

The live-database reconciliation must run **again at publication time**. A match by name and city alone is not sufficient. Replit must link exact existing listings instead of creating a duplicate, preserve all existing data and references, and write immutable provenance and a receipt.

## Replit execution sequence

Replit must follow this order without substituting the general Businesses screen or the legacy local-only import route.

1. Merge and deploy the code that implements the separate review database, protected review ingress, production outbox/inbox publisher, duplicate-resolution report, and exception-only founder view described in the automated reconciliation handoff.[1]
2. Provision the separate `DIRECTORY_REVIEW_DATABASE_URL` in the hosting platform settings. It must identify a different database from `DATABASE_URL`. Preserve the current production application database, user accounts, credentials, sessions, waitlist, Community, payments, and live listings unchanged.
3. Run the production reconciliation in dry-run mode. It must identify only exact duplicate groups, produce a reversible report, and never delete an existing business. Resolve exact duplicate groups before inserting this batch.
4. Submit **only** the manifest above to the authenticated isolated review ingress with the exact SHA-256 above. Reject the batch if the checksum, expected 80-record count, source shape, or destination-health attachment differs.
5. Run deterministic routing and create immutable outbox commands. The founder does not need to open individual candidates. The system should automatically process only the policy-qualified physical and online-business paths, create/link resources only through their separate route, and retain cultural, regulated, duplicate-ambiguous, and destination-health exceptions.
6. Run the publisher with concurrency `1` until the batch report proves that idempotency, exact live-dedupe, map-pin handling, and official links work correctly. Each command must receive a production receipt before it is considered complete.
7. Verify public API behavior after receipts exist: exact-name search, relevant-category search, local Philadelphia/Bucks search, typo clarification, business-detail official links, physical-map pin click-through, mapless online behavior, and authenticated Kinfolk business retrieval. Do not report live totals until those checks pass.

## Founder's current business list

Do **not** clear or archive the repeated rows shown in the current Businesses screen before the reconciliation report and publication receipts exist. A repeated name can be a real branch or an incomplete record. After a receipt links or supersedes an exact duplicate, the public-query layer should hide the superseded record and resolve an old detail link to the canonical listing without deleting it. The founder should then see only a concise batch report and exceptions list rather than hundreds of manual approval rows.

## Explicit safeguards

Replit must not enable `DIRECTORY_IMPORT_LOCAL_STAGING` in production, point the legacy review route at the production database, bulk-insert this JSONL directly into `businesses`, or create coordinates such as `(0,0)`. It must not alter authentication, reset-password, tester temporary-password prompts, user records, accounts, sessions, approval behavior, waitlist behavior, Community, DMs, circles, saves, profile settings, business-owner flows, Kinfolk feedback, Library, payment surfaces, or native release settings.

## Required delivery report

Replit must return a batch report with the exact production counts for received, deduplicated, linked-existing, new businesses created, resources created or linked, map pins created, online-only records created, cultural exceptions, regulated exceptions, destination-health exceptions, failed commands, and retried commands. It must attach the manifest SHA-256, reconciliation report, and immutable command/receipt IDs. It must distinguish **staged**, **linked**, **published**, and **held** from one another.

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api/blob/main/docs/handoffs/REPLIT_AUTOMATED_DIRECTORY_RECONCILIATION_AND_PUBLICATION_2026-09-19.md "Automated directory reconciliation and publication handoff"
[2]: https://github.com/Melaninmaps/melanin-maps-api/blob/main/docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md "Source-backed inventory publication runbook"
