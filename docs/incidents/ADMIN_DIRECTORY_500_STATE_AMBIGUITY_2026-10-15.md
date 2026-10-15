# Production incident: Admin directory load failure

**Detected:** 2026-10-15 13:35 UTC
**Status:** source correction prepared; production deployment not yet authorized
**Scope:** `/api/admin/businesses` only

## Observed member-facing behavior

The production administrator's **Businesses** dashboard section displayed zero inventory rows only because its data request failed. The UI accurately presented:

> Could not load Businesses. Failed to fetch businesses

It did **not** silently convert the failure into a valid empty directory.

## Verified evidence

- Railway Production API service `a77b49bb-e448-4be8-9d02-de7a3b43136b` was online with no staged changes.
- Production deployment `18f22628-f05f-461d-84aa-46e03b2c786f` is serving source commit `4be3cf33e2100b3b8c41a38b355bdedbdff93aa3` (`fix: hold business deletions for seven days`).
- Authenticated production browser request `GET /api/admin/businesses` returned HTTP 500 repeatedly.
- Production log entries identify PostgreSQL error code `42702`: `column reference "state" is ambiguous`.
- The same production observation window returned HTTP 200 for the public map-pin endpoint and for existing individual business detail endpoints. This is evidence of an Admin-listing query failure, not an Admin-authorized deletion of the directory.

## Root cause

Commit `4be3cf33` added a `LEFT JOIN business_deletion_holds deletion_hold` to the Admin inventory query and projected `deletion_hold.state`.

The query still selected the business location column as an unqualified `state`. PostgreSQL therefore could not determine whether `state` meant `businesses.state` or `deletion_hold.state`, so it rejected the entire Admin inventory query before any rows or totals were returned.

This is a query-name collision. It does not delete, archive, alter, or otherwise mutate business records.

## Narrow correction

The hotfix changes only the projection from:

```sql
..., city, state, verified, ...
```

to:

```sql
..., city, businesses.state AS state, verified, ...
```

A focused regression assertion verifies that this qualification remains present whenever the deletion-hold join and hold-state projection exist.

## Explicit non-scope

- No business data, directory eligibility, ownership labels, map pins, records, accounts, or provider credentials were changed.
- No database migration is required for this correction.
- The independent `/api/community-impact/:userId` production error (`column "status" does not exist`) was observed in the same log window but is unrelated and excluded from this narrow directory hotfix.
- The production deployment remains pending explicit approval after source validation and review.

## Source validation

- `pnpm exec vitest run src/__tests__/admin-business-inventory-controls.test.ts` — **passed: 39/39 tests**.
- `git diff --check` — **passed** (no whitespace errors).
- API TypeScript was also run. It reports 17 existing `pausedAt` diagnostics in `src/routes/kinfolk.ts`; the same source mismatch is already present at deployed base `4be3cf33`. The hotfix does not touch that route or the related schema, and TypeScript reported no diagnostic in `src/routes/admin.ts`.

## Release boundary

This candidate is deliberately limited to:

1. qualifying `businesses.state` in the Admin inventory projection;
2. one targeted regression contract; and
3. this incident record.

It contains **no migration** and no record mutation. A fresh authenticated production `GET /api/admin/businesses` should be used to verify the corrected query after, and only after, explicit deployment approval.
