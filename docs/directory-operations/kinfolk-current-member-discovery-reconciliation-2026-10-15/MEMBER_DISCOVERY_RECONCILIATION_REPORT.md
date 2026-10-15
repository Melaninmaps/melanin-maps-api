# Kinfolk Current Member-Discovery Reconciliation — 2026-10-15

## Purpose and release boundary

This record closes the **source and evidence-preparation** phase for the instruction:

> A Kinfolk Current business with no confirmed qualifying official website or official social presence must be removed from member discovery, placed in an auditable seven-day restoration window, and then permanently deleted only if it is not restored.

This work does **not** change production data, create a mobile build, or claim that an unverified candidate URL is official. It prepares a bounded, reviewable release candidate and exact, immutable application batches.

## Evidence decision rule

A record is retained only where the evidence establishes at least one current, identity-matched, official source:

1. an active official website; or
2. an active official Instagram, TikTok, Facebook, X/Twitter, YouTube, or Pinterest profile.

A timeout, robots/CAPTCHA block, generic directory page, marketplace, search-result page, ambiguous candidate URL, or a social profile not directly matched to the business identity **does not count** as qualifying public presence. A record with any of those outcomes is routed to Delete Review—not silently retained and not immediately destroyed.

## Deterministic source crosswalk

| Outcome | Records | Handling |
|---|---:|---|
| Directly confirmed current official website | 3,047 | Retain in member discovery |
| Directly confirmed current official social profile | 559 | Retain in member discovery |
| Stored link reconfirmed by a fresh direct check | 11 | Retain in member discovery |
| No confirmed qualifying official presence after retained evidence and current discovery reconciliation | 3,295 | Place in Delete Review through the exact registered manifests |
| Total reconciled Kinfolk Current source cohort | 7,571 | No record is omitted from the crosswalk |

The `3,295` Delete Review population is partitioned into **seven immutable batches**: six 500-record batches and one 295-record batch. Their fingerprints are registered in the server release candidate; a substituted browser upload is rejected.

## Required release behavior

The candidate now enforces all of the following together:

1. **Immediate public removal:** A queued record is staged/suspended and excluded from the `public.public_businesses` discovery boundary.
2. **Member-query closure:** Kinfolk, recommendation, Journey, travel-planner, map, signals, city, community, Hidden Gem, Knowledge, Smart Pathways, and personalized discovery queries use `public.public_businesses` or the shared `isMemberDiscoverableBusiness` predicate. A queued record cannot remain visible through a secondary member-facing feature.
3. **Seven-day reversible hold:** The same transaction creates an audited `business_deletion_holds` record with a fixed seven-day deadline, immutable review evidence, and a deletion-hold event.
4. **Restore before expiry:** The dedicated Delete Review restore control cancels the hold and restores the exact prior listing state; it does not alter ownership, identity, contacts, source receipts, or evidence.
5. **Automatic finalization after expiry:** Only a hold created for this exact Delete Review reason may finalize the queued record. The worker copies the original business, cohort receipt, hold snapshot, and queued-review evidence into immutable permanent-deletion audit records before removal.
6. **Safe failure:** Missing or protected linked data blocks final deletion and leaves the record archived/recoverable. Generic lifecycle updates and permanent-deletion scheduling remain blocked for queued records.

## Exact execution sequence after separately approved deployment

1. Deploy only the reviewed source candidate and verify `/api/readyz`.
2. Verify the live Admin **Businesses → Kinfolk Current Delete Review** section loads with authenticated Safari-safe transport.
3. Upload and apply one exact registered batch manifest at a time. The server re-locks each record and skips changed identities or links.
4. Verify each queued batch is absent from public directory, Kinfolk/recommendation results, map/name lookup, community mention selection, and member-facing city counts.
5. Leave the queued records restorable for seven calendar days. A founder can use the dedicated restore control during this window.
6. Confirm the service worker processes the due holds, and verify immutable audit receipts for completed or blocked finalizations.

## Validation completed in the source workspace

- API focused regressions: **21 passed** across Delete Review, permanent-deletion hold, public-discovery removal, and member-discovery visibility contracts.
- Reconciliation and manifest-script regressions: **6 passed**.
- All seven generated manifests parse against the server manifest validator.
- `git diff --check`: passed.
- API repository typecheck remains blocked by **17 pre-existing `kinfolk_private_memories.pausedAt` schema/type mismatches** in `routes/kinfolk.ts`; none originate in this reconciliation’s changed files.

## Evidence retention and storage

- `summary.json` retains the compact deterministic totals.
- Exact registered batch manifests remain in this folder for controlled Admin application.
- Large raw reconciliation decisions and the generated candidate set are retained in a compressed receipt archive. The archive checksum is recorded beside it after archival.
- Receipt archive: `complete-reconciliation-receipts.tar.gz` — SHA-256 `2194b9da0d96cbfac70df57f7f5b7f87f2094a53ca90b241347b0cfa76352b92`.
- No production record is modified by this documentation or evidence preparation.

## Explicit non-claims

- No inactive/no-presence business has been permanently deleted by this source work.
- No candidate source was promoted merely because it appeared in a search engine.
- No migration, provider activation, live import, mobile build, or unrelated directory cleanup is part of this candidate.
