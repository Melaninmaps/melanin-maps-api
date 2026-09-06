# Founder directory master — review-only bundle

This directory contains the September 4, 2026 social-expanded founder master and its governed review evidence.

The CSV has **18,052 physical lines**: one header plus **18,051 candidate records**. The earlier file had 17,916 physical lines: one header plus 17,915 candidate records. These values are candidate counts, not a claim that every row is an ordinary business or already published.

The normalized manifest classifies all 18,051 candidates into the correct review destination: 7,509 business candidates, 8,086 community resources, 2,296 regulated-profession reviews, 116 manual reviews, and 44 internal-only records. It contains 18,050 unique dedupe keys because two rows share one key.

The link evidence covers 7,455 unique website, social, and provenance URLs. Candidates with broken, timed-out, unresolved, or unchecked links are held in `needs_research`. Regulated professions, explicit ownership evidence, internal/manual records, in-batch duplicates, and all known production-record reconciliation candidates are also held.

`pnpm --filter @workspace/scripts stage-directory-import` is dry-run-only by default and makes **zero publication writes**. The explicit `--apply` option writes only to `directory_import_batches` and `directory_import_candidates`; it cannot publish to `businesses`, `resources`, or `community_resources`. Applying this bundle requires an authenticated non-production staging database and a separate reviewed publication workflow.

Use `sha256sum -c SHA256SUMS` from this directory to verify the canonical artifacts before staging.
