# Kinfolk Current Delete Review → Delete Queue

Source-only correction based on production release source `c07aa1406734e89f539ffa32fde0a5363b8aa338`, on `fix/kinfolk-current-delete-queue-release`.

## Founder controls

- **Delete Queue** is a separate reachable Admin folder, alongside Archive, Duplicate, Permanently Closed, and Kinfolk Current Delete Review.
- **Move selected to Delete Queue** and the individual-row move action work directly from Kinfolk Current Delete Review. The review-screen request fails closed if any selected record is no longer queued for that review.
- Moving preserves the record and audit evidence, immediately archives/suspends it and disables promotion. It starts a fresh **168-hour** retention period, not a deletion schedule.
- Nothing auto-deletes, including existing legacy deletion holds. Both legacy worker entry points are now inert and perform no database queries or timers.
- **Remove hold — keep non-public** returns the retained record only to Archive/Duplicate/Permanently Closed classification; it does not restore discovery.
- Only an active, nonpublic, resolved, eligible Delete Queue entry can be permanently deleted, via a **separate typed `DELETE N BUSINESS(ES)` confirmation**. The server checks both the eligibility timestamp and seven full days since queue entry under row locks. Protected foreign-key failures roll the entire operation back.

## Evidence and review safeguards

The transfer cancels any legacy automatic hold with its immutable cancellation receipt, retains the original review row, original listing state, verification evidence, source manifest, and queued events, and appends an immutable transfer event. The review enters the distinct `transferred_to_delete_queue` state before the approved lifecycle change. Neither original queued-review trigger is weakened or bypassed.

**Restore exact prior state** still selects only `state = 'queued'` reviews and restores their exact saved listing status, status, promotion eligibility, featured flag, and promotion expiry. Transferred records cannot fall back through that restore path.

Verifier parsing, approved manifest fingerprints, serializable apply, identity/link/current-catalog rechecks, active-social preservation, and immutable website cleanup/review audit receipts remain unchanged. New queue events and original queue evidence/retention clocks are protected against mutation. Queue and deletion audit receipts survive business deletion; source-cohort receipts are snapshotted before their existing explicit removal. No additional linked relationship is removed.

Schema helpers are additive and invoked only by explicit queue mutations, not startup or a backfill. No database, staging, production, deployment, push, merge, or mobile-build operation was performed during this correction. Dependencies were installed locally with lifecycle scripts disabled.

## Validation

- Required web suite: **2 files, 8 tests passed**; `pnpm typecheck` passed.
- Required API suite: **5 files, 70 tests passed**, including database-free execution of the actual dedicated handlers with fake SQL clients.
- `git diff --check` passed.
- API `pnpm typecheck` was run and remains blocked by **19 pre-existing release diagnostics**: 17 stale `pausedAt` declaration errors in `routes/kinfolk.ts`, and unresolved `expo-secure-store` / `dotenv` imports in `routes/kinfolk-intelligence.ts` / `scripts/seed-manus-cultural-sites.ts`. An in-memory TypeScript comparison against untouched `c07aa14` sources produced the same 19 diagnostics and **zero introduced diagnostics**. Unrelated source and tracked generated declarations were not changed to hide these failures.
- One stale ownership assertion in the required inventory suite was aligned with the already-deployed **Black-owned** member-facing label; public copy and documentary ownership labels were not changed.

This is not a deployment or a production-data repair. The live founder UI does not change until a separately authorized release.
