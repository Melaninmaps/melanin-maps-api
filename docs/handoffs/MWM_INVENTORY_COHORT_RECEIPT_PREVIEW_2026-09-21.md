# MWM Inventory Cohort Receipt Preview

**Status:** Preview complete. **No source records were staged, published, hidden, deleted, or edited.**

## Purpose

This release adds two read-only scripts that create a traceable inventory receipt before any directory action is allowed. The purpose is to distinguish records that have explicit, source-backed evidence for the Mapping with Melanin mission from records that need more evidence or are simply outside the currently supplied research packages. It does not infer a business owner’s identity from a name, cuisine, language, neighborhood, or image.

The receipt is designed for the product’s **Green Book meets AI** model. It protects the distinction between an explicit, source-backed diaspora designation and an unsupported assumption. It also preserves every existing record and its history while an eligibility policy is chosen.

## Exact Preview Results

The offline preflight read **33 signed review-only manifests** containing **6,576 source rows**. It produced a deterministic root receipt hash of `43aa767bc709b02b0d027fc91b45bbd8714de996eb7faa8dd34851ad7d08fcff`.

| Preview cohort | Count | Meaning |
|---|---:|---|
| `mwm_source_backed_candidate` | 1,411 | A physical or online business record with an explicit qualifying designation, a traceable source directory, and no remaining address or destination hold. This is **not published**. |
| `hold_mission_evidence_required` | 4,901 | The source row lacks an explicit qualifying designation. It must not be presented as an MWM mission-aligned listing without stronger ownership or inclusion evidence. |
| `hold_directory_evidence_required` | 239 | The record has an explicit qualifying designation but lacks another requirement, such as a usable customer destination, address, or regulated-profession review. |
| `hold_invalid_source` | 25 | The source row lacks a minimally usable identity and needs repair before further review. |

The separate read-only reconciliation downloaded every currently public listing from the live API and generated one receipt for each of **2,879** records. Its root receipt hash is `407499fe792dc6738fd48d7bd292158f9da55c5a1bc3caca20594f505e4ddbb9`.

| Current live cohort | Count | What the count proves—and does not prove |
|---|---:|---|
| `source_backed_mwm_candidate_live` | 111 | A unique name/city/state match to a current source-backed MWM candidate receipt. It does not prove who entered the original record. |
| `source_backed_held_live` | 278 | A unique match to a source row that the current receipt holds from automatic future publication. |
| `ambiguous_source_match_live` | 62 | More than one source row shares the same normalized name, city, and state. These are not automatically classified. |
| `legacy_or_unattributed_live` | 2,428 | No unique match exists in the current 6,576-row package. These may be historical seeds, community submissions, owner-created records, or another import. They must not be silently hidden. |

> **Important:** The 2,428 count is not a claim that those records are unwanted or were not added by MWM. It only means the current signed package cannot uniquely prove their source. The existing database needs an operator-approved receipt migration before a visibility rule can safely act on that classification.

## What the Scripts Do

`scripts/generate-inventory-cohort-receipts.mjs` reads the committed review-only manifests and writes a receipt for each source row. It has no API call, database connection, staging request, or publication capability.

`scripts/reconcile-live-inventory-cohorts.mjs` reads the first receipt and performs read-only pagination against the public business endpoint. It produces exactly one local receipt for every current public record. It does not authenticate, submit data, alter visibility, or invoke the publication worker.

Both scripts use deterministic hashing, so re-running them against the same inputs produces the same receipt root after excluding the timestamp field.

## Required Decision Before Any Publication

No one should enable the publication worker or mass-publish from this preview. The next decision is a written launch-cohort rule:

1. **Candidate rule:** confirm that an explicit, traceable Black, Latino/Hispanic, Indigenous, Caribbean, diaspora, or other product-approved designation is sufficient for the first MWM cohort when the business has a usable customer destination and passes the existing address, deduplication, regulated-profession, and safety checks.
2. **Held records:** confirm that the 4,901 records with no explicit designation remain private in the review database until a permitted source supplies the needed evidence. The 239 incomplete records and 25 invalid records remain held as well.
3. **Existing live records:** decide separately whether the current 2,879 records should continue to be visible during the migration. The safe default is **yes**: preserve them and show no cohort badge until a full source receipt is available.
4. **Activation:** only after the rule is approved should the team stage the selected checksum-pinned batch into the isolated review database, verify row receipts, resolve duplicates automatically, and enable exactly one worker for the approved cohort. A dry-run receipt must be reviewed before the worker is enabled.

## Commands

Generate the offline source receipt from a clean checkout:

```bash
node scripts/generate-inventory-cohort-receipts.mjs \
  --out /secure/reports/mwm-source-cohort.jsonl \
  --summary /secure/reports/mwm-source-cohort-summary.json
```

Reconcile the visible catalog without modifying it:

```bash
node scripts/reconcile-live-inventory-cohorts.mjs \
  --receipts /secure/reports/mwm-source-cohort.jsonl \
  --out /secure/reports/mwm-live-cohort-reconciliation.json
```

The release scripts intentionally have no `--publish`, `--stage`, or visibility-switch flag. Staging and publication remain in the separately authenticated directory-review flow.

## Non-Regression Contract

This work is additive. It does not remove accounts, authentication, business records, owner claims, reviews, comments, media, Community posts, map pins, Library entries, Kinfolk links, or directory history. It does not enable a worker or change any current search result. It creates only proof artifacts for the next governed decision.

## References

[1]: https://api.melaninmaps.com/api/businesses?limit=200 "Mapping with Melanin public business inventory endpoint"
[2]: https://github.com/Melaninmaps/melanin-maps-api "Mapping with Melanin source repository"
