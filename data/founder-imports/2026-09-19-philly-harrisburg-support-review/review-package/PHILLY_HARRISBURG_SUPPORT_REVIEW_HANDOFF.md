# Philadelphia and Harrisburg Support Directory Review Handoff

**Status:** Protected review only. **Not published.**
**Package date:** September 19, 2026
**Scope:** Philadelphia caregiver, cancer-information, recovery, grief, nutrition, older-adult, faith, and family supports; Harrisburg reentry, education, employment, social, cultural, family, music, dining, and nightlife options.

## What this package contains

This package contains **65 source-backed candidates** for a later protected directory review. It is designed to strengthen ordinary local discovery without making a clinical referral, an eligibility decision, an availability statement, a safety claim, or a statement about any individual member.

| Review measure | Count |
|---|---:|
| Total review candidates | 65 |
| Preliminary `pending_review` candidates | 61 |
| `needs_research` candidates after destination checks | 4 |
| Carried source leads held before packaging | 19 |
| Community resources | 40 |
| Cultural places | 13 |
| Regulated-review records | 7 |
| Businesses | 5 |
| Unique customer destinations checked | 85 |
| Reachable destinations | 81 |
| Network errors | 1 |
| Timeouts | 2 |
| Review-required destinations | 1 |

The package manifest is `philly-harrisburg-support-combined-review-only-candidates.jsonl`. Its SHA-256 checksum is:

```text
978b849284bfe69fcc9c47a016bbec1e39a4f4308976a346b143302c253e4efd
```

The source-consolidated manifest SHA-256 is `3e7061a3a8f7bc7c38768203397ec3792d707afab5c21ea8e912fc15033e47c1`. The separate 19-record source-held file has SHA-256 `8c86be27da6d0a11ce3fe077df65af1d9ba2cca42708f888aa21a818f4192001`.

## Review boundaries

The candidate manifest contains a physical address and a customer-facing public destination for every retained record. The **5 business** records may proceed only to later protected duplicate reconciliation, address review, controlled server-side geocoding, and approval before a map pin could exist. The **7 regulated-review** records require appropriate authority or licensing review and may not be treated as verified clinical, legal, or other professional services merely because a source page was found. Community resources and cultural places remain outside the commercial map-pin route unless the protected review policy explicitly authorizes a different presentation.

The four records whose destination checks produced a network error, timeout, or review-required result are marked `needs_research` within the review manifest. They are not evidence that a business or service is closed. They must remain held until a reviewer confirms a current official customer destination. The three raw source passes also preserved 19 leads in `philly-harrisburg-support-source-held-candidates.jsonl`; those leads are excluded from the candidate manifest and must never be bulk published.

The shared `dcls.org` destination is documented as a review collision because it represents three distinct Harrisburg library branches. Each branch has a different physical address and was retained as a distinct candidate. A reviewer must preserve that branch distinction during staging rather than collapsing them solely because the public website is shared.

## Required protected review sequence

First, verify the manifest checksum exactly against the value above. Stage only `philly-harrisburg-support-combined-review-only-candidates.jsonl` in the isolated directory-review database. Do not point the staging process at the live business table.

Next, reconcile every candidate against current production listings by normalized name, address, and official customer destination. Preserve existing listings and audit history. Resolve the three shared-library branch records by their individual location addresses. Do not delete, overwrite, or suppress a live listing merely because a similar research record exists.

Then, keep the four `needs_research` records and all 19 source-held leads out of publication. Route regulated-review records through the protected authority review. Permit only separately approved physical business records to receive controlled server-side geocoding. Online or mapless records must never receive invented locations or map pins.

Finally, use the existing single-concurrency receipt-backed publication worker. Record the manifest checksum, staging receipt, duplicate-resolution decisions, geocoding result where applicable, published IDs, and held reasons. After any approved publication, verify exact-name search, locality/relevance ordering, business detail routing, official customer links, map-pin detail click-through for approved physical businesses, and authenticated Kinfolk retrieval. Publication is complete only after those live checks pass.

## Source evidence

The detailed evidence ledgers, reviewed source URLs, inclusion decisions, and limitations are retained in the three source reports:

- `../source-reports/philly-caregiver-health-faith-support.md`
- `../source-reports/harrisburg-reentry-education-employment.md`
- `../source-reports/harrisburg-social-nightlife-everyday.md`

These materials support research provenance only. They do not establish current capacity, insurance acceptance, prices, language access, hours, clinical suitability, safety, sobriety, cultural affiliation, ownership, licensing, or service availability for a particular person.

## References

[1]: https://www.phila.gov/ "City of Philadelphia — Official website"
[2]: https://www.dauphincounty.gov/ "Dauphin County — Official website"
[3]: https://www.harrisburgpa.gov/ "City of Harrisburg — Official website"
