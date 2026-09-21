# MWM Inventory Cohort Receipt Preview

**Status:** Preview complete. **No source records were staged, published, hidden, deleted, or edited.**

## Purpose

This release adds read-only scripts that create a traceable inventory receipt before any directory action is allowed. The first-launch MWM Core rule is deliberately narrow: a record must have a traceable source that explicitly confirms **Black/African American or Latino/a/x/Hispanic ownership or designation**. It does not infer a business owner’s identity from a name, cuisine, language, neighborhood, or image.

The receipt is designed for the product’s **Green Book meets AI** model. It protects the distinction between source-backed mission evidence and an unsupported assumption. Generic “minority-owned,” BIPOC, diaspora, Indigenous, Caribbean, LGBTQIA+, faith, and woman-owned labels are retained but held unless a qualifying first-launch designation is also supplied. It also preserves every existing record and its history.

## Exact Preview Results

The offline preflight read **33 signed review-only manifests** containing **6,576 source rows**. Under the approved Black/African American and Latino/a/x/Hispanic-only rule, it produced a deterministic root receipt hash of `c2105d31ab2a9d71f9aefae58441d2cd6a6ac6d1c28c6581c5bbcb821e73ef01`.

| Preview cohort | Count | Meaning |
|---|---:|---|
| `mwm_source_backed_candidate` | 1,406 | A physical or online business record with explicit approved MWM Core evidence, a traceable source directory, and no remaining address or destination hold. This is **not published**. |
| `hold_mission_evidence_required` | 4,915 | The source row lacks an explicit Black/African American or Latino/a/x/Hispanic designation. It must not be presented as an MWM Core listing without stronger evidence. |
| `hold_directory_evidence_required` | 230 | The record has explicit approved evidence but lacks another requirement, such as a usable customer destination, address, or regulated-profession review. |
| `hold_invalid_source` | 25 | The source row lacks a minimally usable identity and needs repair before further review. |

The prior separate read-only reconciliation downloaded every currently public listing from the live API and generated one receipt for each of **2,879** records. Its historical root receipt hash was `407499fe792dc6738fd48d7bd292158f9da55c5a1bc3caca20594f505e4ddbb9`. It must be re-run using the narrowed v2 source receipt before any MWM Core visibility activation.

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

1. **Candidate rule:** only an explicit, traceable Black/African American or Latino/a/x/Hispanic designation is sufficient for the first MWM Core cohort when the business has a usable customer destination and passes the existing address, deduplication, regulated-profession, and safety checks.
2. **Held records:** the 4,915 records with no qualifying first-launch evidence remain retained and held for later evidence or a separately approved cohort. The 230 incomplete records and 25 invalid records remain held as well.
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

The deployed schema includes an observation-only receipt table. The following command is deliberately separate and requires the exact verified source receipt hash and live count. It only records the current classification. It cannot publish, hide, delete, or alter a business.

```bash
node scripts/apply-inventory-cohort-receipts.mjs \
  --apply \
  --source-receipts /secure/reports/mwm-source-cohort.jsonl \
  --expected-live-count 2879 \
  --expected-source-root-hash c2105d31ab2a9d71f9aefae58441d2cd6a6ac6d1c28c6581c5bbcb821e73ef01
```

The receipt scripts intentionally have no `--publish`, `--stage`, or visibility-switch flag. Staging and publication remain in the separately authenticated directory-review flow.

## Non-Regression Contract

This work is additive. It does not remove accounts, authentication, business records, owner claims, reviews, comments, media, Community posts, map pins, Library entries, Kinfolk links, or directory history. It does not enable a worker or change any current search result. It creates only proof artifacts for the next governed decision.

## References

[1]: https://api.melaninmaps.com/api/businesses?limit=200 "Mapping with Melanin public business inventory endpoint"
[2]: https://github.com/Melaninmaps/melanin-maps-api "Mapping with Melanin source repository"
