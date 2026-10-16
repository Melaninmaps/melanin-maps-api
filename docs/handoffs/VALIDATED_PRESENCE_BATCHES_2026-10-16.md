# Validated Presence Batch Workflow — October 16, 2026

## User-authorized input and policy

- **Authoritative upload:** `/home/ubuntu/upload/UPLOADNOW_VALIDATED_WEBSITE_OR_SOCIAL_COMBINED(1).csv`
- **Record count:** 5,453 unique `(business_name, city, state)` rows; no duplicate identity triples within the upload.
- **User direction:** process only in **review-first batches of 50**, do not interfere with other tasks, do not run a sandbox bulk operation, and do not make any data changes until a future per-batch confirmation.
- **First-batch ownership policy selected by the user:** use only rows explicitly designated **Black / African American-Owned**, **Latino / Hispanic-Owned**, or both. Hold every row that says only **Minority-Owned**.
- **Archive expectation:** uploaded businesses may be in Archive. A confirmed exact match restores its audited prior public lifecycle when available (with `live_unclaimed` only as the safe fallback), and is explicitly kept outside Kinfolk Current so that it appears in **Non-Kinfolk Current**. No automatic Kinfolk Current promotion.

## Uploaded CSV facts

Columns:

`original_row_number`, `business_name`, `city`, `state`, `address`, `phone`, `category`, `authorized_ownership_status`, `authorized_ownership_basis`, `authorized_ownership_source_name`, `authorized_ownership_source_evidence`, `qualifying_presence_type`, `qualifying_urls`, `validation_route`, `validation_tier`, `business_name_evidence`, `location_evidence`, `source_url`, `audit_caveat`.

Summary:

- 2,025 explicitly `Black / African American-Owned`
- 43 explicitly `Latino / Hispanic-Owned`
- 8 explicitly both Black / African American-Owned and Latino / Hispanic-Owned
- 3,377 `Minority-Owned` rows — **held**, not converted into Black-owned or any other designation
- 4,676 records have nonempty `authorized_ownership_source_evidence`
- 739 have a phone value; 1,216 have an address value
- Presence: 4,663 `website`, 487 `website; social`, 303 `social`
- 2,318 have multiple qualifying URLs
- No `email` column exists. The new flow must not create, infer, or scrape emails in bulk. A future individual field update may only store an email visibly published by the matched business’s official site.

## Existing product capability and limitation

The live Admin component `artifacts/web/src/components/KinfolkCurrentProfileEnrichment.tsx` accepts reviewed enrichment manifests of 1–100 records, so 50 is inside the current bound. It safely covers only:

- description, hours, phone, tags
- website
- official social links

It deliberately blocks ownership, email, lifecycle, and Kinfolk membership changes. It also rejects archived records; `non_kinfolk_current_all` expands only to `live_unclaimed`, `live_claimed`, and `staged` records, not Archive.

Relevant server policy:

- `artifacts/api-server/src/businesses/kinfolkCurrentProfileEnrichment.ts`
- `artifacts/api-server/src/routes/businesses.ts` function `applyProfileEnrichmentManifest`
- `artifacts/api-server/src/businesses/adminBusinessProfilePolicy.ts`

The admin profile policy already supports audited ownership updates with an `ownershipReceipt` and a `sourceReceipts` entry whose field is `ownership`. It validates that ownership labels have a receipt. Existing field receipts and profile audit tables are reused by the future feature.

## Required new isolated feature

Build a new Admin **Validated Presence Batch** surface and API, without a migration, worker, or automatic runner:

1. The browser reads the supplied CSV locally and sends no more than 50 explicit-ownership rows to a **preview** endpoint.
2. Preview performs exact normalized `name + city + state` matching against existing businesses and returns match state, archive state, conflicts, proposed website/social/phone/ownership changes, and retained source receipts. It writes nothing.
3. It rejects ambiguous matches, duplicates, Delete Queue records, Kinfolk Current Delete Review records, ownership mismatches, and substantive existing website/contact conflicts. These become skips for manual review.
4. Apply accepts only a previewed fingerprint with a typed confirmation, re-locks/rechecks every record, applies only safe missing/identical URL/social/phone fields, applies only the explicit allowed ownership designations with their receipts, restores a matched archived row to its prior public lifecycle (or `live_unclaimed` only when no valid prior state is retained), and writes/updates the Kinfolk catalog membership state to `removed`. `removed` is required rather than `intake`: it explicitly excludes an otherwise eligible record from Kinfolk Current so the record lands in Non-Kinfolk Current.
5. Apply must use one transaction per record, create profile-field and profile-edit audit records, listing lifecycle audit records, and Kinfolk catalog audit events. It must return per-record applied/skipped results and never create a record or overwrite a non-equivalent current value.
6. Keep uploaded CSV files out of Git and production storage. No background process or sandbox bulk execution.
7. No production deploy or production data execution is authorized yet.

## Current isolated implementation location

- Worktree: `/home/ubuntu/work/melanin-maps-validated-presence-batches`
- Branch: `feat/validated-presence-batches`
- Base commit: `0bde5a16a1361c8438827f90054960a6579f1aeb`
- Worktree was clean immediately after creation.

## Source implementation — unreleased / no records applied

- **Browser-only CSV control:** `artifacts/web/src/components/ValidatedPresenceBatch.tsx` reads the selected CSV locally, filters only the three authorized explicit ownership values, holds `Minority-Owned`, paginates the remaining rows into slices of 50, and does not upload the CSV file.
- **Preview-only API:** `POST /api/admin/businesses/validated-presence-batch/preview` exact-matches the existing retained record by normalized business name, city, and state. It reports safe proposed changes and skips ambiguity, duplicates, active Delete Queue records, Kinfolk Current Delete Review records, permanently retained/closed records, legacy terminal lifecycle states even when archived, nonpublic lifecycle records, and material website/social/phone conflicts.
- **Explicit apply gate:** `POST /api/admin/businesses/validated-presence-batch/apply` requires the unchanged preview fingerprint and a typed dynamic confirmation such as `APPLY 50 VALIDATED PRESENCE RECORDS`. It re-reads and locks every ready record inside an individual serializable transaction. A changed record is safely skipped rather than overwritten.
- **Bounded writes only:** apply can fill only missing website, supported official-social, phone, and explicit ownership-designation fields. It writes existing profile-field, ownership, profile-edit, listing-lifecycle, and Kinfolk catalog audit receipts. It creates no business and accepts no email field.
- **Archive and catalog behavior:** an archive record restores only to its retained prior live state (safe `live_unclaimed` fallback), while catalog state `removed` explicitly prevents it from appearing in Kinfolk Current. The dashboard returns an applied batch to the **Non-Kinfolk Current** filtered inventory.
- **No release or data execution:** this is source work only. No CSV row has been sent to production, no production business record has been changed, and no deployment, migration, worker, or sandbox bulk run is part of this feature.

## Focused source evidence

- API Vitest: 71 focused tests passed (validated-batch policy/routes, terminal archived-state guard, catalog route, Delete Queue, inventory, and public-discovery guards).
- Web Vitest: 18 focused tests passed (validated-batch surface plus current Kinfolk/Delete Queue/enrichment controls).
- `git diff --check` passed before commit.
- API and Web full typechecks remain blocked by pre-existing unrelated workspace definition/dependency errors outside this change; no error from the new validated-presence files was reported.

## Diagnostics note

The Webdev MCP configuration reported no active bound Webdev project, so no post-edit LSP configuration could be applied there. Use repository TypeScript checks and focused Vitest contracts.
